import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import Stripe from 'stripe';

import { assertTenant } from '../lib/tenant';
import { env } from '../config/env';
import { getStripeClient } from '../lib/stripe';
import { metrics } from '../lib/metrics';
import { BillingService } from '../services/billingService';

const checkoutSchema = z.object({
  tier: z.enum(['STARTER', 'PROFESSIONAL', 'ENTERPRISE']),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
  customerEmail: z.string().email()
});

export default async function billingRoutes(app: FastifyInstance) {
  const billingService = new BillingService(app.prisma);

  app.post('/checkout', async (request, reply) => {
    const tenant = assertTenant(request, reply);
    const body = checkoutSchema.parse(request.body);

    const session = await billingService.createCheckoutSession({
      tier: body.tier,
      tenantId: tenant.tenantId,
      successUrl: body.successUrl,
      cancelUrl: body.cancelUrl,
      customerEmail: body.customerEmail
    });

    return reply.send(session);
  });

  app.post('/portal', async (request, reply) => {
    const tenant = assertTenant(request, reply);
    const schema = z.object({ customerId: z.string(), returnUrl: z.string().url() });
    const body = schema.parse(request.body);
    const subscription = await app.prisma.subscription.findFirst({
      where: { tenantId: tenant.tenantId }
    });

    if (!subscription) {
      return reply.status(404).send({ error: 'Subscription not found' });
    }

    if (!subscription.stripeCustomer) {
      return reply.status(403).send({ error: 'Stripe customer not linked for tenant' });
    }
    if (subscription.stripeCustomer !== body.customerId) {
      return reply.status(403).send({ error: 'Customer ID mismatch for tenant' });
    }

    const session = await billingService.createCustomerPortalSession(body.customerId, body.returnUrl);

    await app.prisma.auditLog.create({
      data: {
        tenantId: tenant.tenantId,
        category: 'billing',
        message: `Generated billing portal session for customer ${body.customerId}`
      }
    });

    return reply.send(session);
  });

  app.post(
    '/webhook',
    {
      config: {
        rawBody: true,
        rateLimit: {
          max: 100,
          timeWindow: '1 minute'
        }
      }
    },
    async (request, reply) => {
      const stripe = getStripeClient();
      const secret = env.STRIPE_WEBHOOK_SECRET;
      if (!stripe || !secret) {
        return reply.status(400).send({ error: 'Stripe webhook not configured' });
      }

      const rawBody = request.rawBody as string | undefined;
      const signature = request.headers['stripe-signature'] as string | undefined;
      if (!rawBody || !signature) {
        return reply.status(400).send({ error: 'Missing Stripe payload or signature' });
      }

      let event: Stripe.Event;
      try {
        event = stripe.webhooks.constructEvent(rawBody, signature, secret);
      } catch (error) {
        app.log.error({ err: error as Error, rawBody, signature }, 'Stripe signature validation failed');
        return reply.status(400).send({ error: 'Invalid Stripe signature' });
      }

      metrics.increment('stripe.webhook.received', { event_type: event.type });

      const existingLog = await app.prisma.auditLog.findFirst({
        where: {
          category: 'billing_webhook',
          message: { contains: event.id }
        }
      });

      if (existingLog) {
        app.log.info({ eventId: event.id }, 'Webhook already processed');
        return reply.send({ received: true, duplicate: true });
      }

      let tenantId: string | null = null;
      try {
        tenantId = await handleStripeEvent(app, event);
      } catch (error) {
        app.log.error(
          { err: error as Error, eventId: event.id, eventType: event.type },
          'Webhook processing failed'
        );
        return reply.status(500).send({ error: 'Processing failed', eventId: event.id });
      }

      if (tenantId) {
        await app.prisma.auditLog.create({
          data: {
            tenantId,
            category: 'billing_webhook',
            message: `Stripe event ${event.type}: ${event.id}`
          }
        });
      }

      metrics.increment('stripe.webhook.processed', {
        event_type: event.type,
        status: tenantId ? 'success' : 'ignored'
      });

      return reply.send({ received: true });
    }
  );
}

async function handleStripeEvent(app: FastifyInstance, event: Stripe.Event): Promise<string | null> {
  switch (event.type) {
    case 'customer.subscription.updated':
    case 'customer.subscription.created':
      return handleSubscriptionEvent(app, event.data.object as Stripe.Subscription);
    default:
      app.log.warn({ eventType: event.type }, 'Unhandled Stripe event type');
      return null;
  }

  // Future: publish to a webhook queue for async processing (retryable, decoupled).
}

async function handleSubscriptionEvent(app: FastifyInstance, subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string | undefined;
  if (!customerId) {
    app.log.error({ subscriptionId: subscription.id }, 'No customer on subscription');
    return null;
  }

  const priceId = subscription.items?.data?.[0]?.price?.id;
  if (!priceId) {
    app.log.warn({ subscriptionId: subscription.id }, 'No price ID found on subscription');
  }

  const targetSubscriptions = await app.prisma.subscription.findMany({
    where: { stripeCustomer: customerId }
  });

  if (targetSubscriptions.length === 0) {
    app.log.warn({ customerId, subscriptionId: subscription.id }, 'No local subscription for Stripe customer');
    return null;
  }

  const tier = priceId ? mapStripePriceToTier(priceId) : undefined;
  const status = mapStripeStatus(subscription.status);

  await app.prisma.subscription.updateMany({
    where: { stripeCustomer: customerId },
    data: {
      stripeSubId: subscription.id ?? undefined,
      status,
      tier: tier ?? undefined
    }
  });

  return targetSubscriptions[0].tenantId;
}

function mapStripeStatus(status?: string | null) {
  switch ((status ?? '').toLowerCase()) {
    case 'active':
      return 'ACTIVE';
    case 'past_due':
      return 'PAST_DUE';
    case 'canceled':
    case 'cancelled':
      return 'CANCELED';
    default:
      return undefined;
  }
}

function mapStripePriceToTier(priceId?: string) {
  if (!priceId) return undefined;
  if (priceId === env.STRIPE_STARTER_PRICE_ID) return 'STARTER';
  if (priceId === env.STRIPE_PROFESSIONAL_PRICE_ID) return 'PROFESSIONAL';
  if (priceId === env.STRIPE_ENTERPRISE_PRICE_ID) return 'ENTERPRISE';
  return undefined;
}

import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import Stripe from 'stripe';

import { assertTenant } from '../lib/tenant';
import { env } from '../config/env';
import { getStripeClient } from '../lib/stripe';
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

  app.post('/webhook', { config: { rawBody: true } }, async (request, reply) => {
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
      return reply.status(400).send({ error: 'Invalid Stripe signature' });
    }

    if (event.type.startsWith('customer.subscription')) {
      const payload = event.data.object as Stripe.Subscription;
      const normalizedStatus = (payload.status ?? '').toUpperCase();
      const allowedStatuses = ['ACTIVE', 'PAST_DUE', 'CANCELED'] as const;
      const status = allowedStatuses.includes(normalizedStatus as (typeof allowedStatuses)[number])
        ? (normalizedStatus as (typeof allowedStatuses)[number])
        : undefined;

      await app.prisma.subscription.updateMany({
        where: { stripeCustomer: payload.customer ?? undefined },
        data: {
          status,
          stripeSubId: payload.id ?? undefined
        }
      });
    }

    return reply.send({ received: true });
  });
}

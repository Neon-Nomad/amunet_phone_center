import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';

import { FastifyInstance } from 'fastify';

import { buildApp } from '../app';
import { env } from '../config/env';
import { createTwilioSignature } from '../lib/twilio';
import { createMockPrisma } from '../test-utils/mockPrisma';
import { createStripeSignature } from '../test-utils/stripe';
import Stripe from 'stripe';
import * as stripeLib from '../lib/stripe';

const axiosPost = vi.fn();

vi.mock('axios', () => ({
  default: {
    post: (...args: any[]) => axiosPost(...args)
  }
}));

describe('amunet platform flows', () => {
  let app: FastifyInstance;
  const context: { prisma: ReturnType<typeof createMockPrisma>; host: string } = {
    prisma: createMockPrisma(),
    host: 'api.test'
  };

  beforeEach(async () => {
    context.prisma = createMockPrisma();
    env.TWILIO_AUTH_TOKEN = 'twilio-secret';
    env.OPENAI_API_KEY = 'test-openai';
    env.STRIPE_STARTER_PRICE_ID = 'price_starter';
    env.STRIPE_PROFESSIONAL_PRICE_ID = 'price_professional';
    env.STRIPE_ENTERPRISE_PRICE_ID = 'price_enterprise';
    env.CALCOM_API_KEY = undefined;
    axiosPost.mockReset();
    axiosPost.mockImplementation(async (url: string) => {
      if (url.includes('openai')) {
        return {
          data: {
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    industry: 'wellness',
                    timezone: 'America/Los_Angeles',
                    keywords: ['spa', 'relaxation']
                  })
                }
              }
            ]
          }
        };
      }
      return { data: {} };
    });

    app = await buildApp({ prismaClient: context.prisma.client, logger: false });
  });

  afterEach(async () => {
    await app.close();
    stripeLib.setStripeClientForTesting(null);
    env.STRIPE_WEBHOOK_SECRET = undefined;
  });

  it('runs onboarding → telephony → booking E2E', async () => {
    const onboardingResponse = await app.inject({
      method: 'POST',
      url: '/api/onboarding/start',
      payload: {
        businessName: 'Serene Spa',
        email: 'owner@serenespa.com',
        tier: 'PROFESSIONAL'
      }
    });
    expect(onboardingResponse.statusCode).toBe(200);
    const onboardingBody = onboardingResponse.json();
    const tenantId = onboardingBody.tenantId;

    const voicePayload = {
      CallSid: 'CA12345',
      From: '+15551212',
      To: '+18883333',
      CallStatus: 'in-progress'
    };
    const voiceSignature = createTwilioSignature(
      `https://${context.host}/api/twilio/voice`,
      voicePayload
    );

    const voiceResult = await app.inject({
      method: 'POST',
      url: '/api/twilio/voice',
      headers: {
        'x-tenant-id': tenantId,
        host: context.host,
        'x-forwarded-proto': 'https',
        'x-twilio-signature': voiceSignature
      },
      payload: voicePayload
    });
    expect(voiceResult.statusCode).toBe(200);

    const statusPayload = {
      CallSid: 'CA12345',
      CallStatus: 'completed',
      CallDuration: '125'
    };
    const statusSignature = createTwilioSignature(
      `https://${context.host}/api/twilio/status`,
      statusPayload
    );

    const statusResult = await app.inject({
      method: 'POST',
      url: '/api/twilio/status',
      headers: {
        'x-tenant-id': tenantId,
        host: context.host,
        'x-forwarded-proto': 'https',
        'x-twilio-signature': statusSignature
      },
      payload: statusPayload
    });
    expect(statusResult.statusCode).toBe(200);

    env.CALCOM_API_KEY = 'calcom-secret';
    axiosPost.mockImplementation(async (url: string) => {
      if (url.includes('openai')) {
        return {
          data: {
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    industry: 'wellness',
                    timezone: 'America/Los_Angeles',
                    keywords: ['spa', 'relaxation']
                  })
                }
              }
            ]
          }
        };
      }
      if (url.includes('cal.com')) {
        return {
          data: {
            booking: {
              id: 'bk_123',
              cancellationLink: 'https://cal.com/cancel/bk_123'
            }
          }
        };
      }
      return { data: {} };
    });

    const bookingResult = await app.inject({
      method: 'POST',
      url: '/api/scheduling/book',
      headers: {
        'x-tenant-id': tenantId
      },
      payload: {
        eventType: 'demo',
        customerName: 'Ada Lovelace',
        customerEmail: 'ada@example.com',
        notes: 'Discuss AI agent options',
        startsAt: new Date().toISOString()
      }
    });
    expect(bookingResult.statusCode).toBe(200);
    const bookingBody = bookingResult.json();
    expect(bookingBody.status).toBe('confirmed');

    const store = context.prisma.store;
    expect(store.call).toHaveLength(1);
    expect(store.call[0]).toMatchObject({ providerSid: 'CA12345', duration: 125 });
    expect(store.subscription[0].meteredMinutes).toBeGreaterThan(0);
    expect(store.booking).toHaveLength(1);
    expect(store.auditLog.length).toBeGreaterThan(0);
  });

  it('enforces Twilio signature validation', async () => {
    const { client } = context.prisma;
    await client.tenant.create({ data: { id: 'tenant_sig', name: 'Sig Corp' } } as any);
    await client.subscription.create({
      data: { tenantId: 'tenant_sig', tier: 'STARTER', status: 'ACTIVE', meteredMinutes: 0 }
    } as any);

    const response = await app.inject({
      method: 'POST',
      url: '/api/twilio/voice',
      headers: {
        'x-tenant-id': 'tenant_sig',
        host: context.host,
        'x-forwarded-proto': 'https',
        'x-twilio-signature': 'invalid'
      },
      payload: {
        CallSid: 'CA000',
        From: '+1',
        To: '+2',
        CallStatus: 'queued'
      }
    });

    expect(response.statusCode).toBe(403);
  });

  it('handles missed call callbacks with follow-up logs', async () => {
    const { client, store } = context.prisma;
    await client.tenant.create({ data: { id: 'tenant_missed', name: 'Missed Inc' } } as any);
    await client.subscription.create({
      data: { tenantId: 'tenant_missed', tier: 'STARTER', status: 'ACTIVE', meteredMinutes: 0 }
    } as any);
    await client.call.create({
      data: {
        tenantId: 'tenant_missed',
        providerSid: 'CA-missed',
        fromNumber: '+1',
        toNumber: '+2',
        status: 'queued'
      }
    } as any);

    const payload = {
      CallSid: 'CA-missed',
      CallStatus: 'no-answer',
      From: '+1',
      To: '+2'
    };
    const signature = createTwilioSignature(`https://${context.host}/api/twilio/status`, payload);

    const result = await app.inject({
      method: 'POST',
      url: '/api/twilio/status',
      headers: {
        'x-tenant-id': 'tenant_missed',
        host: context.host,
        'x-forwarded-proto': 'https',
        'x-twilio-signature': signature
      },
      payload
    });

    expect(result.statusCode).toBe(200);
    expect(store.auditLog.some((log) => log.message.includes('Missed call'))).toBe(true);
    expect(store.message.find((msg) => msg.direction === 'system')).toBeTruthy();
  });

  it('enforces premium voice upgrades via config route', async () => {
    const { client } = context.prisma;
    const tenant = await client.tenant.create({ data: { name: 'Voice Co' } } as any);
    await client.subscription.create({
      data: { tenantId: tenant.id, tier: 'STARTER', status: 'ACTIVE', meteredMinutes: 0 }
    } as any);
    await client.businessConfig.create({
      data: {
        tenantId: tenant.id,
        businessName: 'Voice Co',
        voiceProfile: 'confident-nova',
        aiProvider: 'openai-standard',
        callRoutingConfig: {}
      }
    } as any);

    const response = await app.inject({
      method: 'PUT',
      url: '/api/config',
      headers: {
        'x-tenant-id': tenant.id
      },
      payload: {
        voiceProfile: 'confident-elevenlabs-scarlett',
        aiProvider: 'openai-premium',
        calendarLink: null
      }
    });

    expect(response.statusCode).toBe(403);
  });

  it('isolates dashboard data per tenant', async () => {
    const { client } = context.prisma;
    const tenantA = await client.tenant.create({ data: { name: 'Tenant A' } } as any);
    const tenantB = await client.tenant.create({ data: { name: 'Tenant B' } } as any);
    await client.subscription.create({
      data: { tenantId: tenantA.id, tier: 'STARTER', status: 'ACTIVE', meteredMinutes: 0 }
    } as any);
    await client.subscription.create({
      data: { tenantId: tenantB.id, tier: 'ENTERPRISE', status: 'ACTIVE', meteredMinutes: 0 }
    } as any);
    await client.call.create({
      data: {
        tenantId: tenantA.id,
        providerSid: 'call-a',
        fromNumber: '+111',
        toNumber: '+222',
        status: 'completed'
      }
    } as any);
    await client.call.create({
      data: {
        tenantId: tenantB.id,
        providerSid: 'call-b',
        fromNumber: '+333',
        toNumber: '+444',
        status: 'completed'
      }
    } as any);

    const response = await app.inject({
      method: 'GET',
      url: '/api/dashboard/overview',
      headers: {
        'x-tenant-id': tenantA.id
      }
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.calls).toHaveLength(1);
    expect(body.calls[0].providerSid).toBe('call-a');
  });

  it('returns fallback booking status when provider fails', async () => {
    const { client } = context.prisma;
    const tenant = await client.tenant.create({ data: { name: 'Fallback Co' } } as any);
    await client.subscription.create({
      data: { tenantId: tenant.id, tier: 'PROFESSIONAL', status: 'ACTIVE', meteredMinutes: 0 }
    } as any);

    env.CALCOM_API_KEY = 'calcom-secret';
    axiosPost.mockRejectedValueOnce(new Error('provider error'));

    const response = await app.inject({
      method: 'POST',
      url: '/api/scheduling/book',
      headers: {
        'x-tenant-id': tenant.id
      },
      payload: {
        eventType: 'demo',
        customerName: 'Grace Hopper',
        customerEmail: 'grace@example.com',
        notes: 'Fallback flow',
        startsAt: new Date().toISOString()
      }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().status).toBe('provider-failed');
  });

  it('accepts tenantId from query string on Twilio voice webhooks', async () => {
    const onboardingResponse = await app.inject({
      method: 'POST',
      url: '/api/onboarding/start',
      payload: {
        businessName: 'Query Tenant',
        email: 'query@tenant.com',
        tier: 'STARTER'
      }
    });
    const tenantId = onboardingResponse.json().tenantId;
    const payload = {
      CallSid: 'CA-query',
      From: '+1000000',
      To: '+2000000',
      CallStatus: 'queued'
    };
    const path = `/api/twilio/voice?tenantId=${tenantId}`;
    const signature = createTwilioSignature(`https://${context.host}${path}`, payload);

    const response = await app.inject({
      method: 'POST',
      url: path,
      headers: {
        host: context.host,
        'x-forwarded-proto': 'https',
        'x-twilio-signature': signature
      },
      payload
    });

    expect(response.statusCode).toBe(200);
  });

  it('rejects billing portal access for another tenant customer', async () => {
    const { client } = context.prisma;
    const tenantA = await client.tenant.create({ data: { name: 'Tenant A' } } as any);
    const tenantB = await client.tenant.create({ data: { name: 'Tenant B' } } as any);
    await client.subscription.create({
      data: {
        tenantId: tenantA.id,
        tier: 'PROFESSIONAL',
        status: 'ACTIVE',
        meteredMinutes: 0,
        stripeCustomer: 'cus_tenant_a'
      }
    } as any);
    await client.subscription.create({
      data: {
        tenantId: tenantB.id,
        tier: 'PROFESSIONAL',
        status: 'ACTIVE',
        meteredMinutes: 0,
        stripeCustomer: 'cus_tenant_b'
      }
    } as any);

    const response = await app.inject({
      method: 'POST',
      url: '/api/billing/portal',
      headers: {
        'x-tenant-id': tenantA.id
      },
      payload: {
        customerId: 'cus_tenant_b',
        returnUrl: 'https://example.com'
      }
    });

    expect(response.statusCode).toBe(403);
  });

  it('processes Stripe subscription webhook events', async () => {
    const { client } = context.prisma;
    const subscription = await client.subscription.create({
      data: {
        tenantId: 'tenant_webhook',
        tier: 'STARTER',
        status: 'ACTIVE',
        meteredMinutes: 0,
        stripeCustomer: 'cus_webhook'
      }
    } as any);

    const stripeEvent = {
      type: 'customer.subscription.updated',
      data: {
        object: {
          customer: 'cus_webhook',
          status: 'past_due',
          id: 'sub_webhook'
        }
      }
    } as Stripe.Event;

    const stripeMock = {
      webhooks: {
        constructEvent: vi.fn().mockReturnValue(stripeEvent)
      }
    } as unknown as Stripe;

    stripeLib.setStripeClientForTesting(stripeMock);
    env.STRIPE_WEBHOOK_SECRET = 'whsec-test';

    const rawBody = JSON.stringify({ payload: true });
    const signature = createStripeSignature(rawBody);
    const response = await app.inject({
      method: 'POST',
      url: '/api/billing/webhook',
      payload: rawBody,
      headers: {
        'stripe-signature': signature,
        'content-type': 'application/json'
      }
    });

    expect(response.statusCode).toBe(200);
    expect(stripeMock.webhooks.constructEvent).toHaveBeenCalledWith(rawBody, signature, 'whsec-test');

    const updated = await client.subscription.findUnique({ where: { id: subscription.id } });
    expect(updated?.status).toBe('PAST_DUE');
    expect(updated?.stripeSubId).toBe('sub_webhook');
  });

  it('treats duplicate webhook deliveries as idempotent', async () => {
    const { client } = context.prisma;
    await client.subscription.create({
      data: {
        tenantId: 'tenant_webhook',
        tier: 'STARTER',
        status: 'ACTIVE',
        meteredMinutes: 0,
        stripeCustomer: 'cus_webhook'
      }
    } as any);

    const stripeEvent = {
      type: 'customer.subscription.updated',
      data: {
        object: {
          customer: 'cus_webhook',
          status: 'active',
          id: 'sub_webhook'
        }
      }
    } as Stripe.Event;

    const stripeMock = {
      webhooks: {
        constructEvent: vi.fn().mockReturnValue(stripeEvent)
      }
    } as unknown as Stripe;

    stripeLib.setStripeClientForTesting(stripeMock);
    env.STRIPE_WEBHOOK_SECRET = 'whsec-test';

    const rawBody = JSON.stringify({ payload: true });
    const signature = createStripeSignature(rawBody);

    const first = await app.inject({
      method: 'POST',
      url: '/api/billing/webhook',
      payload: rawBody,
      headers: {
        'stripe-signature': signature,
        'content-type': 'application/json'
      }
    });

    expect(first.statusCode).toBe(200);

    const second = await app.inject({
      method: 'POST',
      url: '/api/billing/webhook',
      payload: rawBody,
      headers: {
        'stripe-signature': signature,
        'content-type': 'application/json'
      }
    });

    expect(second.statusCode).toBe(200);
    expect(second.json()?.duplicate).toBe(true);
    expect(stripeMock.webhooks.constructEvent).toHaveBeenCalledTimes(2);
  });

  it('rejects Stripe webhooks with invalid signatures', async () => {
    env.STRIPE_WEBHOOK_SECRET = 'whsec-test';

    const stripeMock = {
      webhooks: {
        constructEvent: vi.fn().mockImplementation(() => {
          throw new Error('invalid signature');
        })
      }
    } as unknown as Stripe;
    stripeLib.setStripeClientForTesting(stripeMock);

    const response = await app.inject({
      method: 'POST',
      url: '/api/billing/webhook',
      payload: JSON.stringify({ type: 'customer.subscription.updated' }),
      headers: {
        'content-type': 'application/json',
        'stripe-signature': 't=0,v1=bad'
      }
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error).toContain('Invalid Stripe signature');
  });

  it('returns 400 when Stripe webhook is not configured', async () => {
    env.STRIPE_WEBHOOK_SECRET = undefined;
    stripeLib.setStripeClientForTesting(null);

    const response = await app.inject({
      method: 'POST',
      url: '/api/billing/webhook',
      payload: '{}',
      headers: {
        'content-type': 'application/json'
      }
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error).toContain('not configured');
  });

  it('handles customer.subscription.deleted events', async () => {
    const { client } = context.prisma;
    await client.subscription.create({
      data: {
        tenantId: 'tenant_delete',
        tier: 'PROFESSIONAL',
        status: 'ACTIVE',
        stripeCustomer: 'cus_delete',
        stripeSubId: 'sub_delete'
      }
    } as any);

    const stripeEvent = {
      type: 'customer.subscription.deleted',
      data: {
        object: {
          id: 'sub_delete',
          customer: 'cus_delete',
          status: 'canceled'
        }
      }
    } as Stripe.Event;

    const stripeMock = {
      webhooks: {
        constructEvent: vi.fn().mockReturnValue(stripeEvent)
      }
    } as unknown as Stripe;

    stripeLib.setStripeClientForTesting(stripeMock);
    env.STRIPE_WEBHOOK_SECRET = 'whsec-test';

    const response = await app.inject({
      method: 'POST',
      url: '/api/billing/webhook',
      payload: JSON.stringify(stripeEvent),
      headers: {
        'stripe-signature': createStripeSignature(stripeEvent),
        'content-type': 'application/json'
      }
    });

    expect(response.statusCode).toBe(200);

    const updated = await client.subscription.findFirst({
      where: { stripeCustomer: 'cus_delete' }
    });
    expect(updated?.status).toBe('CANCELED');
  });

  it('returns 500 on webhook processing failure for retry support', async () => {
    const { client } = context.prisma;
    const subscription = await client.subscription.create({
      data: {
        tenantId: 'fail_tenant',
        tier: 'STARTER',
        status: 'ACTIVE',
        stripeCustomer: 'cus_fail',
        stripeSubId: 'sub_fail'
      }
    } as any);

    const stripeEvent = {
      type: 'customer.subscription.updated',
      data: {
        object: {
          id: 'sub_fail',
          customer: 'cus_fail',
          status: 'active'
        }
      }
    } as Stripe.Event;

    const stripeMock = {
      webhooks: {
        constructEvent: vi.fn().mockReturnValue(stripeEvent)
      }
    } as unknown as Stripe;

    stripeLib.setStripeClientForTesting(stripeMock);
    env.STRIPE_WEBHOOK_SECRET = 'whsec-test';

    const originalUpdateMany = context.prisma.client.subscription.updateMany;
    context.prisma.client.subscription.updateMany = vi.fn().mockRejectedValue(new Error('DB error'));

    const response = await app.inject({
      method: 'POST',
      url: '/api/billing/webhook',
      payload: JSON.stringify(stripeEvent),
      headers: {
        'stripe-signature': createStripeSignature(stripeEvent),
        'content-type': 'application/json'
      }
    });

    expect(response.statusCode).toBe(500);
    expect(response.json().error).toContain('Processing failed');

    context.prisma.client.subscription.updateMany = originalUpdateMany;
  });

  it('returns 400 when tenant ID is missing', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/dashboard/overview'
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({
      error: 'Bad Request',
      message: expect.stringContaining('tenant identifier')
    });
  });

  it('creates new Stripe customer on first checkout', async () => {
    const { client } = context.prisma;
    const tenant = await client.tenant.create({ data: { name: 'New Co' } } as any);
    await client.subscription.create({
      data: {
        tenantId: tenant.id,
        tier: 'STARTER',
        status: 'ACTIVE',
        stripeCustomer: null
      }
    } as any);

    const stripeMock = {
      customers: {
        create: vi.fn().mockResolvedValue({ id: 'cus_new' })
      },
      checkout: {
        sessions: {
          create: vi.fn().mockResolvedValue({ url: 'https://checkout.stripe.com' })
        }
      }
    } as unknown as Stripe;

    stripeLib.setStripeClientForTesting(stripeMock as unknown as Stripe);

    const response = await app.inject({
      method: 'POST',
      url: '/api/billing/checkout',
      headers: { 'x-tenant-id': tenant.id },
      payload: {
        tier: 'PROFESSIONAL',
        customerEmail: 'new@example.com',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel'
      }
    });

    expect(response.statusCode).toBe(200);
    expect(stripeMock.customers?.create).toHaveBeenCalledWith({
      email: 'new@example.com',
      metadata: { tenantId: tenant.id }
    });

    const updated = await client.subscription.findFirst({
      where: { tenantId: tenant.id }
    });
    expect(updated?.stripeCustomer).toBe('cus_new');
  });

  it('reuses existing Stripe customer on subsequent checkout', async () => {
    const { client } = context.prisma;
    const tenant = await client.tenant.create({ data: { name: 'Existing Co' } } as any);
    await client.subscription.create({
      data: {
        tenantId: tenant.id,
        tier: 'STARTER',
        status: 'ACTIVE',
        stripeCustomer: 'cus_existing'
      }
    } as any);

    const stripeMock = {
      customers: {
        create: vi.fn()
      },
      checkout: {
        sessions: {
          create: vi.fn().mockResolvedValue({ url: 'https://checkout.stripe.com' })
        }
      }
    } as unknown as Stripe;

    stripeLib.setStripeClientForTesting(stripeMock);

    await app.inject({
      method: 'POST',
      url: '/api/billing/checkout',
      headers: { 'x-tenant-id': tenant.id },
      payload: {
        tier: 'PROFESSIONAL',
        customerEmail: 'existing@example.com',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel'
      }
    });

    expect(stripeMock.customers?.create).not.toHaveBeenCalled();
    expect(stripeMock.checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        customer: 'cus_existing'
      })
    );
  });

  it('rejects checkout with invalid email', async () => {
    const { client } = context.prisma;
    const tenant = await client.tenant.create({ data: { name: 'Test' } } as any);
    await client.subscription.create({
      data: { tenantId: tenant.id, tier: 'STARTER', status: 'ACTIVE' }
    } as any);

    const response = await app.inject({
      method: 'POST',
      url: '/api/billing/checkout',
      headers: { 'x-tenant-id': tenant.id },
      payload: {
        tier: 'PROFESSIONAL',
        customerEmail: 'not-an-email',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel'
      }
    });

    expect(response.statusCode).toBe(400);
  });

  it('returns 403 when subscription has no Stripe customer', async () => {
    const { client } = context.prisma;
    const tenant = await client.tenant.create({ data: { name: 'No Customer' } } as any);
    await client.subscription.create({
      data: {
        tenantId: tenant.id,
        tier: 'STARTER',
        status: 'ACTIVE',
        stripeCustomer: null
      }
    } as any);

    const response = await app.inject({
      method: 'POST',
      url: '/api/billing/portal',
      headers: { 'x-tenant-id': tenant.id },
      payload: {
        customerId: 'cus_any',
        returnUrl: 'https://example.com'
      }
    });

    expect(response.statusCode).toBe(403);
    expect(response.json().error).toContain('not linked');
  });
});

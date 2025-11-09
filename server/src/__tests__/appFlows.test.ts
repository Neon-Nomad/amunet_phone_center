import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';

import { FastifyInstance } from 'fastify';

import { buildApp } from '../app';
import { env } from '../config/env';
import { createTwilioSignature } from '../lib/twilio';
import { createMockPrisma } from '../test-utils/mockPrisma';

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
});
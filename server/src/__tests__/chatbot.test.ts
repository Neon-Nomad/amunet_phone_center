import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';

import { FastifyInstance } from 'fastify';

import { buildApp } from '../app';
import { env } from '../config/env';
import { createMockPrisma } from '../test-utils/mockPrisma';
import fs from 'node:fs/promises';
import path from 'node:path';

const axiosPost = vi.fn();

vi.mock('axios', () => ({
  default: {
    post: (...args: any[]) => axiosPost(...args)
  }
}));

describe('/api/chat', () => {
  const pricingPath = path.join(__dirname, '..', 'config', 'pricing.json');
  let app: FastifyInstance;
  let context = { prisma: createMockPrisma() };
  let originalPricing: string | null = null;

  beforeEach(async () => {
    context = { prisma: createMockPrisma() };
    env.OPENAI_API_KEY = 'test-openai';
    env.SENDGRID_API_KEY = 'sendgrid-test';
    env.SLACK_WEBHOOK_URL = 'https://hooks.slack.com/services/test';
    env.TWILIO_SUPPORT_NUMBER = '+18885551234';
    env.SALES_EMAIL = 'sales@amunet.ai';
    env.STRIPE_STARTER_PRICE_ID = 'price_starter';
    env.STRIPE_PROFESSIONAL_PRICE_ID = 'price_professional';
    env.STRIPE_ENTERPRISE_PRICE_ID = 'price_enterprise';
    originalPricing = await fs.readFile(pricingPath, 'utf-8');

    axiosPost.mockReset();
    axiosPost.mockImplementation(async (url: string) => {
      if (url.includes('openai')) {
        return {
          data: {
            choices: [
              {
                message: {
                  content: JSON.stringify({ reply: 'hello', intent: 'demo' })
                }
              }
            ]
          }
        };
      }

      if (url.includes('slack.com')) {
        return { status: 200, data: {} };
      }

      if (url.includes('sendgrid')) {
        return { status: 202, data: {} };
      }

      return { data: {} };
    });

    app = await buildApp({ prismaClient: context.prisma.client, logger: false });
  });

  afterEach(async () => {
    await app.close();
    if (originalPricing !== null) {
      await fs.writeFile(pricingPath, originalPricing, 'utf-8');
      originalPricing = null;
    }
  });

  it('returns dynamic pricing and fires follow-up actions', async () => {
    const customPricing = [
      {
        name: 'Flash',
        price: '$1,200/mo',
        description: 'Custom lightning tier',
        features: ['Unlimited phone numbers', 'Real-time transcripts']
      }
    ];
    await fs.writeFile(pricingPath, JSON.stringify(customPricing, null, 2), 'utf-8');

    const response = await app.inject({
      method: 'POST',
      url: '/api/chat',
      payload: {
        message: 'Want to book a demo, email me the details, and notify a live agent',
        userType: 'visitor',
        intent: 'demo',
        userId: 'lead-123'
      }
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.pricing).toEqual(customPricing);
    expect(body.actions?.some((action: any) => action.type === 'book_demo')).toBe(true);
    expect(body.actions?.some((action: any) => action.type === 'send_email')).toBe(true);
    expect(body.actions?.some((action: any) => action.type === 'notify_live_agent')).toBe(true);

    const slackCall = axiosPost.mock.calls.find((call) => call[0] === env.SLACK_WEBHOOK_URL);
    expect(slackCall).toBeDefined();
    expect(slackCall?.[1]).toEqual(
      expect.objectContaining({ text: expect.stringContaining('Live agent requested') })
    );

    const emailCall = axiosPost.mock.calls.find((call) => call[0] === 'https://api.sendgrid.com/v3/mail/send');
    expect(emailCall).toBeDefined();
    expect(emailCall?.[2]).toEqual(
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: expect.stringContaining('Bearer')
        })
      })
    );
  });
});

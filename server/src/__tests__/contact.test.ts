import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { FastifyInstance } from 'fastify';

import { buildApp } from '../app';
import { env } from '../config/env';
import { createMockPrisma } from '../test-utils/mockPrisma';

const axiosPost = vi.fn();

vi.mock('axios', () => ({
  default: {
    post: (...args: any[]) => axiosPost(...args)
  }
}));

describe('/api/email', () => {
  let app: FastifyInstance;
  let mockContext: ReturnType<typeof createMockPrisma>;

  beforeEach(async () => {
    mockContext = createMockPrisma();
    env.SENDGRID_API_KEY = 'sendgrid-test';
    env.SALES_EMAIL = 'sales@amunet.ai';
    axiosPost.mockReset();
    axiosPost.mockResolvedValue({ status: 202, data: {} });

    app = await buildApp({ prismaClient: mockContext.client, logger: false });
  });

  afterEach(async () => {
    await app.close();
  });

  it('accepts contact form submissions and fires SendGrid', async () => {
    const payload = {
      name: 'Jamie',
      email: 'jamie@example.com',
      message: 'Hello, please send me more info about pricing.'
    };

    const response = await app.inject({
      method: 'POST',
      url: '/api/email',
      payload
    });

    expect(response.statusCode).toBe(202);
    expect(response.json()).toEqual({ status: 'accepted' });
    expect(axiosPost).toHaveBeenCalledWith(
      'https://api.sendgrid.com/v3/mail/send',
      expect.objectContaining({
        personalizations: [
          expect.objectContaining({
            to: [{ email: env.SALES_EMAIL }],
            subject: expect.stringContaining('Website contact form')
          })
        ],
        content: expect.arrayContaining([
          expect.objectContaining({
            value: expect.stringContaining(payload.message)
          })
        ])
      }),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: expect.stringContaining('Bearer'),
          'Content-Type': 'application/json'
        })
      })
    );
  });
});

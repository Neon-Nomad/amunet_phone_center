import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { FastifyInstance } from 'fastify';

import { buildApp } from '../app';
import { createMockPrisma } from '../test-utils/mockPrisma';
import { generateTestToken, createTestUser } from '../test-utils/auth';

describe('/api/status', () => {
  let app: FastifyInstance;
  let mockContext: ReturnType<typeof createMockPrisma>;

  beforeEach(async () => {
    mockContext = createMockPrisma();
    app = await buildApp({ prismaClient: mockContext.client, logger: false });
  });

  afterEach(async () => {
    await app.close();
  });

  it('returns uptime and active call counts for the tenant', async () => {
    const tenant = await mockContext.client.tenant.create({
      data: {
        name: 'Realtime Co'
      } as any
    });

    const user = await mockContext.client.user.create({
      data: {
        tenantId: tenant.id,
        email: 'user@realtime.test',
        passwordHash: 'hash'
      } as any
    });

    await mockContext.client.call.create({
      data: {
        tenantId: tenant.id,
        fromNumber: '+15551234567',
        toNumber: '+18885551234',
        status: 'in-progress',
        duration: 0
      } as any
    });

    const token = generateTestToken(app, createTestUser(tenant.id, user.id, user.email));

    const response = await app.inject({
      method: 'GET',
      url: '/api/status',
      headers: { authorization: `Bearer ${token}` }
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body).toHaveProperty('uptime', '99.9%');
    expect(body).toHaveProperty('activeCalls', 1);
    expect(new Date(body.lastUpdate).toString()).not.toContain('Invalid Date');
  });
});

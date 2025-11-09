import { FastifyInstance } from 'fastify';

import { assertTenant } from '../lib/tenant';

export default async function statusRoutes(app: FastifyInstance) {
  app.get('/status', async (request, reply) => {
    const tenant = assertTenant(request, reply);
    const windowStart = new Date(Date.now() - 5 * 60 * 1000);

    const calls = await app.prisma.call.findMany({
      where: { tenantId: tenant.tenantId }
    });

    const activeCalls = calls.filter((call) => call.createdAt >= windowStart).length;

    return reply.send({
      uptime: '99.9%',
      activeCalls,
      lastUpdate: new Date().toISOString()
    });
  });
}

import { FastifyInstance } from 'fastify';

import { requireAuth, getAuthUser } from '../lib/auth';

export default async function statusRoutes(app: FastifyInstance) {
  app.get('/status', { preHandler: requireAuth }, async (request, reply) => {
    const user = getAuthUser(request);
    const windowStart = new Date(Date.now() - 5 * 60 * 1000);

    const calls = await app.prisma.call.findMany({
      where: { tenantId: user.tenantId }
    });

    const activeCalls = calls.filter((call: { createdAt: Date }) => call.createdAt >= windowStart).length;

    return reply.send({
      uptime: '99.9%',
      activeCalls,
      lastUpdate: new Date().toISOString()
    });
  });
}

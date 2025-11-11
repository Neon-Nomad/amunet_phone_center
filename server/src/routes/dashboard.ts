import { FastifyInstance } from 'fastify';

import { requireAuth, getAuthUser } from '../lib/auth';

export default async function dashboardRoutes(app: FastifyInstance) {
  app.get('/overview', { preHandler: requireAuth }, async (request, reply) => {
    const user = getAuthUser(request);

    const [calls, bookings, subscription] = await Promise.all([
      app.prisma.call.findMany({
        where: { tenantId: user.tenantId },
        orderBy: { createdAt: 'desc' },
        take: 5
      }),
      app.prisma.booking.findMany({
        where: { tenantId: user.tenantId },
        orderBy: { scheduledFor: 'desc' },
        take: 5
      }),
      app.prisma.subscription.findFirst({ where: { tenantId: user.tenantId } })
    ]);

    return reply.send({
      calls,
      bookings,
      subscription,
      uptime: '99.9%'
    });
  });
}
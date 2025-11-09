import { FastifyInstance } from 'fastify';

import { assertTenant } from '../lib/tenant';

export default async function dashboardRoutes(app: FastifyInstance) {
  app.get('/overview', async (request, reply) => {
    const tenant = assertTenant(request, reply);

    const [calls, bookings, subscription] = await Promise.all([
      app.prisma.call.findMany({
        where: { tenantId: tenant.tenantId },
        orderBy: { createdAt: 'desc' },
        take: 5
      }),
      app.prisma.booking.findMany({
        where: { tenantId: tenant.tenantId },
        orderBy: { scheduledFor: 'desc' },
        take: 5
      }),
      app.prisma.subscription.findFirst({ where: { tenantId: tenant.tenantId } })
    ]);

    return reply.send({
      calls,
      bookings,
      subscription,
      uptime: '99.9%'
    });
  });
}
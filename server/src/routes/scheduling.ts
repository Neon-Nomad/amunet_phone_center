import { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { assertTenant } from '../lib/tenant';
import { SchedulingService } from '../services/schedulingService';

const schedulingService = new SchedulingService();

const bookingSchema = z.object({
  eventType: z.string(),
  customerName: z.string(),
  customerEmail: z.string().email(),
  notes: z.string().optional(),
  startsAt: z.string()
});

export default async function schedulingRoutes(app: FastifyInstance) {
  app.post('/book', async (request, reply) => {
    const tenant = assertTenant(request, reply);
    const body = bookingSchema.parse(request.body);

    const booking = await schedulingService.createBooking({
      tenantId: tenant.tenantId,
      eventType: body.eventType,
      customerName: body.customerName,
      customerEmail: body.customerEmail,
      notes: body.notes,
      startsAt: body.startsAt
    });

    if (booking.externalId) {
      await app.prisma.booking.create({
        data: {
          tenantId: tenant.tenantId,
          customerName: body.customerName,
          customerEmail: body.customerEmail,
          scheduledFor: new Date(body.startsAt),
          notes: body.notes
        }
      });
    }

    return reply.send(booking);
  });
}
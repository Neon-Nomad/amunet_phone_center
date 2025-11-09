import { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { assertTenant } from '../lib/tenant';
import { allowPremiumVoices } from '../services/voiceService';

const updateSchema = z.object({
  voiceProfile: z.string().min(2),
  aiProvider: z.string().min(2),
  calendarLink: z.string().url().nullable().optional()
});

export default async function configRoutes(app: FastifyInstance) {
  app.get('/', async (request, reply) => {
    const tenant = assertTenant(request, reply);
    const config = await app.prisma.businessConfig.findFirst({ where: { tenantId: tenant.tenantId } });
    return reply.send(config);
  });

  app.put('/', async (request, reply) => {
    const tenant = assertTenant(request, reply);
    const body = updateSchema.parse(request.body);

    const subscription = await app.prisma.subscription.findFirst({ where: { tenantId: tenant.tenantId } });
    if (!subscription) {
      return reply.status(400).send({ error: 'Subscription not found' });
    }

    if (!allowPremiumVoices(subscription.tier) && body.voiceProfile.includes('elevenlabs')) {
      return reply.status(403).send({ error: 'Premium voices require Professional tier or above.' });
    }

    const config = await app.prisma.businessConfig.updateMany({
      where: { tenantId: tenant.tenantId },
      data: {
        voiceProfile: body.voiceProfile,
        aiProvider: body.aiProvider,
        calendarLink: body.calendarLink ?? null
      }
    });

    return reply.send({ updated: config.count });
  });
}
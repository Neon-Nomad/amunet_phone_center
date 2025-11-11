import { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { requireAuth, getAuthUser } from '../lib/auth';
import { allowPremiumVoices } from '../services/voiceService';

const updateSchema = z.object({
  voiceProfile: z.string().min(2),
  aiProvider: z.string().min(2),
  calendarLink: z.string().url().nullable().optional()
});

export default async function configRoutes(app: FastifyInstance) {
  app.get('/', { preHandler: requireAuth }, async (request, reply) => {
    const user = getAuthUser(request);
    const config = await app.prisma.businessConfig.findFirst({ where: { tenantId: user.tenantId } });
    return reply.send(config);
  });

  app.put('/', { preHandler: requireAuth }, async (request, reply) => {
    const user = getAuthUser(request);
    const body = updateSchema.parse(request.body);

    const subscription = await app.prisma.subscription.findFirst({ where: { tenantId: user.tenantId } });
    if (!subscription) {
      return reply.status(400).send({ error: 'Subscription not found' });
    }

    if (!allowPremiumVoices(subscription.tier) && body.voiceProfile.includes('elevenlabs')) {
      return reply.status(403).send({ error: 'Premium voices require Professional tier or above.' });
    }

    const config = await app.prisma.businessConfig.updateMany({
      where: { tenantId: user.tenantId },
      data: {
        voiceProfile: body.voiceProfile,
        aiProvider: body.aiProvider,
        calendarLink: body.calendarLink ?? null
      }
    });

    return reply.send({ updated: config.count });
  });
}
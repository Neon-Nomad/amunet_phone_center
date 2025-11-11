import { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { OnboardingService } from '../services/onboardingService';

const onboardingSchema = z.object({
  businessName: z.string().min(2).optional(),
  websiteUrl: z.string().url().optional(),
  email: z.string().email(),
  tier: z.enum(['STARTER', 'PROFESSIONAL', 'ENTERPRISE'])
});

export default async function onboardingRoutes(app: FastifyInstance) {
  app.post('/start', async (request, reply) => {
    const body = onboardingSchema.parse(request.body);

    const service = new OnboardingService(app.prisma);
    const result = await service.run({
      businessName: body.businessName,
      websiteUrl: body.websiteUrl,
      email: body.email,
      tier: body.tier
    });

    return reply.send(result);
  });
}
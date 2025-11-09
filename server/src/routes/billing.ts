import { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { assertTenant } from '../lib/tenant';
import { BillingService } from '../services/billingService';

const billingService = new BillingService();

const checkoutSchema = z.object({
  tier: z.enum(['STARTER', 'PROFESSIONAL', 'ENTERPRISE']),
  successUrl: z.string().url(),
  cancelUrl: z.string().url()
});

export default async function billingRoutes(app: FastifyInstance) {
  app.post('/checkout', async (request, reply) => {
    const tenant = assertTenant(request, reply);
    const body = checkoutSchema.parse(request.body);

    const session = await billingService.createCheckoutSession({
      tier: body.tier,
      tenantId: tenant.tenantId,
      successUrl: body.successUrl,
      cancelUrl: body.cancelUrl
    });

    return reply.send(session);
  });

  app.post('/portal', async (request, reply) => {
    const tenant = assertTenant(request, reply);
    const schema = z.object({ customerId: z.string(), returnUrl: z.string().url() });
    const body = schema.parse(request.body);

    const session = await billingService.createCustomerPortalSession(body.customerId, body.returnUrl);

    await app.prisma.auditLog.create({
      data: {
        tenantId: tenant.tenantId,
        category: 'billing',
        message: `Generated billing portal session for customer ${body.customerId}`
      }
    });

    return reply.send(session);
  });
}
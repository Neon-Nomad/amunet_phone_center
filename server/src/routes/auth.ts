import { FastifyInstance } from 'fastify';
import { hash, compare } from 'bcryptjs';
import { z } from 'zod';

import { tenantHeader } from '../lib/tenant';

const registrationSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  tenantName: z.string().min(2)
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export default async function authRoutes(app: FastifyInstance) {
  app.post('/register', async (request, reply) => {
    const body = registrationSchema.parse(request.body);

    const existing = await app.prisma.user.findUnique({ where: { email: body.email } });
    if (existing) {
      return reply.status(409).send({ error: 'User already exists' });
    }

    const tenant = await app.prisma.tenant.create({
      data: { name: body.tenantName }
    });

    const passwordHash = await hash(body.password, 10);

    const user = await app.prisma.user.create({
      data: {
        tenantId: tenant.id,
        email: body.email,
        passwordHash
      }
    });

    await app.prisma.subscription.create({
      data: {
        tenantId: tenant.id,
        tier: 'STARTER',
        status: 'ACTIVE',
        meteredMinutes: 0
      }
    });

    return reply.status(201).send({
      tenantId: tenant.id,
      userId: user.id
    });
  });

  app.post('/login', async (request, reply) => {
    const body = loginSchema.parse(request.body);
    const user = await app.prisma.user.findUnique({ where: { email: body.email } });
    if (!user) {
      return reply.status(401).send({ error: 'Invalid credentials' });
    }

    const valid = await compare(body.password, user.passwordHash);
    if (!valid) {
      return reply.status(401).send({ error: 'Invalid credentials' });
    }

    return reply.send({
      token: `stub-token-${user.id}`,
      tenantId: user.tenantId,
      headers: { [tenantHeader]: user.tenantId }
    });
  });
}
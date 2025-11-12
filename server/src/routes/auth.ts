import { FastifyInstance } from 'fastify';
import { hash, compare } from 'bcryptjs';
import { z } from 'zod';

import { requireAuth } from '../lib/auth';

// Password must be at least 8 characters with uppercase, lowercase, number, and special character
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

const registrationSchema = z.object({
  email: z.string().email(),
  password: passwordSchema,
  tenantName: z.string().min(2)
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1) // Don't validate complexity on login, just check if provided
});

export default async function authRoutes(app: FastifyInstance) {
  // Add stricter rate limiting for auth endpoints
  const authRateLimit = {
    config: {
      rateLimit: {
        max: 5, // Only 5 attempts
        timeWindow: '15 minutes'
      }
    }
  };

  app.post('/register', authRateLimit, async (request, reply) => {
    // Validate request body and return user-friendly errors
    const parseResult = registrationSchema.safeParse(request.body);
    if (!parseResult.success) {
      const errors = parseResult.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message
      }));
      return reply.status(400).send({
        error: 'Validation failed',
        details: errors
      });
    }

    const body = parseResult.data;

    const existing = await app.prisma.user.findUnique({ where: { email: body.email } });
    if (existing) {
      return reply.status(409).send({ error: 'User already exists' });
    }

    const tenant = await app.prisma.tenant.create({
      data: { name: body.tenantName }
    });

    const passwordHash = await hash(body.password, 12);

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

  app.post('/login', authRateLimit, async (request, reply) => {
    // Validate request body and return user-friendly errors
    const parseResult = loginSchema.safeParse(request.body);
    if (!parseResult.success) {
      const errors = parseResult.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message
      }));
      return reply.status(400).send({
        error: 'Validation failed',
        details: errors
      });
    }

    const body = parseResult.data;
    const user = await app.prisma.user.findUnique({ where: { email: body.email } });
    if (!user) {
      return reply.status(401).send({ error: 'Invalid credentials' });
    }

    const valid = await compare(body.password, user.passwordHash);
    if (!valid) {
      return reply.status(401).send({ error: 'Invalid credentials' });
    }

    // Generate JWT token with user and tenant information
    const token = app.jwt.sign(
      {
        userId: user.id,
        tenantId: user.tenantId,
        email: user.email
      },
      {
        expiresIn: '2h' // Token expires in 2 hours (reduced from 7 days for security)
      }
    );

    return reply.send({
      token,
      tenantId: user.tenantId
    });
  });

  app.post('/logout', { preHandler: requireAuth }, async (request, reply) => {
    // Logout is handled client-side by removing the token
    // This endpoint can be used for server-side token invalidation in the future
    // For now, we just return success
    return reply.send({ message: 'Logged out successfully' });
  });
}
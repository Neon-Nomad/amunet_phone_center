import fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import formBody from '@fastify/formbody';
import rateLimit from '@fastify/rate-limit';
import fastifyRawBody from 'fastify-raw-body';
import jwt from '@fastify/jwt';

import { PrismaClient } from '@prisma/client';

import { env } from './config/env';
import { TenantMissingError } from './lib/tenant';
import { UnauthorizedError } from './lib/auth';
import authRoutes from './routes/auth';
import onboardingRoutes from './routes/onboarding';
import twilioRoutes from './routes/twilio';
import billingRoutes from './routes/billing';
import schedulingRoutes from './routes/scheduling';
import dashboardRoutes from './routes/dashboard';
import configRoutes from './routes/config';
import chatbotRoutes from './routes/chatbot';
import contactRoutes from './routes/contact';
import statusRoutes from './routes/status';

export interface BuildAppOptions {
  prismaClient?: PrismaClient;
  logger?: boolean;
}

export async function buildApp(options: BuildAppOptions = {}): Promise<FastifyInstance> {
  const app = fastify({
    logger: options.logger ?? (env.NODE_ENV !== 'test')
  });

  await app.register(cors, { origin: true });
  await app.register(helmet);
  await app.register(formBody);
  await app.register(jwt, {
    secret: env.JWT_SECRET
  });
  await app.register(rateLimit, {
    global: true,
    max: 200,
    timeWindow: '1 minute'
  });

  await app.register(fastifyRawBody, {
    field: 'rawBody',
    global: false,
    runFirst: true,
    encoding: 'utf8'
  });

  if (options.prismaClient) {
    app.decorate('prisma', options.prismaClient);
  } else {
    const { default: prismaPlugin } = await import('./plugins/prisma');
    await app.register(prismaPlugin);
  }

  await app.register(authRoutes, { prefix: '/api/auth' });
  await app.register(onboardingRoutes, { prefix: '/api/onboarding' });
  await app.register(twilioRoutes, { prefix: '/api/twilio' });
  await app.register(billingRoutes, { prefix: '/api/billing' });
  await app.register(schedulingRoutes, { prefix: '/api/scheduling' });
  await app.register(dashboardRoutes, { prefix: '/api/dashboard' });
  await app.register(configRoutes, { prefix: '/api/config' });
  await app.register(contactRoutes, { prefix: '/api' });
  await app.register(statusRoutes, { prefix: '/api' });
  await app.register(chatbotRoutes, { prefix: '/api' });

  app.setErrorHandler((error, request, reply) => {
    if (error instanceof TenantMissingError) {
      return reply.status(error.statusCode ?? 400).send({
        error: 'Bad Request',
        message: error.message
      });
    }

    if (error instanceof UnauthorizedError) {
      return reply.status(error.statusCode ?? 401).send({
        error: 'Unauthorized',
        message: error.message
      });
    }

    // Default Fastify handler
    reply.send(error);
  });

  return app;
}

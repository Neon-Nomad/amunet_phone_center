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

  // Configure CORS with allowed origins
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://amunet.ai',
    'https://www.amunet.ai'
  ];

  await app.register(cors, {
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'), false);
      }
    },
    credentials: true
  });

  await app.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"]
      }
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    }
  });

  await app.register(formBody);
  await app.register(jwt, {
    secret: env.JWT_SECRET
  });

  // Improved rate limiting with different limits for different routes
  await app.register(rateLimit, {
    global: true,
    max: 100, // Reduced from 200
    timeWindow: '1 minute',
    skipOnError: false
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
    // Log the full error for debugging
    request.log.error(error);

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

    // Handle validation errors
    if (error.validation) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'Invalid request data'
      });
    }

    // Generic error response - don't expose stack traces
    const statusCode = error.statusCode ?? 500;
    return reply.status(statusCode).send({
      error: statusCode >= 500 ? 'Internal Server Error' : 'Bad Request',
      message: statusCode >= 500 ? 'An error occurred processing your request' : error.message
    });
  });

  return app;
}

import 'dotenv/config';

import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  ELEVENLABS_API_KEY: z.string().optional(),
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  CALCOM_API_KEY: z.string().optional(),
  CALCOM_BASE_URL: z.string().optional().default('https://api.cal.com/v2'),
  CALCOM_BOOKING_URL: z.string().optional(),
  STRIPE_STARTER_PRICE_ID: z.string().optional(),
  STRIPE_PROFESSIONAL_PRICE_ID: z.string().optional(),
  STRIPE_ENTERPRISE_PRICE_ID: z.string().optional(),
  SENDGRID_API_KEY: z.string().min(1),
  RESEND_API_KEY: z.string().optional(),
  SLACK_WEBHOOK_URL: z.string().min(1),
  TWILIO_SUPPORT_NUMBER: z.string().min(1),
  SALES_EMAIL: z.string().email(),
  JWT_SECRET: z.string().min(32)
});

// Provide safe defaults for test environment only
const testDefaults = process.env.NODE_ENV === 'test' ? {
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test',
  JWT_SECRET: process.env.JWT_SECRET || 'test-secret-key-minimum-32-chars-long-for-testing-only',
  SENDGRID_API_KEY: process.env.SENDGRID_API_KEY || 'SG.test_key',
  SLACK_WEBHOOK_URL: process.env.SLACK_WEBHOOK_URL || 'https://hooks.slack.com/services/test',
  TWILIO_SUPPORT_NUMBER: process.env.TWILIO_SUPPORT_NUMBER || '+15555555555',
  SALES_EMAIL: process.env.SALES_EMAIL || 'sales@test.example.com'
} : {};

const envWithDefaults = {
  ...process.env,
  ...testDefaults
};

const parsed = envSchema.safeParse(envWithDefaults);

if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
  throw new Error('Invalid environment variables');
}

export const env = parsed.data;

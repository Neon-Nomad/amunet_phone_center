import crypto from 'crypto';

import { env } from '../config/env';

export function createStripeSignature(payload: unknown): string {
  const timestamp = Math.floor(Date.now() / 1000);
  const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);
  const signedPayload = `${timestamp}.${payloadString}`;

  const signature = crypto
    .createHmac('sha256', env.STRIPE_WEBHOOK_SECRET ?? 'whsec_test')
    .update(signedPayload)
    .digest('hex');

  return `t=${timestamp},v1=${signature}`;
}

import crypto from 'crypto';

import { FastifyRequest } from 'fastify';

import { env } from '../config/env';

export function resolveRequestUrl(request: FastifyRequest): string {
  const protocol = (request.headers['x-forwarded-proto'] as string) ?? request.protocol ?? 'https';
  const host = (request.headers.host as string) ?? 'localhost';
  return `${protocol}://${host}${request.url}`;
}

export function createTwilioSignature(url: string, payload: Record<string, unknown>): string {
  const sortedKeys = Object.keys(payload).sort();
  let data = url;
  for (const key of sortedKeys) {
    const value = payload[key];
    data += key + (value ?? '');
  }
  return crypto.createHmac('sha1', env.TWILIO_AUTH_TOKEN ?? '').update(data).digest('base64');
}

export function verifyTwilioSignature(
  request: FastifyRequest,
  payload: Record<string, unknown>
): boolean {
  if (!env.TWILIO_AUTH_TOKEN) {
    return true;
  }

  const header = request.headers['x-twilio-signature'];
  if (typeof header !== 'string') {
    return false;
  }

  const url = resolveRequestUrl(request);
  const expected = createTwilioSignature(url, payload);

  const provided = Buffer.from(header);
  const expectedBuffer = Buffer.from(expected);
  if (provided.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(provided, expectedBuffer);
}
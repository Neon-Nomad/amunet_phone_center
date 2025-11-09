import { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { assertTenant } from '../lib/tenant';
import { verifyTwilioSignature } from '../lib/twilio';

const twilioPayloadSchema = z
  .object({
    CallSid: z.string().optional(),
    From: z.string().optional(),
    To: z.string().optional(),
  CallStatus: z.string().optional(),
  RecordingUrl: z.string().optional(),
  CallDuration: z.union([z.string(), z.number()]).optional(),
  Body: z.string().optional(),
  Channel: z.string().optional(),
  MessageSid: z.string().optional()
  })
  .passthrough();

export default async function twilioRoutes(app: FastifyInstance) {
  app.post('/voice', async (request, reply) => {
    const tenant = assertTenant(request, reply);
    const payload = twilioPayloadSchema.parse(request.body ?? {});

    if (!verifyTwilioSignature(request, payload)) {
      return reply.status(403).send({ error: 'Invalid Twilio signature' });
    }

    await app.prisma.call.create({
      data: {
        tenantId: tenant.tenantId,
        fromNumber: payload.From ?? 'unknown',
        toNumber: payload.To ?? 'unknown',
        status: payload.CallStatus ?? 'queued',
        providerSid: payload.CallSid,
        metadata: payload
      }
    });

    return reply.type('text/xml').send('<Response><Say>Call received. Agent will respond shortly.</Say></Response>');
  });

  app.post('/incoming', async (request, reply) => {
    const tenant = assertTenant(request, reply);
    const payload = twilioPayloadSchema.parse(request.body ?? {});

    if (!verifyTwilioSignature(request, payload)) {
      return reply.status(403).send({ error: 'Invalid Twilio signature' });
    }

    await app.prisma.message.create({
      data: {
        tenantId: tenant.tenantId,
        direction: 'inbound',
        content: payload.Body ?? JSON.stringify(payload),
        channel: payload.Channel ?? 'voice'
      }
    });

    return reply.type('text/xml').send('<Response><Say>Your message is recorded.</Say></Response>');
  });

  app.post('/status', async (request, reply) => {
    const tenant = assertTenant(request, reply);
    const payload = twilioPayloadSchema.parse(request.body ?? {});

    if (!verifyTwilioSignature(request, payload)) {
      return reply.status(403).send({ error: 'Invalid Twilio signature' });
    }

    const durationSeconds = Number(payload.CallDuration ?? 0) || 0;

    if (payload.CallSid) {
      const call = await app.prisma.call.findFirst({
        where: { tenantId: tenant.tenantId, providerSid: payload.CallSid }
      });

      if (call) {
        await app.prisma.call.update({
          where: { id: call.id },
          data: {
            status: payload.CallStatus ?? call.status,
            duration: durationSeconds,
            metadata: { ...(call.metadata ?? {}), ...payload }
          }
        });
      }
    }

    if (payload.CallStatus && ['completed', 'in-progress'].includes(payload.CallStatus.toLowerCase())) {
      const subscription = await app.prisma.subscription.findFirst({
        where: { tenantId: tenant.tenantId }
      });

      if (subscription && durationSeconds > 0) {
        const minutes = Math.max(1, Math.ceil(durationSeconds / 60));
        await app.prisma.subscription.update({
          where: { id: subscription.id },
          data: { meteredMinutes: subscription.meteredMinutes + minutes }
        });
      }
    }

    if (payload.CallStatus && ['no-answer', 'busy', 'failed'].includes(payload.CallStatus.toLowerCase())) {
      await app.prisma.auditLog.create({
        data: {
          tenantId: tenant.tenantId,
          category: 'telephony',
          message: `Missed call from ${payload.From ?? 'unknown'} to ${payload.To ?? 'unknown'} (${payload.CallStatus})`
        }
      });

      await app.prisma.message.create({
        data: {
          tenantId: tenant.tenantId,
          direction: 'system',
          content: `Missed call follow-up required for ${payload.From ?? 'unknown'}`,
          channel: 'system'
        }
      });
    }

    await app.prisma.auditLog.create({
      data: {
        tenantId: tenant.tenantId,
        category: 'telephony',
        message: `Twilio status event ${payload.CallSid ?? 'unknown'}: ${payload.CallStatus ?? 'n/a'}`
      }
    });

    return reply.send({ status: 'ok' });
  });
}

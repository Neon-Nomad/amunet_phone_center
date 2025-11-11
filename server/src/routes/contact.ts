import { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { sendSalesEmail } from '../services/mailService';

const contactSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  message: z.string().min(10)
});

export default async function contactRoutes(app: FastifyInstance) {
  app.post<{ Body: z.infer<typeof contactSchema> }>('/email', async (request, reply) => {
    const body = contactSchema.parse(request.body);

    await sendSalesEmail({
      subject: `Website contact form: ${body.name}`,
      body: `Name: ${body.name}\nEmail: ${body.email}\nMessage:\n${body.message}`,
      replyTo: body.email
    });

    return reply.status(202).send({ status: 'accepted' });
  });
}

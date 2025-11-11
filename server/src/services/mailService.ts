import axios from 'axios';

import { env } from '../config/env';

export interface SendSalesEmailOptions {
  subject: string;
  body: string;
  replyTo?: string;
}

const buildPayload = (options: SendSalesEmailOptions) => {
  const payload: Record<string, unknown> = {
    personalizations: [
      {
        to: [{ email: env.SALES_EMAIL }],
        subject: options.subject
      }
    ],
    from: { email: 'hello@amunet.ai', name: 'Amunet AI Concierge' },
    content: [
      {
        type: 'text/plain',
        value: options.body
      }
    ]
  };

  if (options.replyTo) {
    payload.reply_to = { email: options.replyTo };
  }

  return payload;
};

export const sendSalesEmail = async (options: SendSalesEmailOptions) => {
  if (!env.SENDGRID_API_KEY || !env.SALES_EMAIL) {
    throw new Error('Missing SendGrid configuration');
  }

  await axios.post('https://api.sendgrid.com/v3/mail/send', buildPayload(options), {
    headers: {
      Authorization: `Bearer ${env.SENDGRID_API_KEY}`,
      'Content-Type': 'application/json'
    }
  });
};

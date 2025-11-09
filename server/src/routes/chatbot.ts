import { FastifyPluginAsync } from 'fastify';
import axios from 'axios';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { env } from '../config/env';
import { sendSalesEmail } from '../services/mailService';

interface PricingTier {
  name: string;
  price: string;
  description: string;
  features: string[];
}

export interface ChatRequestBody {
  message: string;
  userType?: 'visitor' | 'trial' | 'customer';
  tenantId?: string;
  intent?: string;
  userId?: string;
}

interface ChatAction {
  type: 'book_demo' | 'send_email' | 'notify_live_agent';
  payload?: Record<string, string>;
}

interface ChatResponse {
  text: string;
  pricing?: PricingTier[];
  actions?: ChatAction[];
}

const pricingFilePath = path.join(__dirname, '../config/pricing.json');

const loadPricing = async (): Promise<PricingTier[]> => {
  const raw = await readFile(pricingFilePath, 'utf-8');
  return JSON.parse(raw) as PricingTier[];
};

const buildPricingSummary = (tiers: PricingTier[]) => tiers.map((tier) => `${tier.name} (${tier.price})`).join(' | ');

const bookingUrl =
  env.CALCOM_BOOKING_URL?.replace(/\/+$/, '') ||
  `${env.CALCOM_BASE_URL.replace(/\/+$/, '')}/book/demo`;

const humanChannel = env.SLACK_WEBHOOK_URL
  ? 'Slack'
  : env.TWILIO_SUPPORT_NUMBER
  ? `Twilio (${env.TWILIO_SUPPORT_NUMBER})`
  : 'our support team';

const wantsBooking = (text: string) => /\b(book|demo|trial|schedule|call)\b/i.test(text);
const wantsLiveAgent = (text: string) => /\b(live agent|human|support|rep)\b/i.test(text);
const wantsEmailFollowUp = (text: string) => /\b(email|follow[- ]?up|reach out)\b/i.test(text);

const buildActions = (message: string): ChatAction[] => {
  const actions: ChatAction[] = [];

  if (wantsBooking(message)) {
    actions.push({
      type: 'book_demo',
      payload: { url: bookingUrl }
    });
  }

  if (wantsLiveAgent(message)) {
    actions.push({
      type: 'notify_live_agent',
      payload: {
        channel: 'Slack',
        detail: env.TWILIO_SUPPORT_NUMBER
          ? `Live support reachable at ${env.TWILIO_SUPPORT_NUMBER}`
          : 'A teammate will follow up within 15 minutes.'
      }
    });
  }

  if (wantsEmailFollowUp(message)) {
    actions.push({
      type: 'send_email',
      payload: {
        template: 'sales_follow_up'
      }
    });
  }

  return actions;
};

const buildSystemPrompt = (summary: string) =>
  `You are Amunet AI’s concierge. Answer onboarding, pricing, and booking questions concisely (1-3 sentences). Reference these pricing tiers: ${summary}. When a visitor asks for a demo, booking link, or calendar invite include ${bookingUrl}. If they request a live agent, escalate through ${humanChannel} and remind them we will follow up within minutes. Confirm the action you're taking.`;

const buildFallbackText = (summary: string) =>
  `Thanks for reaching out. ${summary}. You can book a demo at ${bookingUrl} or we can connect you via ${humanChannel}.`;

const buildOpenAIMessages = (payload: ChatRequestBody, summary: string, tenantContext?: string) => {
  const { message, userType = 'visitor', intent } = payload;
  const systemMessages = [
    { role: 'system', content: buildSystemPrompt(summary) },
    { role: 'system', content: `User type: ${userType}` },
    { role: 'system', content: `Pricing tiers: ${summary}` }
  ];

  if (tenantContext) {
    systemMessages.push({ role: 'system', content: `Tenant context: ${tenantContext}` });
  }

  if (intent) {
    systemMessages.push({ role: 'system', content: `Detected intent: ${intent}` });
  }

  return [...systemMessages, { role: 'user', content: message }];
};

const callOpenAI = async (messages: { role: string; content: string }[]) => {
  if (!env.OPENAI_API_KEY) {
    return null;
  }

  const response = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model: 'gpt-4o-mini',
      temperature: 0.4,
      messages,
      max_tokens: 250
    },
    {
      headers: {
        Authorization: `Bearer ${env.OPENAI_API_KEY}`
      }
    }
  );

  return response.data.choices?.[0]?.message?.content;
};

const notifyLiveAgent = async (meta: Record<string, unknown>, message: string) => {
  try {
    await axios.post(env.SLACK_WEBHOOK_URL, {
      text: `Live agent requested\nMessage: ${message}\nIntent: ${meta.intent ?? 'unknown'}\nTenant: ${meta.tenantId ?? 'n/a'}\nUser: ${
        meta.userId ?? 'anonymous'
      }\nTimestamp: ${meta.timestamp}`
    });
  } catch (error: any) {
    throw error;
  }
};

const sendEmailFollowUp = async (meta: Record<string, unknown>, body: ChatRequestBody) => {
  await sendSalesEmail({
    subject: meta.intent ? `New chatbot follow-up: ${meta.intent}` : 'New chatbot lead',
    body: [
      `Message: ${body.message}`,
      `User type: ${body.userType ?? 'visitor'}`,
      `Tenant: ${body.tenantId ?? 'n/a'}`,
      `User: ${body.userId ?? 'anonymous'}`,
      `Timestamp: ${meta.timestamp ?? new Date().toISOString()}`,
      `Actions: ${meta.actions?.join(', ') ?? 'none'}`
    ].join('\n')
  });
};

const chatbotRoutes: FastifyPluginAsync = async (app) => {
  app.post<{ Body: ChatRequestBody; Reply: ChatResponse }>('/chat', async (request, reply) => {
    const { message, userType = 'visitor', tenantId, intent, userId } = request.body;
    const timestamp = new Date().toISOString();

    if (!message?.trim()) {
      return reply.status(400).send({ text: 'Please ask a question so I can help.' });
    }

    const tiers = await loadPricing();
    const pricingSummary = buildPricingSummary(tiers);
    const tenantConfig = tenantId
      ? await app.prisma.businessConfig.findFirst({
          where: { tenantId },
          select: { businessName: true, industry: true }
        })
      : null;

    const tenantContext = tenantConfig
      ? `${tenantConfig.businessName} (industry: ${tenantConfig.industry ?? 'unknown'})`
      : undefined;

    const openAiMessages = buildOpenAIMessages({ message, userType, intent }, pricingSummary, tenantContext);
    let botText = buildFallbackText(pricingSummary);

    app.log.info(
      {
        tenantId,
        userId,
        intent,
        timestamp,
        message
      },
      'chatbot: request received'
    );

    try {
      const aiContent = await callOpenAI(openAiMessages);
      if (aiContent) {
        botText = aiContent.trim();
      }
    } catch (error: any) {
      app.log.error({ err: error?.message ?? error }, 'chatbot: OpenAI request failed');
    }

    const actions = buildActions(message);
    const meta = {
      tenantId,
      userId,
      intent,
      timestamp,
      actions: actions.map((action) => action.type)
    };

    const backgroundJobs: Promise<void>[] = [];
    if (actions.some((action) => action.type === 'notify_live_agent')) {
      backgroundJobs.push(
        notifyLiveAgent(meta, message).catch((error) => {
          app.log.error({ err: error?.message ?? error }, 'chatbot: notify live agent failed');
        })
      );
    }

    if (actions.some((action) => action.type === 'send_email')) {
      backgroundJobs.push(
        sendEmailFollowUp(meta, request.body).catch((error) => {
          app.log.error({ err: error?.message ?? error }, 'chatbot: send email follow-up failed');
        })
      );
    }

    await Promise.all(backgroundJobs);

    if (tenantId) {
      await app.prisma.auditLog.create({
        data: {
          tenantId,
          category: 'chatbot',
          message: `${userType} asked: ${message}`,
          metadata: meta
        }
      });
    }

    reply
      .header('Access-Control-Allow-Origin', request.headers.origin ?? '*')
      .header('Access-Control-Allow-Credentials', 'true')
      .send({ text: botText, pricing: tiers, actions });
  });
};

export default chatbotRoutes;

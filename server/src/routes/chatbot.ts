import { FastifyPluginAsync } from 'fastify';
import axios from 'axios';

import { env } from '../config/env';
import pricingData from '../config/pricing.json';

interface ChatRequestBody {
  message: string;
  userType?: 'visitor' | 'trial' | 'customer';
  tenantId?: string;
  intent?: string;
}

interface ChatAction {
  type: 'book_demo' | 'send_email' | 'notify_live_agent';
  payload?: Record<string, string>;
}

interface ChatResponse {
  text: string;
  pricing?: typeof pricingData;
  actions?: ChatAction[];
}

const pricingSummary = pricingData
  .map((tier) => `${tier.name} (${tier.price}): ${tier.description}`)
  .join(' | ');

const systemPrompt = `You are Amunet AI's concierge. Answer onboarding, pricing, and booking questions concisely (1-3 sentences). Reference the pricing tiers: ${pricingSummary}. When a visitor asks for a demo, booking link, or calendar invite, include the booking link and invite them to share availability. If they request a live agent, escalate with contact details and tell them a human will follow up. Always confirm the action you are about to take.`;

const bookingUrl = env.CALCOM_BASE_URL
  ? `${env.CALCOM_BASE_URL.replace(/\/+$/, '')}/book/demo`
  : 'https://cal.com/amunet/demo';

const humanChannel = env.SLACK_WEBHOOK_URL
  ? 'Slack'
  : env.TWILIO_SUPPORT_NUMBER
  ? 'Twilio'
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
        channel: humanChannel,
        detail: env.TWILIO_SUPPORT_NUMBER ? `Call or text ${env.TWILIO_SUPPORT_NUMBER}` : 'We will reach out within 15 minutes.'
      }
    });
  }

  if (env.SENDGRID_API_KEY && wantsEmailFollowUp(message)) {
    actions.push({
      type: 'send_email',
      payload: {
        template: 'sales_follow_up'
      }
    });
  }

  return actions;
};

const fallbackText = `Thanks for reaching out. ${pricingSummary}. I can also book a demo at ${bookingUrl} or connect you with ${humanChannel}.`;

const buildOpenAIMessages = (payload: ChatRequestBody, tenantContext?: string) => {
  const { message, userType = 'visitor', intent } = payload;
  const systemMessages = [
    { role: 'system', content: systemPrompt },
    { role: 'system', content: `User type: ${userType}` },
    { role: 'system', content: `Pricing tiers: ${pricingSummary}` }
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

const chatbotRoutes: FastifyPluginAsync = async (app) => {
  app.post<{ Body: ChatRequestBody; Reply: ChatResponse }>('/chat', async (request, reply) => {
    const { message, userType = 'visitor', tenantId, intent } = request.body;

    if (!message?.trim()) {
      return reply.status(400).send({ text: 'Please ask a question so I can help.' });
    }

    const tenantConfig = tenantId
      ? await app.prisma.businessConfig.findFirst({
          where: { tenantId },
          select: { businessName: true, industry: true }
        })
      : null;

    const tenantContext = tenantConfig
      ? `${tenantConfig.businessName} (industry: ${tenantConfig.industry ?? 'unknown'})`
      : undefined;

    const openAiMessages = buildOpenAIMessages({ message, userType, intent }, tenantContext);
    let botText: string = fallbackText;

    try {
      const aiContent = await callOpenAI(openAiMessages);
      if (aiContent) {
        botText = aiContent.trim();
      }
    } catch (error: any) {
      app.log.error({ err: error }, 'chatbot: OpenAI request failed');
    }

    const actions = buildActions(message);

    if (tenantId) {
      await app.prisma.auditLog.create({
        data: {
          tenantId,
          category: 'chatbot',
          message: `${userType} asked: ${message}`
        }
      });
    }

    return reply.send({ text: botText, pricing: pricingData, actions });
  });
};

export default chatbotRoutes;

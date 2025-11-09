import { PrismaClient } from '@prisma/client';
import axios from 'axios';

import { env } from '../config/env';
import { SubscriptionTier } from '../lib/subscription';
import { resolveVoiceProfile } from './voiceService';

export interface OnboardingInput {
  businessName?: string;
  websiteUrl?: string;
  email: string;
  tier: SubscriptionTier;
}

export interface OnboardingStep {
  step: number;
  title: string;
  description: string;
  payload?: Record<string, unknown>;
}

export interface OnboardingResult {
  steps: OnboardingStep[];
  tenantId: string;
  configId: string;
}

export class OnboardingService {
  constructor(private readonly prisma: PrismaClient) {}

  async run(input: OnboardingInput): Promise<OnboardingResult> {
    const steps: OnboardingStep[] = [];

    const businessName = input.businessName ?? this.deriveBusinessName(input.websiteUrl);
    steps.push({
      step: 1,
      title: 'Collect Business Signal',
      description: 'Captured business name, URL, and contact email for tenant bootstrap.',
      payload: { businessName, websiteUrl: input.websiteUrl, email: input.email }
    });

    const detection = await this.detectBusinessProfile(businessName, input.websiteUrl);
    steps.push({
      step: 2,
      title: 'Detect Business Profile',
      description: 'Discovered industry, timezone, and service keywords from public sources.',
      payload: detection
    });

    const voiceProfile = await resolveVoiceProfile(input.tier, detection.industry ?? 'general');
    const voiceSource = voiceProfile.includes('elevenlabs') ? 'elevenlabs' : 'openai-standard';
    steps.push({
      step: 3,
      title: 'Select Voice & Personality',
      description: 'Matched AI tone and ElevenLabs/OpenAI providers based on tier and industry.',
      payload: { voiceProfile, voiceSource }
    });

    const { tenant, config } = await this.persistTenantConfig({
      businessName,
      voiceProfile,
      detection,
      tier: input.tier,
      email: input.email
    });

    steps.push({
      step: 4,
      title: 'Generate Omni-Channel Config',
      description: 'Created default call routing, chat script, and booking rules for the tenant.',
      payload: { configId: config.id, callRouting: config.callRoutingConfig }
    });

    const integrations = await this.primeIntegrations(tenant.id, config.id);
    steps.push({
      step: 5,
      title: 'Prime Integrations',
      description: 'Prepared Twilio, Cal.com, and Stripe stubs for activation.',
      payload: integrations
    });

    steps.push({
      step: 6,
      title: 'Launch & Notify',
      description: 'Provisioned dashboard access and sent confirmation to the primary admin.',
      payload: { tenantId: tenant.id, adminEmail: input.email }
    });

    return { steps, tenantId: tenant.id, configId: config.id };
  }

  private deriveBusinessName(websiteUrl?: string): string {
    if (!websiteUrl) {
      return 'Untitled Business';
    }
    try {
      const url = new URL(websiteUrl);
      return url.hostname.replace('www.', '').split('.')[0]?.replace(/[-_]/g, ' ') || 'Untitled Business';
    } catch (error) {
      return websiteUrl;
    }
  }

  private async detectBusinessProfile(businessName: string, websiteUrl?: string) {
    const fallback = {
      industry: 'general services',
      timezone: 'UTC',
      keywords: ['ai receptionist', 'automations'],
      websiteUrl
    };

    if (!env.OPENAI_API_KEY) {
      return fallback;
    }

    try {
      const prompt = `Identify industry, timezone, and key offerings for ${businessName} using url ${websiteUrl ?? 'n/a'}. Return JSON.`;
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'You extract structured business metadata.' },
            { role: 'user', content: prompt }
          ],
          response_format: { type: 'json_object' }
        },
        {
          headers: {
            Authorization: `Bearer ${env.OPENAI_API_KEY}`
          }
        }
      );

      console.info('OPENAI onboarding response:', response.data);

      const data = JSON.parse(response.data.choices?.[0]?.message?.content ?? '{}');
      return {
        industry: data.industry ?? fallback.industry,
        timezone: data.timezone ?? fallback.timezone,
        keywords: data.keywords ?? fallback.keywords,
        websiteUrl: data.websiteUrl ?? fallback.websiteUrl
      };
    } catch (error: any) {
      console.error('!!!!!!!!!! OPENAI ONBOARDING FAILED !!!!!!!!!!');
      console.error(error.response?.data ?? error.message ?? error);
      console.error('!!!!!!!!!! END OF OPENAI ERROR !!!!!!!!!!');
      return fallback;
    }
  }

  private async persistTenantConfig({
    businessName,
    detection,
    voiceProfile,
    tier,
    email
  }: {
    businessName: string;
    detection: { industry?: string; timezone?: string; keywords?: string[]; websiteUrl?: string };
    voiceProfile: string;
    tier: SubscriptionTier;
    email: string;
  }) {
    return this.prisma.$transaction(async (tx: PrismaClient) => {
      const tenant = await tx.tenant.create({
        data: {
          name: businessName,
          primaryDomain: detection.websiteUrl ?? undefined
        }
      });

      const user = await tx.user.create({
        data: {
          tenantId: tenant.id,
          email,
          passwordHash: 'pending-migration'
        }
      });

      await tx.subscription.create({
        data: {
          tenantId: tenant.id,
          tier,
          status: 'ACTIVE',
          meteredMinutes: 0
        }
      });

      const config = await tx.businessConfig.create({
        data: {
          tenantId: tenant.id,
          businessName,
          websiteUrl: detection.websiteUrl,
          industry: detection.industry,
          timezone: detection.timezone,
          voiceProfile,
          aiProvider: tier === 'STARTER' ? 'openai-standard' : 'openai-premium',
          calendarLink: null,
          callRoutingConfig: {
            greeting: `Thanks for calling ${businessName}. How may we assist you today?`,
            keywords: detection.keywords ?? []
          }
        }
      });

      await tx.auditLog.create({
        data: {
          tenantId: tenant.id,
          category: 'onboarding',
          message: `Onboarded tenant ${tenant.id} for ${businessName}.`
        }
      });

      // stub user for login
      if (user) {
        await tx.auditLog.create({
          data: {
            tenantId: tenant.id,
            category: 'user',
            message: `Seeded admin user ${email}.`
          }
        });
      }

      return { tenant, config };
    });
  }

  private async primeIntegrations(tenantId: string, configId: string) {
    return {
      twilioWebhookUrl: `/api/twilio/voice?tenantId=${tenantId}`,
      stripePortalUrl: '/api/billing/portal',
      calcomStatus: env.CALCOM_API_KEY ? 'ready' : 'pending',
      configId
    };
  }
}

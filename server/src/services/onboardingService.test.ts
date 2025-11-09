import { describe, expect, it, vi, beforeEach } from 'vitest';

import axios from 'axios';
import { env } from '../config/env';
import { createMockPrisma } from '../test-utils/mockPrisma';
import { OnboardingService } from './onboardingService';
import { allowPremiumVoices, resolveVoiceProfile, tierVoiceFor } from './voiceService';

vi.mock('axios', () => ({
  default: {
    post: vi.fn().mockResolvedValue({
      data: {
        choices: [
          {
            message: {
              content: JSON.stringify({
                industry: 'legal services',
                timezone: 'America/New_York',
                keywords: ['law', 'consulting']
              })
            }
          }
        ]
      }
    }),
    get: vi.fn().mockResolvedValue({
      data: {
        voices: [
          { voice_id: 'voice_premium', name: 'Premium Legal', labels: { industry: 'legal services' } }
        ]
      }
    })
  }
}));

describe('voice service', () => {
  it('restricts premium voices to higher tiers', () => {
    expect(allowPremiumVoices('STARTER')).toBe(false);
    expect(allowPremiumVoices('PROFESSIONAL')).toBe(true);
    expect(tierVoiceFor('STARTER', 'Legal')).toContain('nova');
  });

  it('pulls premium voices from ElevenLabs when available', async () => {
    env.ELEVENLABS_API_KEY = 'elevenlabs-key';
    const voice = await resolveVoiceProfile('PROFESSIONAL', 'Legal Services');
    expect(voice).toContain('voice_premium');
    env.ELEVENLABS_API_KEY = undefined;
  });
});

describe('onboarding service', () => {
  beforeEach(() => {
    env.OPENAI_API_KEY = 'test-key';
  });

  it('runs the 6-step onboarding pipeline', async () => {
    const { client, store } = createMockPrisma();
    const service = new OnboardingService(client);
    const result = await service.run({
      businessName: 'Test Co',
      websiteUrl: 'https://test.example',
      email: 'admin@test.com',
      tier: 'STARTER'
    });

    expect(result.steps).toHaveLength(6);
    expect(result.tenantId).toMatch(/tenant_/);
    expect(result.steps[0].title).toBe('Collect Business Signal');
    expect(store.subscription[0]?.tier).toBe('STARTER');
    expect(store.businessConfig[0]?.voiceProfile).toContain('nova');
  });

  it('falls back gracefully when OpenAI fails', async () => {
    const { client } = createMockPrisma();
    const service = new OnboardingService(client);

    (axios.post as any).mockRejectedValueOnce(new Error('boom'));
    env.OPENAI_API_KEY = 'test-key';

    const result = await service.run({
      businessName: undefined,
      websiteUrl: undefined,
      email: 'fallback@test.com',
      tier: 'PROFESSIONAL'
    });

    expect(result.steps[1].payload).toMatchObject({ timezone: 'UTC' });
  });
});
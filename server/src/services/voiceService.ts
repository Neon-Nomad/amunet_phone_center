import axios from 'axios';

import { env } from '../config/env';
import { SubscriptionTier } from '../lib/subscription';

const starterVoices = ['nova', 'alloy'];
const premiumVoices = ['elevenlabs-scarlett', 'elevenlabs-ari'];

export function tierVoiceFor(tier: SubscriptionTier, industry: string): string {
  const normalizedIndustry = industry.toLowerCase();
  const baseVoice = normalizedIndustry.includes('spa') ? 'soothing' : 'confident';
  if (tier === 'STARTER') {
    return `${baseVoice}-${starterVoices[0]}`;
  }
  const voice = premiumVoices[normalizedIndustry.length % premiumVoices.length];
  return `${baseVoice}-${voice}`;
}

export function allowPremiumVoices(tier: SubscriptionTier): boolean {
  return tier === 'PROFESSIONAL' || tier === 'ENTERPRISE';
}

interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  labels?: Record<string, string>;
}

export async function resolveVoiceProfile(
  tier: SubscriptionTier,
  industry: string
): Promise<string> {
  const normalizedIndustry = industry?.toLowerCase() ?? 'general';

  if (!allowPremiumVoices(tier) || !env.ELEVENLABS_API_KEY) {
    return tierVoiceFor(tier, normalizedIndustry);
  }

  try {
    const response = await axios.get<{ voices?: ElevenLabsVoice[] }>('https://api.elevenlabs.io/v1/voices', {
      headers: {
        'xi-api-key': env.ELEVENLABS_API_KEY
      }
    });

    const voices = response.data?.voices ?? [];
    const match =
      voices.find((voice) => voice.labels?.industry?.toLowerCase() === normalizedIndustry) ??
      voices.find((voice) => voice.name.toLowerCase().includes(normalizedIndustry)) ??
      voices[0];

    if (match?.voice_id) {
      const persona = normalizedIndustry.includes('spa') ? 'soothing' : 'confident';
      return `${persona}-elevenlabs-${match.voice_id}`;
    }
  } catch (error) {
    // swallow errors and fall back to deterministic voice mapping
  }

  return tierVoiceFor(tier, normalizedIndustry);
}
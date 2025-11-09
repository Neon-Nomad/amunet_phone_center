export interface PricingTier {
  name: 'Starter' | 'Professional' | 'Enterprise';
  price: string;
  description: string;
  features: string[];
}

export const pricingTiers: PricingTier[] = [
  {
    name: 'Starter',
    price: '$197/mo',
    description: 'Solo founders getting their first AI receptionist online.',
    features: ['1 phone number', 'Standard voices', 'Up to 500 call minutes', 'Calendar sync']
  },
  {
    name: 'Professional',
    price: '$497/mo',
    description: 'Growing teams automating intake, triage, and scheduling.',
    features: ['3 phone numbers', 'Premium voices', 'Unlimited chat widget', 'Advanced routing']
  },
  {
    name: 'Enterprise',
    price: 'Talk to sales',
    description: 'Scaled operations with compliance, analytics, and custom SLAs.',
    features: ['Dedicated success manager', 'ElevenLabs premium voices', 'SOC2-ready logging', 'Custom integrations']
  }
];
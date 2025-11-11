export interface PricingTier {
  name: 'Starter' | 'Growth' | 'Enterprise';
  price: string;
  tagline: string;
  audience: string;
  features: string[];
  cta: string;
}

export const pricingTiers: PricingTier[] = [
  {
    name: 'Starter',
    price: '$497/mo',
    tagline: 'Best for solo professionals',
    audience: 'Single-location dentists, electricians, or HVAC techs starting automation.',
    features: [
      '1 phone number',
      'Up to 1,000 call minutes',
      'Standard voices',
      'SMS + email notifications',
      'Calendar sync',
      '14-day free trial'
    ],
    cta: 'Start Free Trial'
  },
  {
    name: 'Growth',
    price: '$997/mo',
    tagline: 'Scale your scheduling power',
    audience: 'Multi-staff offices or crews ready to replace missed calls.',
    features: [
      '3 phone numbers',
      'Up to 3,000 call minutes',
      'Premium ElevenLabs voices',
      'Advanced call routing',
      'Missed-call ? SMS recovery',
      'Team analytics dashboard',
      '14-day free trial'
    ],
    cta: 'Start Free Trial'
  },
  {
    name: 'Enterprise',
    price: 'Custom pricing',
    tagline: 'Built for complex operations',
    audience: 'Franchises or multi-location businesses needing compliance and integrations.',
    features: [
      'Unlimited phone numbers',
      'Usage-based minutes',
      'SOC2-ready logging',
      'Dedicated success manager',
      'Custom integrations (CRM, Slack, Zapier)',
      '14-day proof-of-concept trial'
    ],
    cta: 'Talk to Sales'
  }
];

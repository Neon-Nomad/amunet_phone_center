import { pricingTiers } from '../lib/pricing';

export default function Pricing() {
  return (
    <section id="pricing" className="bg-dark py-24 text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-12 px-6">
        <div className="max-w-xl space-y-4 text-center md:mx-auto">
          <h2 className="font-display text-3xl font-semibold md:text-4xl">Predictable pricing with clear upgrade paths</h2>
          <p className="text-white/70">
            Choose the plan that fits your operation today. Upgrade whenever you need premium voices, deeper analytics,
            or managed support.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {pricingTiers.map((tier) => (
            <div key={tier.name} className="flex flex-col rounded-2xl border border-white/10 bg-white/5 p-6 text-left">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-xl text-white">{tier.name}</h3>
                <span className="text-xs uppercase tracking-[0.3em] text-accent">{tier.name === 'Starter' ? 'Best for solo' : tier.name === 'Professional' ? 'Scale teams' : 'Custom'}</span>
              </div>
              <p className="mt-3 text-3xl font-semibold text-white">{tier.price}</p>
              <p className="mt-2 text-sm text-white/70">{tier.description}</p>
              <ul className="mt-6 space-y-3 text-sm text-white/80">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <span className="mt-1 h-2 w-2 rounded-full bg-accent" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <a
                href="/dashboard"
                className="mt-8 inline-flex justify-center rounded-full border border-accent px-4 py-2 text-sm font-semibold text-accent hover:bg-accent/10"
              >
                Start onboarding
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
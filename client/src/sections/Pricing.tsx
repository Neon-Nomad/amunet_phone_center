import { pricingTiers } from '../lib/pricing';

const tierAccent = {
  Starter: 'from-indigo-500/60 to-purple-500/40',
  Growth: 'from-violet-500/60 to-indigo-600/40',
  Enterprise: 'from-slate-700/60 to-indigo-900/40'
};

export default function Pricing() {
  return (
    <section
      id="pricing"
      className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 py-24 text-white"
    >
      <div className="absolute inset-0 opacity-30" aria-hidden="true">
        <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-indigo-500 blur-3xl" />
        <div className="absolute left-0 bottom-0 h-72 w-72 rounded-full bg-purple-500/60 blur-3xl" />
      </div>
      <div className="relative mx-auto flex max-w-6xl flex-col gap-10 px-6">
        <div className="max-w-2xl space-y-4 text-center md:mx-auto">
          <p className="text-sm uppercase tracking-[0.4em] text-indigo-300/80">AI receptionist</p>
          <h2 className="font-display text-4xl font-bold text-white md:text-5xl">Premium plans for confident teams</h2>
          <p className="text-lg text-white/70">
            Built for founders who want an AI receptionist that sounds like humanity, answers with precision, and backs
            every response with iron-clad guarantees.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {pricingTiers.map((tier) => (
            <article
              key={tier.name}
              className="flex h-full flex-col justify-between gap-6 rounded-[32px] border border-white/15 bg-slate-900/70 p-6 shadow-2xl shadow-indigo-900/30 backdrop-blur-xl transition duration-300 hover:-translate-y-1"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-2xl font-semibold">{tier.name}</h3>
                  <span className="rounded-full border border-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
                    {tier.name === 'Enterprise' ? 'Custom' : 'Live now'}
                  </span>
                </div>
                <p className="text-sm uppercase tracking-widest text-indigo-300">{tier.tagline}</p>
                <p className="text-4xl font-bold text-white">{tier.price}</p>
                <p className="text-sm text-white/70">{tier.audience}</p>
                <ul className="space-y-3 text-sm text-white/80">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <span
                        className={`mt-1 h-2 w-2 rounded-full bg-gradient-to-br ${tierAccent[tier.name as keyof typeof tierAccent]} `}
                      />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="space-y-3">
                <a
                  className="inline-flex w-full items-center justify-center rounded-full border border-indigo-500/60 bg-gradient-to-r from-indigo-500/70 to-purple-500/60 px-5 py-3 text-sm font-semibold uppercase tracking-wide text-white shadow-lg shadow-indigo-900/50 transition hover:scale-[1.02]"
                  href={tier.name === 'Enterprise' ? '#contact' : '/dashboard'}
                >
                  {tier.cta}
                </a>
                <p className="text-center text-xs text-white/60">14-day risk-free trial</p>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-4 rounded-[32px] border border-white/20 bg-gradient-to-br from-slate-900/80 to-indigo-900/60 p-8 shadow-[0_25px_60px_rgba(79,70,229,0.4)] backdrop-blur-3xl">
          <div className="flex flex-col gap-4 text-center md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-indigo-300/70">Guarantee</p>
              <h3 className="font-display text-3xl font-bold text-white">One-Time 21-Day Lead Guarantee</h3>
              <p className="mt-2 text-sm text-white/70">
                You get 14 days free, then 7 paid days backed by our “Book-1-or-Refund” promise. If Amunet doesn’t help
                you book at least one new client in 21 days, you don’t pay. After that, normal monthly billing applies—
                because by then, Amunet should already be earning her keep.
              </p>
            </div>
            <div className="md:text-right">
              <a
                className="mt-4 inline-flex items-center justify-center rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 px-6 py-3 text-sm font-semibold uppercase tracking-wider text-white shadow-xl shadow-purple-900/60 transition hover:scale-105 md:mt-0"
                href="/dashboard"
              >
                Start Free Trial
              </a>
              <p className="mt-2 text-xs text-white/60">Start with risk-free lead capture in minutes.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

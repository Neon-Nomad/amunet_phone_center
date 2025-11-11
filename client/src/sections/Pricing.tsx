import { pricingTiers } from '../lib/pricing';

const tierAccent = {
  Starter: 'from-indigo-500/60 to-purple-500/40',
  Growth: 'from-violet-500/60 to-indigo-600/40',
  Enterprise: 'from-slate-700/60 to-indigo-900/40'
};

export default function Pricing() {
  return (
    <section id="pricing" className="bg-transparent py-24 text-slate-900">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6">
        <div className="max-w-2xl space-y-4 text-center md:mx-auto">
          <p className="text-sm uppercase tracking-[0.4em] text-slate-400">AI receptionist</p>
          <h2 className="font-display text-4xl font-bold text-slate-900 md:text-5xl">Premium plans for confident teams</h2>
          <p className="text-lg text-slate-500">
            Built for founders who want an AI receptionist that sounds like humanity, answers with precision, and backs
            every response with iron-clad guarantees.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {pricingTiers.map((tier) => (
            <article
              key={tier.name}
              className="flex h-full flex-col justify-between gap-6 rounded-[32px] border border-slate-200 bg-white p-6 shadow-lg shadow-slate-100 transition duration-300 hover:-translate-y-1"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-2xl font-semibold text-slate-900">{tier.name}</h3>
                  <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    {tier.name === 'Enterprise' ? 'Custom' : 'Live now'}
                  </span>
                </div>
                <p className="text-sm uppercase tracking-widest text-[#6c4bff]">{tier.tagline}</p>
                <p className="text-4xl font-bold text-slate-900">{tier.price}</p>
                <p className="text-sm text-slate-500">{tier.audience}</p>
                <ul className="space-y-3 text-sm text-slate-600">
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
                  className="inline-flex w-full items-center justify-center rounded-full border border-[#6c4bff] bg-gradient-to-r from-[#6c4bff] to-[#7f5dff] px-5 py-3 text-sm font-semibold uppercase tracking-wide text-white shadow-lg shadow-[#6c4bff]/30 transition hover:scale-[1.02]"
                  href={tier.name === 'Enterprise' ? '#contact' : '/dashboard'}
                >
                  {tier.cta}
                </a>
                <p className="text-center text-xs text-slate-500">14-day risk-free trial</p>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-4 rounded-[32px] border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200">
          <div className="flex flex-col gap-4 text-center md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-[#6c4bff]">Guarantee</p>
              <h3 className="font-display text-3xl font-bold text-slate-900">One-Time 21-Day Lead Guarantee</h3>
              <p className="mt-2 text-sm text-slate-500">
                You get 14 days free, then 7 paid days backed by our "Book-1-or-Refund" promise. If Amunet doesn't help
                you book at least one new client in 21 days, you don't pay. After that, normal monthly billing applies—
                because by then, Amunet should already be earning her keep.
              </p>
            </div>
            <div className="md:text-right">
              <a
                className="mt-4 inline-flex items-center justify-center rounded-full bg-[#6c4bff] px-6 py-3 text-sm font-semibold uppercase tracking-wider text-white shadow-xl shadow-[#6c4bff]/40 transition hover:scale-105 md:mt-0"
                href="/dashboard"
              >
                Start Free Trial
              </a>
              <p className="mt-2 text-xs text-slate-500">Start with risk-free lead capture in minutes.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

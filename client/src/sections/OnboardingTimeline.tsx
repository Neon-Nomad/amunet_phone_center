const steps = [
  { title: 'Signal Intake', description: 'Enter business name or URL to auto-detect your footprint.' },
  { title: 'Profile Detection', description: 'We enrich industry, services, hours, and compliance signals.' },
  { title: 'Voice & Tone', description: 'Choose a voice template that mirrors your brand and tier.' },
  { title: 'Config Generation', description: 'Amunet builds call flows, chat widgets, and knowledge base stubs.' },
  { title: 'Integration Sync', description: 'Connect Twilio, Cal.com, Stripe, and optional CRMs instantly.' },
  { title: 'Launch & Monitor', description: 'Deploy numbers, widget snippets, and dashboards with real-time logs.' }
];

export default function OnboardingTimeline() {
  return (
    <section id="how-it-works" className="bg-transparent py-24 text-slate-900">
      <div className="mx-auto max-w-6xl px-6">
        <div className="max-w-2xl space-y-4">
          <h2 className="font-display text-3xl font-semibold md:text-4xl">Six steps from sign-up to your live AI receptionist</h2>
          <p className="text-slate-500">
            The onboarding assistant handles everything with guardrails for compliance and premium voice eligibility.
          </p>
        </div>
        <ol className="mt-12 grid gap-10 md:grid-cols-3">
          {steps.map((step, index) => (
            <li key={step.title} className="relative rounded-2xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-100">
              <div className="absolute -top-4 left-6 flex h-8 w-8 items-center justify-center rounded-full bg-[#6c4bff] text-sm font-semibold text-white">
                {index + 1}
              </div>
              <h3 className="mt-6 font-display text-lg text-slate-900">{step.title}</h3>
              <p className="mt-3 text-sm text-slate-500">{step.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

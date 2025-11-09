import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';

export default function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 120]);

  return (
    <section ref={ref} className="relative isolate overflow-hidden bg-dark pt-32 text-white">
      <motion.div
        style={{ y }}
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_#6C4CF533,_transparent_60%)]"
      />
      <div className="relative mx-auto flex max-w-6xl flex-col items-start gap-10 px-6 pb-24">
        <span className="rounded-full border border-white/10 px-4 py-1 text-xs uppercase tracking-[0.2em] text-white/60">
          Launch-ready in 5 minutes
        </span>
        <div className="max-w-2xl space-y-6">
          <h1 className="font-display text-5xl font-semibold leading-tight md:text-6xl">
            The AI receptionist that answers, books, and delights in under five minutes.
          </h1>
          <p className="text-lg text-white/70">
            Amunet AI auto-onboards your business, deploys voice + chat agents, syncs calendars, and enforces billing
            in a single flow. No engineers required.
          </p>
          <div className="flex flex-wrap gap-4">
            <a
              href="#pricing"
              className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white shadow-xl shadow-primary/30"
            >
              Explore Pricing
            </a>
            <a href="#how-it-works" className="rounded-full border border-white/20 px-6 py-3 text-sm text-white/80">
              See the 6-step onboarding
            </a>
          </div>
        </div>
        <div className="grid w-full gap-4 md:grid-cols-3">
          {[
            { title: 'AI call answering', description: 'Natural conversations, CRM-ready transcripts, smart routing.' },
            { title: 'Instant scheduling', description: 'Synced with Cal.com, calendar aware, voice or chat triggered.' },
            { title: 'SaaS native', description: 'Multi-tenant, usage-based billing, Stripe connected by default.' }
          ].map((item) => (
            <div key={item.title} className="rounded-2xl border border-white/5 bg-white/5 p-6 backdrop-blur">
              <h3 className="font-display text-lg text-white">{item.title}</h3>
              <p className="mt-2 text-sm text-white/70">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
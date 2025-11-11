import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { Link } from 'react-router-dom';

export default function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 120]);

  return (
    <section ref={ref} className="relative isolate overflow-hidden bg-white pt-32 text-slate-900">
      <motion.div
        style={{ y }}
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(124,58,237,0.25),_transparent_50%)]"
      />
      <div className="relative mx-auto flex max-w-6xl flex-col items-start gap-10 px-6 pb-24">
        <span className="rounded-full border border-slate-200 px-4 py-1 text-xs uppercase tracking-[0.2em] text-slate-500">
          Launch-ready in 5 minutes
        </span>
        <div className="max-w-2xl space-y-6">
          <h1 className="font-display text-5xl font-semibold leading-tight md:text-6xl">
            The AI receptionist that answers, books, and delights in under five minutes.
          </h1>
          <p className="text-lg text-slate-500">
            Amunet AI auto-onboards your business, deploys voice + chat agents, syncs calendars, and enforces billing
            in a single flow. No engineers required.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              to="/signup"
              className="rounded-full bg-[#6c4bff] px-6 py-3 text-sm font-semibold text-white shadow-xl shadow-[#6c4bff]/30"
            >
              Start free trial
            </Link>
            <a href="#pricing" className="rounded-full border border-slate-200 px-6 py-3 text-sm text-slate-500">
              Explore pricing
            </a>
            <a href="#how-it-works" className="rounded-full border border-slate-200 px-6 py-3 text-sm text-slate-500">
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
            <div key={item.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-100">
              <h3 className="font-display text-lg text-slate-900">{item.title}</h3>
              <p className="mt-2 text-sm text-slate-500">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

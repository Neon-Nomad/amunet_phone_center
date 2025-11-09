import { motion } from 'framer-motion';

const cards = [
  {
    title: 'AI Call Answering',
    description: 'Twilio + ElevenLabs voice flows trained on your brand script.',
    detail: 'Real-time transcription, CRM sync, escalation logic.'
  },
  {
    title: 'Automated Scheduling',
    description: 'Cal.com blocks, reminders, and confirmations without a human.',
    detail: 'Multi-calendar awareness and fallback SMS/email invites.'
  },
  {
    title: 'Onboarding Automation',
    description: 'Detect business info, train tone, wire billing in minutes.',
    detail: 'Six guided steps deploy phone, chat, analytics, and reporting.'
  },
  {
    title: 'Multi-tenant SaaS',
    description: 'Tenants isolated by default with audit logs and rate limits.',
    detail: 'Stripe enforced plans, per-tenant configs, SOC2-ready logs.'
  }
];

export default function PlatformShowcase() {
  return (
    <section id="platform" className="bg-dark py-24 text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-12 px-6">
        <div className="max-w-2xl space-y-4">
          <h2 className="font-display text-3xl font-semibold md:text-4xl">Everything you need to launch an AI front desk</h2>
          <p className="text-white/70">
            Amunet orchestrates best-in-class providers under one control panel. Every module is API-first, audited, and
            ready for scale.
          </p>
        </div>
        <div className="overflow-x-auto pb-6">
          <div className="flex min-w-full gap-6">
            {cards.map((card, index) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ delay: index * 0.1 }}
                className="min-w-[260px] flex-1 rounded-2xl border border-white/5 bg-gradient-to-br from-white/10 to-white/5 p-6"
              >
                <h3 className="font-display text-xl text-white">{card.title}</h3>
                <p className="mt-3 text-sm text-white/80">{card.description}</p>
                <p className="mt-6 text-xs uppercase tracking-[0.2em] text-accent">{card.detail}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
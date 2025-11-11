import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { buildApiUrl } from '../lib/apiBase';

const initialForm = { name: '', email: '', message: '' };

type FormStatus = 'idle' | 'sending' | 'success' | 'error';

export default function ContactPage() {
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState<FormStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const handleChange = (field: keyof typeof form) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.name || !form.email || !form.message) {
      setError('Please complete every field.');
      return;
    }

    setStatus('sending');
    setError(null);

    try {
      const response = await fetch(buildApiUrl('/api/email'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      setForm(initialForm);
      setStatus('success');
    } catch (err) {
      console.error(err);
      setStatus('error');
      setError('Unable to send the message right now. Please try again in a moment.');
    }
  };

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-4xl flex-col justify-center px-6 py-24 text-white">
      <h1 className="font-display text-4xl font-bold text-white">Talk with Amunet</h1>
      <p className="mt-3 text-lg text-white/70">
        Questions about onboarding, pricing, or something custom? Drop us a line and we will reply within one business day.
      </p>
      <form onSubmit={handleSubmit} className="mt-10 space-y-4 rounded-[32px] bg-white/5 p-8 shadow-2xl shadow-indigo-900/40">
        <div>
          <label className="text-sm text-white/70">Name</label>
          <input
            value={form.name}
            onChange={handleChange('name')}
            className="mt-2 w-full rounded-xl border border-white/10 bg-transparent px-4 py-3 text-sm text-white"
            placeholder="Jordan Lee"
          />
        </div>
        <div>
          <label className="text-sm text-white/70">Email</label>
          <input
            type="email"
            value={form.email}
            onChange={handleChange('email')}
            className="mt-2 w-full rounded-xl border border-white/10 bg-transparent px-4 py-3 text-sm text-white"
            placeholder="you@business.com"
          />
        </div>
        <div>
          <label className="text-sm text-white/70">Message</label>
          <textarea
            value={form.message}
            onChange={handleChange('message')}
            rows={4}
            className="mt-2 w-full rounded-xl border border-white/10 bg-transparent px-4 py-3 text-sm text-white"
            placeholder="Tell us how we can help."
          />
        </div>
        {error && <p className="text-xs text-rose-300">{error}</p>}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <button
            type="submit"
            disabled={status === 'sending'}
            className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white shadow-lg shadow-indigo-900/60 transition hover:brightness-110 disabled:cursor-wait disabled:opacity-60"
          >
            {status === 'sending' ? 'Sending…' : 'Send message'}
          </button>
          {status === 'success' && <p className="text-xs text-emerald-300">Message sent! We will follow up shortly.</p>}
        </div>
      </form>
    </div>
  );
}

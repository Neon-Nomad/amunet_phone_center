import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage('Login is coming soon. We will email you once the dashboard is live.');
  };

  const handleChange = (field: keyof typeof form) => (event: ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#030712] px-6 text-white">
      <div className="w-full max-w-md space-y-6 rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-indigo-900/40 backdrop-blur">
        <h1 className="text-3xl font-bold">Login</h1>
        <p className="text-sm text-white/70">Secure access for tenants and admins. Coming soon.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs uppercase tracking-[0.4em] text-white/50">Email</label>
            <input
              value={form.email}
              onChange={handleChange('email')}
              className="mt-2 w-full rounded-xl border border-white/10 bg-transparent px-4 py-3 text-sm text-white"
              placeholder="you@business.com"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-[0.4em] text-white/50">Password</label>
            <input
              type="password"
              value={form.password}
              onChange={handleChange('password')}
              className="mt-2 w-full rounded-xl border border-white/10 bg-transparent px-4 py-3 text-sm text-white"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 px-4 py-3 text-sm font-semibold uppercase tracking-wide text-white transition hover:brightness-110"
          >
            Request access
          </button>
        </form>
        {message && <p className="text-xs text-emerald-300">{message}</p>}
      </div>
    </div>
  );
}

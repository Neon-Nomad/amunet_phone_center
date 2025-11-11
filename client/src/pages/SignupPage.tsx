import type { ChangeEvent, FormEvent } from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function SignupPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', tenantName: '' });
  const [status, setStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string | null>(null);

  const handleChange = (field: keyof typeof form) => (event: ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status === 'pending') return;
    setStatus('pending');
    setMessage(null);

    try {
      await axios.post('/api/auth/register', {
        email: form.email,
        password: form.password,
        tenantName: form.tenantName
      });

      const loginResponse = await axios.post('/api/auth/login', {
        email: form.email,
        password: form.password
      });

      const tenantId = loginResponse.data?.tenantId;
      if (!tenantId) {
        throw new Error('Missing tenant identifier');
      }

      window.localStorage.setItem('amunet-tenant', JSON.stringify({ tenantId }));
      setStatus('success');
      navigate('/dashboard');
    } catch (error: any) {
      setStatus('error');
      setMessage(error.response?.data?.error ?? error.message ?? 'Unable to create an account.');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#030712] px-6 text-white">
      <div className="w-full max-w-md space-y-8 rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-indigo-900/40 backdrop-blur">
        <h1 className="text-3xl font-bold">Auto-Onboard My Business</h1>
        <p className="text-sm text-white/70">Create an account and launch your AI receptionist in minutes.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="tenantName" className="text-xs uppercase tracking-[0.4em] text-white/50">
              Business name
            </label>
            <input
              id="tenantName"
              value={form.tenantName}
              onChange={handleChange('tenantName')}
              className="mt-2 w-full rounded-xl border border-white/10 bg-transparent px-4 py-3 text-sm text-white"
              placeholder="My Business, LLC"
              required
            />
          </div>
          <div>
            <label htmlFor="email" className="text-xs uppercase tracking-[0.4em] text-white/50">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={form.email}
              onChange={handleChange('email')}
              className="mt-2 w-full rounded-xl border border-white/10 bg-transparent px-4 py-3 text-sm text-white"
              placeholder="you@business.com"
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="text-xs uppercase tracking-[0.4em] text-white/50">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={form.password}
              onChange={handleChange('password')}
              className="mt-2 w-full rounded-xl border border-white/10 bg-transparent px-4 py-3 text-sm text-white"
              placeholder="Strong password"
              minLength={8}
              required
            />
          </div>
          <button
            type="submit"
            disabled={status === 'pending'}
            className="w-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 px-4 py-3 text-sm font-semibold uppercase tracking-wide text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {status === 'pending' ? 'Setting up your AI...' : 'Start free trial'}
          </button>
          {message && <p className="text-xs text-emerald-300">{message}</p>}
        </form>
      </div>
    </div>
  );
}

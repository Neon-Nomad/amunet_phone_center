import { FormEvent, useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';

interface DashboardContext {
  tenant: { tenantId: string } | null;
  axios: typeof import('axios');
}

interface ConfigResponse {
  voiceProfile: string;
  aiProvider: string;
  calendarLink: string | null;
}

export default function SettingsPage() {
  const { tenant, axios } = useOutletContext<DashboardContext>();
  const [config, setConfig] = useState<ConfigResponse | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await axios.get<ConfigResponse>('/api/config', {
          headers: { 'x-tenant-id': tenant?.tenantId ?? 'demo-tenant' }
        });
        setConfig(response.data);
      } catch (error) {
        setConfig({ voiceProfile: 'confident-nova', aiProvider: 'openai-standard', calendarLink: null });
      }
    };
    load();
  }, [axios, tenant?.tenantId]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!config) return;
    try {
      await axios.put(
        '/api/config',
        {
          voiceProfile: config.voiceProfile,
          aiProvider: config.aiProvider,
          calendarLink: config.calendarLink
        },
        { headers: { 'x-tenant-id': tenant?.tenantId ?? 'demo-tenant' } }
      );
      setMessage('Settings saved. Premium voice rules enforced automatically.');
    } catch (error: any) {
      setMessage(error.response?.data?.error ?? 'Failed to save settings.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      <div>
        <label className="text-sm text-white/60">Voice profile</label>
        <input
          value={config?.voiceProfile ?? ''}
          onChange={(event) => setConfig((prev) => (prev ? { ...prev, voiceProfile: event.target.value } : prev))}
          className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white"
          placeholder="confident-nova"
        />
      </div>
      <div>
        <label className="text-sm text-white/60">AI provider</label>
        <input
          value={config?.aiProvider ?? ''}
          onChange={(event) => setConfig((prev) => (prev ? { ...prev, aiProvider: event.target.value } : prev))}
          className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white"
          placeholder="openai-standard"
        />
      </div>
      <div>
        <label className="text-sm text-white/60">Calendar link</label>
        <input
          value={config?.calendarLink ?? ''}
          onChange={(event) => setConfig((prev) => (prev ? { ...prev, calendarLink: event.target.value } : prev))}
          className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white"
          placeholder="https://cal.com/your-team"
        />
      </div>
      <button type="submit" className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white">
        Save settings
      </button>
      {message ? <p className="text-sm text-accent">{message}</p> : null}
    </form>
  );
}

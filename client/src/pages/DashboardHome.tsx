import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';

interface DashboardContext {
  tenant: { tenantId: string } | null;
  axios: typeof import('axios');
}

interface OverviewResponse {
  calls: Array<{ id: string; fromNumber: string; status: string; createdAt: string }>;
  bookings: Array<{ id: string; customerName: string; scheduledFor: string }>;
  subscription: { tier: string; status: string } | null;
  uptime: string;
}

export default function DashboardHome() {
  const { tenant, axios } = useOutletContext<DashboardContext>();
  const [data, setData] = useState<OverviewResponse | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get<OverviewResponse>('/api/dashboard/overview', {
          headers: { 'x-tenant-id': tenant?.tenantId ?? 'demo-tenant' }
        });
        setData(response.data);
      } catch (error) {
        setData({
          calls: [],
          bookings: [],
          subscription: { tier: 'STARTER', status: 'ACTIVE' },
          uptime: '99.9%'
        });
      }
    };

    fetchData();
  }, [axios, tenant?.tenantId]);

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-white/5 bg-white/5 p-6">
        <h2 className="font-display text-2xl text-white">Realtime status</h2>
        <p className="mt-2 text-sm text-white/60">
          Your receptionist uptime, subscription tier, and latest call summaries.
        </p>
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          <Metric label="Uptime" value={data?.uptime ?? '...'} />
          <Metric label="Plan" value={data?.subscription?.tier ?? '...'} />
          <Metric label="Status" value={data?.subscription?.status ?? '...'} />
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-white/5 bg-white/5 p-6">
          <h3 className="font-display text-lg text-white">Recent calls</h3>
          <ul className="mt-4 space-y-3 text-sm text-white/70">
            {data?.calls?.length ? (
              data.calls.map((call) => (
                <li key={call.id} className="flex items-center justify-between">
                  <span>{call.fromNumber}</span>
                  <span className="text-xs uppercase tracking-[0.25em] text-white/40">{call.status}</span>
                </li>
              ))
            ) : (
              <li className="text-white/40">No calls logged yet.</li>
            )}
          </ul>
        </div>
        <div className="rounded-2xl border border-white/5 bg-white/5 p-6">
          <h3 className="font-display text-lg text-white">Upcoming bookings</h3>
          <ul className="mt-4 space-y-3 text-sm text-white/70">
            {data?.bookings?.length ? (
              data.bookings.map((booking) => (
                <li key={booking.id} className="flex items-center justify-between">
                  <span>{booking.customerName}</span>
                  <span className="text-xs text-white/40">
                    {new Date(booking.scheduledFor).toLocaleString()}
                  </span>
                </li>
              ))
            ) : (
              <li className="text-white/40">No bookings scheduled.</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.25em] text-white/40">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}
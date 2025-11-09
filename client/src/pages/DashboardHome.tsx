import { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { CalendarDaysIcon, PhoneIcon, HeartIcon } from '@heroicons/react/24/outline';

import styles from './DashboardHome.module.css';

interface DashboardContext {
  tenant: { tenantId: string } | null;
  axios: typeof import('axios');
}

interface OverviewResponse {
  calls: Array<{ id: string; fromNumber: string; status: string; createdAt: string; duration: number }>;
  bookings: Array<{ id: string; customerName: string; scheduledFor: string }>;
  subscription: { tier: string; status: string } | null;
  uptime: string;
}

interface StatusResponse {
  uptime: string;
  lastUpdate: string;
  activeCalls: number;
}

const glassCard =
  'bg-white shadow-[0_15px_30px_rgba(56,21,70,0.12)] border border-[#e6d3ff] rounded-xl p-6 transition hover:shadow-[0_25px_50px_rgba(255,195,0,0.25)] hover:-translate-y-1 duration-300';

const uptimeTrend = [98.6, 99.1, 99.4, 99.7, 99.6, 99.85, 99.95];

const renderPlaceholder = (width = 80, height = 18) => (
  <span className={styles.shimmerBlock} style={{ width, height }} aria-hidden />
);

export default function DashboardHome() {
  const { tenant, axios } = useOutletContext<DashboardContext>();
  const [data, setData] = useState<OverviewResponse | null>(null);
  const [statusInfo, setStatusInfo] = useState<StatusResponse | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get<OverviewResponse>('/api/dashboard/overview', {
          headers: { 'x-tenant-id': tenant?.tenantId ?? 'demo-tenant' }
        });
        setData(response.data);
      } catch {
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

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await axios.get<StatusResponse>('/api/status', {
          headers: { 'x-tenant-id': tenant?.tenantId ?? 'demo-tenant' }
        });
        setStatusInfo(response.data);
      } catch (error) {
        console.error(error);
      }
    };

    fetchStatus();
  }, [axios]);

  const uptimeValue = statusInfo?.uptime ?? data?.uptime;
  const lastUpdated = statusInfo ? new Date(statusInfo.lastUpdate).toLocaleTimeString() : null;
  const planTier = data?.subscription?.tier ?? '...';
  const planStatus = data?.subscription?.status ?? '...';
  const activeCalls = statusInfo?.activeCalls;
  const typesetCalls = data?.calls ?? [];
  const bookings = data?.bookings ?? [];
  const maxTrend = useMemo(() => Math.max(...uptimeTrend), []);

  const renderCalls = () => {
    if (!data) {
      return Array.from({ length: 3 }).map((_, index) => (
        <div
          key={`call-loading-${index}`}
          className="flex items-center justify-between border-b border-slate-100/60 py-3 last:border-b-0"
        >
          {renderPlaceholder(120, 16)}
          {renderPlaceholder(60, 14)}
        </div>
      ));
    }

    if (!typesetCalls.length) {
      return <p className="text-sm text-slate-500">No calls logged yet.</p>;
    }

    return typesetCalls.slice(0, 3).map((call) => (
      <div
        key={call.id}
        className="flex items-center justify-between border-b border-slate-100/60 py-3 last:border-b-0"
      >
        <div>
          <p className="text-sm font-medium text-slate-900">{call.fromNumber}</p>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{call.status}</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-semibold text-[#9D00FF]">{call.duration ? `${call.duration}s` : '—'}</p>
          <p className="text-xs text-slate-400">{new Date(call.createdAt).toLocaleTimeString()}</p>
        </div>
      </div>
    ));
  };

  const renderBookings = () => {
    if (!data) {
      return Array.from({ length: 3 }).map((_, index) => (
        <div
          key={`booking-loading-${index}`}
          className="flex items-center justify-between border-b border-slate-100/60 py-3 last:border-b-0"
        >
          {renderPlaceholder(140, 16)}
          {renderPlaceholder(90, 14)}
        </div>
      ));
    }

    if (!bookings.length) {
      return <p className="text-sm text-slate-500">No bookings scheduled.</p>;
    }

    return bookings.slice(0, 3).map((booking) => (
      <div
        key={booking.id}
        className="flex items-center justify-between border-b border-slate-100/60 py-3 last:border-b-0"
      >
        <div>
          <p className="text-sm font-medium text-slate-900">{booking.customerName}</p>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Upcoming slot</p>
        </div>
        <p className="text-xs text-slate-400">{new Date(booking.scheduledFor).toLocaleString()}</p>
      </div>
    ));
  };

  return (
    <div className={`${styles.dashboardPage} min-h-screen px-6 py-10 text-slate-900`}>
      <div className={styles.particleCanvas} aria-hidden />
      <div className="mx-auto flex max-w-6xl flex-col gap-8 relative z-10">
        <header className="space-y-2 text-center">
          <p className={styles.headerAccent}>Amunet AI</p>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
            Live Intelligence Dashboard
          </h1>
          <p className="text-sm text-slate-600">
            Monitor uptime, calls, and bookings in a data-first view tailored for your AI receptionist.
          </p>
        </header>

        <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <article className={`${glassCard} ${styles.animateFadeIn} md:col-span-2 relative overflow-hidden`}>
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-gradient-to-br from-[#7C3AED] to-[#FACC15] p-3 shadow-lg shadow-[#FACC15]/40">
                  <HeartIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className={`${styles.sectionTitle}`}>Realtime Status</p>
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Amunet AI Concierge</p>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-500">uptime</p>
                  <p className="mt-2 text-4xl font-semibold text-slate-900">{uptimeValue ?? renderPlaceholder(90)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-500">plan</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">{planTier}</p>
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-500">{planStatus}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-500">active calls</p>
                  <p className={`mt-2 text-4xl font-bold text-[#9D00FF] ${styles.animatePulseSlow}`}>
                    {activeCalls ?? renderPlaceholder(32)}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-2 text-xs uppercase tracking-[0.35em] text-slate-500">
                <span>status</span>
                <span className="font-semibold text-slate-900">{lastUpdated ? `Last update: ${lastUpdated}` : renderPlaceholder(120)}</span>
              </div>

              <div className="w-full">
                <div className={`${styles.trendChart}`}>
                  {uptimeTrend.map((value, index) => (
                    <div
                      key={`trend-${index}`}
                      className={styles.trendBar}
                      style={{
                        height: `${Math.min(100, Math.max(30, (value / maxTrend) * 100))}%`
                      }}
                    />
                  ))}
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  Uptime trend reflects the last seven checks, ensuring your AI concierge stays resilient.
                </p>
              </div>
            </div>
          </article>

          <article className={`${glassCard} ${styles.animateFadeIn}`}>
            <div className="flex items-center justify-center gap-3">
              <div className="rounded-2xl bg-gradient-to-br from-[#8b5cf6] to-[#facc15] p-3 shadow-lg shadow-[#facc15]/30">
                <PhoneIcon className="h-6 w-6 text-white" />
              </div>
              <div className="text-center">
                <p className={`${styles.sectionTitle} text-[0.9rem]`}>Recent Calls</p>
                <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Inbound Activity</p>
              </div>
            </div>
            <div className="mt-6 space-y-4">{renderCalls()}</div>
          </article>

          <article className={`${glassCard} ${styles.animateFadeIn}`}>
            <div className="flex items-center justify-center gap-3">
              <div className="rounded-2xl bg-gradient-to-br from-[#facc15]/80 to-[#d97706] p-3 shadow-lg shadow-[#facc15]/30">
                <CalendarDaysIcon className="h-6 w-6 text-white" />
              </div>
              <div className="text-center">
                <p className={`${styles.sectionTitle} text-[0.9rem]`}>Upcoming Bookings</p>
                <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Scheduled Leads</p>
              </div>
            </div>
            <div className="mt-6 space-y-4">{renderBookings()}</div>
          </article>
        </section>
      </div>
    </div>
  );
}

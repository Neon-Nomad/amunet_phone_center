import { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { CalendarDaysIcon, ChartBarIcon, SparklesIcon } from '@heroicons/react/24/outline';

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

const statDeck = [
  { label: 'Demo Activation Point', footnote: 'Metric · Cumulative | 30 days' },
  { label: 'Created Invoice', footnote: 'Metric · Cumulative | 30 days' },
  { label: 'Total Conversion Rate', footnote: 'Metric · Conversion Rate | 90 days' }
];

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
  const planTier = data?.subscription?.tier ?? 'Starter';
  const planStatus = data?.subscription?.status ?? 'Active';
  const callCount = data?.calls.length ?? 0;
  const bookingCount = data?.bookings.length ?? 0;
  const maxTrend = useMemo(() => Math.max(...uptimeTrend), []);

  const renderCalls = () => {
    if (!data) {
      return Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="flex items-center justify-between border-b border-slate-100/60 py-3 last:border-b-0">
          {renderPlaceholder(140, 16)}
          {renderPlaceholder(90, 14)}
        </div>
      ));
    }

    if (!data.calls.length) {
      return <p className="text-sm text-slate-500">No calls available.</p>;
    }

    return data.calls.slice(0, 3).map((call) => (
      <div key={call.id} className="flex items-center justify-between border-b border-slate-100/60 py-3 last:border-b-0">
        <div>
          <p className="text-sm font-semibold text-slate-900">{call.fromNumber}</p>
          <p className="text-xs uppercase tracking-[0.35em] text-slate-400">{call.status}</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-[#9d00ff]">{call.duration ? `${call.duration}s` : '—'}</p>
          <p className="text-xs text-slate-400">{new Date(call.createdAt).toLocaleTimeString()}</p>
        </div>
      </div>
    ));
  };

  const renderBookings = () => {
    if (!data) {
      return Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="flex items-center justify-between border-b border-slate-100/60 py-3 last:border-b-0">
          {renderPlaceholder(120, 16)}
          {renderPlaceholder(100, 14)}
        </div>
      ));
    }

    if (!data.bookings.length) {
      return <p className="text-sm text-slate-500">No upcoming bookings.</p>;
    }

    return data.bookings.slice(0, 3).map((booking) => (
      <div key={booking.id} className="flex items-center justify-between border-b border-slate-100/60 py-3 last:border-b-0">
        <div>
          <p className="text-sm font-semibold text-slate-900">{booking.customerName}</p>
          <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Scheduled slot</p>
        </div>
        <p className="text-xs text-slate-400">{new Date(booking.scheduledFor).toLocaleString()}</p>
      </div>
    ));
  };

  const highlightValue = (index: number) => {
    if (!data) return '...';
    if (index === 0) return `${callCount}`;
    if (index === 1) return `${bookingCount}`;
    return `${uptimeValue ?? '99.9%'} uptime`;
  };

  return (
    <div className={`${styles.dashboardPage} min-h-screen py-10`}>
      <div className="mx-auto max-w-6xl space-y-6 px-4">
        <header className="space-y-2">
          <div className="text-xs font-semibold uppercase tracking-[0.55em] text-slate-400">All dashboards</div>
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-4xl font-semibold text-slate-900">Free Trial to Paid Conversion</h1>
              <p className="text-sm text-slate-500">
                This dashboard tracks new signups that convert to paying customers, and highlights the trends
                that drive bookings.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50">
                Select time period
              </button>
              <button className="rounded-full bg-[#6c4bff] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-[#6c4bff]/40 transition hover:bg-[#5a3ae0]">
                Add filters
              </button>
            </div>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          {statDeck.map((stat, index) => (
            <div key={stat.label} className={`${styles.lightCard} ${styles.animateFadeIn}`}>
              <p className="text-xs uppercase tracking-[0.4em] text-slate-400">{stat.footnote}</p>
              <h2 className="mt-3 text-lg font-semibold text-slate-900">{stat.label}</h2>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-4xl font-bold text-slate-900">{highlightValue(index)}</span>
                <span className="text-sm text-slate-500">Users</span>
              </div>
            </div>
          ))}
        </section>

        <section className="grid gap-5">
          <article className={`${styles.lightCard} ${styles.animateFadeIn}`}>
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-2">
                <span className="rounded-full bg-[#facc15] p-2 text-white shadow-lg shadow-[#facc15]/50">
                  <ChartBarIcon className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Free trial to paid conversion trend</p>
                  <p className="text-sm text-slate-400">Conversion trends | Last 90 days</p>
                </div>
              </div>
              <span className="text-xs font-semibold text-slate-500">{lastUpdated ? `Updated ${lastUpdated}` : 'Updating...'}</span>
            </div>
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Total conversion rate</p>
                <p className="text-2xl font-semibold text-slate-900">{uptimeValue ?? '99.9%'}</p>
              </div>
              <div className={styles.trendChart}>
                {uptimeTrend.map((value, index) => (
                  <span
                    key={index}
                    className={styles.trendBar}
                    style={{ height: `${Math.min(100, Math.max(30, (value / maxTrend) * 100))}%` }}
                  />
                ))}
              </div>
            </div>
          </article>

          <div className="grid gap-5 md:grid-cols-2">
            <article className={`${styles.lightCard} ${styles.animateFadeIn}`}>
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-[#8b5cf6] p-2 text-white shadow-lg shadow-[#8b5cf6]/30">
                  <SparklesIcon className="h-5 w-5" />
                </span>
                <p className="text-sm font-semibold text-slate-900">Recent calls</p>
              </div>
              <div className="mt-4 space-y-2 text-sm text-slate-700">{renderCalls()}</div>
            </article>
            <article className={`${styles.lightCard} ${styles.animateFadeIn}`}>
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-[#0ea5e9] p-2 text-white shadow-lg shadow-[#0ea5e9]/30">
                  <CalendarDaysIcon className="h-5 w-5" />
                </span>
                <p className="text-sm font-semibold text-slate-900">Upcoming bookings</p>
              </div>
              <div className="mt-4 space-y-2 text-sm text-slate-700">{renderBookings()}</div>
            </article>
          </div>
        </section>
      </div>
    </div>
  );
}

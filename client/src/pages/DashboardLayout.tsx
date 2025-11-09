import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import axios from 'axios';

interface TenantInfo {
  tenantId: string;
}

export default function DashboardLayout() {
  const [tenant, setTenant] = useState<TenantInfo | null>(null);
  const location = useLocation();

  useEffect(() => {
    const stored = window.localStorage.getItem('amunet-tenant');
    if (stored) {
      setTenant(JSON.parse(stored));
    }
  }, []);

  const linkClass = (path: string) =>
    `rounded-lg px-4 py-2 text-sm ${location.pathname === path ? 'bg-primary text-white' : 'text-white/70 hover:text-white'}`;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="border-b border-white/5 bg-dark">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <p className="font-display text-xl">Amunet Dashboard</p>
            <p className="text-xs text-white/50">Tenant: {tenant?.tenantId ?? 'demo-tenant'}</p>
          </div>
          <nav className="flex gap-3">
            <a className={linkClass('/dashboard')} href="/dashboard">
              Overview
            </a>
            <a className={linkClass('/settings')} href="/settings">
              Settings
            </a>
          </nav>
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-6 py-10">
        <Outlet context={{ tenant, setTenant, axios }} />
      </div>
    </div>
  );
}
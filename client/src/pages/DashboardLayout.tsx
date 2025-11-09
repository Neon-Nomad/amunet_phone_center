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
    try {
      const stored = window.localStorage.getItem('amunet-tenant');
      if (stored) {
        setTenant(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to parse tenant from localStorage', error);
      window.localStorage.removeItem('amunet-tenant');
    }
  }, []);

  const linkClass = (path: string) =>
    `rounded-lg px-4 py-2 text-sm ${location.pathname === path ? 'bg-[#6c4bff] text-white' : 'text-slate-500 hover:text-slate-900'}`;

  return (
    <div className="min-h-screen bg-[#f7f7fb] text-slate-900">
      <div className="border-b border-slate-200 bg-white/90">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <p className="font-display text-xl text-slate-900">Amunet Dashboard</p>
            <p className="text-xs text-slate-500">Tenant: {tenant?.tenantId ?? 'demo-tenant'}</p>
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

import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import api from '../lib/api';

interface TenantInfo {
  tenantId: string;
}

export default function DashboardLayout() {
  const [tenant, setTenant] = useState<TenantInfo | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

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

  const handleLogout = async () => {
    if (isLoggingOut) return;
    
    setIsLoggingOut(true);
    try {
      // Call logout endpoint (optional, but good practice)
      await api.post('/api/auth/logout').catch(() => {
        // Ignore errors - logout should work even if endpoint fails
      });
    } finally {
      // Clear local storage and redirect
      localStorage.removeItem('token');
      localStorage.removeItem('amunet-tenant');
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f7fb] text-slate-900">
      <div className="border-b border-slate-200 bg-white/90">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <p className="font-display text-xl text-slate-900">Amunet Dashboard</p>
            <p className="text-xs text-slate-500">Tenant: {tenant?.tenantId ?? 'demo-tenant'}</p>
          </div>
          <nav className="flex items-center gap-3">
            <Link className={linkClass('/dashboard')} to="/dashboard">
              Overview
            </Link>
            <Link className={linkClass('/dashboard/settings')} to="/dashboard/settings">
              Settings
            </Link>
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="ml-4 flex items-center gap-2 rounded-lg px-4 py-2 text-sm text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
              title="Logout"
            >
              <ArrowRightOnRectangleIcon className="h-4 w-4" />
              <span className="hidden sm:inline">{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
            </button>
          </nav>
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-6 py-10">
        <Outlet context={{ tenant, setTenant, api }} />
      </div>
    </div>
  );
}

import axios from 'axios';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach, afterAll } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import DashboardLayout from '../DashboardLayout';
import DashboardHome from '../DashboardHome';
import SettingsPage from '../SettingsPage';

const axiosGetSpy = vi.spyOn(axios, 'get');
const axiosPutSpy = vi.spyOn(axios, 'put');

const overviewResponse = {
  calls: [],
  bookings: [],
  subscription: { tier: 'Starter', status: 'Active' },
  uptime: '99.9%'
};

const statusResponse = {
  uptime: '99.9%',
  activeCalls: 0,
  lastUpdate: new Date().toISOString()
};

const configResponse = {
  voiceProfile: 'confident-nova',
  aiProvider: 'openai-standard',
  calendarLink: 'https://cal.com/my-business'
};

describe('dashboard routing', () => {
  beforeEach(() => {
    axiosGetSpy.mockImplementation((url: string) => {
      if (url === '/api/dashboard/overview') {
        return Promise.resolve({ data: overviewResponse });
      }
      if (url === '/api/status') {
        return Promise.resolve({ data: statusResponse });
      }
      if (url === '/api/config') {
        return Promise.resolve({ data: configResponse });
      }
      return Promise.resolve({ data: {} });
    });
    axiosPutSpy.mockResolvedValue({ data: {} });
  });

  afterEach(() => {
    axiosGetSpy.mockReset();
    axiosPutSpy.mockReset();
  });

  it('renders DashboardHome when /dashboard is active', async () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route path="/dashboard/*" element={<DashboardLayout />}>
            <Route index element={<DashboardHome />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText('Free Trial to Paid Conversion')).toBeDefined();
    expect(screen.getByText('Recent calls')).toBeDefined();
  });

  it('renders SettingsPage when /dashboard/settings is active', async () => {
    render(
      <MemoryRouter initialEntries={['/dashboard/settings']}>
        <Routes>
          <Route path="/dashboard/*" element={<DashboardLayout />}>
            <Route index element={<DashboardHome />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText('Voice profile')).toBeDefined();
    expect(screen.getByText('AI provider')).toBeDefined();
  });
});

afterAll(() => {
  axiosGetSpy.mockRestore();
  axiosPutSpy.mockRestore();
});

import { render, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

import DashboardLayout from '../DashboardLayout';

describe('DashboardLayout', () => {
  afterEach(() => {
    window.localStorage.removeItem('amunet-tenant');
  });

  it('tolerates invalid tenant JSON in localStorage', async () => {
    const original = window.localStorage.getItem('amunet-tenant');
    window.localStorage.setItem('amunet-tenant', 'tenant_123');
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route path="/" element={<DashboardLayout />}>
            <Route path="/dashboard" element={<div data-testid="child" />} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => expect(consoleError).toHaveBeenCalled());
    expect(window.localStorage.getItem('amunet-tenant')).toBeNull();
    consoleError.mockRestore();

    if (original) {
      window.localStorage.setItem('amunet-tenant', original);
    }
  });
});

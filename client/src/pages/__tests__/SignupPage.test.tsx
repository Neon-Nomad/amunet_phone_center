import axios from 'axios';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach, afterAll } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import SignupPage from '../SignupPage';

const postSpy = vi.spyOn(axios, 'post');

describe('SignupPage', () => {
  beforeEach(() => {
    postSpy.mockImplementation((url: string) => {
      if (url === '/api/auth/register') {
        return Promise.resolve({ data: { tenantId: 'ten_abc' } });
      }
      if (url === '/api/auth/login') {
        return Promise.resolve({ data: { tenantId: 'ten_abc' } });
      }
      return Promise.resolve({ data: {} });
    });
  });

  afterEach(() => {
    postSpy.mockReset();
    window.localStorage.removeItem('amunet-tenant');
  });

  afterAll(() => {
    postSpy.mockRestore();
  });

  it('registers a tenant, logs in, stores tenantId, and navigates to dashboard', async () => {
    render(
      <MemoryRouter initialEntries={['/signup']}>
        <Routes>
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/dashboard" element={<div data-testid="dashboard" />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/business name/i), { target: { value: 'Test Business' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'owner@test.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'securepass123' } });

    fireEvent.click(screen.getByRole('button', { name: /start free trial/i }));

    await waitFor(() => {
      expect(screen.getByTestId('dashboard')).toBeDefined();
    });

    expect(postSpy).toHaveBeenCalledWith('/api/auth/register', {
      email: 'owner@test.com',
      password: 'securepass123',
      tenantName: 'Test Business'
    });
    expect(postSpy).toHaveBeenCalledWith('/api/auth/login', {
      email: 'owner@test.com',
      password: 'securepass123'
    });
    expect(window.localStorage.getItem('amunet-tenant')).toBe(JSON.stringify({ tenantId: 'ten_abc' }));
  });
});

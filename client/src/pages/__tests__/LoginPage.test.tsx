import axios from 'axios';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach, afterAll } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import LoginPage from '../LoginPage';

const postSpy = vi.spyOn(axios, 'post');

describe('LoginPage', () => {
  beforeEach(() => {
    postSpy.mockImplementation((url: string) => {
      if (url === '/api/auth/login') {
        return Promise.resolve({ data: { tenantId: 'ten_login' } });
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

  it('logs in and navigates to dashboard with tenant stored', async () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<div data-testid="dashboard" />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'owner@test.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'securepass123' } });
    fireEvent.click(screen.getByRole('button', { name: /request access/i }));

    await waitFor(() => {
      expect(screen.getByTestId('dashboard')).toBeDefined();
    });

    expect(postSpy).toHaveBeenCalledWith('/api/auth/login', {
      email: 'owner@test.com',
      password: 'securepass123'
    });
    expect(window.localStorage.getItem('amunet-tenant')).toBe(JSON.stringify({ tenantId: 'ten_login' }));
  });
});

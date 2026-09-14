// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import TopUpResult from './TopUpResult';
import { loadTopUpPendingInfo, saveTopUpPendingInfo } from '../utils/topUpStorage';

const mocks = vi.hoisted(() => ({
  getPendingPayment: vi.fn(),
  getLatestPayment: vi.fn(),
  refreshUser: vi.fn(),
  notification: vi.fn(),
}));

vi.mock('../api/balance', () => ({
  balanceApi: {
    getPendingPayment: mocks.getPendingPayment,
    getLatestPayment: mocks.getLatestPayment,
  },
}));
vi.mock('../store/auth', () => ({
  useAuthStore: (selector: (state: { refreshUser: () => Promise<void> }) => unknown) =>
    selector({ refreshUser: mocks.refreshUser }),
}));
vi.mock('../hooks/useCurrency', () => ({
  useCurrency: () => ({
    formatAmount: (amount: number) => amount.toFixed(2),
    currencySymbol: '₽',
  }),
}));
vi.mock('@/platform', () => ({
  useHaptic: () => ({ notification: mocks.notification }),
}));
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

function pendingPayment(status = 'pending') {
  return {
    id: 77,
    method: 'acquiring',
    method_display: 'API acquiring',
    identifier: 'payment-77',
    amount_kopeks: 12345,
    amount_rubles: 123.45,
    status,
    status_emoji: '…',
    status_text: status,
    is_paid: false,
    is_checkable: true,
    created_at: '2026-09-14T10:00:00Z',
    expires_at: '2026-09-14T10:30:00Z',
    payment_url: 'https://payments.example.test/77',
  };
}

function renderPage(entry: string) {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <QueryClientProvider
        client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
      >
        <Routes>
          <Route path="/balance/top-up/result" element={<TopUpResult />} />
        </Routes>
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.resetAllMocks();
  sessionStorage.clear();
  mocks.refreshUser.mockResolvedValue(undefined);
  mocks.getPendingPayment.mockResolvedValue(pendingPayment());
  mocks.getLatestPayment.mockResolvedValue(pendingPayment());
});

afterEach(() => {
  cleanup();
  sessionStorage.clear();
});

describe('TopUpResult', () => {
  it('polls the stored payment and renders its pending amount', async () => {
    saveTopUpPendingInfo({
      amount_kopeks: 12345,
      method_id: 'acquiring',
      method_name: 'API acquiring',
      payment_id: '77',
      created_at: Date.now(),
    });
    renderPage('/balance/top-up/result');

    expect(await screen.findByText('balance.topUpResult.awaitingPayment')).toBeTruthy();
    expect(screen.getByText(/123\.45/)).toBeTruthy();
    expect(mocks.getPendingPayment).toHaveBeenCalledWith('acquiring', 77);
  });

  it('renders redirect failure, clears pending state, and emits error feedback', async () => {
    saveTopUpPendingInfo({
      amount_kopeks: 12345,
      method_id: 'acquiring',
      method_name: 'API acquiring',
      payment_id: '77',
      created_at: Date.now(),
    });
    renderPage('/balance/top-up/result?status=failed');

    expect(await screen.findByText('balance.topUpResult.failed')).toBeTruthy();
    await waitFor(() => expect(loadTopUpPendingInfo()).toBeNull());
    expect(mocks.notification).toHaveBeenCalledWith('error');
    expect(mocks.getPendingPayment).not.toHaveBeenCalled();
  });
});

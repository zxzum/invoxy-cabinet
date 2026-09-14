// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import TopUpAmount from './TopUpAmount';

const mocks = vi.hoisted(() => ({
  getPaymentMethods: vi.fn(),
  createTopUp: vi.fn(),
  createStarsInvoice: vi.fn(),
  openInvoice: vi.fn(),
  openTelegramLink: vi.fn(),
  openLink: vi.fn(),
  notification: vi.fn(),
}));

vi.mock('../api/balance', () => ({
  balanceApi: {
    getPaymentMethods: mocks.getPaymentMethods,
    createTopUp: mocks.createTopUp,
    createStarsInvoice: mocks.createStarsInvoice,
  },
}));
vi.mock('../hooks/useCurrency', () => ({
  useCurrency: () => ({
    formatAmount: (amount: number) => String(amount),
    currencySymbol: '₽',
    convertAmount: (amount: number) => amount,
    convertToRub: (amount: number) => amount,
    targetCurrency: 'RUB',
  }),
}));
vi.mock('../utils/rateLimit', () => ({
  checkRateLimit: () => true,
  getRateLimitResetTime: () => 0,
  RATE_LIMIT_KEYS: { PAYMENT: 'payment' },
}));
vi.mock('../store/successNotification', () => ({
  useCloseOnSuccessNotification: vi.fn(),
}));
vi.mock('@/platform', () => ({
  usePlatform: () => ({
    openInvoice: mocks.openInvoice,
    openTelegramLink: mocks.openTelegramLink,
    openLink: mocks.openLink,
    platform: 'telegram',
  }),
  useHaptic: () => ({ notification: mocks.notification, impact: vi.fn() }),
}));
vi.mock('../utils/api-error', () => ({
  getApiErrorMessage: (_error: unknown, fallback: string) => fallback,
}));
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { defaultValue?: string }) => options?.defaultValue || key,
  }),
}));

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/balance/top-up/acquiring?amount=100']}>
      <QueryClientProvider
        client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
      >
        <Routes>
          <Route path="/balance/top-up/:methodId" element={<TopUpAmount />} />
        </Routes>
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.getPaymentMethods.mockResolvedValue([
    {
      id: 'acquiring',
      name: 'API acquiring',
      description: 'Target provider',
      min_amount_kopeks: 10000,
      max_amount_kopeks: 500000,
      is_available: true,
      options: [
        { id: 'card', name: 'Card', description: null },
        { id: 'sbp', name: 'SBP', description: null },
      ],
      quick_amounts: [10000, 30000],
      open_url_direct: false,
    },
  ]);
});

afterEach(cleanup);

describe('TopUpAmount', () => {
  it('uses existing target surface utilities for options and the amount field', async () => {
    renderPage();

    const option = await screen.findByRole('button', { name: 'Card' });
    expect(option.className).toContain('card-interactive');
    expect(option.className).not.toContain('glass-control');

    const amount = screen.getByRole('spinbutton');
    expect(amount.closest('.card-inset')).toBeTruthy();
    expect(amount.closest('.glass-control')).toBeNull();
  });

  it('disables submission while pending and renders the target failure state', async () => {
    let rejectPayment!: (reason: unknown) => void;
    mocks.createTopUp.mockReturnValue(
      new Promise((_resolve, reject) => {
        rejectPayment = reject;
      }),
    );
    renderPage();

    const submit = await screen.findByRole('button', { name: 'balance.topUp' });
    fireEvent.click(submit);
    await waitFor(() => expect(submit).toHaveProperty('disabled', true));

    rejectPayment(new Error('provider unavailable'));
    expect(await screen.findByText('common.error')).toBeTruthy();
    await waitFor(() => expect(submit).toHaveProperty('disabled', false));
  });
});

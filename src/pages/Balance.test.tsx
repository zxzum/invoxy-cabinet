// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Balance from './Balance';

const mocks = vi.hoisted(() => ({
  getBalance: vi.fn(),
  getTransactions: vi.fn(),
  getPaymentMethods: vi.fn(),
  getSavedCards: vi.fn(),
  refreshUser: vi.fn(),
}));

vi.mock('../api/balance', () => ({
  balanceApi: {
    getBalance: mocks.getBalance,
    getTransactions: mocks.getTransactions,
    getPaymentMethods: mocks.getPaymentMethods,
    getSavedCards: mocks.getSavedCards,
    activatePromocode: vi.fn(),
  },
}));
vi.mock('../store/auth', () => ({
  useAuthStore: (selector: (state: { refreshUser: () => Promise<void> }) => unknown) =>
    selector({ refreshUser: mocks.refreshUser }),
}));
vi.mock('../hooks/useCurrency', () => ({
  useCurrency: () => ({
    formatAmount: (amount: number) => String(amount),
    currencySymbol: '₽',
  }),
}));
vi.mock('../config/constants', () => ({ API: { BALANCE_STALE_TIME_MS: 60_000 } }));
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: unknown) => (typeof fallback === 'string' ? fallback : key),
  }),
}));
vi.mock('@/platform', () => ({
  usePlatform: () => ({ haptic: { impact: vi.fn() } }),
}));

function createClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function renderBalance() {
  return render(
    <MemoryRouter initialEntries={['/balance']}>
      <QueryClientProvider client={createClient()}>
        <Balance />
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.getBalance.mockResolvedValue({ balance_kopeks: 32100, balance_rubles: 321 });
  mocks.getTransactions.mockResolvedValue({
    items: [],
    page: 1,
    pages: 1,
    total: 0,
  });
  mocks.getPaymentMethods.mockResolvedValue([
    {
      id: 'card',
      name: 'API card',
      description: 'Target payment method',
      min_amount_kopeks: 10000,
      max_amount_kopeks: 500000,
      is_available: true,
    },
  ]);
  mocks.getSavedCards.mockResolvedValue({ cards: [], recurrent_enabled: false });
  mocks.refreshUser.mockResolvedValue(undefined);
});

afterEach(cleanup);

describe('Balance target data presentation', () => {
  it('renders API balance and payment methods on target glass surfaces', async () => {
    renderBalance();

    expect(await screen.findByText('321')).toBeTruthy();
    expect(screen.getByText('321').closest('.glass-surface-accent')).toBeTruthy();
    expect(screen.getByText('API card').closest('.glass-surface')).toBeTruthy();
  });

  it('does not invent a business balance when the API returns zero', async () => {
    mocks.getBalance.mockResolvedValue({ balance_kopeks: 0, balance_rubles: 0 });

    renderBalance();

    expect(await screen.findByText('0')).toBeTruthy();
    expect(screen.queryByText(/2490|2 490|2000|2 000/)).toBeNull();
  });
});

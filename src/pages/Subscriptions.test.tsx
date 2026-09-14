// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PlatformProvider } from '../platform/PlatformProvider';
import type { SubscriptionsListResponse } from '../types';
import Subscriptions from './Subscriptions';

const mocks = vi.hoisted(() => ({
  activateTrial: vi.fn(),
  getBalance: vi.fn(),
  getSubscriptions: vi.fn(),
  getTrialInfo: vi.fn(),
  refreshUser: vi.fn(),
}));

vi.mock('../api/subscription', () => ({
  subscriptionApi: {
    activateTrial: mocks.activateTrial,
    getSubscriptions: mocks.getSubscriptions,
    getTrialInfo: mocks.getTrialInfo,
  },
}));
vi.mock('../api/balance', () => ({ balanceApi: { getBalance: mocks.getBalance } }));
vi.mock('../store/auth', () => ({
  useAuthStore: (selector: (state: unknown) => unknown) =>
    selector({ refreshUser: mocks.refreshUser }),
}));
vi.mock('../hooks/useTheme', () => ({ useTheme: () => ({ isDark: true }) }));
vi.mock('../utils/glassTheme', () => ({
  getGlassColors: () => ({
    cardBg: 'rgba(0,0,0,.2)',
    cardBorder: 'rgba(255,255,255,.1)',
    innerBg: 'rgba(0,0,0,.1)',
    text: 'white',
    textSecondary: 'gray',
  }),
}));
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: unknown) => (typeof fallback === 'string' ? fallback : key),
    i18n: { language: 'ru' },
  }),
  initReactI18next: { type: '3rdParty', init: () => {} },
}));

function createClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
}

function CurrentPath() {
  return <span data-testid="current-path">{useLocation().pathname}</span>;
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/subscriptions']}>
      <QueryClientProvider client={createClient()}>
        <PlatformProvider>
          <Routes>
            <Route
              path="*"
              element={
                <>
                  <Subscriptions />
                  <CurrentPath />
                </>
              }
            />
          </Routes>
        </PlatformProvider>
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

const multiSubscription: SubscriptionsListResponse = {
  multi_tariff_enabled: true,
  subscriptions: [
    {
      id: 42,
      tariff_id: 7,
      tariff_name: 'Fixture тариф',
      status: 'active',
      is_trial: false,
      is_daily: false,
      is_daily_paused: false,
      autopay_enabled: true,
      end_date: '2026-10-01T00:00:00Z',
      traffic_limit_gb: 100,
      traffic_used_gb: 12,
      device_limit: 3,
      connected_squads: [],
      subscription_url: 'https://example.test/subscription',
      subscription_crypto_link: null,
    },
  ],
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('Subscriptions target states', () => {
  it('keeps the target loading surface while subscriptions are pending', () => {
    mocks.getSubscriptions.mockReturnValue(new Promise(() => {}));

    renderPage();

    expect(screen.getByRole('status')).toBeTruthy();
  });

  it('renders the target empty state without inventing a subscription', async () => {
    mocks.getSubscriptions.mockResolvedValue({ subscriptions: [], multi_tariff_enabled: true });
    mocks.getTrialInfo.mockResolvedValue({ is_available: false });

    renderPage();

    expect(await screen.findByText('Нет подписок')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Купить подписку' })).toBeTruthy();
  });

  it('renders an actionable error state when the target list fails', async () => {
    mocks.getSubscriptions.mockRejectedValue(new Error('fixture failure'));

    renderPage();

    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Повторить' })).toBeTruthy();
  });

  it('routes a target multi-subscription fixture to its detail screen', async () => {
    mocks.getSubscriptions.mockResolvedValue(multiSubscription);

    renderPage();

    expect(await screen.findByText('12.0 / 100 ГБ')).toBeTruthy();
    expect(screen.getByText('Автопродление')).toBeTruthy();
    fireEvent.click(await screen.findByRole('button', { name: /Fixture тариф/ }));

    await waitFor(() =>
      expect(screen.getByTestId('current-path').textContent).toBe('/subscriptions/42'),
    );
  });
});

// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PlatformProvider } from '../platform/PlatformProvider';
import type { Subscription } from '../types';
import type { SubscriptionsListResponse } from '../types';
import Dashboard from './Dashboard';

if (!window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}
window.scrollTo = vi.fn();

const mocks = vi.hoisted(() => ({
  activateTrial: vi.fn(),
  getBalance: vi.fn(),
  getConfig: vi.fn(),
  getDevices: vi.fn(),
  getGroupDiscounts: vi.fn(),
  getPendingGifts: vi.fn(),
  getReferralInfo: vi.fn(),
  refreshTraffic: vi.fn(),
  getSubscription: vi.fn(),
  getSubscriptions: vi.fn(),
  getTrialInfo: vi.fn(),
  refreshUser: vi.fn(),
}));

vi.mock('../api/subscription', () => ({
  subscriptionApi: {
    activateTrial: mocks.activateTrial,
    getDevices: mocks.getDevices,
    getSubscription: mocks.getSubscription,
    getSubscriptions: mocks.getSubscriptions,
    getTrialInfo: mocks.getTrialInfo,
    refreshTraffic: mocks.refreshTraffic,
  },
}));
vi.mock('../api/balance', () => ({ balanceApi: { getBalance: mocks.getBalance } }));
vi.mock('../api/referral', () => ({ referralApi: { getReferralInfo: mocks.getReferralInfo } }));
vi.mock('../api/wheel', () => ({ wheelApi: { getConfig: mocks.getConfig } }));
vi.mock('../api/gift', () => ({ giftApi: { getPendingGifts: mocks.getPendingGifts } }));
vi.mock('../api/promo', () => ({ promoApi: { getGroupDiscounts: mocks.getGroupDiscounts } }));
vi.mock('../store/auth', () => ({
  useAuthStore: (selector: (state: unknown) => unknown) =>
    selector({ user: { id: 1, first_name: 'Fixture' }, refreshUser: mocks.refreshUser }),
}));
vi.mock('../store/blocking', () => ({
  useBlockingStore: (selector: (state: unknown) => unknown) => selector({ blockingType: null }),
}));
vi.mock('../hooks/useTheme', () => ({ useTheme: () => ({ isDark: true }) }));
vi.mock('../hooks/useCurrency', () => ({
  useCurrency: () => ({ formatAmount: (amount: number) => String(amount), currencySymbol: '₽' }),
}));
vi.mock('../components/Onboarding', () => ({
  default: () => null,
  useOnboarding: () => ({ isCompleted: true, complete: vi.fn() }),
}));
vi.mock('../components/PromoOffersSection', () => ({ default: () => null }));
vi.mock('../components/news/NewsSection', () => ({ default: () => null }));
vi.mock('../components/dashboard/StatsGrid', () => ({ default: () => null }));
vi.mock('../components/dashboard/PendingGiftCard', () => ({ default: () => null }));
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: unknown) => (typeof fallback === 'string' ? fallback : key),
    i18n: { language: 'ru' },
  }),
  initReactI18next: { type: '3rdParty', init: () => {} },
}));

function CurrentPath() {
  return <span data-testid="current-path">{useLocation().pathname}</span>;
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <QueryClientProvider
        client={
          new QueryClient({
            defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
          })
        }
      >
        <PlatformProvider>
          <Routes>
            <Route
              path="*"
              element={
                <>
                  <Dashboard />
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
      tariff_name: 'Fixture dashboard тариф',
      status: 'active',
      is_trial: false,
      is_daily: false,
      is_daily_paused: false,
      autopay_enabled: false,
      end_date: '2026-10-01T00:00:00Z',
      traffic_limit_gb: 100,
      traffic_used_gb: 12,
      device_limit: 1,
      connected_squads: [],
      subscription_url: 'https://example.test/subscription',
      subscription_crypto_link: null,
    },
  ],
};

const expiredSubscription: Subscription = {
  id: 42,
  status: 'expired',
  is_trial: false,
  start_date: '2026-08-01T00:00:00Z',
  end_date: '2026-09-01T00:00:00Z',
  days_left: 0,
  hours_left: 0,
  minutes_left: 0,
  time_left_display: '',
  traffic_limit_gb: 100,
  traffic_used_gb: 100,
  traffic_used_percent: 100,
  device_limit: 1,
  connected_squads: [],
  servers: [],
  autopay_enabled: false,
  autopay_days_before: 3,
  subscription_url: 'https://example.test/subscription',
  hide_subscription_link: false,
  is_active: false,
  is_expired: true,
  is_limited: false,
  tariff_id: 7,
  tariff_name: 'Fixture expired tariff',
};

function setupResolvedQueries() {
  mocks.getBalance.mockResolvedValue({ balance_rubles: 0, balance_kopeks: 0 });
  mocks.getConfig.mockResolvedValue({ is_enabled: false });
  mocks.getDevices.mockResolvedValue({
    total: 1,
    devices: [
      {
        hwid: 'fixture-hwid',
        platform: 'ios',
        device_model: 'Fixture phone',
        created_at: null,
        local_name: 'Fixture device',
      },
    ],
  });
  mocks.getGroupDiscounts.mockResolvedValue(null);
  mocks.getPendingGifts.mockResolvedValue([]);
  mocks.getReferralInfo.mockResolvedValue({ total_referrals: 0, available_balance_rubles: 0 });
  mocks.getSubscription.mockResolvedValue({ has_subscription: false, subscription: null });
  mocks.getTrialInfo.mockResolvedValue({ is_available: false });
  mocks.refreshTraffic.mockResolvedValue({
    traffic_used_gb: 0,
    traffic_used_percent: 0,
    is_unlimited: false,
    rate_limited: false,
  });
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('Dashboard target states', () => {
  it('renders a target multi-subscription fixture and routes to its detail', async () => {
    setupResolvedQueries();
    mocks.getSubscriptions.mockResolvedValue(multiSubscription);

    renderPage();

    fireEvent.click(await screen.findByRole('button', { name: /Fixture dashboard тариф/ }));

    expect((await screen.findByTestId('current-path')).textContent).toBe('/subscriptions/42');
    expect(screen.queryByText(/2490|200 ₽|750 ГБ|demo/i)).toBeNull();
  });

  it('renders API-backed traffic and opens the real device-limit sheet', async () => {
    setupResolvedQueries();
    mocks.getSubscriptions.mockResolvedValue(multiSubscription);

    renderPage();

    expect(await screen.findByText('Fixture dashboard тариф')).toBeTruthy();
    expect(screen.getByText('12.0 / 100 ГБ')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /Все слоты заняты/ }));

    expect(await screen.findByText('Fixture device')).toBeTruthy();
    expect(screen.getByText('Подключённые устройства')).toBeTruthy();
  });

  it('renders the real expired card from the subscription API', async () => {
    setupResolvedQueries();
    mocks.getSubscriptions.mockResolvedValue({ multi_tariff_enabled: false, subscriptions: [] });
    mocks.getSubscription.mockResolvedValue({
      has_subscription: true,
      subscription: expiredSubscription,
    });
    mocks.getBalance.mockResolvedValue({ balance_rubles: 125, balance_kopeks: 12500 });

    renderPage();

    expect(await screen.findByText('125 ₽')).toBeTruthy();
    fireEvent.click(screen.getByRole('link', { name: 'dashboard.expired.quickRenew' }));

    expect(screen.getByTestId('current-path').textContent).toBe('/subscriptions/42/renew');
  });

  it('surfaces a neutral error when the target subscription list fails', async () => {
    setupResolvedQueries();
    mocks.getSubscriptions.mockRejectedValue(new Error('fixture failure'));

    renderPage();

    expect(await screen.findByRole('alert')).toBeTruthy();
  });

  it('keeps source demo fixtures and fixed business values out of production paths', () => {
    const productionPaths = [
      './Dashboard.tsx',
      './Subscriptions.tsx',
      './Subscription.tsx',
      './RenewSubscription.tsx',
      './Connection.tsx',
      './ConnectionQR.tsx',
      './SubscriptionPurchase.tsx',
      '../components/dashboard/SubscriptionCardActive.tsx',
      '../components/dashboard/SubscriptionCardExpired.tsx',
      '../components/dashboard/TrialOfferCard.tsx',
      '../components/subscription/SubscriptionListCard.tsx',
      '../components/subscription/purchase/TariffPickerGrid.tsx',
      '../components/subscription/purchase/TariffPurchaseForm.tsx',
      '../components/subscription/purchase/ClassicPurchaseWizard.tsx',
      '../components/subscription/purchase/tariffPresentation.ts',
      '../components/subscription/sheets/SwitchTariffSheet.tsx',
      '../components/layout/AppShell/AppShell.tsx',
      '../components/layout/AppShell/AppHeader.tsx',
      '../components/layout/AppShell/MobileBottomNav.tsx',
    ];
    const forbiddenSource =
      /demoSubscriptions|invoxy_demo|FALLBACK_PLANS|Travel LTE|2490|750 ГБ|200 ₽/i;

    for (const path of productionPaths) {
      expect(readFileSync(new URL(path, import.meta.url), 'utf8')).not.toMatch(forbiddenSource);
    }
  });
});

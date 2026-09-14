// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PlatformProvider } from '../platform/PlatformProvider';
import type { Subscription } from '../types';
import type { SubscriptionsListResponse } from '../types';
import { uiLocale } from '../utils/uiLocale';
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
  deleteDevice: vi.fn(),
  getBalance: vi.fn(),
  getConfig: vi.fn(),
  getConnectionLink: vi.fn(),
  getDevices: vi.fn(),
  getGroupDiscounts: vi.fn(),
  getHappDownloads: vi.fn(),
  getPendingGifts: vi.fn(),
  getPurchaseOptions: vi.fn(),
  getReferralInfo: vi.fn(),
  getRenewalOptions: vi.fn(),
  getTrafficPackages: vi.fn(),
  refreshTraffic: vi.fn(),
  getSubscription: vi.fn(),
  getSubscriptions: vi.fn(),
  getTrialInfo: vi.fn(),
  refreshUser: vi.fn(),
}));

vi.mock('../api/subscription', () => ({
  subscriptionApi: {
    activateTrial: mocks.activateTrial,
    deleteDevice: mocks.deleteDevice,
    getConnectionLink: mocks.getConnectionLink,
    getDevices: mocks.getDevices,
    getHappDownloads: mocks.getHappDownloads,
    getPurchaseOptions: mocks.getPurchaseOptions,
    getRenewalOptions: mocks.getRenewalOptions,
    getSubscription: mocks.getSubscription,
    getSubscriptions: mocks.getSubscriptions,
    getTrafficPackages: mocks.getTrafficPackages,
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

const activeSubscription: Subscription = {
  id: 42,
  status: 'active',
  is_trial: false,
  start_date: '2026-09-01T00:00:00Z',
  end_date: '2026-10-01T00:00:00Z',
  days_left: 16,
  hours_left: 0,
  minutes_left: 0,
  time_left_display: '',
  traffic_limit_gb: 100,
  traffic_used_gb: 18,
  traffic_used_percent: 18,
  whitelist_traffic_limit_gb: 50,
  whitelist_traffic_used_gb: 12,
  whitelist_traffic_used_percent: 24,
  device_limit: 3,
  connected_squads: [],
  servers: [],
  autopay_enabled: false,
  autopay_days_before: 3,
  subscription_url: 'https://example.test/subscription',
  hide_subscription_link: false,
  is_active: true,
  is_expired: false,
  is_limited: false,
  tariff_id: 7,
  tariff_name: 'Fixture active tariff',
};

function setupResolvedQueries() {
  mocks.getBalance.mockResolvedValue({ balance_rubles: 0, balance_kopeks: 0 });
  mocks.getConfig.mockResolvedValue({ is_enabled: false });
  mocks.getConnectionLink.mockResolvedValue({
    subscription_url: 'https://example.test/subscription',
    display_link: null,
    happ_redirect_link: null,
    happ_scheme_link: 'happ://add/fixture',
    connect_mode: '',
    hide_link: false,
    instructions: { steps: [] },
  });
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
  mocks.getHappDownloads.mockResolvedValue({ platforms: {}, happ_enabled: true });
  mocks.getPendingGifts.mockResolvedValue([]);
  mocks.getPurchaseOptions.mockResolvedValue({
    sales_mode: 'classic',
    balance_kopeks: 0,
    balance_label: '0 ₽',
    devices: {
      min: 1,
      max: 10,
      default: 3,
      current: 3,
      price_per_device_kopeks: 3000,
      price_per_device_label: '30 ₽',
    },
  });
  mocks.getReferralInfo.mockResolvedValue({ total_referrals: 0, available_balance_rubles: 0 });
  mocks.getRenewalOptions.mockResolvedValue([
    {
      period_days: 30,
      price_kopeks: 19900,
      price_rubles: 199,
      discount_percent: 0,
      original_price_kopeks: null,
    },
  ]);
  mocks.getTrafficPackages.mockResolvedValue([
    { gb: 100, price_kopeks: 5000, price_rubles: 50, is_unlimited: false },
  ]);
  mocks.getSubscription.mockResolvedValue({ has_subscription: false, subscription: null });
  mocks.getTrialInfo.mockResolvedValue({ is_available: false });
  mocks.refreshTraffic.mockResolvedValue({
    traffic_used_gb: 0,
    traffic_used_percent: 0,
    is_unlimited: false,
    rate_limited: false,
  });
  mocks.deleteDevice.mockResolvedValue({ success: true });
  mocks.activateTrial.mockResolvedValue({});
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

    // Баланс показывается и в шапке, и в карточке истёкшей подписки.
    expect((await screen.findAllByText('125 ₽')).length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole('link', { name: 'dashboard.expired.quickRenew' }));

    expect(screen.getByTestId('current-path').textContent).toBe('/subscriptions/42/renew');
  });

  it('surfaces a neutral error when the target subscription list fails', async () => {
    setupResolvedQueries();
    mocks.getSubscriptions.mockRejectedValue(new Error('fixture failure'));

    renderPage();

    expect(await screen.findByRole('alert')).toBeTruthy();
  });

  it('renders the Luna active dashboard from real subscription API data', async () => {
    setupResolvedQueries();
    mocks.getSubscriptions.mockResolvedValue({ multi_tariff_enabled: false, subscriptions: [] });
    mocks.getSubscription.mockResolvedValue({
      has_subscription: true,
      subscription: activeSubscription,
    });
    // Auto-refresh overrides usage on success — keep it aligned with the fixture
    // so the assertion is stable before and after the mutation lands.
    mocks.refreshTraffic.mockResolvedValue({
      traffic_used_gb: 18,
      traffic_used_percent: 18,
      is_unlimited: false,
      rate_limited: false,
    });

    renderPage();

    // Hero: реальные tariff_name / days_left / end_date из фикстуры.
    expect(await screen.findByRole('heading', { name: 'Fixture active tariff' })).toBeTruthy();
    expect(screen.getByText('16')).toBeTruthy();
    const expectedDate = new Date('2026-10-01T00:00:00Z').toLocaleDateString(uiLocale());
    expect(
      screen.getByText(new RegExp(expectedDate.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))),
    ).toBeTruthy();

    // Основной и whitelist-трафик — раздельно, из своих полей.
    expect(await screen.findByText('18.0 GB / 100.0 GB')).toBeTruthy();
    expect(screen.getByText('12.0 GB / 50.0 GB')).toBeTruthy();

    // Ссылка доступа из connection-link, устройства из devices-запроса.
    expect(screen.getByText('https://example.test/subscription')).toBeTruthy();
    expect(screen.getByText('Fixture device')).toBeTruthy();

    // Renewal options из API: цена форматируется из price_kopeks фикстуры.
    expect(screen.getByRole('button', { name: /30/ })).toBeTruthy();
    expect(screen.getByText('199 ₽')).toBeTruthy();

    // Никаких demo-значений из визуального референса.
    expect(screen.queryByText(/Travel LTE|2490|750 ГБ|200 ₽|demo/i)).toBeNull();
  });

  it('renders the Luna welcome composition with real trial info and activates trial', async () => {
    setupResolvedQueries();
    mocks.getSubscriptions.mockResolvedValue({ multi_tariff_enabled: false, subscriptions: [] });
    mocks.getTrialInfo.mockResolvedValue({
      is_available: true,
      duration_days: 7,
      traffic_limit_gb: 50,
      device_limit: 1,
      requires_payment: false,
      price_kopeks: 0,
      price_rubles: 0,
      reason_unavailable: null,
    });

    renderPage();

    expect(await screen.findByText('Пробный период')).toBeTruthy();
    expect(screen.getByText('7')).toBeTruthy();
    expect(screen.getByText('50')).toBeTruthy();

    // Оффер без выдуманной цены, рефералка и поддержка — реальные маршруты.
    expect(screen.getByText('Гибкие тарифы')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Написать в поддержку' })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'subscription.trial.activate' }));
    await vi.waitFor(() => expect(mocks.activateTrial).toHaveBeenCalled());

    expect(screen.queryByText(/Travel LTE|2490|750 ГБ|200 ₽|demo/i)).toBeNull();
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

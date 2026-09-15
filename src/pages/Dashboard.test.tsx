// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PlatformProvider } from '../platform/PlatformProvider';
import type { Subscription } from '../types';
import type { SubscriptionsListResponse } from '../types';
import faLocale from '../locales/fa.json';
import zhLocale from '../locales/zh.json';
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
  getDevicePrice: vi.fn(),
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
  openAppScheme: vi.fn(),
  confirm: vi.fn(),
  notifyError: vi.fn(),
  refreshUser: vi.fn(),
}));

vi.mock('../api/subscription', () => ({
  subscriptionApi: {
    activateTrial: mocks.activateTrial,
    deleteDevice: mocks.deleteDevice,
    getConnectionLink: mocks.getConnectionLink,
    getDevices: mocks.getDevices,
    getDevicePrice: mocks.getDevicePrice,
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
vi.mock('../utils/openAppScheme', () => ({ openAppScheme: mocks.openAppScheme }));
vi.mock('@/platform', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/platform')>();
  return {
    ...actual,
    useNativeDialog: () => ({ confirm: mocks.confirm }),
    useNotify: () => ({ error: mocks.notifyError }),
  };
});
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
vi.mock('../components/TicketNotificationBell', () => ({ default: () => null }));
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

const secondActiveSubscription: Subscription = {
  ...activeSubscription,
  id: 43,
  tariff_id: 8,
  tariff_name: 'Fixture second active tariff',
  traffic_used_gb: 7,
  traffic_used_percent: 7,
};

function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

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
  mocks.getDevicePrice.mockResolvedValue({
    available: true,
    devices: 1,
    price_per_device_label: '30 ₽',
    total_price_kopeks: 3000,
    total_price_label: '30 ₽',
    current_device_limit: 3,
    max_device_limit: 10,
    days_left: 16,
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
  it('uses a subscription selector and renders the selected subscription in Luna composition', async () => {
    setupResolvedQueries();
    mocks.getSubscriptions.mockResolvedValue(multiSubscription);
    mocks.getSubscription.mockResolvedValue({
      has_subscription: true,
      subscription: activeSubscription,
    });
    mocks.refreshTraffic.mockResolvedValue({
      traffic_used_gb: 18,
      traffic_used_percent: 18,
      is_unlimited: false,
      rate_limited: false,
    });

    renderPage();

    expect(await screen.findByRole('radiogroup', { name: 'Dashboard subscriptions' })).toBeTruthy();
    fireEvent.click(screen.getByRole('radio', { name: 'Fixture dashboard тариф' }));
    expect(await screen.findByRole('heading', { name: 'Fixture active tariff' })).toBeTruthy();
    const traffic = screen.getByRole('region', { name: 'Traffic' });
    expect(traffic.textContent).toContain('18.0');
    expect(traffic.textContent).toContain('100.0');
  });

  it('mounts the Luna CSS contract on the dashboard product wrapper', async () => {
    setupResolvedQueries();
    mocks.getSubscriptions.mockResolvedValue({ multi_tariff_enabled: false, subscriptions: [] });
    mocks.getSubscription.mockResolvedValue({
      has_subscription: true,
      subscription: activeSubscription,
    });

    renderPage();

    expect(await screen.findByRole('heading', { name: 'Fixture active tariff' })).toBeTruthy();
    expect(document.querySelector('.luna-dashboard')).toBeTruthy();
  });

  it('keeps the selected subscription id on every target query', async () => {
    setupResolvedQueries();
    mocks.getSubscriptions.mockResolvedValue({
      ...multiSubscription,
      subscriptions: [
        multiSubscription.subscriptions[0],
        {
          ...multiSubscription.subscriptions[0],
          id: 43,
          tariff_id: 8,
          tariff_name: 'Fixture second dashboard тариф',
          device_limit: 3,
        },
      ],
    });
    mocks.getSubscription.mockImplementation((id?: number) =>
      Promise.resolve({
        has_subscription: true,
        subscription: id === 43 ? secondActiveSubscription : activeSubscription,
      }),
    );

    renderPage();

    expect(
      await screen.findByRole('radio', { name: 'Fixture second dashboard тариф' }),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole('radio', { name: 'Fixture second dashboard тариф' }));

    expect(
      await screen.findByRole('heading', { name: 'Fixture second active tariff' }),
    ).toBeTruthy();
    expect(mocks.getSubscription).toHaveBeenCalledWith(43);
    expect(mocks.getDevices).toHaveBeenCalledWith(43);
  });

  it('isolates traffic data and cooldown when a late refresh crosses subscriptions', async () => {
    setupResolvedQueries();
    const refreshA = deferred<{
      traffic_used_gb: number;
      traffic_used_percent: number;
      is_unlimited: boolean;
      rate_limited: boolean;
      retry_after_seconds?: number;
    }>();
    const refreshB = deferred<{
      traffic_used_gb: number;
      traffic_used_percent: number;
      is_unlimited: boolean;
      rate_limited: boolean;
      retry_after_seconds?: number;
    }>();
    mocks.getSubscriptions.mockResolvedValue({
      ...multiSubscription,
      subscriptions: [
        multiSubscription.subscriptions[0],
        {
          ...multiSubscription.subscriptions[0],
          id: 43,
          tariff_id: 8,
          tariff_name: 'Fixture second dashboard тариф',
          device_limit: 3,
        },
      ],
    });
    mocks.getSubscription.mockImplementation((id?: number) =>
      Promise.resolve({
        has_subscription: id != null,
        subscription: id === 43 ? secondActiveSubscription : id === 42 ? activeSubscription : null,
      }),
    );
    mocks.refreshTraffic.mockImplementation((id?: number) =>
      id === 42
        ? refreshA.promise
        : id === 43
          ? refreshB.promise
          : Promise.reject(new Error('unexpected id')),
    );
    localStorage.removeItem('traffic_refresh_ts_42');
    localStorage.removeItem('traffic_refresh_ts_43');

    renderPage();

    expect(await screen.findByRole('heading', { name: 'Fixture active tariff' })).toBeTruthy();
    await vi.waitFor(() => expect(mocks.refreshTraffic).toHaveBeenCalledWith(42));
    fireEvent.click(screen.getByRole('radio', { name: 'Fixture second dashboard тариф' }));
    expect(
      await screen.findByRole('heading', { name: 'Fixture second active tariff' }),
    ).toBeTruthy();
    expect(screen.getByText('7.0 GB / 100.0 GB')).toBeTruthy();

    refreshA.resolve({
      traffic_used_gb: 90,
      traffic_used_percent: 90,
      is_unlimited: false,
      rate_limited: true,
      retry_after_seconds: 9,
    });
    await vi.waitFor(() => expect(screen.queryByText('90.0 GB / 100.0 GB')).toBeNull());
    expect(screen.getByText('7.0 GB / 100.0 GB')).toBeTruthy();

    refreshB.resolve({
      traffic_used_gb: 8,
      traffic_used_percent: 8,
      is_unlimited: false,
      rate_limited: true,
      retry_after_seconds: 17,
    });
    expect(await screen.findByRole('button', { name: 'Обновить трафик (17s)' })).toBeTruthy();

    fireEvent.click(screen.getByRole('radio', { name: 'Fixture dashboard тариф' }));
    expect(await screen.findByRole('heading', { name: 'Fixture active tariff' })).toBeTruthy();
    expect(screen.getByText('90.0 GB / 100.0 GB')).toBeTruthy();
    const firstRefreshButton = await screen.findByRole('button', {
      name: /Обновить трафик \(\d+s\)/,
    });
    const firstCooldown = Number(firstRefreshButton.textContent?.match(/\((\d+)s\)/)?.[1]);
    expect(firstCooldown).not.toBe(17);
  });

  it('resets renewal selection when switching subscriptions', async () => {
    setupResolvedQueries();
    mocks.getSubscriptions.mockResolvedValue({
      ...multiSubscription,
      subscriptions: [
        multiSubscription.subscriptions[0],
        {
          ...multiSubscription.subscriptions[0],
          id: 43,
          tariff_id: 8,
          tariff_name: 'Fixture second dashboard тариф',
          device_limit: 3,
        },
      ],
    });
    mocks.getSubscription.mockImplementation((id?: number) =>
      Promise.resolve({
        has_subscription: id != null,
        subscription: id === 43 ? secondActiveSubscription : id === 42 ? activeSubscription : null,
      }),
    );
    mocks.getRenewalOptions.mockImplementation((id?: number) =>
      Promise.resolve(
        id === 43
          ? [
              {
                period_days: 7,
                price_kopeks: 700,
                price_rubles: 7,
                discount_percent: 0,
                original_price_kopeks: null,
              },
            ]
          : [
              {
                period_days: 30,
                price_kopeks: 3000,
                price_rubles: 30,
                discount_percent: 0,
                original_price_kopeks: null,
              },
              {
                period_days: 90,
                price_kopeks: 9000,
                price_rubles: 90,
                discount_percent: 0,
                original_price_kopeks: null,
              },
            ],
      ),
    );

    renderPage();

    expect(await screen.findByRole('heading', { name: 'Fixture active tariff' })).toBeTruthy();
    const longRenewal = screen.getByRole('button', { name: /90 ₽/ });
    fireEvent.click(longRenewal);
    expect(longRenewal.getAttribute('aria-pressed')).toBe('true');

    fireEvent.click(screen.getByRole('radio', { name: 'Fixture second dashboard тариф' }));
    expect(
      await screen.findByRole('heading', { name: 'Fixture second active tariff' }),
    ).toBeTruthy();
    const shortRenewal = await screen.findByRole('button', { name: /7 ₽/ });
    expect(shortRenewal.getAttribute('aria-pressed')).toBe('true');
  });

  it('closes stale traffic top-up state when switching subscriptions', async () => {
    setupResolvedQueries();
    mocks.getSubscriptions.mockResolvedValue({
      ...multiSubscription,
      subscriptions: [
        multiSubscription.subscriptions[0],
        {
          ...multiSubscription.subscriptions[0],
          id: 43,
          tariff_id: 8,
          tariff_name: 'Fixture second dashboard тариф',
          device_limit: 3,
        },
      ],
    });
    mocks.getSubscription.mockImplementation((id?: number) =>
      Promise.resolve({
        has_subscription: id != null,
        subscription: id === 43 ? secondActiveSubscription : id === 42 ? activeSubscription : null,
      }),
    );
    mocks.getTrafficPackages.mockImplementation((id?: number) =>
      Promise.resolve([
        {
          gb: id === 43 ? 25 : 100,
          price_kopeks: id === 43 ? 2500 : 5000,
          price_rubles: id === 43 ? 25 : 50,
          is_unlimited: false,
        },
      ]),
    );

    renderPage();

    expect(await screen.findByRole('heading', { name: 'Fixture active tariff' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Добавить трафик' }));
    fireEvent.click(await screen.findByRole('button', { name: /100/ }));
    expect(
      screen.getByRole('button', { name: 'subscription.additionalOptions.buyTrafficGb' }),
    ).toBeTruthy();

    fireEvent.click(screen.getByRole('radio', { name: 'Fixture second dashboard тариф' }));
    expect(
      await screen.findByRole('heading', { name: 'Fixture second active tariff' }),
    ).toBeTruthy();
    expect(
      screen.queryByRole('button', { name: 'subscription.additionalOptions.buyTrafficGb' }),
    ).toBeNull();
    expect(screen.queryByText('100 ГБ')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Добавить трафик' }));
    const secondPackage = await screen.findByRole('button', { name: /25/ });
    fireEvent.click(secondPackage);
    expect(secondPackage.className).toContain('card-selected');
  });

  it('keeps traffic top-up selection valid after switching the sheet scope', async () => {
    setupResolvedQueries();
    mocks.getSubscriptions.mockResolvedValue({ multi_tariff_enabled: false, subscriptions: [] });
    mocks.getSubscription.mockResolvedValue({
      has_subscription: true,
      subscription: activeSubscription,
    });
    mocks.getTrafficPackages.mockImplementation((_id?: number, scope?: 'regular' | 'whitelist') =>
      Promise.resolve([
        {
          gb: scope === 'whitelist' ? 25 : 100,
          price_kopeks: scope === 'whitelist' ? 2500 : 5000,
          price_rubles: scope === 'whitelist' ? 25 : 50,
          is_unlimited: false,
        },
      ]),
    );

    renderPage();

    expect(await screen.findByRole('heading', { name: 'Fixture active tariff' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Добавить трафик' }));
    fireEvent.click(screen.getByRole('button', { name: 'subscription.whiteInternet' }));
    const whitelistPackage = await screen.findByRole('button', { name: /25/ });
    fireEvent.click(whitelistPackage);

    expect(
      await screen.findByRole('button', {
        name: 'subscription.additionalOptions.buyWhitelistTrafficGb',
      }),
    ).toBeTruthy();
  });

  it('keeps the latest traffic refresh indicator for the same subscription', async () => {
    setupResolvedQueries();
    const firstRefresh = deferred<{
      traffic_used_gb: number;
      traffic_used_percent: number;
      is_unlimited: boolean;
      rate_limited: boolean;
      retry_after_seconds?: number;
    }>();
    const secondRefresh = deferred<{
      traffic_used_gb: number;
      traffic_used_percent: number;
      is_unlimited: boolean;
      rate_limited: boolean;
      retry_after_seconds?: number;
    }>();
    mocks.getSubscriptions.mockResolvedValue({
      ...multiSubscription,
      subscriptions: [
        multiSubscription.subscriptions[0],
        {
          ...multiSubscription.subscriptions[0],
          id: 43,
          tariff_id: 8,
          tariff_name: 'Fixture second dashboard тариф',
          device_limit: 3,
        },
      ],
    });
    mocks.getSubscription.mockImplementation((id?: number) =>
      Promise.resolve({
        has_subscription: id != null,
        subscription: id === 43 ? secondActiveSubscription : id === 42 ? activeSubscription : null,
      }),
    );
    let firstSubscriptionRefreshCalls = 0;
    mocks.refreshTraffic.mockImplementation((id?: number) => {
      if (id === 42) {
        firstSubscriptionRefreshCalls += 1;
        return firstSubscriptionRefreshCalls === 1 ? firstRefresh.promise : secondRefresh.promise;
      }
      if (id === 43) {
        return Promise.resolve({
          traffic_used_gb: 8,
          traffic_used_percent: 8,
          is_unlimited: false,
          rate_limited: false,
        });
      }
      return Promise.reject(new Error('unexpected id'));
    });
    localStorage.removeItem('traffic_refresh_ts_42');
    localStorage.removeItem('traffic_refresh_ts_43');

    renderPage();

    expect(await screen.findByRole('heading', { name: 'Fixture active tariff' })).toBeTruthy();
    await vi.waitFor(() => expect(mocks.refreshTraffic).toHaveBeenCalledWith(42));
    fireEvent.click(screen.getByRole('radio', { name: 'Fixture second dashboard тариф' }));
    expect(
      await screen.findByRole('heading', { name: 'Fixture second active tariff' }),
    ).toBeTruthy();
    expect(await screen.findByRole('button', { name: /Обновить трафик \(\d+s\)/ })).toBeTruthy();

    fireEvent.click(screen.getByRole('radio', { name: 'Fixture dashboard тариф' }));
    expect(await screen.findByRole('heading', { name: 'Fixture active tariff' })).toBeTruthy();
    await vi.waitFor(() => expect(firstSubscriptionRefreshCalls).toBe(2));
    expect(await screen.findByRole('button', { name: 'Обновляем трафик…' })).toBeTruthy();

    firstRefresh.resolve({
      traffic_used_gb: 12,
      traffic_used_percent: 12,
      is_unlimited: false,
      rate_limited: false,
    });
    await firstRefresh.promise;
    await new Promise<void>((resolve) => setTimeout(resolve, 0));

    expect(screen.getByText('18.0 GB / 100.0 GB')).toBeTruthy();
    expect(screen.queryByText('12.0 GB / 100.0 GB')).toBeNull();
    expect(screen.getByRole('button', { name: 'Обновляем трафик…' })).toBeTruthy();

    secondRefresh.resolve({
      traffic_used_gb: 19,
      traffic_used_percent: 19,
      is_unlimited: false,
      rate_limited: false,
    });
    expect(await screen.findByText('19.0 GB / 100.0 GB')).toBeTruthy();
    expect(await screen.findByRole('button', { name: /Обновить трафик \(\d+s\)/ })).toBeTruthy();
  });

  it('opens the LTE top-up flow with the whitelist scope selected', async () => {
    setupResolvedQueries();
    mocks.getSubscriptions.mockResolvedValue({ multi_tariff_enabled: false, subscriptions: [] });
    mocks.getSubscription.mockResolvedValue({
      has_subscription: true,
      subscription: activeSubscription,
    });

    renderPage();

    expect(await screen.findByRole('heading', { name: 'Fixture active tariff' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Добавить LTE-трафик' }));

    expect(await screen.findByText(/LTE сервера: 12\.0/)).toBeTruthy();
  });

  it('opens the real device top-up flow for the active subscription', async () => {
    setupResolvedQueries();
    mocks.getSubscriptions.mockResolvedValue({ multi_tariff_enabled: false, subscriptions: [] });
    mocks.getSubscription.mockResolvedValue({
      has_subscription: true,
      subscription: activeSubscription,
    });

    renderPage();

    expect(await screen.findByRole('heading', { name: 'Fixture active tariff' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Добавить' }));

    expect(await screen.findByText('subscription.buyDevices')).toBeTruthy();
    expect(mocks.getDevicePrice).toHaveBeenCalledWith(1, activeSubscription.id);
  });

  it('restores the device add-on from the current tariff purchase options', async () => {
    setupResolvedQueries();
    mocks.getSubscriptions.mockResolvedValue({ multi_tariff_enabled: false, subscriptions: [] });
    mocks.getSubscription.mockResolvedValue({
      has_subscription: true,
      subscription: activeSubscription,
    });
    mocks.getPurchaseOptions.mockResolvedValueOnce({
      sales_mode: 'tariffs',
      current_tariff_id: activeSubscription.tariff_id,
      balance_kopeks: 0,
      balance_label: '0 ₽',
      tariffs: [
        {
          id: activeSubscription.tariff_id,
          name: activeSubscription.tariff_name,
          description: null,
          tier_level: 1,
          traffic_limit_gb: activeSubscription.traffic_limit_gb,
          traffic_limit_label: '100 ГБ',
          is_unlimited_traffic: false,
          device_limit: activeSubscription.device_limit,
          extra_devices_count: 0,
          servers_count: 0,
          servers: [],
          periods: [],
          is_current: true,
          is_available: true,
          device_price_kopeks: 3000,
          max_device_limit: 10,
        },
      ],
    });

    renderPage();

    expect(await screen.findByRole('heading', { name: 'Fixture active tariff' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Ещё устройства' })).toBeTruthy();
    expect(screen.getByText('от 30 ₽ / мес')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Добавить' })).toBeTruthy();
  });

  it('uses the target HAPP cryptolink resolver and routes INCY through Connection', async () => {
    setupResolvedQueries();
    mocks.getSubscriptions.mockResolvedValue({ multi_tariff_enabled: false, subscriptions: [] });
    mocks.getSubscription.mockResolvedValue({
      has_subscription: true,
      subscription: activeSubscription,
    });
    mocks.getConnectionLink.mockResolvedValue({
      subscription_url: 'https://example.test/subscription',
      display_link: null,
      happ_redirect_link: null,
      happ_scheme_link: null,
      happ_cryptolink: null,
      happ_crypto_link: null,
      happ_link: null,
      connect_mode: 'happ_cryptolink',
      hide_link: true,
      instructions: { steps: [] },
    });

    renderPage();

    expect(await screen.findByRole('heading', { name: 'Fixture active tariff' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Подключить в HAPP' }));
    expect(mocks.openAppScheme).toHaveBeenCalledWith(expect.stringMatching(/^happ:\/\/crypt/));

    fireEvent.click(screen.getByRole('button', { name: 'Показать QR-код' }));
    expect((await screen.findByTestId('current-path')).textContent).toBe('/connection/qr');

    fireEvent.click(screen.getByRole('button', { name: 'Подключить в INCY' }));
    expect((await screen.findByTestId('current-path')).textContent).toBe('/connection');
  });

  it('keeps the active dashboard in a loading state while dependent data is pending', async () => {
    setupResolvedQueries();
    mocks.getSubscriptions.mockResolvedValue({ multi_tariff_enabled: false, subscriptions: [] });
    mocks.getSubscription.mockResolvedValue({
      has_subscription: true,
      subscription: activeSubscription,
    });
    mocks.getConnectionLink.mockImplementation(() => new Promise(() => {}));

    renderPage();

    expect(await screen.findByRole('status', { name: 'Загружаем подписку…' })).toBeTruthy();
  });

  it('keeps the active dashboard when the optional connection query returns 404', async () => {
    setupResolvedQueries();
    mocks.getSubscriptions.mockResolvedValue({ multi_tariff_enabled: false, subscriptions: [] });
    mocks.getSubscription.mockResolvedValue({
      has_subscription: true,
      subscription: activeSubscription,
    });
    mocks.getConnectionLink.mockRejectedValueOnce({ response: { status: 404 } }).mockResolvedValue({
      subscription_url: 'https://example.test/subscription',
      display_link: null,
      happ_redirect_link: null,
      happ_scheme_link: 'happ://add/fixture',
      connect_mode: '',
      hide_link: false,
      instructions: { steps: [] },
    });

    renderPage();

    expect(await screen.findByRole('heading', { name: 'Fixture active tariff' })).toBeTruthy();
    expect(screen.getByText('18.0 GB / 100.0 GB')).toBeTruthy();
    expect(screen.getByText('Fixture device')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Быстрое продление' })).toBeTruthy();
    const connection = screen.getByRole('region', { name: 'Ключ доступа' });
    expect(within(connection).getByRole('alert')).toBeTruthy();
    fireEvent.click(within(connection).getByRole('button', { name: 'Повторить' }));

    await vi.waitFor(() => expect(mocks.getConnectionLink).toHaveBeenCalledTimes(2));
    expect(await screen.findByRole('heading', { name: 'Ключ доступа' })).toBeTruthy();
  });

  it('notifies when removing a device fails', async () => {
    setupResolvedQueries();
    mocks.getSubscriptions.mockResolvedValue({ multi_tariff_enabled: false, subscriptions: [] });
    mocks.getSubscription.mockResolvedValue({
      has_subscription: true,
      subscription: activeSubscription,
    });
    mocks.confirm.mockResolvedValue(true);
    mocks.deleteDevice.mockRejectedValue(new Error('device removal fixture failure'));

    renderPage();

    expect(await screen.findByRole('heading', { name: 'Fixture active tariff' })).toBeTruthy();
    fireEvent.click(await screen.findByRole('button', { name: 'Отключить Fixture device' }));

    await vi.waitFor(() =>
      expect(mocks.notifyError).toHaveBeenCalledWith('Не удалось выполнить действие'),
    );
  });

  it('blocks repeated device removal while the target mutation is pending', async () => {
    setupResolvedQueries();
    mocks.getSubscriptions.mockResolvedValue({ multi_tariff_enabled: false, subscriptions: [] });
    mocks.getSubscription.mockResolvedValue({
      has_subscription: true,
      subscription: activeSubscription,
    });
    mocks.deleteDevice.mockImplementation(() => new Promise(() => {}));
    mocks.confirm.mockResolvedValue(true);

    renderPage();

    expect(await screen.findByRole('heading', { name: 'Fixture active tariff' })).toBeTruthy();
    const removeButton = await screen.findByRole('button', {
      name: 'Отключить Fixture device',
    });
    fireEvent.click(removeButton);
    await vi.waitFor(() => expect(mocks.deleteDevice).toHaveBeenCalledOnce());

    expect(removeButton).toHaveProperty('disabled', true);
    fireEvent.click(removeButton);
    expect(mocks.deleteDevice).toHaveBeenCalledOnce();
  });

  it('provides plural fallback keys for Persian and Chinese dashboard labels', () => {
    expect(faLocale.subscription.trial.daysLabel_one).toBe('روز');
    expect(faLocale.subscription.trial.daysLabel_other).toBe('روز');
    expect(faLocale.subscription.trial.devicesLabel_one).toBe('دستگاه');
    expect(faLocale.subscription.trial.devicesLabel_other).toBe('دستگاه');
    expect(zhLocale.subscription.trial.daysLabel_other).toBe('天');
    expect(zhLocale.subscription.trial.devicesLabel_other).toBe('设备');
  });

  it('renders a target multi-subscription fixture and selects its detail', async () => {
    setupResolvedQueries();
    mocks.getSubscriptions.mockResolvedValue(multiSubscription);
    mocks.getSubscription.mockResolvedValue({
      has_subscription: true,
      subscription: activeSubscription,
    });

    renderPage();

    fireEvent.click(await screen.findByRole('radio', { name: 'Fixture dashboard тариф' }));

    expect(await screen.findByRole('heading', { name: 'Fixture active tariff' })).toBeTruthy();
    expect((await screen.findByTestId('current-path')).textContent).toBe('/dashboard');
    expect(screen.queryByText(/2490|200 ₽|750 ГБ|demo/i)).toBeNull();
  });

  it('renders API-backed traffic and opens the real device-limit sheet', async () => {
    setupResolvedQueries();
    mocks.getSubscriptions.mockResolvedValue(multiSubscription);

    renderPage();

    expect(await screen.findByText('Fixture dashboard тариф')).toBeTruthy();

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

  it('surfaces a retry when the single subscription query fails', async () => {
    setupResolvedQueries();
    mocks.getSubscriptions.mockResolvedValue({ multi_tariff_enabled: false, subscriptions: [] });
    mocks.getSubscription.mockRejectedValue(new Error('fixture subscription failure'));

    renderPage();

    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Повторить' })).toBeTruthy();
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
    expect(
      screen.getByRole('button', { name: /subscription\.trial\.daysLabel_many/ }),
    ).toBeTruthy();
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

  it('loads trial info for an empty multi-tariff dashboard', async () => {
    setupResolvedQueries();
    mocks.getSubscriptions.mockResolvedValue({
      multi_tariff_enabled: true,
      subscriptions: [],
    });
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
    expect(mocks.getTrialInfo).toHaveBeenCalledTimes(1);
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

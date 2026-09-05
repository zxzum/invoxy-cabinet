// @vitest-environment jsdom
import { lazy } from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LazyPage } from '@/App';
import { MainPagesReady } from './MainPagesReady';

const mocks = vi.hoisted(() => ({
  userId: 'user-1',
  getBalance: vi.fn(),
  getSubscriptions: vi.fn(),
  getSubscription: vi.fn(),
  getPurchaseOptions: vi.fn(),
  getTrialInfo: vi.fn(),
  getAppConfig: vi.fn(),
  getConnectionLink: vi.fn(),
  getReferralInfo: vi.fn(),
  getReferralTerms: vi.fn(),
  getBranding: vi.fn(),
  getEmailAuthEnabled: vi.fn(),
  getNotificationSettings: vi.fn(),
  getOffers: vi.fn(),
  getActiveDiscount: vi.fn(),
  getGroupDiscounts: vi.fn(),
  getPendingGifts: vi.fn(),
  getWheelConfig: vi.fn(),
  getNews: vi.fn(),
  getDevices: vi.fn(),
}));

vi.mock('@/api/balance', () => ({ balanceApi: { getBalance: mocks.getBalance } }));
vi.mock('@/api/subscription', () => ({
  subscriptionApi: {
    getSubscriptions: mocks.getSubscriptions,
    getSubscription: mocks.getSubscription,
    getPurchaseOptions: mocks.getPurchaseOptions,
    getTrialInfo: mocks.getTrialInfo,
    getAppConfig: mocks.getAppConfig,
    getConnectionLink: mocks.getConnectionLink,
    getDevices: mocks.getDevices,
  },
}));
vi.mock('@/api/referral', () => ({
  referralApi: {
    getReferralInfo: mocks.getReferralInfo,
    getReferralTerms: mocks.getReferralTerms,
  },
}));
vi.mock('@/api/branding', () => ({
  brandingApi: {
    getBranding: mocks.getBranding,
    getEmailAuthEnabled: mocks.getEmailAuthEnabled,
  },
}));
vi.mock('@/api/notifications', () => ({
  notificationsApi: { getSettings: mocks.getNotificationSettings },
}));
vi.mock('@/api/promo', () => ({
  promoApi: {
    getOffers: mocks.getOffers,
    getActiveDiscount: mocks.getActiveDiscount,
    getGroupDiscounts: mocks.getGroupDiscounts,
  },
}));
vi.mock('@/api/gift', () => ({ giftApi: { getPendingGifts: mocks.getPendingGifts } }));
vi.mock('@/api/wheel', () => ({ wheelApi: { getConfig: mocks.getWheelConfig } }));
vi.mock('@/api/news', () => ({ newsApi: { getNews: mocks.getNews } }));
vi.mock('@/store/auth', () => ({
  useAuthStore: (selector: (state: { user: { id: string } | null }) => unknown) =>
    selector({ user: mocks.userId ? { id: mocks.userId } : null }),
}));

vi.mock('@/pages/SubscriptionPurchase', () => ({ default: () => null }));
vi.mock('@/pages/Connection', () => ({ default: () => null }));
vi.mock('@/pages/Profile', () => ({ default: () => null }));

const SHARED_KEYS = [
  ['balance'],
  ['subscriptions-list'],
  ['subscription', undefined],
  ['purchase-options', undefined],
  ['trial-info'],
  ['appConfig', undefined],
  ['connectionLink', undefined],
  ['referral-info'],
  ['referral-terms'],
  ['branding'],
  ['email-auth-enabled'],
  ['notification-settings'],
  ['promo-offers'],
  ['active-discount'],
  ['promo-group-discounts'],
  ['pending-gifts'],
  ['wheel-config'],
  ['news', 'list', undefined, 6],
] as const;

const LATER_BATCH = [
  ['trial-info'],
  ['appConfig', undefined],
  ['connectionLink', undefined],
  ['referral-info'],
  ['referral-terms'],
  ['branding'],
  ['email-auth-enabled'],
  ['notification-settings'],
  ['promo-offers'],
  ['active-discount'],
  ['promo-group-discounts'],
  ['pending-gifts'],
  ['wheel-config'],
  ['news', 'list', undefined, 6],
] as const;

type Deferred<T> = {
  promise: Promise<T>;
  resolve: (value: T | PromiseLike<T>) => void;
};

function deferred<T>(): Deferred<T> {
  let resolve!: Deferred<T>['resolve'];
  const promise = new Promise<T>((nextResolve) => {
    resolve = nextResolve;
  });
  return { promise, resolve };
}

function createClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
}

function renderReady(client: QueryClient) {
  return render(
    <QueryClientProvider client={client}>
      <MainPagesReady>
        <div data-testid="ready-content">ready</div>
      </MainPagesReady>
    </QueryClientProvider>,
  );
}

async function flush() {
  await Promise.resolve();
  await Promise.resolve();
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
}

beforeEach(() => {
  mocks.userId = 'user-1';
  for (const value of Object.values(mocks)) {
    if (vi.isMockFunction(value)) value.mockReset().mockResolvedValue({});
  }
  mocks.getSubscriptions.mockResolvedValue({ subscriptions: [], multi_tariff_enabled: false });
  mocks.getSubscription.mockResolvedValue({ has_subscription: false, subscription: null });
  mocks.getNews.mockResolvedValue({ items: [], total: 0 });
});

afterEach(cleanup);

describe('MainPagesReady', () => {
  it('keeps the ready shell visible with an explicit shell fallback', async () => {
    const destination = deferred<{ default: () => React.ReactNode }>();
    const PendingPage = lazy(() => destination.promise);
    const client = createClient();

    render(
      <QueryClientProvider client={client}>
        <MainPagesReady>
          <div data-testid="ready-shell">
            <div>shell navigation</div>
            <LazyPage fallback={null}>
              <PendingPage />
            </LazyPage>
          </div>
        </MainPagesReady>
      </QueryClientProvider>,
    );

    expect(await screen.findByTestId('ready-shell')).toBeTruthy();
    expect(screen.getByText('shell navigation')).toBeTruthy();
    expect(document.querySelector('.animate-spin')).toBeNull();

    destination.resolve({ default: () => <div>destination</div> });
    expect(await screen.findByText('destination')).toBeTruthy();
  });

  it('keeps a PageLoader as the default for non-shell lazy routes', () => {
    const PendingPage = lazy(() => new Promise<{ default: () => React.ReactNode }>(() => {}));

    render(
      <LazyPage>
        <PendingPage />
      </LazyPage>,
    );

    expect(document.querySelector('.animate-spin')).toBeTruthy();
  });

  it('warms shared cache keys and keeps children hidden while APIs are pending', async () => {
    const balance = deferred<Record<string, never>>();
    mocks.getBalance.mockImplementationOnce(() => balance.promise);
    const client = createClient();
    const view = renderReady(client);

    await waitFor(() => expect(mocks.getBalance).toHaveBeenCalledTimes(1));
    expect(view.container.querySelector('.animate-spin')).toBeTruthy();
    expect(screen.queryByTestId('ready-content')).toBeNull();
    expect(mocks.getTrialInfo).not.toHaveBeenCalled();

    balance.resolve({});
    expect(await screen.findByTestId('ready-content')).toBeTruthy();

    for (const key of SHARED_KEYS) {
      expect(client.getQueryData(key)).toBeDefined();
    }
    expect(mocks.getNews).toHaveBeenCalledWith({ limit: 6, offset: 0 });
  });

  it('reuses warmed cache on remount', async () => {
    const client = createClient();
    const first = renderReady(client);
    await screen.findByTestId('ready-content');
    const callCounts = new Map(
      Object.entries(mocks)
        .filter(([, value]) => typeof value === 'function')
        .map(([name, value]) => [name, (value as ReturnType<typeof vi.fn>).mock.calls.length]),
    );
    first.unmount();

    renderReady(client);
    expect(screen.getByTestId('ready-content')).toBeTruthy();
    for (const [name, count] of callCounts) {
      const mock = mocks[name as keyof typeof mocks];
      if (typeof mock === 'function') expect(mock).toHaveBeenCalledTimes(count);
    }
  });

  it('does not start later warm batches after cancellation', async () => {
    const balance = deferred<Record<string, never>>();
    mocks.getBalance.mockImplementationOnce(() => balance.promise);
    const client = createClient();
    const prefetch = vi.spyOn(client, 'prefetchQuery');
    renderReady(client);

    await waitFor(() => expect(mocks.getBalance).toHaveBeenCalledTimes(1));
    await client.cancelQueries({ queryKey: ['main-pages-ready', 'user-1'] });
    balance.resolve({});
    await flush();

    for (const key of LATER_BATCH) {
      expect(
        prefetch.mock.calls.filter(
          ([options]) => JSON.stringify(options.queryKey) === JSON.stringify(key),
        ),
      ).toHaveLength(0);
    }
    expect(mocks.getTrialInfo).not.toHaveBeenCalled();
    expect(screen.queryByTestId('ready-content')).toBeNull();
    prefetch.mockRestore();
  });

  it('stops the stale warm sequence when account changes', async () => {
    const balance = deferred<Record<string, never>>();
    mocks.getBalance.mockImplementationOnce(() => balance.promise);
    const client = createClient();
    const prefetch = vi.spyOn(client, 'prefetchQuery');
    const view = renderReady(client);

    await waitFor(() => expect(mocks.getBalance).toHaveBeenCalledTimes(1));
    mocks.userId = 'user-2';
    view.rerender(
      <QueryClientProvider client={client}>
        <MainPagesReady>
          <div data-testid="ready-content">ready</div>
        </MainPagesReady>
      </QueryClientProvider>,
    );
    balance.resolve({});
    await screen.findByTestId('ready-content');

    for (const key of LATER_BATCH) {
      expect(
        prefetch.mock.calls.filter(
          ([options]) => JSON.stringify(options.queryKey) === JSON.stringify(key),
        ),
      ).toHaveLength(1);
    }
    prefetch.mockRestore();
  });
});

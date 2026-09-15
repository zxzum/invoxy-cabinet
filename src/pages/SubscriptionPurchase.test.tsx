// @vitest-environment jsdom
import type { ReactNode } from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import SubscriptionPurchase from './SubscriptionPurchase';

const mocks = vi.hoisted(() => ({
  getSubscription: vi.fn(),
  getPurchaseOptions: vi.fn(),
  getSubscriptions: vi.fn(),
  getTrafficPackages: vi.fn(),
}));

vi.mock('../api/subscription', () => ({
  subscriptionApi: {
    getSubscription: mocks.getSubscription,
    getPurchaseOptions: mocks.getPurchaseOptions,
    getSubscriptions: mocks.getSubscriptions,
    getTrafficPackages: mocks.getTrafficPackages,
  },
}));
vi.mock('../api/balance', () => ({
  balanceApi: {
    getBalance: vi.fn().mockResolvedValue({ balance_rubles: 0, balance_kopeks: 0 }),
  },
}));
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: unknown) => (typeof fallback === 'string' ? fallback : key),
    i18n: { language: 'ru' },
  }),
  initReactI18next: { type: '3rdParty', init: () => {} },
}));
vi.mock('../hooks/useTheme', () => ({ useTheme: () => ({ isDark: true }) }));
vi.mock('../api/promo', () => ({
  promoApi: { getLoyaltyTiers: vi.fn().mockResolvedValue(null) },
}));
vi.mock('../hooks/useCurrency', () => ({
  useCurrency: () => ({ formatWithCurrency: (amount: number) => `${amount} ₽` }),
}));
vi.mock('../utils/glassTheme', () => ({
  getGlassColors: () => ({ cardBg: '', cardBorder: '', shadow: '' }),
}));
vi.mock('../components/WebBackButton', () => ({ WebBackButton: () => null }));
vi.mock('../store/successNotification', () => ({
  useCloseOnSuccessNotification: () => {},
}));
vi.mock('../components/subscription/sheets/SwitchTariffSheet', () => ({
  SwitchTariffSheet: () => null,
}));
vi.mock('../components/subscription/purchase/TariffPurchaseForm', () => ({
  TariffPurchaseForm: () => null,
}));
vi.mock('../components/subscription/purchase/TariffPickerGrid', () => ({
  TariffPickerGrid: ({ tariffs }: { tariffs: Array<{ name: string }> }) => (
    <div className="glass-surface">
      <div data-testid="cached-options">{tariffs[0]?.name}</div>
    </div>
  ),
}));
vi.mock('../components/subscription/purchase/ClassicPurchaseWizard', () => ({
  ClassicPurchaseWizard: () => null,
}));
vi.mock('../components/ui/ResponsiveSheet', () => ({ ResponsiveSheet: () => null }));
vi.mock('@/components/icons', () => ({
  DevicesIcon: () => null,
  ExclamationIcon: () => null,
  SparklesIcon: () => null,
  TrafficIcon: () => null,
  WalletIcon: () => null,
}));
vi.mock('@/components/ui/skeleton', () => ({
  PageSkeleton: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  Skeleton: () => null,
}));

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

afterEach(cleanup);
beforeEach(() => vi.clearAllMocks());

describe('SubscriptionPurchase cache refresh', () => {
  it('keeps cached options visible while refreshing subscription data on mount', async () => {
    const cachedSubscription = { has_subscription: false, subscription: null };
    const cachedPurchaseOptions = {
      sales_mode: 'tariffs' as const,
      tariffs: [{ name: 'Cached tariff' }],
    };
    const subscription = deferred<typeof cachedSubscription>();
    const purchaseOptions = deferred<typeof cachedPurchaseOptions>();
    mocks.getSubscription.mockReturnValue(subscription.promise);
    mocks.getPurchaseOptions.mockReturnValue(purchaseOptions.promise);
    mocks.getSubscriptions.mockResolvedValue({ multi_tariff_enabled: false });

    const client = createClient();
    client.setQueryData(['subscription', undefined], cachedSubscription);
    client.setQueryData(['purchase-options', undefined], cachedPurchaseOptions);
    client.setQueryData(['subscriptions-list'], { multi_tariff_enabled: false });

    render(
      <MemoryRouter initialEntries={['/subscription/purchase']}>
        <QueryClientProvider client={client}>
          <SubscriptionPurchase />
        </QueryClientProvider>
      </MemoryRouter>,
    );

    expect(screen.getByTestId('cached-options').textContent).toBe('Cached tariff');
    await waitFor(() => {
      expect(mocks.getSubscription).toHaveBeenCalledTimes(1);
      expect(mocks.getPurchaseOptions).toHaveBeenCalledTimes(1);
    });

    subscription.resolve(cachedSubscription);
    purchaseOptions.resolve(cachedPurchaseOptions);
  });

  it('keeps tariff choices inside the target glass surface', async () => {
    const purchaseOptions = {
      sales_mode: 'tariffs' as const,
      tariffs: [{ name: 'API tariff' }],
    };
    mocks.getSubscription.mockResolvedValue({ has_subscription: false, subscription: null });
    mocks.getPurchaseOptions.mockResolvedValue(purchaseOptions);
    mocks.getSubscriptions.mockResolvedValue({ multi_tariff_enabled: false });

    const client = createClient();
    render(
      <MemoryRouter initialEntries={['/subscription/purchase']}>
        <QueryClientProvider client={client}>
          <SubscriptionPurchase />
        </QueryClientProvider>
      </MemoryRouter>,
    );

    const tariff = await screen.findByTestId('cached-options');
    expect(tariff.closest('.glass-surface')).toBeTruthy();
  });

  it('shows API-backed add-ons for an active paid subscription', async () => {
    mocks.getSubscription.mockResolvedValue({
      has_subscription: true,
      subscription: {
        id: 42,
        status: 'active',
        is_active: true,
        is_limited: false,
        is_trial: false,
        device_limit: 5,
        whitelist_traffic_limit_gb: 50,
      },
    });
    mocks.getPurchaseOptions.mockResolvedValue({
      sales_mode: 'tariffs' as const,
      tariffs: [
        {
          id: 7,
          name: 'Standard',
          is_current: true,
          device_limit: 5,
          device_price_kopeks: 3_000,
          max_device_limit: 10,
        },
      ],
      current_tariff_id: 7,
      balance_kopeks: 10_000,
    });
    mocks.getSubscriptions.mockResolvedValue({ multi_tariff_enabled: false });
    mocks.getTrafficPackages.mockImplementation((_subscriptionId: number, scope: string) =>
      Promise.resolve([
        {
          gb: scope === 'whitelist' ? 50 : 100,
          price_kopeks: scope === 'whitelist' ? 15_000 : 5_000,
          price_rubles: scope === 'whitelist' ? 150 : 50,
          is_unlimited: false,
          is_available: true,
        },
      ]),
    );

    const client = createClient();
    render(
      <MemoryRouter initialEntries={['/tariffs']}>
        <QueryClientProvider client={client}>
          <SubscriptionPurchase />
        </QueryClientProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByRole('heading', { name: 'Дополнительные опции' })).toBeTruthy();
    expect(screen.getByText('Ещё устройства')).toBeTruthy();
    expect(screen.getByText('Основной трафик')).toBeTruthy();
    expect(screen.getByText('Доп. LTE-трафик')).toBeTruthy();
    await waitFor(() => {
      expect(mocks.getTrafficPackages).toHaveBeenCalledWith(42, 'regular');
      expect(mocks.getTrafficPackages).toHaveBeenCalledWith(42, 'whitelist');
    });
  });
});

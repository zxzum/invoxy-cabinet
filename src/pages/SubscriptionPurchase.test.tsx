// @vitest-environment jsdom
import type { ReactNode } from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import SubscriptionPurchase from './SubscriptionPurchase';

const mocks = vi.hoisted(() => ({
  getSubscription: vi.fn(),
  getPurchaseOptions: vi.fn(),
  getSubscriptions: vi.fn(),
}));

vi.mock('../api/subscription', () => ({
  subscriptionApi: {
    getSubscription: mocks.getSubscription,
    getPurchaseOptions: mocks.getPurchaseOptions,
    getSubscriptions: mocks.getSubscriptions,
  },
}));
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: unknown) => (typeof fallback === 'string' ? fallback : key),
  }),
}));
vi.mock('../hooks/useTheme', () => ({ useTheme: () => ({ isDark: true }) }));
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
    <div data-testid="cached-options">{tariffs[0]?.name}</div>
  ),
}));
vi.mock('../components/subscription/purchase/ClassicPurchaseWizard', () => ({
  ClassicPurchaseWizard: () => null,
}));
vi.mock('../components/ui/ResponsiveSheet', () => ({ ResponsiveSheet: () => null }));
vi.mock('@/components/icons', () => ({
  ExclamationIcon: () => null,
  SparklesIcon: () => null,
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
});

// @vitest-environment jsdom
import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TrafficTopupSheet } from './TrafficTopupSheet';
import type { Subscription, PurchaseOptions, TrafficResetStatus } from '../../../types';

const mocks = vi.hoisted(() => ({
  getTrafficPackages: vi.fn(),
  purchaseTraffic: vi.fn(),
  getTrafficReset: vi.fn(),
  resetTraffic: vi.fn(),
  saveTrafficResetCart: vi.fn(),
  showSuccess: vi.fn(),
}));

vi.mock('../../../api/subscription', () => ({
  subscriptionApi: {
    getTrafficPackages: mocks.getTrafficPackages,
    purchaseTraffic: mocks.purchaseTraffic,
    getTrafficReset: mocks.getTrafficReset,
    resetTraffic: mocks.resetTraffic,
    saveTrafficResetCart: mocks.saveTrafficResetCart,
  },
}));

vi.mock('../../../store/successNotification', () => ({
  useSuccessNotification: (selector: (state: unknown) => unknown) =>
    selector({ show: mocks.showSuccess }),
}));

vi.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: vi.fn() },
  useTranslation: () => ({
    t: (key: string, fallback?: unknown) =>
      typeof fallback === 'string'
        ? fallback
        : typeof (fallback as { defaultValue?: string })?.defaultValue === 'string'
          ? (fallback as { defaultValue: string }).defaultValue
          : key,
  }),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const activeLteSub = {
  id: 42,
  status: 'active',
  is_trial: false,
  traffic_limit_gb: 350,
  traffic_used_gb: 50,
  traffic_used_percent: 14,
  whitelist_traffic_limit_gb: 50,
  whitelist_traffic_used_gb: 12,
  whitelist_traffic_used_percent: 24,
  device_limit: 3,
  connected_squads: [],
  subscription_url: 'https://example.test',
  tariff_id: 10,
  tariff_name: 'Стандарт LTE',
} as unknown as Subscription;

const activeRegularSub = {
  id: 43,
  status: 'active',
  is_trial: false,
  traffic_limit_gb: 350,
  traffic_used_gb: 50,
  traffic_used_percent: 14,
  whitelist_traffic_limit_gb: 0,
  whitelist_traffic_used_gb: 0,
  whitelist_traffic_used_percent: 0,
  device_limit: 3,
  connected_squads: [],
  subscription_url: 'https://example.test',
  tariff_id: 11,
  tariff_name: 'Стандарт',
} as unknown as Subscription;

const trialSub: Subscription = {
  ...activeRegularSub,
  id: 44,
  is_trial: true,
};

const defaultPurchaseOptions = {
  sales_mode: 'classic',
  balance_kopeks: 50000,
  balance_label: '500 ₽',
  devices: {
    min: 1,
    max: 10,
    default: 3,
    current: 3,
    price_per_device_kopeks: 3000,
    price_per_device_label: '30 ₽',
  },
} as unknown as PurchaseOptions;

const defaultResetStatus: TrafficResetStatus = {
  enabled: true,
  chunk_gb: 50,
  price_kopeks: 15000,
  price_rubles: 150,
  min_used_gb: 10,
  used_gb: 12,
  limit_gb: 50,
  will_clear_gb: 12,
  used_after_gb: 0,
  max_per_month: 1,
  used_this_month: 0,
  remaining_this_month: 1,
  next_available_at: null,
  unavailable_reason: null,
  exhausted: false,
};

function renderSheet(props: Partial<Parameters<typeof TrafficTopupSheet>[0]> = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <TrafficTopupSheet
        open={true}
        onOpen={vi.fn()}
        onClose={vi.fn()}
        subscription={activeLteSub}
        subscriptionId={activeLteSub.id}
        selectedTrafficPackage={null}
        onSelectedTrafficPackageChange={vi.fn()}
        purchaseOptions={defaultPurchaseOptions}
        isDark={true}
        {...props}
      />
    </QueryClientProvider>,
  );
}

describe('TrafficTopupSheet', () => {
  it('renders nothing when subscription is trial', () => {
    const { container } = renderSheet({ subscription: trialSub, subscriptionId: trialSub.id });
    expect(container.firstChild).toBeNull();
  });

  it('renders LTE traffic reset flow with honest calculation and warning', async () => {
    mocks.getTrafficReset.mockResolvedValue(defaultResetStatus);
    mocks.resetTraffic.mockResolvedValue({
      success: true,
      cleared_gb: 12,
      new_used_gb: 0,
      limit_gb: 50,
      remaining_this_month: 0,
      max_per_month: 1,
      price_kopeks: 15000,
    });

    renderSheet();

    expect(await screen.findByText('Сброс расхода LTE')).toBeTruthy();
    expect(screen.getByText(/Лимит тарифа не увеличивается/)).toBeTruthy();
    expect(screen.getByText(/Будет списано расхода: 12\.0 ГБ/)).toBeTruthy();

    const checkbox = screen.getByRole('checkbox');
    expect((checkbox as HTMLInputElement).checked).toBe(false);

    const submitButton = screen.getByRole('button', { name: /сбросить за 150 ₽/i });
    expect((submitButton as HTMLButtonElement).disabled).toBe(true);

    fireEvent.click(checkbox);
    expect((submitButton as HTMLButtonElement).disabled).toBe(false);

    fireEvent.click(submitButton);
    await vi.waitFor(() => expect(mocks.resetTraffic).toHaveBeenCalledWith(42));
  });

  it('disables reset action and displays note when usage is below min_used threshold', async () => {
    mocks.getTrafficReset.mockResolvedValue({
      ...defaultResetStatus,
      used_gb: 5,
      min_used_gb: 10,
      unavailable_reason: 'below_min_used',
    });

    renderSheet();

    expect(await screen.findByText(/Сброс доступен после 10 ГБ расхода/)).toBeTruthy();
    expect(screen.queryByRole('checkbox')).toBeNull();
    expect(screen.queryByRole('button', { name: /сбросить за 150 ₽/i })).toBeNull();
  });

  it('disables reset action and displays note when monthly limit reached', async () => {
    mocks.getTrafficReset.mockResolvedValue({
      ...defaultResetStatus,
      used_this_month: 1,
      remaining_this_month: 0,
      unavailable_reason: 'monthly_limit',
      next_available_at: '2026-10-01T00:00:00Z',
    });

    renderSheet();

    expect(await screen.findByText(/Лимит сбросов на этот месяц исчерпан/)).toBeTruthy();
    expect(screen.queryByRole('checkbox')).toBeNull();
    expect(screen.queryByRole('button', { name: /сбросить за 150 ₽/i })).toBeNull();
  });

  it('renders regular top-up mode for non-LTE subscriptions', async () => {
    mocks.getTrafficPackages.mockResolvedValue([
      { gb: 100, price_kopeks: 5000, price_rubles: 50, is_unlimited: false },
    ]);
    mocks.purchaseTraffic.mockResolvedValue({
      success: true,
      amount_paid_kopeks: 5000,
      gb_added: 100,
      traffic_limit_gb: 450,
    });

    renderSheet({
      subscription: activeRegularSub,
      subscriptionId: activeRegularSub.id,
      initialScope: 'regular',
    });

    expect(await screen.findByText(/100/)).toBeTruthy();
    expect(screen.queryByText('Сброс расхода LTE')).toBeNull();
  });
});

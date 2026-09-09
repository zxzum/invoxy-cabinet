// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Tariff } from '../../../types';
import { TariffPurchaseForm } from './TariffPurchaseForm';

const mocks = vi.hoisted(() => ({
  scrollIntoView: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: unknown) => {
      if (key === 'common.currency') return '₽';
      if (key === 'common.units.gb') return 'ГБ';
      if (key === 'subscription.devices') {
        const count = (options as { count?: number } | undefined)?.count;
        return count === undefined ? 'Устройства' : `${count} устройств`;
      }
      if (key === 'subscription.selectPeriod') return 'Период';
      if (key === 'subscription.summary.period') {
        return `Период: ${(options as { label?: string } | undefined)?.label ?? ''}`;
      }
      if (key === 'subscription.summary.traffic') {
        return `Трафик: ${(options as { gb?: number } | undefined)?.gb ?? ''} ГБ`;
      }
      if (key === 'subscription.purchase') return 'Купить';
      if (key === 'subscription.from') return 'от';
      if (key === 'subscription.month') return 'месяц';
      if (key === 'subscription.perMonth') return '/мес';
      if (key === 'subscription.whiteInternet') return 'Белый интернет';
      if (key === 'subscription.primaryTraffic') return 'Основной трафик';
      if (key === 'subscription.primaryTrafficDescription') return 'общий интернет через VPN';
      if (key === 'subscription.whiteInternetDescription') {
        return 'отдельная квота для Белого интернета';
      }
      if (key === 'subscription.additionalDevice') return 'Доп. устройство';
      if (key === 'subscription.free') return 'Бесплатно';
      if (key === 'common.back') return 'Назад';
      if (typeof options === 'string') return options;
      return key;
    },
    i18n: { language: 'ru' },
  }),
  initReactI18next: { type: '3rdParty', init: () => {} },
}));

vi.mock('../../../api/subscription', () => ({
  subscriptionApi: {
    purchaseTariff: vi.fn(),
    purchaseWithSbpRecurring: vi.fn(),
    purchaseWithLavaRecurring: vi.fn(),
  },
}));
vi.mock('../../../hooks/useCurrency', () => ({
  useCurrency: () => ({
    formatAmount: (amount: number) => amount.toFixed(2),
    currencySymbol: '₽',
  }),
}));
vi.mock('../../../hooks/usePromoDiscount', () => ({
  usePromoDiscount: () => ({
    applyPromoDiscount: (price: number, original?: number | null) => ({
      price,
      original: original ?? null,
      percent: null,
      isPromoGroup: false,
    }),
  }),
}));
vi.mock('../../../store/successNotification', () => ({
  useSuccessNotification: (selector: (state: { show: () => void }) => unknown) =>
    selector({ show: vi.fn() }),
}));
vi.mock('../../../platform', () => ({
  usePlatform: () => ({ openLink: vi.fn(), platform: 'web' }),
}));
vi.mock('../../../utils/openPaymentUrl', () => ({ openPaymentUrl: vi.fn() }));
vi.mock('../../payment/TariffPaymentSheet', () => ({ TariffPaymentSheet: () => null }));
vi.mock('../BestValueBadge', () => ({ BestValueBadge: () => null }));

const tariff: Tariff = {
  id: 7,
  name: 'Стандарт',
  description: 'Длинное маркетинговое описание тарифа',
  tier_level: 1,
  traffic_limit_gb: 100,
  traffic_limit_label: '100 ГБ',
  is_unlimited_traffic: false,
  whitelist_traffic_limit_gb: 20,
  device_limit: 2,
  base_device_limit: 2,
  extra_devices_count: 0,
  servers_count: 1,
  servers: [],
  periods: [
    {
      days: 30,
      months: 1,
      label: '30 дней',
      price_kopeks: 9900,
      price_label: '99 ₽',
      price_per_month_kopeks: 9900,
      price_per_month_label: '99 ₽',
    },
  ],
  is_current: false,
  is_available: true,
};

beforeEach(() => {
  HTMLElement.prototype.scrollIntoView = mocks.scrollIntoView;
});

afterEach(() => {
  cleanup();
  mocks.scrollIntoView.mockClear();
});

function renderForm() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <TariffPurchaseForm
          tariff={tariff}
          subscriptionId={undefined}
          balanceKopeks={10000}
          showHeader={false}
          onBack={vi.fn()}
        />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('TariffPurchaseForm modal mode', () => {
  it('shows only a compact benefits summary and does not scroll the sheet on open', async () => {
    renderForm();

    expect(screen.queryByText('Длинное маркетинговое описание тарифа')).toBeNull();
    expect(screen.getByText('Основной трафик: 100 ГБ')).toBeTruthy();
    expect(screen.getByText('Устройства: 2')).toBeTruthy();
    expect(screen.getByText('Белый интернет: 20 ГБ')).toBeTruthy();
    expect(screen.getByText('30 дней')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Купить' })).toBeTruthy();

    await waitFor(() => expect(mocks.scrollIntoView).not.toHaveBeenCalled());
  });
});

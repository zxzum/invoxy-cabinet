// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ClassicPurchaseOptions, PeriodOption } from '../../../types';
import { ClassicPurchaseWizard } from './ClassicPurchaseWizard';

vi.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => {} },
  useTranslation: () => ({
    t: (key: string, fallback?: unknown) => {
      if (key === 'subscription.noPeriodsAvailable') {
        return 'Нет доступных периодов для продления';
      }
      if (key === 'subscription.noPeriodsAvailableHint') return 'Выберите другой тариф.';
      return typeof fallback === 'string' ? fallback : key;
    },
  }),
}));
vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof import('react-router')>('react-router');
  return { ...actual, useNavigate: () => vi.fn() };
});
vi.mock('../../../api/subscription', () => ({
  subscriptionApi: {
    previewPurchase: vi.fn(),
    submitPurchase: vi.fn(),
  },
}));
vi.mock('../../../hooks/useCurrency', () => ({
  useCurrency: () => ({ formatAmount: (amount: number) => String(amount), currencySymbol: '₽' }),
}));
vi.mock('../../../hooks/usePromoDiscount', () => ({
  usePromoDiscount: () => ({
    activeDiscount: undefined,
    applyPromoDiscount: (price: number) => ({
      price,
      original: null,
      percent: null,
      isPromoGroup: false,
    }),
  }),
}));
vi.mock('../../../store/successNotification', () => ({
  useSuccessNotification: (selector: (state: { show: () => void }) => unknown) =>
    selector({ show: vi.fn() }),
  useCloseOnSuccessNotification: () => {},
}));

const invalidPrices = [
  0,
  -1,
  0.5,
  Number.NaN,
  Number.POSITIVE_INFINITY,
  Number.NEGATIVE_INFINITY,
] as const;

function period(price: number): PeriodOption {
  return {
    id: '30',
    period_days: 30,
    months: 1,
    label: '30 дней',
    price_kopeks: price,
    price_label: 'invalid',
    per_month_price_kopeks: price,
    per_month_price_label: 'invalid',
    is_available: true,
    traffic: { selectable: false, mode: 'fixed', options: [] },
    servers: { options: [], min: 1, max: 1, default: [], selected: [] },
    devices: {
      min: 1,
      max: 1,
      default: 1,
      current: 1,
      price_per_device_kopeks: 100,
      price_per_device_label: '1 ₽',
    },
  };
}

function options(price: number): ClassicPurchaseOptions {
  return {
    sales_mode: 'classic',
    currency: 'RUB',
    balance_kopeks: 10000,
    balance_label: '100 ₽',
    subscription_id: null,
    periods: [period(price)],
    traffic: { selectable: false, mode: 'fixed', options: [] },
    servers: { options: [], min: 1, max: 1, default: [], selected: [] },
    devices: {
      min: 1,
      max: 1,
      default: 1,
      current: 1,
      price_per_device_kopeks: 100,
      price_per_device_label: '1 ₽',
    },
    selection: {
      period_id: '30',
      period_days: 30,
      traffic_value: 0,
      servers: [],
      devices: 1,
    },
  };
}

afterEach(cleanup);

describe('ClassicPurchaseWizard price boundary', () => {
  it.each(invalidPrices)('shows an empty state for unusable period price %s', (price) => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter>
          <ClassicPurchaseWizard
            classicOptions={options(price)}
            subscription={null}
            subscriptionId={undefined}
          />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(screen.getByText('Нет доступных периодов для продления')).toBeTruthy();
    expect(screen.queryByText('30 дней')).toBeNull();
  });
});

// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router';
import { TariffPickerGrid } from './TariffPickerGrid';
import type { Tariff } from '../../../types';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: unknown) => {
      if (key === 'common.units.gb') return 'ГБ';
      if (key === 'subscription.whiteInternet') return 'LTE';
      if (key === 'subscription.whiteInternetServers') return 'LTE сервера';
      if (key === 'subscription.devices') {
        const count = (options as { count?: number } | undefined)?.count;
        return `${count} устройств`;
      }
      if (key === 'subscription.from') return 'от';
      if (key === 'subscription.perMonth') return '/мес';
      if (key === 'subscription.additionalOptions.maxDevices') {
        return `максимум ${(options as { count: number }).count}`;
      }
      if (typeof options === 'string') return options;
      return key;
    },
  }),
}));
vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof import('react-router')>('react-router');
  return { ...actual, useNavigate: () => vi.fn() };
});
vi.mock('../../../hooks/useTheme', () => ({ useTheme: () => ({ isDark: true }) }));
vi.mock('../../../hooks/useCurrency', () => ({
  useCurrency: () => ({
    formatAmount: (amount: number) => String(amount),
    currencySymbol: '₽',
  }),
}));
vi.mock('../../../hooks/usePromoDiscount', () => ({
  usePromoDiscount: () => ({
    applyPromoDiscount: (price: number) => ({ price }),
  }),
}));

const tariff: Tariff = {
  id: 1,
  name: 'Standard LTE',
  description: null,
  tier_level: 1,
  traffic_limit_gb: 750,
  traffic_limit_label: '750 ГБ',
  is_unlimited_traffic: false,
  whitelist_traffic_limit_gb: 50,
  device_limit: 5,
  base_device_limit: 5,
  max_device_limit: 10,
  extra_devices_count: 0,
  device_price_kopeks: 5000,
  servers_count: 1,
  servers: [],
  periods: [],
  is_current: false,
  is_available: true,
};

afterEach(cleanup);

describe('TariffPickerGrid quota presentation', () => {
  it('renders explicit quota and device add-on labels from tariff values', () => {
    render(
      <MemoryRouter>
        <TariffPickerGrid
          tariffs={[tariff]}
          subscription={null}
          purchaseOptions={undefined}
          isTariffsMode
          isMultiTariff={false}
          onSelectTariff={vi.fn()}
          onSwitchTariff={vi.fn()}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText('Основной трафик 750 ГБ — общий интернет через VPN')).toBeTruthy();
    const whiteInternetBadge = screen.getByText('LTE 50 ГБ — отдельная квота LTE').parentElement;
    expect(whiteInternetBadge).toBeTruthy();
    expect(whiteInternetBadge?.className).toContain('whitespace-normal');
    expect(whiteInternetBadge?.className).toContain('break-words');
    expect(whiteInternetBadge?.className).not.toContain('whitespace-nowrap');
    expect(screen.getByText('Доп. устройство от 50 ₽/мес, максимум 10 устройств')).toBeTruthy();
  });
});

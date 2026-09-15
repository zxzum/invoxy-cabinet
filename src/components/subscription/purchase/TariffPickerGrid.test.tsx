// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
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
      if (key === 'subscription.primaryTraffic') return 'Основной трафик';
      if (key === 'dashboard.luna.traffic.lte') return 'LTE-трафик';
      if (key === 'subscription.lteEnabled') return 'LTE включён';
      if (key === 'subscription.devicesPrefix') return 'До';
      if (key === 'subscription.unlimited') return '∞';
      if (key === 'subscription.devices') {
        const count = (options as { count?: number } | undefined)?.count;
        return `${count} устройств`;
      }
      if (key === 'subscription.from') return 'от';
      if (key === 'subscription.perMonth') return '/мес';
      if (key === 'subscription.noOptionsAvailable') return 'Нет доступных вариантов подписки';
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
vi.mock('./PromoTierSheet', () => ({
  PromoTierSheet: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => (
    <div data-testid="promo-tier-sheet" data-open={String(isOpen)}>
      <button type="button" aria-label="close promo sheet" onClick={onClose} />
    </div>
  ),
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

const invalidPrices = [
  0,
  -1,
  0.5,
  Number.NaN,
  Number.POSITIVE_INFINITY,
  Number.NEGATIVE_INFINITY,
] as const;

function tariffWithPrice(price: number): Tariff {
  return {
    ...tariff,
    periods: [
      {
        days: 30,
        months: 1,
        label: '30 дней',
        price_kopeks: price,
        price_label: 'invalid',
        price_per_month_kopeks: price,
        price_per_month_label: 'invalid',
      },
    ],
  };
}

afterEach(cleanup);

describe('TariffPickerGrid quota presentation', () => {
  it('renders short quota facts and the LTE indicator from tariff values', () => {
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

    expect(screen.getByText('750 ГБ')).toBeTruthy();
    const lteBlock = document.querySelector('[data-tariff-lte-traffic]');
    expect(lteBlock).toBeTruthy();
    expect(lteBlock?.textContent).toContain('LTE-трафик');
    expect(lteBlock?.textContent).toContain('50 ГБ');
    expect(lteBlock?.className).toContain('bg-accent-500/10');
    expect(screen.getByText('LTE включён')).toBeTruthy();
    expect(screen.queryByText(/Доп\. устройство/)).toBeNull();
  });

  it('flags tariffs without LTE with a muted badge', () => {
    render(
      <MemoryRouter>
        <TariffPickerGrid
          tariffs={[{ ...tariff, whitelist_traffic_limit_gb: 0 }]}
          subscription={null}
          purchaseOptions={undefined}
          isTariffsMode
          isMultiTariff={false}
          onSelectTariff={vi.fn()}
          onSwitchTariff={vi.fn()}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText('Без LTE')).toBeTruthy();
    expect(screen.queryByText('LTE 50 ГБ')).toBeNull();
  });
});

describe('TariffPickerGrid price boundary', () => {
  it.each(invalidPrices)('hides a tariff with unusable price %s', (price) => {
    render(
      <MemoryRouter>
        <TariffPickerGrid
          tariffs={[tariffWithPrice(price)]}
          subscription={null}
          purchaseOptions={undefined}
          isTariffsMode
          isMultiTariff={false}
          onSelectTariff={vi.fn()}
          onSwitchTariff={vi.fn()}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText('Нет доступных вариантов подписки')).toBeTruthy();
    expect(screen.queryByText('Бесплатно')).toBeNull();
    expect(document.querySelector('[data-tariff-card]')).toBeNull();
  });
});

describe('TariffPickerGrid card anatomy', () => {
  it('gives current and ordinary tariffs the same stable regions', () => {
    render(
      <MemoryRouter>
        <TariffPickerGrid
          tariffs={[tariff, { ...tariff, id: 2, name: 'Premium LTE', is_current: true }]}
          subscription={null}
          purchaseOptions={undefined}
          isTariffsMode
          isMultiTariff={false}
          onSelectTariff={vi.fn()}
          onSwitchTariff={vi.fn()}
        />
      </MemoryRouter>,
    );

    const cards = Array.from(document.querySelectorAll('[data-tariff-card]'));
    expect(cards).toHaveLength(2);

    for (const card of cards) {
      expect(card.className).toContain('rounded-[30px]');
      expect(card.getAttribute('role')).toBeNull();
      expect(card.querySelector('[data-tariff-summary]')).toBeTruthy();
      expect(card.querySelector('[data-tariff-price]')?.textContent).toContain('/мес');
      const features = card.querySelector('[data-tariff-features]');
      expect(features).toBeTruthy();
      expect(features?.className).toContain('items-start');
      expect(features?.className).toContain('content-start');
      expect(card.querySelector('[data-tariff-main-traffic]')).toBeTruthy();
      expect(card.querySelector('[data-tariff-lte-traffic]')).toBeTruthy();
      expect(card.querySelector('[data-tariff-devices]')).toBeTruthy();
      expect(card.querySelector('[data-tariff-action]')).toBeTruthy();
    }
  });

  it('puts the API-recommended tariff first and keeps its highlight', () => {
    render(
      <MemoryRouter>
        <TariffPickerGrid
          tariffs={[tariff, { ...tariff, id: 2, name: 'Premium LTE', is_highlighted: true }]}
          subscription={null}
          purchaseOptions={undefined}
          isTariffsMode
          isMultiTariff={false}
          onSelectTariff={vi.fn()}
          onSwitchTariff={vi.fn()}
        />
      </MemoryRouter>,
    );

    const cards = Array.from(document.querySelectorAll('[data-tariff-card]'));
    expect(cards[0]?.textContent).toContain('Premium LTE');
    expect(cards[0]?.className).toContain('border-2');
    expect(cards[0]?.textContent).toContain('Рекомендуемый тариф');
  });

  it('keeps purchase and switch callbacks on the card actions', () => {
    const onSelectTariff = vi.fn();
    const onSwitchTariff = vi.fn();

    render(
      <MemoryRouter>
        <TariffPickerGrid
          tariffs={[tariff]}
          subscription={null}
          purchaseOptions={undefined}
          isTariffsMode
          isMultiTariff={false}
          onSelectTariff={onSelectTariff}
          onSwitchTariff={onSwitchTariff}
        />
      </MemoryRouter>,
    );

    const purchaseButton = document.querySelector('[data-tariff-action] button');
    expect(purchaseButton).toBeTruthy();
    fireEvent.click(purchaseButton as HTMLButtonElement);
    expect(onSelectTariff).toHaveBeenCalledWith(tariff);
    expect(onSwitchTariff).not.toHaveBeenCalled();
  });

  it('routes an eligible alternate tariff to the switch callback', () => {
    const onSwitchTariff = vi.fn();

    render(
      <MemoryRouter>
        <TariffPickerGrid
          tariffs={[tariff]}
          subscription={
            {
              tariff_id: 2,
              is_active: true,
              is_limited: false,
              is_trial: false,
            } as never
          }
          purchaseOptions={undefined}
          isTariffsMode
          isMultiTariff={false}
          onSelectTariff={vi.fn()}
          onSwitchTariff={onSwitchTariff}
        />
      </MemoryRouter>,
    );

    const switchButton = document.querySelector('[data-tariff-action] button');
    expect(switchButton).toBeTruthy();
    fireEvent.click(switchButton as HTMLButtonElement);
    expect(onSwitchTariff).toHaveBeenCalledWith(tariff.id);
  });

  it('keeps the promo sheet mounted while its open state closes', () => {
    render(
      <MemoryRouter>
        <TariffPickerGrid
          tariffs={[{ ...tariff, promo_group_name: 'Invoxy Friends' }]}
          subscription={null}
          purchaseOptions={undefined}
          isTariffsMode
          isMultiTariff={false}
          onSelectTariff={vi.fn()}
          onSwitchTariff={vi.fn()}
        />
      </MemoryRouter>,
    );

    const sheet = screen.getByTestId('promo-tier-sheet');
    expect(sheet.getAttribute('data-open')).toBe('false');
    fireEvent.click(screen.getByRole('button', { name: 'Что это за группа?' }));
    expect(sheet.getAttribute('data-open')).toBe('true');

    fireEvent.click(screen.getByRole('button', { name: 'close promo sheet' }));
    expect(screen.getByTestId('promo-tier-sheet').getAttribute('data-open')).toBe('false');
  });

  it('opens the promo sheet from the banner body as well as the info button', () => {
    render(
      <MemoryRouter>
        <TariffPickerGrid
          tariffs={[{ ...tariff, promo_group_name: 'Invoxy Friends' }]}
          subscription={null}
          purchaseOptions={undefined}
          isTariffsMode
          isMultiTariff={false}
          onSelectTariff={vi.fn()}
          onSwitchTariff={vi.fn()}
        />
      </MemoryRouter>,
    );

    const sheet = screen.getByTestId('promo-tier-sheet');
    const bannerText = screen.getByText('subscription.promoGroup.yourGroup');
    fireEvent.click(bannerText);
    expect(sheet.getAttribute('data-open')).toBe('true');

    fireEvent.click(screen.getByRole('button', { name: 'close promo sheet' }));
    fireEvent.click(screen.getByRole('button', { name: 'Что это за группа?' }));
    expect(screen.getByTestId('promo-tier-sheet').getAttribute('data-open')).toBe('true');
  });
});

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
  periods: [],
  is_current: false,
  is_available: true,
};

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
    const whiteInternetBadge = screen.getByText('LTE 50 ГБ').parentElement;
    expect(whiteInternetBadge).toBeTruthy();
    expect(whiteInternetBadge?.className).toContain('whitespace-normal');
    expect(whiteInternetBadge?.className).toContain('break-words');
    expect(whiteInternetBadge?.className).not.toContain('whitespace-nowrap');
    expect(screen.getByText('LTE')).toBeTruthy();
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
      expect(card.querySelector('[data-tariff-summary]')).toBeTruthy();
      const features = card.querySelector('[data-tariff-features]');
      expect(features).toBeTruthy();
      expect(features?.className).toContain('items-start');
      expect(features?.className).toContain('content-start');
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

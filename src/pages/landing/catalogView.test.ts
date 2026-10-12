import { describe, expect, it } from 'vitest';
import type { CatalogTariff, PublicCatalog } from '@/api/publicCatalog';
import {
  addonLines,
  catalogSavings,
  configuredPrice,
  defaultPeriodDays,
  extraDeviceCap,
  featuredTariff,
  formatKopeks,
  minMonthlyKopeks,
  periodFor,
  trialSentence,
} from './catalogView';

const standard: CatalogTariff = {
  id: 2,
  name: 'Стандарт',
  traffic_limit_gb: 750,
  whitelist_traffic_limit_gb: 50,
  base_device_limit: 5,
  max_device_limit: 10,
  device_price_kopeks: 3000,
  device_price_label: '30 ₽',
  periods: [
    {
      days: 30,
      months: 1,
      price_kopeks: 20000,
      price_label: '200 ₽',
      price_per_month_kopeks: 20000,
      price_per_month_label: '200 ₽',
    },
    {
      days: 90,
      months: 3,
      price_kopeks: 57000,
      price_label: '570 ₽',
      price_per_month_kopeks: 19000,
      price_per_month_label: '190 ₽',
      saving_label: '30 ₽',
    },
  ],
  traffic_topup_enabled: false,
  traffic_topup_offers: [],
  whitelist_reset_enabled: true,
  whitelist_reset_chunk_gb: 50,
  whitelist_reset_price_label: '150 ₽',
  whitelist_reset_min_used_gb: 10,
  whitelist_reset_max_per_month: 1,
  traffic_reset_label: 'Трафик обновляется через месяц после оплаты',
};

describe('catalog view', () => {
  it('features the cheapest start rather than the highlighted LTE plan or annual monthly equivalent', () => {
    const basic: CatalogTariff = {
      ...standard,
      id: 1,
      name: 'Базовый',
      whitelist_traffic_limit_gb: 0,
      periods: [
        {
          ...standard.periods[1],
          days: 360,
          months: 12,
          price_kopeks: 90000,
          price_per_month_kopeks: 7500,
          is_highlighted: true,
        },
        { ...standard.periods[0], price_kopeks: 10000, price_per_month_kopeks: 10000 },
      ],
    };
    const tariffs = [{ ...standard, is_highlighted: true }, basic];
    expect(featuredTariff(tariffs)?.id).toBe(1);
    expect(defaultPeriodDays(tariffs)).toBe(30);
    expect(minMonthlyKopeks(tariffs)).toBe(10000);
    expect(defaultPeriodDays([])).toBeNull();
    expect(featuredTariff([])).toBeNull();
  });
  it('reads the selected period and add-ons from the payload', () => {
    expect(periodFor(standard, 90)?.price_label).toBe('570 ₽');
    expect(addonLines(standard)).toEqual([
      '5 устройств в тарифе. До 10, ещё одно 30 ₽ в месяц',
      'Сброс белого интернета: 50 ГБ за 150 ₽, 1 раз в месяц после 10 ГБ расхода',
      'Трафик обновляется через месяц после оплаты',
    ]);
  });

  it('describes the trial from the catalog, including a paid start', () => {
    const catalog: PublicCatalog = {
      sales_mode: 'tariffs',
      bot_url: 'https://t.me/invoxy_bot',
      support_url: null,
      tariffs: [],
      trial: {
        duration_days: 2,
        traffic_limit_gb: 10,
        whitelist_traffic_limit_gb: 5,
        device_limit: 1,
        requires_payment: true,
        price_kopeks: 10000,
        price_label: '100 ₽',
      },
    };
    const trial = catalog.trial;
    if (!trial) throw new Error('trial fixture missing');
    expect(trialSentence(trial)).toBe(
      '2 дня, 10 ГБ, 1 устройство, из них до 5 ГБ белого интернета. Стоимость старта 100 ₽.',
    );
  });
});

describe('configurator price', () => {
  const tariff = {
    id: 1,
    name: 'T',
    traffic_limit_gb: 100,
    base_device_limit: 2,
    max_device_limit: 4,
    device_price_kopeks: 1500,
    periods: [],
  } as unknown as CatalogTariff;
  const quarter = {
    days: 90,
    months: 3,
    price_kopeks: 60000,
    price_label: '600 ₽',
    price_per_month_kopeks: 20000,
    price_per_month_label: '200 ₽',
  };

  it('bills extra devices for every month of the period', () => {
    const price = configuredPrice(tariff, quarter, 2);
    expect(price.extraDevicesKopeks).toBe(9000);
    expect(price.totalKopeks).toBe(69000);
    expect(price.perMonthKopeks).toBe(23000);
    expect(price.devices).toBe(4);
  });

  it('never exceeds the device cap', () => {
    expect(extraDeviceCap(tariff)).toBe(2);
    expect(configuredPrice(tariff, quarter, 9).devices).toBe(4);
    expect(configuredPrice(tariff, quarter, -1).extraDevicesKopeks).toBe(0);
  });

  it('formats kopeks as rubles', () => {
    expect(formatKopeks(33300).replace(/\s/g, ' ')).toBe('333 ₽');
    expect(minMonthlyKopeks([{ ...tariff, periods: [quarter] } as CatalogTariff])).toBe(20000);
  });
});

it('computes compact discount labels from server prices without optional percentage fields', () => {
  expect(catalogSavings(standard, standard.periods[1])).toEqual({
    basePrice: 60000,
    saving: 3000,
    discount: 5,
  });
  expect(configuredPrice(standard, standard.periods[1], 1).totalKopeks).toBe(66000);
});

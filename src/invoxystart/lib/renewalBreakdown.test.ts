import { describe, expect, it } from 'vitest';
import { extractRenewalBreakdown, periodBreakdown } from './renewalBreakdown';

const options = {
  tariffs: [
    {
      id: 1,
      name: 'Стандарт',
      device_limit: 3,
      device_price_kopeks: 3000,
      periods: [
        {
          days: 30,
          price_kopeks: 302000,
          extra_devices_count: 97,
          extra_devices_cost_kopeks: 291000,
          base_tariff_price_kopeks: 20000,
          original_price_kopeks: 311000,
          discount_percent: 5,
        },
        { days: 90, price_kopeks: 57000 },
      ],
    },
    { id: 2, name: 'LTE', periods: [] },
  ],
};

describe('extractRenewalBreakdown', () => {
  it('splits the renewal price into tariff and extra devices', () => {
    const breakdown = extractRenewalBreakdown(options, 1);
    expect(breakdown?.baseDeviceLimit).toBe(3);
    expect(breakdown?.devicePrice).toBe(30);
    expect(periodBreakdown(breakdown, 30)).toEqual({
      days: 30,
      total: 3020,
      tariffPrice: 200,
      extraDevicesCount: 97,
      extraDevicesCost: 2910,
      discountAmount: 90,
      discountPercent: 5,
    });
  });

  it('treats a period without extras as the plain tariff price', () => {
    const period = periodBreakdown(extractRenewalBreakdown(options, 1), 90);
    expect(period).toMatchObject({
      total: 570,
      tariffPrice: 570,
      extraDevicesCount: 0,
      extraDevicesCost: 0,
      discountAmount: 0,
    });
  });

  it('returns null for unknown tariffs or missing data', () => {
    expect(extractRenewalBreakdown(options, 99)).toBeNull();
    expect(extractRenewalBreakdown(options, null)).toBeNull();
    expect(extractRenewalBreakdown(null, 1)).toBeNull();
    expect(periodBreakdown(null, 30)).toBeNull();
  });
});

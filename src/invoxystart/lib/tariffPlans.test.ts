import { describe, expect, it } from 'vitest';
import { adaptPlan, configuratorTotal, orderPlans } from './tariffPlans';

const current = {
  id: 1,
  name: 'Стандарт',
  device_limit: 3,
  max_device_limit: 10,
  device_price_kopeks: 3000,
  traffic_limit_gb: 100,
  periods: [
    {
      days: 30,
      months: 1,
      price_kopeks: 311000,
      extra_devices_count: 97,
      extra_devices_cost_kopeks: 291000,
      base_tariff_price_kopeks: 20000,
    },
    {
      days: 90,
      months: 3,
      price_kopeks: 57000 + 873000 - 2850,
      original_price_kopeks: 60000 + 873000,
      extra_devices_count: 97,
      extra_devices_cost_kopeks: 873000,
      base_tariff_price_kopeks: 60000,
      discount_percent: 5,
    },
  ],
};

describe('adaptPlan', () => {
  it('shows the tariff price without extra devices on the card', () => {
    const plan = adaptPlan(current);
    expect(plan.price).toBe(200);
    expect(plan.extraDevicesCount).toBe(97);
    expect(plan.periods[1]).toMatchObject({ price: 570, basePrice: 600, discount: 5 });
  });

  it('keeps plain plans unchanged', () => {
    const plan = adaptPlan({
      id: 2,
      name: 'LTE',
      device_limit: 5,
      is_highlighted: true,
      periods: [{ days: 30, price_kopeks: 35000 }],
    });
    expect(plan).toMatchObject({ price: 350, extraDevicesCount: 0, recommended: true });
    expect(plan.maxDevices).toBe(10);
  });

  it('keeps an explicit user discount when original prices are omitted', () => {
    const plan = adaptPlan({
      id: 2,
      periods: [{ days: 30, price_kopeks: 9000, discount_percent: 10 }],
    });
    expect(plan.periods[0]).toMatchObject({ price: 90, basePrice: 100, discount: 10 });
    expect(configuratorTotal(plan, plan.periods[0], plan.devices).total).toBe(90);
  });

  it('derives duration savings from final prices without changing checkout or device fees', () => {
    const plan = adaptPlan({
      id: 2,
      device_limit: 5,
      device_price_kopeks: 2000,
      periods: [
        { days: 30, months: 1, price_kopeks: 10000, original_price_kopeks: 10000 },
        {
          days: 360,
          months: 12,
          price_kopeks: 96000,
          original_price_kopeks: 96000,
          discount_percent: 0,
        },
      ],
    });
    expect(plan.price).toBe(100);
    expect(plan.periods[1]).toMatchObject({ price: 960, basePrice: 1200, discount: 20 });
    expect(configuratorTotal(plan, plan.periods[1], 6)).toEqual({
      tariff: 960,
      tariffBase: 1200,
      extra: 240,
      saving: 240,
      total: 1200,
    });
  });

  it('sorts periods by duration and keeps the cheapest entry price', () => {
    const plan = adaptPlan({
      id: 1,
      periods: [
        { days: 360, months: 12, price_kopeks: 90000, discount_percent: 25 },
        { days: 30, months: 1, price_kopeks: 10000 },
      ],
    });
    expect(plan.periods[0].days).toBe(30);
    expect(plan.price).toBe(100);
  });
});

describe('configuratorTotal', () => {
  it('keeps kopek precision in the server quote', () => {
    const plan = adaptPlan({
      id: 1,
      device_limit: 5,
      periods: [{ days: 90, price_kopeks: 53010 }],
    });
    expect(configuratorTotal(plan, plan.periods[0], 5).total).toBe(530.1);
  });
  it('adds extra devices on top of the tariff price for each month', () => {
    const plan = adaptPlan(current);
    expect(configuratorTotal(plan, plan.periods[1], 5)).toEqual({
      tariff: 570,
      tariffBase: 600,
      extra: 180,
      saving: 30,
      total: 750,
    });
    expect(configuratorTotal(plan, plan.periods[0], 3).total).toBe(200);
  });
});

describe('orderPlans', () => {
  it('puts the current plan first, then the cheapest regardless of highlighting', () => {
    const plans = [
      adaptPlan({ id: 1, periods: [{ days: 30, price_kopeks: 10000 }] }),
      adaptPlan({ id: 2, periods: [{ days: 30, price_kopeks: 26000 }], is_highlighted: true }),
      adaptPlan({ id: 3, periods: [{ days: 30, price_kopeks: 40000 }] }),
    ];
    expect(orderPlans(plans, null).map((p) => p.id)).toEqual(['1', '2', '3']);
    expect(orderPlans(plans, '3').map((p) => p.id)).toEqual(['3', '1', '2']);
  });
});

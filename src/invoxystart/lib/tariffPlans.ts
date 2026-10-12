/**
 * Тарифы из /cabinet/subscription/purchase-options в виде для страницы тарифов.
 *
 * Для текущего тарифа бэкенд включает в цену периода доплату за устройства
 * сверх лимита тарифа (extra_devices_*). Карточка и конфигуратор показывают
 * цену самого тарифа, а доплату — отдельной строкой: при покупке через
 * конфигуратор параметр devices задаёт итоговый лимит, и бэкенд считает
 * «тариф + (devices − лимит тарифа) × цена устройства».
 */
import { durationSavings } from '@/utils/durationSavings';

export type PlanPeriod = {
  days: number;
  months: number;
  /** Цена тарифа за период со скидкой, ₽ (без доп. устройств). */
  price: number;
  /** Цена для сравнения без скидки: серверная или короткий срок × месяцы, ₽. */
  basePrice: number;
  discount: number;
};

export type Plan = {
  id: string;
  name: string;
  /** Наименьшая сумма за доступный период, ₽. */
  price: number;
  mainTraffic: number;
  lteTraffic: number | null;
  devices: number;
  maxDevices: number;
  devicePrice: number;
  recommended: boolean;
  /** Устройств сверх лимита тарифа у текущей подписки (только для текущего тарифа). */
  extraDevicesCount: number;
  periods: PlanPeriod[];
};

const num = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export function adaptPlan(value: Record<string, unknown>): Plan {
  const rawPeriods = Array.isArray(value.periods)
    ? (value.periods as Array<Record<string, unknown>>)
    : [];

  const periods = rawPeriods
    .map((period) => {
      const days = num(period.days, 30);
      const months = num(period.months, Math.max(1, Math.round(days / 30)));
      const extraCost = num(period.extra_devices_cost_kopeks);
      const discount = Math.min(100, Math.max(0, num(period.discount_percent)));
      const tariffBase =
        period.base_tariff_price_kopeks != null
          ? num(period.base_tariff_price_kopeks)
          : num(period.original_price_kopeks ?? period.price_kopeks) - extraCost;
      const tariffFinal =
        extraCost > 0 ? Math.round(tariffBase * (1 - discount / 100)) : num(period.price_kopeks);
      const undiscounted =
        period.base_tariff_price_kopeks == null &&
        period.original_price_kopeks == null &&
        discount > 0 &&
        discount < 100
          ? tariffFinal / (1 - discount / 100)
          : tariffBase;
      return {
        days,
        months,
        price: tariffFinal / 100,
        basePrice: Math.max(tariffFinal, undiscounted) / 100,
        discount:
          discount ||
          (tariffBase > tariffFinal && tariffBase > 0
            ? Math.round((1 - tariffFinal / tariffBase) * 100)
            : 0),
      };
    })
    .sort((a, b) => a.days - b.days);

  const monthlyBase = periods[0] ? periods[0].basePrice / Math.max(1, periods[0].months) : 0;
  const pricedPeriods = periods.map((period) => {
    const { basePrice, discount } = durationSavings(
      period.price,
      period.months,
      monthlyBase,
      period.basePrice,
    );
    return { ...period, basePrice, discount: Math.max(period.discount, discount) };
  });

  const cheapestPeriod = [...periods].sort((a, b) => a.price - b.price || a.days - b.days)[0];
  const lteTraffic = num(value.whitelist_traffic_limit_gb) || null;
  const baseDevices = Math.max(1, num(value.device_limit ?? value.base_device_limit, 1));
  const rawMax = num(value.max_device_limit);
  const extraDevicesCount = Math.max(
    0,
    ...rawPeriods.map((period) => num(period.extra_devices_count)),
  );

  return {
    id: String(value.id),
    name: String(value.name ?? '').trim(),
    price: cheapestPeriod?.price ?? 0,
    mainTraffic: num(value.traffic_limit_gb),
    lteTraffic,
    devices: baseDevices,
    maxDevices: rawMax > 0 ? Math.max(baseDevices, rawMax) : Math.max(baseDevices, 10),
    devicePrice: num(value.device_price_kopeks) / 100,
    recommended: Boolean(value.is_highlighted),
    extraDevicesCount,
    periods: pricedPeriods,
  };
}

/** Итог конфигуратора: тариф за период + доп. устройства × месяцы (без скидки на устройства). */
export function configuratorTotal(plan: Plan, period: PlanPeriod, devices: number) {
  const extra = Math.max(0, devices - plan.devices) * plan.devicePrice * period.months;
  return {
    tariff: period.price,
    tariffBase: period.basePrice,
    extra,
    saving: Math.max(0, period.basePrice - period.price),
    total: Math.round((period.price + extra) * 100) / 100,
  };
}

/** Текущий тариф первым, остальные — от меньшей цены к большей. */
export function orderPlans(plans: Plan[], activeId: string | null): Plan[] {
  const rank = (plan: Plan) => (plan.id === activeId ? 0 : 1);
  return plans
    .map((plan, index) => ({ plan, index }))
    .sort((a, b) => rank(a.plan) - rank(b.plan) || a.plan.price - b.plan.price || a.index - b.index)
    .map(({ plan }) => plan);
}

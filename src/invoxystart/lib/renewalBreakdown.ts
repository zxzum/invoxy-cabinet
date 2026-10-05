/**
 * Разбивка цены продления текущего тарифа. Бэкенд при продлении добавляет к цене
 * тарифа доплату за устройства сверх лимита тарифа
 * (bot: cabinet/routes/subscription_modules/purchase.py) и отдаёт её отдельными
 * полями периода в /cabinet/subscription/purchase-options. Здесь эти поля
 * приводятся к виду, удобному для показа «Тариф + N доп. устройств».
 */
export interface PeriodBreakdown {
  days: number;
  /** Итог к оплате, ₽ (то же, что списывает бэкенд). */
  total: number;
  /** Цена самого тарифа без доп. устройств и скидок, ₽. */
  tariffPrice: number;
  extraDevicesCount: number;
  /** Доплата за доп. устройства за весь период без скидок, ₽. */
  extraDevicesCost: number;
  /** Скидка в рублях относительно цены без скидок. */
  discountAmount: number;
  discountPercent: number;
}

export interface RenewalBreakdown {
  tariffId: number;
  tariffName: string;
  baseDeviceLimit: number;
  devicePrice: number;
  periods: PeriodBreakdown[];
}

const rub = (kopeks: unknown) => Number(kopeks ?? 0) / 100;

export function extractRenewalBreakdown(
  options: { tariffs?: unknown } | null | undefined,
  tariffId: number | null | undefined,
): RenewalBreakdown | null {
  if (!options || tariffId == null || !Array.isArray(options.tariffs)) return null;
  const tariff = (options.tariffs as Array<Record<string, unknown>>).find(
    (item) => Number(item.id) === tariffId,
  );
  if (!tariff) return null;
  const rawPeriods = Array.isArray(tariff.periods)
    ? (tariff.periods as Array<Record<string, unknown>>)
    : [];
  const periods = rawPeriods.map((period) => {
    const total = rub(period.price_kopeks);
    const extraDevicesCount = Number(period.extra_devices_count ?? 0);
    const extraDevicesCost = rub(period.extra_devices_cost_kopeks);
    const tariffPrice =
      period.base_tariff_price_kopeks != null
        ? rub(period.base_tariff_price_kopeks)
        : rub(period.original_price_kopeks ?? period.price_kopeks) - extraDevicesCost;
    const original =
      period.original_price_kopeks != null
        ? rub(period.original_price_kopeks)
        : tariffPrice + extraDevicesCost;
    return {
      days: Number(period.days ?? 30),
      total,
      tariffPrice,
      extraDevicesCount,
      extraDevicesCost,
      discountAmount: Math.max(0, Math.round((original - total) * 100) / 100),
      discountPercent: Number(period.discount_percent ?? 0),
    };
  });
  return {
    tariffId,
    tariffName: String(tariff.name ?? ''),
    baseDeviceLimit: Number(tariff.device_limit ?? 0),
    devicePrice: rub(tariff.device_price_kopeks),
    periods,
  };
}

export function periodBreakdown(
  breakdown: RenewalBreakdown | null | undefined,
  days: number,
): PeriodBreakdown | null {
  return breakdown?.periods.find((period) => period.days === days) ?? null;
}

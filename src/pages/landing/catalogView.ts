import type {
  CatalogPeriod,
  CatalogTariff,
  CatalogTrial,
  PublicCatalog,
} from '@/api/publicCatalog';
import { durationSavings } from '@/utils/durationSavings';

export function catalogSavings(tariff: CatalogTariff, period: CatalogPeriod) {
  const reference = [...tariff.periods].sort((a, b) => a.days - b.days)[0];
  const monthlyBase = reference ? reference.price_kopeks / Math.max(1, reference.months) : 0;
  return durationSavings(
    period.price_kopeks,
    Math.max(1, period.months),
    monthlyBase,
    period.monthly_baseline_kopeks ?? period.price_kopeks + (period.saving_kopeks ?? 0),
  );
}

export function ruCount(value: number, one: string, few: string, many: string): string {
  const abs = Math.abs(value);
  const mod10 = abs % 10;
  const mod100 = abs % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

export function periodChoices(tariffs: CatalogTariff[]): number[] {
  const days = new Set<number>();
  for (const tariff of tariffs) {
    for (const period of tariff.periods) days.add(period.days);
  }
  return [...days].sort((a, b) => a - b);
}

export function periodFor(tariff: CatalogTariff, days: number): CatalogPeriod | undefined {
  return tariff.periods.find((period) => period.days === days);
}

export function defaultPeriodDays(tariffs: CatalogTariff[]): number | null {
  return (
    tariffs
      .flatMap((tariff) => tariff.periods)
      .sort((a, b) => a.price_kopeks - b.price_kopeks || a.days - b.days)[0]?.days ?? null
  );
}

export function featuredTariff(tariffs: CatalogTariff[]): CatalogTariff | null {
  return (
    [...tariffs]
      .filter((tariff) => tariff.periods.length)
      .sort(
        (a, b) =>
          Math.min(...a.periods.map((period) => period.price_kopeks)) -
          Math.min(...b.periods.map((period) => period.price_kopeks)),
      )[0] ??
    tariffs[0] ??
    null
  );
}

export function hasWhitelist(catalog: PublicCatalog | null | undefined): boolean {
  if (!catalog) return false;
  if ((catalog.trial?.whitelist_traffic_limit_gb ?? 0) > 0) return true;
  return catalog.tariffs.some((tariff) => (tariff.whitelist_traffic_limit_gb ?? 0) > 0);
}

function packageLine(
  title: string,
  offers: CatalogTariff['traffic_topup_offers'],
  limit?: number,
): string | null {
  if (!offers?.length) return null;
  const prices = offers.map((offer) => `${offer.gb} ГБ за ${offer.price_label}`).join(', ');
  const cap = limit && limit > 0 ? `, не больше ${limit} в месяц` : '';
  return `${title}: ${prices}${cap}`;
}

export function addonLines(tariff: CatalogTariff): string[] {
  const lines: string[] = [];
  const included = tariff.base_device_limit || tariff.device_limit || 0;
  if (included > 0) {
    const noun = ruCount(included, 'устройство', 'устройства', 'устройств');
    const max = tariff.max_device_limit ?? 0;
    const extra =
      max > included && (tariff.device_price_kopeks ?? 0) > 0
        ? `. До ${max}, ещё одно ${tariff.device_price_label} в месяц`
        : '';
    lines.push(`${included} ${noun} в тарифе${extra}`);
  }

  const trafficTopup = packageLine(
    'Докупка трафика',
    tariff.traffic_topup_offers,
    tariff.traffic_topup_max_per_month,
  );
  if (trafficTopup) lines.push(trafficTopup);

  const whitelistTopup = packageLine('Докупка белого интернета', tariff.whitelist_topup_offers);
  if (whitelistTopup) lines.push(whitelistTopup);

  if (
    tariff.whitelist_reset_enabled &&
    (tariff.whitelist_reset_max_per_month ?? 0) > 0 &&
    tariff.whitelist_reset_price_label
  ) {
    const times = tariff.whitelist_reset_max_per_month ?? 0;
    const chunk = tariff.whitelist_reset_chunk_gb ?? 0;
    const minUsed = tariff.whitelist_reset_min_used_gb ?? 0;
    lines.push(
      `Сброс белого интернета: ${chunk} ГБ за ${tariff.whitelist_reset_price_label}, ${times} ${ruCount(times, 'раз', 'раза', 'раз')} в месяц после ${minUsed} ГБ расхода`,
    );
  }

  if (tariff.traffic_reset_label) lines.push(tariff.traffic_reset_label);

  if (tariff.is_daily && tariff.daily_price_label && tariff.daily_price_label !== '0 ₽') {
    lines.push(`Списание ${tariff.daily_price_label} в день`);
  }

  if (
    tariff.custom_days_enabled &&
    tariff.min_days &&
    tariff.max_days &&
    tariff.price_per_day_label
  ) {
    lines.push(
      `Свой срок: от ${tariff.min_days} до ${tariff.max_days} дней, ${tariff.price_per_day_label} в день`,
    );
  }

  return lines;
}

export function trafficFact(tariff: CatalogTariff): string {
  if (tariff.traffic_limit_gb === 0) return 'Безлимитный VPN-трафик';
  return `${tariff.traffic_limit_gb} ГБ VPN-трафика`;
}

export function whitelistFact(tariff: CatalogTariff): string | null {
  const amount = tariff.whitelist_traffic_limit_gb ?? 0;
  if (amount <= 0) return null;
  return `${amount} ГБ белого интернета`;
}

export function trialSentence(trial: CatalogTrial): string {
  const days = `${trial.duration_days} ${ruCount(trial.duration_days, 'день', 'дня', 'дней')}`;
  const traffic = trial.traffic_limit_gb === 0 ? 'безлимит' : `${trial.traffic_limit_gb} ГБ`;
  const devices = `${trial.device_limit} ${ruCount(trial.device_limit, 'устройство', 'устройства', 'устройств')}`;
  const whitelist =
    trial.whitelist_traffic_limit_gb > 0
      ? `, из них до ${trial.whitelist_traffic_limit_gb} ГБ белого интернета`
      : '';
  const payment = trial.requires_payment
    ? ` Стоимость старта ${trial.price_label}.`
    : ' Карта для старта не нужна.';
  return `${days}, ${traffic}, ${devices}${whitelist}.${payment}`;
}

export function fallbackBotUrl(): string | null {
  const username = String(import.meta.env.VITE_TELEGRAM_BOT_USERNAME || 'invoxy_bot')
    .replace(/^@/, '')
    .trim();
  return username ? `https://t.me/${username}` : null;
}

const rubles = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 });

export function formatKopeks(kopeks: number): string {
  return `${rubles.format(Math.round(kopeks) / 100)} ₽`;
}

/** Whole rubles, for approximate per-month figures. */
export function formatRubles(kopeks: number): string {
  return `${rubles.format(Math.round(kopeks / 100))} ₽`;
}

export function minMonthlyKopeks(tariffs: CatalogTariff[]): number | null {
  const tariff = featuredTariff(tariffs);
  const days = defaultPeriodDays(tariff ? [tariff] : []);
  return tariff && days ? (periodFor(tariff, days)?.price_per_month_kopeks ?? null) : null;
}

/** How many devices can be added on top of the tariff, 0 when add-ons are off. */
export function extraDeviceCap(tariff: CatalogTariff): number {
  const included = tariff.base_device_limit || tariff.device_limit || 0;
  const max = tariff.max_device_limit ?? 0;
  if (max <= included || (tariff.device_price_kopeks ?? 0) <= 0) return 0;
  return max - included;
}

export interface ConfiguredPrice {
  totalKopeks: number;
  perMonthKopeks: number;
  extraDevicesKopeks: number;
  devices: number;
}

/** Same arithmetic as checkout: extra devices are billed per month of the period. */
export function configuredPrice(
  tariff: CatalogTariff,
  period: CatalogPeriod,
  extraDevices: number,
): ConfiguredPrice {
  const extra = Math.min(Math.max(0, extraDevices), extraDeviceCap(tariff));
  const months = Math.max(1, period.months || Math.floor(period.days / 30));
  const extraDevicesKopeks = extra * (tariff.device_price_kopeks ?? 0) * months;
  const totalKopeks = period.price_kopeks + extraDevicesKopeks;
  return {
    totalKopeks,
    perMonthKopeks: Math.round(totalKopeks / months),
    extraDevicesKopeks,
    devices: (tariff.base_device_limit || tariff.device_limit || 0) + extra,
  };
}

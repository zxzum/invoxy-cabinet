import i18n from '../i18n';

/**
 * Format traffic amount with appropriate unit (MB/GB/TB).
 * Units come from i18n so RU shows «ГБ» consistently with the rest of the UI
 * (templates previously mixed latin "GB" with localized «ГБ» on one screen).
 */
export function formatTraffic(gb: number): string {
  // Locale-aware and without a trailing ".0": «12,2 ГБ», «30 ГБ» in RU.
  const number = (value: number, digits: number) =>
    value.toLocaleString(i18n.language, { maximumFractionDigits: digits });
  if (gb >= 1000) return `${number(gb / 1000, 1)} ${i18n.t('common.units.tb', 'TB')}`;
  if (gb >= 1) return `${number(gb, 1)} ${i18n.t('common.units.gb', 'GB')}`;
  return `${number(gb * 1024, 0)} ${i18n.t('common.units.mb', 'MB')}`;
}

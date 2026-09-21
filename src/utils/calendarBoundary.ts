import { uiLocale } from './uiLocale';

/**
 * The backend returns the UTC instant of midnight in its configured timezone.
 * A positive offset can therefore put the instant on the previous UTC date.
 * The boundary invariant lets us recover the intended first day of the local
 * calendar month without using the browser timezone.
 */
function getCalendarBoundaryDate(value: string | null | undefined): Date | null {
  if (!value) return null;

  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return null;

  const utcDate = new Date(timestamp);
  const targetMonth =
    utcDate.getUTCDate() === 1 ? utcDate.getUTCMonth() : utcDate.getUTCMonth() + 1;
  return new Date(Date.UTC(utcDate.getUTCFullYear(), targetMonth, 1));
}

function formatCalendarBoundary(
  value: string | null | undefined,
  options: Intl.DateTimeFormatOptions,
  locale = uiLocale(),
): string {
  const date = getCalendarBoundaryDate(value);
  if (!date) return '';

  try {
    return new Intl.DateTimeFormat(locale, { ...options, timeZone: 'UTC' }).format(date);
  } catch {
    return '';
  }
}

export function formatCalendarBoundaryMonth(
  value: string | null | undefined,
  locale?: string,
): string {
  return formatCalendarBoundary(value, { month: 'long' }, locale);
}

export function formatCalendarBoundaryDate(
  value: string | null | undefined,
  locale?: string,
): string {
  return formatCalendarBoundary(
    value,
    { day: 'numeric', month: 'numeric', year: 'numeric' },
    locale,
  );
}

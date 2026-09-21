import { describe, expect, it } from 'vitest';
import { formatCalendarBoundaryDate, formatCalendarBoundaryMonth } from './calendarBoundary';

describe('calendar boundary formatting', () => {
  it('keeps the configured calendar month when UTC falls on the previous date', () => {
    const boundary = '2026-09-30T21:00:00Z';

    expect(formatCalendarBoundaryMonth(boundary, 'en-US')).toBe('October');
    expect(formatCalendarBoundaryDate(boundary, 'en-US')).toBe('10/1/2026');
  });

  it('does not depend on the browser timezone for a UTC boundary', () => {
    expect(formatCalendarBoundaryMonth('2026-10-01T00:00:00Z', 'en-US')).toBe('October');
  });

  it('returns an empty value for a missing or invalid timestamp', () => {
    expect(formatCalendarBoundaryMonth(null, 'en-US')).toBe('');
    expect(formatCalendarBoundaryMonth('not-a-date', 'en-US')).toBe('');
  });
});

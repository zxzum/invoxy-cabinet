// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { WhiteInternetUsage } from './WhiteInternetUsage';

vi.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: vi.fn() },
  useTranslation: () => ({
    t: (key: string, fallback?: unknown) =>
      typeof fallback === 'string'
        ? fallback
        : typeof (fallback as { defaultValue?: string })?.defaultValue === 'string'
          ? (fallback as { defaultValue: string }).defaultValue
          : key,
  }),
}));

afterEach(cleanup);

describe('WhiteInternetUsage', () => {
  it.each([{}, { whitelist_traffic_limit_gb: 0 }])('hides absent quota', (subscription) => {
    const { container } = render(<WhiteInternetUsage subscription={subscription} />);

    expect(container.firstChild).toBeNull();
  });

  it('exposes partial quota as an accessible progress bar', () => {
    render(
      <WhiteInternetUsage
        subscription={{ whitelist_traffic_limit_gb: 10, whitelist_traffic_used_gb: 2.5 }}
      />,
    );

    const progress = screen.getByRole('progressbar', { name: 'LTE сервера' });
    expect(progress.getAttribute('aria-valuemin')).toBe('0');
    expect(progress.getAttribute('aria-valuemax')).toBe('100');
    expect(progress.getAttribute('aria-valuenow')).toBe('25');
    expect(screen.getByText('2.5 / 10 ГБ')).toBeTruthy();
  });

  it('caps overflow at 100 percent', () => {
    const { container } = render(
      <WhiteInternetUsage
        subscription={{ whitelist_traffic_limit_gb: 2, whitelist_traffic_used_gb: 3 }}
      />,
    );

    const progress = screen.getByRole('progressbar', { name: 'LTE сервера' });
    expect(progress.getAttribute('aria-valuenow')).toBe('100');
    expect((container.querySelector('[style*="width"]') as HTMLElement).style.width).toBe('100%');
  });

  it('renders reset button when used >= min_used and resets remain', () => {
    const onResetClick = vi.fn();
    render(
      <WhiteInternetUsage
        subscription={{ whitelist_traffic_limit_gb: 50, whitelist_traffic_used_gb: 15 }}
        onResetClick={onResetClick}
        trafficReset={{
          enabled: true,
          chunk_gb: 50,
          price_kopeks: 15000,
          price_rubles: 150,
          min_used_gb: 10,
          used_gb: 15,
          limit_gb: 50,
          will_clear_gb: 15,
          used_after_gb: 0,
          max_per_month: 1,
          used_this_month: 0,
          remaining_this_month: 1,
          next_available_at: null,
          unavailable_reason: null,
          exhausted: false,
        }}
      />,
    );

    const resetButton = screen.getByRole('button', { name: 'Сбросить расход' });
    expect(resetButton).toBeTruthy();
    resetButton.click();
    expect(onResetClick).toHaveBeenCalledTimes(1);
  });

  it('renders threshold note when used is below min_used', () => {
    render(
      <WhiteInternetUsage
        subscription={{ whitelist_traffic_limit_gb: 50, whitelist_traffic_used_gb: 5 }}
        trafficReset={{
          enabled: true,
          chunk_gb: 50,
          price_kopeks: 15000,
          price_rubles: 150,
          min_used_gb: 10,
          used_gb: 5,
          limit_gb: 50,
          will_clear_gb: 5,
          used_after_gb: 0,
          max_per_month: 1,
          used_this_month: 0,
          remaining_this_month: 1,
          next_available_at: null,
          unavailable_reason: 'below_min_used',
          exhausted: false,
        }}
      />,
    );

    expect(screen.getByText(/Сброс доступен после 10 ГБ расхода/)).toBeTruthy();
  });

  it('renders monthly limit reached note', () => {
    render(
      <WhiteInternetUsage
        subscription={{ whitelist_traffic_limit_gb: 50, whitelist_traffic_used_gb: 50 }}
        trafficReset={{
          enabled: true,
          chunk_gb: 50,
          price_kopeks: 15000,
          price_rubles: 150,
          min_used_gb: 10,
          used_gb: 50,
          limit_gb: 50,
          will_clear_gb: 50,
          used_after_gb: 0,
          max_per_month: 1,
          used_this_month: 1,
          remaining_this_month: 0,
          next_available_at: '2026-10-01T00:00:00Z',
          unavailable_reason: 'monthly_limit',
          exhausted: true,
        }}
      />,
    );

    expect(screen.getByText(/Лимит сбросов на этот месяц исчерпан/)).toBeTruthy();
  });
});

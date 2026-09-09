// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { WhiteInternetUsage } from './WhiteInternetUsage';

vi.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: vi.fn() },
  useTranslation: () => ({
    t: (key: string, fallback?: unknown) => (typeof fallback === 'string' ? fallback : key),
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

    const progress = screen.getByRole('progressbar', { name: 'Белый интернет' });
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

    const progress = screen.getByRole('progressbar', { name: 'Белый интернет' });
    expect(progress.getAttribute('aria-valuenow')).toBe('100');
    expect((container.querySelector('[style*="width"]') as HTMLElement).style.width).toBe('100%');
  });
});

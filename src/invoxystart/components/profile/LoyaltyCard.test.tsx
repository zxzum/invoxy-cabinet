// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { LoyaltyTiersResponse } from '@/invoxystart/api';
import { LoyaltyCard } from './LoyaltyCard';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) =>
      params ? `${key}:${JSON.stringify(params)}` : key,
  }),
}));

afterEach(cleanup);

const loyalty: LoyaltyTiersResponse = {
  current_spent_rubles: 0,
  current_tier_name: null,
  next_tier_name: 'Invoxy Friends',
  next_tier_threshold_rubles: 2500,
  progress_percent: 0,
  tiers: [
    {
      id: 1,
      name: 'Invoxy Friends',
      threshold_rubles: 2500,
      server_discount_percent: 0,
      traffic_discount_percent: 5,
      device_discount_percent: 0,
      period_discounts: { '30': 5 },
      is_current: false,
      is_achieved: false,
    },
  ],
};

describe('LoyaltyCard', () => {
  it('shows the next threshold and opens the actual level details in place', () => {
    render(<LoyaltyCard loyalty={loyalty} status="ready" onRetry={vi.fn()} />);

    expect(screen.getByText(/invoxy\.profile\.loyaltyNext/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /invoxy\.profile\.loyaltyProgram/ }));

    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByRole('heading', { name: 'Invoxy Friends' })).toBeTruthy();
    expect(within(dialog).getByText(/subscription\.promoGroup\.periodDiscount/)).toBeTruthy();
    expect(within(dialog).getByRole('progressbar').getAttribute('aria-valuenow')).toBe('0');
  });

  it('offers a retry when level data fails to load', () => {
    const onRetry = vi.fn();
    render(<LoyaltyCard loyalty={null} status="error" onRetry={onRetry} />);
    fireEvent.click(screen.getByRole('button', { name: /invoxy\.profile\.loyaltyProgram/ }));
    fireEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', {
        name: 'invoxy.profile.loyaltyRetry',
      }),
    );
    expect(onRetry).toHaveBeenCalledOnce();
  });
});

import { describe, expect, it } from 'vitest';
import { deriveAccountState, needsPurchase } from './accountState';

const NOW = Date.parse('2026-10-05T12:00:00Z');
const day = 86_400_000;
const sub = (over: Record<string, unknown> = {}) =>
  ({
    status: 'active',
    is_trial: false,
    end_date: new Date(NOW + 30 * day).toISOString(),
    ...over,
  }) as never;

describe('deriveAccountState', () => {
  it('no subscriptions', () => {
    expect(deriveAccountState([], { is_available: false }, NOW)).toBe('none');
    expect(deriveAccountState([], { is_available: true }, NOW)).toBe('trial_available');
    expect(deriveAccountState([], null, NOW)).toBe('none');
  });

  it('active trial and paid', () => {
    expect(deriveAccountState([sub({ is_trial: true })], null, NOW)).toBe('trial_active');
    expect(deriveAccountState([sub()], null, NOW)).toBe('paid_active');
  });

  it('paid wins over trial', () => {
    expect(deriveAccountState([sub({ is_trial: true }), sub()], null, NOW)).toBe('paid_active');
  });

  it('expiring soon', () => {
    const end = new Date(NOW + 2 * day).toISOString();
    expect(deriveAccountState([sub({ end_date: end })], null, NOW)).toBe('paid_expiring');
  });

  it('expired variants', () => {
    const past = new Date(NOW - day).toISOString();
    expect(deriveAccountState([sub({ end_date: past })], null, NOW)).toBe('paid_expired');
    expect(deriveAccountState([sub({ status: 'expired' })], null, NOW)).toBe('paid_expired');
    expect(
      deriveAccountState([sub({ is_trial: true, end_date: past })], { is_available: false }, NOW),
    ).toBe('trial_expired');
  });

  it('disabled', () => {
    expect(deriveAccountState([sub({ status: 'disabled' })], null, NOW)).toBe('disabled');
  });

  it('needsPurchase', () => {
    expect(needsPurchase('none')).toBe(true);
    expect(needsPurchase('paid_expired')).toBe(true);
    expect(needsPurchase('paid_active')).toBe(false);
    expect(needsPurchase('trial_active')).toBe(false);
  });
});

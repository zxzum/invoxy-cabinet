import { afterEach, describe, expect, it, vi } from 'vitest';
import { resolvePaymentView, schedulePaymentRefresh } from './paymentResolution';

describe('resolvePaymentView', () => {
  it('treats ?status=success before the webhook as verifying, not paid', () => {
    expect(
      resolvePaymentView({
        payment: { status: 'pending', is_paid: false },
        redirectStatus: 'success',
        timedOut: false,
      }),
    ).toBe('verifying');
  });

  it('becomes paid once the backend confirms (late webhook)', () => {
    expect(
      resolvePaymentView({
        payment: { status: 'succeeded', is_paid: true },
        redirectStatus: 'success',
        timedOut: false,
      }),
    ).toBe('paid');
    expect(
      resolvePaymentView({ payment: { status: 'paid' }, redirectStatus: null, timedOut: true }),
    ).toBe('paid');
  });

  it('reports failures from the backend or an explicit provider rejection', () => {
    expect(
      resolvePaymentView({
        payment: { status: 'canceled' },
        redirectStatus: null,
        timedOut: false,
      }),
    ).toBe('failed');
    expect(resolvePaymentView({ payment: null, redirectStatus: 'fail', timedOut: false })).toBe(
      'failed',
    );
  });

  it('times out while still unconfirmed', () => {
    expect(
      resolvePaymentView({
        payment: { status: 'pending' },
        redirectStatus: 'success',
        timedOut: true,
      }),
    ).toBe('timeout');
    expect(resolvePaymentView({ payment: null, redirectStatus: null, timedOut: false })).toBe(
      'pending',
    );
  });
});

describe('schedulePaymentRefresh', () => {
  afterEach(() => vi.useRealTimers());

  it('refreshes now and again after 3 and 10 seconds', () => {
    vi.useFakeTimers();
    const refresh = vi.fn();
    const cancel = schedulePaymentRefresh(refresh);
    vi.advanceTimersByTime(0);
    expect(refresh).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(3_000);
    expect(refresh).toHaveBeenCalledTimes(2);
    cancel();
    vi.advanceTimersByTime(10_000);
    expect(refresh).toHaveBeenCalledTimes(2);
  });
});

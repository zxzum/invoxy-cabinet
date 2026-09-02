// @vitest-environment jsdom
import { cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { AnimatedNumber, AnimatedProgress, SuccessBurst } from './index';
import { easeOutQuint, navSpring, progressSpring, successSpring } from './springs';

afterEach(cleanup);

describe('springs', () => {
  it('uses spring configs from the spec', () => {
    expect(navSpring).toEqual({ type: 'spring', stiffness: 420, damping: 34 });
    expect(successSpring).toEqual({ type: 'spring', stiffness: 300, damping: 18 });
    expect(progressSpring).toEqual({ type: 'spring', stiffness: 110, damping: 20, mass: 0.9 });
    expect(easeOutQuint).toEqual([0.22, 1, 0.36, 1]);
  });
});

describe('AnimatedNumber', () => {
  it('renders the formatted value', async () => {
    const { getByTestId } = render(
      <AnimatedNumber value={1500} format={(v) => `${v.toFixed(0)} ₽`} testId="balance" />,
    );
    await waitFor(() => expect(getByTestId('balance').textContent).toBe('1500 ₽'), {
      timeout: 3000,
    });
  });
});

describe('AnimatedProgress', () => {
  it('clamps percent and exposes aria attributes', () => {
    const { getByRole } = render(<AnimatedProgress percent={140} testId="bar" />);
    const bar = getByRole('progressbar');
    expect(bar.getAttribute('aria-valuenow')).toBe('100');
  });
});

describe('SuccessBurst', () => {
  it('renders a check tile with burst dots', () => {
    const { container } = render(<SuccessBurst size={64} />);
    // 10 точек берста + плитка
    expect(container.querySelectorAll('span[aria-hidden="true"]').length).toBeGreaterThanOrEqual(
      10,
    );
  });
});

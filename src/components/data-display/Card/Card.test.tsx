// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const { hapticImpact } = vi.hoisted(() => ({ hapticImpact: vi.fn() }));

vi.mock('@/platform', () => ({
  usePlatform: () => ({ haptic: { impact: hapticImpact } }),
}));

import { Card } from './Card';

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('Card asChild', () => {
  it('forwards props and ref to the child through Slot', () => {
    const ref = createRef<HTMLDivElement>();

    render(
      <Card asChild ref={ref} interactive aria-label="Open card" data-testid="card">
        <button type="button">Open</button>
      </Card>,
    );

    const button = screen.getByRole('button', { name: 'Open card' });
    expect(button.dataset.testid).toBe('card');
    expect(ref.current).toBe(button);
  });

  it('composes child and Card clicks while triggering light haptic feedback', () => {
    const childOnClick = vi.fn();
    const cardOnClick = vi.fn();

    render(
      <Card asChild interactive onClick={cardOnClick}>
        <button type="button" onClick={childOnClick}>
          Open
        </button>
      </Card>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Open' }));

    expect(childOnClick).toHaveBeenCalledTimes(1);
    expect(cardOnClick).toHaveBeenCalledTimes(1);
    expect(hapticImpact).toHaveBeenCalledWith('light');
  });
});

// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { TrafficCards } from './TrafficCards';

afterEach(cleanup);

describe('TrafficCards', () => {
  it('labels an unlimited quota instead of showing 0%', () => {
    render(<TrafficCards subscription={{ traffic_limit_gb: 0, traffic_used_gb: 37.4 }} />);
    expect(screen.getByText('37,4 / ∞ ГБ')).toBeTruthy();
    expect(screen.getByText('Безлимит')).toBeTruthy();
    expect(screen.queryByText('0%')).toBeNull();
  });

  it('warns when the quota is almost spent', () => {
    render(
      <TrafficCards
        subscription={{ traffic_limit_gb: 100, traffic_used_gb: 95, traffic_used_percent: 95 }}
      />,
    );
    expect(screen.getByText('95%').className).toContain('text-warning-400');
  });
});

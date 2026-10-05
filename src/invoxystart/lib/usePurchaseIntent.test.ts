import { describe, expect, it } from 'vitest';
import { parsePurchaseIntent, tariffsUrl } from './usePurchaseIntent';

describe('purchase intent', () => {
  it('builds tariffs URLs', () => {
    expect(tariffsUrl()).toBe('/tariffs');
    expect(tariffsUrl(3)).toBe('/tariffs?plan=3');
    expect(tariffsUrl('recommended', 90)).toBe('/tariffs?plan=recommended&period=90');
  });

  it('parses the intent back', () => {
    expect(parsePurchaseIntent(new URLSearchParams('plan=3&period=90'))).toEqual({
      plan: '3',
      periodDays: 90,
    });
    expect(parsePurchaseIntent(new URLSearchParams('plan=3&period=x'))).toEqual({
      plan: '3',
      periodDays: null,
    });
    expect(parsePurchaseIntent(new URLSearchParams('mode=add'))).toBeNull();
  });
});

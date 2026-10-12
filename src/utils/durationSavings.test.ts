import { describe, expect, it } from 'vitest';
import { durationSavings } from './durationSavings';

describe('durationSavings', () => {
  it('recovers savings from final prices when the API omits the discount', () => {
    expect(durationSavings(960, 12, 100)).toEqual({ basePrice: 1200, saving: 240, discount: 20 });
    expect(durationSavings(558, 3, 200).discount).toBe(7);
    expect(durationSavings(1020, 6, 200).discount).toBe(15);
  });

  it('retains explicit discounts, including on the shortest term', () => {
    expect(durationSavings(90, 1, 100, 100)).toEqual({ basePrice: 100, saving: 10, discount: 10 });
    expect(durationSavings(864, 12, 100, 960)).toEqual({
      basePrice: 1200,
      saving: 336,
      discount: 28,
    });
  });

  it('does not invent a discount for equal or more expensive monthly pricing', () => {
    expect(durationSavings(300, 3, 100).discount).toBe(0);
    expect(durationSavings(350, 3, 100).discount).toBe(0);
    expect(durationSavings(960, 12, 0).discount).toBe(0);
  });

  it('does not overstate rounded percentages or produce invalid numbers', () => {
    expect(durationSavings(251, 3, 100).discount).toBe(16);
    expect(durationSavings(100, 1, Number.NaN).discount).toBe(0);
    expect(durationSavings(Number.NaN, 1, 100)).toEqual({ basePrice: 0, saving: 0, discount: 0 });
  });
});

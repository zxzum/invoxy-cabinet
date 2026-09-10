import { describe, expect, it } from 'vitest';
import { formatKopeksToRubles } from './utils';

describe('formatKopeksToRubles', () => {
  it('rounds amounts to whole rubles', () => {
    expect(formatKopeksToRubles(9_999)).toBe('100');
  });
});

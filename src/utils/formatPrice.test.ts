import { describe, expect, it } from 'vitest';
import { formatPrice } from './format';

describe('formatPrice', () => {
  it('rounds RUB amounts to whole rubles', () => {
    expect(formatPrice(9_999, 'ru')).toBe('100 ₽');
  });
});

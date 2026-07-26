import { describe, expect, it } from 'vitest';
import { formatMoney, hasMaxFourDecimals, multiplyDecimal } from '@/lib/decimal';

describe('decimal utilities', () => {
  it('multiplies decimal strings without binary float drift', () => {
    expect(multiplyDecimal('0.10', '3').toFixed(2)).toBe('0.30');
  });

  it('formats nullable money explicitly', () => {
    expect(formatMoney(null)).toBe('Unavailable');
    expect(formatMoney('12.345')).toBe('$12.35');
  });

  it('validates four decimal prices', () => {
    expect(hasMaxFourDecimals('12.3456')).toBe(true);
    expect(hasMaxFourDecimals('12.34567')).toBe(false);
  });
});

import { describe, expect, it } from 'vitest';
import { isCancellableStatus } from '@/orders/rules';

describe('order status rules', () => {
  it('only allows cancellation before terminal states', () => {
    expect(isCancellableStatus('ACTIVE')).toBe(true);
    expect(isCancellableStatus('PARTIALLY_FILLED')).toBe(true);
    expect(isCancellableStatus('FILLED')).toBe(false);
    expect(isCancellableStatus('CANCELLED')).toBe(false);
  });
});

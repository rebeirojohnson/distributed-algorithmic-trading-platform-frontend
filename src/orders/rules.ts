import type { OrderStatus } from '@/api/schemas';

const CANCELLABLE: ReadonlySet<OrderStatus> = new Set([
  'PENDING_VALIDATION',
  'ACCEPTED',
  'ACTIVE',
  'PARTIALLY_FILLED',
]);

export function isCancellableStatus(status: OrderStatus): boolean {
  return CANCELLABLE.has(status);
}

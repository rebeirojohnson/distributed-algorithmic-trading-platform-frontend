import type { Quote } from '@/api/schemas';
import { isStaleTimestamp } from '@/lib/date';

export function quoteTimestamp(quote: Quote): string | null | undefined {
  return quote.as_of ?? quote.updated_at;
}

export function isQuoteStale(quote: Quote): boolean {
  return isStaleTimestamp(quoteTimestamp(quote));
}

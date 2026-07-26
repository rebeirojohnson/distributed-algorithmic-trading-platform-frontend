import { Link } from '@tanstack/react-router';
import type { Quote } from '@/api/schemas';
import { Sparkline } from '@/components/sparkline';
import { EmptyState, ErrorState, SkeletonRows, StatusChip } from '@/components/ui';
import { useQuotes } from '@/api/queries';
import { formatPrice } from '@/lib/decimal';
import { SUPPORTED_SYMBOLS } from '@/lib/symbols';
import { useRealtime } from '@/realtime/RealtimeProvider';
import { isQuoteStale } from '@/market/quote-utils';

export function Watchlist({ compact = false }: { compact?: boolean }) {
  const quotes = useQuotes(SUPPORTED_SYMBOLS);
  const realtime = useRealtime();
  if (quotes.isLoading) return <SkeletonRows rows={compact ? 5 : 8} />;
  if (quotes.error) return <ErrorState error={quotes.error} />;
  if (!quotes.data?.length)
    return (
      <EmptyState title="No quotes" detail="The backend returned no supported quote snapshots." />
    );

  return (
    <div className="grid gap-2">
      {quotes.data.map((quote) => (
        <QuoteRow
          key={quote.symbol}
          quote={quote}
          points={realtime.sparklines[quote.symbol] ?? []}
          compact={compact}
        />
      ))}
    </div>
  );
}

function QuoteRow({
  quote,
  points,
  compact,
}: {
  quote: Quote;
  points: { value: string; at: number }[];
  compact: boolean;
}) {
  const stale = isQuoteStale(quote);
  return (
    <Link
      to="/markets/$symbol"
      params={{ symbol: quote.symbol }}
      className="grid gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-3 hover:border-info/40 md:grid-cols-[5rem_1fr_1fr_1fr] md:items-center"
    >
      <div>
        <p className="font-display text-lg font-bold tracking-[0.12em] text-white">
          {quote.symbol}
        </p>
        <StatusChip tone={stale ? 'pending' : 'buy'}>{stale ? 'stale' : 'live'}</StatusChip>
      </div>
      <div className="grid grid-cols-3 gap-2 text-sm">
        <Metric label="Bid" value={formatPrice(quote.bid)} />
        <Metric label="Ask" value={formatPrice(quote.ask)} />
        <Metric label="Last" value={formatPrice(quote.last)} />
      </div>
      {!compact && <Sparkline points={points} />}
      {!compact && (
        <div className="grid grid-cols-2 gap-2 text-sm">
          <Metric label="Bid Size" value={String(quote.bid_size ?? 'Unavailable')} />
          <Metric label="Ask Size" value={String(quote.ask_size ?? 'Unavailable')} />
        </div>
      )}
    </Link>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.16em] text-steel">{label}</p>
      <p className="numeric text-white">{value}</p>
    </div>
  );
}

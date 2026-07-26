import { useParams } from '@tanstack/react-router';
import { useExecutions, useOrders, useQuote } from '@/api/queries';
import { Card, EmptyState, ErrorState, SkeletonRows, StatusChip } from '@/components/ui';
import { Sparkline } from '@/components/sparkline';
import { OrderTicket } from '@/orders/OrderTicket';
import { isSupportedSymbol, type SymbolCode } from '@/lib/symbols';
import { formatDateTime } from '@/lib/date';
import { formatPrice } from '@/lib/decimal';
import { useRealtime } from '@/realtime/RealtimeProvider';
import { isQuoteStale, quoteTimestamp } from '@/market/quote-utils';

export function SymbolPage() {
  const params = useParams({ from: '/protected/markets/$symbol' });
  const symbol = params.symbol.toUpperCase();
  if (!isSupportedSymbol(symbol))
    return (
      <EmptyState
        title="Unsupported symbol"
        detail="This terminal only supports the configured 15-symbol universe."
      />
    );
  return <SupportedSymbolPage symbol={symbol} />;
}

function SupportedSymbolPage({ symbol }: { symbol: SymbolCode }) {
  const quote = useQuote(symbol);
  const orders = useOrders({ symbol, limit: 10 });
  const executions = useExecutions(symbol);
  const realtime = useRealtime();

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_24rem]">
      <div className="grid gap-6">
        <Card title={`${symbol} Workspace`}>
          {quote.isLoading ? (
            <SkeletonRows rows={2} />
          ) : quote.error ? (
            <ErrorState error={quote.error} />
          ) : (
            quote.data && (
              <div className="grid gap-5">
                <div className="grid gap-3 md:grid-cols-4">
                  <Metric label="Bid" value={formatPrice(quote.data.bid)} />
                  <Metric label="Ask" value={formatPrice(quote.data.ask)} />
                  <Metric label="Last" value={formatPrice(quote.data.last)} />
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-steel">State</p>
                    <StatusChip tone={isQuoteStale(quote.data) ? 'pending' : 'buy'}>
                      {isQuoteStale(quote.data) ? 'stale' : 'live'}
                    </StatusChip>
                  </div>
                </div>
                <Sparkline points={realtime.sparklines[symbol] ?? []} />
                <p className="text-xs text-steel">
                  Session-only sparkline from live quote updates. Snapshot time:{' '}
                  {formatDateTime(quoteTimestamp(quote.data))}
                </p>
              </div>
            )
          )}
        </Card>
        <Card title="Related Orders">
          {orders.isLoading ? (
            <SkeletonRows />
          ) : orders.data?.length ? (
            <div className="grid gap-2 text-sm">
              {orders.data.map((order) => (
                <div key={order.id} className="rounded bg-white/[0.03] p-3">
                  {order.side} {order.quantity} {order.order_type}{' '}
                  <span className="text-steel">{order.status}</span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No symbol orders"
              detail="Orders for this symbol appear after submission."
            />
          )}
        </Card>
        <Card title="Related Executions">
          {executions.data?.length ? (
            <div className="grid gap-2 text-sm">
              {executions.data.map((execution) => (
                <div key={execution.id} className="rounded bg-white/[0.03] p-3">
                  {execution.side} {execution.quantity} @ {formatPrice(execution.price)}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No fills" detail="Executions for this symbol will appear here." />
          )}
        </Card>
      </div>
      <OrderTicket symbol={symbol} />
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.16em] text-steel">{label}</p>
      <p className="numeric text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}

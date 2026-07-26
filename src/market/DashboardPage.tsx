import { Link } from '@tanstack/react-router';
import { Card, EmptyState, ErrorState, SkeletonRows } from '@/components/ui';
import { useAccount, useExecutions, useOrders, usePositions } from '@/api/queries';
import { Watchlist } from '@/market/Watchlist';
import { OrderTicket } from '@/orders/OrderTicket';
import { formatDateTime } from '@/lib/date';
import { formatMoney, formatPrice } from '@/lib/decimal';

export function DashboardPage() {
  const account = useAccount();
  const orders = useOrders({ limit: 6 });
  const executions = useExecutions();
  const positions = usePositions();

  return (
    <div className="grid gap-6">
      <section className="grid gap-4 md:grid-cols-3">
        <CashCard
          title="Total Cash"
          value={formatMoney(account.data?.cash_total)}
          loading={account.isLoading}
        />
        <CashCard
          title="Available"
          value={formatMoney(account.data?.cash_available)}
          loading={account.isLoading}
        />
        <CashCard
          title="Reserved"
          value={formatMoney(account.data?.cash_reserved)}
          loading={account.isLoading}
          detail={account.data?.as_of ? `As of ${formatDateTime(account.data.as_of)}` : undefined}
        />
      </section>
      {account.error && <ErrorState error={account.error} />}
      <section className="grid gap-6 xl:grid-cols-[1fr_24rem]">
        <Card title="Live Watchlist">
          <Watchlist />
        </Card>
        <OrderTicket />
      </section>
      <section className="grid gap-6 lg:grid-cols-3">
        <Card title="Open / Recent Orders">
          {orders.isLoading ? (
            <SkeletonRows />
          ) : orders.data?.length ? (
            <div className="grid gap-2 text-sm">
              {orders.data.map((order) => (
                <Link
                  key={order.id}
                  to="/orders/$orderId"
                  params={{ orderId: order.id }}
                  className="rounded bg-white/[0.03] p-3 hover:bg-white/[0.06]"
                >
                  <span className="font-semibold text-white">{order.symbol}</span> {order.side}{' '}
                  {order.quantity} <span className="text-steel">{order.status}</span>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No orders"
              detail="Submitted orders will appear here after backend acceptance."
            />
          )}
        </Card>
        <Card title="Recent Executions">
          {executions.isLoading ? (
            <SkeletonRows />
          ) : executions.data?.length ? (
            <div className="grid gap-2 text-sm">
              {executions.data.slice(0, 6).map((execution) => (
                <div key={execution.id} className="rounded bg-white/[0.03] p-3">
                  <span className="font-semibold text-white">{execution.symbol}</span>{' '}
                  {execution.side} {execution.quantity} @{' '}
                  <span className="numeric">{formatPrice(execution.price)}</span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No fills"
              detail="Immutable execution records will appear after fills."
            />
          )}
        </Card>
        <Card title="Positions">
          {positions.isLoading ? (
            <SkeletonRows />
          ) : positions.data?.length ? (
            <div className="grid gap-2 text-sm">
              {positions.data.slice(0, 6).map((position) => (
                <div
                  key={position.symbol}
                  className="flex justify-between rounded bg-white/[0.03] p-3"
                >
                  <span className="font-semibold text-white">{position.symbol}</span>
                  <span className="numeric">{position.quantity} sh</span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No positions"
              detail="Portfolio positions update from executions and snapshots."
            />
          )}
        </Card>
      </section>
    </div>
  );
}

function CashCard({
  title,
  value,
  loading,
  detail,
}: {
  title: string;
  value: string;
  loading: boolean;
  detail?: string;
}) {
  return (
    <Card>
      <p className="text-xs uppercase tracking-[0.2em] text-steel">{title}</p>
      <p className="numeric mt-2 text-3xl font-bold text-white">{loading ? '...' : value}</p>
      {detail && <p className="mt-2 text-xs text-steel">{detail}</p>}
    </Card>
  );
}

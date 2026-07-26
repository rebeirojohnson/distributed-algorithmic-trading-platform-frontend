import { useState } from 'react';
import { useParams } from '@tanstack/react-router';
import { ApiError } from '@/api/client';
import { useCancelOrder, useExecutions, useOrder, useOrderEvents } from '@/api/queries';
import {
  Card,
  DangerButton,
  EmptyState,
  ErrorState,
  SkeletonRows,
  StatusChip,
} from '@/components/ui';
import { createIdempotencyKey } from '@/lib/id';
import { formatDateTime } from '@/lib/date';
import { formatPrice } from '@/lib/decimal';
import { isCancellableStatus } from '@/orders/rules';
import { statusTone } from '@/orders/OrdersPage';

export function OrderDetailPage() {
  const { orderId } = useParams({ from: '/protected/orders/$orderId' });
  const order = useOrder(orderId);
  const events = useOrderEvents(orderId);
  const executions = useExecutions(order.data?.symbol);
  const cancel = useCancelOrder(orderId);
  const [message, setMessage] = useState<string | null>(null);

  async function handleCancel() {
    setMessage(null);
    try {
      await cancel.mutateAsync(createIdempotencyKey());
      setMessage('Cancellation requested. Final state will arrive via events or snapshots.');
    } catch (error) {
      setMessage(
        error instanceof ApiError && error.kind === 'conflict'
          ? 'Cancellation command conflict.'
          : error instanceof Error
            ? error.message
            : 'Cancellation failed.',
      );
    }
  }

  if (order.isLoading) return <SkeletonRows rows={5} />;
  if (order.error) return <ErrorState error={order.error} />;
  if (!order.data)
    return (
      <EmptyState
        title="Order unavailable"
        detail="The requested order was not returned by the backend."
      />
    );

  const cancellable = isCancellableStatus(order.data.status);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_24rem]">
      <Card
        title={`${order.data.symbol} ${order.data.side}`}
        action={<StatusChip tone={statusTone(order.data.status)}>{order.data.status}</StatusChip>}
      >
        <div className="grid gap-3 text-sm md:grid-cols-2">
          <Detail label="Order ID" value={order.data.id} />
          <Detail label="Type" value={order.data.order_type} />
          <Detail
            label="Quantity"
            value={`${order.data.filled_quantity ?? 0} / ${order.data.quantity}`}
          />
          <Detail label="Average Price" value={formatPrice(order.data.average_fill_price)} />
          <Detail label="Limit" value={formatPrice(order.data.limit_price)} />
          <Detail label="Stop" value={formatPrice(order.data.stop_price)} />
          <Detail label="Created" value={formatDateTime(order.data.created_at)} />
          <Detail label="Expires" value={formatDateTime(order.data.expires_at)} />
        </div>
        <div className="mt-5">
          <DangerButton
            type="button"
            disabled={!cancellable || cancel.isPending}
            onClick={handleCancel}
          >
            Request Cancel
          </DangerButton>
          {!cancellable && (
            <p className="mt-2 text-sm text-steel">
              Cancellation is only available before terminal states.
            </p>
          )}
          {message && (
            <p className="mt-3 text-sm text-pending" role="status">
              {message}
            </p>
          )}
        </div>
      </Card>
      <Card title="Immutable Timeline">
        {events.isLoading ? (
          <SkeletonRows />
        ) : events.data?.length ? (
          <ol className="grid gap-3">
            {events.data.map((event) => (
              <li key={event.id} className="border-l border-info/40 pl-3 text-sm">
                <p className="font-semibold text-white">{event.status}</p>
                <p className="text-steel">{event.message ?? 'No backend message.'}</p>
                <p className="text-xs text-steel">{formatDateTime(event.created_at)}</p>
              </li>
            ))}
          </ol>
        ) : (
          <EmptyState
            title="No events"
            detail="Order events are authoritative when the backend emits them."
          />
        )}
      </Card>
      <Card title="Related Executions" className="lg:col-span-2">
        {executions.data?.filter((item) => item.order_id === orderId).length ? (
          <div className="grid gap-2 text-sm">
            {executions.data
              .filter((item) => item.order_id === orderId)
              .map((execution) => (
                <div key={execution.id} className="rounded bg-white/[0.03] p-3">
                  {execution.quantity} @ {formatPrice(execution.price)} on{' '}
                  {formatDateTime(execution.executed_at)}
                </div>
              ))}
          </div>
        ) : (
          <EmptyState
            title="No fills"
            detail="Partially filled and filled executions remain visible here."
          />
        )}
      </Card>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.16em] text-steel">{label}</p>
      <p className="numeric break-all text-white">{value}</p>
    </div>
  );
}

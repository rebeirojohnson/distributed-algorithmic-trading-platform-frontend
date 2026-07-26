import { useMemo, useState } from 'react';
import { Link } from '@tanstack/react-router';
import type { ColumnDef } from '@tanstack/react-table';
import type { Order, OrderStatus } from '@/api/schemas';
import { useOrders } from '@/api/queries';
import { Card, EmptyState, ErrorState, Select, SkeletonRows, StatusChip } from '@/components/ui';
import { DataTable } from '@/components/data-table';
import { formatDateTime } from '@/lib/date';
import { formatPrice } from '@/lib/decimal';

const statuses: Array<OrderStatus | ''> = [
  '',
  'PENDING_VALIDATION',
  'ACCEPTED',
  'ACTIVE',
  'PARTIALLY_FILLED',
  'FILLED',
  'REJECTED',
  'CANCELLED',
  'EXPIRED',
  'FAILED',
];

export function OrdersPage() {
  const [status, setStatus] = useState<OrderStatus | ''>('');
  const orders = useOrders({ limit: 75, status: status || undefined });
  const columns = useMemo<ColumnDef<Order>[]>(
    () => [
      {
        header: 'Symbol',
        cell: ({ row }) => (
          <Link
            className="font-semibold text-info"
            to="/orders/$orderId"
            params={{ orderId: row.original.id }}
          >
            {row.original.symbol}
          </Link>
        ),
      },
      { header: 'Side', accessorKey: 'side' },
      { header: 'Type', accessorKey: 'order_type' },
      { header: 'Qty', accessorKey: 'quantity' },
      {
        header: 'Status',
        cell: ({ row }) => (
          <StatusChip tone={statusTone(row.original.status)}>{row.original.status}</StatusChip>
        ),
      },
      { header: 'Avg Price', cell: ({ row }) => formatPrice(row.original.average_fill_price) },
      { header: 'Created', cell: ({ row }) => formatDateTime(row.original.created_at) },
    ],
    [],
  );

  return (
    <Card
      title="Orders"
      action={
        <Select
          value={status}
          onChange={(event) => setStatus(event.target.value as OrderStatus | '')}
        >
          {statuses.map((item) => (
            <option key={item} value={item}>
              {item || 'All statuses'}
            </option>
          ))}
        </Select>
      }
    >
      {orders.isLoading ? (
        <SkeletonRows rows={8} />
      ) : orders.error ? (
        <ErrorState error={orders.error} />
      ) : orders.data?.length ? (
        <DataTable columns={columns} data={orders.data} />
      ) : (
        <EmptyState
          title="No orders"
          detail="Bounded order history will appear here after submissions."
        />
      )}
    </Card>
  );
}

export function statusTone(status: OrderStatus): 'buy' | 'sell' | 'pending' | 'info' | 'neutral' {
  if (status === 'FILLED') return 'buy';
  if (status === 'REJECTED' || status === 'FAILED' || status === 'EXPIRED') return 'sell';
  if (
    status.includes('PENDING') ||
    status === 'ACTIVE' ||
    status === 'ACCEPTED' ||
    status === 'PARTIALLY_FILLED'
  )
    return 'pending';
  return 'neutral';
}

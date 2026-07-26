import { useMemo } from 'react';
import { Link } from '@tanstack/react-router';
import type { ColumnDef } from '@tanstack/react-table';
import type { Execution } from '@/api/schemas';
import { useExecutions } from '@/api/queries';
import { Card, EmptyState, ErrorState, SkeletonRows } from '@/components/ui';
import { DataTable } from '@/components/data-table';
import { formatDateTime } from '@/lib/date';
import { formatPrice } from '@/lib/decimal';

export function ExecutionsPage() {
  const executions = useExecutions();
  const columns = useMemo<ColumnDef<Execution>[]>(
    () => [
      { header: 'Symbol', accessorKey: 'symbol' },
      { header: 'Side', accessorKey: 'side' },
      { header: 'Quantity', accessorKey: 'quantity' },
      { header: 'Price', cell: ({ row }) => formatPrice(row.original.price) },
      { header: 'Time', cell: ({ row }) => formatDateTime(row.original.executed_at) },
      {
        header: 'Order',
        cell: ({ row }) => (
          <Link
            className="text-info"
            to="/orders/$orderId"
            params={{ orderId: row.original.order_id }}
          >
            Open
          </Link>
        ),
      },
    ],
    [],
  );
  return (
    <Card title="Executions">
      {executions.isLoading ? (
        <SkeletonRows rows={8} />
      ) : executions.error ? (
        <ErrorState error={executions.error} />
      ) : executions.data?.length ? (
        <DataTable columns={columns} data={executions.data} />
      ) : (
        <EmptyState
          title="No executions"
          detail="Immutable fills will be shown in bounded lists."
        />
      )}
    </Card>
  );
}

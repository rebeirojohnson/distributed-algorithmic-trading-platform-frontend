import { useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import type { Position } from '@/api/schemas';
import { useAccount, usePositions } from '@/api/queries';
import { Card, EmptyState, ErrorState, SkeletonRows, StatusChip } from '@/components/ui';
import { DataTable } from '@/components/data-table';
import { formatDateTime, isStaleTimestamp } from '@/lib/date';
import { formatMoney, formatPrice } from '@/lib/decimal';

export function PortfolioPage() {
  const account = useAccount();
  const positions = usePositions();
  const columns = useMemo<ColumnDef<Position>[]>(
    () => [
      { header: 'Symbol', accessorKey: 'symbol' },
      { header: 'Qty', accessorKey: 'quantity' },
      { header: 'Available', cell: ({ row }) => row.original.available_quantity ?? 'Unavailable' },
      { header: 'Reserved', cell: ({ row }) => row.original.reserved_quantity ?? 'Unavailable' },
      { header: 'Avg Price', cell: ({ row }) => formatPrice(row.original.average_price) },
      {
        header: 'Market Value',
        cell: ({ row }) =>
          row.original.market_value ? formatMoney(row.original.market_value) : 'Unavailable',
      },
      {
        header: 'Unrealized P&L',
        cell: ({ row }) =>
          row.original.unrealized_pnl ? formatMoney(row.original.unrealized_pnl) : 'Unavailable',
      },
      { header: 'As Of', cell: ({ row }) => formatDateTime(row.original.as_of) },
    ],
    [],
  );

  return (
    <div className="grid gap-6">
      <section className="grid gap-4 md:grid-cols-4">
        <Card>
          <p className="text-xs uppercase tracking-[0.2em] text-steel">Total</p>
          <p className="numeric mt-2 text-2xl font-bold">{formatMoney(account.data?.cash_total)}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-[0.2em] text-steel">Available</p>
          <p className="numeric mt-2 text-2xl font-bold">
            {formatMoney(account.data?.cash_available)}
          </p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-[0.2em] text-steel">Reserved</p>
          <p className="numeric mt-2 text-2xl font-bold">
            {formatMoney(account.data?.cash_reserved)}
          </p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-[0.2em] text-steel">Snapshot</p>
          <div className="mt-2">
            <StatusChip tone={isStaleTimestamp(account.data?.as_of) ? 'pending' : 'buy'}>
              {isStaleTimestamp(account.data?.as_of) ? 'stale / unavailable' : 'current'}
            </StatusChip>
          </div>
        </Card>
      </section>
      {account.error && <ErrorState error={account.error} />}
      <Card title="Positions">
        {positions.isLoading ? (
          <SkeletonRows rows={8} />
        ) : positions.error ? (
          <ErrorState error={positions.error} />
        ) : positions.data?.length ? (
          <DataTable columns={columns} data={positions.data} />
        ) : (
          <EmptyState
            title="No positions"
            detail="Empty portfolios are valid until executions create holdings."
          />
        )}
      </Card>
    </div>
  );
}

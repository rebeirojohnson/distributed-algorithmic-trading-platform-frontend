import { flexRender, getCoreRowModel, useReactTable, type ColumnDef } from '@tanstack/react-table';

export function DataTable<T>({ columns, data }: { columns: ColumnDef<T>[]; data: T[] }) {
  const table = useReactTable({ data, columns, getCoreRowModel: getCoreRowModel() });

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[680px] border-separate border-spacing-y-2 text-left text-sm">
        <thead className="text-xs uppercase tracking-[0.16em] text-steel">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th key={header.id} className="px-3 py-2 font-semibold">
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="bg-white/[0.03]">
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-3 py-3 first:rounded-l-lg last:rounded-r-lg">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

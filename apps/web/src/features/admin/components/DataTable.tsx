import type { ReactNode } from 'react';

export interface DataTableColumn<Row> {
  key: string;
  header: string;
  render: (row: Row) => ReactNode;
  className?: string;
}

interface DataTableProps<Row> {
  columns: DataTableColumn<Row>[];
  rows: Row[];
  getRowKey: (row: Row) => string | number;
  emptyMessage?: string;
  ariaLabel: string;
  renderActions?: (row: Row) => ReactNode;
}

export function DataTable<Row>({
  columns,
  rows,
  getRowKey,
  emptyMessage = 'No hay registros para mostrar.',
  ariaLabel,
  renderActions,
}: DataTableProps<Row>) {
  if (rows.length === 0) {
    return <p className="border border-line bg-paper p-5 text-muted" role="status">{emptyMessage}</p>;
  }

  return (
    <div className="w-full overflow-x-auto">
      <table aria-label={ariaLabel} className="w-full min-w-[36rem] border-collapse text-left">
        <thead className="bg-ink text-paper">
          <tr>
            {columns.map((column) => (
              <th key={column.key} scope="col" className={`px-4 py-3 font-bold ${column.className ?? ''}`}>
                {column.header}
              </th>
            ))}
            {renderActions && <th scope="col" className="px-4 py-3 font-bold">Acciones</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={getRowKey(row)} className="border-b border-line odd:bg-paper even:bg-white">
              {columns.map((column) => (
                <td key={column.key} className={`px-4 py-3 align-top ${column.className ?? ''}`}>
                  {column.render(row)}
                </td>
              ))}
              {renderActions && <td className="px-4 py-3 align-top">{renderActions(row)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

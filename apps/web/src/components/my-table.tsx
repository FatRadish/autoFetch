import * as React from 'react';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  TableFooter,
  TableCaption,
} from '@/components/ui/table';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export type Column<T> = {
  id?: string;
  header: React.ReactNode;
  accessor?: keyof T | ((row: T) => any);
  cell?: (row: T) => React.ReactNode;
  width?: string;
  align?: 'left' | 'right' | 'center';
  sortable?: boolean;
};

export interface MyTableProps<T> {
  columns: Column<T>[];
  data: T[];
  pageSize?: number;
  pagination?: boolean;
  selectable?: boolean;
  onSelectionChange?: (selected: T[]) => void;
  getRowKey?: (row: T) => string | number;
  caption?: React.ReactNode;
  noData?: React.ReactNode;
  className?: string;
}

function getCellValue<T>(row: T, accessor?: keyof T | ((r: T) => any)) {
  if (!accessor) return undefined;
  if (typeof accessor === 'function') return accessor(row);
  return (row as any)[accessor];
}

export function MyTable<T>({
  columns,
  data,
  pageSize = 10,
  pagination = true,
  selectable = false,
  onSelectionChange,
  getRowKey,
  caption,
  noData = 'No data',
  className,
}: MyTableProps<T>) {
  const [pageIndex, setPageIndex] = React.useState(0);
  const [sortBy, setSortBy] = React.useState<{
    id?: string;
    direction?: 'asc' | 'desc';
  } | null>(null);
  const [selected, setSelected] = React.useState<Record<string, boolean>>({});

  const keyFor = React.useCallback(
    (row: T, idx: number) => {
      if (getRowKey) return String(getRowKey(row));
      return String((row as any).id ?? idx);
    },
    [getRowKey]
  );

  React.useEffect(() => {
    if (onSelectionChange) {
      const selectedRows: T[] = [];
      data.forEach((row, idx) => {
        const k = keyFor(row, idx);
        if (selected[k]) selectedRows.push(row);
      });
      onSelectionChange(selectedRows);
    }
  }, [selected, data, keyFor, onSelectionChange]);

  const sortedData = React.useMemo(() => {
    if (!sortBy?.id) return data;
    const col = columns.find((c) => c.id === sortBy.id);
    if (!col) return data;
    const sorted = [...data].sort((a, b) => {
      const va = getCellValue(a, col.accessor);
      const vb = getCellValue(b, col.accessor);
      if (va == null && vb == null) return 0;
      if (va == null) return -1;
      if (vb == null) return 1;
      if (typeof va === 'number' && typeof vb === 'number') return va - vb;
      return String(va).localeCompare(String(vb));
    });
    if (sortBy.direction === 'desc') sorted.reverse();
    return sorted;
  }, [data, sortBy, columns]);

  const totalPages = pagination
    ? Math.max(1, Math.ceil(sortedData.length / pageSize))
    : 1;
  const page = React.useMemo(() => {
    if (!pagination) return sortedData;
    const start = pageIndex * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, pageIndex, pageSize, pagination]);

  const toggleSort = (col: Column<T>) => {
    if (!col.id || !col.sortable) return;
    setPageIndex(0);
    setSortBy((s) => {
      if (!s || s.id !== col.id) return { id: col.id, direction: 'asc' };
      if (s.direction === 'asc') return { id: col.id, direction: 'desc' };
      return null;
    });
  };

  const toggleSelectAllOnPage = () => {
    const newSel = { ...selected };
    const allSelected = page.every((r, i) => {
      const k = keyFor(r, pageIndex * pageSize + i);
      return !!newSel[k];
    });
    page.forEach((r, i) => {
      const k = keyFor(r, pageIndex * pageSize + i);
      newSel[k] = !allSelected;
    });
    setSelected(newSel);
  };

  const toggleSelect = (row: T, idx: number) => {
    const k = keyFor(row, idx);
    setSelected((s) => ({ ...s, [k]: !s[k] }));
  };

  // Compute colSpan to avoid repetition
  const colSpan = (selectable ? 1 : 0) + columns.length;

  return (
    <div className={className}>
      <Table>
        {caption ? <TableCaption>{caption}</TableCaption> : null}
        <TableHeader>
          <TableRow>
            {selectable ? (
              <TableHead className="w-12">
                <input
                  type="checkbox"
                  aria-label="Select all"
                  onChange={toggleSelectAllOnPage}
                  checked={page.every(
                    (r, i) => selected[keyFor(r, pageIndex * pageSize + i)]
                  )}
                />
              </TableHead>
            ) : null}
            {columns.map((col) => (
              <TableHead
                key={col.id ?? String(col.header)}
                className={`${col.align === 'right' ? 'text-right' : ''} ${col.sortable && col.id ? 'cursor-pointer' : ''}`}
                onClick={() => toggleSort(col)}
                style={{ width: col.width }}
              >
                <div className="flex items-center gap-2 select-none">
                  <span>{col.header}</span>
                  {col.sortable && col.id ? (
                    <span className="text-muted-foreground text-xs">
                      {sortBy?.id === col.id
                        ? sortBy.direction === 'asc'
                          ? '▲'
                          : '▼'
                        : '⇅'}
                    </span>
                  ) : null}
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {page.length === 0 ? (
            <TableRow>
              <TableCell colSpan={colSpan} className="text-center">
                {noData}
              </TableCell>
            </TableRow>
          ) : (
            page.map((row, rowIdx) => (
              <TableRow key={keyFor(row, pageIndex * pageSize + rowIdx)}>
                {selectable ? (
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={
                        !!selected[keyFor(row, pageIndex * pageSize + rowIdx)]
                      }
                      onChange={() =>
                        toggleSelect(row, pageIndex * pageSize + rowIdx)
                      }
                    />
                  </TableCell>
                ) : null}
                {columns.map((col) => (
                  <TableCell
                    key={col.id ?? String(col.header)}
                    className={col.align === 'right' ? 'text-right' : undefined}
                  >
                    {col.cell
                      ? col.cell(row)
                      : String(getCellValue(row, col.accessor) ?? '')}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
        {pagination ? (
          <TableFooter>
            <TableRow>
              <TableCell colSpan={colSpan}>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Page {Math.min(pageIndex + 1, totalPages)} of {totalPages}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      aria-label="Previous page"
                      className="btn-ghost h-8 w-8"
                      onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
                      disabled={pageIndex === 0}
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      aria-label="Next page"
                      className="btn-ghost h-8 w-8"
                      onClick={() =>
                        setPageIndex((p) => Math.min(totalPages - 1, p + 1))
                      }
                      disabled={pageIndex >= totalPages - 1}
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </TableCell>
            </TableRow>
          </TableFooter>
        ) : null}
      </Table>
    </div>
  );
}

export default MyTable;

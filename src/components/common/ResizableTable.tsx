import React from 'react';
import { ModernDataTable, type ModernTableColumn } from './ModernDataTable';

export interface ColumnDef<T> {
  key: string;
  header: string;
  width?: number;
  minWidth?: number;
  align?: 'left' | 'center' | 'right';
  render: (item: T, index: number) => React.ReactNode;
}

export interface ResizableTableProps<T> {
  tableId: string;
  columns: ColumnDef<T>[];
  data: T[];
  selectedIndex?: number;
  onSelectIndex?: (index: number) => void;
  onRowClick?: (item: T, index: number) => void;
  onRowDoubleClick?: (item: T, index: number) => void;
  onRowDelete?: (item: T, index: number) => void;
  onRowSubmit?: (item: T, index: number) => void;
  rowKey: (item: T, index: number) => string;
  isPaginated?: boolean;
  totalCount?: number;
  pageSize?: number;
  currentPage?: number;
  onPageChange?: (page: number, targetRow?: 'first' | 'last') => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  style?: React.CSSProperties;
}

export function ResizableTable<T>({
  tableId,
  columns,
  data,
  selectedIndex = 0,
  onSelectIndex,
  onRowClick,
  onRowDoubleClick,
  onRowDelete,
  onRowSubmit,
  rowKey,
  isPaginated = false,
  totalCount = 0,
  pageSize = 25,
  currentPage = 1,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
  style
}: ResizableTableProps<T>) {
  const modernColumns: ModernTableColumn<T>[] = columns.map(c => ({
    key: c.key,
    header: c.header,
    width: c.width,
    minWidth: c.minWidth,
    align: c.align,
    render: (item: T, idx: number) => c.render(item, idx)
  }));

  return (
    <ModernDataTable
      tableId={tableId}
      columns={modernColumns}
      data={data}
      rowKey={rowKey}
      selectedIndex={selectedIndex}
      onSelectIndex={onSelectIndex}
      onRowClick={onRowClick}
      onRowDoubleClick={onRowDoubleClick}
      onRowDelete={onRowDelete}
      onRowSubmit={onRowSubmit}
      isPaginated={isPaginated}
      totalCount={totalCount}
      pageSize={pageSize}
      currentPage={currentPage}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      pageSizeOptions={pageSizeOptions}
      containerStyle={style}
    />
  );
}
export default ResizableTable;

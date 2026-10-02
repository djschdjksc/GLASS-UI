import React, { useRef } from 'react';
import { useSettings } from '../../context/SettingsContext';
import { Pagination as ShadcnPagination } from '../ui/shadcn';
import { useTableKeyboardNavigation } from '../../hooks/useTableKeyboardNavigation';

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
  // Optional pagination
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
  const { rowHeightPx, preferences, setColumnWidth } = useSettings();
  const resizingColRef = useRef<{ key: string; startX: number; startWidth: number } | null>(null);
  const tableWrapperRef = useRef<HTMLDivElement>(null);

  const totalPages = Math.max(1, Math.ceil((totalCount || data.length) / pageSize));

  // Tally Keyboard Navigation hook
  const {
    handleKeyDown,
    handlePageChange,
    focusTable,
    paginationIdPrefix
  } = useTableKeyboardNavigation({
    tableId,
    itemCount: data.length,
    selectedIndex,
    onSelectIndex: (idx) => onSelectIndex?.(idx),
    isPaginated,
    currentPage,
    totalPages,
    onPageChange,
    onRowSubmit: (idx) => {
      if (data[idx]) {
        if (onRowSubmit) onRowSubmit(data[idx], idx);
        else if (onRowDoubleClick) onRowDoubleClick(data[idx], idx);
      }
    },
    onRowDelete: (idx) => {
      if (data[idx] && onRowDelete) onRowDelete(data[idx], idx);
    },
    tableContainerRef: tableWrapperRef
  });

  const getColWidth = (col: ColumnDef<T>): number => {
    const fullKey = `${tableId}_${col.key}`;
    return preferences.columnWidths[fullKey] || col.width || 120;
  };

  const handleMouseDownResize = (colKey: string, currentWidth: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    resizingColRef.current = {
      key: `${tableId}_${colKey}`,
      startX: e.clientX,
      startWidth: currentWidth
    };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!resizingColRef.current) return;
      const delta = moveEvent.clientX - resizingColRef.current.startX;
      const newWidth = Math.max(40, resizingColRef.current.startWidth + delta);
      setColumnWidth(resizingColRef.current.key, newWidth);
    };

    const handleMouseUp = () => {
      resizingColRef.current = null;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        minHeight: 0,
        overflow: 'hidden',
        background: '#09090b',
        border: '1px solid #27272a',
        borderRadius: '8px',
        ...style
      }}
    >
      <div
        id={`${tableId}-wrapper`}
        ref={tableWrapperRef}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        style={{
          flex: 1,
          overflow: 'auto',
          minHeight: 0,
          outline: 'none'
        }}
        className="resizable-table-wrapper"
      >
        <table className="apple-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: '#18181b', borderBottom: '1px solid #27272a' }}>
            <tr>
              {columns.map(col => {
                const width = getColWidth(col);
                return (
                  <th
                    key={col.key}
                    style={{
                      width: `${width}px`,
                      textAlign: col.align || 'left',
                      position: 'relative',
                      userSelect: 'none'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: col.align === 'right' ? 'flex-end' : col.align === 'center' ? 'center' : 'flex-start' }}>
                      <span>{col.header}</span>
                    </div>
                    <div
                      onMouseDown={(e) => handleMouseDownResize(col.key, width, e)}
                      style={{
                        position: 'absolute',
                        right: 0,
                        top: 0,
                        bottom: 0,
                        width: '5px',
                        cursor: 'col-resize',
                        zIndex: 2
                      }}
                      title="Drag to resize column"
                    />
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {data.map((item, idx) => {
              const isSelected = selectedIndex === idx;
              return (
                <tr
                  key={rowKey(item, idx)}
                  id={`${tableId}-row-${idx}`}
                  data-row-index={idx}
                  onClick={() => {
                    onSelectIndex?.(idx);
                    onRowClick?.(item, idx);
                  }}
                  onDoubleClick={() => onRowDoubleClick?.(item, idx)}
                  className={`mac-table-row ${isSelected ? 'selected' : ''}`}
                  style={{
                    height: `${rowHeightPx}px`,
                    background: isSelected ? '#27272a' : 'transparent',
                    cursor: 'pointer'
                  }}
                >
                  {columns.map(col => (
                    <td
                      key={col.key}
                      style={{
                        textAlign: col.align || 'left',
                        height: `${rowHeightPx}px`,
                        padding: '2px 8px'
                      }}
                    >
                      {col.render(item, idx)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer if paginated */}
      {isPaginated && (
        <ShadcnPagination
          idPrefix={paginationIdPrefix}
          totalCount={totalCount || data.length}
          pageSize={pageSize}
          currentPage={currentPage}
          onPageChange={handlePageChange}
          onPageSizeChange={onPageSizeChange}
          pageSizeOptions={pageSizeOptions}
          onFocusTableFirstRow={() => focusTable('first')}
          onFocusTableLastRow={() => focusTable('last')}
          style={{ borderRadius: '0', borderLeft: 'none', borderRight: 'none', borderBottom: 'none' }}
        />
      )}
    </div>
  );
}

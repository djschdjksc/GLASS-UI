import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Pagination as ShadcnPagination
} from '../ui/shadcn';
import { useTableKeyboardNavigation } from '../../hooks/useTableKeyboardNavigation';
import { macAudio } from '../../utils/macAudio';
import { Inbox } from 'lucide-react';

export interface ModernTableColumn<T> {
  key: string;
  header: React.ReactNode;
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  align?: 'left' | 'center' | 'right';
  className?: string;
  headerStyle?: React.CSSProperties;
  cellStyle?: React.CSSProperties;
  render: (item: T, index: number, isSelected: boolean, isEditing: boolean) => React.ReactNode;
}

export interface ModernDataTableProps<T> {
  tableId: string;
  columns: ModernTableColumn<T>[];
  data: T[];
  rowKey: (item: T, index: number) => string | number;
  // Selection
  selectedIndex?: number | null;
  onSelectIndex?: (index: number) => void;
  // Editing
  editingIndex?: number | null;
  onEditingIndexChange?: (index: number | null) => void;
  // Actions
  onRowClick?: (item: T, index: number) => void;
  onRowDoubleClick?: (item: T, index: number) => void;
  onRowDelete?: (item: T, index: number) => void;
  onRowSubmit?: (item: T, index: number) => void;
  // Pagination
  isPaginated?: boolean;
  totalCount?: number;
  pageSize?: number;
  currentPage?: number;
  onPageChange?: (page: number, targetRow?: 'first' | 'last') => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  // Appearance & Layout
  rowHeight?: number;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  stickyHeader?: boolean;
  containerStyle?: React.CSSProperties;
  tableStyle?: React.CSSProperties;
  headerStyle?: React.CSSProperties;
  rowStyle?: (item: T, index: number, isSelected: boolean) => React.CSSProperties;
  className?: string;
  // Slots
  topToolbar?: React.ReactNode;
  bottomSummary?: React.ReactNode;
}

export function ModernDataTable<T>({
  tableId,
  columns,
  data,
  rowKey,
  selectedIndex = 0,
  onSelectIndex,
  editingIndex = null,
  onEditingIndexChange,
  onRowClick,
  onRowDoubleClick,
  onRowDelete,
  onRowSubmit,
  isPaginated = false,
  totalCount = 0,
  pageSize = 25,
  currentPage = 1,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
  rowHeight = 28,
  emptyMessage = 'No records found',
  emptyIcon,
  stickyHeader = true,
  containerStyle,
  tableStyle,
  headerStyle,
  rowStyle,
  className = '',
  topToolbar,
  bottomSummary
}: ModernDataTableProps<T>) {
  const tableWrapperRef = useRef<HTMLDivElement>(null);

  // Column width state with localStorage persistence
  const [colWidths, setColWidths] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem(`modern_table_cols_${tableId}`);
      if (saved) return JSON.parse(saved);
    } catch {}
    const defaults: Record<string, number> = {};
    columns.forEach(col => {
      defaults[col.key] = col.width || 120;
    });
    return defaults;
  });

  const resizingColRef = useRef<{ key: string; startX: number; startW: number } | null>(null);

  const startColResize = (colKey: string, currentWidth: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    resizingColRef.current = {
      key: colKey,
      startX: e.clientX,
      startW: currentWidth
    };

    const handleMouseMove = (me: MouseEvent) => {
      if (!resizingColRef.current) return;
      const delta = me.clientX - resizingColRef.current.startX;
      const newWidth = Math.max(35, resizingColRef.current.startW + delta);
      setColWidths(prev => {
        const next = { ...prev, [colKey]: newWidth };
        try {
          localStorage.setItem(`modern_table_cols_${tableId}`, JSON.stringify(next));
        } catch {}
        return next;
      });
    };

    const handleMouseUp = () => {
      resizingColRef.current = null;
      document.body.style.cursor = '';
      document.body.style.userSelect = 'text';
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const totalPages = Math.max(1, Math.ceil((totalCount || data.length) / pageSize));

  // Unified Keyboard Navigation hook
  const {
    handleKeyDown,
    handlePageChange,
    focusTable,
    paginationIdPrefix
  } = useTableKeyboardNavigation({
    tableId,
    itemCount: data.length,
    selectedIndex: selectedIndex !== null && selectedIndex !== undefined ? selectedIndex : 0,
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

  // Global keydown listeners for Escape, Ctrl+Enter, etc.
  const handleWrapperKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'NumLock' || e.code === 'NumLock' || e.key === 'Clear') return;

    if (e.key === 'Escape') {
      if (editingIndex !== null && onEditingIndexChange) {
        e.preventDefault();
        onEditingIndexChange(null);
        return;
      }
    }

    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      if (selectedIndex !== null && selectedIndex !== undefined && onEditingIndexChange) {
        e.preventDefault();
        macAudio.playClick();
        onEditingIndexChange(selectedIndex);
        return;
      }
    }

    handleKeyDown(e);
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        minHeight: 0,
        height: '100%',
        overflow: 'hidden',
        background: '#09090b',
        border: '1px solid #27272a',
        borderRadius: '8px',
        ...containerStyle
      }}
      className={`modern-data-table-container ${className}`}
    >
      {/* Top Toolbar slot */}
      {topToolbar && (
        <div style={{ flexShrink: 0, borderBottom: '1px solid #27272a' }}>
          {topToolbar}
        </div>
      )}

      {/* Main Table Scroll Container */}
      <div
        id={`${tableId}-wrapper`}
        ref={tableWrapperRef}
        tabIndex={0}
        onKeyDown={handleWrapperKeyDown}
        style={{
          flex: 1,
          overflow: 'auto',
          minHeight: 0,
          outline: 'none',
          position: 'relative'
        }}
        className="modern-data-table-scroll"
      >
        <Table
          id={tableId}
          containerStyle={{ border: 'none', borderRadius: 0, background: 'transparent' }}
          style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', ...tableStyle }}
        >
          <TableHeader
            style={{
              position: stickyHeader ? 'sticky' : 'static',
              top: 0,
              zIndex: 10,
              background: '#18181b',
              borderBottom: '1px solid #27272a',
              ...headerStyle
            }}
          >
            <TableRow style={{ height: '32px', borderBottom: '1px solid #27272a' }}>
              {columns.map(col => {
                const width = colWidths[col.key] || col.width || 120;
                return (
                  <TableHead
                    key={col.key}
                    style={{
                      width: `${width}px`,
                      minWidth: `${col.minWidth || 35}px`,
                      maxWidth: col.maxWidth ? `${col.maxWidth}px` : undefined,
                      textAlign: col.align || 'left',
                      position: 'relative',
                      userSelect: 'none',
                      padding: '4px 8px',
                      fontSize: '11px',
                      fontWeight: 700,
                      color: '#a1a1aa',
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                      ...col.headerStyle
                    }}
                    className={col.className}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent:
                          col.align === 'right'
                            ? 'flex-end'
                            : col.align === 'center'
                            ? 'center'
                            : 'flex-start',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {col.header}
                    </div>

                    {/* Resizer Handle */}
                    <div
                      onMouseDown={(e) => startColResize(col.key, width, e)}
                      style={{
                        position: 'absolute',
                        right: 0,
                        top: 0,
                        bottom: 0,
                        width: '5px',
                        cursor: 'col-resize',
                        zIndex: 2,
                        opacity: 0,
                        transition: 'opacity 0.15s ease'
                      }}
                      className="col-resizer-handle"
                      title="Drag to resize column"
                    />
                  </TableHead>
                );
              })}
            </TableRow>
          </TableHeader>

          <TableBody>
            {data.length === 0 ? (
              <TableRow style={{ height: '140px' }}>
                <TableCell
                  colSpan={columns.length}
                  style={{ textAlign: 'center', color: '#71717a', padding: '32px 16px' }}
                >
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    {emptyIcon || <Inbox size={28} style={{ color: '#52525b', opacity: 0.8 }} />}
                    <span style={{ fontSize: '13px', fontWeight: 500 }}>{emptyMessage}</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              data.map((item, idx) => {
                const isSelected = selectedIndex === idx;
                const isEditing = editingIndex === idx;
                const customStyle = rowStyle ? rowStyle(item, idx, isSelected) : {};

                return (
                  <TableRow
                    key={rowKey(item, idx)}
                    id={`${tableId}-row-${idx}`}
                    isSelected={isSelected}
                    tabIndex={isSelected ? 0 : -1}
                    style={{
                      height: `${rowHeight}px`,
                      background: isSelected
                        ? 'rgba(56, 189, 248, 0.16)'
                        : idx % 2 === 0
                        ? 'rgba(24, 24, 27, 0.4)'
                        : 'transparent',
                      outline: isSelected ? '2px solid rgba(56, 189, 248, 0.75)' : 'none',
                      outlineOffset: '-2px',
                      boxShadow: isSelected ? 'inset 0 0 0 1px rgba(56, 189, 248, 0.3)' : 'none',
                      cursor: 'pointer',
                      borderBottom: '1px solid rgba(39, 39, 42, 0.5)',
                      ...customStyle
                    }}
                    onClick={() => {
                      onSelectIndex?.(idx);
                      onRowClick?.(item, idx);
                    }}
                    onDoubleClick={() => {
                      if (onEditingIndexChange) onEditingIndexChange(idx);
                      onRowDoubleClick?.(item, idx);
                    }}
                  >
                    {columns.map(col => (
                      <TableCell
                        key={col.key}
                        style={{
                          textAlign: col.align || 'left',
                          height: `${rowHeight}px`,
                          padding: '2px 6px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          ...col.cellStyle
                        }}
                      >
                        {col.render(item, idx, isSelected, isEditing)}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Bottom Summary Bar slot */}
      {bottomSummary && (
        <div style={{ flexShrink: 0, borderTop: '1px solid #27272a', background: '#18181b' }}>
          {bottomSummary}
        </div>
      )}

      {/* Pagination Footer */}
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
          style={{
            borderRadius: '0',
            borderLeft: 'none',
            borderRight: 'none',
            borderBottom: 'none',
            borderTop: '1px solid #27272a',
            background: '#121215'
          }}
        />
      )}
    </div>
  );
}

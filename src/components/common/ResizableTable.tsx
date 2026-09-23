import React, { useState, useRef } from 'react';
import { useSettings } from '../../context/SettingsContext';

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
  onRowClick?: (item: T, index: number) => void;
  onRowDoubleClick?: (item: T, index: number) => void;
  rowKey: (item: T, index: number) => string;
}

export function ResizableTable<T>({
  tableId,
  columns,
  data,
  selectedIndex,
  onRowClick,
  onRowDoubleClick,
  rowKey
}: ResizableTableProps<T>) {
  const { rowHeightPx, preferences, setColumnWidth } = useSettings();
  const resizingColRef = useRef<{ key: string; startX: number; startWidth: number } | null>(null);

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
    <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }} className="resizable-table-wrapper">
      <table className="apple-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
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
                onClick={() => onRowClick?.(item, idx)}
                onDoubleClick={() => onRowDoubleClick?.(item, idx)}
                className={`mac-table-row ${isSelected ? 'selected' : ''}`}
                style={{ height: `${rowHeightPx}px` }}
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
  );
}

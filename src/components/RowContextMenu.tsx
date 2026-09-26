import React, { useEffect, useRef } from 'react';
import { Plus, Trash2, XCircle } from 'lucide-react';

export interface RowContextMenuState {
  isOpen: boolean;
  x: number;
  y: number;
  rowIndex: number;
}

interface Props {
  contextMenu: RowContextMenuState;
  onClose: () => void;
  onInsertAbove: (index: number) => void;
  onInsertBelow: (index: number) => void;
  onDeleteRow: (index: number) => void;
  onClearRow: (index: number) => void;
}

export const RowContextMenu: React.FC<Props> = ({
  contextMenu,
  onClose,
  onInsertAbove,
  onInsertBelow,
  onDeleteRow,
  onClearRow
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (contextMenu.isOpen) {
      document.addEventListener('mousedown', handleOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutside);
    };
  }, [contextMenu.isOpen, onClose]);

  if (!contextMenu.isOpen) return null;

  // Viewport bounds check
  const menuWidth = 190;
  const menuHeight = 155;
  const safeX = Math.min(contextMenu.x, window.innerWidth - menuWidth - 10);
  const safeY = Math.min(contextMenu.y, window.innerHeight - menuHeight - 10);

  return (
    <div
      ref={menuRef}
      style={{
        position: 'fixed', animation: "antSlideDown 0.2s cubic-bezier(0.23, 1, 0.32, 1) forwards", transformOrigin: "top center", backdropFilter: "blur(60px) saturate(200%)", background: "rgba(10, 15, 25, 0.98)",
        left: `${safeX}px`,
        top: `${safeY}px`,
        width: `${menuWidth}px`,
        background: 'rgba(20, 24, 32, 0.96)',
        backdropFilter: 'blur(30px)',
        border: '1px solid rgba(255, 255, 255, 0.18)',
        borderRadius: '10px',
        boxShadow: '0 12px 32px rgba(0, 0, 0, 0.7), 0 0 1px rgba(255, 255, 255, 0.25)',
        padding: '5px',
        zIndex: 9999999,
        display: 'flex',
        flexDirection: 'column',
        gap: '2px'
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Option 1: + Insert 1 row above */}
      <button
        type="button"
        onClick={() => {
          onInsertAbove(contextMenu.rowIndex);
          onClose();
        }}
        className="context-menu-item"
        style={{
          width: '100%',
          padding: '7px 10px',
          borderRadius: '6px',
          border: 'none',
          background: 'transparent',
          color: '#f4f4f5',
          fontSize: '12px',
          fontWeight: 500,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          textAlign: 'left'
        }}
      >
        <Plus size={14} color="#38bdf8" />
        <span>+ Insert 1 row above</span>
      </button>

      {/* Option 2: + Insert 1 row below */}
      <button
        type="button"
        onClick={() => {
          onInsertBelow(contextMenu.rowIndex + 1);
          onClose();
        }}
        className="context-menu-item"
        style={{
          width: '100%',
          padding: '7px 10px',
          borderRadius: '6px',
          border: 'none',
          background: 'transparent',
          color: '#f4f4f5',
          fontSize: '12px',
          fontWeight: 500,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          textAlign: 'left'
        }}
      >
        <Plus size={14} color="#34c759" />
        <span>+ Insert 1 row below</span>
      </button>

      <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.1)', margin: '3px 0' }} />

      {/* Option 3: Delete row */}
      <button
        type="button"
        onClick={() => {
          onDeleteRow(contextMenu.rowIndex);
          onClose();
        }}
        className="context-menu-item danger"
        style={{
          width: '100%',
          padding: '7px 10px',
          borderRadius: '6px',
          border: 'none',
          background: 'transparent',
          color: '#f87171',
          fontSize: '12px',
          fontWeight: 500,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          textAlign: 'left'
        }}
      >
        <Trash2 size={13} color="#f87171" />
        <span>Delete row</span>
      </button>

      {/* Option 4: X Clear row */}
      <button
        type="button"
        onClick={() => {
          onClearRow(contextMenu.rowIndex);
          onClose();
        }}
        className="context-menu-item"
        style={{
          width: '100%',
          padding: '7px 10px',
          borderRadius: '6px',
          border: 'none',
          background: 'transparent',
          color: '#fbbf24',
          fontSize: '12px',
          fontWeight: 500,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          textAlign: 'left'
        }}
      >
        <XCircle size={13} color="#fbbf24" />
        <span>X Clear row</span>
      </button>
    </div>
  );
};

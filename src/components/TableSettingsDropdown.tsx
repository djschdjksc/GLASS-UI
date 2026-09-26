import React, { useEffect, useRef } from 'react';
import { 
  CornerDownRight, 
  ArrowDown, 
  ArrowLeft, 
  ArrowUp, 
  X, 
  Check, 
  Sliders, 
  Type, 
  Maximize2,
  RotateCcw 
} from 'lucide-react';
import type { EnterDirection } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  enterDirection: EnterDirection;
  onSetEnterDirection: (dir: EnterDirection) => void;
  rowHeight: number;
  onSetRowHeight: (h: number) => void;
  tableFontSize: number;
  onSetTableFontSize: (size: number) => void;
  onToast: (msg: string, type?: 'success' | 'info' | 'warning') => void;
  align?: 'left' | 'right';
}

export const TableSettingsDropdown: React.FC<Props> = ({
  isOpen,
  onClose,
  enterDirection,
  onSetEnterDirection,
  rowHeight,
  onSetRowHeight,
  tableFontSize,
  onSetTableFontSize,
  onToast,
  align = 'left'
}) => {
  const panelRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const ROW_HEIGHT_PRESETS = [
    { label: 'Compact', value: 24 },
    { label: 'Normal', value: 28 },
    { label: 'Comfort', value: 34 },
    { label: 'Large', value: 42 }
  ];

  const FONT_SIZE_PRESETS = [
    { label: 'Small', value: 11 },
    { label: 'Medium', value: 12 },
    { label: 'Large', value: 14 },
    { label: 'Extra', value: 16 }
  ];

  return (
    <div
      ref={panelRef}
      style={{
        position: 'absolute', animation: "antSlideDown 0.2s cubic-bezier(0.23, 1, 0.32, 1) forwards", transformOrigin: "top center", backdropFilter: "blur(60px) saturate(200%)", background: "rgba(10, 15, 25, 0.98)",
        top: 'calc(100% + 8px)',
        [align === 'right' ? 'right' : 'left']: 0,
        width: '280px',
        background: 'rgba(18, 22, 28, 0.94)',
        backdropFilter: 'blur(30px)',
        border: '1px solid rgba(255, 255, 255, 0.18)',
        borderRadius: '12px',
        padding: '14px',
        boxShadow: '0 16px 40px rgba(0, 0, 0, 0.65), 0 0 1px rgba(255, 255, 255, 0.3)',
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        color: '#f4f4f5'
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
          <Sliders size={14} color="#38bdf8" />
          <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.4px', color: '#ffffff' }}>
            Table Settings
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#a1a1aa',
            cursor: 'pointer',
            padding: '2px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <X size={14} />
        </button>
      </div>

      {/* 1. ENTER DIRECTION */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8' }}>
            Enter Jump Direction
          </span>
          <span style={{ fontSize: '10px', color: '#38bdf8', fontWeight: 700, textTransform: 'uppercase' }}>
            {enterDirection}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
          {/* Right */}
          <button
            type="button"
            onClick={() => {
              onSetEnterDirection('right');
              onToast('Enter Direction: RIGHT', 'info');
            }}
            style={{
              padding: '6px 8px',
              borderRadius: '7px',
              border: enterDirection === 'right' ? '1px solid #0071e3' : '1px solid rgba(255, 255, 255, 0.1)',
              background: enterDirection === 'right' ? 'rgba(0, 113, 227, 0.35)' : 'rgba(255, 255, 255, 0.04)',
              color: enterDirection === 'right' ? '#ffffff' : '#d4d4d8',
              fontSize: '11px',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CornerDownRight size={13} color="#38bdf8" />
              <span>Right (➔)</span>
            </div>
            {enterDirection === 'right' && <Check size={11} color="#38bdf8" />}
          </button>

          {/* Down */}
          <button
            type="button"
            onClick={() => {
              onSetEnterDirection('down');
              onToast('Enter Direction: DOWN', 'info');
            }}
            style={{
              padding: '6px 8px',
              borderRadius: '7px',
              border: enterDirection === 'down' ? '1px solid #0071e3' : '1px solid rgba(255, 255, 255, 0.1)',
              background: enterDirection === 'down' ? 'rgba(0, 113, 227, 0.35)' : 'rgba(255, 255, 255, 0.04)',
              color: enterDirection === 'down' ? '#ffffff' : '#d4d4d8',
              fontSize: '11px',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ArrowDown size={13} color="#34c759" />
              <span>Down (🠗)</span>
            </div>
            {enterDirection === 'down' && <Check size={11} color="#34c759" />}
          </button>

          {/* Left */}
          <button
            type="button"
            onClick={() => {
              onSetEnterDirection('left');
              onToast('Enter Direction: LEFT', 'info');
            }}
            style={{
              padding: '6px 8px',
              borderRadius: '7px',
              border: enterDirection === 'left' ? '1px solid #0071e3' : '1px solid rgba(255, 255, 255, 0.1)',
              background: enterDirection === 'left' ? 'rgba(0, 113, 227, 0.35)' : 'rgba(255, 255, 255, 0.04)',
              color: enterDirection === 'left' ? '#ffffff' : '#d4d4d8',
              fontSize: '11px',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ArrowLeft size={13} color="#fbbf24" />
              <span>Left (🠔)</span>
            </div>
            {enterDirection === 'left' && <Check size={11} color="#fbbf24" />}
          </button>

          {/* Up */}
          <button
            type="button"
            onClick={() => {
              onSetEnterDirection('up');
              onToast('Enter Direction: UP', 'info');
            }}
            style={{
              padding: '6px 8px',
              borderRadius: '7px',
              border: enterDirection === 'up' ? '1px solid #0071e3' : '1px solid rgba(255, 255, 255, 0.1)',
              background: enterDirection === 'up' ? 'rgba(0, 113, 227, 0.35)' : 'rgba(255, 255, 255, 0.04)',
              color: enterDirection === 'up' ? '#ffffff' : '#d4d4d8',
              fontSize: '11px',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ArrowUp size={13} color="#a78bfa" />
              <span>Up (🠕)</span>
            </div>
            {enterDirection === 'up' && <Check size={11} color="#a78bfa" />}
          </button>
        </div>
      </div>

      {/* 2. ROW HEIGHT */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Maximize2 size={12} color="#94a3b8" />
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8' }}>
              Row Height
            </span>
          </div>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8' }}>
            {rowHeight}px
          </span>
        </div>

        {/* Range Slider */}
        <input
          type="range"
          min="22"
          max="50"
          step="2"
          value={rowHeight}
          onChange={(e) => onSetRowHeight(Number(e.target.value))}
          style={{
            width: '100%',
            accentColor: '#0071e3',
            cursor: 'pointer',
            height: '4px'
          }}
        />

        {/* Quick Presets */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px', marginTop: '2px' }}>
          {ROW_HEIGHT_PRESETS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => {
                onSetRowHeight(p.value);
                onToast(`Row Height: ${p.value}px`, 'info');
              }}
              style={{
                padding: '4px 2px',
                borderRadius: '5px',
                border: rowHeight === p.value ? '1px solid #0071e3' : '1px solid rgba(255, 255, 255, 0.1)',
                background: rowHeight === p.value ? 'rgba(0, 113, 227, 0.3)' : 'rgba(255, 255, 255, 0.04)',
                color: rowHeight === p.value ? '#ffffff' : '#a1a1aa',
                fontSize: '10px',
                fontWeight: rowHeight === p.value ? 600 : 500,
                cursor: 'pointer',
                textAlign: 'center'
              }}
            >
              {p.value}px
            </button>
          ))}
        </div>
      </div>

      {/* 3. TEXT SIZE (FONT SIZE) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Type size={12} color="#94a3b8" />
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8' }}>
              Text Size
            </span>
          </div>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8' }}>
            {tableFontSize}px
          </span>
        </div>

        {/* Range Slider */}
        <input
          type="range"
          min="10"
          max="18"
          step="1"
          value={tableFontSize}
          onChange={(e) => onSetTableFontSize(Number(e.target.value))}
          style={{
            width: '100%',
            accentColor: '#0071e3',
            cursor: 'pointer',
            height: '4px'
          }}
        />

        {/* Quick Presets */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px', marginTop: '2px' }}>
          {FONT_SIZE_PRESETS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => {
                onSetTableFontSize(p.value);
                onToast(`Text Size: ${p.value}px`, 'info');
              }}
              style={{
                padding: '4px 2px',
                borderRadius: '5px',
                border: tableFontSize === p.value ? '1px solid #0071e3' : '1px solid rgba(255, 255, 255, 0.1)',
                background: tableFontSize === p.value ? 'rgba(0, 113, 227, 0.3)' : 'rgba(255, 255, 255, 0.04)',
                color: tableFontSize === p.value ? '#ffffff' : '#a1a1aa',
                fontSize: '10px',
                fontWeight: tableFontSize === p.value ? 600 : 500,
                cursor: 'pointer',
                textAlign: 'center'
              }}
            >
              {p.value}px
            </button>
          ))}
        </div>
      </div>

      {/* 4. RESET UI DEFAULTS BUTTON */}
      <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <button
          type="button"
          onClick={() => {
            onSetEnterDirection('right');
            onSetRowHeight(28);
            onSetTableFontSize(12);
            localStorage.removeItem('modern_app_enter_dir');
            localStorage.removeItem('modern_app_row_height');
            localStorage.removeItem('modern_app_table_font_size');
            onToast('UI Settings Reset to Default!', 'success');
            onClose();
          }}
          style={{
            width: '100%',
            padding: '7px 10px',
            borderRadius: '7px',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            background: 'rgba(239, 68, 68, 0.12)',
            color: '#fca5a5',
            fontSize: '11px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'all 0.15s ease'
          }}
        >
          <RotateCcw size={12} />
          <span>Reset UI Defaults</span>
        </button>
      </div>

      {/* Footer Info */}
      <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: '9.5px', color: '#71717a', letterSpacing: '0.2px' }}>
          ✓ Settings saved to localStorage automatically
        </span>
      </div>
    </div>
  );
};

import React, { useEffect, useRef } from 'react';
import { 
  CornerDownRight, 
  ArrowDown, 
  ArrowLeft, 
  ArrowUp, 
  X, 
  Check, 
  SlidersHorizontal, 
  Type, 
  Maximize2,
  RotateCcw,
  Keyboard
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

  // Close on Escape key (Shadcn pattern)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
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

  const DIRECTIONS: { key: EnterDirection; label: string; icon: React.ReactNode; hint: string }[] = [
    { key: 'right', label: 'Right', icon: <CornerDownRight size={13} />, hint: '➔ Next Col' },
    { key: 'down', label: 'Down', icon: <ArrowDown size={13} />, hint: '🠗 Next Row' },
    { key: 'left', label: 'Left', icon: <ArrowLeft size={13} />, hint: '🠔 Prev Col' },
    { key: 'up', label: 'Up', icon: <ArrowUp size={13} />, hint: '🠕 Prev Row' },
  ];

  return (
    <div
      ref={panelRef}
      style={{
        position: 'absolute',
        top: 'calc(100% + 6px)',
        [align === 'right' ? 'right' : 'left']: 0,
        width: '300px',
        backgroundColor: '#09090b',
        border: '1px solid #27272a',
        borderRadius: '8px',
        padding: '16px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.7), 0 8px 10px -6px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.05)',
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        color: '#fafafa',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        animation: 'shadcnPop 0.15s cubic-bezier(0.16, 1, 0.3, 1) forwards'
      }}
    >
      <style>{`
        @keyframes shadcnPop {
          from { opacity: 0; transform: scale(0.96) translateY(-4px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .shadcn-slider {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 5px;
          background: #27272a;
          border-radius: 9999px;
          outline: none;
          transition: background 0.15s;
        }
        .shadcn-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 15px;
          height: 15px;
          border-radius: 50%;
          background: #fafafa;
          cursor: pointer;
          border: 2px solid #09090b;
          box-shadow: 0 1px 3px rgba(0,0,0,0.5);
          transition: transform 0.1s;
        }
        .shadcn-slider::-webkit-slider-thumb:hover {
          transform: scale(1.15);
        }
      `}</style>

      {/* Header (Shadcn Card / Dialog Title Style) */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid #27272a' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <SlidersHorizontal size={14} className="text-zinc-400" color="#a1a1aa" />
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#fafafa', letterSpacing: '-0.01em' }}>
              Table Settings
            </span>
          </div>
          <div style={{ fontSize: '11px', color: '#71717a', marginTop: '2px' }}>
            Configure grid navigation & display size
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          style={{
            background: 'transparent',
            border: 'none',
            color: '#71717a',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'color 0.15s, background-color 0.15s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#fafafa';
            e.currentTarget.style.backgroundColor = '#27272a';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#71717a';
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <X size={14} />
        </button>
      </div>

      {/* 1. ENTER JUMP DIRECTION (Shadcn Segmented Control / Grid) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <label style={{ fontSize: '11px', fontWeight: 500, color: '#a1a1aa', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Keyboard size={12} color="#71717a" />
            <span>Enter Jump Direction</span>
          </label>
          <span style={{ 
            fontSize: '10px', 
            fontWeight: 600, 
            padding: '1px 6px', 
            borderRadius: '4px', 
            background: '#18181b', 
            border: '1px solid #27272a',
            color: '#fafafa',
            textTransform: 'uppercase'
          }}>
            {enterDirection}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
          {DIRECTIONS.map((dir) => {
            const isActive = enterDirection === dir.key;
            return (
              <button
                key={dir.key}
                type="button"
                onClick={() => {
                  onSetEnterDirection(dir.key);
                  onToast(`Enter Direction: ${dir.label.toUpperCase()}`, 'info');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '7px 9px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: isActive ? 600 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
                  background: isActive ? '#fafafa' : '#18181b',
                  color: isActive ? '#09090b' : '#a1a1aa',
                  border: isActive ? '1px solid #fafafa' : '1px solid #27272a',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.borderColor = '#3f3f46';
                    e.currentTarget.style.color = '#fafafa';
                    e.currentTarget.style.backgroundColor = '#27272a';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.borderColor = '#27272a';
                    e.currentTarget.style.color = '#a1a1aa';
                    e.currentTarget.style.backgroundColor = '#18181b';
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ color: isActive ? '#09090b' : '#71717a' }}>{dir.icon}</span>
                  <span>{dir.label}</span>
                </div>
                {isActive && <Check size={12} strokeWidth={2.5} color="#09090b" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. ROW HEIGHT (Shadcn Slider & Badge Pills) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '10px', borderTop: '1px solid #18181b' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <label style={{ fontSize: '11px', fontWeight: 500, color: '#a1a1aa', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Maximize2 size={12} color="#71717a" />
            <span>Row Height</span>
          </label>
          <span style={{ 
            fontSize: '11px', 
            fontWeight: 600, 
            padding: '1px 6px', 
            borderRadius: '4px', 
            background: '#18181b', 
            border: '1px solid #27272a',
            color: '#fafafa'
          }}>
            {rowHeight}px
          </span>
        </div>

        <input
          type="range"
          min="22"
          max="50"
          step="2"
          value={rowHeight}
          onChange={(e) => onSetRowHeight(Number(e.target.value))}
          className="shadcn-slider"
        />

        {/* Preset Badges */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px', marginTop: '2px' }}>
          {ROW_HEIGHT_PRESETS.map((p) => {
            const isSelected = rowHeight === p.value;
            return (
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
                  border: isSelected ? '1px solid #fafafa' : '1px solid #27272a',
                  background: isSelected ? '#fafafa' : '#18181b',
                  color: isSelected ? '#09090b' : '#71717a',
                  fontSize: '10px',
                  fontWeight: isSelected ? 600 : 500,
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.borderColor = '#3f3f46';
                    e.currentTarget.style.color = '#fafafa';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.borderColor = '#27272a';
                    e.currentTarget.style.color = '#71717a';
                  }
                }}
              >
                {p.value}px
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. FONT SIZE (Shadcn Slider & Badge Pills) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '10px', borderTop: '1px solid #18181b' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <label style={{ fontSize: '11px', fontWeight: 500, color: '#a1a1aa', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Type size={12} color="#71717a" />
            <span>Table Text Size</span>
          </label>
          <span style={{ 
            fontSize: '11px', 
            fontWeight: 600, 
            padding: '1px 6px', 
            borderRadius: '4px', 
            background: '#18181b', 
            border: '1px solid #27272a',
            color: '#fafafa'
          }}>
            {tableFontSize}px
          </span>
        </div>

        <input
          type="range"
          min="10"
          max="18"
          step="1"
          value={tableFontSize}
          onChange={(e) => onSetTableFontSize(Number(e.target.value))}
          className="shadcn-slider"
        />

        {/* Preset Badges */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px', marginTop: '2px' }}>
          {FONT_SIZE_PRESETS.map((p) => {
            const isSelected = tableFontSize === p.value;
            return (
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
                  border: isSelected ? '1px solid #fafafa' : '1px solid #27272a',
                  background: isSelected ? '#fafafa' : '#18181b',
                  color: isSelected ? '#09090b' : '#71717a',
                  fontSize: '10px',
                  fontWeight: isSelected ? 600 : 500,
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.borderColor = '#3f3f46';
                    e.currentTarget.style.color = '#fafafa';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.borderColor = '#27272a';
                    e.currentTarget.style.color = '#71717a';
                  }
                }}
              >
                {p.value}px
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. RESET BUTTON (Shadcn Ghost / Destructive Outline) */}
      <div style={{ paddingTop: '10px', borderTop: '1px solid #18181b' }}>
        <button
          type="button"
          onClick={() => {
            onSetEnterDirection('right');
            onSetRowHeight(28);
            onSetTableFontSize(12);
            localStorage.removeItem('modern_app_enter_dir');
            localStorage.removeItem('modern_app_row_height');
            localStorage.removeItem('modern_app_table_font_size');
            onToast('Settings reset to defaults', 'info');
            onClose();
          }}
          style={{
            width: '100%',
            padding: '7px 10px',
            borderRadius: '6px',
            border: '1px solid #27272a',
            background: 'transparent',
            color: '#a1a1aa',
            fontSize: '11px',
            fontWeight: 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#ef4444';
            e.currentTarget.style.borderColor = '#7f1d1d';
            e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.08)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#a1a1aa';
            e.currentTarget.style.borderColor = '#27272a';
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <RotateCcw size={12} />
          <span>Reset to Defaults</span>
        </button>
      </div>

      {/* Footer Info (Shadcn Subtle Keyboard Hint) */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '4px', fontSize: '10px', color: '#52525b' }}>
        <span>Auto-saved to localStorage</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
          <kbd style={{ 
            padding: '1px 4px', 
            borderRadius: '3px', 
            background: '#18181b', 
            border: '1px solid #27272a', 
            color: '#a1a1aa',
            fontSize: '9px',
            fontFamily: 'monospace'
          }}>ESC</kbd>
          <span>to close</span>
        </span>
      </div>
    </div>
  );
};

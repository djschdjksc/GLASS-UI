import React, { useState, useEffect, useMemo } from 'react';
import {
  Keyboard as KeyboardIcon,
  Search,
  Sparkles,
  Zap,
  Grid,
  Printer,
  FileText,
  Sliders,
  CheckCircle2,
  Info,
  Layers,
  ArrowRight,
  RotateCcw,
  Volume2
} from 'lucide-react';
import { macAudio } from '../utils/macAudio';

export interface ShortcutItem {
  id: string;
  name: string;
  keys: string[]; // e.g. ['CTRL', 'ALT', 'P']
  category: 'general' | 'billing' | 'grid' | 'numpad';
  description: string;
  highlightKeys: string[]; // normalized key ids
}

export const SYSTEM_SHORTCUTS: ShortcutItem[] = [
  // --- GENERAL ---
  {
    id: 'filter',
    name: 'Filter & Search',
    keys: ['CTRL', '+', 'F'],
    category: 'general',
    description: 'Instant search across Parties, Invoices, and Item catalogues',
    highlightKeys: ['ctrl_l', 'ctrl_r', 'f']
  },
  {
    id: 'rename',
    name: 'Rename / Edit Cell',
    keys: ['F2'],
    category: 'general',
    description: 'Direct in-place text editing of selected row or cell',
    highlightKeys: ['f2']
  },
  {
    id: 'delete_cell',
    name: 'Clear Cell Value',
    keys: ['Delete'],
    category: 'general',
    description: 'Excel-style clear of current cell value without removing row',
    highlightKeys: ['delete']
  },
  {
    id: 'delete_draft',
    name: 'Delete Row / Draft',
    keys: ['CTRL', '+', 'ALT', '+', 'D'],
    category: 'general',
    description: 'Discard active draft or completely remove highlighted line item',
    highlightKeys: ['ctrl_l', 'ctrl_r', 'alt_l', 'alt_r', 'd']
  },
  {
    id: 'undo',
    name: 'Undo Last Action',
    keys: ['CTRL', '+', 'Z'],
    category: 'general',
    description: 'Revert last transaction, row modification, or input edit',
    highlightKeys: ['ctrl_l', 'ctrl_r', 'z']
  },
  {
    id: 'redo',
    name: 'Redo Action',
    keys: ['CTRL', '+', 'Y'],
    category: 'general',
    description: 'Reapply previously undone modification or entry',
    highlightKeys: ['ctrl_l', 'ctrl_r', 'y']
  },
  {
    id: 'close_modal',
    name: 'Close Window / Escape',
    keys: ['Esc'],
    category: 'general',
    description: 'Close active popups, clear selection, or dismiss modals',
    highlightKeys: ['esc']
  },
  {
    id: 'fullscreen',
    name: 'Toggle Fullscreen',
    keys: ['F11'],
    category: 'general',
    description: 'Toggle borderless accounting desk view',
    highlightKeys: ['f11']
  },

  // --- INFO PANEL & BILLING (MATCHING SCREENSHOT) ---
  {
    id: 'publish',
    name: 'Publish & Finalize',
    keys: ['CTRL', '+', 'ALT', '+', 'P'],
    category: 'billing',
    description: 'Lock invoice, issue official token, and commit to local ledger',
    highlightKeys: ['ctrl_l', 'ctrl_r', 'alt_l', 'alt_r', 'p']
  },
  {
    id: 'preview_modes',
    name: 'Preview Zoom Modes',
    keys: ['F6 .. F8'],
    category: 'billing',
    description: 'Toggle Fit-Width, 1:1 Actual Paper Size, and 2-Page spreads',
    highlightKeys: ['f6', 'f7', 'f8']
  },
  {
    id: 'zoom_in',
    name: 'Zoom In Preview',
    keys: ["'+'"],
    category: 'billing',
    description: 'Magnify voucher preview for high-precision inspection',
    highlightKeys: ['equal', 'num_plus']
  },
  {
    id: 'zoom_out',
    name: 'Zoom Out Preview',
    keys: ["'-'"],
    category: 'billing',
    description: 'Zoom out to see overall page margins and layout',
    highlightKeys: ['minus', 'num_minus']
  },
  {
    id: 'actual_size',
    name: '1:1 Actual Scale',
    keys: ['CTRL', '+', '0'],
    category: 'billing',
    description: 'Reset preview to 100% 1:1 millimetric paper scale',
    highlightKeys: ['ctrl_l', 'ctrl_r', '0', 'num_0']
  },
  {
    id: 'print_native',
    name: 'High-Speed Print',
    keys: ['CTRL', '+', 'P'],
    category: 'billing',
    description: 'High-speed PyQt6 vector printing bypassing browser dialog',
    highlightKeys: ['ctrl_l', 'ctrl_r', 'p']
  },
  {
    id: 'save_bill',
    name: 'Save Voucher (SQLite)',
    keys: ['CTRL', '+', 'S'],
    category: 'billing',
    description: 'Instant save into SQLite USB database (port 5006)',
    highlightKeys: ['ctrl_l', 'ctrl_r', 's']
  },

  // --- OUTLINE & DATA ENTRY ---
  {
    id: 'outline_show',
    name: 'Show / Hide Outline',
    keys: ['CTRL', '+', 'O'],
    category: 'grid',
    description: 'Toggle sidebar drawers, ledger stack, and summary rails',
    highlightKeys: ['ctrl_l', 'ctrl_r', 'o']
  },
  {
    id: 'expand_section',
    name: 'Expand Section',
    keys: ['Right'],
    category: 'grid',
    description: 'Expand active transaction group or mould card details',
    highlightKeys: ['right']
  },
  {
    id: 'collapse_section',
    name: 'Collapse Section',
    keys: ['Left'],
    category: 'grid',
    description: 'Collapse active transaction group or return to root',
    highlightKeys: ['left']
  },
  {
    id: 'move_up',
    name: 'Move Selection Up',
    keys: ['Up'],
    category: 'grid',
    description: 'Move focused cursor or table row selection upwards',
    highlightKeys: ['up']
  },
  {
    id: 'move_down',
    name: 'Move Selection Down',
    keys: ['Down'],
    category: 'grid',
    description: 'Move focused cursor or table row selection downwards',
    highlightKeys: ['down']
  },
  {
    id: 'enter_tally',
    name: 'Tally Enter Flow',
    keys: ['Enter'],
    category: 'grid',
    description: 'Step horizontally through cells, then auto-wrap to next row',
    highlightKeys: ['return', 'num_enter']
  },
  {
    id: 'copy_above',
    name: 'Quick-Copy From Above',
    keys: ['0', '+', 'Enter'],
    category: 'grid',
    description: 'Duplicate quantity or weight from row directly above',
    highlightKeys: ['0', 'num_0', 'return', 'num_enter']
  },
  {
    id: 'numpad_dot',
    name: "NumPad '.' Navigator",
    keys: ['.', '(Del)'],
    category: 'numpad',
    description: 'Single-key rapid UI navigator: 1-6 zones, 1-9 targets',
    highlightKeys: ['dot', 'num_dot']
  }
];

interface KeyDef {
  id: string;
  label: string;
  sub?: string;
  flex?: number; // relative width weight
  isPill?: boolean;
  accent?: boolean;
  gridRow?: string;
  gridCol?: string;
}

export const KeyboardShortcutsVisualizer: React.FC = () => {
  const [activeShortcutId, setActiveShortcutId] = useState<string>('publish');
  const [pressedPhysicalKeys, setPressedPhysicalKeys] = useState<Set<string>>(new Set());
  const [hoveredKeyId, setHoveredKeyId] = useState<string | null>(null);

  // Active shortcut item
  const currentShortcut = useMemo(() => {
    return SYSTEM_SHORTCUTS.find(s => s.id === activeShortcutId) || SYSTEM_SHORTCUTS[0];
  }, [activeShortcutId]);

  // Keys to highlight on the virtual keyboard
  const highlightedKeyIds = useMemo(() => {
    const set = new Set<string>();

    if (currentShortcut) {
      currentShortcut.highlightKeys.forEach(k => set.add(k));
    }
    pressedPhysicalKeys.forEach(k => set.add(k));
    if (hoveredKeyId) {
      set.add(hoveredKeyId);
    }
    return set;
  }, [currentShortcut, pressedPhysicalKeys, hoveredKeyId]);

  // Handle Physical Keyboard Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const code = e.code.toLowerCase();
      let keyId = '';

      if (code === 'escape') keyId = 'esc';
      else if (code.startsWith('f') && !isNaN(Number(code.slice(1)))) keyId = code;
      else if (code === 'backquote') keyId = 'tilde';
      else if (code.startsWith('digit')) keyId = code.replace('digit', '');
      else if (code === 'minus') keyId = 'minus';
      else if (code === 'equal') keyId = 'equal';
      else if (code === 'backspace') keyId = 'delete';
      else if (code === 'tab') keyId = 'tab';
      else if (code.startsWith('key')) keyId = code.replace('key', '');
      else if (code === 'bracketleft') keyId = 'bracket_l';
      else if (code === 'bracketright') keyId = 'bracket_r';
      else if (code === 'backslash') keyId = 'backslash';
      else if (code === 'capslock') keyId = 'caps';
      else if (code === 'semicolon') keyId = 'semicolon';
      else if (code === 'quote') keyId = 'quote';
      else if (code === 'enter') keyId = 'return';
      else if (code === 'shiftleft') keyId = 'shift_l';
      else if (code === 'shiftright') keyId = 'shift_r';
      else if (code === 'comma') keyId = 'comma';
      else if (code === 'period') keyId = 'dot';
      else if (code === 'slash') keyId = 'slash';
      else if (code === 'arrowup') keyId = 'up';
      else if (code === 'arrowdown') keyId = 'down';
      else if (code === 'arrowleft') keyId = 'left';
      else if (code === 'arrowright') keyId = 'right';
      else if (code === 'controlleft') keyId = 'ctrl_l';
      else if (code === 'controlright') keyId = 'ctrl_r';
      else if (code === 'altleft') keyId = 'alt_l';
      else if (code === 'altright') keyId = 'alt_r';
      else if (code === 'space') keyId = 'space';
      // NumPad physical codes
      else if (code.startsWith('numpad')) {
        const sub = code.replace('numpad', '');
        if (!isNaN(Number(sub))) keyId = 'num_' + sub;
        else if (sub === 'decimal') keyId = 'num_dot';
        else if (sub === 'enter') keyId = 'num_enter';
        else if (sub === 'add') keyId = 'num_plus';
        else if (sub === 'subtract') keyId = 'num_minus';
        else if (sub === 'multiply') keyId = 'num_star';
        else if (sub === 'divide') keyId = 'num_slash';
      }

      if (keyId) {
        setPressedPhysicalKeys(prev => {
          const next = new Set(prev);
          next.add(keyId);
          return next;
        });
        macAudio.playClick();

        const matched = SYSTEM_SHORTCUTS.find(s => s.highlightKeys.includes(keyId));
        if (matched) {
          setActiveShortcutId(matched.id);
        }
      }
    };

    const handleKeyUp = () => {
      setPressedPhysicalKeys(new Set());
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Standard QWERTY 60%/75% Keys Rows
  const row0: KeyDef[] = [
    { id: 'esc', label: 'esc', flex: 1.4, accent: true },
    { id: 'f1', label: 'F1', accent: true },
    { id: 'f2', label: 'F2', accent: true },
    { id: 'f3', label: 'F3', accent: true },
    { id: 'f4', label: 'F4', accent: true },
    { id: 'f5', label: 'F5', accent: true },
    { id: 'f6', label: 'F6', accent: true },
    { id: 'f7', label: 'F7', accent: true },
    { id: 'f8', label: 'F8', accent: true },
    { id: 'f9', label: 'F9', accent: true },
    { id: 'f10', label: 'F10', accent: true },
    { id: 'f11', label: 'F11', accent: true },
    { id: 'f12', label: 'F12', accent: true },
    { id: 'f13', label: 'F13', flex: 1.2, accent: true }
  ];

  const row1: KeyDef[] = [
    { id: 'tilde', label: '`', sub: '~' },
    { id: '1', label: '1', sub: '!' },
    { id: '2', label: '2', sub: '@' },
    { id: '3', label: '3', sub: '#' },
    { id: '4', label: '4', sub: '$' },
    { id: '5', label: '5', sub: '%' },
    { id: '6', label: '6', sub: '^' },
    { id: '7', label: '7', sub: '&' },
    { id: '8', label: '8', sub: '*' },
    { id: '9', label: '9', sub: '(' },
    { id: '0', label: '0', sub: ')' },
    { id: 'minus', label: '-', sub: '_' },
    { id: 'equal', label: '=', sub: '+' },
    { id: 'delete', label: 'delete', flex: 1.6, isPill: true, accent: true }
  ];

  const row2: KeyDef[] = [
    { id: 'tab', label: 'tab', flex: 1.5, isPill: true },
    { id: 'q', label: 'Q' },
    { id: 'w', label: 'W' },
    { id: 'e', label: 'E' },
    { id: 'r', label: 'R' },
    { id: 't', label: 'T' },
    { id: 'y', label: 'Y' },
    { id: 'u', label: 'U' },
    { id: 'i', label: 'I' },
    { id: 'o', label: 'O' },
    { id: 'p', label: 'P' },
    { id: 'bracket_l', label: '[', sub: '{' },
    { id: 'bracket_r', label: ']', sub: '}' },
    { id: 'backslash', label: '\\', sub: '|', flex: 1.1 }
  ];

  const row3: KeyDef[] = [
    { id: 'caps', label: 'caps lock', flex: 1.8, isPill: true },
    { id: 'a', label: 'A' },
    { id: 's', label: 'S' },
    { id: 'd', label: 'D' },
    { id: 'f', label: 'F' },
    { id: 'g', label: 'G' },
    { id: 'h', label: 'H' },
    { id: 'j', label: 'J' },
    { id: 'k', label: 'K' },
    { id: 'l', label: 'L' },
    { id: 'semicolon', label: ';', sub: ':' },
    { id: 'quote', label: "'", sub: '"' },
    { id: 'return', label: 'return', flex: 1.8, isPill: true }
  ];

  const row4: KeyDef[] = [
    { id: 'shift_l', label: 'shift', flex: 2.2, isPill: true },
    { id: 'z', label: 'Z' },
    { id: 'x', label: 'X' },
    { id: 'c', label: 'C' },
    { id: 'v', label: 'V' },
    { id: 'b', label: 'B' },
    { id: 'n', label: 'N' },
    { id: 'm', label: 'M' },
    { id: 'comma', label: ',', sub: '<' },
    { id: 'dot', label: '.', sub: '>' },
    { id: 'slash', label: '/', sub: '?' },
    { id: 'shift_r', label: 'shift', flex: 1.5, isPill: true, accent: true },
    { id: 'up', label: '↑', flex: 1, isPill: true, accent: true }
  ];

  const row5: KeyDef[] = [
    { id: 'ctrl_l', label: 'Ctrl', flex: 1.6, isPill: true },
    { id: 'alt_l', label: 'Alt', flex: 1.3, isPill: true },
    { id: 'space', label: '', flex: 7.0 },
    { id: 'alt_r', label: 'Alt', flex: 1.3, isPill: true },
    { id: 'ctrl_r', label: 'Ctrl', flex: 1.3, isPill: true },
    { id: 'left', label: '←', flex: 1, isPill: true, accent: true },
    { id: 'down', label: '↓', flex: 1, isPill: true, accent: true },
    { id: 'right', label: '→', flex: 1, isPill: true, accent: true }
  ];

  // Standard 6-Row Accounting NumPad Cluster with SINGLE tall '+' and SINGLE tall 'Enter' key
  const numpadKeys: KeyDef[] = [
    // Row 0 (matches F-Keys row): Utility row
    { id: 'num_esc', label: 'Esc', accent: true },
    { id: 'num_tab', label: 'Tab', accent: true },
    { id: 'num_bksp', label: '⌫', accent: true },
    { id: 'num_clear', label: 'Clear', accent: true },

    // Row 1 (matches 1-0 Number row): Operator row
    { id: 'num_lock', label: 'Num', accent: true },
    { id: 'num_slash', label: '/', accent: true },
    { id: 'num_star', label: '*', accent: true },
    { id: 'num_minus', label: '-', accent: true },

    // Row 2 (matches QWERTY row): 7 8 9 + (Tall + key spans Row 2 & 3!)
    { id: 'num_7', label: '7', sub: 'Home' },
    { id: 'num_8', label: '8', sub: '▲' },
    { id: 'num_9', label: '9', sub: 'PgUp' },
    { id: 'num_plus', label: '+', gridRow: 'span 2', accent: true }, // SINGLE TALL 2U KEY (covers 2 rows)

    // Row 3 (matches Home row): 4 5 6 (4th col is +)
    { id: 'num_4', label: '4', sub: '◄' },
    { id: 'num_5', label: '5', sub: '●' },
    { id: 'num_6', label: '6', sub: '►' },

    // Row 4 (matches Shift row): 1 2 3 ↵ (Tall Enter key spans Row 4 & 5!)
    { id: 'num_1', label: '1', sub: 'End' },
    { id: 'num_2', label: '2', sub: '▼' },
    { id: 'num_3', label: '3', sub: 'PgDn' },
    { id: 'num_enter', label: '↵', gridRow: 'span 2', isPill: true }, // SINGLE TALL 2U KEY (covers 2 rows)

    // Row 5 (matches Spacebar row): 0 (wide 2 cols) . (4th col is ↵ Enter)
    { id: 'num_0', label: '0', sub: 'Ins', gridCol: 'span 2' }, // WIDE 2U KEY (covers 2 columns)
    { id: 'num_dot', label: '.', sub: 'Del', accent: true }
  ];

  // Responsive Key Renderer (fluid flex width and clean height)
  const renderKey = (k: KeyDef, isNumPad = false) => {
    const isHighlighted = highlightedKeyIds.has(k.id);
    const isPhysicalPressed = pressedPhysicalKeys.has(k.id);

    return (
      <div
        key={k.id}
        onMouseEnter={() => {
          setHoveredKeyId(k.id);
          macAudio.playHover();
        }}
        onMouseLeave={() => setHoveredKeyId(null)}
        onClick={() => {
          macAudio.playClick();
          const match = SYSTEM_SHORTCUTS.find(s => s.highlightKeys.includes(k.id));
          if (match) setActiveShortcutId(match.id);
        }}
        style={{
          flex: isNumPad ? undefined : (k.flex || 1),
          gridRow: k.gridRow,
          gridColumn: k.gridCol,
          height: isNumPad && k.gridRow ? '100%' : '34px',
          margin: 0,
          borderRadius: k.isPill ? '6px' : '5px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          userSelect: 'none',
          cursor: 'pointer',
          position: 'relative',
          transition: 'all 0.12s cubic-bezier(0.16, 1, 0.3, 1)',
          // Highlighting: active key turns solid Apple emerald green (#22c55e)
          background: isHighlighted
            ? '#22c55e'
            : k.accent
            ? '#dcfce7'
            : '#ffffff',
          color: isHighlighted ? '#ffffff' : k.accent ? '#166534' : '#1e293b',
          border: isHighlighted
            ? '1.5px solid #16a34a'
            : k.accent
            ? '1px solid #bbf7d0'
            : '1px solid #cbd5e1',
          boxShadow: isPhysicalPressed
            ? '0 1px 0 rgba(0,0,0,0.3) inset'
            : isHighlighted
            ? '0 0 16px rgba(34, 197, 94, 0.75), 0 2.5px 0 #15803d, 0 3px 6px rgba(0,0,0,0.12)'
            : '0 2px 0 #94a3b8, 0 2px 4px rgba(0,0,0,0.06)',
          transform: isPhysicalPressed
            ? 'translateY(1.5px)'
            : isHighlighted
            ? 'translateY(-1px) scale(1.02)'
            : 'none',
          zIndex: isHighlighted ? 10 : 1
        }}
      >
        {k.sub && (
          <span
            style={{
              fontSize: '8px',
              lineHeight: '9px',
              fontWeight: 600,
              opacity: isHighlighted ? 0.9 : 0.65,
              marginBottom: '-1px'
            }}
          >
            {k.sub}
          </span>
        )}
        <span
          style={{
            fontSize: k.gridRow
              ? '16px'
              : k.label.length > 4
              ? '8.5px'
              : k.label.length > 2
              ? '9.5px'
              : '11px',
            fontWeight: isHighlighted ? 800 : 700,
            lineHeight: '12px',
            letterSpacing: '0.2px'
          }}
        >
          {k.label}
        </span>
      </div>
    );
  };

  // Tactile 3D Keycap Badges Renderer (Matching Aceternity & Skeuomorphic Button Styles)
  const renderShortcutKeys = (keys: string[], isSelected: boolean) => {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
        {keys.map((k, idx) => {
          if (k === '+') {
            return (
              <span
                key={idx}
                style={{
                  fontSize: '10px',
                  fontWeight: 800,
                  color: isSelected ? 'rgba(255, 255, 255, 0.85)' : '#64748b',
                  padding: '0 1px',
                  userSelect: 'none'
                }}
              >
                +
              </span>
            );
          }
          return (
            <span
              key={idx}
              className={`tactile-key-btn ${isSelected ? 'active' : ''}`}
            >
              {k}
            </span>
          );
        })}
      </div>
    );
  };

  // 3-Column Shortcuts matching reference image
  const generalShortcuts = useMemo(() => SYSTEM_SHORTCUTS.filter(s => s.category === 'general'), []);
  const billingShortcuts = useMemo(() => SYSTEM_SHORTCUTS.filter(s => s.category === 'billing'), []);
  const outlineShortcuts = useMemo(() => SYSTEM_SHORTCUTS.filter(s => s.category === 'grid' || s.category === 'numpad'), []);

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        minHeight: 0,
        overflowY: 'auto',
        padding: '8px 16px',
        gap: '12px'
      }}
    >
      {/* ========================================================================= */}
      {/* FULL-SCREEN CARD CONTAINER: ADAPTS 100% FLUIDLY TO USER'S MONITOR SIZE    */}
      {/* ========================================================================= */}
      <div
        style={{
          width: '100%',
          flex: 1,
          background: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 16px 40px rgba(0, 0, 0, 0.16), 0 2px 8px rgba(0,0,0,0.06)',
          border: '1px solid rgba(226, 232, 240, 0.9)',
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          minHeight: 0
        }}
      >
        {/* Card Header: Title & Active Shortcut Status Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #f1f5f9',
            paddingBottom: '8px',
            flexShrink: 0
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
              Keyboard Shortcuts
            </span>
            <span style={{ fontSize: '11px', color: '#64748b' }}>
              • Standard Keyboard & NumPad (Full-Screen Responsive Engine)
            </span>
          </div>

          {currentShortcut && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(34, 197, 94, 0.12)',
                border: '1px solid rgba(34, 197, 94, 0.35)',
                padding: '3px 12px',
                borderRadius: '16px'
              }}
            >
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#15803d' }}>
                {currentShortcut.name}:
              </span>
              {renderShortcutKeys(currentShortcut.keys, true)}
            </div>
          )}
        </div>

        {/* Global Styles for 3D Skeuomorphic Tactile Keys (Matching User Component) */}
        <style>{`
          .tactile-key-btn {
            text-decoration: none;
            border: none;
            outline: none;
            background: #1e293b;
            padding: 2px 7px;
            min-width: 22px;
            height: 22px;
            box-shadow: 0 0 5px rgba(0,0,0,0.35), 2px 2px 3px rgba(0,0,0,0.47), inset 1px 1px 2px rgba(255,255,255,0.5);
            border-radius: 6px;
            color: #fff;
            font-size: 10px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.15s ease;
            font-family: system-ui, -apple-system, sans-serif;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            user-select: none;
          }
          .tactile-key-btn:hover {
            transform: translateY(-1px);
            box-shadow: 0 0 6px rgba(0,0,0,0.45), 2px 3px 4px rgba(0,0,0,0.55), inset 1px 1px 2px rgba(255,255,255,0.7);
          }
          .tactile-key-btn:active {
            transform: scale(0.95);
            box-shadow: 0 0 4px rgba(0,0,0,0.6), inset 0 0 3px rgba(255,255,255,0.6);
          }
          .tactile-key-btn.active {
            background: #15803d;
            box-shadow: 0 0 5px rgba(0,0,0,0.3), 2px 2px 3px rgba(0,0,0,0.4), inset 1px 1px 2px rgba(255,255,255,0.7);
            border: 1px solid rgba(255,255,255,0.3);
          }
          .tactile-shortcut-row {
            transition: all 0.15s ease;
          }
          .tactile-shortcut-row.selected {
            box-shadow: 3px 4px 12px rgba(34, 197, 94, 0.4),
              inset 3px 0 0 rgba(21, 128, 61, 0.9),
              inset -3px 0 0 rgba(21, 128, 61, 0.9),
              inset 0 2px 0 rgba(255, 255, 255, 0.35),
              inset 0 -2px 0 rgba(0, 0, 0, 0.18) !important;
          }
        `}</style>

        {/* ========================================================================= */}
        {/* UPPER SECTION: BOTH KEYBOARDS SIDE-BY-SIDE (FLUID FULL-WIDTH RESPONSIVE)  */}
        {/* ========================================================================= */}
        <div
          style={{
            width: '100%',
            background: '#f8fafc',
            border: '1.5px solid #e2e8f0',
            borderRadius: '12px',
            padding: '10px',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.04)',
            display: 'flex',
            gap: '14px',
            alignItems: 'stretch',
            flexShrink: 0
          }}
        >
          {/* 1. LEFT SIDE: STANDARD 60%/75% KEYBOARD (FLUID FLEX EXPANDING) */}
          <div style={{ flex: 3.5, display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
            {/* Row 0: Function Keys */}
            <div style={{ display: 'flex', width: '100%', gap: '4px' }}>
              {row0.map(k => renderKey(k))}
            </div>

            {/* Row 1: Numbers & Delete */}
            <div style={{ display: 'flex', width: '100%', gap: '4px' }}>
              {row1.map(k => renderKey(k))}
            </div>

            {/* Row 2: QWERTY */}
            <div style={{ display: 'flex', width: '100%', gap: '4px' }}>
              {row2.map(k => renderKey(k))}
            </div>

            {/* Row 3: Home Row */}
            <div style={{ display: 'flex', width: '100%', gap: '4px' }}>
              {row3.map(k => renderKey(k))}
            </div>

            {/* Row 4: Shift Row */}
            <div style={{ display: 'flex', width: '100%', gap: '4px' }}>
              {row4.map(k => renderKey(k))}
            </div>

            {/* Row 5: Space & Modifiers & Arrows */}
            <div style={{ display: 'flex', width: '100%', gap: '4px' }}>
              {row5.map(k => renderKey(k))}
            </div>
          </div>

          {/* VERTICAL DIVIDER */}
          <div
            style={{
              width: '1px',
              background: '#e2e8f0',
              margin: '0 2px'
            }}
          />

          {/* 2. RIGHT SIDE: ACCOUNTING NUMPAD CLUSTER (SINGLE TALL '+' & SINGLE TALL 'ENTER') */}
          <div
            style={{
              flex: 1.15,
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gridTemplateRows: 'repeat(6, 34px)',
              gap: '4px',
              minWidth: 0
            }}
          >
            {numpadKeys.map(k => renderKey(k, true))}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* LOWER SECTION: 3 FULL-WIDTH COLUMNS OF SHORTCUTS (MATCHING IMAGE)         */}
        {/* ========================================================================= */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '20px',
            alignItems: 'start',
            width: '100%',
            flex: 1
          }}
        >
          {/* Column 1: General */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              background: '#f8fafc',
              padding: '12px',
              borderRadius: '10px',
              border: '1px solid #f1f5f9'
            }}
          >
            <div
              style={{
                fontSize: '12.5px',
                fontWeight: 700,
                color: '#475569',
                paddingBottom: '6px',
                marginBottom: '4px',
                borderBottom: '1.5px solid #e2e8f0'
              }}
            >
              General
            </div>
            {generalShortcuts.map(s => {
              const isSelected = activeShortcutId === s.id;
              return (
                <div
                  key={s.id}
                  className={`tactile-shortcut-row ${isSelected ? 'selected' : ''}`}
                  onMouseEnter={() => {
                    setActiveShortcutId(s.id);
                    macAudio.playHover();
                  }}
                  onClick={() => {
                    setActiveShortcutId(s.id);
                    macAudio.playClick();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 10px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.12s ease',
                    background: isSelected ? '#22c55e' : 'transparent',
                    color: isSelected ? '#ffffff' : '#334155'
                  }}
                >
                  <span style={{ fontSize: '11px', fontWeight: isSelected ? 800 : 600 }}>
                    {s.name}
                  </span>
                  {renderShortcutKeys(s.keys, isSelected)}
                </div>
              );
            })}
          </div>

          {/* Column 2: Info Panel and Viewing Options */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              background: '#f8fafc',
              padding: '12px',
              borderRadius: '10px',
              border: '1px solid #f1f5f9'
            }}
          >
            <div
              style={{
                fontSize: '12.5px',
                fontWeight: 700,
                color: '#475569',
                paddingBottom: '6px',
                marginBottom: '4px',
                borderBottom: '1.5px solid #e2e8f0'
              }}
            >
              Info Panel and Viewing Options
            </div>
            {billingShortcuts.map(s => {
              const isSelected = activeShortcutId === s.id;
              return (
                <div
                  key={s.id}
                  className={`tactile-shortcut-row ${isSelected ? 'selected' : ''}`}
                  onMouseEnter={() => {
                    setActiveShortcutId(s.id);
                    macAudio.playHover();
                  }}
                  onClick={() => {
                    setActiveShortcutId(s.id);
                    macAudio.playClick();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 10px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.12s ease',
                    background: isSelected ? '#22c55e' : 'transparent',
                    color: isSelected ? '#ffffff' : '#334155'
                  }}
                >
                  <span style={{ fontSize: '11px', fontWeight: isSelected ? 800 : 600 }}>
                    {s.name}
                  </span>
                  {renderShortcutKeys(s.keys, isSelected)}
                </div>
              );
            })}
          </div>

          {/* Column 3: Outline & Data Entry */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              background: '#f8fafc',
              padding: '12px',
              borderRadius: '10px',
              border: '1px solid #f1f5f9'
            }}
          >
            <div
              style={{
                fontSize: '12.5px',
                fontWeight: 700,
                color: '#475569',
                paddingBottom: '6px',
                marginBottom: '4px',
                borderBottom: '1.5px solid #e2e8f0'
              }}
            >
              Outline
            </div>
            {outlineShortcuts.map(s => {
              const isSelected = activeShortcutId === s.id;
              return (
                <div
                  key={s.id}
                  className={`tactile-shortcut-row ${isSelected ? 'selected' : ''}`}
                  onMouseEnter={() => {
                    setActiveShortcutId(s.id);
                    macAudio.playHover();
                  }}
                  onClick={() => {
                    setActiveShortcutId(s.id);
                    macAudio.playClick();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 10px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.12s ease',
                    background: isSelected ? '#22c55e' : 'transparent',
                    color: isSelected ? '#ffffff' : '#334155'
                  }}
                >
                  <span style={{ fontSize: '11px', fontWeight: isSelected ? 800 : 600 }}>
                    {s.name}
                  </span>
                  {renderShortcutKeys(s.keys, isSelected)}
                </div>
              );
            })}
          </div>
        </div>

        {/* Card Footer matching reference image */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '1px solid #f1f5f9',
            paddingTop: '8px',
            flexShrink: 0
          }}
        >
          <span
            onClick={() => {
              macAudio.playClick();
              setActiveShortcutId('publish');
            }}
            style={{
              fontSize: '11px',
              fontWeight: 800,
              color: '#22c55e',
              cursor: 'pointer',
              letterSpacing: '0.3px',
              textTransform: 'uppercase'
            }}
          >
            SHOW ALL SHORTCUTS
          </span>

          <span style={{ fontSize: '10.5px', color: '#94a3b8' }}>
            Hover or click any shortcut to illuminate buttons in green • Physical keyboard typing active
          </span>
        </div>
      </div>
    </div>
  );
};

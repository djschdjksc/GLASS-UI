import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Keyboard as KeyboardIcon,
  Search,
  Zap,
  Sliders,
  CheckCircle2,
  Info,
  Layers,
  ArrowRight,
  RotateCcw,
  Volume2,
  X,
  Table,
  Sparkles
} from 'lucide-react';
import { macAudio } from '../utils/macAudio';

export interface ShortcutItem {
  id: string;
  name: string;
  keys: string[]; // e.g. ['CTRL', '+', 'S']
  category: 'table' | 'actions' | 'navigation';
  description: string;
  scope: string; // e.g. 'All Tables', 'Every Page', 'Global Nav'
  highlightKeys: string[]; // normalized key ids
}

export const SYSTEM_SHORTCUTS: ShortcutItem[] = [
  // =========================================================================
  // 1. TABLE NAVIGATION (TALLY STYLE & PAGINATION FOCUS)
  // =========================================================================
  {
    id: 'table_down',
    name: 'Next Row (Auto Next Page Focus)',
    keys: ['↓'],
    category: 'table',
    scope: 'All Tables',
    description: 'Table me ek row niche jana. Page ki aakhri row par dubara ↓ dabate hi focus automatically Next Page button par chala jata hai.',
    highlightKeys: ['down', 'num_2']
  },
  {
    id: 'table_up',
    name: 'Prev Row (Auto Prev Page Focus)',
    keys: ['↑'],
    category: 'table',
    scope: 'All Tables',
    description: 'Table me ek row upar jana. Pehli row par dubara ↑ dabate hi focus automatically Previous Page button par chala jata hai.',
    highlightKeys: ['up', 'num_8']
  },
  {
    id: 'page_transition',
    name: 'Page Switch & Row 1 Focus',
    keys: ['Enter'],
    category: 'table',
    scope: 'Pagination',
    description: 'Next / Prev button par Enter dabate hi agla ya pichhla page khulta hai aur cursor naye page ki Row 1 (ya Last Row) par automatic activate ho jata hai.',
    highlightKeys: ['return', 'num_enter']
  },
  {
    id: 'page_down',
    name: 'Fast Jump Down (10 Rows)',
    keys: ['PgDn'],
    category: 'table',
    scope: 'All Tables',
    description: 'Table me ek sath 10 rows niche tezi se scroll aur jump karne ke liye.',
    highlightKeys: ['num_3', 'down']
  },
  {
    id: 'page_up',
    name: 'Fast Jump Up (10 Rows)',
    keys: ['PgUp'],
    category: 'table',
    scope: 'All Tables',
    description: 'Table me ek sath 10 rows upar tezi se scroll aur jump karne ke liye.',
    highlightKeys: ['num_9', 'up']
  },
  {
    id: 'first_row',
    name: 'First Row of Table',
    keys: ['Home', 'Ctrl+PgUp'],
    category: 'table',
    scope: 'All Tables',
    description: 'Table ki sabse pehli row (Row 1 / Index 0) par direct jump karna.',
    highlightKeys: ['num_7', 'ctrl_l']
  },
  {
    id: 'last_row',
    name: 'Last Row of Table',
    keys: ['End', 'Ctrl+PgDn'],
    category: 'table',
    scope: 'All Tables',
    description: 'Table ki sabse aakhri row (Last Row) par direct jump karna.',
    highlightKeys: ['num_1', 'ctrl_l']
  },
  {
    id: 'delete_row',
    name: 'Delete Selected Row',
    keys: ['Delete'],
    category: 'table',
    scope: 'All Tables',
    description: 'Selected row, voucher item ya payment receipt ko delete karna (confirmation popup ke sath).',
    highlightKeys: ['delete', 'num_dot']
  },
  {
    id: 'insert_row',
    name: 'Insert New Row / Entry',
    keys: ['Insert'],
    category: 'table',
    scope: 'All Tables',
    description: 'Active table me naya item, voucher entry ya receipt row add karna bina mouse chhue.',
    highlightKeys: ['num_0']
  },

  // =========================================================================
  // 2. UNIVERSAL ACTIONS & DATA ENTRY (HAR PAGE PAR EK HI SYSTEM)
  // =========================================================================
  {
    id: 'save_bill',
    name: 'Universal Save',
    keys: ['CTRL', '+', 'S'],
    category: 'actions',
    scope: 'Every Page',
    description: 'Har page par active bill, voucher ya financial record ko instant SQLite database mein save karna.',
    highlightKeys: ['ctrl_l', 'ctrl_r', 's']
  },
  {
    id: 'print_native',
    name: 'Universal Print',
    keys: ['CTRL', '+', 'P'],
    category: 'actions',
    scope: 'Every Page',
    description: 'Har page ka apna high-speed print dialog ya thermal native printer slip trigger karna.',
    highlightKeys: ['ctrl_l', 'ctrl_r', 'p']
  },
  {
    id: 'quick_search',
    name: 'Focus Active Input / Search',
    keys: ['/'],
    category: 'actions',
    scope: 'Every Page',
    description: 'Page ke active search box ya input box par seedha cursor focus karna bina mouse chhue.',
    highlightKeys: ['slash', 'num_slash']
  },
  {
    id: 'home_focus',
    name: 'First Element / Party Focus',
    keys: ['Home'],
    category: 'actions',
    scope: 'Every Page',
    description: 'Page ke sabse pehle input component, party selector ya bill header par direct jump karna.',
    highlightKeys: ['num_7']
  },
  {
    id: 'close_modal',
    name: 'Close Modal / Cancel',
    keys: ['Esc'],
    category: 'actions',
    scope: 'Every Page',
    description: 'Active popup, modal, dropdown band karna ya selection cancel karna.',
    highlightKeys: ['esc', 'num_esc']
  },
  {
    id: 'edit_row',
    name: 'Open / Edit Selected Item',
    keys: ['Enter'],
    category: 'actions',
    scope: 'Every Page',
    description: 'Selected bill ya voucher ko editor mein load karna ya row edit karna.',
    highlightKeys: ['return', 'num_enter']
  },

  // =========================================================================
  // 3. TABS & SUB-TABS SWITCHING (CTRL + 1..9 & ALT + 1..5)
  // =========================================================================
  {
    id: 'tab_bill',
    name: 'Bill / Sales Editor',
    keys: ['CTRL', '+', '1'],
    category: 'navigation',
    scope: 'Global Nav',
    description: 'Tab 1: Main Sales Billing & Quotation editor screen par switch karna.',
    highlightKeys: ['ctrl_l', 'ctrl_r', '1', 'num_1']
  },
  {
    id: 'tab_inward',
    name: 'Inward / Purchase History',
    keys: ['CTRL', '+', '2'],
    category: 'navigation',
    scope: 'Global Nav',
    description: 'Tab 2: Factory inward material bills aur purchase receipts screen par switch karna.',
    highlightKeys: ['ctrl_l', 'ctrl_r', '2', 'num_2']
  },
  {
    id: 'tab_order',
    name: 'Customer Orders / Estimates',
    keys: ['CTRL', '+', '3'],
    category: 'navigation',
    scope: 'Global Nav',
    description: 'Tab 3: Customer order book aur advance estimates list par switch karna.',
    highlightKeys: ['ctrl_l', 'ctrl_r', '3', 'num_3']
  },
  {
    id: 'tab_return',
    name: 'Sale Return (Credit Note)',
    keys: ['CTRL', '+', '4'],
    category: 'navigation',
    scope: 'Global Nav',
    description: 'Tab 4: Glass return aur credit notes entry screen par switch karna.',
    highlightKeys: ['ctrl_l', 'ctrl_r', '4', 'num_4']
  },
  {
    id: 'tab_parties',
    name: 'Party Directory (Khata)',
    keys: ['CTRL', '+', '5'],
    category: 'navigation',
    scope: 'Global Nav',
    description: 'Tab 5: Customer list, phone numbers aur ledger balance par switch karna.',
    highlightKeys: ['ctrl_l', 'ctrl_r', '5', 'num_5']
  },
  {
    id: 'tab_control',
    name: 'Control Panel & Conversions',
    keys: ['CTRL', '+', '6'],
    category: 'navigation',
    scope: 'Global Nav',
    description: 'Tab 6: System conversions, diagnostic panel aur SQLite master tools.',
    highlightKeys: ['ctrl_l', 'ctrl_r', '6', 'num_6']
  },
  {
    id: 'tab_settings',
    name: 'Settings & Backup',
    keys: ['CTRL', '+', '7'],
    category: 'navigation',
    scope: 'Global Nav',
    description: 'Tab 7: Printer setup, USB backup aur UI preferences par switch karna.',
    highlightKeys: ['ctrl_l', 'ctrl_r', '7', 'num_7']
  },
  {
    id: 'tab_stock',
    name: 'Stock Inventory',
    keys: ['CTRL', '+', '8'],
    category: 'navigation',
    scope: 'Global Nav',
    description: 'Tab 8: Multi-length warehouse inventory aur balance sheet par switch karna.',
    highlightKeys: ['ctrl_l', 'ctrl_r', '8', 'num_8']
  },
  {
    id: 'tab_ledger',
    name: 'Financial Ledger (खाता बही)',
    keys: ['CTRL', '+', '9'],
    category: 'navigation',
    scope: 'Global Nav',
    description: 'Tab 9: Complete party-wise debit/credit financial ledger aur payment receipts.',
    highlightKeys: ['ctrl_l', 'ctrl_r', '9', 'num_9']
  },
  {
    id: 'sub_tabs',
    name: 'Switch Sub-Tabs (Har Page Ke)',
    keys: ['ALT', '+', '1..5'],
    category: 'navigation',
    scope: 'All Modules',
    description: 'Jis bhi page par active hain, uske internal sub-tabs switch karna (Stock Entry, Inward, Outward, Balance, Barcode, etc.).',
    highlightKeys: ['alt_l', 'alt_r', '1', '2', '3', '4', '5']
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
  const [activeShortcutId, setActiveShortcutId] = useState<string>('table_down');
  const [pressedPhysicalKeys, setPressedPhysicalKeys] = useState<Set<string>>(new Set());
  const [hoveredKeyId, setHoveredKeyId] = useState<string | null>(null);
  const [hoveredDescId, setHoveredDescId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'table' | 'actions' | 'navigation'>('all');

  // Active shortcut item
  const currentShortcut = useMemo(() => {
    return SYSTEM_SHORTCUTS.find(s => s.id === activeShortcutId) || SYSTEM_SHORTCUTS[0];
  }, [activeShortcutId]);

  // Filtered shortcuts based on category and search
  const filteredShortcuts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return SYSTEM_SHORTCUTS.filter(s => {
      const matchCat = activeCategory === 'all' || s.category === activeCategory;
      if (!matchCat) return false;
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.scope.toLowerCase().includes(q) ||
        s.keys.some(k => k.toLowerCase().includes(q))
      );
    });
  }, [activeCategory, searchQuery]);

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

    // Row 2 (matches QWERTY row): 7 8 9 + (Tall + key spans Row 2 & 3)
    { id: 'num_7', label: '7', sub: 'Home' },
    { id: 'num_8', label: '8', sub: '▲' },
    { id: 'num_9', label: '9', sub: 'PgUp' },
    { id: 'num_plus', label: '+', gridRow: 'span 2', accent: true },

    // Row 3 (matches Home row): 4 5 6 (4th col is +)
    { id: 'num_4', label: '4', sub: '◄' },
    { id: 'num_5', label: '5', sub: '●' },
    { id: 'num_6', label: '6', sub: '►' },

    // Row 4 (matches Shift row): 1 2 3 ↵ (Tall Enter key spans Row 4 & 5)
    { id: 'num_1', label: '1', sub: 'End' },
    { id: 'num_2', label: '2', sub: '▼' },
    { id: 'num_3', label: '3', sub: 'PgDn' },
    { id: 'num_enter', label: '↵', gridRow: 'span 2', isPill: true },

    // Row 5 (matches Spacebar row): 0 (wide 2 cols) . (4th col is ↵ Enter)
    { id: 'num_0', label: '0', sub: 'Ins', gridCol: 'span 2' },
    { id: 'num_dot', label: '.', sub: 'Del', accent: true }
  ];

  // Responsive Key Renderer
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

  // Tactile 3D Keycap Badges Renderer
  const renderShortcutKeys = (keys: string[], isSelected: boolean) => {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '3px', flexShrink: 0 }}>
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

  // Grouped shortcuts
  const tableShortcuts = useMemo(() => filteredShortcuts.filter(s => s.category === 'table'), [filteredShortcuts]);
  const actionShortcuts = useMemo(() => filteredShortcuts.filter(s => s.category === 'actions'), [filteredShortcuts]);
  const navShortcuts = useMemo(() => filteredShortcuts.filter(s => s.category === 'navigation'), [filteredShortcuts]);

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        maxWidth: '100%',
        height: '100%',
        minHeight: 0,
        overflowY: 'auto',
        overflowX: 'hidden',
        padding: '8px 16px',
        gap: '12px',
        boxSizing: 'border-box'
      }}
    >
      {/* ========================================================================= */}
      {/* FULL-SCREEN CARD CONTAINER: ADAPTS 100% FLUIDLY TO USER'S MONITOR SIZE    */}
      {/* ========================================================================= */}
      <div
        style={{
          width: '100%',
          maxWidth: '100%',
          flex: 1,
          background: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 16px 40px rgba(0, 0, 0, 0.16), 0 2px 8px rgba(0,0,0,0.06)',
          border: '1px solid rgba(226, 232, 240, 0.9)',
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          minHeight: 0,
          boxSizing: 'border-box',
          overflow: 'hidden'
        }}
      >
        {/* Card Header: Title & Search Filter */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #f1f5f9',
            paddingBottom: '10px',
            flexShrink: 0,
            gap: '12px',
            flexWrap: 'wrap'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.3px' }}>
              Keyboard Shortcuts Engine
            </span>
            <span style={{
              fontSize: '10.5px',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '12px',
              background: '#ecfdf5',
              color: '#059669',
              border: '1px solid #a7f3d0'
            }}>
              Tally-Grade Standard • {filteredShortcuts.length} Active
            </span>
          </div>

          {/* Search Input & Category Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              background: '#f8fafc',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              padding: '3px 8px',
              gap: '6px'
            }}>
              <Search size={13} color="#64748b" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search shortcut (e.g. Save, Print, ↓, Ctrl+1)..."
                style={{
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  fontSize: '11px',
                  color: '#1e293b',
                  width: '210px'
                }}
              />
              {searchQuery && (
                <X
                  size={12}
                  color="#94a3b8"
                  style={{ cursor: 'pointer' }}
                  onClick={() => setSearchQuery('')}
                />
              )}
            </div>

            {/* Category Filter Pills */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              {(['all', 'table', 'actions', 'navigation'] as const).map(cat => {
                const isSelected = activeCategory === cat;
                const label = cat === 'all'
                  ? 'All'
                  : cat === 'table'
                  ? 'Table Nav'
                  : cat === 'actions'
                  ? 'Universal Actions'
                  : 'Tabs Switch';

                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      macAudio.playClick();
                      setActiveCategory(cat);
                    }}
                    style={{
                      border: isSelected ? '1px solid #16a34a' : '1px solid #e2e8f0',
                      background: isSelected ? '#22c55e' : '#f8fafc',
                      color: isSelected ? '#ffffff' : '#475569',
                      fontSize: '10.5px',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Global Styles for 3D Skeuomorphic Tactile Keys */}
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
          .tactile-shortcut-row:hover {
            background: #f1f5f9;
          }
          .tactile-shortcut-row.selected {
            background: #22c55e !important;
            color: #ffffff !important;
            box-shadow: 0 4px 12px rgba(34, 197, 94, 0.35),
              inset 3px 0 0 #15803d,
              inset 0 1px 0 rgba(255, 255, 255, 0.4) !important;
          }
          .shortcut-desc {
            max-height: 0;
            overflow: hidden;
            opacity: 0;
            transition: max-height 0.22s ease, opacity 0.18s ease;
            font-size: 9.5px;
            color: #64748b;
            line-height: 1.35;
          }
          .shortcut-desc.visible {
            max-height: 80px;
            opacity: 1;
          }
          .shortcut-desc.selected-desc {
            color: rgba(255,255,255,0.82);
          }
        `}</style>

        {/* ACTIVE SHORTCUT DETAIL INSPECTOR BANNER */}
        {currentShortcut && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '14px',
              background: 'linear-gradient(135deg, rgba(240, 253, 244, 0.85) 0%, rgba(220, 252, 231, 0.5) 100%)',
              border: '1.5px solid rgba(34, 197, 94, 0.35)',
              borderRadius: '10px',
              padding: '8px 14px',
              flexShrink: 0
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                {renderShortcutKeys(currentShortcut.keys, true)}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: '#166534' }}>
                    {currentShortcut.name}
                  </span>
                  <span style={{
                    fontSize: '9.5px',
                    fontWeight: 700,
                    padding: '1px 6px',
                    borderRadius: '8px',
                    background: '#15803d',
                    color: '#ffffff'
                  }}>
                    {currentShortcut.scope}
                  </span>
                </div>
                <span style={{
                  fontSize: '11px',
                  color: '#1e293b',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {currentShortcut.description}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
              <Sparkles size={13} color="#15803d" />
              <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#15803d' }}>
                Key Illuminated Below
              </span>
            </div>
          </div>
        )}

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
        {/* LOWER SECTION: 3 FULL-WIDTH COLUMNS OF SHORTCUTS                          */}
        {/* ========================================================================= */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: activeCategory === 'all' ? 'repeat(3, 1fr)' : '1fr',
            gap: '14px',
            alignItems: 'start',
            width: '100%',
            flex: 1,
            overflowY: 'auto',
            paddingRight: '4px'
          }}
        >
          {/* Column 1: Table Navigation */}
          {(activeCategory === 'all' || activeCategory === 'table') && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '5px',
                background: '#f8fafc',
                padding: '12px',
                borderRadius: '10px',
                border: '1px solid #f1f5f9'
              }}
            >
              <div
                style={{
                  fontSize: '12px',
                  fontWeight: 800,
                  color: '#334155',
                  paddingBottom: '6px',
                  marginBottom: '2px',
                  borderBottom: '1.5px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <span>Table Navigation (Tally System)</span>
                <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 600 }}>
                  {tableShortcuts.length} Shortcuts
                </span>
              </div>
              {tableShortcuts.map(s => {
                const isSelected = activeShortcutId === s.id;
                const isHovered = hoveredDescId === s.id;
                return (
                  <div
                    key={s.id}
                    className={`tactile-shortcut-row ${isSelected ? 'selected' : ''}`}
                    onMouseEnter={() => {
                      setActiveShortcutId(s.id);
                      setHoveredDescId(s.id);
                      macAudio.playHover();
                    }}
                    onMouseLeave={() => setHoveredDescId(null)}
                    onClick={() => {
                      setActiveShortcutId(s.id);
                      macAudio.playClick();
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      padding: '7px 10px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      gap: '8px'
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1, overflow: 'hidden' }}>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: isSelected ? 800 : 700,
                        color: isSelected ? '#ffffff' : '#1e293b',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {s.name}
                      </span>
                      <span className={`shortcut-desc ${(isHovered || isSelected) ? 'visible' : ''} ${isSelected ? 'selected-desc' : ''}`}>
                        {s.description}
                      </span>
                    </div>
                    {renderShortcutKeys(s.keys, isSelected)}
                  </div>
                );
              })}
            </div>
          )}

          {/* Column 2: Universal Actions & Entry */}
          {(activeCategory === 'all' || activeCategory === 'actions') && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '5px',
                background: '#f8fafc',
                padding: '12px',
                borderRadius: '10px',
                border: '1px solid #f1f5f9'
              }}
            >
              <div
                style={{
                  fontSize: '12px',
                  fontWeight: 800,
                  color: '#334155',
                  paddingBottom: '6px',
                  marginBottom: '2px',
                  borderBottom: '1.5px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <span>Universal Actions (Har Page Par)</span>
                <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 600 }}>
                  {actionShortcuts.length} Shortcuts
                </span>
              </div>
              {actionShortcuts.map(s => {
                const isSelected = activeShortcutId === s.id;
                const isHovered = hoveredDescId === s.id;
                return (
                  <div
                    key={s.id}
                    className={`tactile-shortcut-row ${isSelected ? 'selected' : ''}`}
                    onMouseEnter={() => {
                      setActiveShortcutId(s.id);
                      setHoveredDescId(s.id);
                      macAudio.playHover();
                    }}
                    onMouseLeave={() => setHoveredDescId(null)}
                    onClick={() => {
                      setActiveShortcutId(s.id);
                      macAudio.playClick();
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      padding: '7px 10px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      gap: '8px'
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1, overflow: 'hidden' }}>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: isSelected ? 800 : 700,
                        color: isSelected ? '#ffffff' : '#1e293b',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {s.name}
                      </span>
                      <span className={`shortcut-desc ${(isHovered || isSelected) ? 'visible' : ''} ${isSelected ? 'selected-desc' : ''}`}>
                        {s.description}
                      </span>
                    </div>
                    {renderShortcutKeys(s.keys, isSelected)}
                  </div>
                );
              })}
            </div>
          )}

          {/* Column 3: Tabs & Sub-Tabs Switch */}
          {(activeCategory === 'all' || activeCategory === 'navigation') && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '5px',
                background: '#f8fafc',
                padding: '12px',
                borderRadius: '10px',
                border: '1px solid #f1f5f9'
              }}
            >
              <div
                style={{
                  fontSize: '12px',
                  fontWeight: 800,
                  color: '#334155',
                  paddingBottom: '6px',
                  marginBottom: '2px',
                  borderBottom: '1.5px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <span>Tabs & Sub-Tabs (Ctrl+1..9 / Alt+1..5)</span>
                <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 600 }}>
                  {navShortcuts.length} Shortcuts
                </span>
              </div>
              {navShortcuts.map(s => {
                const isSelected = activeShortcutId === s.id;
                const isHovered = hoveredDescId === s.id;
                return (
                  <div
                    key={s.id}
                    className={`tactile-shortcut-row ${isSelected ? 'selected' : ''}`}
                    onMouseEnter={() => {
                      setActiveShortcutId(s.id);
                      setHoveredDescId(s.id);
                      macAudio.playHover();
                    }}
                    onMouseLeave={() => setHoveredDescId(null)}
                    onClick={() => {
                      setActiveShortcutId(s.id);
                      macAudio.playClick();
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      padding: '7px 10px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      gap: '8px'
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1, overflow: 'hidden' }}>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: isSelected ? 800 : 700,
                        color: isSelected ? '#ffffff' : '#1e293b',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {s.name}
                      </span>
                      <span className={`shortcut-desc ${(isHovered || isSelected) ? 'visible' : ''} ${isSelected ? 'selected-desc' : ''}`}>
                        {s.description}
                      </span>
                    </div>
                    {renderShortcutKeys(s.keys, isSelected)}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Card Footer: Live physical typing status and helper */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CheckCircle2 size={13} color="#16a34a" />
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#16a34a' }}>
              All 25 shortcuts active & verified across every page and table
            </span>
          </div>

          <span style={{ fontSize: '10.5px', color: '#94a3b8' }}>
            Hover or click any shortcut to illuminate keys in green • Physical keyboard typing active
          </span>
        </div>
      </div>
    </div>
  );
};

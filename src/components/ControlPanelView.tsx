import React, { useState, useEffect, useRef } from 'react';
import { ManageConversionsTab } from './ManageConversionsTab';
import { SkipItemNameTab } from './SkipItemNameTab';
import { BillItemNameTab } from './BillItemNameTab';
import { macAudio } from '../utils/macAudio';
import { useSettings } from '../context/SettingsContext';
import UnsavedChangesModal from './UnsavedChangesModal';
import {
  Button as ShadcnButton,
  Input as ShadcnInput,
} from './ui/shadcn';

import {
  Plus,
  Trash2,
  X,
  Check,
  Search,
  Layers,
  SlidersHorizontal,
  Shuffle,
  Tag,
  Hash,
  Scale,
  Package,
  Percent,
  FileText,
  Filter,
  GitBranch,
  FileSpreadsheet
} from 'lucide-react';

import { downloadCSV } from '../utils/exportCsv';
import { SQLITE_CONTROL_CONVERSIONS } from '../data/sqliteControlPanel';
import { PREFILLED_BILL_MAPS } from '../data/billMapsData';
import { SQLITE_SKIP_ITEMS, SQLITE_SKIP_SUB_GROUPS } from '../data/sqliteSkipData';

export type ControlTab = 'MANAGE_GROUPS' | 'SKIP_ITEM_NAME' | 'BILL_ITEM_NAME' | 'MANAGE_CONVERSIONS';

export interface GroupRule {
  id: string;
  groupName: string;
  groupIndex: string;
  weightPerPc: number;
  pcsPerBox: number;
  multiplication: number;
  realItemName: string;
  skipEq: boolean;
  chainParent: string;
}

const DEFAULT_GROUPS: GroupRule[] = [
  {
    id: 'grp-1',
    groupName: 'BFP',
    groupIndex: 'G-101',
    weightPerPc: 0.85,
    pcsPerBox: 1,
    multiplication: 1.0,
    realItemName: 'BFP Gold Series Aluminium',
    skipEq: false,
    chainParent: 'RAW-ALUM-6063'
  },
  {
    id: 'grp-2',
    groupName: 'JOINTER',
    groupIndex: 'G-102',
    weightPerPc: 1.20,
    pcsPerBox: 12,
    multiplication: 1.25,
    realItemName: 'Jointer Clamp 10mm Standard',
    skipEq: false,
    chainParent: 'RAW-ALUM-6063'
  },
  {
    id: 'grp-3',
    groupName: 'CAPS',
    groupIndex: 'G-103',
    weightPerPc: 4.80,
    pcsPerBox: 6,
    multiplication: 1.10,
    realItemName: 'Die Core Cap 50mm Precision',
    skipEq: true,
    chainParent: 'NONE'
  },
  {
    id: 'grp-4',
    groupName: 'MOULDS',
    groupIndex: 'G-104',
    weightPerPc: 12.50,
    pcsPerBox: 1,
    multiplication: 1.50,
    realItemName: 'Mould 14x20 Standard Housing',
    skipEq: false,
    chainParent: 'RAW-HARDENER-H88'
  },
  {
    id: 'grp-5',
    groupName: 'ACCESSORIES',
    groupIndex: 'G-105',
    weightPerPc: 0.45,
    pcsPerBox: 24,
    multiplication: 1.0,
    realItemName: 'Flange Coupling Pin Alloy',
    skipEq: true,
    chainParent: 'NONE'
  }
];

const DEFAULT_CTRL_COLS = {
  srNo: 35,
  groupName: 180,
  groupIndex: 120,
  weightPerPc: 80,
  pcsPerBox: 70,
  multiplication: 70,
  realItemName: 260,
  skipEq: 60,
  chainParent: 150
};

export const ControlPanelView: React.FC = () => {
  const { rowHeightPx } = useSettings();
  const activeRowHeight = rowHeightPx || 28;

  // Active Tab: 4 Root Tabs
  const [activeTab, setActiveTab] = useState<ControlTab>('MANAGE_GROUPS');

  // Per-tab search state
  const [tabSearch, setTabSearch] = useState<{ [key in ControlTab]: string }>({
    MANAGE_GROUPS: '',
    SKIP_ITEM_NAME: '',
    BILL_ITEM_NAME: '',
    MANAGE_CONVERSIONS: ''
  });
  const currentSearch = tabSearch[activeTab];
  const handleSearchChange = (val: string) => {
    setTabSearch(prev => ({ ...prev, [activeTab]: val }));
  };

  // Add Row/Item Refs for child tabs
  const addSkipItemRef = useRef<(() => void) | null>(null);
  const addBillItemRef = useRef<(() => void) | null>(null);
  const addConversionRef = useRef<(() => void) | null>(null);

  const getTabConfig = (tab: ControlTab) => {
    switch (tab) {
      case 'MANAGE_GROUPS':
        return {
          placeholder: 'Search groups, index, item name...',
          addButtonText: 'ADD GROUP'
        };
      case 'SKIP_ITEM_NAME':
        return {
          placeholder: 'Search groups or prefix...',
          addButtonText: 'ADD ITEM'
        };
      case 'BILL_ITEM_NAME':
        return {
          placeholder: 'Search bill names, codes, category...',
          addButtonText: 'ADD ROW'
        };
      case 'MANAGE_CONVERSIONS':
        return {
          placeholder: 'Search conversions, shortcut, group...',
          addButtonText: 'ADD ROW'
        };
    }
  };

  // Groups Data with LocalStorage Persistence
  const [groups, setGroups] = useState<GroupRule[]>(() => {
    try {
      const saved = localStorage.getItem('modern_control_groups_data');
      return saved ? JSON.parse(saved) : DEFAULT_GROUPS;
    } catch {
      return DEFAULT_GROUPS;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('modern_control_groups_data', JSON.stringify(groups));
    } catch {}
  }, [groups]);

  // Selected Row & Row Refs for Auto-scrolling
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(groups[0]?.id || null);
  const rowRefs = useRef<{ [id: string]: HTMLTableRowElement | null }>({});

  // Column Widths with LocalStorage Persistence
  const [colWidths, setColWidths] = useState<typeof DEFAULT_CTRL_COLS>(() => {
    try {
      const saved = localStorage.getItem('modern_ctrl_groups_cols');
      return saved ? { ...DEFAULT_CTRL_COLS, ...JSON.parse(saved) } : DEFAULT_CTRL_COLS;
    } catch {
      return DEFAULT_CTRL_COLS;
    }
  });

  const startColResize = (colKey: keyof typeof DEFAULT_CTRL_COLS, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startW = colWidths[colKey] || 100;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientX - startX;
      const newWidth = Math.max(50, startW + delta);
      setColWidths(prev => {
        const next = { ...prev, [colKey]: newWidth };
        try {
          localStorage.setItem('modern_ctrl_groups_cols', JSON.stringify(next));
        } catch {}
        return next;
      });
    };

    const handleMouseUp = () => {
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

  // Row Resizing
  const handleRowResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const startY = e.clientY;
    const startH = activeRowHeight;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaY = moveEvent.clientY - startY;
      const nextH = Math.max(20, Math.min(65, Math.round(startH + deltaY)));
      try {
        localStorage.setItem('modern_app_row_height', JSON.stringify(nextH));
      } catch {}
    };

    const onMouseUp = () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = 'text';
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [groupToDelete, setGroupToDelete] = useState<GroupRule | null>(null);

  const handleCellChange = (id: string, field: keyof GroupRule, value: any) => {
    setGroups(prev => {
      const next = prev.map(g => g.id === id ? { ...g, [field]: value } : g);
      try { localStorage.setItem('control_group_rules', JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const handleAddNewGroup = () => {
    macAudio.playClick();
    const newGroup: GroupRule = {
      id: `grp-${Date.now()}`,
      groupName: 'NEW GROUP',
      groupIndex: `G-${101 + groups.length}`,
      weightPerPc: 1.0,
      pcsPerBox: 1,
      multiplication: 1.0,
      realItemName: '',
      skipEq: false,
      chainParent: 'NONE'
    };
    setGroups(prev => {
      const next = [newGroup, ...prev];
      try { localStorage.setItem('control_group_rules', JSON.stringify(next)); } catch {}
      return next;
    });
    setSelectedGroupId(newGroup.id);
    setEditingGroupId(newGroup.id);
  };

  const handleDeleteGroup = (id: string) => {
    const grp = groups.find(g => g.id === id);
    if (grp) {
      macAudio.playPop();
      setGroupToDelete(grp);
    }
  };

  const handleGroupPaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text');
    if (!text || (!text.includes('\t') && !text.includes('\n'))) return;

    e.preventDefault();
    macAudio.playSuccess();
    const lines = text.trim().split(/\r?\n/).filter(line => line.trim().length > 0);
    const parsedRows: GroupRule[] = lines.map((line, idx) => {
      const cols = line.split('\t').map(c => c.trim());
      return {
        id: `grp-${Date.now() + idx}`,
        groupName: cols[0] || 'GROUP',
        groupIndex: cols[1] || `G-${100 + idx}`,
        weightPerPc: cols[2] ? parseFloat(cols[2]) || 0 : 0,
        pcsPerBox: cols[3] ? parseInt(cols[3], 10) || 1 : 1,
        multiplication: cols[4] ? parseFloat(cols[4]) || 1 : 1,
        realItemName: cols[5] || '',
        skipEq: cols[6] ? cols[6].toLowerCase() === 'true' || cols[6].toLowerCase() === 'yes' : false,
        chainParent: cols[7] || 'NONE'
      };
    });

    if (parsedRows.length > 0) {
      setGroups(prev => {
        const next = [...parsedRows, ...prev];
        try { localStorage.setItem('control_group_rules', JSON.stringify(next)); } catch {}
        return next;
      });
    }
  };

  const handleAddForActiveTab = () => {
    macAudio.playClick();
    if (activeTab === 'MANAGE_GROUPS') {
      handleAddNewGroup();
    } else if (activeTab === 'SKIP_ITEM_NAME') {
      addSkipItemRef.current?.();
    } else if (activeTab === 'BILL_ITEM_NAME') {
      addBillItemRef.current?.();
    } else if (activeTab === 'MANAGE_CONVERSIONS') {
      addConversionRef.current?.();
    }
  };

  // Active Groups list filtered by search
  const filteredGroups = React.useMemo(() => {
    const q = (tabSearch.MANAGE_GROUPS || '').trim().toLowerCase();
    if (!q) return groups;
    return groups.filter(g =>
      (g.groupName || '').toLowerCase().includes(q) ||
      (g.groupIndex || '').toLowerCase().includes(q) ||
      (g.realItemName || '').toLowerCase().includes(q) ||
      (g.chainParent || '').toLowerCase().includes(q)
    );
  }, [groups, tabSearch.MANAGE_GROUPS]);

  // Auto-scroll selected row into view
  useEffect(() => {
    if (selectedGroupId && rowRefs.current[selectedGroupId]) {
      rowRefs.current[selectedGroupId]?.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth'
      });
    }
  }, [selectedGroupId]);

  // Global Keyboard Navigation (Up/Down, Ctrl+Up/Ctrl+Down Shifting, Enter Edit, Delete Key)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (groupToDelete) {
        if (e.key === 'Escape') setGroupToDelete(null);
        if (e.key === 'Enter') {
          e.preventDefault();
          setGroups(prev => prev.filter(g => g.id !== groupToDelete.id));
          if (selectedGroupId === groupToDelete.id) {
            setSelectedGroupId(null);
          }
          setGroupToDelete(null);
          macAudio.playClick();
        }
        return;
      }

      // If user is typing in an input
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        if (e.key === 'ArrowRight') {
          const target = e.target as HTMLInputElement;
          const isFullSelect = target.selectionStart === 0 && target.selectionEnd === target.value?.length;
          const isAtEnd = target.selectionEnd === target.value?.length;
          if (isAtEnd || isFullSelect) {
            const row = target.closest('tr');
            if (row) {
              const inputs = Array.from(row.querySelectorAll('input:not([disabled]), select:not([disabled])')) as (HTMLInputElement | HTMLSelectElement)[];
              const currIdx = inputs.indexOf(target as any);
              if (currIdx >= 0 && currIdx < inputs.length - 1) {
                e.preventDefault();
                macAudio.playHover();
                inputs[currIdx + 1].focus();
                if ('select' in inputs[currIdx + 1]) (inputs[currIdx + 1] as HTMLInputElement).select();
                return;
              }
            }
          }
        } else if (e.key === 'ArrowLeft') {
          const target = e.target as HTMLInputElement;
          const isFullSelect = target.selectionStart === 0 && target.selectionEnd === target.value?.length;
          const isAtStart = target.selectionStart === 0;
          if (isAtStart || isFullSelect) {
            const row = target.closest('tr');
            if (row) {
              const inputs = Array.from(row.querySelectorAll('input:not([disabled]), select:not([disabled])')) as (HTMLInputElement | HTMLSelectElement)[];
              const currIdx = inputs.indexOf(target as any);
              if (currIdx > 0) {
                e.preventDefault();
                macAudio.playHover();
                inputs[currIdx - 1].focus();
                if ('select' in inputs[currIdx - 1]) (inputs[currIdx - 1] as HTMLInputElement).select();
                return;
              }
            }
          }
        } else if (e.key === 'Enter') {
          e.preventDefault();
          const target = e.target as HTMLElement;
          const row = target.closest('tr');
          if (row) {
            const inputs = Array.from(row.querySelectorAll('input:not([disabled]), select:not([disabled])')) as (HTMLInputElement | HTMLSelectElement)[];
            const currIdx = inputs.indexOf(target as any);
            if (currIdx >= 0 && currIdx < inputs.length - 1) {
              macAudio.playHover();
              inputs[currIdx + 1].focus();
              if ('select' in inputs[currIdx + 1]) {
                (inputs[currIdx + 1] as HTMLInputElement).select();
              }
              return;
            }
          }
          // Reached last cell of row -> finish / save editing!
          macAudio.playSuccess();
          setEditingGroupId(null);
        } else if (e.key === 'Escape') {
          e.preventDefault();
          e.stopPropagation();
          setEditingGroupId(null);
        }
        return;
      }

      // Escape: Cancel selection / edit mode
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        setEditingGroupId(null);
        setSelectedGroupId(null);
        setGroupToDelete(null);
        return;
      }

      if (activeTab === 'MANAGE_GROUPS' && filteredGroups.length > 0) {
        const currentIndex = filteredGroups.findIndex(g => g.id === selectedGroupId);
        const isCtrlOrCmd = e.ctrlKey || e.metaKey;

        // Ctrl + Down: Shift Selected Row Down
        if (isCtrlOrCmd && e.key === 'ArrowDown') {
          e.preventDefault();
          if (currentIndex >= 0 && currentIndex < filteredGroups.length - 1) {
            const actualFrom = groups.findIndex(g => g.id === filteredGroups[currentIndex].id);
            const actualTo = groups.findIndex(g => g.id === filteredGroups[currentIndex + 1].id);
            if (actualFrom >= 0 && actualTo >= 0) {
              setGroups(prev => {
                const next = [...prev];
                const [moved] = next.splice(actualFrom, 1);
                next.splice(actualTo, 0, moved);
                return next;
              });
              macAudio.playHover();
            }
          }
          return;
        }

        // Ctrl + Up: Shift Selected Row Up
        if (isCtrlOrCmd && e.key === 'ArrowUp') {
          e.preventDefault();
          if (currentIndex > 0) {
            const actualFrom = groups.findIndex(g => g.id === filteredGroups[currentIndex].id);
            const actualTo = groups.findIndex(g => g.id === filteredGroups[currentIndex - 1].id);
            if (actualFrom >= 0 && actualTo >= 0) {
              setGroups(prev => {
                const next = [...prev];
                const [moved] = next.splice(actualFrom, 1);
                next.splice(actualTo, 0, moved);
                return next;
              });
              macAudio.playHover();
            }
          }
          return;
        }

        // ArrowDown: Select Next Row
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          macAudio.playHover();
          const nextIdx = currentIndex < filteredGroups.length - 1 ? currentIndex + 1 : currentIndex;
          setSelectedGroupId(filteredGroups[nextIdx].id);
          return;
        }

        // ArrowUp: Select Prev Row
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          macAudio.playHover();
          const prevIdx = currentIndex > 0 ? currentIndex - 1 : 0;
          setSelectedGroupId(filteredGroups[prevIdx].id);
          return;
        }

        // Ctrl + Enter: Make Selected Row Editable
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
          e.preventDefault();
          if (selectedGroupId) {
            macAudio.playClick();
            setEditingGroupId(selectedGroupId);
          }
          return;
        }

        // Insert Key: Insert New Row at Top (Index 0)
        if (e.key === 'Insert') {
          e.preventDefault();
          handleAddNewGroup();
          return;
        }

        // Delete Key: Trigger Delete Confirmation
        if (e.key === 'Delete') {
          e.preventDefault();
          if (currentIndex >= 0) {
            macAudio.playClick();
            setGroupToDelete(filteredGroups[currentIndex]);
          }
          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, filteredGroups, selectedGroupId, editingGroupId, groups, groupToDelete]);

  // Universal Alt+1..4 Subtab Switch and Action Listeners for Control Panel
  useEffect(() => {
    const handleSubtabSwitch = (e: Event) => {
      const custom = e as CustomEvent<{ index: number }>;
      const idx = custom.detail?.index;
      if (idx === 1) { macAudio.playClick(); setActiveTab('MANAGE_GROUPS'); }
      else if (idx === 2) { macAudio.playClick(); setActiveTab('SKIP_ITEM_NAME'); }
      else if (idx === 3) { macAudio.playClick(); setActiveTab('BILL_ITEM_NAME'); }
      else if (idx === 4) { macAudio.playClick(); setActiveTab('MANAGE_CONVERSIONS'); }
    };

    const handleInsert = () => {
      handleAddForActiveTab();
    };

    const handleDelete = () => {
      if (activeTab === 'MANAGE_GROUPS' && filteredGroups.length > 0) {
        const currentIndex = filteredGroups.findIndex(g => g.id === selectedGroupId);
        if (currentIndex >= 0) {
          macAudio.playClick();
          setGroupToDelete(filteredGroups[currentIndex]);
        }
      }
    };

    const handleHomeFocus = () => {
      const searchBox = document.querySelector<HTMLInputElement>('input[placeholder*="Search" i]');
      if (searchBox) {
        searchBox.focus();
        searchBox.select();
      }
    };

    window.addEventListener('app-subtab-switch', handleSubtabSwitch);
    window.addEventListener('app-insert-row', handleInsert);
    window.addEventListener('app-delete-row', handleDelete);
    window.addEventListener('app-home-focus', handleHomeFocus);

    return () => {
      window.removeEventListener('app-subtab-switch', handleSubtabSwitch);
      window.removeEventListener('app-insert-row', handleInsert);
      window.removeEventListener('app-delete-row', handleDelete);
      window.removeEventListener('app-home-focus', handleHomeFocus);
    };
  }, [activeTab, filteredGroups, selectedGroupId]);

  const handleExportActiveTabCsv = () => {
    macAudio.playPop();
    const today = new Date().toISOString().split('T')[0];
    if (activeTab === 'MANAGE_GROUPS') {
      const headers = ['SR NO', 'GROUP NAME', 'GROUP INDEX', 'WEIGHT PER PC (KGS)', 'PCS PER BOX', 'MULTIPLICATION', 'REAL ITEM NAME', 'SKIP EQ', 'CHAIN PARENT'];
      const rows = filteredGroups.map((g, idx) => [
        idx + 1,
        g.groupName || '',
        g.groupIndex || '',
        g.weightPerPc || 0,
        g.pcsPerBox || 1,
        g.multiplication || 1,
        g.realItemName || '',
        g.skipEq ? 'YES' : 'NO',
        g.chainParent || ''
      ]);
      downloadCSV(`control_panel_groups_${today}.csv`, headers, rows);
    } else if (activeTab === 'SKIP_ITEM_NAME') {
      try {
        const savedItems = localStorage.getItem('billapp_skip_items');
        const items = savedItems ? JSON.parse(savedItems) : SQLITE_SKIP_ITEMS;
        const savedSubs = localStorage.getItem('billapp_skip_sub_groups');
        const subs = savedSubs ? JSON.parse(savedSubs) : SQLITE_SKIP_SUB_GROUPS;
        const subMap = new Map(subs.map((s: any) => [s.id, s.name]));
        const headers = ['SR NO', 'SUB GROUP', 'ITEM NAME'];
        const rows = items.map((it: any, idx: number) => [
          idx + 1,
          subMap.get(it.subGroupId) || it.subGroupId || '',
          it.name || ''
        ]);
        downloadCSV(`control_panel_skip_items_${today}.csv`, headers, rows);
      } catch (e) {
        console.error('Failed to export skip items', e);
      }
    } else if (activeTab === 'BILL_ITEM_NAME') {
      try {
        const saved = localStorage.getItem('billapp_bill_maps');
        const maps = saved ? JSON.parse(saved) : PREFILLED_BILL_MAPS;
        const headers = ['SR NO', 'SHORT CODE', 'PRINT NAME', 'DEFAULT RATE (₹)', 'CATEGORY'];
        const rows = maps.map((m: any, idx: number) => [
          idx + 1,
          m.shortCode || '',
          m.printName || '',
          m.defaultRate || 0,
          m.category || ''
        ]);
        downloadCSV(`control_panel_bill_items_${today}.csv`, headers, rows);
      } catch (e) {
        console.error('Failed to export bill items', e);
      }
    } else if (activeTab === 'MANAGE_CONVERSIONS') {
      try {
        const saved = localStorage.getItem('billapp_conversions');
        const list = saved ? JSON.parse(saved) : SQLITE_CONTROL_CONVERSIONS;
        const headers = ['SR NO', 'SHORTCUT', 'CONVERSION / MOULD', 'SIZE', 'U-CAP', 'L-CAP', 'MULTIPLICATION', 'COLOR', 'BOX SIZE', 'WEIGHT', 'REAL ITEM NAME', 'GROUP NAME'];
        const rows = list.map((c: any, idx: number) => [
          idx + 1,
          c.shortcut || '',
          c.conversion || '',
          c.size || '',
          c.uCap || '',
          c.lCap || '',
          c.multiplication || 1,
          c.color || '',
          c.boxSize || '',
          c.weight || '',
          c.realItemName || '',
          c.groupName || ''
        ]);
        downloadCSV(`control_panel_conversions_${today}.csv`, headers, rows);
      } catch (e) {
        console.error('Failed to export conversions', e);
      }
    }
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, gap: '8px', overflow: 'hidden', background: '#09090b', padding: '8px' }}>

      {/* ======================================================== */}
      {/* TOOLBAR: Shadcn-style tab row + search + action buttons  */}
      {/* ======================================================== */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px',
          padding: '8px 12px',
          background: '#18181b',
          border: '1px solid #27272a',
          borderRadius: '8px',
          flexShrink: 0
        }}
      >
        {/* Shadcn TabsList — left side */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            background: '#09090b',
            border: '1px solid #27272a',
            borderRadius: '8px',
            padding: '3px',
            gap: '2px'
          }}
        >
          {(
            [
              { key: 'MANAGE_GROUPS' as ControlTab, label: 'Manage Groups', icon: Layers },
              { key: 'SKIP_ITEM_NAME' as ControlTab, label: 'Skip Item', icon: Shuffle },
              { key: 'BILL_ITEM_NAME' as ControlTab, label: 'Bill Item', icon: Tag },
              { key: 'MANAGE_CONVERSIONS' as ControlTab, label: 'Conversions', icon: SlidersHorizontal }
            ] as { key: ControlTab; label: string; icon: React.ElementType }[]
          ).map(({ key, label, icon: Icon }) => {
            const isActive = activeTab === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => { macAudio.playClick(); setActiveTab(key); }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '5px 13px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? '#f4f4f5' : '#71717a',
                  background: isActive ? '#18181b' : 'transparent',
                  border: isActive ? '1px solid #27272a' : '1px solid transparent',
                  boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.4)' : 'none',
                  cursor: 'pointer',
                  outline: 'none',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                }}
              >
                <Icon size={13} />
                {label}
              </button>
            );
          })}
        </div>

        {/* Right actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Search */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={13} style={{ position: 'absolute', left: '10px', color: '#71717a', pointerEvents: 'none' }} />
            <ShadcnInput
              type="text"
              value={currentSearch}
              onChange={(e) => handleSearchChange(e.target.value)}
              style={{ width: '220px', height: '32px', paddingLeft: '30px', fontSize: '12px' }}
            />
          </div>

          {/* Add Button */}
          <ShadcnButton
            type="button"
            variant="default"
            size="sm"
            onClick={handleAddForActiveTab}
            style={{ height: '32px', fontSize: '12px', fontWeight: 600, gap: '5px', whiteSpace: 'nowrap' }}
          >
            <Plus size={13} />
            {getTabConfig(activeTab).addButtonText}
          </ShadcnButton>

          {/* Export CSV */}
          <ShadcnButton
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExportActiveTabCsv}
            title="Download active tab data as CSV"
            style={{ height: '32px', fontSize: '12px', gap: '5px', whiteSpace: 'nowrap' }}
          >
            <FileSpreadsheet size={13} />
            Export CSV
          </ShadcnButton>
        </div>
      </div>


      {/* ========================================================================= */}
      {/* TAB 1: MANAGE GROUPS                                                      */}
      {/* ========================================================================= */}
      {activeTab === 'MANAGE_GROUPS' && (
        <div 
          style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}
          onPaste={handleGroupPaste}
        >
          {/* GROUPS DATA TABLE */}
          <div style={{ flex: 1, minHeight: 0, overflow: 'auto', borderRadius: '8px', border: '1px solid #27272a', background: '#09090b' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: '#18181b' }}>
                <tr style={{ borderBottom: '1px solid #27272a' }}>
                  <th style={{ width: `${colWidths.srNo}px`, padding: '8px 8px', textAlign: 'center', color: '#a1a1aa', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', position: 'relative', userSelect: 'none' }}>
                    #
                    <div className="th-resizer" onMouseDown={(e) => startColResize('srNo', e)} title="Drag to resize column" />
                  </th>
                  <th style={{ width: `${colWidths.groupName}px`, padding: '8px 10px', textAlign: 'left', color: '#a1a1aa', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', position: 'relative', userSelect: 'none' }}>
                    GROUP NAME
                    <div className="th-resizer" onMouseDown={(e) => startColResize('groupName', e)} title="Drag to resize column" />
                  </th>
                  <th style={{ width: `${colWidths.groupIndex}px`, padding: '8px 10px', textAlign: 'left', color: '#a1a1aa', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', position: 'relative', userSelect: 'none' }}>
                    GROUP INDEX
                    <div className="th-resizer" onMouseDown={(e) => startColResize('groupIndex', e)} title="Drag to resize column" />
                  </th>
                  <th style={{ width: `${colWidths.weightPerPc}px`, padding: '8px 10px', textAlign: 'right', color: '#a1a1aa', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', position: 'relative', userSelect: 'none' }}>
                    WEIGHT/PC
                    <div className="th-resizer" onMouseDown={(e) => startColResize('weightPerPc', e)} title="Drag to resize column" />
                  </th>
                  <th style={{ width: `${colWidths.pcsPerBox}px`, padding: '8px 8px', textAlign: 'center', color: '#a1a1aa', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', position: 'relative', userSelect: 'none' }}>
                    PCS/BOX
                    <div className="th-resizer" onMouseDown={(e) => startColResize('pcsPerBox', e)} title="Drag to resize column" />
                  </th>
                  <th style={{ width: `${colWidths.multiplication}px`, padding: '8px 8px', textAlign: 'center', color: '#a1a1aa', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', position: 'relative', userSelect: 'none' }}>
                    MULT.
                    <div className="th-resizer" onMouseDown={(e) => startColResize('multiplication', e)} title="Drag to resize column" />
                  </th>
                  <th style={{ width: `${colWidths.realItemName}px`, padding: '8px 10px', textAlign: 'left', color: '#a1a1aa', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', position: 'relative', userSelect: 'none' }}>
                    REAL ITEM NAME
                    <div className="th-resizer" onMouseDown={(e) => startColResize('realItemName', e)} title="Drag to resize column" />
                  </th>
                  <th style={{ width: `${colWidths.skipEq}px`, padding: '8px 8px', textAlign: 'center', color: '#a1a1aa', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', position: 'relative', userSelect: 'none' }}>
                    SKIP
                    <div className="th-resizer" onMouseDown={(e) => startColResize('skipEq', e)} title="Drag to resize column" />
                  </th>
                  <th style={{ width: `${colWidths.chainParent}px`, padding: '8px 10px', textAlign: 'left', color: '#a1a1aa', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', position: 'relative', userSelect: 'none' }}>
                    CHAIN PARENT
                    <div className="th-resizer" onMouseDown={(e) => startColResize('chainParent', e)} title="Drag to resize column" />
                  </th>

                  <th style={{ width: '65px', textAlign: 'center', position: 'relative', userSelect: 'none' }}>
                    ACTION
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredGroups.map((grp, idx) => {
                  const isSelected = selectedGroupId === grp.id;
                  const isEditing = editingGroupId === grp.id;
                  const cellInput: React.CSSProperties = {
                    width: '100%',
                    background: '#27272a',
                    border: '1px solid #3f3f46',
                    outline: 'none',
                    color: '#f4f4f5',
                    fontSize: '12px',
                    padding: '3px 7px',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    borderRadius: '4px',
                    fontWeight: 500
                  };
                  const cellText: React.CSSProperties = {
                    padding: '4px 10px',
                    display: 'block',
                    userSelect: 'text',
                    color: '#f4f4f5',
                    fontSize: '12px',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    fontWeight: 500
                  };
                  return (
                    <tr
                      key={grp.id}
                      style={{
                        height: `${activeRowHeight}px`,
                        borderBottom: '1px solid #27272a',
                        background: isSelected ? '#1c1c1f' : idx % 2 === 0 ? 'rgba(24,24,27,0.5)' : 'transparent',
                        outline: isSelected ? '1px solid #3f3f46' : 'none',
                        outlineOffset: '-1px',
                        cursor: 'pointer',
                        transition: 'background 0.1s ease'
                      }}
                      onClick={() => setSelectedGroupId(grp.id)}
                      onDoubleClick={() => setEditingGroupId(grp.id)}
                    >
                      <td style={{ textAlign: 'center', color: '#52525b', fontSize: '11px', userSelect: 'none', padding: '4px 6px' }}>
                        {idx + 1}
                      </td>
                      <td style={{ padding: '2px 4px' }}>
                        {isEditing ? (
                          <input style={{ ...cellInput, fontWeight: 600 }} value={grp.groupName} onChange={e => handleCellChange(grp.id, 'groupName', e.target.value)} autoFocus />
                        ) : (
                          <span style={{ ...cellText, fontWeight: 600 }}>{grp.groupName}</span>
                        )}
                      </td>
                      <td style={{ padding: '2px 4px' }}>
                        {isEditing ? (
                          <input style={{ ...cellInput, fontWeight: 600 }} value={grp.groupIndex} onChange={e => handleCellChange(grp.id, 'groupIndex', e.target.value)} />
                        ) : (
                          <span style={{ ...cellText, fontWeight: 600, color: '#a1a1aa' }}>{grp.groupIndex}</span>
                        )}
                      </td>
                      <td style={{ padding: '2px 4px' }}>
                        {isEditing ? (
                          <input type="number" step="any" style={{ ...cellInput, textAlign: 'right' }} value={grp.weightPerPc} onChange={e => handleCellChange(grp.id, 'weightPerPc', parseFloat(e.target.value) || 0)} />
                        ) : (
                          <span style={{ ...cellText, textAlign: 'right' }}>{grp.weightPerPc}</span>
                        )}
                      </td>
                      <td style={{ padding: '2px 4px' }}>
                        {isEditing ? (
                          <input type="number" style={{ ...cellInput, textAlign: 'center' }} value={grp.pcsPerBox} onChange={e => handleCellChange(grp.id, 'pcsPerBox', parseInt(e.target.value, 10) || 1)} />
                        ) : (
                          <span style={{ ...cellText, textAlign: 'center' }}>{grp.pcsPerBox}</span>
                        )}
                      </td>
                      <td style={{ padding: '2px 4px' }}>
                        {isEditing ? (
                          <input type="number" step="any" style={{ ...cellInput, textAlign: 'center' }} value={grp.multiplication} onChange={e => handleCellChange(grp.id, 'multiplication', parseFloat(e.target.value) || 1)} />
                        ) : (
                          <span style={{ ...cellText, textAlign: 'center' }}>{grp.multiplication}</span>
                        )}
                      </td>
                      <td style={{ padding: '2px 4px' }}>
                        {isEditing ? (
                          <input style={cellInput} value={grp.realItemName} onChange={e => handleCellChange(grp.id, 'realItemName', e.target.value)} />
                        ) : (
                          <span style={{ ...cellText, color: grp.realItemName ? '#f4f4f5' : '#52525b' }}>{grp.realItemName || '—'}</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center', padding: '2px' }}>
                        <input
                          type="checkbox"
                          checked={grp.skipEq}
                          disabled={!isEditing}
                          onChange={e => handleCellChange(grp.id, 'skipEq', e.target.checked)}
                          style={{ cursor: isEditing ? 'pointer' : 'default', accentColor: '#f4f4f5', width: '14px', height: '14px' }}
                        />
                      </td>
                      <td style={{ padding: '2px 4px' }}>
                        {isEditing ? (
                          <input style={cellInput} value={grp.chainParent} onChange={e => handleCellChange(grp.id, 'chainParent', e.target.value)} />
                        ) : (
                          <span style={{ ...cellText, color: grp.chainParent === 'NONE' ? '#52525b' : '#f4f4f5' }}>{grp.chainParent}</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center', padding: '2px 6px' }}>
                        {isEditing ? (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); macAudio.playSuccess(); setEditingGroupId(null); }}
                            title="Save"
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: '4px',
                              padding: '2px 10px', height: '24px', borderRadius: '4px',
                              background: '#f4f4f5', color: '#09090b',
                              border: 'none', fontSize: '11px', fontWeight: 600,
                              cursor: 'pointer', margin: '0 auto'
                            }}
                          >
                            <Check size={11} /> Save
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleDeleteGroup(grp.id); }}
                            title="Delete"
                            style={{
                              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                              width: '24px', height: '24px', borderRadius: '4px',
                              background: 'transparent', color: '#52525b',
                              border: '1px solid transparent', cursor: 'pointer',
                              transition: 'all 0.12s ease'
                            }}
                            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#ef4444'; (e.currentTarget as HTMLButtonElement).style.borderColor = '#3f3f46'; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#52525b'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'transparent'; }}
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}


      {/* ========================================================================= */}
      {/* TAB 2: SKIP ITEM NAME */}
      {/* ========================================================================= */}
      {activeTab === 'SKIP_ITEM_NAME' && (
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <SkipItemNameTab search={tabSearch.SKIP_ITEM_NAME} onAddRef={addSkipItemRef} />
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: BILL ITEM NAME */}
      {/* ========================================================================= */}
      {activeTab === 'BILL_ITEM_NAME' && (
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <BillItemNameTab search={tabSearch.BILL_ITEM_NAME} onAddRef={addBillItemRef} />
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: MANAGE CONVERSIONS */}
      {/* ========================================================================= */}
      {activeTab === 'MANAGE_CONVERSIONS' && (
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <ManageConversionsTab search={tabSearch.MANAGE_CONVERSIONS} onAddRef={addConversionRef} />
        </div>
      )}



      {/* ========================================================================= */}
      {/* DELETE CONFIRMATION DIALOG (TRIGGERED VIA "DELETE" KEY) */}
      {/* ========================================================================= */}
      {groupToDelete && (
        <UnsavedChangesModal
          titleText="Delete Group Configuration?"
          descText={`Kya aap sach me group "${groupToDelete.groupName}" (${groupToDelete.groupIndex}) ko delete karna chahte hain? Isse related bill calculations par asar pad sakta hai.`}
          discardLabel="Haan, Delete Karo"
          onDiscard={() => {
            setGroups(prev => {
              const next = prev.filter(g => g.id !== groupToDelete.id);
              try { localStorage.setItem('control_group_rules', JSON.stringify(next)); } catch {}
              return next;
            });
            if (selectedGroupId === groupToDelete.id) {
              setSelectedGroupId(null);
            }
            setGroupToDelete(null);
            macAudio.playSuccess();
          }}
          onCancel={() => setGroupToDelete(null)}
        />
      )}
    </div>
  );
};

export default ControlPanelView;

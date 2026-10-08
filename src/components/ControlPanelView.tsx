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
  Tooltip,
  toast,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from './ui/shadcn';
import { RotateCcw } from 'lucide-react';

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
import { SQLITE_SKIP_ITEMS, SQLITE_SKIP_SUB_GROUPS, SQLITE_SKIP_MAIN_GROUPS } from '../data/sqliteSkipData';
import {
  getControlGroups,
  saveControlGroup,
  deleteControlGroup,
  saveControlGroupsBulk,
  saveConversionsBulk,
  getConversions,
  saveSkipItemsBulk,
  getSkipSubGroups,
  saveSkipSubGroupsBulk,
  getSkipMainGroups,
  saveSkipMainGroupsBulk,
  getSkipItems,
  getBillItemNames,
  saveBillItemNamesBulk
} from '../services/db/sqliteDb';
import { ExcelCsvActions, type CsvColumnDef } from './common/ExcelCsvActions';

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

  // Table state directly from SQLite Database (NO Cache)
  const [groups, setGroups] = useState<GroupRule[]>(DEFAULT_GROUPS);
  const [skipItemsList, setSkipItemsList] = useState<any[]>([]);
  const [billItemsList, setBillItemsList] = useState<any[]>([]);
  const [conversionsList, setConversionsList] = useState<any[]>([]);
  const [showRestoreModalGlobal, setShowRestoreModalGlobal] = useState(false);

  const handleRestoreConversionsGlobal = async () => {
    try {
      macAudio.playSuccess();
      await saveConversionsBulk(SQLITE_CONTROL_CONVERSIONS, 'replace');
      setConversionsList(SQLITE_CONTROL_CONVERSIONS);
      window.dispatchEvent(new CustomEvent('billapp_conversions_updated'));
      toast.success('Defaults Restored', '56 default conversions restored successfully.');
      setShowRestoreModalGlobal(false);
    } catch (e: any) {
      toast.error('Failed to restore conversions');
    }
  };

  // Fetch true database state on mount and keep synced from SQLite backend (Port 5006)
  useEffect(() => {
    let isMounted = true;
    const loadAllDirectFromDb = () => {
      getControlGroups().then(dbGroups => {
        if (!isMounted) return;
        if (Array.isArray(dbGroups) && dbGroups.length > 0) {
          setGroups(dbGroups);
          if (!selectedGroupId) setSelectedGroupId(dbGroups[0]?.id || null);
        }
      }).catch(console.warn);

      getSkipItems().then(items => {
        if (isMounted && Array.isArray(items)) setSkipItemsList(items);
      }).catch(console.warn);

      getBillItemNames().then(items => {
        if (isMounted && Array.isArray(items)) setBillItemsList(items);
      }).catch(console.warn);

      getConversions().then(items => {
        if (isMounted && Array.isArray(items)) setConversionsList(items);
      }).catch(console.warn);
    };

    loadAllDirectFromDb();
    window.addEventListener('billapp_skip_items_updated', loadAllDirectFromDb);
    window.addEventListener('billapp_bill_maps_updated', loadAllDirectFromDb);
    window.addEventListener('billapp_conversions_updated', loadAllDirectFromDb);

    return () => {
      isMounted = false;
      window.removeEventListener('billapp_skip_items_updated', loadAllDirectFromDb);
      window.removeEventListener('billapp_bill_maps_updated', loadAllDirectFromDb);
      window.removeEventListener('billapp_conversions_updated', loadAllDirectFromDb);
    };
  }, []);

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
      const next = prev.map(g => {
        if (g.id === id) {
          const updated = { ...g, [field]: value };
          // Direct SQLite persistence
          saveControlGroup(updated).catch(console.error);
          return updated;
        }
        return g;
      });
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
    setGroups(prev => [newGroup, ...prev]);
    // Direct SQLite persistence
    saveControlGroup(newGroup).catch(console.error);
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
        // Direct SQLite bulk persistence
        saveControlGroupsBulk(next).catch(console.error);
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

  // Auto-scroll selected row into view instantly and set DOM focus
  useEffect(() => {
    if (selectedGroupId && rowRefs.current[selectedGroupId]) {
      const el = rowRefs.current[selectedGroupId];
      el.scrollIntoView({
        block: 'nearest',
        behavior: 'auto'
      });
      if (document.activeElement !== el && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName || '')) {
        el.focus({ preventScroll: true });
      }
    }
  }, [selectedGroupId]);

  const lastSoundRef = useRef<number>(0);
  const playNavSound = () => {
    const now = performance.now();
    if (now - lastSoundRef.current > 45) {
      lastSoundRef.current = now;
      macAudio.playHover();
    }
  };

  // Global Keyboard Navigation (Up/Down, Ctrl+Up/Ctrl+Down Shifting, Enter Edit, Delete Key)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // NumLock and Clear guards: never delete or disrupt UI
      if (e.key === 'NumLock' || e.code === 'NumLock' || e.key === 'Clear') {
        return;
      }

      if (groupToDelete) {
        if (e.key === 'Escape') setGroupToDelete(null);
        if (e.key === 'Enter') {
          e.preventDefault();
          const targetId = groupToDelete.id;
          setGroups(prev => {
            const next = prev.filter(g => g.id !== targetId);
            try {
              localStorage.setItem('modern_control_groups_data', JSON.stringify(next));
              localStorage.setItem('control_group_rules', JSON.stringify(next));
            } catch {}
            return next;
          });
          if (selectedGroupId === targetId) {
            setSelectedGroupId(null);
          }
          deleteControlGroup(targetId).catch(console.error);
          setGroupToDelete(null);
          macAudio.playClick();
        }
        return;
      }

      // If user is typing in an input
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        if (e.key === 'Delete' || e.key === 'Backspace') {
          return;
        }
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
          playNavSound();
          const nextIdx = currentIndex < filteredGroups.length - 1 ? currentIndex + 1 : currentIndex;
          setSelectedGroupId(filteredGroups[nextIdx].id);
          return;
        }

        // ArrowUp: Select Prev Row
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          playNavSound();
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

  const handleExportActiveTabCsv = async () => {
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
        let items: any[] = [];
        try {
          items = await getSkipItems();
        } catch {}
        if (!items || !items.length) {
          const savedItems = localStorage.getItem('billapp_skip_items');
          items = savedItems ? JSON.parse(savedItems) : SQLITE_SKIP_ITEMS;
        }

        let subs: any[] = [];
        try {
          subs = await getSkipSubGroups();
        } catch {}
        if (!subs || !subs.length) {
          const savedSubs = localStorage.getItem('billapp_skip_sub_groups');
          subs = savedSubs ? JSON.parse(savedSubs) : SQLITE_SKIP_SUB_GROUPS;
        }
        const subMap = new Map(subs.map((s: any) => [s.id, s.groupName || s.name || s.id]));

        const headers = ['SR NO', 'MAIN GROUP', 'GROUP NAME', 'ITEM NAME / PREFIX'];
        const rows = items.map((it: any, idx: number) => [
          idx + 1,
          it.mainGroup || 'General',
          it.groupName || subMap.get(it.subGroupId) || it.subGroupId || '',
          it.itemPrefix || it.name || ''
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

  const groupColumns: CsvColumnDef<GroupRule>[] = [
    { header: 'Group Name', key: 'groupName', sampleValue: 'BFP', required: true },
    { header: 'Group Index', key: 'groupIndex', sampleValue: 'G-101' },
    { header: 'Weight/Pc', key: 'weightPerPc', sampleValue: 0.85, transformImport: v => parseFloat(v) || 0 },
    { header: 'Pcs/Box', key: 'pcsPerBox', sampleValue: 1, transformImport: v => parseInt(v, 10) || 1 },
    { header: 'Multiplication', key: 'multiplication', sampleValue: 1.0, transformImport: v => parseFloat(v) || 1.0 },
    { header: 'Real Item Name', key: 'realItemName', sampleValue: 'BFP Gold Series Aluminium' },
    {
      header: 'Skip Eq',
      key: 'skipEq',
      sampleValue: 'FALSE',
      transformImport: v => String(v).toLowerCase() === 'true' || String(v).toLowerCase() === 'yes',
      formatExport: g => (g.skipEq ? 'TRUE' : 'FALSE')
    },
    { header: 'Chain Parent', key: 'chainParent', sampleValue: 'RAW-ALUM-6063' }
  ];

  const handleImportGroups = async (imported: Partial<GroupRule>[], mode: 'append' | 'replace') => {
    const formatted: GroupRule[] = imported.map((r, idx) => ({
      id: r.id || `grp-${Date.now() + idx}`,
      groupName: r.groupName || 'GROUP',
      groupIndex: r.groupIndex || `G-${100 + idx}`,
      weightPerPc: Number(r.weightPerPc) || 0,
      pcsPerBox: Number(r.pcsPerBox) || 1,
      multiplication: Number(r.multiplication) || 1,
      realItemName: r.realItemName || '',
      skipEq: Boolean(r.skipEq),
      chainParent: r.chainParent || 'NONE'
    }));

    const nextGroups = mode === 'replace' ? formatted : [...formatted, ...groups];
    setGroups(nextGroups);
    await saveControlGroupsBulk(nextGroups);
  };

  // Skip Items CSV Columns & Import
  const skipItemColumns: CsvColumnDef<any>[] = [
    {
      header: 'Main Group',
      key: 'mainGroup',
      sampleValue: 'Digital',
      required: false,
      transformImport: (val, raw) => {
        const rawMg = val || raw['Main Group'] || raw['MAIN GROUP'] || raw['mainGroup'] || raw['main_group'] || '';
        return String(rawMg).trim();
      }
    },
    {
      header: 'Group Name',
      key: 'groupName',
      sampleValue: 'B.F.P-(A)-(Digital)',
      required: true,
      transformImport: (val, raw) => {
        const rawGn = val || raw['Group Name'] || raw['GROUP NAME'] || raw['Sub Group'] || raw['SUB GROUP'] || raw['groupName'] || raw['subGroupId'] || '';
        return String(rawGn).trim();
      }
    },
    {
      header: 'Item Name / Prefix',
      key: 'itemPrefix',
      sampleValue: 'B.F.P-(A) 773',
      required: true,
      transformImport: (val, raw) => {
        const rawIn = val || raw['Item Name / Prefix'] || raw['ITEM NAME / PREFIX'] || raw['Item Name'] || raw['ITEM NAME'] || raw['itemPrefix'] || raw['Prefix'] || raw['name'] || '';
        return String(rawIn).trim();
      }
    },
    {
      header: 'Sum Col',
      key: 'sumColumn',
      sampleValue: 'QTY',
      required: false,
      transformImport: (val, raw) => {
        const rawSc = val || raw['Sum Col'] || raw['SUM COL'] || raw['Sum Column'] || raw['SUM COLUMN'] || raw['sumCol'] || raw['sumColumn'] || '';
        const sc = String(rawSc).trim().toUpperCase();
        if (sc === 'U CAP' || sc === 'UCAP') return 'U CAP';
        if (sc === 'L CAP' || sc === 'LCAP') return 'L CAP';
        return 'QTY';
      }
    }
  ];

  const handleImportSkipItems = async (imported: any[], mode: 'append' | 'replace') => {
    try {
      // 1. Fetch current subgroups, main groups, and skip items from DB
      let subGroups: any[] = [];
      let mainGroups: any[] = [];
      let existingItems: any[] = [];

      try {
        const [sgRes, mgRes, siRes] = await Promise.all([
          getSkipSubGroups(),
          getSkipMainGroups(),
          getSkipItems()
        ]);
        if (Array.isArray(sgRes)) subGroups = sgRes;
        if (Array.isArray(mgRes)) mainGroups = mgRes;
        if (Array.isArray(siRes)) existingItems = siRes;
      } catch (err) {
        console.warn('Error fetching skip data from sqlite:', err);
      }

      if (!subGroups.length) subGroups = SQLITE_SKIP_SUB_GROUPS;
      if (!mainGroups.length) mainGroups = SQLITE_SKIP_MAIN_GROUPS;
      if (!existingItems.length) existingItems = skipItemsList || [];

      // Maps for fast case-insensitive lookup
      const mainGroupMap = new Map<string, any>();
      mainGroups.forEach(mg => {
        if (mg.name) mainGroupMap.set(String(mg.name).trim().toLowerCase(), mg);
      });

      const subGroupMap = new Map<string, any>();
      subGroups.forEach(sg => {
        if (sg.groupName) subGroupMap.set(String(sg.groupName).trim().toLowerCase(), sg);
        if (sg.id) subGroupMap.set(String(sg.id).trim().toLowerCase(), sg);
      });

      const updatedMainGroups = [...mainGroups];
      const updatedSubGroups = [...subGroups];
      let newMainGroupsAdded = false;
      let newSubGroupsAdded = false;

      // 2. Process imported rows
      const newItems: any[] = [];
      const seenInImport = new Set<string>();

      imported.forEach((row, i) => {
        const rawPrefix = row.itemPrefix || row['Item Name / Prefix'] || row['ITEM NAME / PREFIX'] || row['Item Name'] || row['ITEM NAME'] || row.name || row['Prefix'] || row['item_prefix'] || '';
        const itemPrefix = String(rawPrefix).trim();
        if (!itemPrefix) return;

        const rawGroupName = row.groupName || row['Group Name'] || row['GROUP NAME'] || row['Sub Group'] || row['SUB GROUP'] || row.subGroup || row.subGroupId || '';
        const groupName = String(rawGroupName).trim() || 'General';
        const gnKey = groupName.toLowerCase();

        // Sum column resolution (default 'QTY')
        const rawSumCol = row.sumColumn || row.sumCol || row['Sum Col'] || row['SUM COL'] || row['Sum Column'] || row['SUM COLUMN'] || '';
        let sumColVal: 'QTY' | 'U CAP' | 'L CAP' = 'QTY';
        if (rawSumCol) {
          const scUpper = String(rawSumCol).trim().toUpperCase();
          if (scUpper === 'U CAP' || scUpper === 'UCAP') sumColVal = 'U CAP';
          else if (scUpper === 'L CAP' || scUpper === 'LCAP') sumColVal = 'L CAP';
          else sumColVal = 'QTY';
        }

        // Main group resolution
        const rawUserMg = row.mainGroup || row['Main Group'] || row['MAIN GROUP'] || row.mainGroup || row.main_group || '';
        const userMainGroup = String(rawUserMg).trim();

        let targetMgName = '';
        if (userMainGroup) {
          targetMgName = userMainGroup;
        } else if (subGroupMap.has(gnKey) && subGroupMap.get(gnKey).mainGroup) {
          targetMgName = subGroupMap.get(gnKey).mainGroup;
        } else if (gnKey.includes('digital-or-golden') || gnKey.includes('digital or golden')) {
          targetMgName = 'Digital or Golden';
        } else if (gnKey.includes('digital')) {
          targetMgName = 'Digital';
        } else if (gnKey.includes('7d uv sheet') || gnKey.includes('7d')) {
          targetMgName = '7D UV SHEET';
        } else {
          targetMgName = 'General';
        }

        // Auto-create Main Group if not existing
        let targetMg = mainGroupMap.get(targetMgName.toLowerCase());
        if (!targetMg) {
          targetMg = {
            id: `mg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            name: targetMgName
          };
          mainGroupMap.set(targetMgName.toLowerCase(), targetMg);
          updatedMainGroups.push(targetMg);
          newMainGroupsAdded = true;
        }

        // Auto-create Sub Group if not existing
        let targetSg = subGroupMap.get(gnKey);
        if (!targetSg) {
          const newSgId = `sg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
          targetSg = {
            id: newSgId,
            mainGroupId: targetMg.id,
            mainGroup: targetMg.name,
            groupName: groupName,
            sumColumn: sumColVal
          };
          subGroupMap.set(gnKey, targetSg);
          subGroupMap.set(newSgId.toLowerCase(), targetSg);
          updatedSubGroups.push(targetSg);
          newSubGroupsAdded = true;
        } else if (rawSumCol && targetSg.sumColumn !== sumColVal) {
          targetSg.sumColumn = sumColVal;
          newSubGroupsAdded = true;
        }

        const finalGroupName = targetSg.groupName || groupName;
        const dedupKey = `${finalGroupName.toLowerCase()}:::${itemPrefix.toLowerCase()}`;
        if (seenInImport.has(dedupKey)) return;
        seenInImport.add(dedupKey);

        newItems.push({
          id: row.id || `si_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 7)}`,
          subGroupId: targetSg.id,
          mainGroup: targetMg.name,
          groupName: finalGroupName,
          itemPrefix
        });
      });

      if (!newItems.length) {
        toast.error('No valid items found in import file. Please check column headers.');
        return;
      }

      // Persist newly discovered main groups or subgroups
      if (newMainGroupsAdded) {
        await saveSkipMainGroupsBulk(updatedMainGroups, 'replace');
      }
      if (newSubGroupsAdded) {
        await saveSkipSubGroupsBulk(updatedSubGroups, 'replace');
      }

      // Gather distinct groups present in this import file
      const importedGroupNames = new Set<string>();
      const importedSubGroupIds = new Set<string>();
      newItems.forEach(it => {
        if (it.groupName) importedGroupNames.add(it.groupName.trim().toLowerCase());
        if (it.subGroupId) importedSubGroupIds.add(it.subGroupId);
      });

      let finalItems: any[];
      if (mode === 'replace') {
        // REPLACE ONLY the groups present in the Excel file!
        // All other groups' items remain completely preserved!
        const preservedItems = existingItems.filter(it => {
          const itGrp = (it.groupName || '').trim().toLowerCase();
          const itSgId = it.subGroupId || '';
          const isReplaced = importedGroupNames.has(itGrp) || (itSgId && importedSubGroupIds.has(itSgId));
          return !isReplaced;
        });
        finalItems = [...preservedItems, ...newItems];
      } else {
        // APPEND: Add to existing items without adding duplicates to the same group
        const existingSet = new Set(
          existingItems.map(it => `${(it.groupName || '').trim().toLowerCase()}:::${(it.itemPrefix || it.name || '').trim().toLowerCase()}`)
        );
        const filteredNew = newItems.filter(it => !existingSet.has(`${it.groupName.toLowerCase()}:::${it.itemPrefix.toLowerCase()}`));
        finalItems = [...existingItems, ...filteredNew];
      }

      // 4. Save to SQLite DB bulk endpoint
      await saveSkipItemsBulk(finalItems, 'replace', Array.from(importedGroupNames));

      // 5. Update direct state
      setSkipItemsList(finalItems);

      // 6. Notify active tabs (SkipItemNameTab)
      window.dispatchEvent(new CustomEvent('billapp_skip_items_updated'));
      macAudio.playSuccess();
      if (mode === 'replace') {
        toast.success(`Successfully replaced items for ${importedGroupNames.size} group(s) with ${newItems.length} items (other groups preserved)!`);
      } else {
        toast.success(`Successfully appended ${newItems.length} items to ${importedGroupNames.size} group(s)!`);
      }
    } catch (e: any) {
      console.error('Import skip items error:', e);
      toast.error('Failed to import skip items: ' + (e?.message || String(e)));
    }
  };

  // Bill Items CSV Columns & Import
  const billItemColumns: CsvColumnDef<any>[] = [
    { header: 'Short Code', key: 'shortCode', sampleValue: 'AL-101', required: true },
    { header: 'Print Name', key: 'printName', sampleValue: 'Aluminium Section 6063 T6' },
    { header: 'Default Rate', key: 'defaultRate', sampleValue: 380, parser: v => Number(String(v).replace(/[^0-9.-]/g, '')) || 0 },
    { header: 'Category', key: 'category', sampleValue: 'ALUMINIUM' }
  ];

  const handleImportBillItems = async (imported: any[], mode: 'append' | 'replace') => {
    try {
      const current = mode === 'replace' ? [] : billItemsList;
      const newItems = imported.filter(x => (x.shortCode || x['Short Code'] || x.printName || x['Print Name'])).map((x, i) => {
        const code = String(x.shortCode || x['Short Code'] || x.printName || '').trim();
        const name = String(x.printName || x['Print Name'] || x.shortCode || '').trim();
        return {
          id: `map-${Date.now()}-${i}`,
          shortCode: code,
          printName: name,
          defaultRate: Number(x.defaultRate || x['Default Rate'] || 0) || 0,
          category: String(x.category || x['Category'] || 'GENERAL').trim()
        };
      });
      const merged = [...current, ...newItems];
      setBillItemsList(merged);
      await saveBillItemNamesBulk(merged, 'replace');
      window.dispatchEvent(new CustomEvent('billapp_bill_maps_updated'));
      macAudio.playSuccess();
      toast.success(`Successfully imported ${newItems.length} bill items!`);
    } catch (e: any) {
      console.error('Import bill items error:', e);
      toast.error('Failed to import bill items: ' + (e?.message || String(e)));
    }
  };

  // Conversions CSV Columns & Import
  const conversionColumns: CsvColumnDef<any>[] = [
    { header: 'Shortcut', key: 'shortcut', sampleValue: 'AL10', required: true },
    { header: 'Conversion / Mould', key: 'conversion', sampleValue: 'Aluminium Mould 10 FT', required: true },
    { header: 'Size', key: 'size', sampleValue: '10' },
    { header: 'U-Cap', key: 'u_cap', sampleValue: '2' },
    { header: 'L-Cap', key: 'l_cap', sampleValue: '2' },
    { header: 'Multiplication', key: 'multiplication', sampleValue: 1, parser: v => Number(v) || 1 },
    { header: 'Color', key: 'color', sampleValue: '#ffffff' },
    { header: 'Box Size', key: 'box_size', sampleValue: '10' },
    { header: 'Weight', key: 'weight', sampleValue: '2.5' },
    { header: 'Real Item Name', key: 'real_item_name', sampleValue: 'Aluminium Section' },
    { header: 'Group Name', key: 'group_name', sampleValue: 'PROFILES' }
  ];

  const handleImportConversions = (imported: any[], mode: 'append' | 'replace') => {
    try {
      const current = mode === 'replace' ? [] : conversionsList;
      const newItems = imported.filter(x => (x.shortcut && String(x.shortcut).trim()) || (x.conversion && String(x.conversion).trim())).map(x => ({
        shortcut: x.shortcut ? String(x.shortcut).trim() : '',
        conversion: x.conversion ? String(x.conversion).trim() : '',
        size: x.size || '',
        u_cap: Number(x.u_cap || x['u-cap']) || 0,
        l_cap: Number(x.l_cap || x['l-cap']) || 0,
        multiplication: Number(x.multiplication) || 1,
        color: x.color || '#ffffff',
        box_size: x.box_size || x['box size'] || '',
        weight: x.weight || '',
        real_item_name: x.real_item_name || x['real item name'] || '',
        group_name: x.group_name || x['group name'] || ''
      }));
      const merged = [...current, ...newItems];
      setConversionsList(merged);
      window.dispatchEvent(new CustomEvent('billapp_conversions_updated'));
      saveConversionsBulk(merged, mode).catch(err => console.error('Failed to sync imported conversions to SQLite:', err));
      macAudio.playSuccess();
    } catch (e) {
      console.error('Import conversions error:', e);
    }
  };

  const getActiveTabData = () => {
    if (activeTab === 'MANAGE_GROUPS') return groups;
    if (activeTab === 'SKIP_ITEM_NAME') {
      return (skipItemsList || []).map((it: any) => ({
        ...it,
        mainGroup: it.mainGroup || 'General',
        groupName: it.groupName || it.subGroupId || '',
        itemPrefix: it.itemPrefix || it.name || '',
        sumColumn: it.sumColumn || 'QTY'
      }));
    }
    if (activeTab === 'BILL_ITEM_NAME') return billItemsList || [];
    if (activeTab === 'MANAGE_CONVERSIONS') return conversionsList || [];
    return [];
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
              <Tooltip key={key} title={`Switch to ${label}`} side="bottom">
                <button
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
              </Tooltip>
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
          <Tooltip title={`Add ${getTabConfig(activeTab).addButtonText} (+)`} side="bottom">
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
          </Tooltip>

          {/* Universal Excel & CSV Data Center */}
          {activeTab === 'MANAGE_GROUPS' && (
            <ExcelCsvActions<GroupRule>
              entityName="Manage Groups"
              filenamePrefix="Control_Groups"
              columns={groupColumns}
              data={groups}
              onImport={handleImportGroups}
            />
          )}
          {activeTab === 'SKIP_ITEM_NAME' && (
            <ExcelCsvActions<any>
              entityName="Skip Item Names"
              filenamePrefix="Skip_Item_Names"
              columns={skipItemColumns}
              data={getActiveTabData()}
              onImport={handleImportSkipItems}
              replaceModeTitle="Replace (Imported Groups Only)"
              replaceModeDescription="Excel me jo Group Names hain, sirf unke items replace honge; baaki sabhi groups safe rahenge."
              appendModeDescription="Existing groups aur items ke sath naye items add honge."
              sampleRows={[
                { mainGroup: 'Digital', groupName: 'B.F.P-(A)-(Digital)', itemPrefix: 'B.F.P-(A) 773', sumColumn: 'QTY' },
                { mainGroup: 'Digital', groupName: 'B.F.P-(A)-(Digital)', itemPrefix: 'B.F.P-(A) 774', sumColumn: 'QTY' },
                { mainGroup: 'Digital or Golden', groupName: 'B.F.P-(A)-(Digital-or-Golden)', itemPrefix: 'B.F.P-(A) 101', sumColumn: 'QTY' },
                { mainGroup: 'General', groupName: 'HARDWARE', itemPrefix: 'Silicon Sealant Clear', sumColumn: 'QTY' }
              ]}
            />
          )}
          {activeTab === 'BILL_ITEM_NAME' && (
            <ExcelCsvActions<any>
              entityName="Bill Item Names"
              filenamePrefix="Bill_Item_Names"
              columns={billItemColumns}
              data={getActiveTabData()}
              onImport={handleImportBillItems}
            />
          )}
          {activeTab === 'MANAGE_CONVERSIONS' && (
            <>
              <Tooltip title="Restore 56 original conversions into database" side="bottom">
                <ShadcnButton
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowRestoreModalGlobal(true)}
                  style={{ height: '32px', fontSize: '12px', fontWeight: 600, gap: '5px', borderColor: '#3f3f46', color: '#e4e4e7' }}
                >
                  <RotateCcw size={13} />
                  Restore Defaults
                </ShadcnButton>
              </Tooltip>
              <ExcelCsvActions<any>
                entityName="Conversions Matrix"
                filenamePrefix="Control_Conversions"
                columns={conversionColumns}
                data={getActiveTabData()}
                onImport={handleImportConversions}
              />
            </>
          )}
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
          <Table
            containerStyle={{
              flex: 1,
              minHeight: 0,
              height: '100%',
              overflow: 'auto',
              borderRadius: '8px',
              border: '1px solid #27272a',
              background: '#09090b'
            }}
          >
            <TableHeader style={{ position: 'sticky', top: 0, zIndex: 10, background: '#18181b' }}>
              <TableRow style={{ borderBottom: '1px solid #27272a' }}>
                <TableHead style={{ width: `${colWidths.srNo}px`, textAlign: 'center', position: 'relative', userSelect: 'none' }}>
                  #
                  <div className="th-resizer" onMouseDown={(e) => startColResize('srNo', e)} title="Drag to resize column" />
                </TableHead>
                <TableHead style={{ width: `${colWidths.groupName}px`, textAlign: 'left', position: 'relative', userSelect: 'none' }}>
                  GROUP NAME
                  <div className="th-resizer" onMouseDown={(e) => startColResize('groupName', e)} title="Drag to resize column" />
                </TableHead>
                <TableHead style={{ width: `${colWidths.groupIndex}px`, textAlign: 'left', position: 'relative', userSelect: 'none' }}>
                  GROUP INDEX
                  <div className="th-resizer" onMouseDown={(e) => startColResize('groupIndex', e)} title="Drag to resize column" />
                </TableHead>
                <TableHead style={{ width: `${colWidths.weightPerPc}px`, textAlign: 'right', position: 'relative', userSelect: 'none' }}>
                  WEIGHT/PC
                  <div className="th-resizer" onMouseDown={(e) => startColResize('weightPerPc', e)} title="Drag to resize column" />
                </TableHead>
                <TableHead style={{ width: `${colWidths.pcsPerBox}px`, textAlign: 'center', position: 'relative', userSelect: 'none' }}>
                  PCS/BOX
                  <div className="th-resizer" onMouseDown={(e) => startColResize('pcsPerBox', e)} title="Drag to resize column" />
                </TableHead>
                <TableHead style={{ width: `${colWidths.multiplication}px`, textAlign: 'center', position: 'relative', userSelect: 'none' }}>
                  MULT.
                  <div className="th-resizer" onMouseDown={(e) => startColResize('multiplication', e)} title="Drag to resize column" />
                </TableHead>
                <TableHead style={{ width: `${colWidths.realItemName}px`, textAlign: 'left', position: 'relative', userSelect: 'none' }}>
                  REAL ITEM NAME
                  <div className="th-resizer" onMouseDown={(e) => startColResize('realItemName', e)} title="Drag to resize column" />
                </TableHead>
                <TableHead style={{ width: `${colWidths.skipEq}px`, textAlign: 'center', position: 'relative', userSelect: 'none' }}>
                  SKIP
                  <div className="th-resizer" onMouseDown={(e) => startColResize('skipEq', e)} title="Drag to resize column" />
                </TableHead>
                <TableHead style={{ width: `${colWidths.chainParent}px`, textAlign: 'left', position: 'relative', userSelect: 'none' }}>
                  CHAIN PARENT
                  <div className="th-resizer" onMouseDown={(e) => startColResize('chainParent', e)} title="Drag to resize column" />
                </TableHead>
                <TableHead style={{ width: '65px', textAlign: 'center', position: 'relative', userSelect: 'none' }}>
                  ACTION
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredGroups.map((grp, idx) => {
                const isSelected = selectedGroupId === grp.id;
                const isEditing = editingGroupId === grp.id;
                const cellInput: React.CSSProperties = {
                  width: '100%',
                  background: '#18181b',
                  border: '1px solid #3f3f46',
                  outline: 'none',
                  color: '#f4f4f5',
                  fontSize: '12px',
                  padding: '2px 6px',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  borderRadius: '4px',
                  fontWeight: 500
                };
                const cellText: React.CSSProperties = {
                  padding: '3px 8px',
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
                  <TableRow
                    key={grp.id}
                    ref={el => { rowRefs.current[grp.id] = el; }}
                    isSelected={isSelected}
                    tabIndex={isSelected ? 0 : -1}
                    style={{
                      height: `${activeRowHeight}px`,
                      background: isSelected
                        ? 'rgba(56, 189, 248, 0.16)'
                        : idx % 2 === 0
                        ? 'rgba(24, 24, 27, 0.4)'
                        : 'transparent',
                      outline: isSelected ? '2px solid rgba(56, 189, 248, 0.75)' : 'none',
                      outlineOffset: '-2px',
                      boxShadow: isSelected ? 'inset 0 0 0 1px rgba(56, 189, 248, 0.3)' : 'none',
                      cursor: 'pointer'
                    }}
                    onClick={() => setSelectedGroupId(grp.id)}
                    onDoubleClick={() => setEditingGroupId(grp.id)}
                  >
                    <TableCell style={{ textAlign: 'center', color: '#71717a', fontSize: '11px', userSelect: 'none', padding: '3px 4px' }}>
                      {idx + 1}
                    </TableCell>
                    <TableCell style={{ padding: '2px 4px' }}>
                      {isEditing ? (
                        <input style={{ ...cellInput, fontWeight: 600 }} value={grp.groupName} onChange={e => handleCellChange(grp.id, 'groupName', e.target.value)} autoFocus />
                      ) : (
                        <span style={{ ...cellText, fontWeight: 600 }}>{grp.groupName}</span>
                      )}
                    </TableCell>
                    <TableCell style={{ padding: '2px 4px' }}>
                      {isEditing ? (
                        <input style={{ ...cellInput, fontWeight: 600 }} value={grp.groupIndex} onChange={e => handleCellChange(grp.id, 'groupIndex', e.target.value)} />
                      ) : (
                        <span style={{ ...cellText, fontWeight: 600, color: '#a1a1aa' }}>{grp.groupIndex}</span>
                      )}
                    </TableCell>
                    <TableCell style={{ padding: '2px 4px' }}>
                      {isEditing ? (
                        <input type="number" step="any" style={{ ...cellInput, textAlign: 'right' }} value={grp.weightPerPc} onChange={e => handleCellChange(grp.id, 'weightPerPc', parseFloat(e.target.value) || 0)} />
                      ) : (
                        <span style={{ ...cellText, textAlign: 'right' }}>{grp.weightPerPc}</span>
                      )}
                    </TableCell>
                    <TableCell style={{ padding: '2px 4px' }}>
                      {isEditing ? (
                        <input type="number" style={{ ...cellInput, textAlign: 'center' }} value={grp.pcsPerBox} onChange={e => handleCellChange(grp.id, 'pcsPerBox', parseInt(e.target.value, 10) || 1)} />
                      ) : (
                        <span style={{ ...cellText, textAlign: 'center' }}>{grp.pcsPerBox}</span>
                      )}
                    </TableCell>
                    <TableCell style={{ padding: '2px 4px' }}>
                      {isEditing ? (
                        <input type="number" step="any" style={{ ...cellInput, textAlign: 'center' }} value={grp.multiplication} onChange={e => handleCellChange(grp.id, 'multiplication', parseFloat(e.target.value) || 1)} />
                      ) : (
                        <span style={{ ...cellText, textAlign: 'center' }}>{grp.multiplication}</span>
                      )}
                    </TableCell>
                    <TableCell style={{ padding: '2px 4px' }}>
                      {isEditing ? (
                        <input style={cellInput} value={grp.realItemName} onChange={e => handleCellChange(grp.id, 'realItemName', e.target.value)} />
                      ) : (
                        <span style={{ ...cellText, color: grp.realItemName ? '#f4f4f5' : '#52525b' }}>{grp.realItemName || '—'}</span>
                      )}
                    </TableCell>
                    <TableCell style={{ textAlign: 'center', padding: '2px' }}>
                      <input
                        type="checkbox"
                        checked={grp.skipEq}
                        disabled={!isEditing}
                        onChange={e => handleCellChange(grp.id, 'skipEq', e.target.checked)}
                        style={{ cursor: isEditing ? 'pointer' : 'default', accentColor: '#38bdf8', width: '14px', height: '14px' }}
                      />
                    </TableCell>
                    <TableCell style={{ padding: '2px 4px' }}>
                      {isEditing ? (
                        <input style={cellInput} value={grp.chainParent} onChange={e => handleCellChange(grp.id, 'chainParent', e.target.value)} />
                      ) : (
                        <span style={{ ...cellText, color: grp.chainParent === 'NONE' ? '#52525b' : '#f4f4f5' }}>{grp.chainParent}</span>
                      )}
                    </TableCell>
                    <TableCell style={{ textAlign: 'center', padding: '2px 4px' }}>
                      {isEditing ? (
                        <Tooltip title="Save Group" side="left">
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); macAudio.playSuccess(); setEditingGroupId(null); }}
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: '4px',
                              padding: '2px 10px', height: '22px', borderRadius: '4px',
                              background: '#f4f4f5', color: '#09090b',
                              border: 'none', fontSize: '11px', fontWeight: 600,
                              cursor: 'pointer', margin: '0 auto'
                            }}
                          >
                            <Check size={11} /> Save
                          </button>
                        </Tooltip>
                      ) : (
                        <Tooltip title="Delete Group" side="left">
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleDeleteGroup(grp.id); }}
                            style={{
                              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                              width: '24px', height: '24px', borderRadius: '4px',
                              background: 'transparent', color: '#71717a',
                              border: '1px solid transparent', cursor: 'pointer',
                              transition: 'all 0.12s ease'
                            }}
                            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#ef4444'; (e.currentTarget as HTMLButtonElement).style.borderColor = '#3f3f46'; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#71717a'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'transparent'; }}
                          >
                            <Trash2 size={12} />
                          </button>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
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
            const targetId = groupToDelete.id;
            setGroups(prev => {
              const next = prev.filter(g => g.id !== targetId);
              return next;
            });
            if (selectedGroupId === targetId) {
              setSelectedGroupId(null);
            }
            deleteControlGroup(targetId).catch(console.error);
            setGroupToDelete(null);
            macAudio.playSuccess();
          }}
          onCancel={() => setGroupToDelete(null)}
        />
      )}

      {/* Restore Defaults Global Confirmation Modal */}
      {showRestoreModalGlobal && (
        <UnsavedChangesModal
          titleText="Restore Default Conversions?"
          descText="Kya aap default conversions (56 original rules) restore karna chahte hain? Database me default conversions replace ho jayengi."
          discardLabel="Haan, Restore Karo"
          onDiscard={handleRestoreConversionsGlobal}
          onCancel={() => setShowRestoreModalGlobal(false)}
        />
      )}
    </div>
  );
};

export default ControlPanelView;

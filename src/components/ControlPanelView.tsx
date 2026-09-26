import React, { useState, useEffect, useRef } from 'react';
import { ManageConversionsTab } from './ManageConversionsTab';
import { SkipItemNameTab } from './SkipItemNameTab';
import { BillItemNameTab } from './BillItemNameTab';
import { macAudio } from '../utils/macAudio';
import { useSettings } from '../context/SettingsContext';
import { GlassInput, GlassSelect } from './common/GlassInput';
import {
  Plus,
  Trash2,
  X,
  Check,
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
  GitBranch
} from 'lucide-react';

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
    macAudio.playPop();
    setGroups(prev => {
      const next = prev.filter(g => g.id !== id);
      try { localStorage.setItem('control_group_rules', JSON.stringify(next)); } catch {}
      return next;
    });
    if (selectedGroupId === id) {
      setSelectedGroupId(null);
      setEditingGroupId(null);
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

  // Active Groups list
  const filteredGroups = groups;

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

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, gap: '8px', overflow: 'hidden' }}>
      {/* ========================================================================= */}
      {/* TOP CONTROL BAR: CLEAN CUBE TAB BUTTONS & QUICK ACTIONS (NO CLUTTER)     */}
      {/* ========================================================================= */}
      <div 
        className="glass-panel" 
        style={{ 
          padding: '6px 10px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          borderRadius: '8px'
        }}
      >
                  {/* Animated iOS Tab Buttons */}
          <div style={{ position: 'relative', flex: 1, display: 'flex' }}>
            <style>{`
              .cc-ios-tabs__control {
                position: relative;
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                align-items: center;
                width: 600px;
                padding: 5px;
                border-radius: 999px;
                background: rgba(0, 0, 0, 0.4);
                box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.05), 0 2px 8px rgba(0, 0, 0, 0.2);
                backdrop-filter: blur(12px);
                -webkit-backdrop-filter: blur(12px);
              }
              .cc-ios-tabs__thumb {
                position: absolute;
                top: 5px;
                left: 5px;
                width: calc(25% - 4px);
                height: calc(100% - 10px);
                border-radius: 999px;
                background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
                box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2), 0 8px 20px rgba(14, 165, 233, 0.2);
                transition: transform 420ms cubic-bezier(0.22, 1, 0.36, 1);
                will-change: transform;
              }
              .cc-ios-tabs__item {
                position: relative;
                z-index: 1;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 6px;
                height: 32px;
                border-radius: 999px;
                color: #94a3b8;
                font-size: 11.5px;
                font-weight: 700;
                line-height: 1;
                cursor: pointer;
                user-select: none;
                transition: color 260ms ease;
              }
              .cc-ios-tabs__item:hover { color: #f8fafc; }
              .cc-ios-tabs__item.active { color: #ffffff; }
            `}</style>
            
            <div className="cc-ios-tabs__control">
              <div 
                className="cc-ios-tabs__thumb" 
                style={{ 
                  transform: `translateX(${
                    activeTab === 'MANAGE_GROUPS' ? 0 : 
                    activeTab === 'SKIP_ITEM_NAME' ? 100 : 
                    activeTab === 'BILL_ITEM_NAME' ? 200 : 
                    300
                  }%)` 
                }} 
              />
              {(
                [
                  { key: 'MANAGE_GROUPS', label: 'MANAGE GROUPS', icon: Layers },
                  { key: 'SKIP_ITEM_NAME', label: 'SKIP ITEM', icon: Shuffle },
                  { key: 'BILL_ITEM_NAME', label: 'BILL ITEM', icon: Tag },
                  { key: 'MANAGE_CONVERSIONS', label: 'CONVERSIONS', icon: SlidersHorizontal }
                ] as const
              ).map(tab => {
                const isActive = activeTab === tab.key;
                const Icon = tab.icon;
                return (
                  <div
                    key={tab.key}
                    onClick={() => { macAudio.playClick(); setActiveTab(tab.key); }}
                    onMouseEnter={() => macAudio.playHover()}
                    className={`cc-ios-tabs__item ${isActive ? 'active' : ''}`}
                  >
                    <Icon size={14} />
                    <span>{tab.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Action: + ADD GROUP for Manage Groups tab */}
        {activeTab === 'MANAGE_GROUPS' && (
          <button
            type="button"
            onClick={handleAddNewGroup}
            onMouseEnter={() => macAudio.playHover()}
            className="mac-btn primary"
            style={{
              fontSize: '11px',
              fontWeight: 700,
              padding: '5px 14px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Plus size={14} />
            <span>ADD GROUP</span>
          </button>
        )}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: MANAGE GROUPS                                                      */}
      {/* ========================================================================= */}
      {activeTab === 'MANAGE_GROUPS' && (
        <div 
          className="tab-content-anim" 
          style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, gap: '8px' }}
          onPaste={handleGroupPaste}
        >
          {/* GROUPS DATA TABLE */}
          <div className="glass-panel" style={{ flex: 1, minHeight: 0, overflow: 'auto', borderRadius: '8px', padding: '6px' }}>
            <table className="apple-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ width: `${colWidths.srNo}px`, textAlign: 'center', position: 'relative', userSelect: 'none' }}>
                    #
                    <div className="th-resizer" onMouseDown={(e) => startColResize('srNo', e)} title="Drag to resize column" />
                  </th>
                  <th style={{ width: `${colWidths.groupName}px`, position: 'relative', userSelect: 'none' }}>
                    GROUP NAME
                    <div className="th-resizer" onMouseDown={(e) => startColResize('groupName', e)} title="Drag to resize column" />
                  </th>
                  <th style={{ width: `${colWidths.groupIndex}px`, position: 'relative', userSelect: 'none' }}>
                    GROUP INDEX
                    <div className="th-resizer" onMouseDown={(e) => startColResize('groupIndex', e)} title="Drag to resize column" />
                  </th>
                  <th style={{ width: `${colWidths.weightPerPc}px`, textAlign: 'right', position: 'relative', userSelect: 'none' }}>
                    WEIGHT/PC (KGS)
                    <div className="th-resizer" onMouseDown={(e) => startColResize('weightPerPc', e)} title="Drag to resize column" />
                  </th>
                  <th style={{ width: `${colWidths.pcsPerBox}px`, textAlign: 'center', position: 'relative', userSelect: 'none' }}>
                    PCS PER BOX
                    <div className="th-resizer" onMouseDown={(e) => startColResize('pcsPerBox', e)} title="Drag to resize column" />
                  </th>
                  <th style={{ width: `${colWidths.multiplication}px`, textAlign: 'center', position: 'relative', userSelect: 'none' }}>
                    MULTIPLICATION
                    <div className="th-resizer" onMouseDown={(e) => startColResize('multiplication', e)} title="Drag to resize column" />
                  </th>
                  <th style={{ width: `${colWidths.realItemName}px`, position: 'relative', userSelect: 'none' }}>
                    REAL ITEM NAME
                    <div className="th-resizer" onMouseDown={(e) => startColResize('realItemName', e)} title="Drag to resize column" />
                  </th>
                  <th style={{ width: `${colWidths.skipEq}px`, textAlign: 'center', position: 'relative', userSelect: 'none' }}>
                    SKIP EQ
                    <div className="th-resizer" onMouseDown={(e) => startColResize('skipEq', e)} title="Drag to resize column" />
                  </th>
                  <th style={{ width: `${colWidths.chainParent}px`, position: 'relative', userSelect: 'none' }}>
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
                  const cellInputStyle: React.CSSProperties = {
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.25)',
                    outline: 'none',
                    color: '#ffffff',
                    fontSize: '11.5px',
                    padding: '3px 6px',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    borderRadius: '4px'
                  };
                  const cellTextStyle: React.CSSProperties = {
                    padding: '3px 6px',
                    display: 'block',
                    userSelect: 'text',
                    color: '#ffffff',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  };
                  return (
                    <tr
                      key={grp.id}
                      className={`mac-table-row ${isSelected ? 'selected' : ''}`}
                      style={{ height: `${activeRowHeight}px` }}
                      onClick={() => setSelectedGroupId(grp.id)}
                      onDoubleClick={() => setEditingGroupId(grp.id)}
                    >
                      <td style={{ textAlign: 'center', color: '#64748b', fontSize: '11px', userSelect: 'none' }}>
                        {idx + 1}
                      </td>
                      <td style={{ padding: '1px' }}>
                        {isEditing ? (
                          <input
                            style={{ ...cellInputStyle, fontWeight: 600, color: '#ffffff' }}
                            value={grp.groupName}
                            onChange={e => handleCellChange(grp.id, 'groupName', e.target.value)}
                            autoFocus
                          />
                        ) : (
                          <span style={{ ...cellTextStyle, fontWeight: 600, color: '#ffffff' }}>{grp.groupName}</span>
                        )}
                      </td>
                      <td style={{ padding: '1px' }}>
                        {isEditing ? (
                          <input
                            style={{ ...cellInputStyle, fontWeight: 600, color: '#ffffff' }}
                            value={grp.groupIndex}
                            onChange={e => handleCellChange(grp.id, 'groupIndex', e.target.value)}
                          />
                        ) : (
                          <span style={{ ...cellTextStyle, fontWeight: 600, color: '#ffffff' }}>{grp.groupIndex}</span>
                        )}
                      </td>
                      <td style={{ padding: '1px' }}>
                        {isEditing ? (
                          <input
                            type="number"
                            step="any"
                            style={{ ...cellInputStyle, textAlign: 'right', fontWeight: 600, color: '#ffffff' }}
                            value={grp.weightPerPc}
                            onChange={e => handleCellChange(grp.id, 'weightPerPc', parseFloat(e.target.value) || 0)}
                          />
                        ) : (
                          <span style={{ ...cellTextStyle, textAlign: 'right', fontWeight: 600, color: '#ffffff' }}>{grp.weightPerPc}</span>
                        )}
                      </td>
                      <td style={{ padding: '1px' }}>
                        {isEditing ? (
                          <input
                            type="number"
                            style={{ ...cellInputStyle, textAlign: 'center', color: '#ffffff', fontWeight: 600 }}
                            value={grp.pcsPerBox}
                            onChange={e => handleCellChange(grp.id, 'pcsPerBox', parseInt(e.target.value, 10) || 1)}
                          />
                        ) : (
                          <span style={{ ...cellTextStyle, textAlign: 'center', color: '#ffffff', fontWeight: 600 }}>{grp.pcsPerBox}</span>
                        )}
                      </td>
                      <td style={{ padding: '1px' }}>
                        {isEditing ? (
                          <input
                            type="number"
                            step="any"
                            style={{ ...cellInputStyle, textAlign: 'center', color: '#ffffff', fontWeight: 600 }}
                            value={grp.multiplication}
                            onChange={e => handleCellChange(grp.id, 'multiplication', parseFloat(e.target.value) || 1)}
                          />
                        ) : (
                          <span style={{ ...cellTextStyle, textAlign: 'center', color: '#ffffff', fontWeight: 600 }}>{grp.multiplication}</span>
                        )}
                      </td>
                      <td style={{ padding: '1px' }}>
                        {isEditing ? (
                          <input
                            style={{ ...cellInputStyle, color: '#ffffff', fontWeight: 500 }}
                            value={grp.realItemName}
                            onChange={e => handleCellChange(grp.id, 'realItemName', e.target.value)}
                          />
                        ) : (
                          <span style={{ ...cellTextStyle, color: '#ffffff', fontWeight: 500 }}>{grp.realItemName || '-'}</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center', padding: '2px' }}>
                        <input
                          type="checkbox"
                          checked={grp.skipEq}
                          disabled={!isEditing}
                          onChange={e => handleCellChange(grp.id, 'skipEq', e.target.checked)}
                          style={{ cursor: isEditing ? 'pointer' : 'default', accentColor: '#ffffff' }}
                        />
                      </td>
                      <td style={{ padding: '1px' }}>
                        {isEditing ? (
                          <input
                            style={{ ...cellInputStyle, color: '#ffffff' }}
                            value={grp.chainParent}
                            onChange={e => handleCellChange(grp.id, 'chainParent', e.target.value)}
                          />
                        ) : (
                          <span style={{ ...cellTextStyle, color: grp.chainParent === 'NONE' ? '#94a3b8' : '#ffffff' }}>{grp.chainParent}</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center', padding: '1px' }}>
                        {isEditing ? (
                          <button
                            type="button"
                            className="mac-btn primary"
                            style={{ padding: '2px 8px', height: '22px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '3px', margin: '0 auto' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              macAudio.playSuccess();
                              setEditingGroupId(null);
                            }}
                            title="Add / Save Group"
                          >
                            <Plus size={12} /> Add
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div style={{ height: '36px' }} />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: SKIP ITEM NAME */}
      {/* ========================================================================= */}
      {activeTab === 'SKIP_ITEM_NAME' && (
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <SkipItemNameTab />
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: BILL ITEM NAME */}
      {/* ========================================================================= */}
      {activeTab === 'BILL_ITEM_NAME' && (
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <BillItemNameTab />
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: MANAGE CONVERSIONS */}
      {/* ========================================================================= */}
      {activeTab === 'MANAGE_CONVERSIONS' && (
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <ManageConversionsTab />
        </div>
      )}



      {/* ========================================================================= */}
      {/* DELETE CONFIRMATION DIALOG (TRIGGERED VIA "DELETE" KEY) */}
      {/* ========================================================================= */}
      {groupToDelete && (
        <div className="mac-modal-backdrop" onClick={() => setGroupToDelete(null)}>
          <div
            className="mac-modal-card glass-panel"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '380px',
              maxWidth: '90vw',
              borderRadius: '12px',
              padding: '18px 20px',
              background: 'linear-gradient(135deg, rgba(20, 10, 15, 0.96) 0%, rgba(10, 5, 10, 0.98) 100%)',
              border: '1px solid rgba(248, 113, 113, 0.4)',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8), 0 0 24px rgba(248, 113, 113, 0.2)',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(248, 113, 113, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Trash2 size={16} color="#f87171" />
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc' }}>Delete Group Configuration?</div>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                  Group: <strong style={{ color: '#f87171' }}>{groupToDelete.groupName}</strong> ({groupToDelete.groupIndex})
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '10px' }}>
              <button
                type="button"
                onClick={() => setGroupToDelete(null)}
                className="mac-btn"
                style={{ padding: '5px 14px', fontSize: '11px', fontWeight: 600 }}
              >
                Cancel (Esc)
              </button>
              <button
                type="button"
                onClick={() => {
                  setGroups(prev => prev.filter(g => g.id !== groupToDelete.id));
                  if (selectedGroupId === groupToDelete.id) {
                    setSelectedGroupId(null);
                  }
                  setGroupToDelete(null);
                  macAudio.playClick();
                }}
                className="mac-btn danger"
                style={{ padding: '5px 16px', fontSize: '11px', fontWeight: 700 }}
                autoFocus
              >
                Yes, Delete (Enter)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ControlPanelView;

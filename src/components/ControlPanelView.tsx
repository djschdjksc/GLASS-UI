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

  // Modal Form State (Apple macOS Animated Dialog)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [groupToDelete, setGroupToDelete] = useState<GroupRule | null>(null);

  // Form Fields
  const [formData, setFormData] = useState<Omit<GroupRule, 'id'>>({
    groupName: '',
    groupIndex: '',
    weightPerPc: 1.0,
    pcsPerBox: 1,
    multiplication: 1.0,
    realItemName: '',
    skipEq: false,
    chainParent: 'NONE'
  });

  const openAddModal = () => {
    macAudio.playClick();
    setEditingGroupId(null);
    setFormData({
      groupName: '',
      groupIndex: `G-${101 + groups.length}`,
      weightPerPc: 1.0,
      pcsPerBox: 1,
      multiplication: 1.0,
      realItemName: '',
      skipEq: false,
      chainParent: 'NONE'
    });
    setIsModalOpen(true);
  };

  const openEditModal = (grp: GroupRule) => {
    macAudio.playClick();
    setEditingGroupId(grp.id);
    setFormData({
      groupName: grp.groupName,
      groupIndex: grp.groupIndex,
      weightPerPc: grp.weightPerPc,
      pcsPerBox: grp.pcsPerBox,
      multiplication: grp.multiplication,
      realItemName: grp.realItemName,
      skipEq: grp.skipEq,
      chainParent: grp.chainParent
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    macAudio.playClick();
    setIsModalOpen(false);
    setEditingGroupId(null);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.groupName.trim() || !formData.groupIndex.trim()) {
      macAudio.playBeep();
      return;
    }

    if (editingGroupId) {
      setGroups(prev =>
        prev.map(g => (g.id === editingGroupId ? { ...g, ...formData } : g))
      );
    } else {
      const newGroup: GroupRule = {
        id: `grp-${Date.now()}`,
        ...formData
      };
      setGroups(prev => [newGroup, ...prev]);
      setSelectedGroupId(newGroup.id);
    }

    macAudio.playSuccess();
    setIsModalOpen(false);
    setEditingGroupId(null);
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
      // If modal or delete dialog is open, handle esc
      if (isModalOpen) {
        if (e.key === 'Escape') closeModal();
        return;
      }
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

      // Ignore if user is typing in search input
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
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

        // Enter: Open Edit Modal on Selected Row
        if (e.key === 'Enter') {
          e.preventDefault();
          if (currentIndex >= 0) {
            openEditModal(filteredGroups[currentIndex]);
          }
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
  }, [activeTab, filteredGroups, selectedGroupId, groups, isModalOpen, groupToDelete]);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, gap: '8px' }}>
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
            onClick={openAddModal}
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
        <div className="tab-content-anim" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, gap: '8px' }}>
          {/* GROUPS DATA TABLE (EXACT 8 COLUMNS - NO EXTRA ACTIONS COLUMN) */}
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
                </tr>
              </thead>
              <tbody>
                {filteredGroups.map((grp) => {
                  const isSelected = selectedGroupId === grp.id;
                  return (
                    <tr
                      key={grp.id}
                      ref={el => { rowRefs.current[grp.id] = el; }}
                      className={`mac-table-row ${isSelected ? 'selected' : ''}`}
                      style={{ height: `${activeRowHeight}px` }}
                      onMouseEnter={() => macAudio.playHover()}
                      onClick={() => {
                        macAudio.playClick();
                        setSelectedGroupId(grp.id);
                      }}
                      onDoubleClick={() => openEditModal(grp)}
                    >
                      <td style={{ fontWeight: 700, color: '#38bdf8', position: 'relative' }}>
                        {grp.groupName}
                        <div className="row-resizer" onMouseDown={handleRowResizeMouseDown} title="Drag to resize ALL row heights" />
                      </td>
                      <td style={{ fontFamily: 'monospace', fontWeight: 600, color: '#fbbf24' }}>
                        {grp.groupIndex}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 600, color: '#34d399' }}>
                        {grp.weightPerPc.toFixed(2)} kg
                      </td>
                      <td style={{ textAlign: 'center', color: '#e2e8f0', fontWeight: 600 }}>
                        {grp.pcsPerBox} pcs
                      </td>
                      <td style={{ textAlign: 'center', color: '#a78bfa', fontWeight: 700 }}>
                        {grp.multiplication.toFixed(2)}x
                      </td>
                      <td style={{ color: '#f8fafc', fontWeight: 500 }}>
                        {grp.realItemName}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span
                          style={{
                            fontSize: '9.5px',
                            fontWeight: 700,
                            padding: '2px 7px',
                            borderRadius: '4px',
                            background: grp.skipEq ? 'rgba(248, 113, 113, 0.2)' : 'rgba(52, 211, 153, 0.2)',
                            color: grp.skipEq ? '#f87171' : '#34d399'
                          }}
                        >
                          {grp.skipEq ? 'YES' : 'NO'}
                        </span>
                      </td>
                      <td style={{ color: grp.chainParent === 'NONE' ? '#64748b' : '#38bdf8', fontFamily: 'monospace' }}>
                        {grp.chainParent}
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
      {activeTab === 'SKIP_ITEM_NAME' && <SkipItemNameTab />}

      {/* ========================================================================= */}
      {/* TAB 3: BILL ITEM NAME */}
      {/* ========================================================================= */}
      {activeTab === 'BILL_ITEM_NAME' && <BillItemNameTab />}

      {/* ========================================================================= */}
      {/* TAB 4: MANAGE CONVERSIONS */}
      {/* ========================================================================= */}
      {activeTab === 'MANAGE_CONVERSIONS' && <ManageConversionsTab />}

      {/* ========================================================================= */}
      {/* APPLE MACOS ANIMATED MODAL FORM (TRIGGERED VIA "+ ADD GROUP" OR "ENTER") */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="mac-modal-backdrop" onClick={closeModal}>
          <div
            className="mac-modal-card glass-panel"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '580px',
              maxWidth: '94vw',
              borderRadius: '12px',
              padding: '18px 22px',
              background: 'linear-gradient(135deg, rgba(13, 21, 38, 0.96) 0%, rgba(8, 14, 26, 0.98) 100%)',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.85), 0 0 24px rgba(56, 189, 248, 0.15)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
          >
            {/* Modal Title Bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: 'rgba(56, 189, 248, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(56, 189, 248, 0.4)' }}>
                  <Layers size={15} color="#38bdf8" />
                </div>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc', letterSpacing: '0.04em' }}>
                  {editingGroupId ? 'EDIT GROUP CONFIGURATION' : 'ADD NEW GROUP CONFIGURATION'}
                </span>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="mac-btn"
                style={{ width: '26px', height: '26px', padding: 0, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={13} color="#94a3b8" />
              </button>
            </div>

            {/* Modal Form with Notched Border Headers & Icons */}
            <form onSubmit={handleSaveForm} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Row 1: Group Name & Group Index */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '12px' }}>
                {/* 1. Group Name */}
                <GlassInput
                  label="GROUP NAME *"
                  value={formData.groupName}
                  onChange={(e) => setFormData({ ...formData, groupName: e.target.value.toUpperCase() })}
                  icon={Layers}
                  required
                  inputStyle={{ fontWeight: 700, color: '#38bdf8' }}
                />

                {/* 2. Group Index */}
                <GlassInput
                  label="GROUP INDEX *"
                  value={formData.groupIndex}
                  onChange={(e) => setFormData({ ...formData, groupIndex: e.target.value.toUpperCase() })}
                  icon={Hash}
                  required
                  inputStyle={{ fontFamily: 'monospace', fontWeight: 700, color: '#fbbf24' }}
                />
              </div>

              {/* Row 2: Weight/PC, Pcs Per Box, Multiplication */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr 1.1fr', gap: '12px' }}>
                {/* 3. Weight / PC */}
                <GlassInput
                  label="WEIGHT / PC (KGS) *"
                  type="number"
                  step="0.01"
                  required
                  value={formData.weightPerPc}
                  onChange={(e) => setFormData({ ...formData, weightPerPc: parseFloat(e.target.value) || 0 })}
                  icon={Scale}
                  inputStyle={{ color: '#34d399', fontWeight: 700 }}
                />

                {/* 4. Pcs Per Box */}
                <GlassInput
                  label="PCS PER BOX *"
                  type="number"
                  required
                  value={formData.pcsPerBox}
                  onChange={(e) => setFormData({ ...formData, pcsPerBox: parseInt(e.target.value) || 1 })}
                  icon={Package}
                  inputStyle={{ fontWeight: 600, color: '#ffffff' }}
                />

                {/* 5. Multiplication */}
                <GlassInput
                  label="MULTIPLICATION *"
                  type="number"
                  step="0.05"
                  required
                  value={formData.multiplication}
                  onChange={(e) => setFormData({ ...formData, multiplication: parseFloat(e.target.value) || 1.0 })}
                  icon={Percent}
                  inputStyle={{ color: '#a78bfa', fontWeight: 700 }}
                />
              </div>

              {/* Row 3: Real Item Name */}
              <GlassInput
                label="REAL ITEM NAME *"
                value={formData.realItemName}
                onChange={(e) => setFormData({ ...formData, realItemName: e.target.value })}
                icon={FileText}
                required
                inputStyle={{ color: '#f8fafc', fontWeight: 500 }}
              />

              {/* Row 4: Skip Eq & Chain Parent */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: '12px' }}>
                {/* 7. Skip Equation */}
                <GlassSelect
                  label="SKIP EQUATION (SKIP EQ)"
                  value={formData.skipEq ? 'YES' : 'NO'}
                  onChange={(e) => setFormData({ ...formData, skipEq: e.target.value === 'YES' })}
                  icon={Filter}
                >
                  <option value="NO">NO</option>
                  <option value="YES">YES</option>
                </GlassSelect>

                {/* 8. Chain Parent */}
                <GlassInput
                  label="CHAIN PARENT"
                  value={formData.chainParent}
                  onChange={(e) => setFormData({ ...formData, chainParent: e.target.value.toUpperCase() })}
                  icon={GitBranch}
                  inputStyle={{ fontFamily: 'monospace', color: formData.chainParent === 'NONE' ? '#64748b' : '#38bdf8' }}
                />
              </div>

              {/* Actions Ribbon */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '14px' }}>
                <button
                  type="button"
                  onClick={closeModal}
                  className="mac-btn"
                  style={{ padding: '6px 14px', fontSize: '11.5px', fontWeight: 600 }}
                >
                  Cancel (Esc)
                </button>
                <button
                  type="submit"
                  className="mac-btn primary"
                  style={{ padding: '6px 18px', fontSize: '11.5px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Check size={14} />
                  <span>{editingGroupId ? 'Update Group' : 'Save Group'}</span>
                </button>
              </div>
            </form>
          </div>
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

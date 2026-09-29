import React, { useState, useEffect } from 'react';
import { macAudio } from '../utils/macAudio';
import {
  Plus, Trash2, Check, RotateCcw, Search,
  Tag, Layers, ChevronRight, Filter, X, Edit3, Save
} from 'lucide-react';
import { SQLITE_SKIP_MAIN_GROUPS, SQLITE_SKIP_SUB_GROUPS, SQLITE_SKIP_ITEMS } from '../data/sqliteSkipData';
import type { SkipMainGroupSeed, SkipSubGroupSeed, SkipItemSeed } from '../data/sqliteSkipData';

// Group color palette — cycles per main group
const GROUP_PALETTE = [
  { accent: '#38bdf8', dim: 'rgba(56,189,248,0.12)', text: '#0ea5e9' },
  { accent: '#a78bfa', dim: 'rgba(167,139,250,0.12)', text: '#8b5cf6' },
  { accent: '#34d399', dim: 'rgba(52,211,153,0.12)', text: '#10b981' },
  { accent: '#fb923c', dim: 'rgba(251,146,60,0.12)',  text: '#f97316' },
  { accent: '#f472b6', dim: 'rgba(244,114,182,0.12)', text: '#ec4899' },
  { accent: '#facc15', dim: 'rgba(250,204,21,0.12)',  text: '#eab308' },
  { accent: '#60a5fa', dim: 'rgba(96,165,250,0.12)',  text: '#3b82f6' },
  { accent: '#4ade80', dim: 'rgba(74,222,128,0.12)',  text: '#22c55e' },
];

export interface SkipItemNameTabProps {
  search?: string;
  onAddRef?: React.MutableRefObject<(() => void) | null>;
}

export const SkipItemNameTab: React.FC<SkipItemNameTabProps> = ({
  search: externalSearch,
  onAddRef
}) => {
  const [mainGroups, setMainGroups] = useState<SkipMainGroupSeed[]>([]);
  const [subGroups, setSubGroups] = useState<SkipSubGroupSeed[]>([]);
  const [skipItems, setSkipItems] = useState<SkipItemSeed[]>([]);

  const [selectedMainGroupId, setSelectedMainGroupId] = useState<string | null>(null);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [internalItemSearch, setInternalItemSearch] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupMain, setNewGroupMain] = useState('');
  const [newItemPrefix, setNewItemPrefix] = useState('');
  const [addingGroup, setAddingGroup] = useState(false);
  const [addingItem, setAddingItem] = useState(false);

  const itemSearch = externalSearch !== undefined ? externalSearch : internalItemSearch;

  const purgeAndLoadPristineBackup = () => {
    try {
      ['billapp_skip_items','billapp_skip_sub_groups','billapp_skip_main_groups',
       'si_main_groups','si_sub_groups','si_items','si_skip_items'].forEach(k => localStorage.removeItem(k));
    } catch {}
    setMainGroups(SQLITE_SKIP_MAIN_GROUPS);
    setSubGroups(SQLITE_SKIP_SUB_GROUPS);
    setSkipItems(SQLITE_SKIP_ITEMS);
    try {
      localStorage.setItem('billapp_skip_main_groups', JSON.stringify(SQLITE_SKIP_MAIN_GROUPS));
      localStorage.setItem('billapp_skip_sub_groups', JSON.stringify(SQLITE_SKIP_SUB_GROUPS));
      localStorage.setItem('billapp_skip_items', JSON.stringify(SQLITE_SKIP_ITEMS));
      localStorage.setItem('billapp_skip_version_v5', 'true');
    } catch {}
    if (SQLITE_SKIP_SUB_GROUPS.length > 0) setSelectedMainGroupId(SQLITE_SKIP_SUB_GROUPS[0].id);
    macAudio.playPop();
  };

  useEffect(() => {
    try {
      const isClean = localStorage.getItem('billapp_skip_version_v5');
      if (!isClean) { purgeAndLoadPristineBackup(); return; }
      const savedMain = localStorage.getItem('billapp_skip_main_groups');
      const savedSub  = localStorage.getItem('billapp_skip_sub_groups');
      const savedItems = localStorage.getItem('billapp_skip_items');
      if (savedMain && savedSub && savedItems) {
        setMainGroups(JSON.parse(savedMain));
        const loadedSubs = JSON.parse(savedSub);
        setSubGroups(loadedSubs);
        setSkipItems(JSON.parse(savedItems));
        if (loadedSubs.length > 0) setSelectedMainGroupId(prev => prev || loadedSubs[0].id);
      } else { purgeAndLoadPristineBackup(); }
    } catch { purgeAndLoadPristineBackup(); }
  }, []);

  const saveSubGroups = (data: SkipSubGroupSeed[]) => {
    setSubGroups(data);
    try { localStorage.setItem('billapp_skip_sub_groups', JSON.stringify(data)); } catch {}
  };
  const saveSkipItems = (data: SkipItemSeed[]) => {
    setSkipItems(data);
    try { localStorage.setItem('billapp_skip_items', JSON.stringify(data)); } catch {}
  };

  // Commit new group
  const handleCommitNewGroup = () => {
    if (!newGroupName.trim()) { setAddingGroup(false); return; }
    const mg = mainGroups.find(m => m.name === newGroupMain) || mainGroups[0];
    const newId = 'sg-' + Date.now();
    const newSg: SkipSubGroupSeed = {
      id: newId,
      mainGroupId: mg?.id || 'mg-1',
      mainGroup: mg?.name || newGroupMain,
      groupName: newGroupName.trim().toUpperCase(),
      sumColumn: 'QTY'
    };
    const next = [newSg, ...subGroups];
    saveSubGroups(next);
    setSelectedMainGroupId(newId);
    setNewGroupName('');
    setNewGroupMain('');
    setAddingGroup(false);
    macAudio.playSuccess();
  };

  // Commit new item
  const handleCommitNewItem = () => {
    if (!newItemPrefix.trim() || !selectedMainGroupId) { setAddingItem(false); return; }
    const curSub = subGroups.find(s => s.id === selectedMainGroupId);
    const newId = 'si-' + Date.now();
    const newItem: SkipItemSeed = {
      id: newId,
      subGroupId: selectedMainGroupId,
      mainGroup: curSub?.mainGroup || '',
      groupName: curSub?.groupName || '',
      itemPrefix: newItemPrefix.trim()
    };
    const next = [newItem, ...skipItems];
    saveSkipItems(next);
    setNewItemPrefix('');
    setAddingItem(false);
    macAudio.playSuccess();
  };

  const handleDeleteSubGroup = (id: string) => {
    macAudio.playPop();
    const next = subGroups.filter(sg => sg.id !== id);
    saveSubGroups(next);
    if (selectedMainGroupId === id) setSelectedMainGroupId(next[0]?.id || null);
  };

  const handleDeleteItem = (id: string) => {
    macAudio.playPop();
    saveSkipItems(skipItems.filter(si => si.id !== id));
    if (selectedItemId === id) setSelectedItemId(null);
  };

  const handleItemChange = (id: string, newPrefix: string) => {
    saveSkipItems(skipItems.map(si => si.id === id ? { ...si, itemPrefix: newPrefix } : si));
  };

  const handleItemPaste = (e: React.ClipboardEvent) => {
    if (!selectedMainGroupId) return;
    const text = e.clipboardData.getData('text');
    if (!text || (!text.includes('\n') && !text.includes('\t'))) return;
    e.preventDefault();
    macAudio.playSuccess();
    const curSub = subGroups.find(s => s.id === selectedMainGroupId);
    const lines = text.trim().split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    const newItems: SkipItemSeed[] = lines.map((line, idx) => ({
      id: 'si-' + (Date.now() + idx),
      subGroupId: selectedMainGroupId,
      mainGroup: curSub?.mainGroup || '',
      groupName: curSub?.groupName || '',
      itemPrefix: line.split('\t')[0].trim()
    }));
    if (newItems.length > 0) saveSkipItems([...newItems, ...skipItems]);
  };

  useEffect(() => {
    if (onAddRef) {
      onAddRef.current = () => {
        if (selectedMainGroupId) setAddingItem(true);
        else setAddingGroup(true);
      };
    }
  }, [onAddRef, selectedMainGroupId]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT','TEXTAREA','SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        if (e.key === 'Escape') { setEditingGroupId(null); setEditingItemId(null); setAddingGroup(false); setAddingItem(false); }
        return;
      }
      if (e.key === 'Escape') { setEditingGroupId(null); setEditingItemId(null); setSelectedItemId(null); }
      if (e.key === 'Delete') {
        if (selectedItemId) handleDeleteItem(selectedItemId);
        else if (selectedMainGroupId) handleDeleteSubGroup(selectedMainGroupId);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedMainGroupId, selectedItemId, subGroups, skipItems]);

  const curSub = subGroups.find(s => s.id === selectedMainGroupId);
  const itemsForSelectedGroup = curSub
    ? skipItems.filter(si => si.subGroupId === curSub.id || (si.groupName === curSub.groupName && (!si.mainGroup || si.mainGroup === curSub.mainGroup)))
    : [];
  const filteredItems = itemsForSelectedGroup.filter(si =>
    si.itemPrefix.toLowerCase().includes(itemSearch.toLowerCase())
  );
  const filteredSubGroups = subGroups.filter(sg => {
    if (!itemSearch.trim()) return true;
    const q = itemSearch.toLowerCase();
    return (sg.groupName||'').toLowerCase().includes(q) ||
      (sg.mainGroup||'').toLowerCase().includes(q) ||
      skipItems.some(si =>
        (si.subGroupId === sg.id || (si.groupName === sg.groupName && (!si.mainGroup || si.mainGroup === sg.mainGroup))) &&
        (si.itemPrefix||'').toLowerCase().includes(q)
      );
  });

  // Build a color index keyed by mainGroup name
  const mainGroupColorIdx: Record<string,number> = {};
  mainGroups.forEach((mg, i) => { mainGroupColorIdx[mg.name] = i % GROUP_PALETTE.length; });

  const getColor = (mainGroupName: string) =>
    GROUP_PALETTE[mainGroupColorIdx[mainGroupName] ?? 0];

  return (
    <div style={{
      flex: 1, display: 'flex', gap: '0', height: '100%', minHeight: 0,
      overflow: 'hidden', borderRadius: '14px',
      border: '1px solid rgba(255,255,255,0.08)',
      background: 'rgba(9,9,11,0.6)',
      backdropFilter: 'blur(24px)',
      boxShadow: '0 8px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)'
    }}>

      {/* ═══════════════════════════════════════════════
          LEFT SIDEBAR — Apple Notes style group list
      ═══════════════════════════════════════════════ */}
      <div style={{
        width: '240px', flexShrink: 0,
        display: 'flex', flexDirection: 'column',
        borderRight: '1px solid rgba(255,255,255,0.07)',
        background: 'rgba(0,0,0,0.25)',
        minHeight: 0, overflow: 'hidden'
      }}>
        {/* Sidebar Header */}
        <div style={{
          padding: '14px 14px 10px',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '28px', height: '28px', borderRadius: '8px',
                background: 'linear-gradient(135deg, #38bdf8, #8b5cf6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(56,189,248,0.3)'
              }}>
                <Layers size={14} color="#fff" />
              </div>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.01em' }}>
                  SKIP GROUPS
                </div>
                <div style={{ fontSize: '9px', color: '#64748b', fontWeight: 500 }}>
                  {subGroups.length} configured
                </div>
              </div>
            </div>
            <button
              onClick={() => { macAudio.playClick(); setAddingGroup(true); }}
              title="Add Group"
              style={{
                width: '26px', height: '26px', borderRadius: '8px',
                background: 'rgba(56,189,248,0.12)', border: '1px solid rgba(56,189,248,0.25)',
                color: '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', flexShrink: 0
              }}
            >
              <Plus size={13} />
            </button>
          </div>

          {/* Search bar */}
          {externalSearch === undefined && (
            <div style={{ position: 'relative' }}>
              <Search size={12} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
              <input
                type="text"
                placeholder="Search groups & items..."
                value={internalItemSearch}
                onChange={e => setInternalItemSearch(e.target.value)}
                style={{
                  width: '100%', background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px',
                  padding: '5px 8px 5px 26px', fontSize: '11px',
                  color: '#cbd5e1', outline: 'none', boxSizing: 'border-box'
                }}
              />
              {internalItemSearch && (
                <button onClick={() => setInternalItemSearch('')}
                  style={{ position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#475569', padding: '2px' }}>
                  <X size={11} />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Add Group inline form */}
        {addingGroup && (
          <div style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(56,189,248,0.06)', flexShrink: 0 }}>
            <div style={{ fontSize: '10px', fontWeight: 700, color: '#38bdf8', marginBottom: '6px', letterSpacing: '0.05em' }}>
              NEW GROUP
            </div>
            <select
              value={newGroupMain}
              onChange={e => setNewGroupMain(e.target.value)}
              style={{
                width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.12)',
                color: '#e2e8f0', fontSize: '10.5px', borderRadius: '6px', padding: '4px 6px',
                marginBottom: '6px', outline: 'none', boxSizing: 'border-box'
              }}
            >
              <option value="">— Main Group —</option>
              {mainGroups.map(m => <option key={m.id} value={m.name} style={{ background: '#0f172a' }}>{m.name}</option>)}
            </select>
            <input
              autoFocus
              type="text"
              placeholder="Group name (e.g. WIRE)"
              value={newGroupName}
              onChange={e => setNewGroupName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleCommitNewGroup(); if (e.key === 'Escape') { setAddingGroup(false); setNewGroupName(''); } }}
              style={{
                width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(56,189,248,0.4)',
                color: '#f8fafc', fontSize: '11px', borderRadius: '6px', padding: '5px 8px',
                marginBottom: '8px', outline: 'none', boxSizing: 'border-box'
              }}
            />
            <div style={{ display: 'flex', gap: '6px' }}>
              <button onClick={handleCommitNewGroup}
                style={{ flex: 1, background: 'linear-gradient(135deg, #0ea5e9, #6366f1)', border: 'none', color: '#fff', borderRadius: '6px', fontSize: '11px', fontWeight: 700, padding: '5px 0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                <Check size={12} /> Save
              </button>
              <button onClick={() => { setAddingGroup(false); setNewGroupName(''); }}
                style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', borderRadius: '6px', fontSize: '11px', fontWeight: 600, padding: '5px 0', cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Group list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 8px' }}>
          {filteredSubGroups.map((sg) => {
            const isActive = selectedMainGroupId === sg.id;
            const itemCount = skipItems.filter(si =>
              si.subGroupId === sg.id || (si.groupName === sg.groupName && (!si.mainGroup || si.mainGroup === sg.mainGroup))
            ).length;
            const col = getColor(sg.mainGroup);
            return (
              <div
                key={sg.id}
                onClick={() => { macAudio.playClick(); setSelectedMainGroupId(sg.id); setSelectedItemId(null); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '8px 10px', borderRadius: '10px', cursor: 'pointer',
                  marginBottom: '3px',
                  background: isActive ? col.dim : 'transparent',
                  border: isActive ? `1px solid ${col.accent}30` : '1px solid transparent',
                  transition: 'all 0.15s ease',
                  position: 'relative'
                }}
              >
                {/* Color dot */}
                <div style={{
                  width: '8px', height: '8px', borderRadius: '50%',
                  background: col.accent, flexShrink: 0,
                  boxShadow: isActive ? `0 0 6px ${col.accent}` : 'none',
                  transition: 'box-shadow 0.2s'
                }} />

                {/* Name */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: '11.5px', fontWeight: 700,
                    color: isActive ? col.accent : '#cbd5e1',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    letterSpacing: '0.01em'
                  }}>
                    {sg.groupName}
                  </div>
                  <div style={{ fontSize: '9.5px', color: '#475569', fontWeight: 500 }}>
                    {sg.mainGroup} · {sg.sumColumn}
                  </div>
                </div>

                {/* Count badge */}
                <div style={{
                  background: isActive ? col.accent : 'rgba(255,255,255,0.08)',
                  color: isActive ? '#09090b' : '#94a3b8',
                  fontSize: '9px', fontWeight: 800, borderRadius: '6px',
                  padding: '1px 6px', flexShrink: 0, minWidth: '20px', textAlign: 'center'
                }}>
                  {itemCount}
                </div>

                {/* Delete button — shows on hover via CSS */}
                {isActive && (
                  <button
                    onClick={e => { e.stopPropagation(); handleDeleteSubGroup(sg.id); }}
                    title="Delete Group"
                    style={{
                      background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)',
                      color: '#f87171', borderRadius: '6px', width: '22px', height: '22px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', flexShrink: 0
                    }}
                  >
                    <Trash2 size={11} />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Sidebar Footer */}
        <div style={{ padding: '10px 12px', borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
          <button
            onClick={() => { if (window.confirm('Reset all groups to default backup?')) purgeAndLoadPristineBackup(); }}
            style={{
              width: '100%', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
              color: '#fca5a5', borderRadius: '8px', padding: '6px 0',
              fontSize: '10.5px', fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
            }}
          >
            <RotateCcw size={12} /> Reset to Backup
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════
          RIGHT PANEL — Item card list
      ═══════════════════════════════════════════════ */}
      <div
        style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}
        onPaste={handleItemPaste}
      >
        {curSub ? (
          <>
            {/* Panel Header */}
            <div style={{
              padding: '14px 18px 12px',
              borderBottom: '1px solid rgba(255,255,255,0.07)',
              flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: 'rgba(0,0,0,0.15)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {/* Active group color indicator */}
                <div style={{
                  width: '36px', height: '36px', borderRadius: '10px',
                  background: getColor(curSub.mainGroup).dim,
                  border: `1.5px solid ${getColor(curSub.mainGroup).accent}40`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Tag size={16} color={getColor(curSub.mainGroup).accent} />
                </div>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em' }}>
                    {curSub.groupName}
                  </div>
                  <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ color: getColor(curSub.mainGroup).text }}>{curSub.mainGroup}</span>
                    <span>·</span>
                    <span>Sum: <b style={{ color: '#94a3b8' }}>{curSub.sumColumn}</b></span>
                    <span>·</span>
                    <span style={{ color: '#38bdf8', fontWeight: 700 }}>{itemsForSelectedGroup.length} items</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ fontSize: '9.5px', color: '#475569', fontStyle: 'italic' }}>
                  Ctrl+V to paste from Excel
                </div>
                <button
                  onClick={() => { macAudio.playClick(); setAddingItem(true); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    background: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
                    border: 'none', color: '#fff', borderRadius: '9px',
                    padding: '7px 14px', fontSize: '11.5px', fontWeight: 700,
                    cursor: 'pointer', boxShadow: '0 2px 12px rgba(14,165,233,0.35)',
                    letterSpacing: '0.01em'
                  }}
                >
                  <Plus size={14} /> Add Item
                </button>
              </div>
            </div>

            {/* Add Item Inline Form */}
            {addingItem && (
              <div style={{
                padding: '12px 18px', borderBottom: '1px solid rgba(255,255,255,0.07)',
                background: 'rgba(14,165,233,0.05)', flexShrink: 0,
                display: 'flex', alignItems: 'center', gap: '10px'
              }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '8px',
                  background: 'rgba(14,165,233,0.15)', border: '1px solid rgba(14,165,233,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  <Tag size={14} color="#38bdf8" />
                </div>
                <input
                  autoFocus
                  type="text"
                  placeholder="Item prefix (e.g. COPPER WIRE)"
                  value={newItemPrefix}
                  onChange={e => setNewItemPrefix(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleCommitNewItem(); if (e.key === 'Escape') { setAddingItem(false); setNewItemPrefix(''); } }}
                  style={{
                    flex: 1, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(14,165,233,0.4)',
                    color: '#f8fafc', fontSize: '12px', borderRadius: '8px',
                    padding: '7px 12px', outline: 'none', fontWeight: 600
                  }}
                />
                <button onClick={handleCommitNewItem}
                  style={{ background: 'linear-gradient(135deg, #0ea5e9, #6366f1)', border: 'none', color: '#fff', borderRadius: '8px', padding: '7px 16px', fontSize: '11.5px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Check size={13} /> Save
                </button>
                <button onClick={() => { setAddingItem(false); setNewItemPrefix(''); }}
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', borderRadius: '8px', padding: '7px 12px', fontSize: '11.5px', fontWeight: 600, cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            )}

            {/* Items List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
              {filteredItems.length === 0 ? (
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  height: '100%', gap: '12px', color: '#334155'
                }}>
                  <Tag size={36} strokeWidth={1} />
                  <div style={{ fontSize: '13px', fontWeight: 600 }}>No items in this group</div>
                  <div style={{ fontSize: '11px', color: '#1e293b' }}>Click "Add Item" or paste from Excel (Ctrl+V)</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {filteredItems.map((si, idx) => {
                    const isSelected = selectedItemId === si.id;
                    const isEditing = editingItemId === si.id;
                    const col = getColor(curSub.mainGroup);
                    return (
                      <div
                        key={si.id}
                        onClick={() => { setSelectedItemId(si.id); }}
                        onDoubleClick={() => setEditingItemId(si.id)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '12px',
                          padding: '9px 14px', borderRadius: '10px', cursor: 'pointer',
                          background: isSelected ? col.dim : 'rgba(255,255,255,0.02)',
                          border: isSelected
                            ? `1px solid ${col.accent}35`
                            : '1px solid rgba(255,255,255,0.05)',
                          transition: 'all 0.12s ease'
                        }}
                      >
                        {/* Index */}
                        <span style={{
                          fontSize: '10px', color: '#334155', fontWeight: 600,
                          width: '22px', textAlign: 'right', flexShrink: 0, fontFamily: 'monospace'
                        }}>
                          {idx + 1}
                        </span>

                        {/* Color pill */}
                        <div style={{
                          width: '5px', height: '28px', borderRadius: '3px',
                          background: isSelected ? col.accent : 'rgba(255,255,255,0.1)',
                          flexShrink: 0, transition: 'background 0.2s'
                        }} />

                        {/* Item text / edit input */}
                        {isEditing ? (
                          <input
                            autoFocus
                            type="text"
                            value={si.itemPrefix}
                            onChange={e => handleItemChange(si.id, e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter' || e.key === 'Escape') {
                                macAudio.playSuccess();
                                setEditingItemId(null);
                              }
                            }}
                            onClick={e => e.stopPropagation()}
                            style={{
                              flex: 1, background: 'rgba(0,0,0,0.4)',
                              border: `1px solid ${col.accent}60`,
                              color: '#f8fafc', fontSize: '12px', fontWeight: 700,
                              borderRadius: '7px', padding: '4px 10px', outline: 'none'
                            }}
                          />
                        ) : (
                          <span style={{
                            flex: 1, fontSize: '12px', fontWeight: 700,
                            color: isSelected ? col.accent : '#e2e8f0',
                            letterSpacing: '0.01em',
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                          }}>
                            {si.itemPrefix || '—'}
                          </span>
                        )}

                        {/* Action icons */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                          {isEditing ? (
                            <button
                              onClick={e => { e.stopPropagation(); macAudio.playSuccess(); setEditingItemId(null); }}
                              style={{ background: col.dim, border: `1px solid ${col.accent}40`, color: col.accent, borderRadius: '6px', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                            >
                              <Check size={12} />
                            </button>
                          ) : isSelected ? (
                            <>
                              <button
                                onClick={e => { e.stopPropagation(); setEditingItemId(si.id); }}
                                title="Edit (double-click)"
                                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', borderRadius: '6px', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                              >
                                <Edit3 size={11} />
                              </button>
                              <button
                                onClick={e => { e.stopPropagation(); handleDeleteItem(si.id); }}
                                title="Delete"
                                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', borderRadius: '6px', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                              >
                                <Trash2 size={11} />
                              </button>
                            </>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <div style={{ height: '40px' }} />
            </div>
          </>
        ) : (
          /* Empty state */
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: '14px',
            color: '#1e293b'
          }}>
            <div style={{
              width: '60px', height: '60px', borderRadius: '18px',
              background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <ChevronRight size={28} color="#38bdf8" strokeWidth={1.5} />
            </div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#334155' }}>Select a group</div>
            <div style={{ fontSize: '11px', color: '#1e293b' }}>Choose a skip group from the left panel</div>
          </div>
        )}
      </div>
    </div>
  );
};

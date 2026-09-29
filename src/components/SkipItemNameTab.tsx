import React, { useState, useEffect } from 'react';
import { macAudio } from '../utils/macAudio';
import {
  Plus, Trash2, Check, RotateCcw, Layers, Tag
} from 'lucide-react';
import { SQLITE_SKIP_MAIN_GROUPS, SQLITE_SKIP_SUB_GROUPS, SQLITE_SKIP_ITEMS } from '../data/sqliteSkipData';
import type { SkipMainGroupSeed, SkipSubGroupSeed, SkipItemSeed } from '../data/sqliteSkipData';

const DEFAULT_MAIN_COLS = { srNo: 35, mainGroup: 140, groupName: 200, sumCol: 85, items: 50, actions: 40 };
const DEFAULT_SUB_COLS  = { srNo: 40, itemName: 320, actions: 40 };

// Per-main-group accent colors
const GROUP_COLORS = [
  '#38bdf8', '#a78bfa', '#34d399', '#fb923c',
  '#f472b6', '#facc15', '#60a5fa', '#4ade80',
];

export interface SkipItemNameTabProps {
  search?: string;
  onAddRef?: React.MutableRefObject<(() => void) | null>;
}

export const SkipItemNameTab: React.FC<SkipItemNameTabProps> = ({
  search: externalSearch,
  onAddRef
}) => {
  const [mainGroups, setMainGroups]   = useState<SkipMainGroupSeed[]>([]);
  const [subGroups, setSubGroups]     = useState<SkipSubGroupSeed[]>([]);
  const [skipItems, setSkipItems]     = useState<SkipItemSeed[]>([]);

  const [selectedMainGroupId, setSelectedMainGroupId] = useState<string | null>(null);
  const [editingGroupId, setEditingGroupId]           = useState<string | null>(null);
  const [selectedItemId, setSelectedItemId]           = useState<string | null>(null);
  const [editingItemId, setEditingItemId]             = useState<string | null>(null);
  const [internalItemSearch, setInternalItemSearch]   = useState('');
  const itemSearch = externalSearch !== undefined ? externalSearch : internalItemSearch;

  const [colWidths]    = useState(DEFAULT_MAIN_COLS);
  const [subColWidths] = useState(DEFAULT_SUB_COLS);

  /* ─── seed / restore ─── */
  const purgeAndLoadPristineBackup = () => {
    try {
      ['billapp_skip_items','billapp_skip_sub_groups','billapp_skip_main_groups',
       'si_main_groups','si_sub_groups','si_items','si_skip_items']
        .forEach(k => localStorage.removeItem(k));
    } catch {}
    setMainGroups(SQLITE_SKIP_MAIN_GROUPS);
    setSubGroups(SQLITE_SKIP_SUB_GROUPS);
    setSkipItems(SQLITE_SKIP_ITEMS);
    try {
      localStorage.setItem('billapp_skip_main_groups', JSON.stringify(SQLITE_SKIP_MAIN_GROUPS));
      localStorage.setItem('billapp_skip_sub_groups',  JSON.stringify(SQLITE_SKIP_SUB_GROUPS));
      localStorage.setItem('billapp_skip_items',       JSON.stringify(SQLITE_SKIP_ITEMS));
      localStorage.setItem('billapp_skip_version_v5',  'true');
    } catch {}
    if (SQLITE_SKIP_SUB_GROUPS.length > 0) setSelectedMainGroupId(SQLITE_SKIP_SUB_GROUPS[0].id);
    macAudio.playPop();
  };

  useEffect(() => {
    try {
      if (!localStorage.getItem('billapp_skip_version_v5')) { purgeAndLoadPristineBackup(); return; }
      const sm = localStorage.getItem('billapp_skip_main_groups');
      const ss = localStorage.getItem('billapp_skip_sub_groups');
      const si = localStorage.getItem('billapp_skip_items');
      if (sm && ss && si) {
        setMainGroups(JSON.parse(sm));
        const ls = JSON.parse(ss);
        setSubGroups(ls);
        setSkipItems(JSON.parse(si));
        if (ls.length > 0) setSelectedMainGroupId(prev => prev || ls[0].id);
      } else purgeAndLoadPristineBackup();
    } catch { purgeAndLoadPristineBackup(); }
  }, []);

  const saveSubGroups = (d: SkipSubGroupSeed[]) => {
    setSubGroups(d);
    try { localStorage.setItem('billapp_skip_sub_groups', JSON.stringify(d)); } catch {}
  };
  const saveSkipItems = (d: SkipItemSeed[]) => {
    setSkipItems(d);
    try { localStorage.setItem('billapp_skip_items', JSON.stringify(d)); } catch {}
  };

  /* ─── handlers ─── */
  const handleSubGroupChange = (id: string, field: keyof SkipSubGroupSeed, value: any) => {
    const updated = subGroups.map(sg => {
      if (sg.id !== id) return sg;
      const next = { ...sg, [field]: value };
      if (field === 'mainGroup') {
        const mg = mainGroups.find(m => m.name === value || m.id === value);
        if (mg) next.mainGroupId = mg.id;
      }
      return next;
    });
    saveSubGroups(updated);
  };

  const handleAddSubGroup = () => {
    macAudio.playClick();
    const newId  = 'sg-' + Date.now();
    const mg     = mainGroups[0];
    const newSg: SkipSubGroupSeed = {
      id: newId, mainGroupId: mg?.id || 'mg-1',
      mainGroup: mg?.name || 'General', groupName: 'NEW-GROUP', sumColumn: 'QTY'
    };
    const next = [newSg, ...subGroups];
    saveSubGroups(next);
    setSelectedMainGroupId(newId);
    setEditingGroupId(newId);
  };

  const handleDeleteSubGroup = (id: string) => {
    macAudio.playPop();
    const next = subGroups.filter(sg => sg.id !== id);
    saveSubGroups(next);
    if (selectedMainGroupId === id) { setSelectedMainGroupId(next[0]?.id || null); setEditingGroupId(null); }
  };

  const handleItemChange = (id: string, v: string) =>
    saveSkipItems(skipItems.map(si => si.id === id ? { ...si, itemPrefix: v } : si));

  const handleAddItem = () => {
    if (!selectedMainGroupId) return;
    macAudio.playClick();
    const curSub = subGroups.find(s => s.id === selectedMainGroupId);
    const newId  = 'si-' + Date.now();
    const newItem: SkipItemSeed = {
      id: newId, subGroupId: selectedMainGroupId,
      mainGroup: curSub?.mainGroup || '', groupName: curSub?.groupName || '', itemPrefix: ''
    };
    const next = [newItem, ...skipItems];
    saveSkipItems(next);
    setSelectedItemId(newId);
    setEditingItemId(newId);
  };

  const handleDeleteItem = (id: string) => {
    macAudio.playPop();
    saveSkipItems(skipItems.filter(si => si.id !== id));
    if (selectedItemId === id) { setSelectedItemId(null); setEditingItemId(null); }
  };

  const handleItemPaste = (e: React.ClipboardEvent) => {
    if (!selectedMainGroupId) return;
    const text = e.clipboardData.getData('text');
    if (!text || (!text.includes('\n') && !text.includes('\t'))) return;
    e.preventDefault();
    macAudio.playSuccess();
    const curSub = subGroups.find(s => s.id === selectedMainGroupId);
    const lines  = text.trim().split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
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
        if (selectedMainGroupId) handleAddItem();
        else handleAddSubGroup();
      };
    }
  }, [onAddRef, selectedMainGroupId, subGroups, skipItems, mainGroups]);

  /* ─── keyboard ─── */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isInput = ['INPUT','TEXTAREA','SELECT'].includes((e.target as HTMLElement)?.tagName);
      if (isInput) {
        if (e.key === 'Enter') {
          e.preventDefault();
          macAudio.playSuccess();
          setEditingGroupId(null);
          setEditingItemId(null);
        }
        if (e.key === 'Escape') { setEditingGroupId(null); setEditingItemId(null); }
        return;
      }
      if (e.key === 'Escape')  { setEditingGroupId(null); setEditingItemId(null); setSelectedItemId(null); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        if (selectedItemId) setEditingItemId(selectedItemId);
        else if (selectedMainGroupId) setEditingGroupId(selectedMainGroupId);
      }
      if (e.key === 'Delete') {
        if (selectedItemId) handleDeleteItem(selectedItemId);
        else if (selectedMainGroupId) handleDeleteSubGroup(selectedMainGroupId);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedMainGroupId, editingGroupId, selectedItemId, editingItemId, subGroups, skipItems]);

  /* ─── derived ─── */
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

  const curSub = subGroups.find(s => s.id === selectedMainGroupId);
  const itemsForSelectedGroup = curSub
    ? skipItems.filter(si => si.subGroupId === curSub.id || (si.groupName === curSub.groupName && (!si.mainGroup || si.mainGroup === curSub.mainGroup)))
    : [];
  const filteredItems = itemsForSelectedGroup.filter(si =>
    si.itemPrefix.toLowerCase().includes(itemSearch.toLowerCase())
  );

  // Build color map by mainGroup name
  const mgColorMap: Record<string,string> = {};
  mainGroups.forEach((mg, i) => { mgColorMap[mg.name] = GROUP_COLORS[i % GROUP_COLORS.length]; });
  const getAccent = (mg: string) => mgColorMap[mg] || '#38bdf8';

  /* ─── shared input styles ─── */
  const cellInput: React.CSSProperties = {
    width: '100%', height: '100%',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.25)',
    outline: 'none', color: '#ffffff',
    fontSize: '11.5px', padding: '3px 6px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    borderRadius: '4px'
  };
  const cellText: React.CSSProperties = {
    padding: '3px 6px', fontSize: '11.5px', color: '#ffffff',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block'
  };
  const selectSt: React.CSSProperties = {
    width: '100%', background: 'rgba(15,23,42,0.95)',
    border: '1px solid rgba(255,255,255,0.25)', color: '#ffffff',
    fontSize: '11px', fontWeight: 600, borderRadius: '4px',
    padding: '2px 4px', outline: 'none'
  };

  /* ════════════════════════════════════════════════════ */
  return (
    <div style={{
      flex: 1, display: 'grid', gridTemplateColumns: '1.25fr 1fr',
      gap: '10px', height: '100%', minHeight: 0, overflow: 'hidden'
    }}>

      {/* ══════════════════════════════════════════
          LEFT — Sub Groups Configuration Table
      ══════════════════════════════════════════ */}
      <div className="glass-panel" style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        height: '100%', minHeight: 0, borderRadius: '12px', overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.09)'
      }}>
        {/* Header */}
        <div style={{
          padding: '10px 14px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexShrink: 0,
          background: 'linear-gradient(90deg, rgba(56,189,248,0.05) 0%, transparent 60%)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
            <div style={{
              width: '28px', height: '28px', borderRadius: '8px',
              background: 'linear-gradient(135deg, rgba(56,189,248,0.2), rgba(139,92,246,0.2))',
              border: '1px solid rgba(56,189,248,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Layers size={14} color="#38bdf8" />
            </div>
            <div>
              <span style={{ fontSize: '12px', fontWeight: 800, color: '#f8fafc', display: 'block', letterSpacing: '-0.01em' }}>
                Sub Groups Configuration
              </span>
              <span style={{ fontSize: '9.5px', color: '#64748b' }}>
                {subGroups.length} groups · double-click to edit
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '7px' }}>
            <button
              className="mac-btn"
              style={{ background: 'rgba(239,68,68,0.12)', borderColor: 'rgba(239,68,68,0.3)', color: '#fca5a5' }}
              onClick={purgeAndLoadPristineBackup}
              title="Reset to backup"
            >
              <RotateCcw size={12} /> Reset
            </button>
            <button className="mac-btn primary" onClick={handleAddSubGroup}>
              <Plus size={13} /> Add Group
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="mac-table-container" style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
          <table className="apple-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ width: colWidths.srNo,    textAlign: 'center', padding: '7px 6px', fontSize: '10px', fontWeight: 700, color: '#64748b', background: 'rgba(0,0,0,0.25)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>#</th>
                <th style={{ width: colWidths.mainGroup, padding: '7px 8px', fontSize: '10px', fontWeight: 700, color: '#64748b', background: 'rgba(0,0,0,0.25)', borderBottom: '1px solid rgba(255,255,255,0.06)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Main Group</th>
                <th style={{ width: colWidths.groupName, padding: '7px 8px', fontSize: '10px', fontWeight: 700, color: '#64748b', background: 'rgba(0,0,0,0.25)', borderBottom: '1px solid rgba(255,255,255,0.06)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Group Name</th>
                <th style={{ width: colWidths.sumCol,  textAlign: 'center', padding: '7px 6px', fontSize: '10px', fontWeight: 700, color: '#64748b', background: 'rgba(0,0,0,0.25)', borderBottom: '1px solid rgba(255,255,255,0.06)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Sum Col</th>
                <th style={{ width: colWidths.items,   textAlign: 'center', padding: '7px 6px', fontSize: '10px', fontWeight: 700, color: '#64748b', background: 'rgba(0,0,0,0.25)', borderBottom: '1px solid rgba(255,255,255,0.06)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Items</th>
                <th style={{ width: 60,                textAlign: 'center', padding: '7px 6px', fontSize: '10px', fontWeight: 700, color: '#64748b', background: 'rgba(0,0,0,0.25)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubGroups.map((sg, idx) => {
                const isSelected = selectedMainGroupId === sg.id;
                const isEditing  = editingGroupId === sg.id;
                const itemCount  = skipItems.filter(si =>
                  si.subGroupId === sg.id ||
                  (si.groupName === sg.groupName && (!si.mainGroup || si.mainGroup === sg.mainGroup))
                ).length;
                const accent = getAccent(sg.mainGroup);

                return (
                  <tr
                    key={sg.id}
                    onClick={() => { macAudio.playClick(); setSelectedMainGroupId(sg.id); setSelectedItemId(null); }}
                    onDoubleClick={() => setEditingGroupId(sg.id)}
                    style={{
                      cursor: 'pointer',
                      background: isSelected
                        ? `linear-gradient(90deg, ${accent}14 0%, rgba(0,0,0,0) 100%)`
                        : 'transparent',
                      borderLeft: isSelected ? `3px solid ${accent}` : '3px solid transparent',
                      transition: 'background 0.15s, border-color 0.15s'
                    }}
                  >
                    {/* # */}
                    <td style={{ textAlign: 'center', color: '#334155', fontSize: '10.5px', userSelect: 'none', padding: '6px 4px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      {idx + 1}
                    </td>

                    {/* MAIN GROUP */}
                    <td style={{ padding: '3px 4px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      {isEditing ? (
                        <select style={selectSt} value={sg.mainGroup}
                          onChange={e => handleSubGroupChange(sg.id, 'mainGroup', e.target.value)}
                          onClick={e => e.stopPropagation()} autoFocus>
                          {mainGroups.map(m => (
                            <option key={m.id} value={m.name} style={{ background: '#0f172a' }}>{m.name}</option>
                          ))}
                        </select>
                      ) : (
                        <span style={{ ...cellText, display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: accent, flexShrink: 0, display: 'inline-block', boxShadow: isSelected ? `0 0 5px ${accent}` : 'none' }} />
                          <span style={{ fontWeight: 700, color: isSelected ? accent : '#cbd5e1' }}>{sg.mainGroup}</span>
                        </span>
                      )}
                    </td>

                    {/* GROUP NAME */}
                    <td style={{ padding: '2px 4px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      {isEditing ? (
                        <input style={{ ...cellInput, fontWeight: 700 }} value={sg.groupName}
                          onChange={e => handleSubGroupChange(sg.id, 'groupName', e.target.value)}
                          onClick={e => e.stopPropagation()} />
                      ) : (
                        <span style={{ ...cellText, fontWeight: 700, color: isSelected ? '#f8fafc' : '#e2e8f0' }}>
                          {sg.groupName}
                        </span>
                      )}
                    </td>

                    {/* SUM COL */}
                    <td style={{ padding: '2px 4px', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      {isEditing ? (
                        <select style={{ ...selectSt, textAlign: 'center' }} value={sg.sumColumn}
                          onChange={e => handleSubGroupChange(sg.id, 'sumColumn', e.target.value)}
                          onClick={e => e.stopPropagation()}>
                          <option value="QTY"   style={{ background: '#0f172a' }}>QTY</option>
                          <option value="U CAP" style={{ background: '#0f172a' }}>U CAP</option>
                          <option value="L CAP" style={{ background: '#0f172a' }}>L CAP</option>
                        </select>
                      ) : (
                        <span style={{
                          display: 'inline-block', padding: '2px 8px', borderRadius: '5px',
                          fontSize: '10px', fontWeight: 800, letterSpacing: '0.04em',
                          background: isSelected ? `${accent}18` : 'rgba(255,255,255,0.06)',
                          color: isSelected ? accent : '#94a3b8',
                          border: isSelected ? `1px solid ${accent}35` : '1px solid transparent'
                        }}>
                          {sg.sumColumn}
                        </span>
                      )}
                    </td>

                    {/* ITEM COUNT */}
                    <td style={{ textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <span style={{
                        display: 'inline-block', padding: '2px 7px', borderRadius: '5px',
                        fontSize: '10px', fontWeight: 800,
                        background: itemCount > 0
                          ? (isSelected ? `${accent}22` : 'rgba(255,255,255,0.07)')
                          : 'transparent',
                        color: itemCount > 0
                          ? (isSelected ? accent : '#64748b')
                          : '#334155'
                      }}>
                        {itemCount}
                      </span>
                    </td>

                    {/* ACTION */}
                    <td style={{ textAlign: 'center', padding: '2px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      {isEditing ? (
                        <button type="button" className="mac-btn primary"
                          style={{ padding: '2px 8px', height: '22px', fontSize: '10.5px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                          onClick={e => { e.stopPropagation(); macAudio.playSuccess(); setEditingGroupId(null); }}>
                          <Check size={11} /> Save
                        </button>
                      ) : isSelected ? (
                        <button type="button"
                          style={{
                            width: '22px', height: '22px', borderRadius: '5px', cursor: 'pointer',
                            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
                            color: '#f87171', display: 'inline-flex', alignItems: 'center', justifyContent: 'center'
                          }}
                          onClick={e => { e.stopPropagation(); handleDeleteSubGroup(sg.id); }}
                          title="Delete group"
                        >
                          <Trash2 size={11} />
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

      {/* ══════════════════════════════════════════
          RIGHT — Skip Items Table
      ══════════════════════════════════════════ */}
      <div
        className="glass-panel"
        style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          height: '100%', minHeight: 0, borderRadius: '12px', overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.09)'
        }}
        onPaste={handleItemPaste}
      >
        {/* Header */}
        <div style={{
          padding: '10px 14px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexShrink: 0,
          background: curSub
            ? `linear-gradient(90deg, ${getAccent(curSub.mainGroup)}08 0%, transparent 60%)`
            : 'transparent'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
            {curSub && (
              <div style={{
                width: '28px', height: '28px', borderRadius: '8px',
                background: `${getAccent(curSub.mainGroup)}18`,
                border: `1px solid ${getAccent(curSub.mainGroup)}35`,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Tag size={14} color={getAccent(curSub.mainGroup)} />
              </div>
            )}
            <div>
              <span style={{ fontSize: '12px', fontWeight: 800, color: '#f8fafc', display: 'block', letterSpacing: '-0.01em' }}>
                {curSub ? `${curSub.groupName}` : 'Skip Items'}
              </span>
              <span style={{ fontSize: '9.5px', color: '#64748b' }}>
                {curSub
                  ? `${itemsForSelectedGroup.length} items · Ctrl+V to paste from Excel`
                  : 'Select a group from the left'}
              </span>
            </div>
          </div>
          {curSub && (
            <button className="mac-btn primary" onClick={handleAddItem} title="Add Item (or paste)">
              <Plus size={13} /> Add Item
            </button>
          )}
        </div>

        {/* Table / empty state */}
        <div className="mac-table-container" style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
          {curSub ? (
            <table className="apple-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ width: subColWidths.srNo, textAlign: 'center', padding: '7px 6px', fontSize: '10px', fontWeight: 700, color: '#64748b', background: 'rgba(0,0,0,0.25)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>#</th>
                  <th style={{ padding: '7px 8px', fontSize: '10px', fontWeight: 700, color: '#64748b', background: 'rgba(0,0,0,0.25)', borderBottom: '1px solid rgba(255,255,255,0.06)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Item Name / Prefix</th>
                  <th style={{ width: 60, textAlign: 'center', padding: '7px 6px', fontSize: '10px', fontWeight: 700, color: '#64748b', background: 'rgba(0,0,0,0.25)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((si, idx) => {
                  const isSel  = selectedItemId  === si.id;
                  const isEdit = editingItemId   === si.id;
                  const accent = curSub ? getAccent(curSub.mainGroup) : '#38bdf8';
                  return (
                    <tr
                      key={si.id}
                      onClick={() => setSelectedItemId(si.id)}
                      onDoubleClick={() => setEditingItemId(si.id)}
                      style={{
                        cursor: 'pointer',
                        background: isSel
                          ? `linear-gradient(90deg, ${accent}14 0%, rgba(0,0,0,0) 100%)`
                          : 'transparent',
                        borderLeft: isSel ? `3px solid ${accent}` : '3px solid transparent',
                        transition: 'background 0.12s, border-color 0.12s'
                      }}
                    >
                      <td style={{ textAlign: 'center', color: '#334155', fontSize: '10.5px', userSelect: 'none', padding: '6px 4px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        {idx + 1}
                      </td>
                      <td style={{ padding: '2px 4px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        {isEdit ? (
                          <input
                            style={{ ...cellInput, fontWeight: 700, borderColor: `${accent}60` }}
                            value={si.itemPrefix}
                            onChange={e => handleItemChange(si.id, e.target.value)}
                            autoFocus
                          />
                        ) : (
                          <span style={{ ...cellText, fontWeight: 700, color: isSel ? '#f8fafc' : '#e2e8f0' }}>
                            {si.itemPrefix || '—'}
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center', padding: '2px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        {isEdit ? (
                          <button type="button" className="mac-btn primary"
                            style={{ padding: '2px 8px', height: '22px', fontSize: '10.5px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                            onClick={e => { e.stopPropagation(); macAudio.playSuccess(); setEditingItemId(null); }}>
                            <Check size={11} /> Save
                          </button>
                        ) : isSel ? (
                          <button type="button"
                            style={{
                              width: '22px', height: '22px', borderRadius: '5px', cursor: 'pointer',
                              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
                              color: '#f87171', display: 'inline-flex', alignItems: 'center', justifyContent: 'center'
                            }}
                            onClick={e => { e.stopPropagation(); handleDeleteItem(si.id); }}
                            title="Delete item"
                          >
                            <Trash2 size={11} />
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div style={{
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              height: '100%', gap: '10px', color: '#1e293b'
            }}>
              <Tag size={32} strokeWidth={1} color="#1e293b" />
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>
                Select a group from the left panel
              </span>
            </div>
          )}
          <div style={{ height: '36px' }} />
        </div>
      </div>
    </div>
  );
};

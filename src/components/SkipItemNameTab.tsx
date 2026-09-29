import React, { useState, useEffect, useRef } from 'react';
import { macAudio } from '../utils/macAudio';
import { Plus, Check, RotateCcw, Layers, Tag } from 'lucide-react';
import { SQLITE_SKIP_MAIN_GROUPS, SQLITE_SKIP_SUB_GROUPS, SQLITE_SKIP_ITEMS } from '../data/sqliteSkipData';
import type { SkipMainGroupSeed, SkipSubGroupSeed, SkipItemSeed } from '../data/sqliteSkipData';

const DEFAULT_MAIN_COLS = { srNo: 35, mainGroup: 140, groupName: 200, sumCol: 85, items: 50 };
const DEFAULT_SUB_COLS  = { srNo: 40, itemName: 320 };

export interface SkipItemNameTabProps {
  search?: string;
  onAddRef?: React.MutableRefObject<(() => void) | null>;
}

export const SkipItemNameTab: React.FC<SkipItemNameTabProps> = ({
  search: externalSearch,
  onAddRef
}) => {
  const [mainGroups, setMainGroups] = useState<SkipMainGroupSeed[]>([]);
  const [subGroups,  setSubGroups]  = useState<SkipSubGroupSeed[]>([]);
  const [skipItems,  setSkipItems]  = useState<SkipItemSeed[]>([]);

  const [selectedMainGroupId, setSelectedMainGroupId] = useState<string | null>(null);
  const [editingGroupId,      setEditingGroupId]       = useState<string | null>(null);
  const [selectedItemId,      setSelectedItemId]       = useState<string | null>(null);
  const [editingItemId,       setEditingItemId]        = useState<string | null>(null);
  const [internalSearch,      setInternalSearch]       = useState('');

  const itemSearch = externalSearch !== undefined ? externalSearch : internalSearch;

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

  /* ─── group handlers ─── */
  const handleSubGroupChange = (id: string, field: keyof SkipSubGroupSeed, value: any) => {
    saveSubGroups(subGroups.map(sg => {
      if (sg.id !== id) return sg;
      const next: SkipSubGroupSeed = { ...sg, [field]: value };
      if (field === 'mainGroup') {
        const mg = mainGroups.find(m => m.name === value || m.id === value);
        if (mg) next.mainGroupId = mg.id;
      }
      return next;
    }));
  };

  const handleAddSubGroup = () => {
    macAudio.playClick();
    const newId = 'sg-' + Date.now();
    const mg    = mainGroups[0];
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

  /* ─── item handlers ─── */
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
    saveSkipItems([newItem, ...skipItems]);
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
    const newItems: SkipItemSeed[] = text.trim().split(/\r?\n/).map(l => l.trim()).filter(l => l).map((line, idx) => ({
      id: 'si-' + (Date.now() + idx),
      subGroupId: selectedMainGroupId,
      mainGroup:  curSub?.mainGroup || '',
      groupName:  curSub?.groupName || '',
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

  /* ─────────────────────────────────────────────────────────
     KEYBOARD HANDLER
     Rules:
     • When inside an input/select:
         Enter / ArrowRight  → move to NEXT input in same row
         ArrowLeft           → move to PREV input in same row
         Enter on LAST input → save (exit edit mode)
         Escape              → cancel edit
     • When NOT in input:
         Insert              → add new row  ✅ FIXED
         Ctrl+Enter          → enter edit mode on selected row
         Delete              → delete selected row
         Escape              → deselect
  ───────────────────────────────────────────────────────── */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target  = e.target as HTMLElement;
      const tagName = target.tagName;
      const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(tagName);

      if (isInput) {
        /* ── navigation inside a row ── */
        if (e.key === 'Enter' || (e.key === 'ArrowRight' && !e.shiftKey)) {
          // find all inputs/selects in this <tr>
          const row = target.closest('tr');
          if (!row) return;
          const inputs = Array.from(
            row.querySelectorAll<HTMLInputElement | HTMLSelectElement>(
              'input:not([disabled]), select:not([disabled])'
            )
          );
          const currIdx = inputs.indexOf(target as any);
          if (currIdx >= 0 && currIdx < inputs.length - 1) {
            // move to next input
            e.preventDefault();
            macAudio.playHover();
            inputs[currIdx + 1].focus();
            if ((inputs[currIdx + 1] as HTMLInputElement).select)
              (inputs[currIdx + 1] as HTMLInputElement).select?.();
            return;
          }
          // last input in row → save
          if (e.key === 'Enter') {
            e.preventDefault();
            macAudio.playSuccess();
            setEditingGroupId(null);
            setEditingItemId(null);
          }
          return;
        }

        if (e.key === 'ArrowLeft') {
          const row = target.closest('tr');
          if (!row) return;
          const inputs = Array.from(
            row.querySelectorAll<HTMLInputElement | HTMLSelectElement>(
              'input:not([disabled]), select:not([disabled])'
            )
          );
          const currIdx = inputs.indexOf(target as any);
          if (currIdx > 0) {
            e.preventDefault();
            macAudio.playHover();
            inputs[currIdx - 1].focus();
            if ((inputs[currIdx - 1] as HTMLInputElement).select)
              (inputs[currIdx - 1] as HTMLInputElement).select?.();
          }
          return;
        }

        if (e.key === 'Escape') {
          e.preventDefault();
          e.stopPropagation();
          setEditingGroupId(null);
          setEditingItemId(null);
          return;
        }

        return; // don't handle other keys while typing
      }

      /* ── global (not in input) ── */

      // Escape — deselect
      if (e.key === 'Escape') {
        e.preventDefault();
        setEditingGroupId(null);
        setEditingItemId(null);
        setSelectedItemId(null);
        return;
      }

      // INSERT → add new row  ✅
      if (e.key === 'Insert') {
        e.preventDefault();
        if (selectedMainGroupId) handleAddItem();
        else handleAddSubGroup();
        return;
      }

      // Ctrl/Cmd + Enter → enter edit mode on selected row
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (selectedItemId) {
          macAudio.playClick();
          setEditingItemId(selectedItemId);
        } else if (selectedMainGroupId) {
          macAudio.playClick();
          setEditingGroupId(selectedMainGroupId);
        }
        return;
      }

      // Delete → delete selected row
      if (e.key === 'Delete') {
        e.preventDefault();
        if (selectedItemId) handleDeleteItem(selectedItemId);
        else if (selectedMainGroupId) handleDeleteSubGroup(selectedMainGroupId);
        return;
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [
    selectedMainGroupId, editingGroupId,
    selectedItemId, editingItemId,
    subGroups, skipItems, mainGroups
  ]);

  /* ─── derived ─── */
  const filteredSubGroups = subGroups.filter(sg => {
    if (!itemSearch.trim()) return true;
    const q = itemSearch.toLowerCase();
    return (sg.groupName||'').toLowerCase().includes(q) ||
      (sg.mainGroup||'').toLowerCase().includes(q) ||
      skipItems.some(si =>
        (si.subGroupId === sg.id ||
         (si.groupName === sg.groupName && (!si.mainGroup || si.mainGroup === sg.mainGroup))) &&
        (si.itemPrefix||'').toLowerCase().includes(q)
      );
  });

  const curSub = subGroups.find(s => s.id === selectedMainGroupId);
  const itemsForSelectedGroup = curSub
    ? skipItems.filter(si =>
        si.subGroupId === curSub.id ||
        (si.groupName === curSub.groupName && (!si.mainGroup || si.mainGroup === curSub.mainGroup))
      )
    : [];
  const filteredItems = itemsForSelectedGroup.filter(si =>
    si.itemPrefix.toLowerCase().includes(itemSearch.toLowerCase())
  );

  /* ─── shared styles — exactly like Manage Groups / F5 ─── */
  const cellInput: React.CSSProperties = {
    width: '100%',
    background: 'rgba(255, 255, 255, 0.06)',
    border: '1px solid rgba(255, 255, 255, 0.25)',
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

  /* ════════════════════════════════════════════════════════ */
  return (
    <div style={{
      flex: 1, display: 'grid', gridTemplateColumns: '1.25fr 1fr',
      gap: '10px', height: '100%', minHeight: 0, overflow: 'hidden'
    }}>

      {/* ══════════════════════════════════════════
          LEFT — Sub Groups Configuration Table
      ══════════════════════════════════════════ */}
      <div
        className="glass-panel"
        style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, borderRadius: '12px', overflow: 'hidden' }}
      >
        {/* Header — same pattern as every other tab */}
        <div style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc' }}>
            Sub Groups Configuration ({subGroups.length} Groups)
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className="mac-btn"
              style={{ background: 'rgba(239,68,68,0.18)', borderColor: 'rgba(239,68,68,0.35)', color: '#fca5a5' }}
              onClick={purgeAndLoadPristineBackup}
              title="Reset to backup"
            >
              <RotateCcw size={13} /> Reset to Backup
            </button>
            <button className="mac-btn primary" onClick={handleAddSubGroup} title="Add Group (or press Insert)">
              <Plus size={14} /> Add Group
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="mac-table-container" style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
          <table className="apple-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: '#0f172a' }}>
              <tr>
                <th style={{ width: DEFAULT_MAIN_COLS.srNo,    textAlign: 'center' }}>#</th>
                <th style={{ width: DEFAULT_MAIN_COLS.mainGroup }}>MAIN GROUP</th>
                <th style={{ width: DEFAULT_MAIN_COLS.groupName }}>GROUP NAME</th>
                <th style={{ width: DEFAULT_MAIN_COLS.sumCol,  textAlign: 'center' }}>SUM COL</th>
                <th style={{ width: DEFAULT_MAIN_COLS.items,   textAlign: 'center' }}>ITEMS</th>
                <th style={{ width: 65,                        textAlign: 'center' }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubGroups.map((sg, idx) => {
                const isSelected = selectedMainGroupId === sg.id;
                const isEditing  = editingGroupId      === sg.id;
                const itemCount  = skipItems.filter(si =>
                  si.subGroupId === sg.id ||
                  (si.groupName === sg.groupName && (!si.mainGroup || si.mainGroup === sg.mainGroup))
                ).length;

                return (
                  <tr
                    key={sg.id}
                    className={`mac-table-row ${isSelected ? 'selected' : ''}`}
                    onClick={() => { macAudio.playClick(); setSelectedMainGroupId(sg.id); setSelectedItemId(null); }}
                    onDoubleClick={() => setEditingGroupId(sg.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td style={{ textAlign: 'center', color: '#94a3b8', fontSize: '10px', userSelect: 'none' }}>
                      {idx + 1}
                    </td>

                    {/* MAIN GROUP — select (navigable with Enter/Arrow) */}
                    <td style={{ padding: '1px' }}>
                      {isEditing ? (
                        <select
                          style={selectSt}
                          value={sg.mainGroup}
                          onChange={e => handleSubGroupChange(sg.id, 'mainGroup', e.target.value)}
                          onClick={e => e.stopPropagation()}
                          autoFocus
                        >
                          {mainGroups.map(m => (
                            <option key={m.id} value={m.name} style={{ background: '#0f172a' }}>{m.name}</option>
                          ))}
                        </select>
                      ) : (
                        <span style={{ ...cellText, fontWeight: 600 }}>{sg.mainGroup}</span>
                      )}
                    </td>

                    {/* GROUP NAME — text input */}
                    <td style={{ padding: '1px' }}>
                      {isEditing ? (
                        <input
                          style={{ ...cellInput, fontWeight: 700 }}
                          value={sg.groupName}
                          onChange={e => handleSubGroupChange(sg.id, 'groupName', e.target.value)}
                          onClick={e => e.stopPropagation()}
                        />
                      ) : (
                        <span style={{ ...cellText, fontWeight: 700 }}>{sg.groupName}</span>
                      )}
                    </td>

                    {/* SUM COL — select */}
                    <td style={{ padding: '2px', textAlign: 'center' }}>
                      {isEditing ? (
                        <select
                          style={{ ...selectSt, textAlign: 'center' }}
                          value={sg.sumColumn}
                          onChange={e => handleSubGroupChange(sg.id, 'sumColumn', e.target.value)}
                          onClick={e => e.stopPropagation()}
                        >
                          <option value="QTY"   style={{ background: '#0f172a' }}>QTY</option>
                          <option value="U CAP" style={{ background: '#0f172a' }}>U CAP</option>
                          <option value="L CAP" style={{ background: '#0f172a' }}>L CAP</option>
                        </select>
                      ) : (
                        <span style={{ ...cellText, textAlign: 'center' }}>{sg.sumColumn}</span>
                      )}
                    </td>

                    {/* ITEM COUNT */}
                    <td style={{ textAlign: 'center', color: '#ffffff', fontWeight: 600, fontSize: '11px' }}>
                      {itemCount > 0 ? (
                        <span style={{ background: 'rgba(255,255,255,0.12)', color: '#ffffff', padding: '1px 6px', borderRadius: '10px', fontSize: '9.5px', fontWeight: 600 }}>
                          {itemCount}
                        </span>
                      ) : <span style={{ color: '#475569', fontSize: '9.5px' }}>0</span>}
                    </td>

                    {/* ACTION */}
                    <td style={{ textAlign: 'center', padding: '1px' }}>
                      {isEditing ? (
                        <button
                          type="button"
                          className="mac-btn primary"
                          style={{ padding: '2px 8px', height: '22px', fontSize: '10.5px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          onClick={e => { e.stopPropagation(); macAudio.playSuccess(); setEditingGroupId(null); }}
                        >
                          <Plus size={12} /> Save
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

        {/* Footer hint */}
        <div style={{ padding: '4px 12px', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: '9.5px', color: '#334155', flexShrink: 0 }}>
          Double-click to edit · Enter moves to next cell · Enter on last cell saves · Insert adds new row · Del deletes selected
        </div>
      </div>

      {/* ══════════════════════════════════════════
          RIGHT — Skip Items Table
      ══════════════════════════════════════════ */}
      <div
        className="glass-panel"
        style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, borderRadius: '12px', overflow: 'hidden' }}
        onPaste={handleItemPaste}
      >
        {/* Header */}
        <div style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc' }}>
              {curSub ? `${curSub.groupName} (${itemsForSelectedGroup.length} Items)` : 'Select a Group'}
            </span>
            {externalSearch === undefined && curSub && (
              <input
                type="text"
                placeholder="Filter prefix..."
                value={internalSearch}
                onChange={e => setInternalSearch(e.target.value)}
                style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', padding: '2px 6px', fontSize: '11px', color: '#f8fafc', outline: 'none', width: '120px' }}
              />
            )}
          </div>
          {curSub && (
            <button className="mac-btn primary" onClick={handleAddItem} title="Add Item (or press Insert)">
              <Plus size={14} /> Add Item
            </button>
          )}
        </div>

        {/* Table */}
        <div className="mac-table-container" style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
          {curSub ? (
            <table className="apple-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: '#0f172a' }}>
                <tr>
                  <th style={{ width: DEFAULT_SUB_COLS.srNo, textAlign: 'center' }}>#</th>
                  <th>ITEM NAME / PREFIX</th>
                  <th style={{ width: 65, textAlign: 'center' }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((si, idx) => {
                  const isSel  = selectedItemId === si.id;
                  const isEdit = editingItemId  === si.id;
                  return (
                    <tr
                      key={si.id}
                      className={`mac-table-row ${isSel ? 'selected' : ''}`}
                      onClick={() => setSelectedItemId(si.id)}
                      onDoubleClick={() => setEditingItemId(si.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td style={{ textAlign: 'center', color: '#94a3b8', fontSize: '10px', userSelect: 'none' }}>
                        {idx + 1}
                      </td>
                      <td style={{ padding: '1px' }}>
                        {isEdit ? (
                          <input
                            style={{ ...cellInput, fontWeight: 600 }}
                            value={si.itemPrefix}
                            onChange={e => handleItemChange(si.id, e.target.value)}
                            autoFocus
                          />
                        ) : (
                          <span style={{ ...cellText, fontWeight: 600 }}>
                            {si.itemPrefix || '—'}
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center', padding: '1px' }}>
                        {isEdit ? (
                          <button
                            type="button"
                            className="mac-btn primary"
                            style={{ padding: '2px 8px', height: '22px', fontSize: '10.5px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            onClick={e => { e.stopPropagation(); macAudio.playSuccess(); setEditingItemId(null); }}
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
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#334155', fontSize: '13px', flexDirection: 'column', gap: '8px' }}>
              <Tag size={28} strokeWidth={1} color="#334155" />
              <span>Select a group from the left panel</span>
            </div>
          )}
          <div style={{ height: '36px' }} />
        </div>

        {/* Footer hint */}
        <div style={{ padding: '4px 12px', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: '9.5px', color: '#334155', flexShrink: 0 }}>
          Double-click to edit · Insert adds new item · Del deletes · Ctrl+V to paste from Excel
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { macAudio } from '../utils/macAudio';
import { Plus, Check, RotateCcw, Layers, Tag } from 'lucide-react';
import { CosmicSearchInput } from './common/CosmicSearchInput';
import { IosSegmentedTabs } from './common/IosSegmentedTabs';
import { SQLITE_SKIP_MAIN_GROUPS, SQLITE_SKIP_SUB_GROUPS, SQLITE_SKIP_ITEMS } from '../data/sqliteSkipData';
import type { SkipMainGroupSeed, SkipSubGroupSeed, SkipItemSeed } from '../data/sqliteSkipData';

export interface SkipItemNameTabProps {
  search?: string;
  onAddRef?: React.MutableRefObject<(() => void) | null>;
}

type SubTab = 'GROUPS' | 'ITEMS';

export const SkipItemNameTab: React.FC<SkipItemNameTabProps> = ({
  search: externalSearch,
  onAddRef
}) => {
  const [mainGroups, setMainGroups] = useState<SkipMainGroupSeed[]>([]);
  const [subGroups,  setSubGroups]  = useState<SkipSubGroupSeed[]>([]);
  const [skipItems,  setSkipItems]  = useState<SkipItemSeed[]>([]);

  const [subTab,               setSubTab]               = useState<SubTab>('GROUPS');
  const [selectedMainGroupId,  setSelectedMainGroupId]  = useState<string | null>(null);
  const [editingGroupId,       setEditingGroupId]        = useState<string | null>(null);
  const [selectedItemId,       setSelectedItemId]        = useState<string | null>(null);
  const [editingItemId,        setEditingItemId]         = useState<string | null>(null);
  const [internalSearch,       setInternalSearch]        = useState('');
  const searchVal = externalSearch !== undefined ? externalSearch : internalSearch;

  /* ── seed / restore ── */
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

  /* ── group handlers ── */
  const handleSubGroupChange = (id: string, field: keyof SkipSubGroupSeed, value: any) => {
    const updated = subGroups.map(sg => {
      if (sg.id !== id) return sg;
      const next: SkipSubGroupSeed = { ...sg, [field]: value };
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

  /* ── item handlers ── */
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
      mainGroup: curSub?.mainGroup || '',
      groupName: curSub?.groupName || '',
      itemPrefix: line.split('\t')[0].trim()
    }));
    if (newItems.length > 0) saveSkipItems([...newItems, ...skipItems]);
  };

  useEffect(() => {
    if (onAddRef) {
      onAddRef.current = () => {
        if (subTab === 'GROUPS') handleAddSubGroup();
        else handleAddItem();
      };
    }
  }, [onAddRef, subTab, selectedMainGroupId, subGroups, skipItems, mainGroups]);

  /* ── keyboard ── */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isInput = ['INPUT','TEXTAREA','SELECT'].includes((e.target as HTMLElement)?.tagName);
      if (isInput) {
        if (e.key === 'Enter') { e.preventDefault(); macAudio.playSuccess(); setEditingGroupId(null); setEditingItemId(null); }
        if (e.key === 'Escape') { setEditingGroupId(null); setEditingItemId(null); }
        return;
      }
      if (e.key === 'Escape') { setEditingGroupId(null); setEditingItemId(null); setSelectedItemId(null); }
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
  }, [selectedMainGroupId, editingGroupId, selectedItemId, editingItemId, subGroups, skipItems, subTab]);

  /* ── derived ── */
  const curSub = subGroups.find(s => s.id === selectedMainGroupId);
  const itemsForSelectedGroup = curSub
    ? skipItems.filter(si => si.subGroupId === curSub.id || (si.groupName === curSub.groupName && (!si.mainGroup || si.mainGroup === curSub.mainGroup)))
    : [];

  const filteredGroups = subGroups.filter(sg => {
    if (!searchVal.trim()) return true;
    const q = searchVal.toLowerCase();
    return (sg.groupName||'').toLowerCase().includes(q) || (sg.mainGroup||'').toLowerCase().includes(q);
  });

  const filteredItems = itemsForSelectedGroup.filter(si =>
    (si.itemPrefix||'').toLowerCase().includes(searchVal.toLowerCase())
  );

  /* ── shared cell styles (exactly same as F5 / Manage Parties) ── */
  const cellInputStyle: React.CSSProperties = {
    width: '100%',
    background: 'rgba(255, 255, 255, 0.06)',
    border: '1px solid rgba(255, 255, 255, 0.25)',
    outline: 'none', color: '#ffffff',
    fontSize: '11px', padding: '3px 6px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    borderRadius: '4px'
  };
  const cellTextStyle: React.CSSProperties = {
    padding: '3px 6px', display: 'block',
    userSelect: 'text', color: '#ffffff',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
  };
  const selectStyle: React.CSSProperties = {
    width: '100%', background: 'rgba(15,23,42,0.95)',
    border: '1px solid rgba(255,255,255,0.25)', color: '#ffffff',
    fontSize: '11px', fontWeight: 600, borderRadius: '4px',
    padding: '2px 4px', outline: 'none'
  };

  /* ════════════════════════════════════════════════════════ */
  return (
    <div
      className="glass-panel"
      style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, borderRadius: '8px', padding: '6px', overflow: 'hidden' }}
      onPaste={handleItemPaste}
    >
      {/* ── Top bar: IosSegmentedTabs + Search + Actions ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', padding: '2px 4px' }}>

        {/* Segmented tabs */}
        <IosSegmentedTabs<'GROUPS' | 'ITEMS'>
          activeKey={subTab}
          onChange={setSubTab}
          width={300}
          tabs={[
            {
              key: 'GROUPS',
              label: 'GROUPS',
              icon: Layers,
              count: subGroups.length,
              gradient: 'linear-gradient(135deg, #38bdf8 0%, #0ea5e9 100%)',
              shadowColor: 'rgba(56, 189, 248, 0.35)'
            },
            {
              key: 'ITEMS',
              label: 'ITEMS',
              icon: Tag,
              count: itemsForSelectedGroup.length,
              gradient: 'linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%)',
              shadowColor: 'rgba(167, 139, 250, 0.35)'
            }
          ]}
        />

        {/* Search */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
          <CosmicSearchInput
            value={searchVal}
            onChange={(val) => setInternalSearch(val)}
            width="100%"
          />
        </div>

        {/* Count badge */}
        <div style={{ fontSize: '10.5px', fontWeight: 600, color: '#38bdf8', background: 'rgba(56,189,248,0.12)', padding: '4px 8px', borderRadius: '4px', whiteSpace: 'nowrap' }}>
          {subTab === 'GROUPS'
            ? `${filteredGroups.length} Groups`
            : curSub
              ? `${filteredItems.length} Items in ${curSub.groupName}`
              : 'Select a group first'}
        </div>

        {/* Paste hint */}
        {subTab === 'ITEMS' && (
          <div style={{ fontSize: '10px', color: '#a78bfa', background: 'rgba(167,139,250,0.1)', padding: '4px 8px', borderRadius: '4px', border: '1px solid rgba(167,139,250,0.2)', whiteSpace: 'nowrap' }}>
            📋 Paste Excel (Ctrl+V)
          </div>
        )}

        {/* Reset */}
        <button
          type="button"
          className="mac-btn"
          style={{ height: '26px', padding: '0 8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap', background: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.25)', color: '#fca5a5' }}
          onClick={() => { if (window.confirm('Reset all to default backup?')) purgeAndLoadPristineBackup(); }}
          title="Reset to backup"
        >
          <RotateCcw size={12} /> Reset
        </button>

        {/* Add button */}
        <button
          type="button"
          className="mac-btn primary"
          style={{ height: '26px', padding: '0 10px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}
          onClick={() => {
            macAudio.playClick();
            if (subTab === 'GROUPS') handleAddSubGroup();
            else handleAddItem();
          }}
        >
          <Plus size={13} /> {subTab === 'GROUPS' ? 'Add Group' : 'Add Item'}
        </button>
      </div>

      {/* ── Table Area ── */}
      <div style={{ flex: 1, minHeight: 0, overflow: 'auto', borderRadius: '4px' }}>

        {/* ── GROUPS TAB ── */}
        {subTab === 'GROUPS' && (
          <table className="apple-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: '#0f172a' }}>
              <tr>
                <th style={{ width: '40px', textAlign: 'center', userSelect: 'none' }}>#</th>
                <th style={{ width: '160px', userSelect: 'none' }}>MAIN GROUP</th>
                <th style={{ userSelect: 'none' }}>GROUP NAME</th>
                <th style={{ width: '90px', textAlign: 'center', userSelect: 'none' }}>SUM COL</th>
                <th style={{ width: '60px', textAlign: 'center', userSelect: 'none' }}>ITEMS</th>
                <th style={{ width: '75px', textAlign: 'center', userSelect: 'none' }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {filteredGroups.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '30px 10px', color: '#94a3b8', fontSize: '12px' }}>
                    No groups found. Click "Add Group" to create one.
                  </td>
                </tr>
              ) : filteredGroups.map((sg, idx) => {
                const isSelected = selectedMainGroupId === sg.id;
                const isEditing  = editingGroupId === sg.id;
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
                  >
                    <td style={{ textAlign: 'center', color: '#94a3b8', fontSize: '10px' }}>{idx + 1}</td>

                    {/* MAIN GROUP */}
                    <td style={{ padding: '1px' }}>
                      {isEditing ? (
                        <select style={selectStyle} value={sg.mainGroup}
                          onChange={e => handleSubGroupChange(sg.id, 'mainGroup', e.target.value)}
                          onClick={e => e.stopPropagation()} autoFocus>
                          {mainGroups.map(m => (
                            <option key={m.id} value={m.name} style={{ background: '#0f172a' }}>{m.name}</option>
                          ))}
                        </select>
                      ) : (
                        <span style={{ ...cellTextStyle, fontWeight: 600 }}>{sg.mainGroup}</span>
                      )}
                    </td>

                    {/* GROUP NAME */}
                    <td style={{ padding: '1px' }}>
                      {isEditing ? (
                        <input style={{ ...cellInputStyle, fontWeight: 700 }} value={sg.groupName}
                          onChange={e => handleSubGroupChange(sg.id, 'groupName', e.target.value)}
                          onClick={e => e.stopPropagation()} />
                      ) : (
                        <span style={{ ...cellTextStyle, fontWeight: 700 }}>{sg.groupName}</span>
                      )}
                    </td>

                    {/* SUM COL */}
                    <td style={{ padding: '1px', textAlign: 'center' }}>
                      {isEditing ? (
                        <select style={{ ...selectStyle, textAlign: 'center' }} value={sg.sumColumn}
                          onChange={e => handleSubGroupChange(sg.id, 'sumColumn', e.target.value)}
                          onClick={e => e.stopPropagation()}>
                          <option value="QTY"   style={{ background: '#0f172a' }}>QTY</option>
                          <option value="U CAP" style={{ background: '#0f172a' }}>U CAP</option>
                          <option value="L CAP" style={{ background: '#0f172a' }}>L CAP</option>
                        </select>
                      ) : (
                        <span style={{ ...cellTextStyle, textAlign: 'center' }}>{sg.sumColumn}</span>
                      )}
                    </td>

                    {/* ITEM COUNT */}
                    <td style={{ textAlign: 'center' }}>
                      {itemCount > 0 ? (
                        <span
                          style={{ background: 'rgba(255,255,255,0.12)', color: '#ffffff', padding: '1px 6px', borderRadius: '10px', fontSize: '9.5px', fontWeight: 600, cursor: 'pointer' }}
                          onClick={e => { e.stopPropagation(); setSelectedMainGroupId(sg.id); setSubTab('ITEMS'); }}
                          title="View items"
                        >
                          {itemCount} items
                        </span>
                      ) : (
                        <span style={{ color: '#94a3b8', fontSize: '9.5px' }}>0</span>
                      )}
                    </td>

                    {/* ACTION */}
                    <td style={{ textAlign: 'center', padding: '1px' }}>
                      {isEditing ? (
                        <button type="button" className="mac-btn primary"
                          style={{ padding: '2px 8px', height: '22px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '3px', margin: '0 auto' }}
                          onClick={e => { e.stopPropagation(); macAudio.playSuccess(); setEditingGroupId(null); }}>
                          <Plus size={12} /> Save
                        </button>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* ── ITEMS TAB ── */}
        {subTab === 'ITEMS' && (
          <>
            {!curSub ? (
              <div style={{ textAlign: 'center', padding: '40px 10px', color: '#94a3b8', fontSize: '12px' }}>
                Go to "GROUPS" tab, select a group, then switch back to "ITEMS" to manage its items.
              </div>
            ) : (
              <table className="apple-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: '#0f172a' }}>
                  <tr>
                    <th style={{ width: '40px', textAlign: 'center', userSelect: 'none' }}>#</th>
                    <th style={{ userSelect: 'none' }}>ITEM NAME / PREFIX</th>
                    <th style={{ width: '75px', textAlign: 'center', userSelect: 'none' }}>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={3} style={{ textAlign: 'center', padding: '30px 10px', color: '#94a3b8', fontSize: '12px' }}>
                        No items in "{curSub.groupName}". Click "Add Item" or paste from Excel (Ctrl+V).
                      </td>
                    </tr>
                  ) : filteredItems.map((si, idx) => {
                    const isSel  = selectedItemId  === si.id;
                    const isEdit = editingItemId   === si.id;
                    return (
                      <tr
                        key={si.id}
                        className={`mac-table-row ${isSel ? 'selected' : ''}`}
                        onClick={() => setSelectedItemId(si.id)}
                        onDoubleClick={() => setEditingItemId(si.id)}
                      >
                        <td style={{ textAlign: 'center', color: '#94a3b8', fontSize: '10px' }}>{idx + 1}</td>

                        <td style={{ padding: '1px' }}>
                          {isEdit ? (
                            <input style={{ ...cellInputStyle, fontWeight: 600 }} value={si.itemPrefix}
                              onChange={e => handleItemChange(si.id, e.target.value)}
                              autoFocus />
                          ) : (
                            <span style={{ ...cellTextStyle, fontWeight: 600 }}>{si.itemPrefix || '—'}</span>
                          )}
                        </td>

                        <td style={{ textAlign: 'center', padding: '1px' }}>
                          {isEdit ? (
                            <button type="button" className="mac-btn primary"
                              style={{ padding: '2px 8px', height: '22px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '3px', margin: '0 auto' }}
                              onClick={e => { e.stopPropagation(); macAudio.playSuccess(); setEditingItemId(null); }}>
                              <Check size={12} /> Save
                            </button>
                          ) : null}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </>
        )}
      </div>

      {/* ── Bottom status strip ── */}
      <div style={{ marginTop: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10px', color: '#64748b', padding: '2px 4px' }}>
        <span>
          {subTab === 'GROUPS'
            ? `${filteredGroups.length} of ${subGroups.length} groups · double-click any row to edit · Del to delete selected`
            : curSub
              ? `${filteredItems.length} of ${itemsForSelectedGroup.length} items in "${curSub.groupName}" · double-click to edit`
              : 'Select a group from GROUPS tab first'}
        </span>
        <span style={{ color: '#38bdf8' }}>💡 Tip: Click item count badge on a group to jump directly to its items</span>
      </div>
    </div>
  );
};

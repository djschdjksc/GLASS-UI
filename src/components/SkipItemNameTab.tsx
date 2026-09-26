import React, { useState, useEffect } from 'react';
import { macAudio } from '../utils/macAudio';
import { Search, Plus, Trash2, Check, Layers, Tag, Type, RotateCcw, ClipboardPaste } from 'lucide-react';
import { SQLITE_SKIP_MAIN_GROUPS, SQLITE_SKIP_SUB_GROUPS, SQLITE_SKIP_ITEMS } from '../data/sqliteSkipData';
import type { SkipMainGroupSeed, SkipSubGroupSeed, SkipItemSeed } from '../data/sqliteSkipData';

const DEFAULT_MAIN_COLS = { srNo: 35, mainGroup: 140, groupName: 200, sumCol: 85, items: 50, actions: 40 };
const DEFAULT_SUB_COLS = { srNo: 40, itemName: 320, actions: 40 };

export const SkipItemNameTab: React.FC = () => {
  const [mainGroups, setMainGroups] = useState<SkipMainGroupSeed[]>([]);
  const [subGroups, setSubGroups] = useState<SkipSubGroupSeed[]>([]);
  const [skipItems, setSkipItems] = useState<SkipItemSeed[]>([]);
  
  const [selectedMainGroupId, setSelectedMainGroupId] = useState<string | null>(null);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [itemSearch, setItemSearch] = useState('');

  const [colWidths, setColWidths] = useState(() => {
    try { const saved = localStorage.getItem('modern_skip_cols'); return saved ? { ...DEFAULT_MAIN_COLS, ...JSON.parse(saved) } : DEFAULT_MAIN_COLS; } catch { return DEFAULT_MAIN_COLS; }
  });
  const [subColWidths, setSubColWidths] = useState(() => {
    try { const saved = localStorage.getItem('modern_skip_sub_cols'); return saved ? { ...DEFAULT_SUB_COLS, ...JSON.parse(saved) } : DEFAULT_SUB_COLS; } catch { return DEFAULT_SUB_COLS; }
  });

  const purgeAndLoadPristineBackup = () => {
    try {
      localStorage.removeItem('billapp_skip_items');
      localStorage.removeItem('billapp_skip_sub_groups');
      localStorage.removeItem('billapp_skip_main_groups');
      localStorage.removeItem('si_main_groups');
      localStorage.removeItem('si_sub_groups');
      localStorage.removeItem('si_items');
      localStorage.removeItem('si_skip_items');
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

    if (SQLITE_SKIP_SUB_GROUPS.length > 0) {
      setSelectedMainGroupId(SQLITE_SKIP_SUB_GROUPS[0].id);
    }
    macAudio.playPop();
  };

  useEffect(() => {
    try {
      const isClean = localStorage.getItem('billapp_skip_version_v5');
      if (!isClean) {
        purgeAndLoadPristineBackup();
        return;
      }

      const savedMain = localStorage.getItem('billapp_skip_main_groups');
      const savedSub = localStorage.getItem('billapp_skip_sub_groups');
      const savedItems = localStorage.getItem('billapp_skip_items');
      if (savedMain && savedSub && savedItems) {
        setMainGroups(JSON.parse(savedMain));
        const loadedSubs = JSON.parse(savedSub);
        setSubGroups(loadedSubs);
        setSkipItems(JSON.parse(savedItems));
        if (loadedSubs.length > 0) {
          setSelectedMainGroupId(prev => prev || loadedSubs[0].id);
        }
      } else {
        purgeAndLoadPristineBackup();
      }
    } catch {
      purgeAndLoadPristineBackup();
    }
  }, []);

  const saveSubGroups = (data: SkipSubGroupSeed[]) => {
    setSubGroups(data);
    try { localStorage.setItem('billapp_skip_sub_groups', JSON.stringify(data)); } catch {}
  };

  const saveSkipItems = (data: SkipItemSeed[]) => {
    setSkipItems(data);
    try { localStorage.setItem('billapp_skip_items', JSON.stringify(data)); } catch {}
  };

  // SubGroup inline edits
  const handleSubGroupChange = (id: string, field: keyof SkipSubGroupSeed, value: any) => {
    const updated = subGroups.map(sg => {
      if (sg.id === id) {
        const next = { ...sg, [field]: value };
        if (field === 'mainGroup') {
          const mg = mainGroups.find(m => m.name === value || m.id === value);
          if (mg) next.mainGroupId = mg.id;
        }
        return next;
      }
      return sg;
    });
    saveSubGroups(updated);
  };

  const handleAddSubGroup = () => {
    macAudio.playClick();
    const newId = 'sg-' + Date.now();
    const defaultMg = mainGroups[0]?.name || 'General';
    const defaultMgId = mainGroups[0]?.id || 'mg-1';
    const newSg: SkipSubGroupSeed = {
      id: newId,
      mainGroupId: defaultMgId,
      mainGroup: defaultMg,
      groupName: 'NEW-GROUP',
      sumColumn: 'QTY'
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
    if (selectedMainGroupId === id) {
      setSelectedMainGroupId(next[0]?.id || null);
      setEditingGroupId(null);
    }
  };

  // SkipItem inline edits
  const handleItemChange = (id: string, newPrefix: string) => {
    const updated = skipItems.map(si => si.id === id ? { ...si, itemPrefix: newPrefix } : si);
    saveSkipItems(updated);
  };

  const handleAddItem = () => {
    if (!selectedMainGroupId) return;
    macAudio.playClick();
    const curSub = subGroups.find(s => s.id === selectedMainGroupId);
    const newId = 'si-' + Date.now();
    const newItem: SkipItemSeed = {
      id: newId,
      subGroupId: selectedMainGroupId,
      mainGroup: curSub?.mainGroup || '',
      groupName: curSub?.groupName || '',
      itemPrefix: ''
    };
    const next = [newItem, ...skipItems];
    saveSkipItems(next);
    setSelectedItemId(newId);
    setEditingItemId(newId);
  };

  const handleDeleteItem = (id: string) => {
    macAudio.playPop();
    const next = skipItems.filter(si => si.id !== id);
    saveSkipItems(next);
    if (selectedItemId === id) {
      setSelectedItemId(null);
      setEditingItemId(null);
    }
  };

  // Bulk paste into Skip Items table
  const handleItemPaste = (e: React.ClipboardEvent) => {
    if (!selectedMainGroupId) return;
    const text = e.clipboardData.getData('text');
    if (!text || (!text.includes('\n') && !text.includes('\t'))) return;

    e.preventDefault();
    macAudio.playSuccess();
    const curSub = subGroups.find(s => s.id === selectedMainGroupId);
    const lines = text.trim().split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    const newItems: SkipItemSeed[] = lines.map((line, idx) => {
      const pfx = line.split('\t')[0].trim();
      return {
        id: 'si-' + (Date.now() + idx),
        subGroupId: selectedMainGroupId,
        mainGroup: curSub?.mainGroup || '',
        groupName: curSub?.groupName || '',
        itemPrefix: pfx
      };
    });

    if (newItems.length > 0) {
      const next = [...newItems, ...skipItems];
      saveSkipItems(next);
    }
  };

  const curSub = subGroups.find(s => s.id === selectedMainGroupId);
  const itemsForSelectedGroup = curSub ? skipItems.filter(si => 
    si.subGroupId === curSub.id || 
    (si.groupName === curSub.groupName && (!si.mainGroup || si.mainGroup === curSub.mainGroup))
  ) : [];

  const filteredItems = itemsForSelectedGroup.filter(si =>
    si.itemPrefix.toLowerCase().includes(itemSearch.toLowerCase())
  );

  const cellInputStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    background: 'rgba(255, 255, 255, 0.06)',
    border: '1px solid rgba(56, 189, 248, 0.3)',
    outline: 'none',
    color: '#f8fafc',
    fontSize: '11.5px',
    padding: '3px 6px',
    fontFamily: 'inherit',
    borderRadius: '4px'
  };

  const cellTextStyle: React.CSSProperties = {
    padding: '3px 6px',
    fontSize: '11.5px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: 'block'
  };

  const selectStyle: React.CSSProperties = {
    width: '100%',
    background: 'rgba(15, 23, 42, 0.85)',
    border: '1px solid rgba(56, 189, 248, 0.3)',
    color: '#38bdf8',
    fontSize: '11px',
    fontWeight: 600,
    borderRadius: '4px',
    padding: '2px 4px',
    outline: 'none'
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName);
      if (isInput) {
        if (e.key === 'Enter') {
          e.preventDefault();
          macAudio.playSuccess();
          if (editingItemId) {
            handleAddItem();
          } else {
            handleAddSubGroup();
          }
        } else if (e.key === 'Escape') {
          e.preventDefault();
          setEditingGroupId(null);
          setEditingItemId(null);
        }
        return;
      }

      if (e.key === 'Enter' || e.key === 'Insert') {
        e.preventDefault();
        if (selectedItemId) {
          handleAddItem();
        } else {
          handleAddSubGroup();
        }
      } else if (e.key === 'F2') {
        e.preventDefault();
        if (selectedItemId) {
          macAudio.playClick();
          setEditingItemId(selectedItemId);
        } else if (selectedMainGroupId) {
          macAudio.playClick();
          setEditingGroupId(selectedMainGroupId);
        }
      } else if (e.key === 'Delete') {
        e.preventDefault();
        if (selectedItemId) {
          handleDeleteItem(selectedItemId);
        } else if (selectedMainGroupId) {
          handleDeleteSubGroup(selectedMainGroupId);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedMainGroupId, editingGroupId, selectedItemId, editingItemId, subGroups, skipItems]);

  return (
    <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1.25fr 1fr', gap: '10px', height: '100%', minHeight: 0, overflow: 'hidden' }}>
      {/* Left: Sub Groups Configuration Table */}
      <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc' }}>
            Sub Groups Configuration ({subGroups.length} Groups)
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              className="mac-btn" 
              style={{ background: 'rgba(239, 68, 68, 0.18)', borderColor: 'rgba(239, 68, 68, 0.35)', color: '#fca5a5' }} 
              onClick={purgeAndLoadPristineBackup}
              title="Purge all old data and reload fresh from BillApp_Backup.json"
            >
              <RotateCcw size={13} /> Reset to Backup
            </button>
            <button className="mac-btn primary" onClick={handleAddSubGroup}>
              <Plus size={14} /> Add Group
            </button>
          </div>
        </div>

        <div className="mac-table-container" style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
          <table className="mac-table">
            <thead>
              <tr>
                <th style={{ width: colWidths.srNo, textAlign: 'center' }}>#</th>
                <th style={{ width: colWidths.mainGroup }}>MAIN GROUP</th>
                <th style={{ width: colWidths.groupName }}>GROUP NAME</th>
                <th style={{ width: colWidths.sumCol, textAlign: 'center' }}>SUM COL</th>
                <th style={{ width: colWidths.items, textAlign: 'center' }}>ITEMS</th>
                <th style={{ width: '60px', textAlign: 'center' }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {subGroups.map((sg, idx) => {
                const isSelected = selectedMainGroupId === sg.id;
                const isEditing = editingGroupId === sg.id;
                const itemCount = skipItems.filter(si => si.subGroupId === sg.id || (si.groupName === sg.groupName && (!si.mainGroup || si.mainGroup === sg.mainGroup))).length;
                return (
                  <tr 
                    key={sg.id} 
                    className={`mac-table-row ${isSelected ? 'selected' : ''}`}
                    onClick={() => { macAudio.playClick(); setSelectedMainGroupId(sg.id); setSelectedItemId(null); }}
                    onDoubleClick={() => setEditingGroupId(sg.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td style={{ textAlign: 'center', color: '#64748b', fontSize: '11px', userSelect: 'none' }}>
                      {idx + 1}
                    </td>

                    {/* MAIN GROUP */}
                    <td style={{ padding: '2px' }}>
                      {isEditing ? (
                        <select
                          style={selectStyle}
                          value={sg.mainGroup}
                          onChange={e => handleSubGroupChange(sg.id, 'mainGroup', e.target.value)}
                          onClick={e => e.stopPropagation()}
                          autoFocus
                        >
                          {mainGroups.map(m => (
                            <option key={m.id} value={m.name} style={{ background: '#0f172a', color: '#f8fafc' }}>
                              {m.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span style={{ ...cellTextStyle, color: '#38bdf8', fontWeight: 600 }}>
                          {sg.mainGroup}
                        </span>
                      )}
                    </td>

                    {/* GROUP NAME */}
                    <td style={{ padding: '1px' }}>
                      {isEditing ? (
                        <input
                          style={{ ...cellInputStyle, fontWeight: 600, color: '#f8fafc' }}
                          value={sg.groupName}
                          onChange={e => handleSubGroupChange(sg.id, 'groupName', e.target.value)}
                          onClick={e => e.stopPropagation()}
                        />
                      ) : (
                        <span style={{ ...cellTextStyle, fontWeight: 600, color: '#f8fafc' }}>
                          {sg.groupName}
                        </span>
                      )}
                    </td>

                    {/* SUM COLUMN */}
                    <td style={{ padding: '2px', textAlign: 'center' }}>
                      {isEditing ? (
                        <select
                          style={{ ...selectStyle, color: '#a78bfa', textAlign: 'center' }}
                          value={sg.sumColumn}
                          onChange={e => handleSubGroupChange(sg.id, 'sumColumn', e.target.value)}
                          onClick={e => e.stopPropagation()}
                        >
                          <option value="QTY" style={{ background: '#0f172a', color: '#f8fafc' }}>QTY</option>
                          <option value="U CAP" style={{ background: '#0f172a', color: '#f8fafc' }}>U CAP</option>
                          <option value="L CAP" style={{ background: '#0f172a', color: '#f8fafc' }}>L CAP</option>
                        </select>
                      ) : (
                        <span style={{ ...cellTextStyle, color: '#a78bfa', fontWeight: 600, textAlign: 'center' }}>
                          {sg.sumColumn}
                        </span>
                      )}
                    </td>

                    {/* ITEM COUNT */}
                    <td style={{ textAlign: 'center', color: '#34d399', fontWeight: 700, fontSize: '11px' }}>
                      {itemCount}
                    </td>

                    {/* ACTION: SAVE BUTTON ONLY WHEN ACTIVE */}
                    <td style={{ textAlign: 'center', padding: '1px' }}>
                      {isEditing && (
                        <button
                          type="button"
                          className="mac-btn primary"
                          style={{ padding: '2px 8px', height: '22px', fontSize: '10.5px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            macAudio.playSuccess();
                            setEditingGroupId(null);
                          }}
                          title="Save Group Changes"
                        >
                          <Check size={12} /> Save
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div style={{ height: '36px' }} />
        </div>
      </div>

      {/* Right: Skip Items In-Table Editor */}
      <div 
        className="glass-panel" 
        style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, borderRadius: '12px', overflow: 'hidden' }}
        onPaste={handleItemPaste}
      >
        <div style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc' }}>
              {curSub ? `${curSub.groupName} (${itemsForSelectedGroup.length} Items)` : 'Select a Group'}
            </span>
            {curSub && (
              <input
                type="text"
                placeholder="Filter prefix..."
                value={itemSearch}
                onChange={e => setItemSearch(e.target.value)}
                style={{
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '4px',
                  padding: '2px 6px',
                  fontSize: '11px',
                  color: '#f8fafc',
                  outline: 'none',
                  width: '120px'
                }}
              />
            )}
          </div>
          {curSub && (
            <button className="mac-btn primary" onClick={handleAddItem} title="Add Row or Paste (Ctrl+V) from Excel">
              <Plus size={14} /> Add Item
            </button>
          )}
        </div>

        <div className="mac-table-container" style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
          {curSub ? (
            <table className="mac-table">
              <thead>
                <tr>
                  <th style={{ width: subColWidths.srNo, textAlign: 'center' }}>#</th>
                  <th style={{ width: subColWidths.itemName }}>ITEM NAME / PREFIX</th>
                  <th style={{ width: '60px', textAlign: 'center' }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((si, idx) => {
                  const isSelectedItem = selectedItemId === si.id;
                  const isEditingItem = editingItemId === si.id;
                  return (
                    <tr 
                      key={si.id} 
                      className={`mac-table-row ${isSelectedItem ? 'selected' : ''}`}
                      onClick={() => { setSelectedItemId(si.id); }}
                      onDoubleClick={() => setEditingItemId(si.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td style={{ textAlign: 'center', color: '#64748b', fontSize: '11px', userSelect: 'none' }}>
                        {idx + 1}
                      </td>
                      <td style={{ padding: '1px' }}>
                        {isEditingItem ? (
                          <input
                            style={{ ...cellInputStyle, fontWeight: 600, color: '#f8fafc' }}
                            value={si.itemPrefix}
                            onChange={e => handleItemChange(si.id, e.target.value)}
                            autoFocus
                          />
                        ) : (
                          <span style={{ ...cellTextStyle, fontWeight: 600, color: '#f8fafc' }}>
                            {si.itemPrefix || '—'}
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center', padding: '1px' }}>
                        {isEditingItem && (
                          <button
                            type="button"
                            className="mac-btn primary"
                            style={{ padding: '2px 8px', height: '22px', fontSize: '10.5px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              macAudio.playSuccess();
                              setEditingItemId(null);
                            }}
                            title="Save Item Changes"
                          >
                            <Check size={12} /> Save
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#64748b', fontSize: '13px' }}>
              Select a group from the left panel
            </div>
          )}
          <div style={{ height: '36px' }} />
        </div>
      </div>
    </div>
  );
};

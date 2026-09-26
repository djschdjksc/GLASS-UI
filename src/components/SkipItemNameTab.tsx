import React, { useState, useEffect } from 'react';
import { macAudio } from '../utils/macAudio';
import { Search, Plus, Trash2, Edit2, Check, X, Layers, Tag, Type } from 'lucide-react';
import { SQLITE_SKIP_MAIN_GROUPS, SQLITE_SKIP_SUB_GROUPS, SQLITE_SKIP_ITEMS } from '../data/sqliteSkipData';
import type { SkipMainGroupSeed, SkipSubGroupSeed, SkipItemSeed } from '../data/sqliteSkipData';
import { GlassInput, GlassSelect } from './common/GlassInput';

const DEFAULT_MAIN_COLS = { srNo: 40, mainGroup: 130, groupName: 200, sumCol: 80, items: 60 };
const DEFAULT_SUB_COLS = { srNo: 40, itemName: 300 };

export const SkipItemNameTab: React.FC = () => {
  const [mainGroups, setMainGroups] = useState<SkipMainGroupSeed[]>([]);
  const [subGroups, setSubGroups] = useState<SkipSubGroupSeed[]>([]);
  const [skipItems, setSkipItems] = useState<SkipItemSeed[]>([]);
  
  const [selectedMainGroupId, setSelectedMainGroupId] = useState<string | null>(null);
  const [selectedSubGroupId, setSelectedSubGroupId] = useState<string | null>(null);

  // Modals
  const [isMainModalOpen, setIsMainModalOpen] = useState(false);
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [editingMainId, setEditingMainId] = useState<string | null>(null);
  const [editingSubId, setEditingSubId] = useState<string | null>(null);
  
  const [mainFormData, setMainFormData] = useState<{ id: string; mainGroupId: string; groupName: string; sumColumn: 'QTY' | 'U CAP' | 'L CAP' }>({
    id: '', mainGroupId: '', groupName: '', sumColumn: 'QTY'
  });
  const [subFormData, setSubFormData] = useState<{ id: string; subGroupId: string; itemPrefix: string }>({
    id: '', subGroupId: '', itemPrefix: ''
  });

  const [deleteMain, setDeleteMain] = useState<SkipSubGroupSeed | null>(null);
  const [deleteSub, setDeleteSub] = useState<SkipItemSeed | null>(null);

  const [colWidths, setColWidths] = useState(() => {
    try { const saved = localStorage.getItem('modern_skip_cols'); return saved ? { ...DEFAULT_MAIN_COLS, ...JSON.parse(saved) } : DEFAULT_MAIN_COLS; } catch { return DEFAULT_MAIN_COLS; }
  });
  const [subColWidths, setSubColWidths] = useState(() => {
    try { const saved = localStorage.getItem('modern_skip_sub_cols'); return saved ? { ...DEFAULT_SUB_COLS, ...JSON.parse(saved) } : DEFAULT_SUB_COLS; } catch { return DEFAULT_SUB_COLS; }
  });

  useEffect(() => {
    try {
      const savedMain = localStorage.getItem('billapp_skip_main_groups');
      const savedSub = localStorage.getItem('billapp_skip_sub_groups');
      const savedItems = localStorage.getItem('billapp_skip_items');
      let loadedSubs = SQLITE_SKIP_SUB_GROUPS;
      if (savedMain && savedSub && savedItems) {
        const parsedItems = JSON.parse(savedItems);
        if (parsedItems.length < SQLITE_SKIP_ITEMS.length) {
          setMainGroups(SQLITE_SKIP_MAIN_GROUPS);
          setSubGroups(SQLITE_SKIP_SUB_GROUPS);
          setSkipItems(SQLITE_SKIP_ITEMS);
          localStorage.setItem('billapp_skip_main_groups', JSON.stringify(SQLITE_SKIP_MAIN_GROUPS));
          localStorage.setItem('billapp_skip_sub_groups', JSON.stringify(SQLITE_SKIP_SUB_GROUPS));
          localStorage.setItem('billapp_skip_items', JSON.stringify(SQLITE_SKIP_ITEMS));
        } else {
          setMainGroups(JSON.parse(savedMain));
          loadedSubs = JSON.parse(savedSub);
          setSubGroups(loadedSubs);
          setSkipItems(parsedItems);
        }
      } else {
        setMainGroups(SQLITE_SKIP_MAIN_GROUPS);
        setSubGroups(SQLITE_SKIP_SUB_GROUPS);
        setSkipItems(SQLITE_SKIP_ITEMS);
        localStorage.setItem('billapp_skip_main_groups', JSON.stringify(SQLITE_SKIP_MAIN_GROUPS));
        localStorage.setItem('billapp_skip_sub_groups', JSON.stringify(SQLITE_SKIP_SUB_GROUPS));
        localStorage.setItem('billapp_skip_items', JSON.stringify(SQLITE_SKIP_ITEMS));
      }
      if (loadedSubs.length > 0) {
        setSelectedMainGroupId(prev => prev || loadedSubs[0].id);
      }
    } catch {
      setMainGroups(SQLITE_SKIP_MAIN_GROUPS);
      setSubGroups(SQLITE_SKIP_SUB_GROUPS);
      setSkipItems(SQLITE_SKIP_ITEMS);
      if (SQLITE_SKIP_SUB_GROUPS.length > 0) {
        setSelectedMainGroupId(prev => prev || SQLITE_SKIP_SUB_GROUPS[0].id);
      }
    }
  }, []);

  const saveSubGroups = (data: SkipSubGroupSeed[]) => {
    setSubGroups(data); localStorage.setItem('billapp_skip_sub_groups', JSON.stringify(data));
  };
  const saveSkipItems = (data: SkipItemSeed[]) => {
    setSkipItems(data); localStorage.setItem('billapp_skip_items', JSON.stringify(data));
  };

  const startResizeMain = (colKey: keyof typeof DEFAULT_MAIN_COLS, e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    const startX = e.clientX; const startW = colWidths[colKey] || 100;
    const handleMouseMove = (moveEvent: MouseEvent) => {
      setColWidths((prev:any) => {
        const next = { ...prev, [colKey]: Math.max(40, startW + (moveEvent.clientX - startX)) };
        try { localStorage.setItem('modern_skip_cols', JSON.stringify(next)); } catch {}
        return next;
      });
    };
    const handleMouseUp = () => { document.body.style.cursor = ''; document.body.style.userSelect = 'text'; window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', handleMouseUp); };
    document.body.style.cursor = 'col-resize'; document.body.style.userSelect = 'none'; window.addEventListener('mousemove', handleMouseMove); window.addEventListener('mouseup', handleMouseUp);
  };

  const startResizeSub = (colKey: keyof typeof DEFAULT_SUB_COLS, e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    const startX = e.clientX; const startW = subColWidths[colKey] || 100;
    const handleMouseMove = (moveEvent: MouseEvent) => {
      setSubColWidths((prev:any) => {
        const next = { ...prev, [colKey]: Math.max(40, startW + (moveEvent.clientX - startX)) };
        try { localStorage.setItem('modern_skip_sub_cols', JSON.stringify(next)); } catch {}
        return next;
      });
    };
    const handleMouseUp = () => { document.body.style.cursor = ''; document.body.style.userSelect = 'text'; window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', handleMouseUp); };
    document.body.style.cursor = 'col-resize'; document.body.style.userSelect = 'none'; window.addEventListener('mousemove', handleMouseMove); window.addEventListener('mouseup', handleMouseUp);
  };

  const handleMainKeyDown = (e: React.KeyboardEvent) => {
    if (isMainModalOpen || isSubModalOpen || deleteMain || deleteSub) return;
    const idx = subGroups.findIndex(s => s.id === selectedMainGroupId);
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (idx < subGroups.length - 1) setSelectedMainGroupId(subGroups[idx + 1].id);
      else if (subGroups.length > 0) setSelectedMainGroupId(subGroups[0].id);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (idx > 0) setSelectedMainGroupId(subGroups[idx - 1].id);
      else if (subGroups.length > 0) setSelectedMainGroupId(subGroups[subGroups.length - 1].id);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedMainGroupId) {
        const item = subGroups.find(s => s.id === selectedMainGroupId);
        if (item) { setEditingMainId(item.id); setMainFormData({ ...item }); setIsMainModalOpen(true); macAudio.playClick(); }
      } else {
        setEditingMainId(null); setMainFormData({ id: 'sg-' + Date.now(), mainGroupId: mainGroups[0]?.id || '', groupName: '', sumColumn: 'QTY' }); setIsMainModalOpen(true); macAudio.playClick();
      }
    } else if (e.key === 'Delete' && selectedMainGroupId) {
      e.preventDefault();
      const item = subGroups.find(s => s.id === selectedMainGroupId);
      if (item) { setDeleteMain(item); macAudio.playPop(); }
    }
  };

  const handleSubKeyDown = (e: React.KeyboardEvent) => {
    if (isMainModalOpen || isSubModalOpen || deleteMain || deleteSub) return;
    const items = skipItems.filter(si => si.subGroupId === selectedMainGroupId);
    const idx = items.findIndex(s => s.id === selectedSubGroupId);
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (idx < items.length - 1) setSelectedSubGroupId(items[idx + 1].id);
      else if (items.length > 0) setSelectedSubGroupId(items[0].id);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (idx > 0) setSelectedSubGroupId(items[idx - 1].id);
      else if (items.length > 0) setSelectedSubGroupId(items[items.length - 1].id);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedSubGroupId) {
        const item = items.find(s => s.id === selectedSubGroupId);
        if (item) { setEditingSubId(item.id); setSubFormData({ ...item }); setIsSubModalOpen(true); macAudio.playClick(); }
      } else if (selectedMainGroupId) {
        setEditingSubId(null); setSubFormData({ id: 'si-' + Date.now(), subGroupId: selectedMainGroupId, itemPrefix: '' }); setIsSubModalOpen(true); macAudio.playClick();
      }
    } else if (e.key === 'Delete' && selectedSubGroupId) {
      e.preventDefault();
      const item = items.find(s => s.id === selectedSubGroupId);
      if (item) { setDeleteSub(item); macAudio.playPop(); }
    }
  };

  const handleMainSubmit = (e: React.FormEvent) => {
    e.preventDefault(); macAudio.playClick();
    if (editingMainId) saveSubGroups(subGroups.map(sg => sg.id === editingMainId ? { ...mainFormData } : sg));
    else saveSubGroups([...subGroups, { ...mainFormData }]);
    setIsMainModalOpen(false);
  };
  const handleSubSubmit = (e: React.FormEvent) => {
    e.preventDefault(); macAudio.playClick();
    if (editingSubId) saveSkipItems(skipItems.map(si => si.id === editingSubId ? { ...subFormData } : si));
    else saveSkipItems([...skipItems, { ...subFormData }]);
    setIsSubModalOpen(false);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px', height: '100%' }}>
      {/* Left: Main Groups */}
      <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', borderRadius: '12px', overflow: 'hidden' }} tabIndex={0} onKeyDown={handleMainKeyDown}>
        <div style={{ padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc' }}>Sub Groups Configuration (Enter to Add)</span>
          <button className="mac-btn" onClick={() => { setEditingMainId(null); setMainFormData({ id: 'sg-' + Date.now(), mainGroupId: mainGroups[0]?.id || '', groupName: '', sumColumn: 'QTY' }); setIsMainModalOpen(true); macAudio.playClick(); }}>
            <Plus size={14} /> Add
          </button>
        </div>
        <div className="mac-table-container" style={{ flex: 1, overflow: 'auto' }}>
          <table className="mac-table">
            <thead>
              <tr>
                <th style={{ width: colWidths.srNo, textAlign: 'center', position: 'relative' }}>#<div className="th-resizer" onMouseDown={e => startResizeMain('srNo', e)} /></th>
                <th style={{ width: colWidths.mainGroup, position: 'relative' }}>MAIN GROUP<div className="th-resizer" onMouseDown={e => startResizeMain('mainGroup', e)} /></th>
                <th style={{ width: colWidths.groupName, position: 'relative' }}>GROUP NAME<div className="th-resizer" onMouseDown={e => startResizeMain('groupName', e)} /></th>
                <th style={{ width: colWidths.sumCol, textAlign: 'center', position: 'relative' }}>SUM COL<div className="th-resizer" onMouseDown={e => startResizeMain('sumCol', e)} /></th>
                <th style={{ width: colWidths.items, textAlign: 'center', position: 'relative' }}>ITEMS<div className="th-resizer" onMouseDown={e => startResizeMain('items', e)} /></th>
              </tr>
            </thead>
            <tbody>
              {subGroups.map((sg, idx) => {
                const parentMain = mainGroups.find(m => m.id === sg.mainGroupId);
                const itemCount = skipItems.filter(si => si.subGroupId === sg.id).length;
                return (
                  <tr key={sg.id} className={`mac-table-row ${selectedMainGroupId === sg.id ? 'selected' : ''}`} onClick={() => { macAudio.playClick(); setSelectedMainGroupId(sg.id); }} onDoubleClick={() => { setEditingMainId(sg.id); setMainFormData({ ...sg }); setIsMainModalOpen(true); }}>
                    <td style={{ textAlign: 'center', color: '#64748b' }}>{idx + 1}</td>
                    <td style={{ fontWeight: 600, color: '#38bdf8' }}>{parentMain?.name || '-'}</td>
                    <td style={{ color: '#f8fafc' }}>{sg.groupName}</td>
                    <td style={{ textAlign: 'center', color: '#a78bfa', fontWeight: 600 }}>{sg.sumColumn}</td>
                    <td style={{ textAlign: 'center', color: '#34d399', fontWeight: 700 }}>{itemCount}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Right: Items */}
      <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', borderRadius: '12px', overflow: 'hidden' }} tabIndex={0} onKeyDown={handleSubKeyDown}>
        <div style={{ padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc' }}>{selectedMainGroupId ? 'Items for Group (Enter to Add)' : 'Select a Group'}</span>
          {selectedMainGroupId && <button className="mac-btn" onClick={() => { setEditingSubId(null); setSubFormData({ id: 'si-' + Date.now(), subGroupId: selectedMainGroupId, itemPrefix: '' }); setIsSubModalOpen(true); macAudio.playClick(); }}><Plus size={14} /> Add Item</button>}
        </div>
        <div className="mac-table-container" style={{ flex: 1, overflow: 'auto' }}>
          {selectedMainGroupId ? (
            <table className="mac-table">
              <thead>
                <tr>
                  <th style={{ width: subColWidths.srNo, textAlign: 'center', position: 'relative' }}>#<div className="th-resizer" onMouseDown={e => startResizeSub('srNo', e)} /></th>
                  <th style={{ width: subColWidths.itemName, position: 'relative' }}>ITEM NAME / PREFIX<div className="th-resizer" onMouseDown={e => startResizeSub('itemName', e)} /></th>
                </tr>
              </thead>
              <tbody>
                {skipItems.filter(si => si.subGroupId === selectedMainGroupId).map((si, idx) => (
                  <tr key={si.id} className={`mac-table-row ${selectedSubGroupId === si.id ? 'selected' : ''}`} onClick={() => { macAudio.playClick(); setSelectedSubGroupId(si.id); }} onDoubleClick={() => { setEditingSubId(si.id); setSubFormData({ ...si }); setIsSubModalOpen(true); }}>
                    <td style={{ textAlign: 'center', color: '#64748b' }}>{idx + 1}</td>
                    <td style={{ fontWeight: 600, color: '#f8fafc' }}>{si.itemPrefix}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#64748b', fontSize: '13px' }}>Select a group from the left panel</div>}
        </div>
      </div>

      {/* MODALS */}
      {isMainModalOpen && (
        <div className="mac-modal-backdrop" onClick={() => setIsMainModalOpen(false)}>
          <div className="mac-modal-card glass-panel" onClick={e => e.stopPropagation()} style={{ width: '480px', maxWidth: '94vw', borderRadius: '12px', padding: '18px 22px', background: 'linear-gradient(135deg, rgba(13, 21, 38, 0.96) 0%, rgba(8, 14, 26, 0.98) 100%)', border: '1px solid rgba(56, 189, 248, 0.35)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '10px' }}><Layers size={15} color="#38bdf8" /><div style={{ fontSize: '13px', fontWeight: 800, color: '#f8fafc' }}>{editingMainId ? 'EDIT GROUP' : 'NEW GROUP'}</div></div>
            <form onSubmit={handleMainSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <GlassSelect
                label="MAIN GROUP"
                value={mainFormData.mainGroupId}
                onChange={e => setMainFormData({...mainFormData, mainGroupId: e.target.value})}
                icon={Tag}
              >
                {mainGroups.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </GlassSelect>
              <GlassInput
                label="GROUP NAME *"
                value={mainFormData.groupName}
                onChange={e => setMainFormData({...mainFormData, groupName: e.target.value})}
                icon={Layers}
                required
                inputStyle={{ fontWeight: 700 }}
              />
              <GlassSelect
                label="SUM COLUMN"
                value={mainFormData.sumColumn}
                onChange={e => setMainFormData({...mainFormData, sumColumn: e.target.value as any})}
                icon={Type}
              >
                <option value="QTY">QTY</option>
                <option value="U CAP">U CAP</option>
                <option value="L CAP">L CAP</option>
              </GlassSelect>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '10px' }}>
                <button type="button" onClick={() => setIsMainModalOpen(false)} className="mac-btn">Cancel</button>
                <button type="submit" className="mac-btn primary"><Check size={14} /> {editingMainId ? 'Update' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isSubModalOpen && (
        <div className="mac-modal-backdrop" onClick={() => setIsSubModalOpen(false)}>
          <div className="mac-modal-card glass-panel" onClick={e => e.stopPropagation()} style={{ width: '480px', maxWidth: '94vw', borderRadius: '12px', padding: '18px 22px', background: 'linear-gradient(135deg, rgba(13, 21, 38, 0.96) 0%, rgba(8, 14, 26, 0.98) 100%)', border: '1px solid rgba(56, 189, 248, 0.35)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '10px' }}><Type size={15} color="#38bdf8" /><div style={{ fontSize: '13px', fontWeight: 800, color: '#f8fafc' }}>{editingSubId ? 'EDIT ITEM' : 'NEW ITEM'}</div></div>
            <form onSubmit={handleSubSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <GlassInput
                label="ITEM PREFIX / NAME *"
                value={subFormData.itemPrefix}
                onChange={e => setSubFormData({...subFormData, itemPrefix: e.target.value})}
                icon={Type}
                required
                inputStyle={{ fontWeight: 700 }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '10px' }}>
                <button type="button" onClick={() => setIsSubModalOpen(false)} className="mac-btn">Cancel</button>
                <button type="submit" className="mac-btn primary"><Check size={14} /> {editingSubId ? 'Update' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteMain && (
        <div className="mac-modal-backdrop" onClick={() => setDeleteMain(null)}>
          <div className="mac-modal-card glass-panel" onClick={e => e.stopPropagation()} style={{ width: '380px', maxWidth: '90vw', borderRadius: '12px', padding: '18px 20px', background: 'linear-gradient(135deg, rgba(20, 10, 15, 0.96) 0%, rgba(10, 5, 10, 0.98) 100%)', border: '1px solid rgba(248, 113, 113, 0.4)', boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(248, 113, 113, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Trash2 size={16} color="#f87171" /></div>
              <div><div style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc' }}>Delete Group?</div><div style={{ fontSize: '11px', color: '#94a3b8' }}>Group: <strong style={{ color: '#f87171' }}>{deleteMain.groupName}</strong></div></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '10px' }}>
              <button type="button" onClick={() => setDeleteMain(null)} className="mac-btn">Cancel (Esc)</button>
              <button type="button" onClick={() => { saveSubGroups(subGroups.filter(s => s.id !== deleteMain.id)); setDeleteMain(null); macAudio.playClick(); }} className="mac-btn danger" autoFocus>Yes, Delete (Enter)</button>
            </div>
          </div>
        </div>
      )}

      {deleteSub && (
        <div className="mac-modal-backdrop" onClick={() => setDeleteSub(null)}>
          <div className="mac-modal-card glass-panel" onClick={e => e.stopPropagation()} style={{ width: '380px', maxWidth: '90vw', borderRadius: '12px', padding: '18px 20px', background: 'linear-gradient(135deg, rgba(20, 10, 15, 0.96) 0%, rgba(10, 5, 10, 0.98) 100%)', border: '1px solid rgba(248, 113, 113, 0.4)', boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(248, 113, 113, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Trash2 size={16} color="#f87171" /></div>
              <div><div style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc' }}>Delete Item?</div><div style={{ fontSize: '11px', color: '#94a3b8' }}>Item: <strong style={{ color: '#f87171' }}>{deleteSub.itemPrefix}</strong></div></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '10px' }}>
              <button type="button" onClick={() => setDeleteSub(null)} className="mac-btn">Cancel (Esc)</button>
              <button type="button" onClick={() => { saveSkipItems(skipItems.filter(s => s.id !== deleteSub.id)); setDeleteSub(null); macAudio.playClick(); }} className="mac-btn danger" autoFocus>Yes, Delete (Enter)</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { macAudio } from '../utils/macAudio';
import { Search, Plus, Trash2, Edit2, Check, Tag, Hash, FileText, Layers, Banknote } from 'lucide-react';
import { PREFILLED_BILL_MAPS } from '../data/billMapsData';
import type { BillNameMap } from '../data/billMapsData';
import { GlassInput, GlassSelect } from './common/GlassInput';

const DEFAULT_BILL_COLS = { srNo: 40, on: 40, shortCode: 150, printName: 300, rate: 80, category: 130 };



export const BillItemNameTab: React.FC = () => {
  const [maps, setMaps] = useState<BillNameMap[]>([]);
  const [search, setSearch] = useState('');
  
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<BillNameMap>({ id: '', isActive: true, shortCode: '', printName: '', rate: 0, category: '' });
  const [itemToDelete, setItemToDelete] = useState<BillNameMap | null>(null);

  const [colWidths, setColWidths] = useState(() => {
    try { const saved = localStorage.getItem('modern_bill_name_cols'); return saved ? { ...DEFAULT_BILL_COLS, ...JSON.parse(saved) } : DEFAULT_BILL_COLS; } catch { return DEFAULT_BILL_COLS; }
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem('billapp_bill_maps');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.length < 10) {
            setMaps(PREFILLED_BILL_MAPS);
            localStorage.setItem('billapp_bill_maps', JSON.stringify(PREFILLED_BILL_MAPS));
        } else {
            setMaps(parsed);
        }
      }
      else { setMaps(PREFILLED_BILL_MAPS); localStorage.setItem('billapp_bill_maps', JSON.stringify(PREFILLED_BILL_MAPS)); }
    } catch { setMaps(PREFILLED_BILL_MAPS); }
  }, []);

  const saveMaps = (data: BillNameMap[]) => { setMaps(data); localStorage.setItem('billapp_bill_maps', JSON.stringify(data)); };

  const startResizeBill = (colKey: keyof typeof DEFAULT_BILL_COLS, e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    const startX = e.clientX; const startW = colWidths[colKey] || 100;
    const handleMouseMove = (moveEvent: MouseEvent) => {
      setColWidths((prev:any) => {
        const next = { ...prev, [colKey]: Math.max(30, startW + (moveEvent.clientX - startX)) };
        try { localStorage.setItem('modern_bill_name_cols', JSON.stringify(next)); } catch {}
        return next;
      });
    };
    const handleMouseUp = () => { document.body.style.cursor = ''; document.body.style.userSelect = 'text'; window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', handleMouseUp); };
    document.body.style.cursor = 'col-resize'; document.body.style.userSelect = 'none'; window.addEventListener('mousemove', handleMouseMove); window.addEventListener('mouseup', handleMouseUp);
  };

  const filteredMaps = maps.filter(m => m.shortCode.toLowerCase().includes(search.toLowerCase()) || m.printName.toLowerCase().includes(search.toLowerCase()) || m.category.toLowerCase().includes(search.toLowerCase()));

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isModalOpen || itemToDelete) return;
    const idx = filteredMaps.findIndex(m => m.id === selectedId);
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (idx < filteredMaps.length - 1) setSelectedId(filteredMaps[idx + 1].id);
      else if (filteredMaps.length > 0) setSelectedId(filteredMaps[0].id);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (idx > 0) setSelectedId(filteredMaps[idx - 1].id);
      else if (filteredMaps.length > 0) setSelectedId(filteredMaps[filteredMaps.length - 1].id);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedId) {
        const item = filteredMaps.find(m => m.id === selectedId);
        if (item) { setEditingId(item.id); setFormData({ ...item }); setIsModalOpen(true); macAudio.playClick(); }
      } else {
        setEditingId(null); setFormData({ id: 'bm' + Date.now(), isActive: true, shortCode: '', printName: '', rate: 0, category: '' }); setIsModalOpen(true); macAudio.playClick();
      }
    } else if (e.key === 'Delete' && selectedId) {
      e.preventDefault();
      const item = filteredMaps.find(m => m.id === selectedId);
      if (item) { setItemToDelete(item); macAudio.playPop(); }
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault(); macAudio.playClick();
    if (editingId) saveMaps(maps.map(m => m.id === editingId ? { ...formData } : m));
    else saveMaps([{ ...formData }, ...maps]);
    setIsModalOpen(false);
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, gap: '8px', overflow: 'hidden' }} tabIndex={0} onKeyDown={handleKeyDown} className="mac-focus-ring">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <GlassInput
          label="Search bill names..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          icon={Search}
          style={{ minWidth: '300px' }}
          inputStyle={{ fontSize: '12px' }}
        />
        <button className="mac-btn primary" onClick={() => { setEditingId(null); setFormData({ id: 'bm' + Date.now(), isActive: true, shortCode: '', printName: '', rate: 0, category: '' }); setIsModalOpen(true); macAudio.playClick(); }}>
          <Plus size={14} /><span>New Map (Enter)</span>
        </button>
      </div>

      <div className="glass-panel" style={{ flex: 1, minHeight: 0, overflow: 'auto', borderRadius: '8px', padding: '6px' }}>
        <table className="apple-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ width: `${colWidths.srNo}px`, textAlign: 'center', position: 'relative' }}>#<div className="th-resizer" onMouseDown={e => startResizeBill('srNo', e)} /></th>
              <th style={{ width: `${colWidths.on}px`, textAlign: 'center', position: 'relative' }}>ON<div className="th-resizer" onMouseDown={e => startResizeBill('on', e)} /></th>
              <th style={{ width: `${colWidths.shortCode}px`, position: 'relative' }}>SHORT CODE<div className="th-resizer" onMouseDown={e => startResizeBill('shortCode', e)} /></th>
              <th style={{ width: `${colWidths.printName}px`, position: 'relative' }}>PRINT / INVOICE NAME<div className="th-resizer" onMouseDown={e => startResizeBill('printName', e)} /></th>
              <th style={{ width: `${colWidths.rate}px`, textAlign: 'center', position: 'relative' }}>RATE<div className="th-resizer" onMouseDown={e => startResizeBill('rate', e)} /></th>
              <th style={{ width: `${colWidths.category}px`, position: 'relative' }}>CATEGORY<div className="th-resizer" onMouseDown={e => startResizeBill('category', e)} /></th>
            </tr>
          </thead>
          <tbody>
            {filteredMaps.map((m, idx) => (
              <tr key={m.id} className={`mac-table-row ${selectedId === m.id ? 'selected' : ''}`} onClick={() => { macAudio.playClick(); setSelectedId(m.id); }} onDoubleClick={() => { setEditingId(m.id); setFormData({ ...m }); setIsModalOpen(true); }}>
                <td style={{ textAlign: 'center', color: '#64748b' }}>{idx + 1}</td>
                <td style={{ textAlign: 'center' }}>
                  <div className={`mac-checkbox ${m.isActive ? 'checked' : ''}`} onClick={(e) => { e.stopPropagation(); macAudio.playClick(); saveMaps(maps.map(x => x.id === m.id ? { ...x, isActive: !x.isActive } : x)); }} style={{ margin: '0 auto' }}>
                    {m.isActive && <Check size={12} color="#fff" strokeWidth={3} />}
                  </div>
                </td>
                <td style={{ fontWeight: 600, color: '#38bdf8' }}>{m.shortCode}</td>
                <td style={{ fontWeight: 600, color: '#f8fafc' }}>{m.printName}</td>
                <td style={{ textAlign: 'center', color: '#fbbf24', fontWeight: 700 }}>₹{m.rate}</td>
                <td style={{ color: '#a78bfa' }}>{m.category}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ height: '36px' }} />
      </div>

      {isModalOpen && (
        <div className="mac-modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="mac-modal-card glass-panel" onClick={e => e.stopPropagation()} style={{ width: '480px', maxWidth: '94vw', borderRadius: '12px', padding: '18px 22px', background: 'linear-gradient(135deg, rgba(13, 21, 38, 0.96) 0%, rgba(8, 14, 26, 0.98) 100%)', border: '1px solid rgba(56, 189, 248, 0.35)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '10px' }}><Tag size={15} color="#38bdf8" /><div style={{ fontSize: '13px', fontWeight: 800, color: '#f8fafc' }}>{editingId ? 'EDIT MAP' : 'NEW MAP'}</div></div>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <GlassInput
                label="SHORT CODE *"
                value={formData.shortCode}
                onChange={e => setFormData({...formData, shortCode: e.target.value.toUpperCase()})}
                icon={Hash}
                required
                inputStyle={{ fontWeight: 700, color: '#38bdf8' }}
              />
              <GlassInput
                label="PRINT / INVOICE NAME *"
                value={formData.printName}
                onChange={e => setFormData({...formData, printName: e.target.value.toUpperCase()})}
                icon={FileText}
                required
                inputStyle={{ fontWeight: 700, color: '#f8fafc' }}
              />
              <GlassInput
                label="RATE *"
                type="number"
                step="0.01"
                required
                value={formData.rate}
                onChange={e => setFormData({...formData, rate: parseFloat(e.target.value) || 0})}
                icon={Banknote}
                inputStyle={{ color: '#fbbf24', fontWeight: 700 }}
              />
              <GlassInput
                label="CATEGORY"
                value={formData.category}
                onChange={e => setFormData({...formData, category: e.target.value.toUpperCase()})}
                icon={Layers}
                inputStyle={{ color: '#a78bfa' }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '10px' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="mac-btn">Cancel</button>
                <button type="submit" className="mac-btn primary"><Check size={14} /> {editingId ? 'Update' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {itemToDelete && (
        <div className="mac-modal-backdrop" onClick={() => setItemToDelete(null)}>
          <div className="mac-modal-card glass-panel" onClick={e => e.stopPropagation()} style={{ width: '380px', maxWidth: '90vw', borderRadius: '12px', padding: '18px 20px', background: 'linear-gradient(135deg, rgba(20, 10, 15, 0.96) 0%, rgba(10, 5, 10, 0.98) 100%)', border: '1px solid rgba(248, 113, 113, 0.4)', boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(248, 113, 113, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Trash2 size={16} color="#f87171" /></div>
              <div><div style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc' }}>Delete Map?</div><div style={{ fontSize: '11px', color: '#94a3b8' }}>Map: <strong style={{ color: '#f87171' }}>{itemToDelete.shortCode}</strong></div></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '10px' }}>
              <button type="button" onClick={() => setItemToDelete(null)} className="mac-btn">Cancel (Esc)</button>
              <button type="button" onClick={() => { saveMaps(maps.filter(m => m.id !== itemToDelete.id)); setItemToDelete(null); macAudio.playClick(); }} className="mac-btn danger" autoFocus>Yes, Delete (Enter)</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

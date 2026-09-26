import React, { useState, useEffect, useRef } from 'react';
import { macAudio } from '../utils/macAudio';
import { Search, Plus, Trash2, Edit2, Check, Layers, Tag, Hash, Percent, FileText, Scale, Package } from 'lucide-react';
import { SQLITE_CONTROL_CONVERSIONS } from '../data/sqliteControlPanel';
import type { SqliteControlRow } from '../data/sqliteControlPanel';
import { GlassInput, GlassSelect } from './common/GlassInput';

const CONV_COL_DEFAULTS = {
  srNo: 40,
  shortcut: 110,
  conversion: 200,
  uCap: 100,
  lCap: 100,
  multiplication: 80,
  color: 70,
  boxSize: 80,
  weight: 90,
  realItemName: 250,
  groupName: 120
};

export const ManageConversionsTab: React.FC = () => {
  const [conversions, setConversions] = useState<SqliteControlRow[]>([]);
  const [search, setSearch] = useState('');
  
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [itemToDelete, setItemToDelete] = useState<SqliteControlRow | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<SqliteControlRow>({
    shortcut: '', conversion: '', u_cap: 0, l_cap: 0, multiplication: 1, 
    color: '#ffffff', box_size: 1, weight_per_pcs: 0, real_item_name: '', group_name: ''
  });

  const [colWidths, setColWidths] = useState(() => {
    try {
      const saved = localStorage.getItem('modern_conv_cols');
      return saved ? { ...CONV_COL_DEFAULTS, ...JSON.parse(saved) } : CONV_COL_DEFAULTS;
    } catch { return CONV_COL_DEFAULTS; }
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem('billapp_conversions');
      if (saved) {
        setConversions(JSON.parse(saved));
      } else {
        setConversions(SQLITE_CONTROL_CONVERSIONS);
        localStorage.setItem('billapp_conversions', JSON.stringify(SQLITE_CONTROL_CONVERSIONS));
      }
    } catch {
      setConversions(SQLITE_CONTROL_CONVERSIONS);
    }
  }, []);

  const saveToStorage = (data: SqliteControlRow[]) => {
    setConversions(data);
    localStorage.setItem('billapp_conversions', JSON.stringify(data));
  };

  const startColResize = (colKey: keyof typeof CONV_COL_DEFAULTS, e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    const startX = e.clientX; 
    const startW = colWidths[colKey] || 100;
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const newWidth = Math.max(40, startW + (moveEvent.clientX - startX));
      setColWidths((prev:any) => {
        const next = { ...prev, [colKey]: newWidth };
        try { localStorage.setItem('modern_conv_cols', JSON.stringify(next)); } catch {}
        return next;
      });
    };
    const handleMouseUp = () => { document.body.style.cursor = ''; document.body.style.userSelect = 'text'; window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', handleMouseUp); };
    document.body.style.cursor = 'col-resize'; document.body.style.userSelect = 'none'; window.addEventListener('mousemove', handleMouseMove); window.addEventListener('mouseup', handleMouseUp);
  };

  const filteredConversions = conversions.filter(c => 
    c.conversion.toLowerCase().includes(search.toLowerCase()) || 
    c.shortcut.toLowerCase().includes(search.toLowerCase()) ||
    c.real_item_name.toLowerCase().includes(search.toLowerCase())
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isModalOpen || itemToDelete) return;
    const idx = filteredConversions.findIndex(c => c.shortcut === selectedId);
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (idx < filteredConversions.length - 1) setSelectedId(filteredConversions[idx + 1].shortcut);
      else if (filteredConversions.length > 0) setSelectedId(filteredConversions[0].shortcut);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (idx > 0) setSelectedId(filteredConversions[idx - 1].shortcut);
      else if (filteredConversions.length > 0) setSelectedId(filteredConversions[filteredConversions.length - 1].shortcut);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedId) {
        const item = filteredConversions.find(c => c.shortcut === selectedId);
        if (item) openEditModal(item);
      } else {
        openAddModal();
      }
    } else if (e.key === 'Delete' && selectedId) {
      e.preventDefault();
      const item = filteredConversions.find(c => c.shortcut === selectedId);
      if (item) {
        macAudio.playPop();
        setItemToDelete(item);
      }
    }
  };

  const openAddModal = () => {
    macAudio.playClick();
    setEditingId(null);
    setFormData({
      shortcut: '', conversion: '', u_cap: 0, l_cap: 0, multiplication: 1, 
      color: '#ffffff', box_size: 1, weight_per_pcs: 0, real_item_name: '', group_name: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item: SqliteControlRow) => {
    macAudio.playClick();
    setEditingId(item.shortcut);
    setFormData({ ...item });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    macAudio.playClick();
    if (editingId) {
      saveToStorage(conversions.map(c => c.shortcut === editingId ? { ...formData } : c));
    } else {
      saveToStorage([{ ...formData }, ...conversions]);
    }
    closeModal();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '8px' }} tabIndex={0} onKeyDown={handleKeyDown} className="mac-focus-ring">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="mac-notched-field" style={{ margin: 0, padding: '6px 12px', minWidth: '300px' }}>
          <Search size={14} color="#94a3b8" />
          <input 
            type="text" 
            placeholder="Search conversions..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="mac-notched-input"
            style={{ fontSize: '12px', width: '100%' }}
          />
        </div>
        <button className="mac-btn primary" onClick={openAddModal}>
          <Plus size={14} />
          <span>New Conversion (Enter)</span>
        </button>
      </div>

      <div className="glass-panel" style={{ flex: 1, minHeight: 0, overflow: 'auto', borderRadius: '8px', padding: '6px' }}>
        <table className="apple-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ width: colWidths.srNo, textAlign: 'center', position: 'relative' }}>
                #<div className="th-resizer" onMouseDown={e => startColResize('srNo', e)} />
              </th>
              <th style={{ width: colWidths.shortcut, position: 'relative' }}>
                SHORTCUT<div className="th-resizer" onMouseDown={e => startColResize('shortcut', e)} />
              </th>
              <th style={{ width: colWidths.conversion, position: 'relative' }}>
                CONVERSION<div className="th-resizer" onMouseDown={e => startColResize('conversion', e)} />
              </th>
              <th style={{ width: colWidths.uCap, position: 'relative' }}>
                U CAP<div className="th-resizer" onMouseDown={e => startColResize('uCap', e)} />
              </th>
              <th style={{ width: colWidths.lCap, position: 'relative' }}>
                L CAP<div className="th-resizer" onMouseDown={e => startColResize('lCap', e)} />
              </th>
              <th style={{ width: colWidths.multiplication, textAlign: 'center', position: 'relative' }}>
                MULT<div className="th-resizer" onMouseDown={e => startColResize('multiplication', e)} />
              </th>
              <th style={{ width: colWidths.color, textAlign: 'center', position: 'relative' }}>
                COLOR<div className="th-resizer" onMouseDown={e => startColResize('color', e)} />
              </th>
              <th style={{ width: colWidths.boxSize, textAlign: 'center', position: 'relative' }}>
                BOX<div className="th-resizer" onMouseDown={e => startColResize('boxSize', e)} />
              </th>
              <th style={{ width: colWidths.weight, textAlign: 'center', position: 'relative' }}>
                WT/PC<div className="th-resizer" onMouseDown={e => startColResize('weight', e)} />
              </th>
              <th style={{ width: colWidths.realItemName, position: 'relative' }}>
                REAL ITEM NAME<div className="th-resizer" onMouseDown={e => startColResize('realItemName', e)} />
              </th>
              <th style={{ width: colWidths.groupName, position: 'relative' }}>
                GROUP NAME<div className="th-resizer" onMouseDown={e => startColResize('groupName', e)} />
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredConversions.map((conv, idx) => {
              const isAuto = conv.shortcut.startsWith('__auto_');
              const isSelected = selectedId === conv.shortcut;
              return (
                <tr 
                  key={conv.shortcut} 
                  className={`mac-table-row ${isSelected ? 'selected' : ''}`}
                  onClick={() => { macAudio.playClick(); setSelectedId(conv.shortcut); }}
                  onDoubleClick={() => openEditModal(conv)}
                >
                  <td style={{ textAlign: 'center', color: '#64748b' }}>{idx + 1}</td>
                  <td style={{ fontWeight: 600, color: isAuto ? '#64748b' : '#38bdf8' }}>
                    {isAuto ? '-' : conv.shortcut}
                  </td>
                  <td style={{ fontWeight: 600 }}>{conv.conversion}</td>
                  <td style={{ color: '#94a3b8' }}>{conv.u_cap || '-'}</td>
                  <td style={{ color: '#94a3b8' }}>{conv.l_cap || '-'}</td>
                  <td style={{ textAlign: 'center', color: '#a78bfa' }}>{conv.multiplication}</td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ width: '16px', height: '16px', borderRadius: '4px', background: conv.color || '#000', margin: '0 auto', border: '1px solid rgba(255,255,255,0.1)' }} title={conv.color} />
                  </td>
                  <td style={{ textAlign: 'center', color: '#fbbf24' }}>{conv.box_size}</td>
                  <td style={{ textAlign: 'center', color: '#f87171' }}>{conv.weight_per_pcs}</td>
                  <td style={{ color: '#f8fafc' }}>{conv.real_item_name}</td>
                  <td style={{ color: '#34d399' }}>{conv.group_name}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="mac-modal-backdrop" onClick={closeModal}>
          <div className="mac-modal-card glass-panel" onClick={e => e.stopPropagation()} style={{ width: '580px', maxWidth: '94vw', borderRadius: '12px', padding: '18px 22px', background: 'linear-gradient(135deg, rgba(13, 21, 38, 0.96) 0%, rgba(8, 14, 26, 0.98) 100%)', border: '1px solid rgba(56, 189, 248, 0.35)', boxShadow: '0 24px 60px rgba(0, 0, 0, 0.85)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '10px' }}>
              <Layers size={15} color="#38bdf8" />
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#f8fafc' }}>
                {editingId ? 'EDIT CONVERSION' : 'NEW CONVERSION'}
              </div>
            </div>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <GlassInput
                  label="SHORTCUT *"
                  value={formData.shortcut}
                  onChange={e => setFormData({...formData, shortcut: e.target.value})}
                  icon={Hash}
                  required
                  disabled={!!editingId}
                  inputStyle={{ fontWeight: 700, color: '#38bdf8' }}
                />
                <GlassInput
                  label="CONVERSION *"
                  value={formData.conversion}
                  onChange={e => setFormData({...formData, conversion: e.target.value})}
                  icon={Tag}
                  required
                  inputStyle={{ fontWeight: 700 }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <GlassInput
                  label="U CAP"
                  value={formData.u_cap}
                  onChange={e => setFormData({...formData, u_cap: e.target.value})}
                />
                <GlassInput
                  label="L CAP"
                  value={formData.l_cap}
                  onChange={e => setFormData({...formData, l_cap: e.target.value})}
                />
                <GlassInput
                  label="MULTIPLICATION"
                  type="number"
                  step="0.01"
                  required
                  value={formData.multiplication}
                  onChange={e => setFormData({...formData, multiplication: parseFloat(e.target.value) || 1})}
                  icon={Percent}
                  inputStyle={{ color: '#a78bfa', fontWeight: 700 }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <GlassInput
                  label="COLOR"
                  type="color"
                  value={formData.color}
                  onChange={e => setFormData({...formData, color: e.target.value})}
                  inputStyle={{ width: '100%', height: '30px', border: 'none', background: 'transparent' }}
                />
                <GlassInput
                  label="BOX SIZE"
                  type="number"
                  step="1"
                  required
                  value={formData.box_size}
                  onChange={e => setFormData({...formData, box_size: parseInt(e.target.value) || 1})}
                  icon={Package}
                  inputStyle={{ color: '#fbbf24', fontWeight: 700 }}
                />
                <GlassInput
                  label="WT/PCS"
                  type="number"
                  step="0.01"
                  required
                  value={formData.weight_per_pcs}
                  onChange={e => setFormData({...formData, weight_per_pcs: parseFloat(e.target.value) || 0})}
                  icon={Scale}
                  inputStyle={{ color: '#f87171', fontWeight: 700 }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <GlassInput
                  label="REAL ITEM NAME *"
                  value={formData.real_item_name}
                  onChange={e => setFormData({...formData, real_item_name: e.target.value})}
                  icon={FileText}
                  required
                />
                <GlassInput
                  label="GROUP NAME *"
                  value={formData.group_name}
                  onChange={e => setFormData({...formData, group_name: e.target.value})}
                  icon={Layers}
                  required
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <button type="button" onClick={closeModal} className="mac-btn">Cancel</button>
                <button type="submit" className="mac-btn primary"><Check size={14} /> {editingId ? 'Update' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {itemToDelete && (
        <div className="mac-modal-backdrop" onClick={() => setItemToDelete(null)}>
          <div className="mac-modal-card glass-panel" onClick={e => e.stopPropagation()} style={{ width: '380px', maxWidth: '90vw', borderRadius: '12px', padding: '18px 20px', background: 'linear-gradient(135deg, rgba(20, 10, 15, 0.96) 0%, rgba(10, 5, 10, 0.98) 100%)', border: '1px solid rgba(248, 113, 113, 0.4)', boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(248, 113, 113, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Trash2 size={16} color="#f87171" /></div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc' }}>Delete Conversion?</div>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>Shortcut: <strong style={{ color: '#f87171' }}>{itemToDelete.shortcut}</strong></div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '10px' }}>
              <button type="button" onClick={() => setItemToDelete(null)} className="mac-btn">Cancel (Esc)</button>
              <button type="button" onClick={() => { saveToStorage(conversions.filter(c => c.shortcut !== itemToDelete.shortcut)); setItemToDelete(null); macAudio.playClick(); }} className="mac-btn danger" autoFocus>Yes, Delete (Enter)</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

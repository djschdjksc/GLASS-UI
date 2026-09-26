import React, { useState, useEffect, useRef } from 'react';
import { macAudio } from '../utils/macAudio';
import { Search, Plus, Trash2, Check, Layers, Tag, Hash, Percent, FileText, Scale, Package, ClipboardPaste } from 'lucide-react';
import { SQLITE_CONTROL_CONVERSIONS } from '../data/sqliteControlPanel';
import type { SqliteControlRow } from '../data/sqliteControlPanel';

const CONV_COL_DEFAULTS = {
  srNo: 40,
  shortcut: 110,
  conversion: 200,
  uCap: 110,
  lCap: 110,
  multiplication: 80,
  color: 75,
  boxSize: 80,
  weight: 90,
  realItemName: 240,
  groupName: 140,
  actions: 50
};

export const ManageConversionsTab: React.FC = () => {
  const [conversions, setConversions] = useState<SqliteControlRow[]>([]);
  const [search, setSearch] = useState('');
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

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
    try {
      localStorage.setItem('billapp_conversions', JSON.stringify(data));
      localStorage.setItem('ctrl_conv_rules_v3', JSON.stringify(data));
    } catch {}
  };

  const handleCellChange = (index: number, field: keyof SqliteControlRow, value: any) => {
    const updated = [...conversions];
    updated[index] = { ...updated[index], [field]: value };
    saveToStorage(updated);
  };

  const handleAddNewRow = () => {
    macAudio.playClick();
    const newRow: SqliteControlRow = {
      shortcut: '',
      conversion: '',
      u_cap: 0,
      l_cap: 0,
      multiplication: 1,
      color: '#ffffff',
      box_size: 1,
      weight_per_pcs: 0,
      real_item_name: '',
      group_name: ''
    };
    const next = [newRow, ...conversions];
    saveToStorage(next);
    setSelectedIdx(0);
  };

  const handleDeleteRow = (index: number) => {
    macAudio.playPop();
    const next = conversions.filter((_, i) => i !== index);
    saveToStorage(next);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text');
    if (!text || (!text.includes('\t') && !text.includes('\n'))) return;

    e.preventDefault();
    macAudio.playSuccess();
    const lines = text.trim().split(/\r?\n/).filter(line => line.trim().length > 0);
    const parsedRows: SqliteControlRow[] = lines.map(line => {
      const cols = line.split('\t').map(c => c.trim());
      return {
        shortcut: cols[0] || '',
        conversion: cols[1] || cols[0] || '',
        u_cap: cols[2] !== undefined && !isNaN(Number(cols[2])) ? Number(cols[2]) : (cols[2] || 0),
        l_cap: cols[3] !== undefined && !isNaN(Number(cols[3])) ? Number(cols[3]) : (cols[3] || 0),
        multiplication: cols[4] ? Number(cols[4]) || 1 : 1,
        color: cols[5] || '#ffffff',
        box_size: cols[6] ? Number(cols[6]) || 1 : 1,
        weight_per_pcs: cols[7] ? Number(cols[7]) || 0 : 0,
        real_item_name: cols[8] || '',
        group_name: cols[9] || ''
      };
    });

    if (parsedRows.length > 0) {
      const next = [...parsedRows, ...conversions];
      saveToStorage(next);
    }
  };

  const startColResize = (colKey: keyof typeof CONV_COL_DEFAULTS, e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    const startX = e.clientX; 
    const startW = colWidths[colKey] || 100;
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const newWidth = Math.max(35, startW + (moveEvent.clientX - startX));
      setColWidths((prev:any) => {
        const next = { ...prev, [colKey]: newWidth };
        try { localStorage.setItem('modern_conv_cols', JSON.stringify(next)); } catch {}
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

  const filtered = conversions.map((item, originalIndex) => ({ item, originalIndex }))
    .filter(({ item }) =>
      item.conversion.toLowerCase().includes(search.toLowerCase()) || 
      item.shortcut.toLowerCase().includes(search.toLowerCase()) ||
      item.real_item_name.toLowerCase().includes(search.toLowerCase()) ||
      item.group_name.toLowerCase().includes(search.toLowerCase())
    );

  const cellInputStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    background: 'transparent',
    border: 'none',
    outline: 'none',
    color: '#f8fafc',
    fontSize: '11.5px',
    padding: '3px 6px',
    fontFamily: 'inherit',
    borderRadius: '4px',
    transition: 'background 0.15s ease, box-shadow 0.15s ease'
  };

  return (
    <div 
      style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, gap: '8px', overflow: 'hidden' }}
      onPaste={handlePaste}
    >
      {/* Top Search & Actions Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="mac-notched-field" style={{ margin: 0, padding: '5px 12px', minWidth: '280px' }}>
            <Search size={14} color="#94a3b8" />
            <input 
              type="text" 
              placeholder="Search shortcuts, conversion or group..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="mac-notched-input"
              style={{ fontSize: '12px', width: '100%' }}
            />
          </div>
          <span style={{ fontSize: '11px', color: '#94a3b8' }}>
            {filtered.length} conversions • In-Table Fast Edit • Bulk Paste Enabled (Ctrl+V)
          </span>
        </div>

        <button className="mac-btn primary" onClick={handleAddNewRow}>
          <Plus size={14} />
          <span>Add Row</span>
        </button>
      </div>

      {/* Main Full-Width In-Table Editor */}
      <div className="glass-panel" style={{ flex: 1, minHeight: 0, overflow: 'auto', borderRadius: '8px', padding: '4px' }}>
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
              <th style={{ width: colWidths.actions, textAlign: 'center', position: 'relative' }}>
                DEL
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(({ item: conv, originalIndex }, idx) => {
              const isSelected = selectedIdx === originalIndex;
              return (
                <tr 
                  key={originalIndex} 
                  className={`mac-table-row ${isSelected ? 'selected' : ''}`}
                  onClick={() => setSelectedIdx(originalIndex)}
                >
                  {/* # */}
                  <td style={{ textAlign: 'center', color: '#64748b', fontSize: '11px', userSelect: 'none' }}>
                    {idx + 1}
                  </td>

                  {/* SHORTCUT */}
                  <td style={{ padding: '1px' }}>
                    <input
                      style={{ ...cellInputStyle, fontWeight: 700, color: '#38bdf8' }}
                      value={conv.shortcut.startsWith('__auto_') ? '' : conv.shortcut}
                      placeholder="e.g. 21"
                      onChange={e => handleCellChange(originalIndex, 'shortcut', e.target.value)}
                    />
                  </td>

                  {/* CONVERSION */}
                  <td style={{ padding: '1px' }}>
                    <input
                      style={{ ...cellInputStyle, fontWeight: 600, color: '#f8fafc' }}
                      value={conv.conversion}
                      placeholder="e.g. C.M"
                      onChange={e => handleCellChange(originalIndex, 'conversion', e.target.value)}
                    />
                  </td>

                  {/* U CAP */}
                  <td style={{ padding: '1px' }}>
                    <input
                      style={{ ...cellInputStyle, color: '#cbd5e1' }}
                      value={conv.u_cap || ''}
                      placeholder="e.g. 18 or name"
                      onChange={e => handleCellChange(originalIndex, 'u_cap', e.target.value)}
                    />
                  </td>

                  {/* L CAP */}
                  <td style={{ padding: '1px' }}>
                    <input
                      style={{ ...cellInputStyle, color: '#cbd5e1' }}
                      value={conv.l_cap || ''}
                      placeholder="e.g. 2 or name"
                      onChange={e => handleCellChange(originalIndex, 'l_cap', e.target.value)}
                    />
                  </td>

                  {/* MULTIPLICATION */}
                  <td style={{ padding: '1px' }}>
                    <input
                      type="number"
                      step="any"
                      style={{ ...cellInputStyle, textAlign: 'center', color: '#a78bfa' }}
                      value={conv.multiplication ?? 1}
                      onChange={e => handleCellChange(originalIndex, 'multiplication', parseFloat(e.target.value) || 1)}
                    />
                  </td>

                  {/* COLOR */}
                  <td style={{ padding: '1px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
                      <input
                        type="color"
                        value={conv.color && conv.color.startsWith('#') ? conv.color : '#ffffff'}
                        onChange={e => handleCellChange(originalIndex, 'color', e.target.value)}
                        style={{ width: '18px', height: '18px', border: 'none', background: 'transparent', cursor: 'pointer', padding: 0 }}
                      />
                    </div>
                  </td>

                  {/* BOX SIZE */}
                  <td style={{ padding: '1px' }}>
                    <input
                      type="number"
                      step="any"
                      style={{ ...cellInputStyle, textAlign: 'center', color: '#fbbf24' }}
                      value={conv.box_size ?? 1}
                      onChange={e => handleCellChange(originalIndex, 'box_size', parseFloat(e.target.value) || 1)}
                    />
                  </td>

                  {/* WEIGHT PER PCS */}
                  <td style={{ padding: '1px' }}>
                    <input
                      type="number"
                      step="any"
                      style={{ ...cellInputStyle, textAlign: 'center', color: '#f87171' }}
                      value={conv.weight_per_pcs ?? 0}
                      onChange={e => handleCellChange(originalIndex, 'weight_per_pcs', parseFloat(e.target.value) || 0)}
                    />
                  </td>

                  {/* REAL ITEM NAME */}
                  <td style={{ padding: '1px' }}>
                    <input
                      style={{ ...cellInputStyle, color: '#f8fafc' }}
                      value={conv.real_item_name || ''}
                      placeholder="Full item name..."
                      onChange={e => handleCellChange(originalIndex, 'real_item_name', e.target.value)}
                    />
                  </td>

                  {/* GROUP NAME */}
                  <td style={{ padding: '1px' }}>
                    <input
                      style={{ ...cellInputStyle, color: '#34d399', fontWeight: 600 }}
                      value={conv.group_name || ''}
                      placeholder="e.g. General"
                      onChange={e => handleCellChange(originalIndex, 'group_name', e.target.value)}
                    />
                  </td>

                  {/* ACTIONS: DELETE */}
                  <td style={{ textAlign: 'center', padding: '1px' }}>
                    <button
                      type="button"
                      className="mac-btn danger"
                      style={{ padding: '3px 6px', height: '22px' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteRow(originalIndex);
                      }}
                      title="Delete row"
                    >
                      <Trash2 size={12} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div style={{ height: '36px' }} />
      </div>
    </div>
  );
};

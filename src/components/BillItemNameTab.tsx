import React, { useState, useEffect } from 'react';
import { macAudio } from '../utils/macAudio';
import { Search, Plus, Trash2, Check, Tag, Hash, FileText, Layers, Banknote } from 'lucide-react';
import { PREFILLED_BILL_MAPS } from '../data/billMapsData';
import type { BillNameMap } from '../data/billMapsData';

const DEFAULT_BILL_COLS = { srNo: 40, on: 45, shortCode: 150, printName: 300, rate: 90, category: 140, actions: 50 };

export const BillItemNameTab: React.FC = () => {
  const [maps, setMaps] = useState<BillNameMap[]>([]);
  const [search, setSearch] = useState('');
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);

  const [colWidths, setColWidths] = useState(() => {
    try {
      const saved = localStorage.getItem('modern_bill_name_cols');
      return saved ? { ...DEFAULT_BILL_COLS, ...JSON.parse(saved) } : DEFAULT_BILL_COLS;
    } catch { return DEFAULT_BILL_COLS; }
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
      } else {
        setMaps(PREFILLED_BILL_MAPS);
        localStorage.setItem('billapp_bill_maps', JSON.stringify(PREFILLED_BILL_MAPS));
      }
    } catch {
      setMaps(PREFILLED_BILL_MAPS);
    }
  }, []);

  const saveMaps = (data: BillNameMap[]) => {
    setMaps(data);
    localStorage.setItem('billapp_bill_maps', JSON.stringify(data));
  };

  const handleCellChange = (index: number, field: keyof BillNameMap, value: any) => {
    const next = [...maps];
    next[index] = { ...next[index], [field]: value };
    saveMaps(next);
  };

  const handleAddNewRow = () => {
    macAudio.playClick();
    const newRow: BillNameMap = {
      id: 'bm' + Date.now(),
      isActive: true,
      shortCode: '',
      printName: '',
      rate: 0,
      category: ''
    };
    const next = [newRow, ...maps];
    saveMaps(next);
    setSelectedIdx(0);
    setEditingIdx(0);
  };

  const handleDeleteRow = (index: number) => {
    macAudio.playPop();
    const next = maps.filter((_, i) => i !== index);
    saveMaps(next);
    if (selectedIdx === index) {
      setSelectedIdx(null);
      setEditingIdx(null);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text');
    if (!text || (!text.includes('\t') && !text.includes('\n'))) return;

    e.preventDefault();
    macAudio.playSuccess();
    const lines = text.trim().split(/\r?\n/).filter(line => line.trim().length > 0);
    const parsedRows: BillNameMap[] = lines.map((line, idx) => {
      const cols = line.split('\t').map(c => c.trim());
      return {
        id: 'bm' + (Date.now() + idx),
        isActive: true,
        shortCode: cols[0] || '',
        printName: cols[1] || cols[0] || '',
        rate: cols[2] ? parseFloat(cols[2]) || 0 : 0,
        category: cols[3] || 'General'
      };
    });

    if (parsedRows.length > 0) {
      const next = [...parsedRows, ...maps];
      saveMaps(next);
    }
  };

  const startResizeBill = (colKey: keyof typeof DEFAULT_BILL_COLS, e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    const startX = e.clientX; 
    const startW = colWidths[colKey] || 100;
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const newWidth = Math.max(30, startW + (moveEvent.clientX - startX));
      setColWidths((prev:any) => {
        const next = { ...prev, [colKey]: newWidth };
        try { localStorage.setItem('modern_bill_name_cols', JSON.stringify(next)); } catch {}
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

  const filtered = maps.map((item, originalIndex) => ({ item, originalIndex }))
    .filter(({ item }) =>
      item.shortCode.toLowerCase().includes(search.toLowerCase()) || 
      item.printName.toLowerCase().includes(search.toLowerCase()) || 
      item.category.toLowerCase().includes(search.toLowerCase())
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName);
      if (isInput) {
        if (e.key === 'Enter') {
          e.preventDefault();
          macAudio.playSuccess();
          handleAddNewRow();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          setEditingIdx(null);
        }
        return;
      }

      if (filtered.length === 0) return;
      const currentPos = filtered.findIndex(f => f.originalIndex === selectedIdx);

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        macAudio.playHover();
        const nextPos = currentPos < filtered.length - 1 ? currentPos + 1 : currentPos;
        setSelectedIdx(filtered[nextPos].originalIndex);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        macAudio.playHover();
        const prevPos = currentPos > 0 ? currentPos - 1 : 0;
        setSelectedIdx(filtered[prevPos].originalIndex);
      } else if (e.key === 'Enter' || e.key === 'Insert') {
        e.preventDefault();
        handleAddNewRow();
      } else if (e.key === 'F2') {
        e.preventDefault();
        if (selectedIdx !== null) {
          macAudio.playClick();
          setEditingIdx(selectedIdx);
        }
      } else if (e.key === 'Delete') {
        e.preventDefault();
        if (selectedIdx !== null) {
          handleDeleteRow(selectedIdx);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filtered, selectedIdx, editingIdx, maps]);

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
              placeholder="Search bill names or categories..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="mac-notched-input"
              style={{ fontSize: '12px', width: '100%' }}
            />
          </div>
          <span style={{ fontSize: '11px', color: '#94a3b8' }}>
            {filtered.length} names • Press Enter to Edit/Save • Del Key to Delete
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
                #<div className="th-resizer" onMouseDown={e => startResizeBill('srNo', e)} />
              </th>
              <th style={{ width: colWidths.on, textAlign: 'center', position: 'relative' }}>
                ON<div className="th-resizer" onMouseDown={e => startResizeBill('on', e)} />
              </th>
              <th style={{ width: colWidths.shortCode, position: 'relative' }}>
                SHORT CODE<div className="th-resizer" onMouseDown={e => startResizeBill('shortCode', e)} />
              </th>
              <th style={{ width: colWidths.printName, position: 'relative' }}>
                PRINT / INVOICE NAME<div className="th-resizer" onMouseDown={e => startResizeBill('printName', e)} />
              </th>
              <th style={{ width: colWidths.rate, textAlign: 'center', position: 'relative' }}>
                RATE<div className="th-resizer" onMouseDown={e => startResizeBill('rate', e)} />
              </th>
              <th style={{ width: colWidths.category, position: 'relative' }}>
                CATEGORY<div className="th-resizer" onMouseDown={e => startResizeBill('category', e)} />
              </th>
              <th style={{ width: '65px', textAlign: 'center', position: 'relative' }}>
                ACTION
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(({ item: m, originalIndex }, idx) => {
              const isSelected = selectedIdx === originalIndex;
              const isEditing = editingIdx === originalIndex;

              return (
                <tr 
                  key={m.id || originalIndex} 
                  className={`mac-table-row ${isSelected ? 'selected' : ''}`}
                  onClick={() => setSelectedIdx(originalIndex)}
                  onDoubleClick={() => setEditingIdx(originalIndex)}
                  style={{ cursor: 'pointer' }}
                >
                  {/* # */}
                  <td style={{ textAlign: 'center', color: '#64748b', fontSize: '11px', userSelect: 'none' }}>
                    {idx + 1}
                  </td>

                  {/* ACTIVE CHECKBOX */}
                  <td style={{ textAlign: 'center', padding: '2px' }}>
                    <input 
                      type="checkbox" 
                      checked={m.isActive} 
                      onChange={e => handleCellChange(originalIndex, 'isActive', e.target.checked)}
                      style={{ cursor: 'pointer', accentColor: '#38bdf8' }}
                    />
                  </td>

                  {/* SHORT CODE */}
                  <td style={{ padding: '1px' }}>
                    {isEditing ? (
                      <input
                        style={{ ...cellInputStyle, fontWeight: 700, color: '#38bdf8' }}
                        value={m.shortCode}
                        onChange={e => handleCellChange(originalIndex, 'shortCode', e.target.value)}
                        autoFocus
                      />
                    ) : (
                      <span style={{ ...cellTextStyle, fontWeight: 700, color: '#38bdf8' }}>
                        {m.shortCode || '—'}
                      </span>
                    )}
                  </td>

                  {/* PRINT NAME */}
                  <td style={{ padding: '1px' }}>
                    {isEditing ? (
                      <input
                        style={{ ...cellInputStyle, fontWeight: 600, color: '#f8fafc' }}
                        value={m.printName}
                        onChange={e => handleCellChange(originalIndex, 'printName', e.target.value)}
                      />
                    ) : (
                      <span style={{ ...cellTextStyle, fontWeight: 600, color: '#f8fafc' }}>
                        {m.printName || '—'}
                      </span>
                    )}
                  </td>

                  {/* RATE */}
                  <td style={{ padding: '1px' }}>
                    {isEditing ? (
                      <input
                        type="number"
                        step="any"
                        style={{ ...cellInputStyle, textAlign: 'center', color: '#34d399', fontWeight: 600 }}
                        value={m.rate ?? 0}
                        onChange={e => handleCellChange(originalIndex, 'rate', parseFloat(e.target.value) || 0)}
                      />
                    ) : (
                      <span style={{ ...cellTextStyle, textAlign: 'center', color: '#34d399', fontWeight: 600 }}>
                        ₹{(m.rate ?? 0).toLocaleString('en-IN')}
                      </span>
                    )}
                  </td>

                  {/* CATEGORY */}
                  <td style={{ padding: '1px' }}>
                    {isEditing ? (
                      <input
                        style={{ ...cellInputStyle, color: '#fbbf24' }}
                        value={m.category}
                        onChange={e => handleCellChange(originalIndex, 'category', e.target.value)}
                      />
                    ) : (
                      <span style={{ ...cellTextStyle, color: '#fbbf24' }}>
                        {m.category || '—'}
                      </span>
                    )}
                  </td>

                  {/* ACTIONS: SAVE BUTTON ONLY WHEN ACTIVE */}
                  <td style={{ textAlign: 'center', padding: '1px' }}>
                    {isEditing && (
                      <button
                        type="button"
                        className="mac-btn primary"
                        style={{ padding: '2px 8px', height: '22px', fontSize: '10.5px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          macAudio.playSuccess();
                          setEditingIdx(null);
                        }}
                        title="Save Row Changes"
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
  );
};

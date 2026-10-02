import React, { useState, useEffect } from 'react';
import { macAudio } from '../utils/macAudio';
import { CosmicSearchInput } from './common/CosmicSearchInput';
import { Search, Plus, Trash2, Check, Tag, Hash, FileText, Layers, Banknote } from 'lucide-react';
import { PREFILLED_BILL_MAPS } from '../data/billMapsData';
import type { BillNameMap } from '../data/billMapsData';
import UnsavedChangesModal from './UnsavedChangesModal';

const DEFAULT_BILL_COLS = { srNo: 40, on: 45, shortCode: 150, printName: 300, rate: 90, category: 140, actions: 50 };

export interface BillItemNameTabProps {
  search?: string;
  onAddRef?: React.MutableRefObject<(() => void) | null>;
}

export const BillItemNameTab: React.FC<BillItemNameTabProps> = ({
  search: externalSearch,
  onAddRef
}) => {
  const [maps, setMaps] = useState<BillNameMap[]>([]);
  const [internalSearch, setInternalSearch] = useState('');
  const search = externalSearch !== undefined ? externalSearch : internalSearch;
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [rowToDelete, setRowToDelete] = useState<{ item: BillNameMap; index: number } | null>(null);

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

  const promptDeleteRow = (item: BillNameMap, index: number) => {
    macAudio.playPop();
    setRowToDelete({ item, index });
  };

  const confirmDeleteRow = () => {
    if (!rowToDelete) return;
    const index = rowToDelete.index;
    macAudio.playSuccess();
    const next = maps.filter((_, i) => i !== index);
    saveMaps(next);
    if (selectedIdx === index) {
      if (index < next.length) {
        setSelectedIdx(index);
      } else if (index - 1 >= 0) {
        setSelectedIdx(index - 1);
      } else {
        setSelectedIdx(null);
      }
      setEditingIdx(null);
    }
    setRowToDelete(null);
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
    background: '#27272a',
    border: '1px solid #3f3f46',
    outline: 'none',
    color: '#f4f4f5',
    fontSize: '12px',
    padding: '3px 8px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    borderRadius: '4px',
    fontWeight: 500
  };

  const cellTextStyle: React.CSSProperties = {
    padding: '4px 10px',
    fontSize: '12px',
    color: '#f4f4f5',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: 'block',
    fontWeight: 500
  };


  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName);
      if (isInput) {
        if (e.key === 'Enter') {
          e.preventDefault();
          const target = e.target as HTMLElement;
          const row = target.closest('tr');
          if (row) {
            const inputs = Array.from(row.querySelectorAll('input:not([disabled]), select:not([disabled])')) as (HTMLInputElement | HTMLSelectElement)[];
            const currIdx = inputs.indexOf(target as any);
            if (currIdx >= 0 && currIdx < inputs.length - 1) {
              macAudio.playHover();
              inputs[currIdx + 1].focus();
              if ('select' in inputs[currIdx + 1]) {
                (inputs[currIdx + 1] as HTMLInputElement).select();
              }
              return;
            }
          }
          // Reached last cell of row -> finish / save editing!
          macAudio.playSuccess();
          setEditingIdx(null);
        } else if (e.key === 'ArrowRight') {
          const target = e.target as HTMLInputElement;
          const isFullSelect = target.selectionStart === 0 && target.selectionEnd === target.value?.length;
          const isAtEnd = target.selectionEnd === target.value?.length;
          if (isAtEnd || isFullSelect) {
            const row = target.closest('tr');
            if (row) {
              const inputs = Array.from(row.querySelectorAll('input:not([disabled]), select:not([disabled])')) as (HTMLInputElement | HTMLSelectElement)[];
              const currIdx = inputs.indexOf(target as any);
              if (currIdx >= 0 && currIdx < inputs.length - 1) {
                e.preventDefault();
                macAudio.playHover();
                inputs[currIdx + 1].focus();
                if ('select' in inputs[currIdx + 1]) {
                  (inputs[currIdx + 1] as HTMLInputElement).select();
                }
                return;
              }
            }
          }
        } else if (e.key === 'ArrowLeft') {
          const target = e.target as HTMLInputElement;
          const isFullSelect = target.selectionStart === 0 && target.selectionEnd === target.value?.length;
          const isAtStart = target.selectionStart === 0;
          if (isAtStart || isFullSelect) {
            const row = target.closest('tr');
            if (row) {
              const inputs = Array.from(row.querySelectorAll('input:not([disabled]), select:not([disabled])')) as (HTMLInputElement | HTMLSelectElement)[];
              const currIdx = inputs.indexOf(target as any);
              if (currIdx > 0) {
                e.preventDefault();
                macAudio.playHover();
                inputs[currIdx - 1].focus();
                if ('select' in inputs[currIdx - 1]) {
                  (inputs[currIdx - 1] as HTMLInputElement).select();
                }
                return;
              }
            }
          }
        } else if (e.key === 'Escape') {
          e.preventDefault();
          e.stopPropagation();
          setEditingIdx(null);
        }
        return;
      }

      // Escape: Cancel selection / edit mode
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        setEditingIdx(null);
        setSelectedIdx(null);
        return;
      }

      // Ctrl + Enter: Make Selected Row Editable
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (selectedIdx !== null) {
          macAudio.playClick();
          setEditingIdx(selectedIdx);
        }
        return;
      }

      // Insert Key: Insert New Row at Top (Index 0)
      if (e.key === 'Insert') {
        e.preventDefault();
        handleAddNewRow();
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
      } else if (e.key === 'Delete') {
        e.preventDefault();
        if (selectedIdx !== null && !rowToDelete) {
          const item = maps[selectedIdx];
          if (item) promptDeleteRow(item, selectedIdx);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filtered, selectedIdx, editingIdx, maps, rowToDelete]);

  useEffect(() => {
    if (onAddRef) {
      onAddRef.current = handleAddNewRow;
    }
  }, [onAddRef]);

  return (
    <div 
      style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, gap: '8px', overflow: 'hidden' }}
      onPaste={handlePaste}
    >
      {/* Top Search & Actions Bar (only when not embedded in Control Panel) */}
      {externalSearch === undefined && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CosmicSearchInput
              value={search}
              onChange={setInternalSearch}
              width={260}
            />
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>
              {filtered.length} names • Press Enter to Edit/Save • Del Key to Delete
            </span>
          </div>

          <button className="mac-btn primary" onClick={handleAddNewRow}>
            <Plus size={14} />
            <span>Add Row</span>
          </button>
        </div>
      )}

      {/* Main Full-Width In-Table Editor */}
      <div style={{ flex: 1, minHeight: 0, overflow: 'auto', borderRadius: '8px', border: '1px solid #27272a', background: '#09090b' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
          <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: '#18181b' }}>
            <tr style={{ borderBottom: '1px solid #27272a' }}>
              <th style={{ width: colWidths.srNo, padding: '8px 8px', textAlign: 'center', color: '#a1a1aa', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', position: 'relative' }}>
                #<div className="th-resizer" onMouseDown={e => startResizeBill('srNo', e)} />
              </th>
              <th style={{ width: colWidths.on, padding: '8px 8px', textAlign: 'center', color: '#a1a1aa', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', position: 'relative' }}>
                ON<div className="th-resizer" onMouseDown={e => startResizeBill('on', e)} />
              </th>
              <th style={{ width: colWidths.shortCode, padding: '8px 10px', textAlign: 'left', color: '#a1a1aa', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', position: 'relative' }}>
                SHORT CODE<div className="th-resizer" onMouseDown={e => startResizeBill('shortCode', e)} />
              </th>
              <th style={{ width: colWidths.printName, padding: '8px 10px', textAlign: 'left', color: '#a1a1aa', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', position: 'relative' }}>
                PRINT / INVOICE NAME<div className="th-resizer" onMouseDown={e => startResizeBill('printName', e)} />
              </th>
              <th style={{ width: colWidths.rate, padding: '8px 10px', textAlign: 'center', color: '#a1a1aa', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', position: 'relative' }}>
                RATE<div className="th-resizer" onMouseDown={e => startResizeBill('rate', e)} />
              </th>
              <th style={{ width: colWidths.category, padding: '8px 10px', textAlign: 'left', color: '#a1a1aa', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', position: 'relative' }}>
                CATEGORY<div className="th-resizer" onMouseDown={e => startResizeBill('category', e)} />
              </th>
              <th style={{ width: '65px', padding: '8px 8px', textAlign: 'center', color: '#a1a1aa', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', position: 'relative' }}>
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
                  style={{
                    height: '28px',
                    borderBottom: '1px solid #27272a',
                    background: isSelected ? '#1c1c1f' : idx % 2 === 0 ? 'rgba(24,24,27,0.5)' : 'transparent',
                    outline: isSelected ? '1px solid #3f3f46' : 'none',
                    outlineOffset: '-1px',
                    cursor: 'pointer',
                    transition: 'background 0.1s ease'
                  }}
                  onClick={() => setSelectedIdx(originalIndex)}
                  onDoubleClick={() => setEditingIdx(originalIndex)}
                >
                  {/* # */}
                  <td style={{ textAlign: 'center', color: '#52525b', fontSize: '11px', userSelect: 'none', padding: '4px 6px' }}>
                    {idx + 1}
                  </td>

                  {/* ACTIVE CHECKBOX */}
                  <td style={{ textAlign: 'center', padding: '2px' }}>
                    <input 
                      type="checkbox" 
                      checked={m.isActive} 
                      onChange={e => handleCellChange(originalIndex, 'isActive', e.target.checked)}
                      style={{ cursor: 'pointer', accentColor: '#f4f4f5', width: '14px', height: '14px' }}
                    />
                  </td>

                  {/* SHORT CODE */}
                  <td style={{ padding: '2px 4px' }}>
                    {isEditing ? (
                      <input
                        style={{ ...cellInputStyle, fontWeight: 600 }}
                        value={m.shortCode}
                        onChange={e => handleCellChange(originalIndex, 'shortCode', e.target.value)}
                        autoFocus
                      />
                    ) : (
                      <span style={{ ...cellTextStyle, fontWeight: 600, color: '#f4f4f5' }}>
                        {m.shortCode || '—'}
                      </span>
                    )}
                  </td>

                  {/* PRINT NAME */}
                  <td style={{ padding: '2px 4px' }}>
                    {isEditing ? (
                      <input
                        style={cellInputStyle}
                        value={m.printName}
                        onChange={e => handleCellChange(originalIndex, 'printName', e.target.value)}
                      />
                    ) : (
                      <span style={cellTextStyle}>
                        {m.printName || '—'}
                      </span>
                    )}
                  </td>

                  {/* RATE */}
                  <td style={{ padding: '2px 4px' }}>
                    {isEditing ? (
                      <input
                        type="number"
                        step="any"
                        style={{ ...cellInputStyle, textAlign: 'center' }}
                        value={m.rate ?? 0}
                        onChange={e => handleCellChange(originalIndex, 'rate', parseFloat(e.target.value) || 0)}
                      />
                    ) : (
                      <span style={{ ...cellTextStyle, textAlign: 'center', color: '#f4f4f5' }}>
                        ₹{(m.rate ?? 0).toLocaleString('en-IN')}
                      </span>
                    )}
                  </td>

                  {/* CATEGORY */}
                  <td style={{ padding: '2px 4px' }}>
                    {isEditing ? (
                      <input
                        style={cellInputStyle}
                        value={m.category}
                        onChange={e => handleCellChange(originalIndex, 'category', e.target.value)}
                      />
                    ) : (
                      <span style={{ ...cellTextStyle, color: m.category ? '#a1a1aa' : '#52525b' }}>
                        {m.category || '—'}
                      </span>
                    )}
                  </td>

                  {/* ACTIONS: SAVE OR DELETE BUTTON */}
                  <td style={{ textAlign: 'center', padding: '2px 6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                      {isEditing ? (
                        <button
                          type="button"
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: '4px',
                            padding: '2px 10px', height: '24px', borderRadius: '4px',
                            background: '#f4f4f5', color: '#09090b',
                            border: 'none', fontSize: '11px', fontWeight: 600,
                            cursor: 'pointer'
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            macAudio.playSuccess();
                            setEditingIdx(null);
                          }}
                          title="Save Row"
                        >
                          <Check size={11} /> Save
                        </button>
                      ) : (
                        <button
                          type="button"
                          style={{
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            width: '24px', height: '24px', borderRadius: '4px',
                            background: 'transparent', color: '#52525b',
                            border: '1px solid transparent', cursor: 'pointer',
                            transition: 'all 0.12s ease'
                          }}
                          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#ef4444'; (e.currentTarget as HTMLButtonElement).style.borderColor = '#3f3f46'; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#52525b'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'transparent'; }}
                          onClick={(e) => {
                            e.stopPropagation();
                            promptDeleteRow(m, originalIndex);
                          }}
                          title="Delete mapping"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {rowToDelete && (
        <UnsavedChangesModal
          titleText="Delete Bill Item Mapping?"
          descText={`Kya aap sach me item mapping "${rowToDelete.item.printName || rowToDelete.item.shortCode || 'Selected Item'}" ko delete karna chahte hain?`}
          discardLabel="Haan, Delete Karo"
          onDiscard={confirmDeleteRow}
          onCancel={() => setRowToDelete(null)}
        />
      )}
    </div>
  );
};

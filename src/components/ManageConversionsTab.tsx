import React, { useState, useEffect, useMemo, useRef } from 'react';
import { macAudio } from '../utils/macAudio';
import { CosmicSearchInput } from './common/CosmicSearchInput';
import { Search, Plus, Trash2, Check, Layers, Tag, Hash, Percent, FileText, Scale, Package, ClipboardPaste } from 'lucide-react';
import { SQLITE_CONTROL_CONVERSIONS } from '../data/sqliteControlPanel';
import type { SqliteControlRow } from '../data/sqliteControlPanel';
import { getConversions, saveConversionsBulk, deleteConversion } from '../services/db/sqliteDb';
import UnsavedChangesModal from './UnsavedChangesModal';
import { Pagination as ShadcnPagination } from './ui/shadcn';

const CONV_COL_DEFAULTS = {
  srNo: 40,
  shortcut: 110,
  conversion: 200,
  size: 75,
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

export interface ManageConversionsTabProps {
  search?: string;
  onAddRef?: React.MutableRefObject<(() => void) | null>;
}

export const ManageConversionsTab: React.FC<ManageConversionsTabProps> = ({
  search: externalSearch,
  onAddRef
}) => {
  const [conversions, setConversions] = useState<SqliteControlRow[]>([]);
  const [internalSearch, setInternalSearch] = useState('');
  const search = externalSearch !== undefined ? externalSearch : internalSearch;
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [rowToDelete, setRowToDelete] = useState<{ item: SqliteControlRow; index: number } | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(50);

  const [colWidths, setColWidths] = useState(() => {
    try {
      const saved = localStorage.getItem('modern_conv_cols');
      return saved ? { ...CONV_COL_DEFAULTS, ...JSON.parse(saved) } : CONV_COL_DEFAULTS;
    } catch { return CONV_COL_DEFAULTS; }
  });

  useEffect(() => {
    const fetchFromSqlite = async () => {
      try {
        const rows = await getConversions();
        if (Array.isArray(rows)) {
          setConversions(rows);
          return;
        }
      } catch (err) {
        console.warn('Could not fetch conversions directly from SQLite server:', err);
      }
    };

    fetchFromSqlite();
    window.addEventListener('billapp_conversions_updated', fetchFromSqlite);
    return () => window.removeEventListener('billapp_conversions_updated', fetchFromSqlite);
  }, []);

  const saveToStorage = (data: SqliteControlRow[], syncToServer = true) => {
    setConversions(data);
    window.dispatchEvent(new CustomEvent('billapp_conversions_updated'));

    if (syncToServer) {
      saveConversionsBulk(data, 'replace').catch(err => {
        console.error('Failed to sync conversions to SQLite DB:', err);
      });
    }
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
      size: '',
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
    setEditingIdx(0);
  };

  const promptDeleteRow = (item: SqliteControlRow, index: number) => {
    macAudio.playPop();
    setRowToDelete({ item, index });
  };

  const confirmDeleteRow = async () => {
    if (!rowToDelete) return;
    const { item, index } = rowToDelete;
    macAudio.playSuccess();
    const next = conversions.filter((_, i) => i !== index);
    saveToStorage(next);

    const targetKey = item.shortcut || (item as any).id;
    if (targetKey) {
      try {
        await deleteConversion(targetKey);
      } catch (err) {
        console.error('Failed to delete conversion in SQLite:', err);
      }
    }

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

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginatedFiltered = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  // Smoothly scroll selected row into view
  useEffect(() => {
    if (selectedIdx !== null) {
      const el = document.getElementById(`conv-row-${selectedIdx}`);
      if (el) {
        el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIdx]);

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

      if (paginatedFiltered.length === 0) return;
      const currentPos = paginatedFiltered.findIndex(f => f.originalIndex === selectedIdx);

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        macAudio.playHover();
        if (currentPos >= 0 && currentPos < paginatedFiltered.length - 1) {
          setSelectedIdx(paginatedFiltered[currentPos + 1].originalIndex);
        } else if (currentPos === paginatedFiltered.length - 1) {
          // Reached last row! Auto-focus Next Page button if available
          if (currentPage < totalPages) {
            const nextBtn = document.getElementById('conv-pagination-next') as HTMLButtonElement | null;
            if (nextBtn && !nextBtn.disabled) {
              nextBtn.focus();
              macAudio.playPop();
            }
          }
        } else if (currentPos === -1 && paginatedFiltered.length > 0) {
          setSelectedIdx(paginatedFiltered[0].originalIndex);
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        macAudio.playHover();
        if (currentPos > 0) {
          setSelectedIdx(paginatedFiltered[currentPos - 1].originalIndex);
        } else if (currentPos === 0) {
          // Reached first row! Auto-focus Previous Page button if available
          if (currentPage > 1) {
            const prevBtn = document.getElementById('conv-pagination-prev') as HTMLButtonElement | null;
            if (prevBtn && !prevBtn.disabled) {
              prevBtn.focus();
              macAudio.playPop();
            }
          }
        }
      } else if (e.key === 'Delete') {
        e.preventDefault();
        if (selectedIdx !== null && !rowToDelete) {
          const item = conversions[selectedIdx];
          if (item) promptDeleteRow(item, selectedIdx);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [paginatedFiltered, selectedIdx, editingIdx, conversions, rowToDelete, currentPage, totalPages]);

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
              {filtered.length} conversions • In-Table Fast Edit • Bulk Paste Enabled (Ctrl+V)
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
                #<div className="th-resizer" onMouseDown={e => startColResize('srNo', e)} />
              </th>
              <th style={{ width: colWidths.shortcut, padding: '8px 10px', textAlign: 'left', color: '#a1a1aa', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', position: 'relative' }}>
                SHORTCUT<div className="th-resizer" onMouseDown={e => startColResize('shortcut', e)} />
              </th>
              <th style={{ width: colWidths.conversion, padding: '8px 10px', textAlign: 'left', color: '#a1a1aa', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', position: 'relative' }}>
                CONVERSION<div className="th-resizer" onMouseDown={e => startColResize('conversion', e)} />
              </th>
              <th style={{ width: colWidths.size, padding: '8px 8px', textAlign: 'center', color: '#a1a1aa', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', position: 'relative' }}>
                SIZE (FT)<div className="th-resizer" onMouseDown={e => startColResize('size', e)} />
              </th>
              <th style={{ width: colWidths.uCap, padding: '8px 10px', textAlign: 'left', color: '#a1a1aa', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', position: 'relative' }}>
                U CAP<div className="th-resizer" onMouseDown={e => startColResize('uCap', e)} />
              </th>
              <th style={{ width: colWidths.lCap, padding: '8px 10px', textAlign: 'left', color: '#a1a1aa', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', position: 'relative' }}>
                L CAP<div className="th-resizer" onMouseDown={e => startColResize('lCap', e)} />
              </th>
              <th style={{ width: colWidths.multiplication, padding: '8px 8px', textAlign: 'center', color: '#a1a1aa', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', position: 'relative' }}>
                MULT<div className="th-resizer" onMouseDown={e => startColResize('multiplication', e)} />
              </th>
              <th style={{ width: colWidths.color, padding: '8px 8px', textAlign: 'center', color: '#a1a1aa', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', position: 'relative' }}>
                COLOR<div className="th-resizer" onMouseDown={e => startColResize('color', e)} />
              </th>
              <th style={{ width: colWidths.boxSize, padding: '8px 8px', textAlign: 'center', color: '#a1a1aa', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', position: 'relative' }}>
                BOX<div className="th-resizer" onMouseDown={e => startColResize('boxSize', e)} />
              </th>
              <th style={{ width: colWidths.weight, padding: '8px 8px', textAlign: 'center', color: '#a1a1aa', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', position: 'relative' }}>
                WT/PC<div className="th-resizer" onMouseDown={e => startColResize('weight', e)} />
              </th>
              <th style={{ width: colWidths.realItemName, padding: '8px 10px', textAlign: 'left', color: '#a1a1aa', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', position: 'relative' }}>
                REAL ITEM NAME<div className="th-resizer" onMouseDown={e => startColResize('realItemName', e)} />
              </th>
              <th style={{ width: colWidths.groupName, padding: '8px 10px', textAlign: 'left', color: '#a1a1aa', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', position: 'relative' }}>
                GROUP NAME<div className="th-resizer" onMouseDown={e => startColResize('groupName', e)} />
              </th>
              <th style={{ width: '65px', padding: '8px 8px', textAlign: 'center', color: '#a1a1aa', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', position: 'relative' }}>
                ACTION
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedFiltered.map(({ item: conv, originalIndex }, idx) => {
              const isSelected = selectedIdx === originalIndex;
              const isEditing = editingIdx === originalIndex;
              const shortcutDisplay = conv.shortcut.startsWith('__auto_') ? '' : conv.shortcut;

              return (
                <tr 
                  key={originalIndex} 
                  id={`conv-row-${originalIndex}`}
                  data-row-index={idx}
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

                  {/* SHORTCUT */}
                  <td style={{ padding: '2px 4px' }}>
                    {isEditing ? (
                      <input
                        style={{ ...cellInputStyle, fontWeight: 600 }}
                        value={shortcutDisplay}
                        onChange={e => handleCellChange(originalIndex, 'shortcut', e.target.value)}
                        autoFocus
                      />
                    ) : (
                      <span style={{ ...cellTextStyle, fontWeight: 600 }}>
                        {shortcutDisplay || '—'}
                      </span>
                    )}
                  </td>


                  {/* CONVERSION */}
                  <td style={{ padding: '1px' }}>
                    {isEditing ? (
                      <input
                        style={{ ...cellInputStyle, fontWeight: 500, color: '#ffffff' }}
                        value={conv.conversion}
                        onChange={e => handleCellChange(originalIndex, 'conversion', e.target.value)}
                      />
                    ) : (
                      <span style={{ ...cellTextStyle, fontWeight: 500, color: '#ffffff' }}>
                        {conv.conversion || '—'}
                      </span>
                    )}
                  </td>

                  {/* SIZE (FT) */}
                  <td style={{ padding: '1px' }}>
                    {isEditing ? (
                      <input
                        style={{ ...cellInputStyle, textAlign: 'center', color: '#ffffff' }}
                        value={conv.size !== undefined ? conv.size : ''}
                        onChange={e => handleCellChange(originalIndex, 'size', e.target.value)}
                        placeholder="e.g. 10 or 12"
                      />
                    ) : (
                      <span style={{ ...cellTextStyle, textAlign: 'center', color: '#ffffff' }}>
                        {conv.size ? `${conv.size} FT` : '—'}
                      </span>
                    )}
                  </td>

                  {/* U CAP */}
                  <td style={{ padding: '1px' }}>
                    {isEditing ? (
                      <input
                        style={{ ...cellInputStyle, color: '#ffffff' }}
                        value={conv.u_cap || ''}
                        onChange={e => handleCellChange(originalIndex, 'u_cap', e.target.value)}
                      />
                    ) : (
                      <span style={{ ...cellTextStyle, color: '#ffffff' }}>
                        {conv.u_cap || '—'}
                      </span>
                    )}
                  </td>

                  {/* L CAP */}
                  <td style={{ padding: '1px' }}>
                    {isEditing ? (
                      <input
                        style={{ ...cellInputStyle, color: '#ffffff' }}
                        value={conv.l_cap || ''}
                        onChange={e => handleCellChange(originalIndex, 'l_cap', e.target.value)}
                      />
                    ) : (
                      <span style={{ ...cellTextStyle, color: '#ffffff' }}>
                        {conv.l_cap || '—'}
                      </span>
                    )}
                  </td>

                  {/* MULTIPLICATION */}
                  <td style={{ padding: '1px' }}>
                    {isEditing ? (
                      <input
                        type="number"
                        step="any"
                        style={{ ...cellInputStyle, textAlign: 'center', color: '#ffffff' }}
                        value={conv.multiplication ?? 1}
                        onChange={e => handleCellChange(originalIndex, 'multiplication', parseFloat(e.target.value) || 1)}
                      />
                    ) : (
                      <span style={{ ...cellTextStyle, textAlign: 'center', color: '#ffffff' }}>
                        {conv.multiplication ?? 1}
                      </span>
                    )}
                  </td>

                  {/* COLOR */}
                  <td style={{ padding: '1px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
                      {isEditing ? (
                        <input
                          type="color"
                          value={conv.color && conv.color.startsWith('#') ? conv.color : '#ffffff'}
                          onChange={e => handleCellChange(originalIndex, 'color', e.target.value)}
                          style={{ width: '18px', height: '18px', border: 'none', background: 'transparent', cursor: 'pointer', padding: 0 }}
                        />
                      ) : (
                        <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: conv.color || '#fff', border: '1px solid rgba(255,255,255,0.2)' }} />
                      )}
                    </div>
                  </td>

                  {/* BOX SIZE */}
                  <td style={{ padding: '1px' }}>
                    {isEditing ? (
                      <input
                        type="number"
                        step="any"
                        style={{ ...cellInputStyle, textAlign: 'center', color: '#ffffff' }}
                        value={conv.box_size ?? 1}
                        onChange={e => handleCellChange(originalIndex, 'box_size', parseFloat(e.target.value) || 1)}
                      />
                    ) : (
                      <span style={{ ...cellTextStyle, textAlign: 'center', color: '#ffffff' }}>
                        {conv.box_size ?? 1}
                      </span>
                    )}
                  </td>

                  {/* WEIGHT PER PCS */}
                  <td style={{ padding: '1px' }}>
                    {isEditing ? (
                      <input
                        type="number"
                        step="any"
                        style={{ ...cellInputStyle, textAlign: 'center', color: '#ffffff' }}
                        value={conv.weight_per_pcs ?? 0}
                        onChange={e => handleCellChange(originalIndex, 'weight_per_pcs', parseFloat(e.target.value) || 0)}
                      />
                    ) : (
                      <span style={{ ...cellTextStyle, textAlign: 'center', color: '#ffffff' }}>
                        {conv.weight_per_pcs ?? 0}
                      </span>
                    )}
                  </td>

                  {/* REAL ITEM NAME */}
                  <td style={{ padding: '1px' }}>
                    {isEditing ? (
                      <input
                        style={{ ...cellInputStyle, color: '#ffffff' }}
                        value={conv.real_item_name || ''}
                        onChange={e => handleCellChange(originalIndex, 'real_item_name', e.target.value)}
                      />
                    ) : (
                      <span style={{ ...cellTextStyle, color: '#ffffff' }}>
                        {conv.real_item_name || '—'}
                      </span>
                    )}
                  </td>

                  {/* GROUP NAME */}
                  <td style={{ padding: '1px' }}>
                    {isEditing ? (
                      <input
                        style={{ ...cellInputStyle, color: '#ffffff', fontWeight: 600 }}
                        value={conv.group_name || ''}
                        onChange={e => handleCellChange(originalIndex, 'group_name', e.target.value)}
                      />
                    ) : (
                      <span style={{ ...cellTextStyle, color: '#ffffff', fontWeight: 600 }}>
                        {conv.group_name || '—'}
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
                            promptDeleteRow(conv, originalIndex);
                          }}
                          title="Delete conversion rule"
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

      {/* Shadcn Pagination Footer */}
      {filtered.length > 0 && (
        <ShadcnPagination
          idPrefix="conv-pagination"
          totalCount={filtered.length}
          pageSize={pageSize}
          currentPage={currentPage}
          onPageChange={(p, targetRow) => {
            setCurrentPage(p);
            setTimeout(() => {
              const start = (p - 1) * pageSize;
              const slice = filtered.slice(start, start + pageSize);
              if (slice.length > 0) {
                const targetIdx = targetRow === 'last' ? slice.length - 1 : 0;
                setSelectedIdx(slice[targetIdx].originalIndex);
                document.getElementById(`conv-row-${slice[targetIdx].originalIndex}`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
              }
            }, 50);
          }}
          onPageSizeChange={(s) => {
            setPageSize(s);
            setCurrentPage(1);
          }}
          pageSizeOptions={[25, 50, 100, 200]}
          onFocusTableFirstRow={() => {
            if (paginatedFiltered.length > 0) {
              setSelectedIdx(paginatedFiltered[0].originalIndex);
              document.getElementById(`conv-row-${paginatedFiltered[0].originalIndex}`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            }
          }}
          onFocusTableLastRow={() => {
            if (paginatedFiltered.length > 0) {
              setSelectedIdx(paginatedFiltered[paginatedFiltered.length - 1].originalIndex);
              document.getElementById(`conv-row-${paginatedFiltered[paginatedFiltered.length - 1].originalIndex}`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            }
          }}
        />
      )}

      {rowToDelete && (
        <UnsavedChangesModal
          titleText="Delete Conversion Rule?"
          descText={`Kya aap sach me shortcut "${rowToDelete.item.shortcut || 'Selected Rule'}" (${rowToDelete.item.conversion || 'No Name'}) ko delete karna chahte hain? Isse billing calculations change ho sakti hain.`}
          discardLabel="Haan, Delete Karo"
          onDiscard={confirmDeleteRow}
          onCancel={() => setRowToDelete(null)}
        />
      )}
    </div>
  );
};

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { macAudio } from '../utils/macAudio';
import { CosmicSearchInput } from './common/CosmicSearchInput';
import { Plus, Trash2, Check, Tag } from 'lucide-react';
import type { BillNameMap } from '../data/billMapsData';
import {
  getBillItemNames,
  saveBillItemName,
  deleteBillItemName,
  saveBillItemNamesBulk
} from '../services/db/sqliteDb';
import UnsavedChangesModal from './UnsavedChangesModal';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Pagination as ShadcnPagination,
  Button as ShadcnButton,
  Tooltip
} from './ui/shadcn';

const DEFAULT_BILL_COLS = {
  srNo: 40,
  on: 45,
  shortCode: 150,
  printName: 300,
  rate: 90,
  category: 140,
  actions: 60
};

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

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(50);

  const syncTimeoutRef = useRef<any>(null);

  const [colWidths, setColWidths] = useState(() => {
    try {
      const saved = localStorage.getItem('modern_bill_name_cols');
      return saved ? { ...DEFAULT_BILL_COLS, ...JSON.parse(saved) } : DEFAULT_BILL_COLS;
    } catch {
      return DEFAULT_BILL_COLS;
    }
  });

  useEffect(() => {
    let isMounted = true;
    const fetchFromSqlite = async () => {
      try {
        const rows = await getBillItemNames();
        if (isMounted && Array.isArray(rows) && rows.length > 0) {
          const mapped: BillNameMap[] = rows.map((r: any) => ({
            id: String(r.id),
            isActive: r.isActive !== false,
            shortCode: r.shortCode || r.itemName || '',
            printName: r.printName || r.itemName || '',
            rate: typeof r.rate === 'number' ? r.rate : (parseFloat(r.value || '0') || 0),
            category: r.category || r.groupName || 'General'
          }));
          setMaps(mapped);
        }
      } catch (err) {
        console.warn('Could not fetch bill items directly from SQLite server:', err);
      }
    };

    fetchFromSqlite();
    return () => {
      isMounted = false;
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    };
  }, []);

  const syncMaps = (data: BillNameMap[], immediateServerSync = false) => {
    setMaps(data);
    window.dispatchEvent(new CustomEvent('billapp_bill_maps_updated'));

    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    if (immediateServerSync) {
      saveBillItemNamesBulk(data, 'replace').catch(e => console.error('Failed to sync bill items to SQLite:', e));
    } else {
      syncTimeoutRef.current = setTimeout(() => {
        saveBillItemNamesBulk(data, 'replace').catch(e => console.error('Failed to sync bill items to SQLite:', e));
      }, 350);
    }
  };

  const handleCellChange = (index: number, field: keyof BillNameMap, value: any) => {
    const next = [...maps];
    const updated = { ...next[index], [field]: value };
    next[index] = updated;
    syncMaps(next, false);
    saveBillItemName({
      id: updated.id,
      category: updated.category,
      printName: updated.printName,
      shortCode: updated.shortCode,
      rate: updated.rate,
      isActive: updated.isActive
    }).catch(console.error);
  };

  const handleAddNewRow = () => {
    macAudio.playClick();
    const newRow: BillNameMap = {
      id: 'bin_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      isActive: true,
      shortCode: '',
      printName: '',
      rate: 0,
      category: 'General'
    };
    const next = [newRow, ...maps];
    syncMaps(next, true);
    saveBillItemName({
      id: newRow.id,
      category: newRow.category,
      printName: newRow.printName,
      shortCode: newRow.shortCode,
      rate: newRow.rate,
      isActive: newRow.isActive
    }).catch(console.error);

    setCurrentPage(1);
    setSelectedIdx(0);
    setEditingIdx(0);

    setTimeout(() => {
      const firstInput = document.querySelector<HTMLInputElement>(`#billmap-row-0 input[type="text"]`);
      if (firstInput) {
        firstInput.focus();
        firstInput.select();
      }
    }, 50);
  };

  const promptDeleteRow = (item: BillNameMap, index: number) => {
    macAudio.playPop();
    setRowToDelete({ item, index });
  };

  const confirmDeleteRow = () => {
    if (!rowToDelete) return;
    const { item, index } = rowToDelete;
    macAudio.playSuccess();
    const next = maps.filter((_, i) => i !== index);
    syncMaps(next, true);
    deleteBillItemName(item.id).catch(console.error);
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
        id: 'bin_' + Date.now() + '_' + idx,
        isActive: true,
        shortCode: cols[0] || '',
        printName: cols[1] || cols[0] || '',
        rate: cols[2] ? parseFloat(cols[2]) || 0 : 0,
        category: cols[3] || 'General'
      };
    });

    if (parsedRows.length > 0) {
      const next = [...parsedRows, ...maps];
      syncMaps(next, true);
    }
  };

  const startResizeBill = (colKey: keyof typeof DEFAULT_BILL_COLS, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startW = colWidths[colKey] || 100;
    const onMove = (me: MouseEvent) => {
      const newWidth = Math.max(30, startW + (me.clientX - startX));
      setColWidths((prev: any) => {
        const next = { ...prev, [colKey]: newWidth };
        try {
          localStorage.setItem('modern_bill_name_cols', JSON.stringify(next));
        } catch {}
        return next;
      });
    };
    const onUp = () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = 'text';
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const filtered = useMemo(() => {
    const q = (search || '').trim().toLowerCase();
    return maps
      .map((item, originalIndex) => ({ item, originalIndex }))
      .filter(({ item }) => {
        if (!q) return true;
        return (
          (item.printName || '').toLowerCase().includes(q) ||
          (item.shortCode || '').toLowerCase().includes(q) ||
          (item.category || '').toLowerCase().includes(q)
        );
      });
  }, [maps, search]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginatedFiltered = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  // Instantly scroll selected row into view and set DOM focus without animation lag
  useEffect(() => {
    if (selectedIdx !== null) {
      const el = document.getElementById(`billmap-row-${selectedIdx}`);
      if (el) {
        el.scrollIntoView({ block: 'nearest', behavior: 'auto' });
        if (document.activeElement !== el && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName || '')) {
          el.focus({ preventScroll: true });
        }
      }
    }
  }, [selectedIdx]);

  const lastSoundRef = useRef<number>(0);
  const playNavSound = () => {
    const now = performance.now();
    if (now - lastSoundRef.current > 45) {
      lastSoundRef.current = now;
      macAudio.playHover();
    }
  };

  const cellInputStyle: React.CSSProperties = {
    width: '100%',
    height: '24px',
    background: '#18181b',
    border: '1px solid #3f3f46',
    outline: 'none',
    color: '#f4f4f5',
    fontSize: '12px',
    padding: '2px 6px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    borderRadius: '4px',
    fontWeight: 500
  };

  const cellTextStyle: React.CSSProperties = {
    padding: '3px 8px',
    fontSize: '12px',
    color: '#f4f4f5',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: 'block',
    fontWeight: 500
  };

  // Keyboard navigation & guards
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'NumLock' || e.code === 'NumLock' || e.key === 'Clear') {
        return;
      }

      const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName);
      if (isInput) {
        if (e.key === 'Delete' || e.key === 'Backspace') {
          return;
        }

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

      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        setEditingIdx(null);
        setSelectedIdx(null);
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (selectedIdx !== null) {
          macAudio.playClick();
          setEditingIdx(selectedIdx);
        }
        return;
      }

      if (e.key === 'Insert') {
        e.preventDefault();
        handleAddNewRow();
        return;
      }

      if (paginatedFiltered.length === 0) return;

      const currentPos = paginatedFiltered.findIndex(f => f.originalIndex === selectedIdx);

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (currentPos >= 0 && currentPos < paginatedFiltered.length - 1) {
          setSelectedIdx(paginatedFiltered[currentPos + 1].originalIndex);
          playNavSound();
        } else if (currentPos === paginatedFiltered.length - 1) {
          // Reached last row of current page -> seamlessly jump to next page row 0!
          if (currentPage < totalPages) {
            const nextP = currentPage + 1;
            setCurrentPage(nextP);
            const start = (nextP - 1) * pageSize;
            const slice = filtered.slice(start, start + pageSize);
            if (slice.length > 0) {
              setSelectedIdx(slice[0].originalIndex);
              playNavSound();
            }
          }
        } else if (currentPos === -1 && paginatedFiltered.length > 0) {
          setSelectedIdx(paginatedFiltered[0].originalIndex);
          playNavSound();
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (currentPos > 0) {
          setSelectedIdx(paginatedFiltered[currentPos - 1].originalIndex);
          playNavSound();
        } else if (currentPos === 0) {
          // Reached first row of current page -> seamlessly jump to previous page last row!
          if (currentPage > 1) {
            const prevP = currentPage - 1;
            setCurrentPage(prevP);
            const start = (prevP - 1) * pageSize;
            const slice = filtered.slice(start, start + pageSize);
            if (slice.length > 0) {
              setSelectedIdx(slice[slice.length - 1].originalIndex);
              playNavSound();
            }
          }
        }
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
  }, [paginatedFiltered, selectedIdx, editingIdx, maps, rowToDelete, currentPage, totalPages, filtered, pageSize]);

  useEffect(() => {
    if (onAddRef) {
      onAddRef.current = handleAddNewRow;
    }
  }, [onAddRef, maps]);

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 0,
        gap: '8px',
        overflow: 'hidden'
      }}
      onPaste={handlePaste}
    >
      {/* Top Search Bar (when standalone) */}
      {externalSearch === undefined && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CosmicSearchInput
              value={search}
              onChange={setInternalSearch}
              width={260}
            />
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>
              {filtered.length} names • Press <kbd style={{ padding: '1px 4px', background: '#27272a', borderRadius: '3px', border: '1px solid #3f3f46' }}>Insert</kbd> to add row
            </span>
          </div>

          <ShadcnButton
            type="button"
            variant="default"
            size="sm"
            onClick={handleAddNewRow}
            style={{ height: '28px', fontSize: '11px', fontWeight: 600, gap: '5px' }}
          >
            <Plus size={12} />
            <span>Add Row</span>
          </ShadcnButton>
        </div>
      )}

      {/* Official Shadcn UI Table */}
      <Table
        containerStyle={{
          flex: 1,
          minHeight: 0,
          height: '100%',
          overflow: 'auto',
          borderRadius: '8px',
          border: '1px solid #27272a',
          background: '#09090b'
        }}
      >
        <TableHeader style={{ background: '#18181b', position: 'sticky', top: 0, zIndex: 10 }}>
          <TableRow style={{ borderBottom: '1px solid #27272a' }}>
            <TableHead style={{ width: colWidths.srNo, textAlign: 'center', position: 'relative' }}>
              #<div className="th-resizer" onMouseDown={e => startResizeBill('srNo', e)} />
            </TableHead>
            <TableHead style={{ width: colWidths.on, textAlign: 'center', position: 'relative' }}>
              ON<div className="th-resizer" onMouseDown={e => startResizeBill('on', e)} />
            </TableHead>
            <TableHead style={{ width: colWidths.shortCode, position: 'relative' }}>
              SHORT CODE<div className="th-resizer" onMouseDown={e => startResizeBill('shortCode', e)} />
            </TableHead>
            <TableHead style={{ width: colWidths.printName, position: 'relative' }}>
              PRINT / INVOICE NAME<div className="th-resizer" onMouseDown={e => startResizeBill('printName', e)} />
            </TableHead>
            <TableHead style={{ width: colWidths.rate, textAlign: 'center', position: 'relative' }}>
              RATE<div className="th-resizer" onMouseDown={e => startResizeBill('rate', e)} />
            </TableHead>
            <TableHead style={{ width: colWidths.category, position: 'relative' }}>
              CATEGORY<div className="th-resizer" onMouseDown={e => startResizeBill('category', e)} />
            </TableHead>
            <TableHead style={{ width: colWidths.actions, textAlign: 'center', position: 'relative' }}>
              ACTION
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {paginatedFiltered.map(({ item: m, originalIndex }, idx) => {
            const isSelected = selectedIdx === originalIndex;
            const isEditing = editingIdx === originalIndex;

            return (
              <TableRow
                key={m.id || originalIndex}
                id={`billmap-row-${originalIndex}`}
                isSelected={isSelected}
                style={{
                  height: '28px',
                  background: isSelected
                    ? 'rgba(56, 189, 248, 0.12)'
                    : idx % 2 === 0
                    ? 'rgba(24, 24, 27, 0.4)'
                    : 'transparent',
                  outline: isSelected ? '1px solid rgba(56, 189, 248, 0.4)' : 'none',
                  cursor: 'pointer'
                }}
                onClick={() => setSelectedIdx(originalIndex)}
                onDoubleClick={() => setEditingIdx(originalIndex)}
              >
                {/* # */}
                <TableCell style={{ textAlign: 'center', color: '#71717a', fontSize: '11px', userSelect: 'none', padding: '3px 4px' }}>
                  {(currentPage - 1) * pageSize + idx + 1}
                </TableCell>

                {/* ACTIVE CHECKBOX */}
                <TableCell style={{ textAlign: 'center', padding: '2px' }}>
                  <input
                    type="checkbox"
                    checked={m.isActive}
                    onChange={e => handleCellChange(originalIndex, 'isActive', e.target.checked)}
                    style={{ cursor: 'pointer', accentColor: '#38bdf8', width: '14px', height: '14px' }}
                  />
                </TableCell>

                {/* SHORT CODE */}
                <TableCell style={{ padding: '2px 4px' }}>
                  {isEditing ? (
                    <input
                      style={{ ...cellInputStyle, fontWeight: 600 }}
                      value={m.shortCode}
                      onChange={e => handleCellChange(originalIndex, 'shortCode', e.target.value)}
                      placeholder="e.g. SC-101"
                      autoFocus
                    />
                  ) : (
                    <span style={{ ...cellTextStyle, fontWeight: 600, color: '#f4f4f5' }}>
                      {m.shortCode || '—'}
                    </span>
                  )}
                </TableCell>

                {/* PRINT NAME */}
                <TableCell style={{ padding: '2px 4px' }}>
                  {isEditing ? (
                    <input
                      style={cellInputStyle}
                      value={m.printName}
                      onChange={e => handleCellChange(originalIndex, 'printName', e.target.value)}
                      placeholder="e.g. Profile 10x20"
                    />
                  ) : (
                    <span style={cellTextStyle}>
                      {m.printName || '—'}
                    </span>
                  )}
                </TableCell>

                {/* RATE */}
                <TableCell style={{ padding: '2px 4px' }}>
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
                </TableCell>

                {/* CATEGORY */}
                <TableCell style={{ padding: '2px 4px' }}>
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
                </TableCell>

                {/* ACTIONS */}
                <TableCell style={{ textAlign: 'center', padding: '2px 4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                    {isEditing ? (
                      <ShadcnButton
                        type="button"
                        variant="default"
                        size="sm"
                        style={{ height: '22px', fontSize: '10px', padding: '0 6px', gap: '3px' }}
                        onClick={e => {
                          e.stopPropagation();
                          macAudio.playSuccess();
                          setEditingIdx(null);
                        }}
                        title="Save Row"
                      >
                        <Check size={11} /> Save
                      </ShadcnButton>
                    ) : (
                      <button
                        type="button"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '24px',
                          height: '24px',
                          borderRadius: '4px',
                          background: 'transparent',
                          color: '#71717a',
                          border: '1px solid transparent',
                          cursor: 'pointer',
                          transition: 'all 0.12s ease'
                        }}
                        onMouseEnter={e => {
                          (e.currentTarget as HTMLButtonElement).style.color = '#ef4444';
                          (e.currentTarget as HTMLButtonElement).style.borderColor = '#3f3f46';
                        }}
                        onMouseLeave={e => {
                          (e.currentTarget as HTMLButtonElement).style.color = '#71717a';
                          (e.currentTarget as HTMLButtonElement).style.borderColor = 'transparent';
                        }}
                        onClick={e => {
                          e.stopPropagation();
                          promptDeleteRow(m, originalIndex);
                        }}
                        title="Delete mapping"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {/* Shadcn Pagination Footer */}
      {filtered.length > 0 && (
        <ShadcnPagination
          idPrefix="billmap-pagination"
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
                document.getElementById(`billmap-row-${slice[targetIdx].originalIndex}`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
              }
            }, 50);
          }}
          onPageSizeChange={s => {
            setPageSize(s);
            setCurrentPage(1);
          }}
          pageSizeOptions={[25, 50, 100, 200]}
          onFocusTableFirstRow={() => {
            if (paginatedFiltered.length > 0) {
              setSelectedIdx(paginatedFiltered[0].originalIndex);
              document.getElementById(`billmap-row-${paginatedFiltered[0].originalIndex}`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            }
          }}
          onFocusTableLastRow={() => {
            if (paginatedFiltered.length > 0) {
              setSelectedIdx(paginatedFiltered[paginatedFiltered.length - 1].originalIndex);
              document.getElementById(`billmap-row-${paginatedFiltered[paginatedFiltered.length - 1].originalIndex}`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            }
          }}
        />
      )}

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

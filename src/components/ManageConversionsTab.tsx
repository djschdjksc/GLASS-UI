import React, { useState, useEffect, useMemo, useRef } from 'react';
import { macAudio } from '../utils/macAudio';
import { CosmicSearchInput } from './common/CosmicSearchInput';
import { Plus, Trash2, Check, RotateCcw, SlidersHorizontal } from 'lucide-react';
import { SQLITE_CONTROL_CONVERSIONS } from '../data/sqliteControlPanel';
import type { SqliteControlRow } from '../data/sqliteControlPanel';
import { getConversions, saveConversionsBulk, deleteConversion } from '../services/db/sqliteDb';
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
  Tooltip,
  toast
} from './ui/shadcn';

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
  actions: 60
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
  const [showRestoreModal, setShowRestoreModal] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(50);

  // Debounced server save ref
  const syncTimeoutRef = useRef<any>(null);

  const [colWidths, setColWidths] = useState(() => {
    try {
      const saved = localStorage.getItem('modern_conv_cols');
      return saved ? { ...CONV_COL_DEFAULTS, ...JSON.parse(saved) } : CONV_COL_DEFAULTS;
    } catch {
      return CONV_COL_DEFAULTS;
    }
  });

  // Fetch true database state once on mount
  useEffect(() => {
    let isMounted = true;
    const fetchFromSqlite = async () => {
      try {
        const rows = await getConversions();
        if (isMounted && Array.isArray(rows) && rows.length > 0) {
          setConversions(rows);
        }
      } catch (err) {
        console.warn('Could not fetch conversions directly from SQLite server:', err);
      }
    };

    fetchFromSqlite();
    return () => {
      isMounted = false;
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    };
  }, []);

  // Sync to local state and debounced SQLite backend
  const syncConversions = (data: SqliteControlRow[], immediateServerSync = false) => {
    setConversions(data);

    // Notify other components (like bill calculators) that conversions changed
    window.dispatchEvent(new CustomEvent('billapp_conversions_updated'));

    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    if (immediateServerSync) {
      saveConversionsBulk(data, 'replace').catch(err => {
        console.error('Failed to sync conversions to SQLite DB:', err);
      });
    } else {
      syncTimeoutRef.current = setTimeout(() => {
        saveConversionsBulk(data, 'replace').catch(err => {
          console.error('Failed to sync conversions to SQLite DB:', err);
        });
      }, 350);
    }
  };

  const handleCellChange = (index: number, field: keyof SqliteControlRow, value: any) => {
    const updated = [...conversions];
    updated[index] = { ...updated[index], [field]: value };
    syncConversions(updated, false);
  };

  const handleAddNewRow = () => {
    macAudio.playClick();
    const newId = `cp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newRow: SqliteControlRow & { id: string } = {
      id: newId,
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
      group_name: 'General'
    };
    const next = [newRow, ...conversions];
    syncConversions(next, true);
    setCurrentPage(1);
    setSelectedIdx(0);
    setEditingIdx(0);

    setTimeout(() => {
      const firstInput = document.querySelector<HTMLInputElement>(`#conv-row-0 input`);
      if (firstInput) {
        firstInput.focus();
        firstInput.select();
      }
    }, 50);
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
    syncConversions(next, true);

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

  const confirmRestoreDefaults = async () => {
    try {
      macAudio.playSuccess();
      const restored = [...SQLITE_CONTROL_CONVERSIONS];
      syncConversions(restored, true);
      toast.success('Defaults Restored', `Restored ${restored.length} default conversion rules successfully.`);
      setShowRestoreModal(false);
      setSelectedIdx(0);
      setEditingIdx(null);
    } catch (err) {
      console.error('Failed to restore default conversions:', err);
      toast.error('Restore Failed', 'Could not restore default conversions.');
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text');
    if (!text || (!text.includes('\t') && !text.includes('\n'))) return;

    e.preventDefault();
    macAudio.playSuccess();
    const lines = text.trim().split(/\r?\n/).filter(line => line.trim().length > 0);
    const parsedRows: SqliteControlRow[] = lines.map((line, idx) => {
      const cols = line.split('\t').map(c => c.trim());
      return {
        id: `cp_${Date.now()}_${idx}`,
        shortcut: cols[0] || '',
        conversion: cols[1] || cols[0] || '',
        size: cols[2] !== undefined ? cols[2] : '',
        u_cap: cols[3] !== undefined && !isNaN(Number(cols[3])) ? Number(cols[3]) : (cols[3] || 0),
        l_cap: cols[4] !== undefined && !isNaN(Number(cols[4])) ? Number(cols[4]) : (cols[4] || 0),
        multiplication: cols[5] ? Number(cols[5]) || 1 : 1,
        color: cols[6] || '#ffffff',
        box_size: cols[7] ? Number(cols[7]) || 1 : 1,
        weight_per_pcs: cols[8] ? Number(cols[8]) || 0 : 0,
        real_item_name: cols[9] || '',
        group_name: cols[10] || 'General'
      } as any;
    });

    if (parsedRows.length > 0) {
      const next = [...parsedRows, ...conversions];
      syncConversions(next, true);
      toast.success('Pasted Data', `Added ${parsedRows.length} conversion rows.`);
    }
  };

  const startColResize = (colKey: keyof typeof CONV_COL_DEFAULTS, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startW = colWidths[colKey] || 100;
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const newWidth = Math.max(35, startW + (moveEvent.clientX - startX));
      setColWidths((prev: any) => {
        const next = { ...prev, [colKey]: newWidth };
        try {
          localStorage.setItem('modern_conv_cols', JSON.stringify(next));
        } catch {}
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

  const filtered = useMemo(() => {
    const q = (search || '').trim().toLowerCase();
    return conversions
      .map((item, originalIndex) => ({ item, originalIndex }))
      .filter(({ item }) => {
        if (!q) return true;
        return (
          (item.conversion || '').toLowerCase().includes(q) ||
          (item.shortcut || '').toLowerCase().includes(q) ||
          (item.real_item_name || '').toLowerCase().includes(q) ||
          (item.group_name || '').toLowerCase().includes(q) ||
          (item.size !== undefined && String(item.size).toLowerCase().includes(q))
        );
      });
  }, [conversions, search]);

  // Reset page when search changes
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
      const el = document.getElementById(`conv-row-${selectedIdx}`);
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
    fontWeight: 500,
    transition: 'border-color 0.15s ease'
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

  // Keyboard navigation & safe guards
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // NumLock and Clear keys: Completely ignore, NEVER delete or trigger actions
      if (e.key === 'NumLock' || e.code === 'NumLock' || e.key === 'Clear') {
        return;
      }

      const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName);
      if (isInput) {
        // Natural deletion inside input field
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
          // Reached last cell of row -> finish / save editing
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
          const item = conversions[selectedIdx];
          if (item) promptDeleteRow(item, selectedIdx);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [paginatedFiltered, selectedIdx, editingIdx, conversions, rowToDelete, currentPage, totalPages, filtered, pageSize]);

  useEffect(() => {
    if (onAddRef) {
      onAddRef.current = handleAddNewRow;
    }
  }, [onAddRef, conversions]);

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
      {/* Top Bar for Standalone / Sub-toolbar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0,
          gap: '8px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {externalSearch === undefined && (
            <CosmicSearchInput
              value={search}
              onChange={setInternalSearch}
              width={260}
            />
          )}
          <span style={{ fontSize: '11px', color: '#94a3b8' }}>
            {filtered.length} conversion rules • In-Table Fast Edit • Press <kbd style={{ padding: '1px 4px', background: '#27272a', borderRadius: '3px', border: '1px solid #3f3f46' }}>Insert</kbd> to add row
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Tooltip title="Restore 56 original conversions if rows were wiped or deleted">
            <ShadcnButton
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowRestoreModal(true)}
              style={{
                height: '28px',
                fontSize: '11px',
                fontWeight: 600,
                gap: '5px',
                borderColor: '#3f3f46',
                color: '#e4e4e7'
              }}
            >
              <RotateCcw size={12} />
              Restore Defaults
            </ShadcnButton>
          </Tooltip>

          {externalSearch === undefined && (
            <ShadcnButton
              type="button"
              variant="default"
              size="sm"
              onClick={handleAddNewRow}
              style={{
                height: '28px',
                fontSize: '11px',
                fontWeight: 600,
                gap: '5px'
              }}
            >
              <Plus size={12} />
              Add Row
            </ShadcnButton>
          )}
        </div>
      </div>

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
              #<div className="th-resizer" onMouseDown={e => startColResize('srNo', e)} />
            </TableHead>
            <TableHead style={{ width: colWidths.shortcut, position: 'relative' }}>
              SHORTCUT<div className="th-resizer" onMouseDown={e => startColResize('shortcut', e)} />
            </TableHead>
            <TableHead style={{ width: colWidths.conversion, position: 'relative' }}>
              CONVERSION<div className="th-resizer" onMouseDown={e => startColResize('conversion', e)} />
            </TableHead>
            <TableHead style={{ width: colWidths.size, textAlign: 'center', position: 'relative' }}>
              SIZE (FT)<div className="th-resizer" onMouseDown={e => startColResize('size', e)} />
            </TableHead>
            <TableHead style={{ width: colWidths.uCap, position: 'relative' }}>
              U CAP<div className="th-resizer" onMouseDown={e => startColResize('uCap', e)} />
            </TableHead>
            <TableHead style={{ width: colWidths.lCap, position: 'relative' }}>
              L CAP<div className="th-resizer" onMouseDown={e => startColResize('lCap', e)} />
            </TableHead>
            <TableHead style={{ width: colWidths.multiplication, textAlign: 'center', position: 'relative' }}>
              MULT<div className="th-resizer" onMouseDown={e => startColResize('multiplication', e)} />
            </TableHead>
            <TableHead style={{ width: colWidths.color, textAlign: 'center', position: 'relative' }}>
              COLOR<div className="th-resizer" onMouseDown={e => startColResize('color', e)} />
            </TableHead>
            <TableHead style={{ width: colWidths.boxSize, textAlign: 'center', position: 'relative' }}>
              BOX<div className="th-resizer" onMouseDown={e => startColResize('boxSize', e)} />
            </TableHead>
            <TableHead style={{ width: colWidths.weight, textAlign: 'center', position: 'relative' }}>
              WT/PC<div className="th-resizer" onMouseDown={e => startColResize('weight', e)} />
            </TableHead>
            <TableHead style={{ width: colWidths.realItemName, position: 'relative' }}>
              REAL ITEM NAME<div className="th-resizer" onMouseDown={e => startColResize('realItemName', e)} />
            </TableHead>
            <TableHead style={{ width: colWidths.groupName, position: 'relative' }}>
              GROUP NAME<div className="th-resizer" onMouseDown={e => startColResize('groupName', e)} />
            </TableHead>
            <TableHead style={{ width: colWidths.actions, textAlign: 'center', position: 'relative' }}>
              ACTION
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {paginatedFiltered.map(({ item: conv, originalIndex }, idx) => {
            const isSelected = selectedIdx === originalIndex;
            const isEditing = editingIdx === originalIndex;
            const shortcutDisplay = conv.shortcut.startsWith('__auto_') ? '' : conv.shortcut;

            return (
              <TableRow
                key={originalIndex}
                id={`conv-row-${originalIndex}`}
                isSelected={isSelected}
                tabIndex={isSelected ? 0 : -1}
                style={{
                  height: '28px',
                  background: isSelected
                    ? 'rgba(56, 189, 248, 0.16)'
                    : idx % 2 === 0
                    ? 'rgba(24, 24, 27, 0.4)'
                    : 'transparent',
                  outline: isSelected ? '2px solid rgba(56, 189, 248, 0.75)' : 'none',
                  outlineOffset: '-2px',
                  boxShadow: isSelected ? 'inset 0 0 0 1px rgba(56, 189, 248, 0.3)' : 'none',
                  cursor: 'pointer'
                }}
                onClick={() => setSelectedIdx(originalIndex)}
                onDoubleClick={() => setEditingIdx(originalIndex)}
              >
                {/* # */}
                <TableCell style={{ textAlign: 'center', color: '#71717a', fontSize: '11px', userSelect: 'none', padding: '3px 4px' }}>
                  {(currentPage - 1) * pageSize + idx + 1}
                </TableCell>

                {/* SHORTCUT */}
                <TableCell style={{ padding: '2px 4px' }}>
                  {isEditing ? (
                    <input
                      style={{ ...cellInputStyle, fontWeight: 600 }}
                      value={shortcutDisplay}
                      onChange={e => handleCellChange(originalIndex, 'shortcut', e.target.value)}
                      placeholder="e.g. G1"
                      autoFocus
                    />
                  ) : (
                    <span style={{ ...cellTextStyle, fontWeight: 600 }}>
                      {shortcutDisplay || '—'}
                    </span>
                  )}
                </TableCell>

                {/* CONVERSION */}
                <TableCell style={{ padding: '2px 4px' }}>
                  {isEditing ? (
                    <input
                      style={{ ...cellInputStyle, fontWeight: 500, color: '#ffffff' }}
                      value={conv.conversion}
                      onChange={e => handleCellChange(originalIndex, 'conversion', e.target.value)}
                      placeholder="e.g. B.F.P-(G)"
                    />
                  ) : (
                    <span style={{ ...cellTextStyle, fontWeight: 500, color: '#ffffff' }}>
                      {conv.conversion || '—'}
                    </span>
                  )}
                </TableCell>

                {/* SIZE (FT) */}
                <TableCell style={{ padding: '2px 4px' }}>
                  {isEditing ? (
                    <input
                      style={{ ...cellInputStyle, textAlign: 'center', color: '#ffffff' }}
                      value={conv.size !== undefined && conv.size !== null ? conv.size : ''}
                      onChange={e => handleCellChange(originalIndex, 'size', e.target.value)}
                      placeholder="e.g. 10 or 12"
                    />
                  ) : (
                    <span style={{ ...cellTextStyle, textAlign: 'center', color: '#ffffff' }}>
                      {conv.size !== undefined && conv.size !== null && String(conv.size).trim() !== ''
                        ? `${conv.size} FT`
                        : '—'}
                    </span>
                  )}
                </TableCell>

                {/* U CAP */}
                <TableCell style={{ padding: '2px 4px' }}>
                  {isEditing ? (
                    <input
                      style={{ ...cellInputStyle, color: '#ffffff' }}
                      value={conv.u_cap !== undefined ? conv.u_cap : ''}
                      onChange={e => handleCellChange(originalIndex, 'u_cap', e.target.value)}
                    />
                  ) : (
                    <span style={{ ...cellTextStyle, color: '#ffffff' }}>
                      {conv.u_cap !== undefined && conv.u_cap !== null && String(conv.u_cap).trim() !== ''
                        ? String(conv.u_cap)
                        : '—'}
                    </span>
                  )}
                </TableCell>

                {/* L CAP */}
                <TableCell style={{ padding: '2px 4px' }}>
                  {isEditing ? (
                    <input
                      style={{ ...cellInputStyle, color: '#ffffff' }}
                      value={conv.l_cap !== undefined ? conv.l_cap : ''}
                      onChange={e => handleCellChange(originalIndex, 'l_cap', e.target.value)}
                    />
                  ) : (
                    <span style={{ ...cellTextStyle, color: '#ffffff' }}>
                      {conv.l_cap !== undefined && conv.l_cap !== null && String(conv.l_cap).trim() !== ''
                        ? String(conv.l_cap)
                        : '—'}
                    </span>
                  )}
                </TableCell>

                {/* MULTIPLICATION */}
                <TableCell style={{ padding: '2px 4px' }}>
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
                </TableCell>

                {/* COLOR */}
                <TableCell style={{ padding: '2px 4px', textAlign: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
                    {isEditing ? (
                      <input
                        type="color"
                        value={conv.color && conv.color.startsWith('#') ? conv.color : '#ffffff'}
                        onChange={e => handleCellChange(originalIndex, 'color', e.target.value)}
                        style={{ width: '18px', height: '18px', border: 'none', background: 'transparent', cursor: 'pointer', padding: 0 }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '14px',
                          height: '14px',
                          borderRadius: '50%',
                          background: conv.color || '#fff',
                          border: '1px solid rgba(255,255,255,0.2)'
                        }}
                      />
                    )}
                  </div>
                </TableCell>

                {/* BOX SIZE */}
                <TableCell style={{ padding: '2px 4px' }}>
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
                </TableCell>

                {/* WEIGHT PER PCS */}
                <TableCell style={{ padding: '2px 4px' }}>
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
                </TableCell>

                {/* REAL ITEM NAME */}
                <TableCell style={{ padding: '2px 4px' }}>
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
                </TableCell>

                {/* GROUP NAME */}
                <TableCell style={{ padding: '2px 4px' }}>
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
                          promptDeleteRow(conv, originalIndex);
                        }}
                        title="Delete conversion rule"
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
          onPageSizeChange={s => {
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

      {/* Row Delete Confirmation Modal */}
      {rowToDelete && (
        <UnsavedChangesModal
          titleText="Delete Conversion Rule?"
          descText={`Kya aap sach me shortcut "${rowToDelete.item.shortcut || 'Selected Rule'}" (${rowToDelete.item.conversion || 'No Name'}) ko delete karna chahte hain? Isse billing calculations change ho sakti hain.`}
          discardLabel="Haan, Delete Karo"
          onDiscard={confirmDeleteRow}
          onCancel={() => setRowToDelete(null)}
        />
      )}

      {/* Restore Defaults Confirmation Modal */}
      {showRestoreModal && (
        <UnsavedChangesModal
          titleText="Restore Default Conversions?"
          descText="Kya aap default conversions (56 original rules) restore karna chahte hain? Current table data me default entries wapas reload ho jayengi."
          discardLabel="Haan, Restore Karo"
          onDiscard={confirmRestoreDefaults}
          onCancel={() => setShowRestoreModal(false)}
        />
      )}
    </div>
  );
};

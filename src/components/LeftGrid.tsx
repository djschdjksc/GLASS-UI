import { SQLITE_SHORTCUTS } from '../data/sqliteData';
import React, { useState, useEffect, useRef } from 'react';
import type { RawItem, EnterDirection } from '../types';
import { TableSettingsDropdown } from './TableSettingsDropdown';
import { RowContextMenu } from './RowContextMenu';
import type { RowContextMenuState } from './RowContextMenu';
import { Search, CornerDownRight, Settings, ArrowDown, ArrowLeft, ArrowUp, Copy, ClipboardPaste, ChevronDown, ChevronsUpDown, Check } from 'lucide-react';

const evaluateMathExpression = (val: string): number => {
  const clean = val.replace(/^=/, '').trim();
  if (!clean) return 0;
  if (!/^[\d+\-*/.()\s]+$/.test(clean)) {
    const parsed = parseFloat(clean);
    return isNaN(parsed) ? 0 : parsed;
  }
  try {
    const res = Function("'use strict'; return (" + clean + ")")();
    return typeof res === 'number' && !isNaN(res) && isFinite(res) ? Math.round(res * 100) / 100 : 0;
  } catch {
    const parsed = parseFloat(clean);
    return isNaN(parsed) ? 0 : parsed;
  }
};

interface CellCoord {
  r: number;
  c: number;
}

interface Props {
  autoConvert?: boolean;
  autoItem?: boolean;
  items: RawItem[];
  onUpdateItem: (id: string, field: keyof RawItem, value: any) => void;
  onBulkPaste: (pastedRows: any[], startRow?: number, startCol?: number) => void;
  onAddNewRow: () => void;
  onInsertRow: (index: number) => void;
  onDeleteRows: (indices: number[]) => void;
  onReorderItems: (from: number, to: number) => void;
  onClearCells: (cells: { rowIndex: number; colIndex: number }[]) => void;
  onToast: (msg: string, type?: 'success' | 'info' | 'warning') => void;
  onJumpToRightGrid?: (row: number) => void;
  enterDirection: EnterDirection;
  onSetEnterDirection: (dir: EnterDirection) => void;
  tableFontSize: number;
  onSetTableFontSize: (size: number) => void;
  rowHeight: number;
  onSetRowHeight: (height: number) => void;
  isActiveTable?: boolean;
  onActivateTable?: () => void;
}

const DEFAULT_LEFT_COLS = {
  index: 38,
  name: 180,
  qty: 75,
  uCap: 75,
  lCap: 75
};

export const LeftGrid: React.FC<Props> = ({
  autoConvert = true,
  autoItem = false,
  items,
  onUpdateItem,
  onBulkPaste,
  onAddNewRow,
  onInsertRow,
  onDeleteRows,
  onReorderItems,
  onClearCells,
  onToast,
  onJumpToRightGrid,
  enterDirection,
  onSetEnterDirection,
  tableFontSize,
  onSetTableFontSize,
  rowHeight,
  onSetRowHeight,
  isActiveTable = true,
  onActivateTable
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Header Sorting: A to Z / Z to A (text) and Small to Large / Large to Small (numeric)
  const [sortField, setSortField] = useState<'name' | 'qty' | 'uCap' | 'lCap' | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const toggleSort = (field: 'name' | 'qty' | 'uCap' | 'lCap') => {
    if (sortField === field) {
      if (sortOrder === 'asc') {
        setSortOrder('desc');
        onToast(`Sorted ${field.toUpperCase()} (Large ➔ Small / Z ➔ A)`, 'info');
      } else {
        setSortField(null);
        onToast('Sort cleared', 'info');
      }
    } else {
      setSortField(field);
      setSortOrder('asc');
      onToast(`Sorted ${field.toUpperCase()} (Small ➔ Large / A ➔ Z)`, 'info');
    }
  };
  
  // Persistent Column Widths
  const [colWidths, setColWidths] = useState(() => {
    try {
      const saved = localStorage.getItem('modern_left_cols');
      return saved ? JSON.parse(saved) : DEFAULT_LEFT_COLS;
    } catch {
      return DEFAULT_LEFT_COLS;
    }
  });

  // Resizing Column State
  const [resizingCol, setResizingCol] = useState<string | null>(null);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  const startResizeCol = (colKey: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setResizingCol(colKey);
    startXRef.current = e.clientX;
    startWidthRef.current = (colWidths as any)[colKey] || 75;
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!resizingCol) return;
      const diff = e.clientX - startXRef.current;
      const newWidth = Math.max(35, startWidthRef.current + diff);
      setColWidths((prev: any) => {
        const updated = { ...prev, [resizingCol]: newWidth };
        try {
          localStorage.setItem('modern_left_cols', JSON.stringify(updated));
        } catch {}
        return updated;
      });
    };

    const handleMouseUp = () => {
      if (resizingCol) setResizingCol(null);
    };

    if (resizingCol) {
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      document.body.style.cursor = '';
      document.body.style.userSelect = 'text';
    }

    const handleTableWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const container = e.currentTarget;
    const direction = e.deltaY > 0 ? 1 : -1;
    container.scrollTop += direction * rowHeight;
  };

  return () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = 'text';
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizingCol]);

  useEffect(() => {
    if (isActiveTable === false) {
      setActiveCell(null);
      setSelectedCellKeys(new Set());
      setSelectedRows([]);
      setSelectedCol(null);
    }
  }, [isActiveTable]);

  // Selection States: Set of "r-c" strings
  const [selectedCellKeys, setSelectedCellKeys] = useState<Set<string>>(new Set(['0-0']));
  const [activeCell, setActiveCell] = useState<CellCoord | null>({ r: 0, c: 0 });
  const [anchorCell, setAnchorCell] = useState<CellCoord | null>({ r: 0, c: 0 });
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [selectedCol, setSelectedCol] = useState<number | null>(null);
  const [showDirMenu, setShowDirMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Local editing cache
  const [cellDrafts, setCellDrafts] = useState<Record<string, string>>({});

  let filteredItems = items.filter(it =>
    it.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (sortField) {
    filteredItems = [...filteredItems].sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];
      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      const numA = Number(valA) || 0;
      const numB = Number(valB) || 0;
      return sortOrder === 'asc' ? numA - numB : numB - numA;
    });
  }

  const totalQty = items.reduce((acc, it) => acc + (Number(it.qty) || 0), 0);
  const totalUCap = items.reduce((acc, it) => acc + (Number(it.uCap) || 0), 0);
  const totalLCap = items.reduce((acc, it) => acc + (Number(it.lCap) || 0), 0);

  const [isRowResizing, setIsRowResizing] = useState<boolean>(false);
  const [contextMenu, setContextMenu] = useState<RowContextMenuState>({ isOpen: false, x: 0, y: 0, rowIndex: 0 });
  const [draggedRowIndex, setDraggedRowIndex] = useState<number | null>(null);
  const [dragOverRowIndex, setDragOverRowIndex] = useState<number | null>(null);

  const handleRowContextMenu = (e: React.MouseEvent, rowIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      isOpen: true,
      x: e.clientX,
      y: e.clientY,
      rowIndex
    });
  };
  

  const handleRowResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const startY = e.clientY;
    const startH = rowHeight;
    setIsRowResizing(true);

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaY = moveEvent.clientY - startY;
      const nextH = Math.max(20, Math.min(65, Math.round(startH + deltaY)));
      onSetRowHeight(nextH);
    };

    const onMouseUp = () => {
      setIsRowResizing(false);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const focusCell = (row: number, col: number) => {
    const input = document.getElementById('left-cell-' + row + '-' + col) as HTMLInputElement;
    if (input) {
      input.focus();
      input.select();
    }
  };

  const getCellValue = (r: number, c: number): string => {
    const it = filteredItems[r];
    if (!it) return '';
    if (c === 0) return it.name;
    if (c === 1) return String(it.qty);
    if (c === 2) return String(it.uCap);
    if (c === 3) return String(it.lCap);
    return '';
  };

    const commitItemNameCell = (rowIndex: number) => {
    const item = filteredItems[rowIndex];
    if (!item) return;
    const draftKey = rowIndex + '-0';
    const rawVal = cellDrafts[draftKey] !== undefined ? cellDrafts[draftKey] : (item.name || '');
    if (!rawVal.trim()) {
      if (item.name !== '') onUpdateItem(item.id, 'name', '');
      setCellDrafts(prev => {
        const next = { ...prev };
        delete next[draftKey];
        return next;
      });
      return;
    }

    let finalName = rawVal.trim();
    let autoUCap = item.uCap;
    let autoLCap = item.lCap;
    const valLower = rawVal.toLowerCase().trim();

    // 0. Check if already fully expanded conversion name
    let isFullConversion = false;
    for (const sc of SQLITE_SHORTCUTS as any[]) {
      const conv = (sc.conversion || '').toLowerCase().trim();
      if (conv && (valLower === conv || valLower.startsWith(conv + ' '))) {
        isFullConversion = true;
        break;
      }
    }

    // 1. Auto-Convert Mode
    if (!isFullConversion && autoConvert && rawVal.trim()) {
      const sortedShortcuts = [...SQLITE_SHORTCUTS].sort((a: any, b: any) => ((b.shortcut || '').length - (a.shortcut || '').length));
      for (const sc of sortedShortcuts as any[]) {
        const scCode = (sc.shortcut || '').toLowerCase().trim();
        if (scCode && (valLower === scCode || valLower.startsWith(scCode + ' ') || (valLower.startsWith(scCode) && rawVal.length > scCode.length))) {
          const remaining = rawVal.trim().slice(scCode.length).trim();
          finalName = remaining ? `${sc.conversion} ${remaining}` : sc.conversion;
          if (sc.u_cap && !isNaN(Number(sc.u_cap))) autoUCap = Number(sc.u_cap);
          if (sc.l_cap && !isNaN(Number(sc.l_cap))) autoLCap = Number(sc.l_cap);
          break;
        }
      }
    }

    // 2. Auto-Item Mode (Sticky previous item prefix)
    if (!isFullConversion && autoItem && rowIndex > 0 && (/^\d+$/.test(rawVal.trim()) || rawVal.trim().length <= 3)) {
      const prevItem = filteredItems[rowIndex - 1];
      if (prevItem && prevItem.name) {
        const parts = prevItem.name.trim().split(' ');
        if (parts.length > 1) {
          const prefix = parts.slice(0, -1).join(' ');
          finalName = `${prefix} ${rawVal.trim()}`;
        } else {
          finalName = `${prevItem.name.trim()} ${rawVal.trim()}`;
        }
      }
    }

    if (finalName !== item.name) onUpdateItem(item.id, 'name', finalName);
    if (autoUCap !== item.uCap) onUpdateItem(item.id, 'uCap', autoUCap);
    if (autoLCap !== item.lCap) onUpdateItem(item.id, 'lCap', autoLCap);

    setCellDrafts(prev => {
      const next = { ...prev };
      delete next[draftKey];
      return next;
    });
  };

  const commitNumericCell = (rowIndex: number, colIndex: number, field: keyof RawItem) => {
    const item = filteredItems[rowIndex];
    if (!item) return;
    const draftKey = rowIndex + '-' + colIndex;
    if (cellDrafts[draftKey] !== undefined) {
      const rawText = cellDrafts[draftKey];
      const evaluated = evaluateMathExpression(rawText);
      if (evaluated !== item[field]) {
        onUpdateItem(item.id, field, evaluated);
      }
      setCellDrafts(prev => {
        const next = { ...prev };
        delete next[draftKey];
        return next;
      });
    }
  };

  const commitCell = (rowIndex: number, colIndex: number, field: keyof RawItem) => {
    if (colIndex === 0) {
      commitItemNameCell(rowIndex);
    } else {
      commitNumericCell(rowIndex, colIndex, field);
    }
  };

  // Global Table Keydown
  useEffect(() => {
    const handleGlobalTableKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c' && selectedCellKeys.size > 1) {
        e.preventDefault();
        handleCopyGrid();
        return;
      }

      if (e.key === 'Insert') {
        e.preventDefault();
        const targetRow = activeCell ? activeCell?.r + 1 : (selectedRows.length > 0 ? selectedRows[selectedRows.length - 1] + 1 : items.length);
        onInsertRow(targetRow);
        setTimeout(() => focusCell(targetRow, activeCell ? activeCell?.c : 0), 50);
        return;
      }

      if ((e.ctrlKey || (e as any).metaKey) && (e.key === 'Delete' || e.key === 'Backspace')) {
        e.preventDefault();
        const targetRow = activeCell ? activeCell?.r : (selectedRows.length > 0 ? selectedRows[0] : 0);
        onDeleteRows([targetRow]);
        onToast(`Deleted Row #${targetRow + 1} (Ctrl+Delete)`, 'warning');
        return;
      }

      if (e.key === 'Delete') {
        if (selectedRows.length > 0) {
          e.preventDefault();
          onDeleteRows(selectedRows);
          setSelectedRows([]);
          return;
        }

        if (selectedCellKeys.size > 1) {
          e.preventDefault();
          const cellsToClear: { rowIndex: number; colIndex: number }[] = [];
          selectedCellKeys.forEach(key => {
            const [r, c] = key.split('-').map(Number);
            cellsToClear.push({ rowIndex: r, colIndex: c });
          });
          onClearCells(cellsToClear);
          return;
        }
      }
    };

    window.addEventListener('keydown', handleGlobalTableKey);
    const handleTableWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const container = e.currentTarget;
    const direction = e.deltaY > 0 ? 1 : -1;
    container.scrollTop += direction * rowHeight;
  };

  return () => window.removeEventListener('keydown', handleGlobalTableKey);
  }, [activeCell, selectedRows, selectedCellKeys, items.length]);

  const handleCopyGrid = () => {
    let tsv = '';
    let count = 0;

    if (selectedRows.length > 0) {
      tsv = selectedRows.map(r => {
        const it = filteredItems[r];
        return it ? `${it.name}\t${it.qty}\t${it.uCap}\t${it.lCap}` : '';
      }).filter(Boolean).join('\n');
      count = selectedRows.length;
    } else if (selectedCellKeys.size > 1) {
      let minR = Infinity, maxR = -Infinity, minC = Infinity, maxC = -Infinity;
      selectedCellKeys.forEach(key => {
        const [r, c] = key.split('-').map(Number);
        if (r < minR) minR = r;
        if (r > maxR) maxR = r;
        if (c < minC) minC = c;
        if (c > maxC) maxC = c;
      });

      const lines: string[] = [];
      for (let r = minR; r <= maxR; r++) {
        const rowCols: string[] = [];
        for (let c = minC; c <= maxC; c++) {
          if (selectedCellKeys.has(`${r}-${c}`)) {
            rowCols.push(getCellValue(r, c));
          } else {
            rowCols.push('');
          }
        }
        lines.push(rowCols.join('\t'));
      }
      tsv = lines.join('\n');
      count = selectedCellKeys.size;
    } else {
      tsv = items.map(it => `${it.name}\t${it.qty}\t${it.uCap}\t${it.lCap}`).join('\n');
      count = items.length;
    }

    navigator.clipboard.writeText(tsv).then(() => {
      onToast(`Copied ${count} items/cells to Clipboard!`, 'success');
    }).catch(() => {
      onToast('Clipboard write permission denied', 'warning');
    });
  };

  const executeGridPaste = (text: string, startR: number, startC: number) => {
    if (!text || !text.trim()) return;

    let lines = text.trim().split(/\r?\n/).map(line => line.split('\t'));
    
    if (lines.length > 0 && lines[0].some(col => /item|name|qty|cap|spec|mould|price|total/i.test(col.trim()))) {
      lines = lines.slice(1);
    }

    if (lines.length === 0) return;

    onBulkPaste(lines, startR, startC);

    const newKeys = new Set<string>();
    lines.forEach((line, rIdx) => {
      line.forEach((_, cIdx) => {
        newKeys.add(`${startR + rIdx}-${startC + cIdx}`);
      });
    });
    setSelectedCellKeys(newKeys);
    setActiveCell({ r: startR, c: startC });
  };

  const handlePasteButtonClick = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text || !text.trim()) {
        onToast('Clipboard is empty!', 'warning');
        return;
      }
      executeGridPaste(text, activeCell?.r ?? 0, activeCell?.c ?? 0);
    } catch {
      onToast('Click in cell & press Ctrl+V to paste', 'info');
    }
  };

  const handleInputPaste = (r: number, c: number, e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData('text');
    if (text && (text.includes('\t') || text.includes('\n'))) {
      e.preventDefault();
      e.stopPropagation();
      executeGridPaste(text, r, c);
    }
  };

  const handleInputMouseDown = (r: number, c: number, e: React.MouseEvent<HTMLInputElement>) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const key = `${r}-${c}`;
      setSelectedCellKeys(prev => {
        const next = new Set(prev);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        return next;
      });
      setActiveCell({ r, c });
      setAnchorCell({ r, c });
      setSelectedRows([]);
      setSelectedCol(null);
      return;
    }

    if (e.shiftKey && anchorCell) {
      e.preventDefault();
      const minR = Math.min(anchorCell.r, r);
      const maxR = Math.max(anchorCell.r, r);
      const minC = Math.min(anchorCell.c, c);
      const maxC = Math.max(anchorCell.c, c);
      const keys = new Set<string>();
      for (let row = minR; row <= maxR; row++) {
        for (let col = minC; col <= maxC; col++) {
          keys.add(`${row}-${col}`);
        }
      }
      setSelectedCellKeys(keys);
      setActiveCell({ r, c });
      setSelectedRows([]);
      setSelectedCol(null);
      return;
    }

    setIsMouseDown(true);
    setAnchorCell({ r, c });
    setActiveCell({ r, c });
    setSelectedCellKeys(new Set([`${r}-${c}`]));
    setSelectedRows([]);
    setSelectedCol(null);
  };

  const handleInputMouseEnter = (r: number, c: number) => {
    if (isMouseDown && anchorCell) {
      const minR = Math.min(anchorCell.r, r);
      const maxR = Math.max(anchorCell.r, r);
      const minC = Math.min(anchorCell.c, c);
      const maxC = Math.max(anchorCell.c, c);
      const keys = new Set<string>();
      for (let row = minR; row <= maxR; row++) {
        for (let col = minC; col <= maxC; col++) {
          keys.add(`${row}-${col}`);
        }
      }
      setSelectedCellKeys(keys);
      setActiveCell({ r, c });
    }
  };

  const handleMouseUp = () => {
    setIsMouseDown(false);
  };

  const handleCellKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    rowIndex: number,
    colIndex: number,
    field: keyof RawItem
  ) => {
    // 1. CTRL + DELETE: Instantly delete active row
    if ((e.ctrlKey || e.metaKey) && (e.key === 'Delete' || e.key === 'Backspace')) {
      e.preventDefault();
      onDeleteRows([rowIndex]);
      onToast(`Deleted Row #${rowIndex + 1} (Ctrl+Delete)`, 'warning');
      const nextTargetRow = Math.min(rowIndex, filteredItems.length - 2);
      if (nextTargetRow >= 0) {
        setTimeout(() => {
          focusCell(nextTargetRow, colIndex);
          setActiveCell({ r: nextTargetRow, c: colIndex });
          setAnchorCell({ r: nextTargetRow, c: colIndex });
          setSelectedCellKeys(new Set([`${nextTargetRow}-${colIndex}`]));
        }, 30);
      }
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      commitCell(rowIndex, colIndex, field);

      let nextRow = rowIndex;
      let nextCol = colIndex;

      if (enterDirection === 'right') {
        if (colIndex < 3) {
          nextCol = colIndex + 1;
        } else {
          nextCol = 0;
          nextRow = rowIndex + 1;
        }
      } else if (enterDirection === 'down') {
        nextRow = rowIndex + 1;
      } else if (enterDirection === 'left') {
        if (colIndex > 0) {
          nextCol = colIndex - 1;
        } else {
          nextCol = 3;
          nextRow = Math.max(0, rowIndex - 1);
        }
      } else if (enterDirection === 'up') {
        nextRow = Math.max(0, rowIndex - 1);
      }

      if (nextRow >= filteredItems.length) {
        onAddNewRow();
      }

      setTimeout(() => {
        focusCell(nextRow, nextCol);
        setActiveCell({ r: nextRow, c: nextCol });
        setAnchorCell({ r: nextRow, c: nextCol });
        setSelectedCellKeys(new Set([`${nextRow}-${nextCol}`]));
        setSelectedCol(null);
        setSelectedRows([]);
      }, 10);
      return;
    }

    if (e.key === 'ArrowRight') {
      const target = e.target as HTMLInputElement;
      if (target.selectionEnd === target.value.length || e.altKey) {
        e.preventDefault();
        commitCell(rowIndex, colIndex, field);
        if (colIndex < 3) {
          focusCell(rowIndex, colIndex + 1);
          setActiveCell({ r: rowIndex, c: colIndex + 1 });
          setAnchorCell({ r: rowIndex, c: colIndex + 1 });
          setSelectedCellKeys(new Set([`${rowIndex}-${colIndex + 1}`]));
        } else {
          if (onJumpToRightGrid) {
            onJumpToRightGrid(rowIndex);
          } else if (rowIndex + 1 < filteredItems.length) {
            focusCell(rowIndex + 1, 0);
            setActiveCell({ r: rowIndex + 1, c: 0 });
            setAnchorCell({ r: rowIndex + 1, c: 0 });
            setSelectedCellKeys(new Set([`${rowIndex + 1}-0`]));
          }
        }
      }
    } else if (e.key === 'ArrowLeft') {
      const target = e.target as HTMLInputElement;
      if (target.selectionStart === 0 || e.altKey) {
        e.preventDefault();
        commitCell(rowIndex, colIndex, field);
        if (colIndex > 0) {
          focusCell(rowIndex, colIndex - 1);
          setActiveCell({ r: rowIndex, c: colIndex - 1 });
          setAnchorCell({ r: rowIndex, c: colIndex - 1 });
          setSelectedCellKeys(new Set([`${rowIndex}-${colIndex - 1}`]));
        } else if (rowIndex > 0) {
          focusCell(rowIndex - 1, 3);
          setActiveCell({ r: rowIndex - 1, c: 3 });
          setAnchorCell({ r: rowIndex - 1, c: 3 });
          setSelectedCellKeys(new Set([`${rowIndex - 1}-3`]));
        }
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      commitCell(rowIndex, colIndex, field);

      // Ctrl + ArrowDown: Shift row DOWN
      if (e.ctrlKey || e.metaKey) {
        if (rowIndex + 1 < filteredItems.length) {
          onReorderItems(rowIndex, rowIndex + 1);
          setTimeout(() => {
            focusCell(rowIndex + 1, colIndex);
            setActiveCell({ r: rowIndex + 1, c: colIndex });
            setAnchorCell({ r: rowIndex + 1, c: colIndex });
            setSelectedCellKeys(new Set([`${rowIndex + 1}-${colIndex}`]));
          }, 30);
          onToast(`Row #${rowIndex + 1} shifted down (Ctrl+Down)`, 'info');
        }
        return;
      }

      if (rowIndex + 1 < filteredItems.length) {
        focusCell(rowIndex + 1, colIndex);
        setActiveCell({ r: rowIndex + 1, c: colIndex });
        setAnchorCell({ r: rowIndex + 1, c: colIndex });
        setSelectedCellKeys(new Set([`${rowIndex + 1}-${colIndex}`]));
      } else {
        onAddNewRow();
        setTimeout(() => {
          focusCell(rowIndex + 1, colIndex);
          setActiveCell({ r: rowIndex + 1, c: colIndex });
          setAnchorCell({ r: rowIndex + 1, c: colIndex });
          setSelectedCellKeys(new Set([`${rowIndex + 1}-${colIndex}`]));
        }, 20);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      commitCell(rowIndex, colIndex, field);

      // Ctrl + ArrowUp: Shift row UP
      if (e.ctrlKey || e.metaKey) {
        if (rowIndex > 0) {
          onReorderItems(rowIndex, rowIndex - 1);
          setTimeout(() => {
            focusCell(rowIndex - 1, colIndex);
            setActiveCell({ r: rowIndex - 1, c: colIndex });
            setAnchorCell({ r: rowIndex - 1, c: colIndex });
            setSelectedCellKeys(new Set([`${rowIndex - 1}-${colIndex}`]));
          }, 30);
          onToast(`Row #${rowIndex + 1} shifted up (Ctrl+Up)`, 'info');
        }
        return;
      }

      if (rowIndex > 0) {
        focusCell(rowIndex - 1, colIndex);
        setActiveCell({ r: rowIndex - 1, c: colIndex });
        setAnchorCell({ r: rowIndex - 1, c: colIndex });
        setSelectedCellKeys(new Set([`${rowIndex - 1}-${colIndex}`]));
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      commitCell(rowIndex, colIndex, field);
      if (!e.shiftKey) {
        if (colIndex < 3) {
          focusCell(rowIndex, colIndex + 1);
          setActiveCell({ r: rowIndex, c: colIndex + 1 });
          setAnchorCell({ r: rowIndex, c: colIndex + 1 });
          setSelectedCellKeys(new Set([`${rowIndex}-${colIndex + 1}`]));
        } else {
          if (onJumpToRightGrid) {
            onJumpToRightGrid(rowIndex);
          } else {
            const nxtR = rowIndex + 1;
            if (nxtR >= filteredItems.length) onAddNewRow();
            setTimeout(() => {
              focusCell(nxtR, 0);
              setActiveCell({ r: nxtR, c: 0 });
              setAnchorCell({ r: nxtR, c: 0 });
              setSelectedCellKeys(new Set([`${nxtR}-0`]));
            }, 20);
          }
        }
      } else {
        if (colIndex > 0) {
          focusCell(rowIndex, colIndex - 1);
          setActiveCell({ r: rowIndex, c: colIndex - 1 });
          setAnchorCell({ r: rowIndex, c: colIndex - 1 });
          setSelectedCellKeys(new Set([`${rowIndex}-${colIndex - 1}`]));
        } else if (rowIndex > 0) {
          focusCell(rowIndex - 1, 3);
          setActiveCell({ r: rowIndex - 1, c: 3 });
          setAnchorCell({ r: rowIndex - 1, c: 3 });
          setSelectedCellKeys(new Set([`${rowIndex - 1}-3`]));
        }
      }
    }
  };

  const handleTableWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const container = e.currentTarget;
    const direction = e.deltaY > 0 ? 1 : -1;
    container.scrollTop += direction * rowHeight;
  };

  return (
    <div 
      className="glass-panel" 
      style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100%', 
        padding: '10px 14px',
        overflow: 'hidden'
      }}
      onMouseUp={handleMouseUp}
      onMouseDownCapture={() => onActivateTable?.()}
      onFocusCapture={() => onActivateTable?.()}
    >
      {/* Top Header */}
      <div 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'flex-end',
          marginBottom: '8px'
        }}
      >
        

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Copy Button */}
          <button
            type="button"
            onClick={handleCopyGrid}
            className="apple-box-btn"
            style={{ width: '28px', height: '28px', borderRadius: '6px' }}
            title="Copy Table / Selected Cells (Ctrl+C)"
          >
            <Copy size={13} />
          </button>

          {/* Dedicated Paste Button */}
          <button
            type="button"
            onClick={handlePasteButtonClick}
            className="apple-box-btn"
            style={{ width: '28px', height: '28px', borderRadius: '6px' }}
            title="Paste Table from Clipboard (Ctrl+V)"
          >
            <ClipboardPaste size={13} />
          </button>

          {/* Table Settings Button & Popover */}
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setShowSettings(prev => !prev)}
              className="apple-box-btn"
              style={{ 
                width: '28px', 
                height: '28px', 
                borderRadius: '6px',
                background: showSettings ? 'rgba(0, 113, 227, 0.35)' : 'rgba(255, 255, 255, 0.05)',
                borderColor: showSettings ? '#0071e3' : 'rgba(255, 255, 255, 0.12)'
              }}
              title="Table Settings"
            >
              <Settings size={13} color={showSettings ? '#38bdf8' : '#d4d4d8'} />
            </button>

            <TableSettingsDropdown
              isOpen={showSettings}
              onClose={() => setShowSettings(false)}
              enterDirection={enterDirection}
              onSetEnterDirection={onSetEnterDirection}
              rowHeight={rowHeight}
              onSetRowHeight={onSetRowHeight}
              tableFontSize={tableFontSize}
              onSetTableFontSize={onSetTableFontSize}
              onToast={onToast}
              align="left"
            />
          </div>

          {/* Spotlight Search Pill */}
          <div className="apple-search-pill" style={{ width: '150px' }}>
            <Search size={11} style={{ position: 'absolute', left: '9px', top: '50%', transform: 'translateY(-50%)', color: '#a1a1aa' }} />
            <input
              type="text"
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Excel Data Table */}
      <div 
        onWheel={handleTableWheel}
        style={{ 
          flex: 1, 
          overflowY: 'auto', 
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '8px',
          background: 'rgba(0, 0, 0, 0.22)',
          position: 'relative'
        }}
      >
        <table className="apple-table">
          <colgroup>
            <col style={{ width: colWidths.index + 'px' }} />
            <col style={{ width: colWidths.name + 'px' }} />
            <col style={{ width: colWidths.qty + 'px' }} />
            <col style={{ width: colWidths.uCap + 'px' }} />
            <col style={{ width: colWidths.lCap + 'px' }} />
          </colgroup>
          <thead style={{ position: 'sticky', top: 0, zIndex: 20 }}>
            <tr>
              <th 
                style={{ 
                  width: colWidths.index + 'px', 
                  textAlign: 'center', 
                  position: 'sticky', 
                  top: 0, 
                  zIndex: 20, 
                  background: '#121722',
                  borderBottom: '2px solid rgba(255, 255, 255, 0.15)',
                  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.5)'
                }}
                onClick={() => { setSelectedRows([]); setSelectedCol(null); setSelectedCellKeys(new Set()); }}
                title="Deselect all"
              >
                <span>#</span>
              </th>

              <th 
                style={{ 
                  width: colWidths.name + 'px', 
                  height: rowHeight + 'px', 
                  padding: 0, 
                  position: 'sticky', 
                  top: 0, 
                  zIndex: 20, 
                  background: '#121722',
                  borderBottom: '2px solid rgba(255, 255, 255, 0.15)',
                  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.5)'
                }}
                onClick={() => { 
                  setSelectedCol(0); 
                  setSelectedRows([]); 
                  const keys = new Set<string>();
                  filteredItems.forEach((_, idx) => keys.add(idx + '-0'));
                  setSelectedCellKeys(keys);
                  toggleSort('name');
                }} 
                className={((isActiveTable && selectedCol === 0) ? 'col-selected ' : '') + ((isActiveTable && activeCell?.c === 0) ? 'header-active' : '')}
                title="Click to select column, drag right border to resize"
              >
                <span>ITEM NAME {sortField === 'name' ? (sortOrder === 'asc' ? ' ↑ (A-Z)' : ' ↓ (Z-A)') : ''}</span>
                <div className="th-resizer" onMouseDown={(e) => startResizeCol('name', e)} />
              </th>

              <th 
                style={{ 
                  width: colWidths.qty + 'px', 
                  textAlign: 'center', 
                  position: 'sticky', 
                  top: 0, 
                  zIndex: 20, 
                  background: '#121722',
                  borderBottom: '2px solid rgba(255, 255, 255, 0.15)',
                  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.5)'
                }} 
                onClick={() => { 
                  setSelectedCol(1); 
                  setSelectedRows([]); 
                  const keys = new Set<string>();
                  filteredItems.forEach((_, idx) => keys.add(idx + '-1'));
                  setSelectedCellKeys(keys);
                  toggleSort('qty');
                }}
                className={((isActiveTable && selectedCol === 1) ? 'col-selected ' : '') + ((isActiveTable && activeCell?.c === 1) ? 'header-active' : '')}
                title="Click to select column, drag right border to resize"
              >
                <span>QTY {sortField === 'qty' ? (sortOrder === 'asc' ? ' ↑ (Min)' : ' ↓ (Max)') : ''}</span>
                <div className="th-resizer" onMouseDown={(e) => startResizeCol('qty', e)} />
              </th>

              <th 
                style={{ 
                  width: colWidths.uCap + 'px', 
                  textAlign: 'center', 
                  position: 'sticky', 
                  top: 0, 
                  zIndex: 20, 
                  background: '#121722',
                  borderBottom: '2px solid rgba(255, 255, 255, 0.15)',
                  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.5)'
                }} 
                onClick={() => { 
                  setSelectedCol(2); 
                  setSelectedRows([]); 
                  const keys = new Set<string>();
                  filteredItems.forEach((_, idx) => keys.add(idx + '-2'));
                  setSelectedCellKeys(keys);
                  toggleSort('uCap');
                }}
                className={((isActiveTable && selectedCol === 2) ? 'col-selected ' : '') + ((isActiveTable && activeCell?.c === 2) ? 'header-active' : '')}
                title="Click to select column, drag right border to resize"
              >
                <span>U CAP {sortField === 'uCap' ? (sortOrder === 'asc' ? ' ↑ (Min)' : ' ↓ (Max)') : ''}</span>
                <div className="th-resizer" onMouseDown={(e) => startResizeCol('uCap', e)} />
              </th>

              <th 
                style={{ 
                  width: colWidths.lCap + 'px', 
                  textAlign: 'center', 
                  position: 'sticky', 
                  top: 0, 
                  zIndex: 20, 
                  background: '#121722',
                  borderBottom: '2px solid rgba(255, 255, 255, 0.15)',
                  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.5)'
                }} 
                onClick={() => { 
                  setSelectedCol(3); 
                  setSelectedRows([]); 
                  const keys = new Set<string>();
                  filteredItems.forEach((_, idx) => keys.add(idx + '-3'));
                  setSelectedCellKeys(keys);
                  toggleSort('lCap');
                }}
                className={((isActiveTable && selectedCol === 3) ? 'col-selected ' : '') + ((isActiveTable && activeCell?.c === 3) ? 'header-active' : '')}
                title="Click to select column, drag right border to resize"
              >
                <span>L CAP {sortField === 'lCap' ? (sortOrder === 'asc' ? ' ↑ (Min)' : ' ↓ (Max)') : ''}</span>
                <div className="th-resizer" onMouseDown={(e) => startResizeCol('lCap', e)} />
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map((item, rIdx) => {
              const isRowSelected = isActiveTable && selectedRows.includes(rIdx);
              const isRowActive = isActiveTable && activeCell?.r === rIdx;

              const handleTableWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const container = e.currentTarget;
    const direction = e.deltaY > 0 ? 1 : -1;
    container.scrollTop += direction * rowHeight;
  };

  return (
                <tr 
                  key={item.id} 
                  className={(isRowSelected ? 'row-selected ' : '') + (dragOverRowIndex === rIdx ? 'drag-over-active ' : '')}
                  onContextMenu={(e) => handleRowContextMenu(e, rIdx)}
                >
                  <td 
                    style={{ 
                      width: `${colWidths.index}px`, 
                      height: `${rowHeight}px`, 
                      textAlign: 'center', 
                      fontSize: '11px', 
                      cursor: 'pointer', 
                      userSelect: 'none',
                      position: 'relative',
                      padding: 0
                    }}
                    className={(isRowActive ? 'row-header-active ' : '') + (isRowSelected ? 'row-header-selected ' : '') + 'row-header-draggable'}
                    draggable
                    onDragStart={(e) => {
                      setDraggedRowIndex(rIdx);
                      e.dataTransfer.setData('text/plain', String(rIdx));
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOverRowIndex(rIdx);
                    }}
                    onDragLeave={() => {
                      if (dragOverRowIndex === rIdx) setDragOverRowIndex(null);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (draggedRowIndex !== null && draggedRowIndex !== rIdx) {
                        onReorderItems(draggedRowIndex, rIdx);
                      }
                      setDraggedRowIndex(null);
                      setDragOverRowIndex(null);
                    }}
                    onClick={(e) => {
                      setSelectedCol(null);
                      if (e.ctrlKey) {
                        setSelectedRows(prev => prev.includes(rIdx) ? prev.filter(x => x !== rIdx) : [...prev, rIdx]);
                      } else if (e.shiftKey && selectedRows.length > 0) {
                        const last = selectedRows[selectedRows.length - 1];
                        const start = Math.min(last, rIdx);
                        const end = Math.max(last, rIdx);
                        const range: number[] = [];
                        for (let i = start; i <= end; i++) range.push(i);
                        setSelectedRows(range);
                      } else {
                        setSelectedRows(prev => prev.length === 1 && prev[0] === rIdx ? [] : [rIdx]);
                      }
                    }}
                    title="Click row to select. Insert: New row, Delete: Remove row"
                  >
                    {rIdx + 1}
                    <div
                      className={'row-resizer ' + (isRowResizing ? 'resizing' : '')}
                      onMouseDown={handleRowResizeMouseDown}
                      title="Drag to resize ALL row heights"
                    />
                  </td>

                  {/* Col 0: Name */}
                  <td 
                    style={{ width: `${colWidths.name}px`, height: `${rowHeight}px`, padding: 0 }}
                    className={((isActiveTable && selectedCol === 0) ? 'col-selected ' : '') + ((isActiveTable && selectedCellKeys.has(rIdx + '-0')) ? 'cell-selected' : '')}
                  >
                    <input
                      id={'left-cell-' + rIdx + '-0'}
                      type="text"
                      className="excel-cell-input"
                      value={cellDrafts[rIdx + '-0'] !== undefined ? cellDrafts[rIdx + '-0'] : (item.name || '')}
                      onMouseDown={(e) => handleInputMouseDown(rIdx, 0, e)}
                      onMouseEnter={() => handleInputMouseEnter(rIdx, 0)}
                      onPaste={(e) => handleInputPaste(rIdx, 0, e)}
                      onFocus={() => {
                        onActivateTable?.();
                        setActiveCell({ r: rIdx, c: 0 });
                        setAnchorCell({ r: rIdx, c: 0 });
                        setSelectedCellKeys(new Set([`${rIdx}-0`]));
                        setSelectedCol(null);
                        setSelectedRows([]);
                      }}
                      onChange={(e) => {
                        const rawVal = e.target.value;
                        setCellDrafts(prev => ({ ...prev, [`${rIdx}-0`]: rawVal }));
                      }}
                      onBlur={() => commitCell(rIdx, 0, 'name')}
                      onKeyDown={(e) => handleCellKeyDown(e, rIdx, 0, 'name')}
                    />
                  </td>

                  {/* Col 1: QTY */}
                  <td 
                    style={{ width: `${colWidths.qty}px`, height: `${rowHeight}px`, padding: 0 }}
                    className={((isActiveTable && selectedCol === 1) ? 'col-selected ' : '') + ((isActiveTable && selectedCellKeys.has(rIdx + '-1')) ? 'cell-selected' : '')}
                  >
                    <input
                      id={'left-cell-' + rIdx + '-1'}
                      type="text"
                      inputMode="decimal"
                      className="excel-cell-input"
                      style={{ textAlign: 'center' }}
                      value={cellDrafts[rIdx + '-1'] !== undefined ? cellDrafts[rIdx + '-1'] : (item.qty === 0 ? '' : item.qty)}
                      onMouseDown={(e) => handleInputMouseDown(rIdx, 1, e)}
                      onMouseEnter={() => handleInputMouseEnter(rIdx, 1)}
                      onPaste={(e) => handleInputPaste(rIdx, 1, e)}
                      onFocus={() => {
                        onActivateTable?.();
                        setActiveCell({ r: rIdx, c: 1 });
                        setAnchorCell({ r: rIdx, c: 1 });
                        setSelectedCellKeys(new Set([`${rIdx}-1`]));
                        setSelectedCol(null);
                        setSelectedRows([]);
                        setCellDrafts(prev => ({ ...prev, [rIdx + '-1']: item.qty === 0 ? '' : String(item.qty) }));
                      }}
                      onChange={(e) => {
                        const clean = e.target.value.replace(/[^0-9+\-*/.()\s=]/g, '');
                        setCellDrafts(prev => ({ ...prev, [rIdx + '-1']: clean }));
                      }}
                      onBlur={() => commitNumericCell(rIdx, 1, 'qty')}
                      onKeyDown={(e) => handleCellKeyDown(e, rIdx, 1, 'qty')}
                    />
                  </td>

                  {/* Col 2: U CAP */}
                  <td 
                    style={{ width: `${colWidths.uCap}px`, height: `${rowHeight}px`, padding: 0 }}
                    className={((isActiveTable && selectedCol === 2) ? 'col-selected ' : '') + ((isActiveTable && selectedCellKeys.has(rIdx + '-2')) ? 'cell-selected' : '')}
                  >
                    <input
                      id={'left-cell-' + rIdx + '-2'}
                      type="text"
                      inputMode="decimal"
                      className="excel-cell-input"
                      style={{ textAlign: 'center' }}
                      value={cellDrafts[rIdx + '-2'] !== undefined ? cellDrafts[rIdx + '-2'] : (item.uCap === 0 ? '' : item.uCap)}
                      onMouseDown={(e) => handleInputMouseDown(rIdx, 2, e)}
                      onMouseEnter={() => handleInputMouseEnter(rIdx, 2)}
                      onPaste={(e) => handleInputPaste(rIdx, 2, e)}
                      onFocus={() => {
                        onActivateTable?.();
                        setActiveCell({ r: rIdx, c: 2 });
                        setAnchorCell({ r: rIdx, c: 2 });
                        setSelectedCellKeys(new Set([`${rIdx}-2`]));
                        setSelectedCol(null);
                        setSelectedRows([]);
                        setCellDrafts(prev => ({ ...prev, [rIdx + '-2']: item.uCap === 0 ? '' : String(item.uCap) }));
                      }}
                      onChange={(e) => {
                        const clean = e.target.value.replace(/[^0-9+\-*/.()\s=]/g, '');
                        setCellDrafts(prev => ({ ...prev, [rIdx + '-2']: clean }));
                      }}
                      onBlur={() => commitNumericCell(rIdx, 2, 'uCap')}
                      onKeyDown={(e) => handleCellKeyDown(e, rIdx, 2, 'uCap')}
                    />
                  </td>

                  {/* Col 3: L CAP */}
                  <td 
                    style={{ width: `${colWidths.lCap}px`, height: `${rowHeight}px`, padding: 0 }}
                    className={((isActiveTable && selectedCol === 3) ? 'col-selected ' : '') + ((isActiveTable && selectedCellKeys.has(rIdx + '-3')) ? 'cell-selected' : '')}
                  >
                    <input
                      id={'left-cell-' + rIdx + '-3'}
                      type="text"
                      inputMode="decimal"
                      className="excel-cell-input"
                      style={{ textAlign: 'center' }}
                      value={cellDrafts[rIdx + '-3'] !== undefined ? cellDrafts[rIdx + '-3'] : (item.lCap === 0 ? '' : item.lCap)}
                      onMouseDown={(e) => handleInputMouseDown(rIdx, 3, e)}
                      onMouseEnter={() => handleInputMouseEnter(rIdx, 3)}
                      onPaste={(e) => handleInputPaste(rIdx, 3, e)}
                      onFocus={() => {
                        onActivateTable?.();
                        setActiveCell({ r: rIdx, c: 3 });
                        setAnchorCell({ r: rIdx, c: 3 });
                        setSelectedCellKeys(new Set([`${rIdx}-3`]));
                        setSelectedCol(null);
                        setSelectedRows([]);
                        setCellDrafts(prev => ({ ...prev, [rIdx + '-3']: item.lCap === 0 ? '' : String(item.lCap) }));
                      }}
                      onChange={(e) => {
                        const clean = e.target.value.replace(/[^0-9+\-*/.()\s=]/g, '');
                        setCellDrafts(prev => ({ ...prev, [rIdx + '-3']: clean }));
                      }}
                      onBlur={() => commitNumericCell(rIdx, 3, 'lCap')}
                      onKeyDown={(e) => handleCellKeyDown(e, rIdx, 3, 'lCap')}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>

          {/* Table Footer Row */}
          <tfoot>
            <tr>
              <td style={{ textAlign: 'center', color: '#a1a1aa' }}>TOTAL</td>
              <td style={{ color: '#a1a1aa', fontSize: '11px' }}>{items.length} Rows Recorded</td>
              <td style={{ textAlign: 'center', color: '#ffffff', fontFamily: "'JetBrains Mono', monospace" }}>{totalQty}</td>
              <td style={{ textAlign: 'center', color: '#ffffff', fontFamily: "'JetBrains Mono', monospace" }}>{totalUCap}</td>
              <td style={{ textAlign: 'center', color: '#ffffff', fontFamily: "'JetBrains Mono', monospace" }}>{totalLCap}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    
      {/* Row Right-Click Context Menu */}
      <RowContextMenu
        contextMenu={contextMenu}
        onClose={() => setContextMenu(prev => ({ ...prev, isOpen: false }))}
        onInsertAbove={(idx) => {
          onInsertRow(idx);
          onToast(`Inserted row above #${idx + 1}`, 'info');
        }}
        onInsertBelow={(idx) => {
          onInsertRow(idx);
          onToast(`Inserted row below #${idx}`, 'info');
        }}
        onDeleteRow={(idx) => {
          onDeleteRows([idx]);
          onToast(`Deleted row #${idx + 1}`, 'warning');
        }}
        onClearRow={(idx) => {
          onClearCells([
            { rowIndex: idx, colIndex: 0 },
            { rowIndex: idx, colIndex: 1 },
            { rowIndex: idx, colIndex: 2 },
            { rowIndex: idx, colIndex: 3 }
          ]);
          onToast(`Cleared row #${idx + 1}`, 'info');
        }}
      />
    </div>
  );
};


export default LeftGrid;

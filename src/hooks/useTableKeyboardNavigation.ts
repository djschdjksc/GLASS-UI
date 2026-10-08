import { useCallback, useEffect, useRef } from 'react';
import { macAudio } from '../utils/macAudio';

export interface TableKeyboardNavOptions {
  tableId: string;
  itemCount: number;
  selectedIndex: number;
  onSelectIndex: (index: number) => void;
  // Pagination options
  isPaginated?: boolean;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (newPage: number, targetRow?: 'first' | 'last') => void;
  pageJumpSize?: number;
  // Actions
  onRowSubmit?: (index: number) => void;
  onRowDelete?: (index: number) => void;
  tableContainerRef?: React.RefObject<HTMLElement | null>;
}

export function useTableKeyboardNavigation({
  tableId,
  itemCount,
  selectedIndex,
  onSelectIndex,
  isPaginated = false,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  pageJumpSize = 10,
  onRowSubmit,
  onRowDelete,
  tableContainerRef
}: TableKeyboardNavOptions) {
  const paginationIdPrefix = `${tableId}-pagination`;
  const pendingFocusTargetRef = useRef<'first' | 'last' | null>(null);
  const lastSoundRef = useRef<number>(0);

  const playNavSound = useCallback(() => {
    const now = performance.now();
    if (now - lastSoundRef.current > 45) {
      lastSoundRef.current = now;
      macAudio.playHover();
    }
  }, []);

  // Focus table container or specific row
  const focusTable = useCallback((targetRow?: 'first' | 'last') => {
    if (targetRow === 'first') {
      onSelectIndex(0);
    } else if (targetRow === 'last' && itemCount > 0) {
      onSelectIndex(itemCount - 1);
    }

    if (tableContainerRef?.current) {
      tableContainerRef.current.focus({ preventScroll: true });
    } else {
      const el = document.getElementById(`${tableId}-wrapper`);
      if (el) el.focus({ preventScroll: true });
    }
  }, [tableContainerRef, tableId, onSelectIndex, itemCount]);

  // Focus Next Page button fallback
  const focusNextPageBtn = useCallback(() => {
    const nextBtn = document.getElementById(`${paginationIdPrefix}-next`) as HTMLButtonElement | null;
    if (nextBtn && !nextBtn.disabled) {
      nextBtn.focus();
      macAudio.playPop();
      return true;
    }
    return false;
  }, [paginationIdPrefix]);

  // Focus Previous Page button fallback
  const focusPrevPageBtn = useCallback(() => {
    const prevBtn = document.getElementById(`${paginationIdPrefix}-prev`) as HTMLButtonElement | null;
    if (prevBtn && !prevBtn.disabled) {
      prevBtn.focus();
      macAudio.playPop();
      return true;
    }
    return false;
  }, [paginationIdPrefix]);

  // Handle key navigation within table
  const handleKeyDown = useCallback((e: React.KeyboardEvent<any>) => {
    // NumLock & Clear key safety: NEVER delete or trigger actions
    if (e.key === 'NumLock' || e.code === 'NumLock' || e.key === 'Clear') {
      return;
    }

    const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName || '');
    if (isInput) {
      if (e.key === 'Delete' || e.key === 'Backspace') return;
      if (e.key === 'Escape') {
        e.preventDefault();
        (e.target as HTMLElement)?.blur();
        return;
      }
      return;
    }

    if (itemCount === 0) return;

    // Arrow Down
    if (e.key === 'ArrowDown') {
      if (selectedIndex < itemCount - 1) {
        e.preventDefault();
        onSelectIndex(selectedIndex + 1);
        playNavSound();
      } else if (selectedIndex === itemCount - 1) {
        // Last row reached: auto flip to Next Page row 0 without stopping on button
        if (isPaginated && currentPage < totalPages && onPageChange) {
          e.preventDefault();
          onPageChange(currentPage + 1, 'first');
          playNavSound();
        }
      }
      return;
    }

    // Arrow Up
    if (e.key === 'ArrowUp') {
      if (selectedIndex > 0) {
        e.preventDefault();
        onSelectIndex(selectedIndex - 1);
        playNavSound();
      } else if (selectedIndex === 0) {
        // First row reached: auto flip to Previous Page last row without stopping on button
        if (isPaginated && currentPage > 1 && onPageChange) {
          e.preventDefault();
          onPageChange(currentPage - 1, 'last');
          playNavSound();
        }
      }
      return;
    }

    // Page Down: Fast Jump Down
    if (e.key === 'PageDown') {
      e.preventDefault();
      if (e.ctrlKey) {
        // Ctrl + PageDown: Jump directly to Last Row
        onSelectIndex(itemCount - 1);
      } else {
        const nextIdx = Math.min(selectedIndex + pageJumpSize, itemCount - 1);
        onSelectIndex(nextIdx);
      }
      playNavSound();
      return;
    }

    // Page Up: Fast Jump Up
    if (e.key === 'PageUp') {
      e.preventDefault();
      if (e.ctrlKey) {
        // Ctrl + PageUp: Jump directly to First Row
        onSelectIndex(0);
      } else {
        const prevIdx = Math.max(selectedIndex - pageJumpSize, 0);
        onSelectIndex(prevIdx);
      }
      playNavSound();
      return;
    }

    // Home: First row of table
    if (e.key === 'Home') {
      e.preventDefault();
      onSelectIndex(0);
      playNavSound();
      return;
    }

    // End: Last row of table
    if (e.key === 'End') {
      e.preventDefault();
      onSelectIndex(itemCount - 1);
      playNavSound();
      return;
    }

    // Enter: Submit / open selected row
    if (e.key === 'Enter') {
      if (onRowSubmit && selectedIndex >= 0 && selectedIndex < itemCount) {
        e.preventDefault();
        onRowSubmit(selectedIndex);
      }
      return;
    }

    // Delete: Delete selected row safely
    if (e.key === 'Delete') {
      if (onRowDelete && selectedIndex >= 0 && selectedIndex < itemCount) {
        e.preventDefault();
        onRowDelete(selectedIndex);
      }
      return;
    }
  }, [
    itemCount,
    selectedIndex,
    onSelectIndex,
    isPaginated,
    currentPage,
    totalPages,
    onPageChange,
    pageJumpSize,
    onRowSubmit,
    onRowDelete,
    playNavSound
  ]);

  // When parent triggers onPageChange with targetRow
  const handlePageChange = useCallback((newPage: number, targetRow?: 'first' | 'last') => {
    if (targetRow) {
      pendingFocusTargetRef.current = targetRow;
    }
    if (onPageChange) {
      onPageChange(newPage, targetRow);
    }
  }, [onPageChange]);

  // Whenever currentPage changes, if there was a pending targetRow, focus it
  useEffect(() => {
    if (pendingFocusTargetRef.current) {
      const target = pendingFocusTargetRef.current;
      pendingFocusTargetRef.current = null;
      setTimeout(() => {
        focusTable(target);
      }, 30);
    }
  }, [currentPage, focusTable]);

  // Keep focused row ALWAYS visible on screen whenever selectedIndex changes (instant zero-lag auto scroll)
  useEffect(() => {
    if (selectedIndex < 0 || itemCount === 0) return;

    const scrollSelectedRow = () => {
      // 1. Try finding row element by exact table row ID: `${tableId}-row-${selectedIndex}`
      const elById = document.getElementById(`${tableId}-row-${selectedIndex}`);
      if (elById) {
        elById.scrollIntoView({ block: 'nearest', behavior: 'auto' });
        if (
          document.activeElement !== elById &&
          !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName || '')
        ) {
          elById.focus({ preventScroll: true });
        }
        return;
      }

      // 2. Try finding row in table container
      const container = tableContainerRef?.current || document.getElementById(`${tableId}-wrapper`);
      if (container) {
        const rows = container.querySelectorAll('tbody tr, .mac-table-row, [role="row"]');
        if (rows && rows[selectedIndex]) {
          const rowEl = rows[selectedIndex] as HTMLElement;
          rowEl.scrollIntoView({ block: 'nearest', behavior: 'auto' });
          if (
            document.activeElement !== rowEl &&
            !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName || '')
          ) {
            rowEl.focus({ preventScroll: true });
          }
          return;
        }

        // 3. Fallback: search for row with selected class
        const activeRow = container.querySelector('.selected, [aria-selected="true"], [data-row-selected="true"]') as HTMLElement | null;
        if (activeRow) {
          activeRow.scrollIntoView({ block: 'nearest', behavior: 'auto' });
        }
      }
    };

    scrollSelectedRow();
  }, [selectedIndex, tableId, itemCount, tableContainerRef]);

  return {
    handleKeyDown,
    handlePageChange,
    focusTable,
    focusNextPageBtn,
    focusPrevPageBtn,
    paginationIdPrefix
  };
}

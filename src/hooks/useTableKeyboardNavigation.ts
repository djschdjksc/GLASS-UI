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

  // Focus table container or specific row
  const focusTable = useCallback((targetRow?: 'first' | 'last') => {
    if (tableContainerRef?.current) {
      tableContainerRef.current.focus();
    } else {
      const el = document.getElementById(`${tableId}-wrapper`);
      if (el) el.focus();
    }
    if (targetRow === 'first') {
      onSelectIndex(0);
    } else if (targetRow === 'last' && itemCount > 0) {
      onSelectIndex(itemCount - 1);
    }
  }, [tableContainerRef, tableId, onSelectIndex, itemCount]);

  // Focus Next Page button
  const focusNextPageBtn = useCallback(() => {
    const nextBtn = document.getElementById(`${paginationIdPrefix}-next`) as HTMLButtonElement | null;
    if (nextBtn && !nextBtn.disabled) {
      nextBtn.focus();
      macAudio.playPop();
      return true;
    }
    return false;
  }, [paginationIdPrefix]);

  // Focus Previous Page button
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
    if (itemCount === 0) return;

    // Arrow Down
    if (e.key === 'ArrowDown') {
      if (selectedIndex < itemCount - 1) {
        e.preventDefault();
        onSelectIndex(selectedIndex + 1);
        macAudio.playHover();
      } else if (selectedIndex === itemCount - 1) {
        // Last row reached: auto focus Next Page button if available
        if (isPaginated && currentPage < totalPages) {
          e.preventDefault();
          focusNextPageBtn();
        }
      }
      return;
    }

    // Arrow Up
    if (e.key === 'ArrowUp') {
      if (selectedIndex > 0) {
        e.preventDefault();
        onSelectIndex(selectedIndex - 1);
        macAudio.playHover();
      } else if (selectedIndex === 0) {
        // First row reached: auto focus Previous Page button if available
        if (isPaginated && currentPage > 1) {
          e.preventDefault();
          focusPrevPageBtn();
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
      macAudio.playHover();
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
      macAudio.playHover();
      return;
    }

    // Home: First row of table
    if (e.key === 'Home') {
      e.preventDefault();
      onSelectIndex(0);
      macAudio.playHover();
      return;
    }

    // End: Last row of table
    if (e.key === 'End') {
      e.preventDefault();
      onSelectIndex(itemCount - 1);
      macAudio.playHover();
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

    // Delete: Delete selected row
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
    pageJumpSize,
    focusNextPageBtn,
    focusPrevPageBtn,
    onRowSubmit,
    onRowDelete
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
      }, 50);
    }
  }, [currentPage, focusTable]);

  // Keep focused row ALWAYS visible on screen whenever selectedIndex changes!
  useEffect(() => {
    if (selectedIndex < 0 || itemCount === 0) return;

    const scrollSelectedRow = () => {
      // 1. Try finding row element by exact table row ID: `${tableId}-row-${selectedIndex}`
      const elById = document.getElementById(`${tableId}-row-${selectedIndex}`);
      if (elById) {
        elById.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        return;
      }

      // 2. Try finding row in table container
      const container = tableContainerRef?.current || document.getElementById(`${tableId}-wrapper`);
      if (container) {
        const rows = container.querySelectorAll('tbody tr, .mac-table-row, [role="row"]');
        if (rows && rows[selectedIndex]) {
          (rows[selectedIndex] as HTMLElement).scrollIntoView({ block: 'nearest', behavior: 'smooth' });
          return;
        }

        // 3. Fallback: search for row with selected class
        const activeRow = container.querySelector('.selected, [aria-selected="true"], [data-row-selected="true"]') as HTMLElement | null;
        if (activeRow) {
          activeRow.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
      }
    };

    scrollSelectedRow();
    const timer = setTimeout(scrollSelectedRow, 30);
    return () => clearTimeout(timer);
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

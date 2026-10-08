import { ControlPanelView } from './ControlPanelView';
import { SettingsTabView } from './SettingsTabView';
import { StockInventoryView } from './StockInventoryView';
import { ShadcnDashboardView } from './ShadcnDashboardView';
import { LedgerTabView } from './LedgerTabView';
import { EquationTabView } from './EquationTabView';

import { CosmicSearchInput } from './common/CosmicSearchInput';
import { AnimatedCounter } from './common/AnimatedCounter';
import { Select as ShadcnSelect, Button as ShadcnButton, Input as ShadcnInput, Pagination as ShadcnPagination, Tooltip, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from './ui/shadcn';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import type { NavKey } from '../types';
import { macAudio } from '../utils/macAudio';
import { extractSizeFromColLabel } from '../utils/mouldUtils';
import { useDatabase } from '../context/DatabaseContext';
import { useSettings } from '../context/SettingsContext';
import type { BillRecord, PartyRecord } from '../services/db/schema';
import {
  Printer,
  Eye,
  Download,
  Plus,
  ArrowRight,
  RefreshCw,
  Image as ImageIcon,
  Palette,
  SlidersHorizontal,
  ExternalLink,
  Search,
  Phone,
  MapPin,
  Building,
  Trash2,
  Check,
  X,
  FileText,
  UserPlus,
  Edit3,
  Copy,
  ChevronLeft,
  ChevronRight,
  Hash,
  RotateCcw,
  ShoppingCart,
  Truck,
  ShoppingBag,
  History,
  Package,
  Layers,
  FileSpreadsheet,
  Grid,
  List,
  MessageCircle
} from 'lucide-react';
import { IosSegmentedTabs } from './common/IosSegmentedTabs';
import { downloadCSV } from '../utils/exportCsv';
import { formatBillNumber } from '../utils/billDocTypes';
import { ExcelCsvActions, type CsvColumnDef } from './common/ExcelCsvActions';
import { BillPrintModal } from './BillPrintModal';
import UnsavedChangesModal from './UnsavedChangesModal';
import { LockScreenStack } from './LockScreenStack';
import { PartyDetailStackModal } from './PartyDetailStackModal';
import { BillAuditHistoryModal } from './BillAuditHistoryModal';

interface Props {
  activeTab: NavKey;
  onBackToBill: () => void;
  onLoadBillToEditor?: (bill: any) => void;
  onSelectPartyForBill?: (partyName: string) => void;
  themeMode?: 'dark' | 'glass';
  onChangeThemeMode?: (m: 'dark' | 'glass') => void;
  bgType?: 'image' | 'color' | 'video';
  onChangeBgType?: (t: 'image' | 'color' | 'video') => void;
  bgImage: string;
  onSelectBgImage: (url: string) => void;
  bgVideo?: string;
  onSelectBgVideo?: (url: string) => void;
  bgColor?: string;
  onChangeBgColor?: (c: string) => void;
  blurAmount: number;
  onChangeBlur: (val: number) => void;
  overlayOpacity: number;
  onChangeOpacity: (val: number) => void;
  glassOpacity: number;
  onChangeGlassOpacity: (val: number) => void;
  rowHeight?: number;
  onSetRowHeight?: (h: number) => void;
  tableFontSize?: number;
  onSetTableFontSize?: (s: number) => void;
  onOpenUserProfile?: () => void;
  onSelectTab?: (tab: NavKey) => void;
}

interface AllTableCols {
  f2Raw: { index: number; name: number; partyCode?: number; qty: number; uCap: number; lCap: number };
  f2Finished: { index: number; mould: number; qty: number; price: number; total: number };
  f3Matrix: { mouldName: number; stdWt: number; uCapRatio: number; lCapRatio: number; recoveryRate: number };
  f4Raw: { code: number; name: number; unit: number; stock: number; reorder: number; rate: number; supplier: number };
  f4Moulds: { code: number; name: number; cavities: number; cycleSec: number; maxTemp: number; status: number };
  f4Sales: { bill: number; date: number; item: number; qty: number; price: number; total: number; party: number };
  f5Parties: {
    index: number;
    name: number;
    phone: number;
    station: number;
    district: number;
    state: number;
    pincode: number;
    bills: number;
    balance: number;
  };
  f8Stock: { code: number; name: number; qty: number; rack: number; status: number };
  f9Ledger: { date: number; type: number; voucher: number; particulars: number; debit: number; credit: number; balance: number };
}

const DEFAULT_ALL_COLS: AllTableCols = {
  f2Raw: { index: 38, name: 180, partyCode: 120, qty: 65, uCap: 65, lCap: 65 },
  f2Finished: { index: 38, mould: 220, qty: 60, price: 80, total: 95 },
  f3Matrix: { mouldName: 200, stdWt: 90, uCapRatio: 80, lCapRatio: 80, recoveryRate: 85 },
  f4Raw: { code: 80, name: 220, unit: 60, stock: 100, reorder: 100, rate: 100, supplier: 180 },
  f4Moulds: { code: 80, name: 220, cavities: 80, cycleSec: 90, maxTemp: 90, status: 90 },
  f4Sales: { bill: 75, date: 90, item: 220, qty: 60, price: 90, total: 110, party: 180 },
  f5Parties: { index: 45, name: 240, phone: 135, station: 120, district: 120, state: 100, pincode: 85, bills: 70, balance: 100 },
  f8Stock: { code: 85, name: 240, qty: 85, rack: 85, status: 95 },
  f9Ledger: { date: 95, type: 100, voucher: 95, particulars: 260, debit: 110, credit: 110, balance: 130 }
};

export const OtherTabsView: React.FC<Props> = ({
  activeTab,
  onBackToBill,
  onLoadBillToEditor,
  onSelectPartyForBill,
  themeMode = 'dark',
  onChangeThemeMode,
  bgType,
  onChangeBgType,
  bgImage,
  onSelectBgImage,
  bgVideo,
  onSelectBgVideo,
  bgColor,
  onChangeBgColor,
  blurAmount,
  onChangeBlur,
  overlayOpacity,
  onChangeOpacity,
  glassOpacity,
  onChangeGlassOpacity,
  rowHeight: propRowHeight,
  onSetRowHeight,
  tableFontSize: _propTableFontSize,
  onSetTableFontSize: _onSetTableFontSize,
  onOpenUserProfile,
  onSelectTab
}) => {
  // Live reactive Database Context
  const { bills, parties, stockItems, ledgerEntries, saveParty, deleteParty, deleteBill } = useDatabase();
  const { rowHeightPx } = useSettings();

  const activeRowHeight = propRowHeight || rowHeightPx || 28;

  // Persistent Table Column Widths for all tabs
  const [tableCols, setTableCols] = useState<AllTableCols>(() => {
    try {
      const saved = localStorage.getItem('modern_all_table_cols');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_ALL_COLS,
          ...parsed,
          f2Raw: { ...DEFAULT_ALL_COLS.f2Raw, ...(parsed.f2Raw || {}) },
          f2Finished: { ...DEFAULT_ALL_COLS.f2Finished, ...(parsed.f2Finished || {}) },
          f3Matrix: { ...DEFAULT_ALL_COLS.f3Matrix, ...(parsed.f3Matrix || {}) },
          f4Raw: { ...DEFAULT_ALL_COLS.f4Raw, ...(parsed.f4Raw || {}) },
          f4Moulds: { ...DEFAULT_ALL_COLS.f4Moulds, ...(parsed.f4Moulds || {}) },
          f4Sales: { ...DEFAULT_ALL_COLS.f4Sales, ...(parsed.f4Sales || {}) },
          f5Parties: { ...DEFAULT_ALL_COLS.f5Parties, ...(parsed.f5Parties || {}) },
          f8Stock: { ...DEFAULT_ALL_COLS.f8Stock, ...(parsed.f8Stock || {}) },
          f9Ledger: { ...DEFAULT_ALL_COLS.f9Ledger, ...(parsed.f9Ledger || {}) }
        };
      }
    } catch {}
    return DEFAULT_ALL_COLS;
  });

  const startResizeCol = <T extends keyof AllTableCols>(
    tableKey: T,
    colKey: keyof AllTableCols[T],
    e: React.MouseEvent
  ) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startW = (tableCols[tableKey] as any)[colKey] || 80;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientX - startX;
      const newWidth = Math.max(32, startW + delta);
      setTableCols(prev => {
        const updatedTable = { ...prev[tableKey], [colKey]: newWidth };
        const nextCols = { ...prev, [tableKey]: updatedTable };
        try {
          localStorage.setItem('modern_all_table_cols', JSON.stringify(nextCols));
        } catch {}
        return nextCols;
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

  const handleRowResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const startY = e.clientY;
    const startH = activeRowHeight;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaY = moveEvent.clientY - startY;
      const nextH = Math.max(20, Math.min(65, Math.round(startH + deltaY)));
      if (onSetRowHeight) {
        onSetRowHeight(nextH);
      }
      try {
        localStorage.setItem('modern_app_row_height', JSON.stringify(nextH));
      } catch {}
    };

    const onMouseUp = () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = 'text';
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // 4 Sub-Tabs for Bill History: SALE, SALE RETURN, ORDER, PURCHASE
  const [historySubTab, setHistorySubTab] = useState<'SALE' | 'SALE_RETURN' | 'ORDER' | 'PURCHASE'>('SALE');

  // Search query for invoices in F2 tab
  const [billSearchQuery, setBillSearchQuery] = useState('');

  const matchesHistoryCategory = (b: BillRecord, cat: 'SALE' | 'SALE_RETURN' | 'ORDER' | 'PURCHASE'): boolean => {
    const doc = (b.docType || '').toUpperCase().trim();
    const type = (b.typeSelection || '').toUpperCase().trim();

    if (cat === 'SALE_RETURN') {
      return doc.includes('RETURN') || doc.includes('CREDIT') || type.includes('RETURN');
    }
    if (cat === 'ORDER') {
      return doc.includes('ORDER') || doc.includes('QUOTATION') || type.includes('ORDER');
    }
    if (cat === 'PURCHASE') {
      return doc.includes('PURCHASE') || doc.includes('INWARD') || type.includes('PURCHASE');
    }
    // SALE: Default for regular sale bills
    return !doc.includes('RETURN') && !doc.includes('CREDIT') &&
           !doc.includes('ORDER') && !doc.includes('QUOTATION') &&
           !doc.includes('PURCHASE') && !doc.includes('INWARD') &&
           !type.includes('RETURN') && !type.includes('ORDER') && !type.includes('PURCHASE');
  };

  // Counts for each of the 4 categories
  const categoryCounts = useMemo(() => {
    let sale = 0, saleReturn = 0, order = 0, purchase = 0;
    bills.forEach(b => {
      if (matchesHistoryCategory(b, 'SALE_RETURN')) saleReturn++;
      else if (matchesHistoryCategory(b, 'ORDER')) order++;
      else if (matchesHistoryCategory(b, 'PURCHASE')) purchase++;
      else sale++;
    });
    return { SALE: sale, SALE_RETURN: saleReturn, ORDER: order, PURCHASE: purchase };
  }, [bills]);

  // Bills filtered by active sub-tab category
  const categoryBills = useMemo(() => {
    return bills.filter(b => matchesHistoryCategory(b, historySubTab));
  }, [bills, historySubTab]);

  const filteredBills = useMemo(() => {
    const rawQ = billSearchQuery.trim();
    if (!rawQ) return categoryBills;
    const cleanNum = rawQ.replace(/^(bill|slip|#)\s*/i, '').trim();
    const qLower = cleanNum.toLowerCase();
    const onlyDigits = cleanNum.replace(/\D/g, '');
    return categoryBills.filter(b => {
      const formatted = formatBillNumber(b.token).toLowerCase();
      const rawToken = String(b.token || '').toLowerCase();
      const tokenDigits = rawToken.replace(/\D/g, '');
      return (
        b.token === cleanNum ||
        rawToken.includes(qLower) ||
        formatted.includes(qLower) ||
        (onlyDigits && tokenDigits === onlyDigits) ||
        b.party.toLowerCase().includes(rawQ.toLowerCase()) ||
        b.date.includes(rawQ)
      );
    });
  }, [categoryBills, billSearchQuery]);

  // Selected Bill Id tracking
  const [selectedBillId, setSelectedBillId] = useState<string>('');
  const topBillId = filteredBills[0]?.id;
  const prevTopBillIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (filteredBills.length > 0) {
      // If a brand new bill was saved to the top of the list, automatically select it
      if (prevTopBillIdRef.current && prevTopBillIdRef.current !== topBillId) {
        setSelectedBillId(topBillId);
      } else {
        const exists = filteredBills.some(b => b.id === selectedBillId);
        if (!exists) {
          setSelectedBillId(filteredBills[0].id);
        }
      }
      prevTopBillIdRef.current = topBillId;
    } else {
      setSelectedBillId('');
      prevTopBillIdRef.current = null;
    }
  }, [historySubTab, categoryBills, billSearchQuery, filteredBills, topBillId]);

  const selectedBill = (selectedBillId ? filteredBills.find(b => b.id === selectedBillId) : null) || filteredBills[0] || categoryBills[0] || {
    id: 'empty',
    token: '0',
    date: new Date().toISOString().split('T')[0],
    party: `No ${historySubTab.replace('_', ' ')} Invoices`,
    docType: historySubTab === 'SALE_RETURN' ? 'RETURN' : historySubTab === 'ORDER' ? 'ORDER' : historySubTab === 'PURCHASE' ? 'PURCHASE' : 'SALE BILL',
    vehicle: '-',
    typeSelection: 'WHOLESALE',
    total: 0,
    status: 'PAID' as const,
    rawItems: [],
    finishedItems: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    synced: true,
    version: 1
  };

  // Active focus area in F2 for full keyboard navigation: 'bills' | 'raw' | 'finished'
  const [f2FocusArea, setF2FocusArea] = useState<'bills' | 'raw' | 'finished'>('bills');
  const [selectedRawRowIdx, setSelectedRawRowIdx] = useState<number>(0);
  const [selectedFinishedRowIdx, setSelectedFinishedRowIdx] = useState<number>(0);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState<boolean>(false);
  const [deleteConfirmBillId, setDeleteConfirmBillId] = useState<string | null>(null);

  // Throttle timer ref for smooth arrow navigation without lag
  const lastBillArrowTimeRef = useRef<number>(0);

  // Refs for auto-scrolling
  const billsListRef = useRef<HTMLDivElement>(null);
  const billItemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const rawRowRefs = useRef<(HTMLTableRowElement | null)[]>([]);
  const finishedRowRefs = useRef<(HTMLTableRowElement | null)[]>([]);
  const autoScrollTimerRef = useRef<number | null>(null);

  // Auto-scroll selected bill into view
  useEffect(() => {
    if (activeTab === 'F2') {
      const idx = filteredBills.findIndex(b => b.id === selectedBill.id);
      if (idx >= 0 && billItemRefs.current[idx]) {
        billItemRefs.current[idx]?.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth'
        });
      }
    }
  }, [selectedBill.id, filteredBills, activeTab]);

  // Auto-scroll selected raw row into view
  useEffect(() => {
    if (activeTab === 'F2' && f2FocusArea === 'raw' && rawRowRefs.current[selectedRawRowIdx]) {
      rawRowRefs.current[selectedRawRowIdx]?.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth'
      });
    }
  }, [selectedRawRowIdx, f2FocusArea, activeTab]);

  // Auto-scroll selected finished row into view
  useEffect(() => {
    if (activeTab === 'F2' && f2FocusArea === 'finished' && finishedRowRefs.current[selectedFinishedRowIdx]) {
      finishedRowRefs.current[selectedFinishedRowIdx]?.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth'
      });
    }
  }, [selectedFinishedRowIdx, f2FocusArea, activeTab]);

  // Stop edge hover auto-scroll
  const stopAutoScroll = () => {
    if (autoScrollTimerRef.current !== null) {
      cancelAnimationFrame(autoScrollTimerRef.current);
      autoScrollTimerRef.current = null;
    }
  };

  // Dynamic Real-time iOS Bottom Stack & Crawl Physics while scrolling
  const updateCardStackEffects = useCallback(() => {
    const container = billsListRef.current;
    if (!container) return;
    const containerRect = container.getBoundingClientRect();
    const H = containerRect.height;
    if (H <= 0) return;

    billItemRefs.current.forEach((el) => {
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const distFromBottom = rect.bottom - containerRect.bottom;

      if (distFromBottom <= 2) {
        // Fully inside view — normal full size card
        el.style.transform = 'translateY(0px) scale(1)';
        el.style.opacity = '1';
        el.style.zIndex = '1';
        el.style.filter = 'none';
      } else {
        // At or crossing bottom edge — smoothly stack & crawl!
        const cardH = rect.height || 68;
        const rel = distFromBottom / cardH;
        const step = Math.min(rel, 3.5);

        const translateY = -step * 16;
        const scale = Math.max(0.85, 1 - step * 0.05);
        const opacity = Math.max(0.18, 1 - step * 0.22);
        const zIndex = Math.max(1, 100 - Math.round(step * 10));

        el.style.transform = `translateY(${translateY}px) scale(${scale})`;
        el.style.opacity = String(opacity);
        el.style.zIndex = String(zIndex);
        el.style.filter = 'none'; // NEVER BLUR! 100% Crisp
      }
    });
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      updateCardStackEffects();
    }, 60);
    return () => clearTimeout(timer);
  }, [filteredBills, updateCardStackEffects]);

  // Continuous auto-scrolling when hovering near top/bottom of saved invoices list
  const handleBillsMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const container = billsListRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const mouseY = e.clientY - rect.top;
    const containerHeight = rect.height;
    const threshold = 65; // px from top or bottom edge

    stopAutoScroll();

    if (mouseY > containerHeight - threshold && mouseY <= containerHeight) {
      // Mouse is near bottom: scroll container down (reveals bottom items, data scrolls up)
      const ratio = (mouseY - (containerHeight - threshold)) / threshold;
      const step = Math.max(2, Math.round(ratio * 15));
      const stepScroll = () => {
        if (container) {
          container.scrollTop += step;
          updateCardStackEffects();
          autoScrollTimerRef.current = requestAnimationFrame(stepScroll);
        }
      };
      autoScrollTimerRef.current = requestAnimationFrame(stepScroll);
    } else if (mouseY < threshold && mouseY >= 0) {
      // Mouse is near top: scroll container up (reveals top items, data scrolls down)
      const ratio = (threshold - mouseY) / threshold;
      const step = Math.max(2, Math.round(ratio * 15));
      const stepScroll = () => {
        if (container) {
          container.scrollTop -= step;
          updateCardStackEffects();
          autoScrollTimerRef.current = requestAnimationFrame(stepScroll);
        }
      };
      autoScrollTimerRef.current = requestAnimationFrame(stepScroll);
    }
  };

  const handleBillsMouseLeave = () => {
    stopAutoScroll();
  };

  useEffect(() => {
    return () => {
      stopAutoScroll();
    };
  }, []);

  // Global Keyboard Navigation (Arrow keys: Up, Down, Left, Right & Enter)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (activeTab === 'F2') {
        // Quick Category Switch via Alt+1, Alt+2, Alt+3, Alt+4
        if (e.altKey && (e.key === '1' || e.key === '2' || e.key === '3' || e.key === '4')) {
          e.preventDefault();
          macAudio.playClick();
          if (e.key === '1') setHistorySubTab('SALE');
          else if (e.key === '2') setHistorySubTab('SALE_RETURN');
          else if (e.key === '3') setHistorySubTab('ORDER');
          else if (e.key === '4') setHistorySubTab('PURCHASE');
          return;
        }

        // Arrow Navigation between Columns (Left / Right)
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          macAudio.playHover();
          if (f2FocusArea === 'bills') setF2FocusArea('raw');
          else if (f2FocusArea === 'raw') setF2FocusArea('finished');
          return;
        }
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          macAudio.playHover();
          if (f2FocusArea === 'finished') setF2FocusArea('raw');
          else if (f2FocusArea === 'raw') setF2FocusArea('bills');
          return;
        }

        // Arrow Navigation inside active column (Up / Down)
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          if (f2FocusArea === 'bills') {
            const now = performance.now();
            if (now - lastBillArrowTimeRef.current < 110) return;
            lastBillArrowTimeRef.current = now;
            macAudio.playHover();
            const currentIdx = filteredBills.findIndex(b => b.id === selectedBill.id);
            if (currentIdx >= 0 && currentIdx + 1 < filteredBills.length) {
              setSelectedBillId(filteredBills[currentIdx + 1].id);
            }
          } else if (f2FocusArea === 'raw') {
            macAudio.playHover();
            setSelectedRawRowIdx(prev => (prev + 1 < displayRawItems.length ? prev + 1 : prev));
          } else if (f2FocusArea === 'finished') {
            macAudio.playHover();
            setSelectedFinishedRowIdx(prev => (prev + 1 < displayFinishedItems.length ? prev + 1 : prev));
          }
          return;
        }

        if (e.key === 'ArrowUp') {
          e.preventDefault();
          if (f2FocusArea === 'bills') {
            const now = performance.now();
            if (now - lastBillArrowTimeRef.current < 110) return;
            lastBillArrowTimeRef.current = now;
            macAudio.playHover();
            const currentIdx = filteredBills.findIndex(b => b.id === selectedBill.id);
            if (currentIdx > 0) {
              setSelectedBillId(filteredBills[currentIdx - 1].id);
            }
          } else if (f2FocusArea === 'raw') {
            macAudio.playHover();
            setSelectedRawRowIdx(prev => (prev - 1 >= 0 ? prev - 1 : 0));
          } else if (f2FocusArea === 'finished') {
            macAudio.playHover();
            setSelectedFinishedRowIdx(prev => (prev - 1 >= 0 ? prev - 1 : 0));
          }
          return;
        }

        // Enter key to load bill into F1
        if (e.key === 'Enter') {
          e.preventDefault();
          macAudio.playClick();
          if (onLoadBillToEditor) {
            onLoadBillToEditor(selectedBill);
          } else {
            onBackToBill();
          }
          return;
        }

        // Delete key: open delete confirmation dialog for selected bill
        if (e.key === 'Delete' && selectedBill && selectedBill.id !== 'empty') {
          e.preventDefault();
          macAudio.playPop();
          setDeleteConfirmBillId(selectedBill.id);
          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, f2FocusArea, filteredBills, selectedBill, onLoadBillToEditor, onBackToBill]);

  // Universal Alt+1..4 Subtab Switch listener for Bill History (F2)
  useEffect(() => {
    const handleSubtabSwitch = (e: Event) => {
      if (activeTab !== 'F2') return;
      const custom = e as CustomEvent<{ index: number }>;
      const idx = custom.detail?.index;
      if (idx === 1) { macAudio.playClick(); setHistorySubTab('SALE'); }
      else if (idx === 2) { macAudio.playClick(); setHistorySubTab('SALE_RETURN'); }
      else if (idx === 3) { macAudio.playClick(); setHistorySubTab('ORDER'); }
      else if (idx === 4) { macAudio.playClick(); setHistorySubTab('PURCHASE'); }
    };
    window.addEventListener('app-subtab-switch', handleSubtabSwitch);
    return () => window.removeEventListener('app-subtab-switch', handleSubtabSwitch);
  }, [activeTab]);

  // Universal Action listeners for Bill History (F2)
  useEffect(() => {
    const handleUniversalPrint = () => {
      if (activeTab === 'F2' && selectedBill && selectedBill.id !== 'empty') {
        macAudio.playClick();
        setIsPrintModalOpen(true);
      }
    };

    const handleUniversalDelete = () => {
      if (activeTab === 'F2' && selectedBill && selectedBill.id !== 'empty') {
        macAudio.playPop();
        setDeleteConfirmBillId(selectedBill.id);
      }
    };

    const handleUniversalHome = () => {
      if (activeTab === 'F2') {
        setF2FocusArea('bills');
        const searchInput = document.querySelector<HTMLInputElement>('input[placeholder*="Search" i]');
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
      }
    };

    window.addEventListener('app-print', handleUniversalPrint);
    window.addEventListener('app-delete-row', handleUniversalDelete);
    window.addEventListener('app-home-focus', handleUniversalHome);

    return () => {
      window.removeEventListener('app-print', handleUniversalPrint);
      window.removeEventListener('app-delete-row', handleUniversalDelete);
      window.removeEventListener('app-home-focus', handleUniversalHome);
    };
  }, [activeTab, selectedBill]);

  // Discover and sort all size columns for the selected bill in Bill History (e.g. 12 FT -> 10 FT -> 9.5 FT)
  const f2AllSizeCols = useMemo(() => {
    const dynamicList = (selectedBill.dynamicCols && selectedBill.dynamicCols.length > 0)
      ? selectedBill.dynamicCols
      : (() => {
          const keys = new Set<string>();
          (selectedBill.rawItems || []).forEach(r => {
            Object.keys(r).forEach(k => {
              if (k !== 'id' && k !== 'name' && k !== 'qty' && k !== 'uCap' && k !== 'lCap') {
                keys.add(k);
              }
            });
          });
          return Array.from(keys).map(k => {
            const size = extractSizeFromColLabel(k);
            return { field: k, label: `${size} FT` };
          });
        })();

    const list = [
      { field: 'qty', label: '(10 FT)', size: 10, isBase: true },
      ...dynamicList.map(c => ({
        field: c.field,
        label: c.label || `${extractSizeFromColLabel(c.field)} FT`,
        size: extractSizeFromColLabel(c.label || c.field),
        isBase: false
      }))
    ];

    // Sort descending by size (e.g. 12 FT -> 10 FT -> 9.5 FT)
    return list.sort((a, b) => b.size - a.size);
  }, [selectedBill]);

  // Filter out any blank/unused padding rows so only actual recorded rows are shown in Bill History
  const displayRawItems = useMemo(() => {
    return (selectedBill.rawItems || []).filter(r => {
      const hasName = Boolean(r.name && r.name.trim() !== '');
      const hasQty = (Number(r.qty) || 0) > 0;
      const hasPartyCode = Boolean(r.partyCode && r.partyCode.trim() !== '');
      const hasDyn = f2AllSizeCols.some(sc => (Number((r as any)[sc.field]) || 0) > 0);
      const hasCaps = (Number(r.uCap) || 0) > 0 || (Number(r.lCap) || 0) > 0;
      return hasName || hasQty || hasPartyCode || hasDyn || hasCaps;
    });
  }, [selectedBill.rawItems, f2AllSizeCols]);

  const displayFinishedItems = useMemo(() => {
    return (selectedBill.finishedItems || []).filter(f => {
      const hasMould = Boolean(f.mould && f.mould.trim() !== '' && f.mould !== 'Mould Name' && f.mould !== '-');
      const hasQty = (Number(f.qty) || 0) > 0;
      const hasTotal = (Number(f.total) || 0) > 0;
      const hasPrice = (Number(f.price) || 0) > 0;
      return hasMould && (hasQty || hasTotal || hasPrice);
    });
  }, [selectedBill.finishedItems]);

  // Calculated totals for selected bill based on actual recorded items
  const totalRawQty = displayRawItems.reduce((acc, r) => acc + (r.qty || 0), 0);
  const totalRawUCap = displayRawItems.reduce((acc, r) => acc + (r.uCap || 0), 0);
  const totalRawLCap = displayRawItems.reduce((acc, r) => acc + (r.lCap || 0), 0);
  const totalFinishedQty = displayFinishedItems.reduce((acc, f) => acc + (f.qty || 0), 0);
  const totalFinishedAmount = displayFinishedItems.reduce((acc, f) => acc + (f.total || 0), 0);

  const grandTotalAllCols = useMemo(() => {
    let sum = 0;
    displayRawItems.forEach(r => {
      f2AllSizeCols.forEach(sc => {
        sum += (Number((r as any)[sc.field]) || 0);
      });
      sum += (Number(r.uCap) || 0);
      sum += (Number(r.lCap) || 0);
    });
    return sum;
  }, [displayRawItems, f2AllSizeCols]);

  const showPartyCode = Boolean(
    selectedBill.hasPartyCodeCol ||
    displayRawItems.some(r => r.partyCode && r.partyCode.trim() !== '')
  );

  // F3 Equation state
  const [selectedEqId, setSelectedEqId] = useState<string | null>('EQ-1');
  const [eqFormulas] = useState([
    { id: 'EQ-1', mouldName: 'Mould 14x20 Standard Housing', stdWt: 12.5, uCapRatio: 0.85, lCapRatio: 0.72, recoveryRate: 94.5 },
    { id: 'EQ-2', mouldName: 'Mould 18x24 Heavy Duty Base', stdWt: 24.0, uCapRatio: 0.88, lCapRatio: 0.75, recoveryRate: 92.0 },
    { id: 'EQ-3', mouldName: 'Die Core Cap 50mm Precision', stdWt: 4.8, uCapRatio: 0.90, lCapRatio: 0.80, recoveryRate: 96.2 },
    { id: 'EQ-4', mouldName: 'Heat Sink Fin Mount Extrusion', stdWt: 8.2, uCapRatio: 0.82, lCapRatio: 0.68, recoveryRate: 91.5 },
    { id: 'EQ-5', mouldName: 'Flange Coupling 120mm Alloy', stdWt: 16.5, uCapRatio: 0.86, lCapRatio: 0.74, recoveryRate: 93.8 }
  ]);
  const [calcInputKg, setCalcInputKg] = useState(100);
  const [calcUCap, setCalcUCap] = useState(85);
  const [calcLCap, setCalcLCap] = useState(72);
  const [calcDensity, setCalcDensity] = useState(2.7);

  // F4 Data Panel state
  const [dataTab, setDataTab] = useState<'RAW' | 'MOULDS' | 'SALES'>('SALES');
  const [selectedDataId, setSelectedDataId] = useState<string | null>('RAW-1');
  const [rawMaterials] = useState([
    { id: 'RAW-1', code: 'RM-101', name: 'Aluminium Ingot 6063 Grade', unit: 'KG', stock: 4500, reorder: 1000, rate: 215, supplier: 'Hindalco Industries' },
    { id: 'RAW-2', code: 'RM-102', name: 'Silicon Carbide Grain #80', unit: 'KG', stock: 850, reorder: 200, rate: 95, supplier: 'Carborundum Universal' },
    { id: 'RAW-3', code: 'RM-103', name: 'Hardener Rod H-88 Titanium', unit: 'PCS', stock: 1200, reorder: 300, rate: 450, supplier: 'Titan Alloys Corp' },
    { id: 'RAW-4', code: 'RM-104', name: 'Graphite Die Core 40mm', unit: 'PCS', stock: 320, reorder: 100, rate: 850, supplier: 'Graphite India Ltd' },
    { id: 'RAW-5', code: 'RM-105', name: 'Degasser Tablets A-Grade', unit: 'BOX', stock: 180, reorder: 50, rate: 620, supplier: 'Foseco India' }
  ]);
  const [mouldSpecs] = useState([
    { id: 'M-1', code: 'MLD-01', name: 'Mould 14x20 Standard Housing', cavities: 4, cycleSec: 45, maxTemp: 480, status: 'ACTIVE' },
    { id: 'M-2', code: 'MLD-02', name: 'Mould 18x24 Heavy Duty Base', cavities: 2, cycleSec: 65, maxTemp: 520, status: 'ACTIVE' },
    { id: 'M-3', code: 'MLD-03', name: 'Die Core Cap 50mm Precision', cavities: 8, cycleSec: 30, maxTemp: 460, status: 'MAINTENANCE' },
    { id: 'M-4', code: 'MLD-04', name: 'Heat Sink Fin Mount Extrusion', cavities: 6, cycleSec: 40, maxTemp: 490, status: 'ACTIVE' }
  ]);

  // F5 Party Directory state
  const [partySearchQuery, setPartySearchQuery] = useState('');
  const [partyCurrentPage, setPartyCurrentPage] = useState(1);
  const PARTIES_PER_PAGE = 80;
  const [selectedPartyId, setSelectedPartyId] = useState<string | null>('P-1');
  const [isEditingParty, setIsEditingParty] = useState(false);
  const [partyToast, setPartyToast] = useState<string | null>(null);
  const [partyToDelete, setPartyToDelete] = useState<{ id: string; name: string } | null>(null);
  const partyRowRefs = useRef<Record<string, HTMLTableRowElement | null>>({});

  // iPhone Cards vs Table View Mode ('cards' | 'table')
  const [partyViewMode, setPartyViewMode] = useState<'cards' | 'table'>(() => {
    try {
      return (localStorage.getItem('modern_party_view_mode') as 'cards' | 'table') || 'cards';
    } catch {
      return 'cards';
    }
  });

  const handleTogglePartyViewMode = (mode: 'cards' | 'table') => {
    macAudio.playClick();
    setPartyViewMode(mode);
    try {
      localStorage.setItem('modern_party_view_mode', mode);
    } catch {}
  };

  // iOS Stack Detail Modal State
  const [isPartyStackModalOpen, setIsPartyStackModalOpen] = useState(false);
  const [viewingPartyForStack, setViewingPartyForStack] = useState<PartyRecord | null>(null);

  const handleOpenPartyStack = (party: PartyRecord) => {
    macAudio.playPop();
    setViewingPartyForStack(party);
    setIsPartyStackModalOpen(true);
  };

  const [partyForm, setPartyForm] = useState({
    id: '',
    name: '',
    phone: '',
    station: '',
    district: '',
    state: '',
    pincode: '',
    gstin: '',
    balance: 0
  });

  const showPartyToast = (msg: string) => {
    setPartyToast(msg);
    setTimeout(() => setPartyToast(null), 3000);
  };

  const handleExportAllBillsCsv = () => {
    const headers = ['TOKEN', 'DATE', 'PARTY', 'DOC TYPE', 'VEHICLE', 'TOTAL AMOUNT', 'STATUS'];
    const rows = bills.map(b => [
      formatBillNumber(b.token),
      b.date,
      b.party,
      b.docType,
      b.vehicle || '',
      b.total || 0,
      b.status || 'PAID'
    ]);
    const ok = downloadCSV(`All_Bills_Archive_${Date.now()}`, headers, rows);
    if (ok) {
      macAudio.playSuccess();
      showPartyToast(`Exported ${bills.length} Bills in CSV (Excel format)!`);
    }
  };

  const handleExportSelectedBillCsv = () => {
    if (!selectedBill) return;
    const headers = ['SECTION', 'SR NO', 'ITEM / MOULD', 'QTY', 'PRICE', 'TOTAL'];
    const rows: (string | number)[][] = [];
    if (selectedBill.rawItems && selectedBill.rawItems.length > 0) {
      selectedBill.rawItems.forEach((r, idx) => {
        rows.push(['RAW ITEM', idx + 1, r.name || '', r.qty || 0, 0, 0]);
      });
    }
    if (selectedBill.finishedItems && selectedBill.finishedItems.length > 0) {
      selectedBill.finishedItems.forEach((f, idx) => {
        rows.push(['MOULD', idx + 1, f.mould || '', f.qty || 0, f.price || 0, f.total || 0]);
      });
    }
    const formattedToken = formatBillNumber(selectedBill.token);
    const ok = downloadCSV(`Bill_${formattedToken}_${(selectedBill.party || 'Customer').replace(/[^a-zA-Z0-9]/g, '_')}`, headers, rows);
    if (ok) {
      macAudio.playSuccess();
      showPartyToast(`Exported Bill #${formattedToken} in CSV (Excel format)!`);
    }
  };

  const handleExportPartiesCsv = () => {
    const headers = ['PARTY ID', 'NAME', 'PHONE', 'STATION', 'DISTRICT', 'STATE', 'PINCODE', 'BALANCE', 'TOTAL BILLS'];
    const rows = parties.map(p => {
      const stat = partyBillStats[p.name.trim().toLowerCase()] || { count: 0, total: 0 };
      return [
        p.id,
        p.name || '',
        p.phone || '',
        p.station || p.city || '',
        p.district || '',
        p.state || '',
        p.pincode || '',
        p.balance || 0,
        stat.count
      ];
    });
    const ok = downloadCSV(`Parties_Master_List_${Date.now()}`, headers, rows);
    if (ok) {
      macAudio.playSuccess();
      showPartyToast('Exported Parties List in CSV (Excel format)!');
    }
  };

  const handleExportEquationCsv = () => {
    const headers = ['MOULD NAME', 'STD WT', 'U-CAP RATIO', 'L-CAP RATIO', 'YIELD'];
    const rows = eqFormulas.map(eq => [
      eq.mouldName,
      eq.stdWt,
      eq.uCapRatio,
      eq.lCapRatio,
      eq.recoveryRate
    ]);
    const ok = downloadCSV(`Mould_Equations_${Date.now()}`, headers, rows);
    if (ok) {
      macAudio.playSuccess();
      showPartyToast('Exported Equations in CSV (Excel format)!');
    }
  };

  const handleExportStockCsv = () => {
    const headers = ['ITEM CODE', 'ITEM NAME', 'QTY', 'RACK LOCATION', 'STATUS'];
    const rows = stockItems.map(s => [
      s.code,
      s.name,
      s.qty,
      s.rack,
      s.status
    ]);
    const ok = downloadCSV(`Stock_Inventory_${Date.now()}`, headers, rows);
    if (ok) {
      macAudio.playSuccess();
      showPartyToast('Exported Stock Inventory in CSV (Excel format)!');
    }
  };

  const handleExportLedgerCsv = () => {
    const partyObj = parties.find(p => p.id === selectedLedgerParty);
    const headers = ['DATE', 'VOUCHER NO', 'PARTICULARS', 'DEBIT (DR)', 'CREDIT (CR)', 'BALANCE'];
    const rows = ledgerEntries.map(e => [
      e.date,
      e.voucher || '',
      e.particulars,
      e.debit || 0,
      e.credit || 0,
      e.balance || 0
    ]);
    const ok = downloadCSV(`Ledger_${(partyObj?.name || 'Party').replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}`, headers, rows);
    if (ok) {
      macAudio.playSuccess();
      showPartyToast('Exported Ledger Statement in CSV (Excel format)!');
    }
  };

  const [editingPartyId, setEditingPartyId] = useState<string | null>(null);
  const [inlinePartyDraft, setInlinePartyDraft] = useState<Partial<PartyRecord> | null>(null);

  // Bill stats per party (bill counts and total turnover)
  const partyBillStats = useMemo(() => {
    const stats: Record<string, { count: number; total: number }> = {};
    for (const b of bills) {
      const pName = (b.party || '').trim().toLowerCase();
      if (!pName) continue;
      if (!stats[pName]) {
        stats[pName] = { count: 0, total: 0 };
      }
      stats[pName].count += 1;
      stats[pName].total += (b.total || 0);
    }
    return stats;
  }, [bills]);

  // Filtered parties across name, phone, station, district, state, pincode, gstin - Stable persistent order
  const filteredParties = useMemo(() => {
    const q = partySearchQuery.trim().toLowerCase();
    if (!q) return parties;
    return parties.filter(p => {
      return (
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.phone && p.phone.toLowerCase().includes(q)) ||
        (p.station && p.station.toLowerCase().includes(q)) ||
        (p.district && p.district.toLowerCase().includes(q)) ||
        (p.state && p.state.toLowerCase().includes(q)) ||
        (p.pincode && p.pincode.toLowerCase().includes(q)) ||
        (p.gstin && p.gstin.toLowerCase().includes(q))
      );
    });
  }, [parties, partySearchQuery]);

  const totalPartyPages = Math.max(1, Math.ceil(filteredParties.length / PARTIES_PER_PAGE));
  const paginatedParties = useMemo(() => {
    const start = (partyCurrentPage - 1) * PARTIES_PER_PAGE;
    return filteredParties.slice(start, start + PARTIES_PER_PAGE);
  }, [filteredParties, partyCurrentPage]);

  // Selected party object
  const selectedParty = useMemo(() => {
    if (selectedPartyId) {
      const found = parties.find(p => p.id === selectedPartyId);
      if (found) return found;
    }
    return filteredParties[0] || parties[0] || null;
  }, [parties, selectedPartyId, filteredParties]);

  // CSV Columns definition for Parties Directory
  const partyCsvColumns: CsvColumnDef<PartyRecord>[] = useMemo(() => [
    { header: 'Party Name', key: 'name', sample: 'Sharma Aluminium Works', required: true },
    { header: 'Phone Number', key: 'phone', sample: '9876543210' },
    { header: 'Station / City', key: 'station', sample: 'Jaipur' },
    { header: 'District', key: 'district', sample: 'Jaipur' },
    { header: 'State', key: 'state', sample: 'Rajasthan' },
    { header: 'Pincode', key: 'pincode', sample: '302001' },
    { header: 'GSTIN', key: 'gstin', sample: '08AAAAA0000A1Z5' },
    {
      header: 'Opening Balance',
      key: 'balance',
      sample: 0,
      formatter: (val) => Number(val || 0).toLocaleString('en-IN'),
      parser: (raw) => Number(String(raw).replace(/[^0-9.-]/g, '')) || 0
    }
  ], []);

  // Universal CSV/Excel import for Parties Directory
  const handleImportParties = useCallback(async (imported: Partial<PartyRecord>[]) => {
    let count = 0;
    for (const row of imported) {
      if (!row.name || !row.name.trim()) continue;
      const cleanName = row.name.trim();
      const existing = parties.find(p => p.name.trim().toLowerCase() === cleanName.toLowerCase());
      const cleanCity = row.station ? String(row.station).trim() : (row.city ? String(row.city).trim() : (existing?.city || ''));
      const pRecord: PartyRecord = {
        id: existing ? existing.id : `P-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        name: cleanName,
        contact: cleanName,
        phone: row.phone ? String(row.phone).trim() : (existing?.phone || ''),
        city: cleanCity,
        station: cleanCity,
        district: row.district ? String(row.district).trim() : (existing?.district || ''),
        state: row.state ? String(row.state).trim() : (existing?.state || ''),
        pincode: row.pincode ? String(row.pincode).trim() : (existing?.pincode || ''),
        gstin: row.gstin ? String(row.gstin).trim() : (existing?.gstin || ''),
        balance: row.balance !== undefined ? Number(row.balance) || 0 : (existing?.balance || 0),
        limit: (row as any).creditLimit !== undefined ? Number((row as any).creditLimit) || 0 : (existing?.limit || 0),
        updatedAt: Date.now(),
        synced: false
      };
      await saveParty(pRecord);
      count++;
    }
    showPartyToast(`Successfully imported ${count} parties!`);
  }, [parties, saveParty]);

  const lastSoundRef = useRef<number>(0);
  const playNavSound = () => {
    const now = performance.now();
    if (now - lastSoundRef.current > 45) {
      lastSoundRef.current = now;
      macAudio.playHover();
    }
  };

  const startInlineEdit = useCallback((party: PartyRecord, fieldToFocus = 'name') => {
    macAudio.playClick();
    setEditingPartyId(party.id);
    setInlinePartyDraft({ ...party });
    setTimeout(() => {
      const rowEl = partyRowRefs.current[party.id] || document.getElementById(`party-row-${party.id}`);
      const input = (rowEl?.querySelector(`input[data-field="${fieldToFocus}"]`) || rowEl?.querySelector('input')) as HTMLInputElement | null;
      if (input) {
        input.focus();
        input.select();
      }
    }, 35);
  }, []);

  const handleCommitInlineParty = useCallback(async (targetId?: string) => {
    const idToSave = targetId || editingPartyId;
    if (!idToSave || !inlinePartyDraft) {
      setEditingPartyId(null);
      setInlinePartyDraft(null);
      return;
    }
    const original = parties.find(p => p.id === idToSave);
    if (!original) {
      setEditingPartyId(null);
      setInlinePartyDraft(null);
      return;
    }
    const finalRecord: PartyRecord = {
      ...original,
      ...inlinePartyDraft,
      name: (inlinePartyDraft.name !== undefined ? inlinePartyDraft.name : (original.name || '')).trim() || original.name || 'NEW PARTY',
      updatedAt: Date.now()
    };
    await saveParty(finalRecord);
    setEditingPartyId(null);
    setInlinePartyDraft(null);
    macAudio.playSuccess();
  }, [editingPartyId, inlinePartyDraft, parties, saveParty]);

  const handleCancelInlineParty = useCallback(() => {
    setEditingPartyId(null);
    setInlinePartyDraft(null);
  }, []);

  const handleDraftChange = useCallback((field: keyof PartyRecord, value: any) => {
    setInlinePartyDraft(prev => (prev ? { ...prev, [field]: value } : { [field]: value }));
  }, []);

  const handleStartNewParty = useCallback(async () => {
    const newId = `P-${Date.now()}`;
    const newRecord: PartyRecord = {
      id: newId,
      name: '',
      phone: '',
      station: '',
      district: '',
      state: '',
      pincode: '',
      city: '',
      contact: '',
      balance: 0,
      limit: 500000,
      gstin: '',
      updatedAt: Date.now(),
      synced: false
    };
    // Clear search so new row at index 0 of Page 1 is immediately visible!
    setPartySearchQuery('');
    setPartyCurrentPage(1);
    setSelectedPartyId(newId);
    await saveParty(newRecord);
    startInlineEdit(newRecord, 'name');
    macAudio.playSuccess();
  }, [saveParty, startInlineEdit]);

  // Sync refs for high-speed zero-lag keyboard navigation without remounting event listeners
  const paginatedPartiesRef = useRef(paginatedParties);
  paginatedPartiesRef.current = paginatedParties;
  const filteredPartiesRef = useRef(filteredParties);
  filteredPartiesRef.current = filteredParties;
  const partyCurrentPageRef = useRef(partyCurrentPage);
  partyCurrentPageRef.current = partyCurrentPage;
  const totalPartyPagesRef = useRef(totalPartyPages);
  totalPartyPagesRef.current = totalPartyPages;
  const selectedPartyIdRef = useRef(selectedPartyId);
  selectedPartyIdRef.current = selectedPartyId;
  const editingPartyIdRef = useRef(editingPartyId);
  editingPartyIdRef.current = editingPartyId;

  // F5 Keyboard Navigation (Enter to edit/save, Delete key to delete row, Arrow keys to navigate)
  useEffect(() => {
    if (activeTab !== 'F5') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // NumLock and Clear guards: never delete or disrupt UI
      if (e.key === 'NumLock' || e.code === 'NumLock' || e.key === 'Clear') {
        return;
      }

      const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName);

      if (isInput) {
        if (e.key === 'Delete' || e.key === 'Backspace') {
          return;
        }

        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
          e.preventDefault();
          handleCommitInlineParty();
          return;
        }

        if (e.key === 'ArrowRight') {
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
                playNavSound();
                inputs[currIdx + 1].focus();
                if ('select' in inputs[currIdx + 1]) (inputs[currIdx + 1] as HTMLInputElement).select();
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
                playNavSound();
                inputs[currIdx - 1].focus();
                if ('select' in inputs[currIdx - 1]) (inputs[currIdx - 1] as HTMLInputElement).select();
                return;
              }
            }
          }
        } else if (e.key === 'Enter') {
          e.preventDefault();
          const target = e.target as HTMLElement;
          const row = target.closest('tr');
          if (row) {
            const inputs = Array.from(row.querySelectorAll('input:not([disabled]), select:not([disabled])')) as (HTMLInputElement | HTMLSelectElement)[];
            const currIdx = inputs.indexOf(target as any);
            if (currIdx >= 0 && currIdx < inputs.length - 1) {
              playNavSound();
              inputs[currIdx + 1].focus();
              if ('select' in inputs[currIdx + 1]) {
                (inputs[currIdx + 1] as HTMLInputElement).select();
              }
              return;
            }
          }
          // Reached last cell of row -> finish / save editing!
          handleCommitInlineParty();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          e.stopPropagation();
          handleCancelInlineParty();
        }
        return;
      }

      // Escape: Cancel selection / edit mode
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        handleCancelInlineParty();
        setSelectedPartyId(null);
        return;
      }

      const currentList = paginatedPartiesRef.current;
      if (currentList.length === 0) return;
      const curId = selectedPartyIdRef.current;
      const currentIndex = currentList.findIndex(p => p.id === curId);

      // Enter key on selected row: start inline editing party name immediately!
      if (e.key === 'Enter') {
        e.preventDefault();
        if (curId) {
          const target = currentList.find(p => p.id === curId);
          if (target) {
            startInlineEdit(target, 'name');
          }
        } else if (currentList.length > 0) {
          setSelectedPartyId(currentList[0].id);
          startInlineEdit(currentList[0], 'name');
        }
        return;
      }

      // Arrow Down: fast row navigation & seamless page flip
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (currentIndex < currentList.length - 1 && currentIndex >= 0) {
          const nextParty = currentList[currentIndex + 1];
          setSelectedPartyId(nextParty.id);
          playNavSound();
        } else if (currentIndex === currentList.length - 1) {
          // Reached last row! Auto-flip seamlessly to Next Page row 0 without stopping on button!
          const currPage = partyCurrentPageRef.current;
          const maxPages = totalPartyPagesRef.current;
          if (currPage < maxPages) {
            const nextP = currPage + 1;
            setPartyCurrentPage(nextP);
            const start = (nextP - 1) * PARTIES_PER_PAGE;
            const nextSlice = filteredPartiesRef.current.slice(start, start + PARTIES_PER_PAGE);
            if (nextSlice.length > 0) {
              setSelectedPartyId(nextSlice[0].id);
              playNavSound();
            }
          }
        } else if (currentList.length > 0) {
          setSelectedPartyId(currentList[0].id);
          playNavSound();
        }
        return;
      }

      // Arrow Up: fast row navigation & seamless page flip
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (currentIndex > 0) {
          const prevParty = currentList[currentIndex - 1];
          setSelectedPartyId(prevParty.id);
          playNavSound();
        } else if (currentIndex === 0) {
          // Reached first row! Auto-flip seamlessly to Previous Page last row without stopping on button!
          const currPage = partyCurrentPageRef.current;
          if (currPage > 1) {
            const prevP = currPage - 1;
            setPartyCurrentPage(prevP);
            const start = (prevP - 1) * PARTIES_PER_PAGE;
            const prevSlice = filteredPartiesRef.current.slice(start, start + PARTIES_PER_PAGE);
            if (prevSlice.length > 0) {
              setSelectedPartyId(prevSlice[prevSlice.length - 1].id);
              playNavSound();
            }
          }
        }
        return;
      }

      // PageDown: Fast jump down
      if (e.key === 'PageDown') {
        e.preventDefault();
        macAudio.playHover();
        if (e.ctrlKey) {
          setSelectedPartyId(currentList[currentList.length - 1].id);
        } else {
          const nextIdx = Math.min(currentIndex + 10, currentList.length - 1);
          setSelectedPartyId(currentList[nextIdx].id);
        }
        return;
      }

      // PageUp: Fast jump up
      if (e.key === 'PageUp') {
        e.preventDefault();
        macAudio.playHover();
        if (e.ctrlKey) {
          setSelectedPartyId(currentList[0].id);
        } else {
          const prevIdx = Math.max(currentIndex - 10, 0);
          setSelectedPartyId(currentList[prevIdx].id);
        }
        return;
      }

      // Home: First row
      if (e.key === 'Home') {
        e.preventDefault();
        macAudio.playHover();
        setSelectedPartyId(currentList[0].id);
        return;
      }

      // End: Last row
      if (e.key === 'End') {
        e.preventDefault();
        macAudio.playHover();
        setSelectedPartyId(currentList[currentList.length - 1].id);
        return;
      }

      // Ctrl + Enter: Make Selected Row Editable
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (curId) {
          const target = currentList.find(p => p.id === curId);
          if (target) {
            startInlineEdit(target, 'name');
          }
        }
        return;
      }

      // Insert Key: Insert New Row at Top (Index 0)
      if (e.key === 'Insert') {
        e.preventDefault();
        handleStartNewParty();
        return;
      }

      if (e.key === 'Delete') {
        e.preventDefault();
        if (curId && currentIndex >= 0 && !partyToDelete) {
          const target = currentList[currentIndex];
          if (target) {
            macAudio.playPop();
            setPartyToDelete({ id: target.id, name: target.name || target.id });
          }
        }
        return;
      }
    };

    const handleAppInsert = () => {
      handleStartNewParty();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('app-insert-row', handleAppInsert);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('app-insert-row', handleAppInsert);
    };
  }, [activeTab, handleCommitInlineParty, handleCancelInlineParty, startInlineEdit, handleStartNewParty, partyToDelete]);

  // Auto-scroll selected party row instantly into view on arrow navigation and set DOM focus
  useEffect(() => {
    if (activeTab === 'F5' && selectedPartyId) {
      const scrollAndFocus = () => {
        const el = partyRowRefs.current[selectedPartyId] || document.getElementById(`party-row-${selectedPartyId}`);
        if (el) {
          el.scrollIntoView({ block: 'nearest', behavior: 'auto' });
          if (document.activeElement !== el && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName || '')) {
            el.focus({ preventScroll: true });
          }
        }
      };
      scrollAndFocus();
      requestAnimationFrame(scrollAndFocus);
    }
  }, [activeTab, selectedPartyId, partyCurrentPage]);

  const handleStartEditParty = (p: typeof parties[0]) => {
    setPartyForm({
      id: p.id,
      name: p.name || '',
      phone: p.phone || '',
      station: p.station || '',
      district: p.district || '',
      state: p.state || '',
      pincode: p.pincode || '',
      gstin: p.gstin || '',
      balance: p.balance || 0
    });
    setIsEditingParty(true);
  };


  const handleBulkPartyPaste = async (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text');
    if (!text || (!text.includes('\t') && !text.includes('\n'))) return;

    e.preventDefault();
    macAudio.playSuccess();
    const lines = text.trim().split(/\r?\n/).filter(line => line.trim().length > 0);
    for (let i = 0; i < lines.length; i++) {
      const cols = lines[i].split('\t').map(c => c.trim());
      const name = cols[0];
      if (!name) continue;
      const rec = {
        id: `P-${Date.now()}-${i}`,
        name,
        phone: cols[1] || '',
        station: cols[2] || '',
        district: cols[3] || '',
        state: cols[4] || '',
        pincode: cols[5] || '',
        gstin: cols[6] || '',
        balance: cols[7] ? parseFloat(cols[7]) || 0 : 0,
        city: cols[2] || cols[3] || '',
        contact: cols[1] || '',
        limit: 500000,
        updatedAt: Date.now(),
        synced: false
      };
      await saveParty(rec);
    }
    showPartyToast(`Imported ${lines.length} parties in bulk`);
  };

  const handleDeletePartyAction = (id: string, name: string) => {
    macAudio.playPop();
    setPartyToDelete({ id, name });
  };

  const confirmDeleteParty = async () => {
    if (!partyToDelete) return;
    const { id, name } = partyToDelete;
    const currentIndex = paginatedParties.findIndex(p => p.id === id);
    const nextSelected = paginatedParties[currentIndex + 1] || paginatedParties[currentIndex - 1];
    setSelectedPartyId(nextSelected ? nextSelected.id : null);
    setEditingPartyId(null);
    await deleteParty(id);
    showPartyToast(`Party "${name}" removed`);
    macAudio.playSuccess();
    setPartyToDelete(null);
  };

  // F8 Stock Inventory state
  const [selectedStockId, setSelectedStockId] = useState<string | null>('STK-1');

  // F9 Ledger state
  const [selectedLedgerParty, setSelectedLedgerParty] = useState('P-1');
  const [selectedLedgerRowId, setSelectedLedgerRowId] = useState<string | null>('L-4');

  const WALLPAPERS = [
    { name: 'Kung Fu Panda (Original)', url: '/panda_bg.jpg' },
    { name: 'Dark Metallic Minimal', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1920&auto=format&fit=crop' },
    { name: 'macOS Sonoma Flow', url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=1920&auto=format&fit=crop' },
    { name: 'Cyberpunk Industrial Neon', url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1920&auto=format&fit=crop' },
    { name: 'Deep Space Glass Nebula', url: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=1920&auto=format&fit=crop' }
  ];

  const COLOR_THEMES = [
    { name: 'Midnight Charcoal', val: 'linear-gradient(135deg, #070b14 0%, #0d1a30 50%, #080f1e 100%)' },
    { name: 'Deep Obsidian', val: 'linear-gradient(135deg, #000000 0%, #111827 50%, #030712 100%)' },
    { name: 'Emerald Foundry', val: 'linear-gradient(135deg, #022c22 0%, #064e3b 50%, #022c22 100%)' },
    { name: 'Cyberpunk Purple', val: 'linear-gradient(135deg, #2e1065 0%, #3b0764 50%, #170529 100%)' }
  ];

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      {/* ========================================================================= */}
      {/* TAB F2: BILL HISTORY (Apple 3-Panel Layout with Full Arrow Key Navigation) */}
      {/* ========================================================================= */}
      {activeTab === 'F2' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', height: '100%', minHeight: 0 }}>
          {/* Sub-tabs bar: SALE, SALE RETURN, ORDER, PURCHASE */}
          <div 
            className="glass-panel"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '6px 10px',
              borderRadius: '8px',
              flexShrink: 0,
              minWidth: 0,
            }}
          >
            <IosSegmentedTabs<'SALE' | 'SALE_RETURN' | 'ORDER' | 'PURCHASE'>
              activeKey={historySubTab}
              onChange={setHistorySubTab}
              width="100%"
              style={{ maxWidth: '680px' }}
              tabs={[
                {
                  key: 'SALE',
                  label: 'SALE',
                  shortcut: 'Alt+1',
                  icon: ShoppingBag,
                  count: categoryCounts.SALE,
                  gradient: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
                  shadowColor: 'rgba(14, 165, 233, 0.35)'
                },
                {
                  key: 'SALE_RETURN',
                  label: 'SALE RETURN',
                  shortcut: 'Alt+2',
                  icon: RotateCcw,
                  count: categoryCounts.SALE_RETURN,
                  gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  shadowColor: 'rgba(239, 68, 68, 0.35)'
                },
                {
                  key: 'ORDER',
                  label: 'ORDER',
                  shortcut: 'Alt+3',
                  icon: ShoppingCart,
                  count: categoryCounts.ORDER,
                  gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  shadowColor: 'rgba(245, 158, 11, 0.35)'
                },
                {
                  key: 'PURCHASE',
                  label: 'PURCHASE',
                  shortcut: 'Alt+4',
                  icon: Truck,
                  count: categoryCounts.PURCHASE,
                  gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  shadowColor: 'rgba(16, 185, 129, 0.35)'
                }
              ]}
            />
          </div>

          {/* 3-Panel Layout Container */}
          <div style={{ flex: 1, display: 'flex', gap: '8px', minHeight: 0, minWidth: 0, width: '100%', overflow: 'hidden' }}>
            {/* PANEL 1: Bill List / Navigator (Left ~24%) */}
            <div 
              className="glass-panel" 
              style={{ 
                flex: '0 1 24%',
                width: '24%',
                minWidth: '180px',
                maxWidth: '320px',
                display: 'flex', 
                flexDirection: 'column', 
                borderRadius: '8px', 
                padding: '6px',
                minHeight: 0,
                overflow: 'hidden',
                border: f2FocusArea === 'bills' ? '1px solid rgba(56, 189, 248, 0.4)' : undefined
              }}
              onClick={() => setF2FocusArea('bills')}
            >
              <div style={{ 
                fontSize: '11px', 
                fontWeight: 700, 
                color: '#f8fafc', 
                letterSpacing: '0.06em', 
                padding: '4px 6px 6px 6px', 
                borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <span>{historySubTab.replace('_', ' ')} INVOICES</span>
                <span style={{ color: '#38bdf8', fontSize: '10px' }}>{filteredBills.length} RECORDS</span>
              </div>

              {/* Quick Bill Search Filter Input */}
              <div style={{ padding: '6px 4px', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <CosmicSearchInput
                  value={billSearchQuery}
                  onChange={setBillSearchQuery}
                  width="100%"
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (filteredBills.length > 0) {
                        const target = (selectedBillId ? filteredBills.find(b => b.id === selectedBillId) : null) || filteredBills[0];
                        if (target && onLoadBillToEditor) {
                          onLoadBillToEditor(target);
                        }
                      }
                    }
                  }}
                />
              </div>

              {/* iPhone 3D Notification Stack & Crawl View (LockScreenStack) */}
              <div style={{ flex: 1, minHeight: 0, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <LockScreenStack
                  bills={filteredBills}
                  selectedBillId={selectedBill.id}
                  onSelectBill={(b) => {
                    setSelectedBillId(b.id);
                    setF2FocusArea('bills');
                  }}
                  onDoubleClickBill={(b) => {
                    if (onLoadBillToEditor) onLoadBillToEditor(b);
                  }}
                />
              </div>
          </div>

          {/* RIGHT 76%: Selected Bill Header & Dual Tables (Panel 2 & 3) */}
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '8px', minHeight: 0, overflow: 'hidden' }}>
            {/* Top Quick Status & Actions Bar */}
            <div 
              className="glass-panel" 
              style={{ 
                padding: '6px 12px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                borderRadius: '8px',
                minWidth: 0,
                flexWrap: 'wrap',
                gap: '8px',
                flexShrink: 0
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ color: '#f8fafc' }}>Token:</span>
                  <strong style={{ color: '#38bdf8' }}>#{formatBillNumber(selectedBill.token)}</strong>
                </div>
                <div style={{ height: '12px', width: '1px', background: 'rgba(255, 255, 255, 0.1)' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ color: '#f8fafc' }}>Party:</span>
                  <strong style={{ color: '#f8fafc' }}>{selectedBill.party}</strong>
                </div>
                <div style={{ height: '12px', width: '1px', background: 'rgba(255, 255, 255, 0.1)' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ color: '#f8fafc' }}>Vehicle:</span>
                  <span style={{ color: '#e2e8f0', fontFamily: 'monospace' }}>{selectedBill.vehicle}</span>
                </div>
              </div>

              {/* Action Buttons - Clean Minimal Uniform Dark Glass Style */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Tooltip title="Load Bill into Editor (Enter)" side="bottom">
                  <button
                    type="button"
                    onClick={() => {
                      macAudio.playClick();
                      if (onLoadBillToEditor) {
                        onLoadBillToEditor(selectedBill);
                      } else {
                        onBackToBill();
                      }
                    }}
                    onMouseEnter={() => macAudio.playHover()}
                    className="mac-btn"
                    style={{ width: '28px', height: '28px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <ExternalLink size={13} color="#38bdf8" />
                  </button>
                </Tooltip>

                <Tooltip title="Cell-Level Edit & Audit History (Alt+H)" side="bottom">
                  <button
                    type="button"
                    onClick={() => {
                      macAudio.playPop();
                      setIsAuditModalOpen(true);
                    }}
                    onMouseEnter={() => macAudio.playHover()}
                    className="mac-btn"
                    style={{ width: '28px', height: '28px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <History size={13} color="#c084fc" />
                  </button>
                </Tooltip>

                <Tooltip title="Print Bill (Ctrl+P)" side="bottom">
                  <button
                    type="button"
                    className="mac-btn"
                    style={{ width: '28px', height: '28px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    onClick={() => {
                      macAudio.playPop();
                      setIsPrintModalOpen(true);
                    }}
                    onMouseEnter={() => macAudio.playHover()}
                  >
                    <Printer size={13} color="#38bdf8" />
                  </button>
                </Tooltip>

                <Tooltip title="Export PDF / Print Preview (Alt+P)" side="bottom">
                  <button
                    type="button"
                    className="mac-btn"
                    style={{ width: '28px', height: '28px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    onClick={() => {
                      macAudio.playPop();
                      setIsPrintModalOpen(true);
                    }}
                    onMouseEnter={() => macAudio.playHover()}
                  >
                    <Download size={13} color="#34d399" />
                  </button>
                </Tooltip>

                <Tooltip title="Export This Bill to CSV (Ctrl+E)" side="bottom">
                  <button
                    type="button"
                    className="mac-btn"
                    style={{ width: '28px', height: '28px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    onClick={() => {
                      macAudio.playClick();
                      handleExportSelectedBillCsv();
                    }}
                    onMouseEnter={() => macAudio.playHover()}
                  >
                    <FileSpreadsheet size={13} color="#10b981" />
                  </button>
                </Tooltip>

                {/* Delete Bill Button */}
                {selectedBill && selectedBill.id !== 'empty' && (
                  <Tooltip title="Delete This Bill (Delete)" side="bottom">
                    <button
                      type="button"
                      className="mac-btn"
                      style={{
                        width: '28px', height: '28px', padding: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        borderColor: 'rgba(239,68,68,0.4)',
                        marginLeft: '4px'
                      }}
                      onClick={() => {
                        macAudio.playPop();
                        setDeleteConfirmBillId(selectedBill.id);
                      }}
                      onMouseEnter={() => macAudio.playHover()}
                    >
                      <Trash2 size={13} color="#ef4444" />
                    </button>
                  </Tooltip>
                )}
              </div>
            </div>

            {/* DUAL TABLES CONTAINER: PANEL 2 (Left Table) + PANEL 3 (Right Table) */}
            <div style={{ flex: 1, display: 'flex', gap: '8px', minHeight: 0, minWidth: 0, overflow: 'hidden' }}>
              {/* PANEL 2: LEFT TABLE (Raw Materials / Input Specs) */}
              <div 
                className="glass-panel" 
                style={{ 
                  flex: 1, 
                  minWidth: 0,
                  display: 'flex', 
                  flexDirection: 'column', 
                  borderRadius: '8px', 
                  padding: '6px',
                  minHeight: 0,
                  overflow: 'hidden',
                  border: f2FocusArea === 'raw' ? '1px solid rgba(56, 189, 248, 0.4)' : undefined
                }}
                onClick={() => setF2FocusArea('raw')}
              >
                <div style={{ 
                  fontSize: '10.5px', 
                  fontWeight: 700, 
                  color: '#ffffff', 
                  letterSpacing: '0.05em', 
                  padding: '3px 6px 5px 6px',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span>PRODUCT TOTAL</span>
                  <span style={{ color: '#e2e8f0', fontSize: '10px' }}>{displayRawItems.length} ITEMS</span>
                </div>

                <div style={{ flex: 1, overflow: 'auto', minHeight: 0, minWidth: 0, marginTop: '2px' }}>
                  <table className="apple-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th style={{ width: `${tableCols.f2Raw.index}px`, textAlign: 'center', position: 'relative', userSelect: 'none' }}>
                          #
                          <div className="th-resizer" onMouseDown={(e) => startResizeCol('f2Raw', 'index', e)} title="Drag to resize column" />
                        </th>
                        <th style={{ width: `${tableCols.f2Raw.name}px`, position: 'relative', userSelect: 'none' }}>
                          ITEM NAME
                          <div className="th-resizer" onMouseDown={(e) => startResizeCol('f2Raw', 'name', e)} title="Drag to resize column" />
                        </th>
                        {showPartyCode && (
                          <th style={{ width: `${(tableCols.f2Raw as any).partyCode || 120}px`, position: 'relative', userSelect: 'none' }}>
                            PARTY CODE
                            <div className="th-resizer" onMouseDown={(e) => startResizeCol('f2Raw', 'partyCode' as any, e)} title="Drag to resize column" />
                          </th>
                        )}
                        {/* All Feet Size Columns (Sorted Descending: e.g. 12 FT -> 10 FT -> 9.5 FT) */}
                        {f2AllSizeCols.map(sc => {
                          const colW = (tableCols.f2Raw as any)[sc.field] || (sc.isBase ? tableCols.f2Raw.qty : 65);
                          return (
                            <th 
                              key={sc.field} 
                              style={{ width: `${colW}px`, textAlign: 'right', position: 'relative', userSelect: 'none' }}
                            >
                              <span style={{ color: sc.isBase ? '#38bdf8' : '#34d399' }}>{sc.label}</span>
                              <div className="th-resizer" onMouseDown={(e) => startResizeCol('f2Raw', sc.field as any, e)} title="Drag to resize column" />
                            </th>
                          );
                        })}
                        <th style={{ width: `${tableCols.f2Raw.uCap}px`, textAlign: 'right', position: 'relative', userSelect: 'none' }}>
                          U CAP
                          <div className="th-resizer" onMouseDown={(e) => startResizeCol('f2Raw', 'uCap', e)} title="Drag to resize column" />
                        </th>
                        <th style={{ width: `${tableCols.f2Raw.lCap}px`, textAlign: 'right', position: 'relative', userSelect: 'none' }}>
                          L CAP
                          <div className="th-resizer" onMouseDown={(e) => startResizeCol('f2Raw', 'lCap', e)} title="Drag to resize column" />
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayRawItems.map((r, idx) => {
                        const isSelectedRow = f2FocusArea === 'raw' && selectedRawRowIdx === idx;
                        return (
                          <tr 
                            key={r.id || idx} 
                            ref={el => { rawRowRefs.current[idx] = el; }}
                            className={`mac-table-row ${isSelectedRow ? 'selected' : ''}`}
                            style={{ height: `${activeRowHeight}px` }}
                            onMouseEnter={() => macAudio.playHover()}
                            onClick={() => {
                              macAudio.playClick();
                              setSelectedRawRowIdx(idx);
                              setF2FocusArea('raw');
                            }}
                          >
                            <td style={{ textAlign: 'center', color: '#f8fafc', fontSize: '11px', position: 'relative' }}>
                              {idx + 1}
                              <div className="row-resizer" onMouseDown={handleRowResizeMouseDown} title="Drag to resize ALL row heights" />
                            </td>
                            <td style={{ fontWeight: 500, color: '#f8fafc' }}>{r.name}</td>
                            {showPartyCode && (
                              <td style={{ color: '#38bdf8', fontFamily: 'monospace', fontSize: '11px' }}>
                                {r.partyCode || '-'}
                              </td>
                            )}
                            {/* All Feet Size Column Values */}
                            {f2AllSizeCols.map(sc => {
                              const val = (r as any)[sc.field];
                              const numVal = Number(val) || 0;
                              return (
                                <td 
                                  key={sc.field} 
                                  style={{ 
                                    textAlign: 'right', 
                                    fontWeight: sc.isBase ? 700 : 600, 
                                    color: numVal > 0 ? (sc.isBase ? '#38bdf8' : '#34d399') : 'rgba(255, 255, 255, 0.2)' 
                                  }}
                                >
                                  {numVal > 0 ? numVal : '-'}
                                </td>
                              );
                            })}
                            <td style={{ textAlign: 'right', color: Number(r.uCap) > 0 ? '#a78bfa' : 'rgba(255, 255, 255, 0.2)' }}>
                              {Number(r.uCap) > 0 ? r.uCap : '-'}
                            </td>
                            <td style={{ textAlign: 'right', color: Number(r.lCap) > 0 ? '#f472b6' : 'rgba(255, 255, 255, 0.2)' }}>
                              {Number(r.lCap) > 0 ? r.lCap : '-'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot style={{ position: 'sticky', bottom: 0, zIndex: 5 }}>
                      <tr style={{ background: 'rgba(10, 15, 28, 0.97)', borderTop: '1px solid rgba(255, 255, 255, 0.12)', height: `${activeRowHeight}px` }}>
                        <td style={{ textAlign: 'center', color: '#94a3b8', fontSize: '10px' }}></td>
                        <td style={{ textAlign: 'center', color: '#38bdf8', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>
                          <Tooltip title={`Grand Total: ${grandTotalAllCols}`} placement="top" color="#0f172a">
                            <span style={{ display: 'inline-block' }}>
                              <AnimatedCounter value={grandTotalAllCols} style={{ color: '#38bdf8', fontSize: '12px', fontWeight: 800 }} />
                            </span>
                          </Tooltip>
                        </td>
                        {showPartyCode && <td></td>}
                        {f2AllSizeCols.map(sc => {
                          const colTotal = displayRawItems.reduce((acc, r) => acc + (Number((r as any)[sc.field]) || 0), 0);
                          return (
                            <td key={sc.field} style={{ textAlign: 'right', color: sc.isBase ? '#38bdf8' : '#34d399', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", paddingRight: '6px' }}>
                              <Tooltip title={`${sc.label} Total: ${colTotal}`} placement="top" color="#0f172a">
                                <span style={{ display: 'inline-block' }}>
                                  <AnimatedCounter value={colTotal} />
                                </span>
                              </Tooltip>
                            </td>
                          );
                        })}
                        <td style={{ textAlign: 'right', color: '#a78bfa', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", paddingRight: '6px' }}>
                          <Tooltip title={`UCAP Total: ${totalRawUCap}`} placement="top" color="#0f172a">
                            <span style={{ display: 'inline-block' }}>
                              <AnimatedCounter value={totalRawUCap} />
                            </span>
                          </Tooltip>
                        </td>
                        <td style={{ textAlign: 'right', color: '#f472b6', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", paddingRight: '6px' }}>
                          <Tooltip title={`LCAP Total: ${totalRawLCap}`} placement="top" color="#0f172a">
                            <span style={{ display: 'inline-block' }}>
                              <AnimatedCounter value={totalRawLCap} />
                            </span>
                          </Tooltip>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* PANEL 3: RIGHT TABLE (Finished Moulds / Commercials) */}
              <div 
                className="glass-panel" 
                style={{ 
                  flex: 1, 
                  minWidth: 0,
                  display: 'flex', 
                  flexDirection: 'column', 
                  borderRadius: '8px', 
                  padding: '6px',
                  minHeight: 0,
                  overflow: 'hidden',
                  border: f2FocusArea === 'finished' ? '1px solid rgba(56, 189, 248, 0.4)' : undefined
                }}
                onClick={() => setF2FocusArea('finished')}
              >
                <div style={{ 
                  fontSize: '10.5px', 
                  fontWeight: 700, 
                  color: '#ffffff', 
                  letterSpacing: '0.05em', 
                  padding: '3px 6px 5px 6px',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span>SUMMARY</span>
                  <span style={{ color: '#e2e8f0', fontSize: '10px' }}>{displayFinishedItems.length} MOULDS</span>
                </div>

                <div style={{ flex: 1, overflow: 'auto', minHeight: 0, minWidth: 0, marginTop: '2px' }}>
                  <table className="apple-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th style={{ width: `${tableCols.f2Finished.index}px`, textAlign: 'center', position: 'relative', userSelect: 'none' }}>
                          #
                          <div className="th-resizer" onMouseDown={(e) => startResizeCol('f2Finished', 'index', e)} title="Drag to resize column" />
                        </th>
                        <th style={{ width: `${tableCols.f2Finished.mould}px`, position: 'relative', userSelect: 'none' }}>
                          MOULD SPECIFICATION
                          <div className="th-resizer" onMouseDown={(e) => startResizeCol('f2Finished', 'mould', e)} title="Drag to resize column" />
                        </th>
                        <th style={{ width: `${tableCols.f2Finished.qty}px`, textAlign: 'right', position: 'relative', userSelect: 'none' }}>
                          QTY
                          <div className="th-resizer" onMouseDown={(e) => startResizeCol('f2Finished', 'qty', e)} title="Drag to resize column" />
                        </th>
                        <th style={{ width: `${tableCols.f2Finished.price}px`, textAlign: 'right', position: 'relative', userSelect: 'none' }}>
                          PRICE (₹)
                          <div className="th-resizer" onMouseDown={(e) => startResizeCol('f2Finished', 'price', e)} title="Drag to resize column" />
                        </th>
                        <th style={{ width: `${tableCols.f2Finished.total}px`, textAlign: 'right', position: 'relative', userSelect: 'none' }}>
                          TOTAL (₹)
                          <div className="th-resizer" onMouseDown={(e) => startResizeCol('f2Finished', 'total', e)} title="Drag to resize column" />
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayFinishedItems.map((f, idx) => {
                        const isSelectedRow = f2FocusArea === 'finished' && selectedFinishedRowIdx === idx;
                        return (
                          <tr 
                            key={f.id || idx} 
                            ref={el => { finishedRowRefs.current[idx] = el; }}
                            className={`mac-table-row ${isSelectedRow ? 'selected' : ''}`}
                            style={{ height: `${activeRowHeight}px` }}
                            onMouseEnter={() => macAudio.playHover()}
                            onClick={() => {
                              macAudio.playClick();
                              setSelectedFinishedRowIdx(idx);
                              setF2FocusArea('finished');
                            }}
                          >
                            <td style={{ textAlign: 'center', color: '#f8fafc', fontSize: '11px', position: 'relative' }}>
                              {idx + 1}
                              <div className="row-resizer" onMouseDown={handleRowResizeMouseDown} title="Drag to resize ALL row heights" />
                            </td>
                            <td style={{ fontWeight: 500, color: '#f8fafc' }}>{f.mould}</td>
                            <td style={{ textAlign: 'right', fontWeight: 700, color: '#a78bfa' }}>{f.qty}</td>
                            <td style={{ textAlign: 'right', color: '#f8fafc' }}>{f.price.toLocaleString('en-IN')}</td>
                            <td style={{ textAlign: 'right', fontWeight: 700, color: '#34d399' }}>₹{f.total.toLocaleString('en-IN')}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot style={{ position: 'sticky', bottom: 0, zIndex: 5 }}>
                      <tr style={{ background: 'rgba(10, 15, 28, 0.97)', borderTop: '1px solid rgba(255, 255, 255, 0.12)', height: `${activeRowHeight}px` }}>
                        <td></td>
                        <td style={{ color: '#e2e8f0', fontWeight: 600, fontSize: '11px', paddingLeft: '8px' }}>
                          {displayFinishedItems.length} Moulds
                        </td>
                        <td 
                          style={{ 
                            textAlign: 'right', 
                            fontWeight: 700, 
                            color: totalFinishedQty !== grandTotalAllCols ? '#ef4444' : '#a78bfa', 
                            fontFamily: "'JetBrains Mono', monospace", 
                            paddingRight: '6px' 
                          }}
                        >
                          <Tooltip 
                            title={
                              totalFinishedQty !== grandTotalAllCols 
                                ? `⚠️ Qty Mismatch: Moulds Qty (${totalFinishedQty}) ≠ Product Total (${grandTotalAllCols})` 
                                : `Total Moulds Qty: ${totalFinishedQty}`
                            } 
                            placement="top" 
                            color="#0f172a"
                          >
                            <span style={{ display: 'inline-block' }}>
                              <AnimatedCounter 
                                value={totalFinishedQty} 
                                style={{ color: totalFinishedQty !== grandTotalAllCols ? '#ef4444' : '#a78bfa' }}
                              />
                            </span>
                          </Tooltip>
                        </td>
                        <td></td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: '#34d399', fontFamily: "'JetBrains Mono', monospace", paddingRight: '6px' }}>
                          <Tooltip title={`Grand Total: ₹${totalFinishedAmount.toLocaleString('en-IN')}`} placement="top" color="#0f172a">
                            <span style={{ display: 'inline-block' }}>
                              <AnimatedCounter value={totalFinishedAmount} prefix="₹" formatIndian={true} />
                            </span>
                          </Tooltip>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* ========================================================================= */}
      {/* TAB F3: EQUATION & MULTI-PARTY GOODS DISTRIBUTION (SHADCN/UI)             */}
      {/* ========================================================================= */}
      {activeTab === 'F3' && <EquationTabView />}

      {/* ========================================================================= */}
      {/* TAB F4: EXECUTIVE BUSINESS INTELLIGENCE DASHBOARD (SHADCN/UI FLAGSHIP) */}
      {/* ========================================================================= */}
      {activeTab === 'F4' && (
        <ShadcnDashboardView
          themeMode={themeMode}
          onNavigateToBill={onBackToBill}
          onNavigateToHistory={() => onSelectTab ? onSelectTab('F2') : undefined}
          onNavigateToStock={() => onSelectTab ? onSelectTab('F8') : undefined}
          onLoadBillToEditor={onLoadBillToEditor}
        />
      )}

      {/* ========================================================================= */}
      {/* TAB F5: PARTY DIRECTORY & BALANCES */}
      {/* ========================================================================= */}
      {activeTab === 'F5' && (
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
            borderRadius: '8px',
            border: '1px solid #27272a',
            background: '#09090b',
            overflow: 'hidden'
          }}
          onPaste={handleBulkPartyPaste}
        >
          {/* Search & Action Bar — clean shadcn zinc */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px',
              padding: '8px 12px',
              background: '#18181b',
              borderBottom: '1px solid #27272a',
              flexShrink: 0
            }}
          >
            {/* Search Input */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', flex: 1, maxWidth: '300px' }}>
              <Search size={13} style={{ position: 'absolute', left: '10px', color: '#71717a', pointerEvents: 'none' }} />
              <ShadcnInput
                type="text"
                placeholder="Search party, phone, city..."
                value={partySearchQuery}
                onChange={(e) => {
                  setPartySearchQuery(e.target.value);
                  setPartyCurrentPage(1);
                }}
                style={{ width: '100%', height: '32px', paddingLeft: '30px', fontSize: '12px' }}
              />
            </div>

            {/* Right Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {/* Total counter badge */}
              <span style={{ fontSize: '12px', color: '#71717a', padding: '0 4px', whiteSpace: 'nowrap' }}>
                {filteredParties.length === parties.length
                  ? `${parties.length.toLocaleString('en-IN')} Parties`
                  : `${filteredParties.length.toLocaleString('en-IN')} / ${parties.length.toLocaleString('en-IN')}`}
              </span>

              {/* View Mode Switcher: Cards vs Table */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  background: '#09090b',
                  border: '1px solid #27272a',
                  borderRadius: '6px',
                  padding: '2px',
                  gap: '2px'
                }}
              >
                <Tooltip title="Standard Table View" side="bottom">
                  <button
                    type="button"
                    onClick={() => handleTogglePartyViewMode('table')}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      height: '24px',
                      padding: '0 8px',
                      fontSize: '11px',
                      fontWeight: partyViewMode === 'table' ? 600 : 500,
                      borderRadius: '4px',
                      border: 'none',
                      cursor: 'pointer',
                      background: partyViewMode === 'table' ? '#18181b' : 'transparent',
                      color: partyViewMode === 'table' ? '#f4f4f5' : '#71717a',
                      transition: 'all 0.12s ease'
                    }}
                  >
                    <List size={12} />
                    <span>Table</span>
                  </button>
                </Tooltip>

                <Tooltip title="Cards View" side="bottom">
                  <button
                    type="button"
                    onClick={() => handleTogglePartyViewMode('cards')}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      height: '24px',
                      padding: '0 8px',
                      fontSize: '11px',
                      fontWeight: partyViewMode === 'cards' ? 600 : 500,
                      borderRadius: '4px',
                      border: 'none',
                      cursor: 'pointer',
                      background: partyViewMode === 'cards' ? '#18181b' : 'transparent',
                      color: partyViewMode === 'cards' ? '#f4f4f5' : '#71717a',
                      transition: 'all 0.12s ease'
                    }}
                  >
                    <Grid size={12} />
                    <span>Cards</span>
                  </button>
                </Tooltip>
              </div>

              {/* Universal Excel/CSV Export, Import & Template */}
              <ExcelCsvActions<PartyRecord>
                title="Parties Directory"
                filenamePrefix="Parties_Directory"
                data={filteredParties}
                columns={partyCsvColumns}
                onImport={handleImportParties}
              />

              {/* New Party Button */}
              <Tooltip title="Add New Party to Directory (+)" side="bottom">
                <ShadcnButton
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={() => {
                    macAudio.playClick();
                    handleStartNewParty();
                  }}
                  style={{ height: '32px', fontSize: '12px', fontWeight: 600, gap: '5px', whiteSpace: 'nowrap' }}
                >
                  <Plus size={13} /> Add Party Row
                </ShadcnButton>
              </Tooltip>
            </div>
          </div>


          {/* Table / iPhone Cards View Area */}
          <div style={{ flex: 1, minHeight: 0, overflow: 'auto', borderRadius: '4px' }}>
            {partyViewMode === 'cards' ? (
              /* ===== iPHONE CARD DECK GRID VIEW ===== */
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '12px',
                padding: '4px 2px 14px 2px'
              }}>
                {paginatedParties.length === 0 ? (
                  <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px 10px', color: '#94a3b8', fontSize: '13px' }}>
                    No parties match "{partySearchQuery}". Click "Add Party Row" or paste Excel rows (Ctrl+V).
                  </div>
                ) : (
                  paginatedParties.map((p, idx) => {
                    const pNameKey = (p.name || '').trim().toLowerCase();
                    const stat = partyBillStats[pNameKey] || { count: 0, total: 0 };
                    const isSelected = selectedPartyId === p.id;
                    const bal = Number(p.balance || 0);

                    const initials = (p.name || 'P')
                      .split(' ')
                      .filter(Boolean)
                      .slice(0, 2)
                      .map(w => w[0].toUpperCase())
                      .join('');

                    // Consistent avatar color gradient based on name hash
                    const colors = [
                      'linear-gradient(135deg, #0a84ff 0%, #0066cc 100%)',
                      'linear-gradient(135deg, #bf5af2 0%, #893dc7 100%)',
                      'linear-gradient(135deg, #30d158 0%, #20993e 100%)',
                      'linear-gradient(135deg, #ff9f0a 0%, #d97706 100%)',
                      'linear-gradient(135deg, #ff375f 0%, #d6244a 100%)',
                      'linear-gradient(135deg, #64d2ff 0%, #0284c7 100%)'
                    ];
                    const colorIdx = (p.name || '').split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % colors.length;

                    return (
                      <div
                        key={p.id || idx}
                        className="glass-panel"
                        style={{
                          background: isSelected ? 'rgba(30, 41, 68, 0.85)' : 'rgba(24, 27, 40, 0.75)',
                          backdropFilter: 'blur(20px)',
                          WebkitBackdropFilter: 'blur(20px)',
                          borderRadius: '16px',
                          border: isSelected ? '1.5px solid rgba(56, 189, 248, 0.7)' : '1px solid rgba(255, 255, 255, 0.1)',
                          boxShadow: isSelected
                            ? '0 12px 30px rgba(0, 100, 255, 0.35), inset 0 0 12px rgba(56, 189, 248, 0.15)'
                            : '0 8px 24px rgba(0, 0, 0, 0.45)',
                          padding: '14px 15px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '10px',
                          cursor: 'pointer',
                          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                          position: 'relative'
                        }}
                        onClick={() => {
                          macAudio.playClick();
                          setSelectedPartyId(p.id);
                        }}
                        onDoubleClick={() => handleOpenPartyStack(p)}
                      >
                        {/* Top: Avatar, Name & Stack Open Button */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '11px' }}>
                          <div style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '50%',
                            background: colors[colorIdx],
                            color: '#ffffff',
                            fontWeight: 700,
                            fontSize: '15px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.4)',
                            border: '1.5px solid rgba(255, 255, 255, 0.2)'
                          }}>
                            {initials}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                              fontSize: '14.5px',
                              fontWeight: 700,
                              color: '#ffffff',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              letterSpacing: '-0.01em'
                            }}>
                              {p.name}
                            </div>
                            <div style={{
                              fontSize: '11.5px',
                              color: '#94a3b8',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              marginTop: '1px'
                            }}>
                              {p.station || p.city || 'No Station'} {p.district ? `• ${p.district}` : ''}
                            </div>
                          </div>
                        </div>


                        {/* Mid Info Row: Phone & GSTIN/Bills */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          background: 'rgba(255, 255, 255, 0.04)',
                          padding: '6px 10px',
                          borderRadius: '8px',
                          fontSize: '11px',
                          border: '1px solid rgba(255, 255, 255, 0.05)'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#cbd5e1' }}>
                            <Phone size={12} color="#38bdf8" />
                            <span>{p.phone || 'No Phone'}</span>
                          </div>
                          <div style={{
                            background: stat.count > 0 ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.06)',
                            color: stat.count > 0 ? '#38bdf8' : '#64748b',
                            padding: '1px 7px',
                            borderRadius: '9999px',
                            fontWeight: 700,
                            fontSize: '10px'
                          }}>
                            {stat.count} Bills
                          </div>
                        </div>

                        {/* Bottom Row: Balance & Action Chips */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          paddingTop: '4px',
                          borderTop: '1px solid rgba(255, 255, 255, 0.06)'
                        }}>
                          <div>
                            <div style={{ fontSize: '9.5px', textTransform: 'uppercase', color: '#64748b', fontWeight: 600 }}>Balance</div>
                            <div style={{
                              fontSize: '15px',
                              fontWeight: 700,
                              color: bal > 0 ? '#34d399' : bal < 0 ? '#ff375f' : '#cbd5e1'
                            }}>
                              ₹{bal.toLocaleString('en-IN')}
                            </div>
                          </div>

                          {/* Quick Actions in Card */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            {p.phone && (
                              <Tooltip title="Send WhatsApp Message" side="bottom">
                                <a
                                  href={`https://wa.me/${p.phone.replace(/[^0-9]/g, '')}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    macAudio.playClick();
                                  }}
                                  style={{
                                    padding: '4px 8px',
                                    borderRadius: '6px',
                                    background: 'rgba(52, 211, 153, 0.12)',
                                    border: '1px solid rgba(52, 211, 153, 0.3)',
                                    color: '#34d399',
                                    fontSize: '10.5px',
                                    fontWeight: 600,
                                    textDecoration: 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '3px'
                                  }}
                                >
                                  <MessageCircle size={11} />
                                  <span>WA</span>
                                </a>
                              </Tooltip>
                            )}
                            <Tooltip title="Create Sale Bill for this Party (F1)" side="bottom">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  macAudio.playSuccess();
                                  if (onSelectPartyForBill) {
                                    onSelectPartyForBill(p.name);
                                  }
                                }}
                                style={{
                                  padding: '4px 9px',
                                  borderRadius: '6px',
                                  background: 'linear-gradient(135deg, #0a84ff 0%, #0066cc 100%)',
                                  border: '1px solid rgba(10, 132, 255, 0.5)',
                                  color: '#ffffff',
                                  fontSize: '10.5px',
                                  fontWeight: 600,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '3px',
                                  cursor: 'pointer'
                                }}
                              >
                                <Plus size={11} />
                                <span>Bill</span>
                              </button>
                            </Tooltip>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            ) : (
              /* ===== CLASSIC TABLE VIEW — PURE SHADCN DARK ZINC ===== */
              <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
                <Table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <TableHeader style={{ position: 'sticky', top: 0, zIndex: 10, background: '#18181b' }}>
                    <TableRow style={{ borderBottom: '1px solid #27272a' }}>
                      <TableHead style={{ width: `${tableCols.f5Parties.index}px`, padding: '8px 8px', textAlign: 'center', color: '#a1a1aa', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', position: 'relative', userSelect: 'none' }}>
                        #
                        <div className="th-resizer" onMouseDown={(e) => startResizeCol('f5Parties', 'index', e)} title="Drag to resize" />
                      </TableHead>
                      <TableHead style={{ width: `${tableCols.f5Parties.name}px`, padding: '8px 10px', textAlign: 'left', color: '#a1a1aa', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', position: 'relative', userSelect: 'none' }}>
                        PARTY NAME
                        <div className="th-resizer" onMouseDown={(e) => startResizeCol('f5Parties', 'name', e)} title="Drag to resize" />
                      </TableHead>
                      <TableHead style={{ width: `${tableCols.f5Parties.phone}px`, padding: '8px 10px', textAlign: 'left', color: '#a1a1aa', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', position: 'relative', userSelect: 'none' }}>
                        PHONE NUMBER
                        <div className="th-resizer" onMouseDown={(e) => startResizeCol('f5Parties', 'phone', e)} title="Drag to resize" />
                      </TableHead>
                      <TableHead style={{ width: `${tableCols.f5Parties.station}px`, padding: '8px 10px', textAlign: 'left', color: '#a1a1aa', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', position: 'relative', userSelect: 'none' }}>
                        STATION
                        <div className="th-resizer" onMouseDown={(e) => startResizeCol('f5Parties', 'station', e)} title="Drag to resize" />
                      </TableHead>
                      <TableHead style={{ width: `${tableCols.f5Parties.district}px`, padding: '8px 10px', textAlign: 'left', color: '#a1a1aa', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', position: 'relative', userSelect: 'none' }}>
                        DISTRICT
                        <div className="th-resizer" onMouseDown={(e) => startResizeCol('f5Parties', 'district', e)} title="Drag to resize" />
                      </TableHead>
                      <TableHead style={{ width: `${tableCols.f5Parties.state}px`, padding: '8px 10px', textAlign: 'left', color: '#a1a1aa', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', position: 'relative', userSelect: 'none' }}>
                        STATE
                        <div className="th-resizer" onMouseDown={(e) => startResizeCol('f5Parties', 'state', e)} title="Drag to resize" />
                      </TableHead>
                      <TableHead style={{ width: `${tableCols.f5Parties.pincode}px`, padding: '8px 10px', textAlign: 'left', color: '#a1a1aa', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', position: 'relative', userSelect: 'none' }}>
                        PINCODE
                        <div className="th-resizer" onMouseDown={(e) => startResizeCol('f5Parties', 'pincode', e)} title="Drag to resize" />
                      </TableHead>
                      <TableHead style={{ width: `${tableCols.f5Parties.bills}px`, padding: '8px 8px', textAlign: 'center', color: '#a1a1aa', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', position: 'relative', userSelect: 'none' }}>
                        BILLS
                        <div className="th-resizer" onMouseDown={(e) => startResizeCol('f5Parties', 'bills', e)} title="Drag to resize" />
                      </TableHead>
                      <TableHead style={{ width: `${tableCols.f5Parties.balance}px`, padding: '8px 10px', textAlign: 'right', color: '#a1a1aa', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', position: 'relative', userSelect: 'none' }}>
                        BALANCE
                        <div className="th-resizer" onMouseDown={(e) => startResizeCol('f5Parties', 'balance', e)} title="Drag to resize" />
                      </TableHead>
                      <TableHead style={{ width: '85px', padding: '8px 8px', textAlign: 'center', color: '#a1a1aa', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', position: 'relative', userSelect: 'none' }}>
                        ACTION
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedParties.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} style={{ textAlign: 'center', padding: '30px 10px', color: '#71717a', fontSize: '12px' }}>
                          No parties match "{partySearchQuery}". Click "Add Party Row" or paste Excel rows (Ctrl+V).
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedParties.map((p, idx) => {
                        const globalIdx = (partyCurrentPage - 1) * PARTIES_PER_PAGE + idx + 1;
                        const pNameKey = (p.name || '').trim().toLowerCase();
                        const stat = partyBillStats[pNameKey] || { count: 0, total: 0 };
                        const isSelected = selectedPartyId === p.id;
                        const isEditing = editingPartyId === p.id;
                        const draft = isEditing && inlinePartyDraft ? inlinePartyDraft : p;

                        const cellInputStyle: React.CSSProperties = {
                          width: '100%',
                          background: '#18181b',
                          border: '1px solid #38bdf8',
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
                          display: 'block',
                          userSelect: 'text',
                          color: '#f4f4f5',
                          fontSize: '12px',
                          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          fontWeight: 500
                        };

                        return (
                          <TableRow
                            key={p.id || idx}
                            ref={(el) => { partyRowRefs.current[p.id] = el; }}
                            id={`party-row-${p.id}`}
                            isSelected={isSelected}
                            tabIndex={isSelected ? 0 : -1}
                            style={{
                              height: `${activeRowHeight}px`,
                              borderBottom: '1px solid #27272a',
                              background: isSelected
                                ? 'rgba(56, 189, 248, 0.16)'
                                : (idx % 2 === 0 ? 'rgba(24, 24, 27, 0.4)' : 'transparent'),
                              outline: isSelected ? '2px solid rgba(56, 189, 248, 0.75)' : 'none',
                              outlineOffset: '-2px',
                              boxShadow: isSelected ? 'inset 0 0 0 1px rgba(56, 189, 248, 0.3)' : 'none',
                              cursor: 'pointer',
                              transition: 'background 0.1s ease'
                            }}
                            onClick={() => setSelectedPartyId(p.id)}
                            onDoubleClick={() => startInlineEdit(p, 'name')}
                          >
                            <TableCell style={{ textAlign: 'center', color: '#52525b', fontSize: '11px', userSelect: 'none', padding: '4px 6px', position: 'relative' }}>
                              {globalIdx}
                              <div className="row-resizer" onMouseDown={handleRowResizeMouseDown} title="Drag to resize row height" />
                            </TableCell>
                            <TableCell style={{ padding: '2px 4px' }}>
                              {isEditing ? (
                                <input
                                  data-field="name"
                                  type="text"
                                  value={draft.name !== undefined ? draft.name : (p.name || '')}
                                  onChange={(e) => handleDraftChange('name', e.target.value)}
                                  style={{ ...cellInputStyle, fontWeight: 600 }}
                                  placeholder="Party Name"
                                  autoFocus
                                />
                              ) : (
                                <span
                                  style={{ ...cellTextStyle, fontWeight: 600 }}
                                  onDoubleClick={() => startInlineEdit(p, 'name')}
                                >
                                  {p.name}
                                </span>
                              )}
                            </TableCell>
                            <TableCell style={{ padding: '2px 4px' }}>
                              {isEditing ? (
                                <input
                                  data-field="phone"
                                  type="text"
                                  value={draft.phone !== undefined ? draft.phone : (p.phone || '')}
                                  onChange={(e) => handleDraftChange('phone', e.target.value)}
                                  style={cellInputStyle}
                                  placeholder="Phone"
                                />
                              ) : (
                                <span
                                  style={cellTextStyle}
                                  onDoubleClick={() => startInlineEdit(p, 'phone')}
                                >
                                  {p.phone || '—'}
                                </span>
                              )}
                            </TableCell>
                            <TableCell style={{ padding: '2px 4px' }}>
                              {isEditing ? (
                                <input
                                  data-field="station"
                                  type="text"
                                  value={draft.station !== undefined ? draft.station : (p.station || p.city || '')}
                                  onChange={(e) => handleDraftChange('station', e.target.value)}
                                  style={cellInputStyle}
                                  placeholder="Station"
                                />
                              ) : (
                                <span
                                  style={cellTextStyle}
                                  onDoubleClick={() => startInlineEdit(p, 'station')}
                                >
                                  {p.station || p.city || '—'}
                                </span>
                              )}
                            </TableCell>
                            <TableCell style={{ padding: '2px 4px' }}>
                              {isEditing ? (
                                <input
                                  data-field="district"
                                  type="text"
                                  value={draft.district !== undefined ? draft.district : (p.district || '')}
                                  onChange={(e) => handleDraftChange('district', e.target.value)}
                                  style={cellInputStyle}
                                  placeholder="District"
                                />
                              ) : (
                                <span
                                  style={cellTextStyle}
                                  onDoubleClick={() => startInlineEdit(p, 'district')}
                                >
                                  {p.district || '—'}
                                </span>
                              )}
                            </TableCell>
                            <TableCell style={{ padding: '2px 4px' }}>
                              {isEditing ? (
                                <input
                                  data-field="state"
                                  type="text"
                                  value={draft.state !== undefined ? draft.state : (p.state || '')}
                                  onChange={(e) => handleDraftChange('state', e.target.value)}
                                  style={cellInputStyle}
                                  placeholder="State"
                                />
                              ) : (
                                <span
                                  style={cellTextStyle}
                                  onDoubleClick={() => startInlineEdit(p, 'state')}
                                >
                                  {p.state || '—'}
                                </span>
                              )}
                            </TableCell>
                            <TableCell style={{ padding: '2px 4px' }}>
                              {isEditing ? (
                                <input
                                  data-field="pincode"
                                  type="text"
                                  value={draft.pincode !== undefined ? draft.pincode : (p.pincode || '')}
                                  onChange={(e) => handleDraftChange('pincode', e.target.value)}
                                  style={cellInputStyle}
                                  placeholder="Pincode"
                                />
                              ) : (
                                <span
                                  style={cellTextStyle}
                                  onDoubleClick={() => startInlineEdit(p, 'pincode')}
                                >
                                  {p.pincode || '—'}
                                </span>
                              )}
                            </TableCell>
                            <TableCell style={{ textAlign: 'center', padding: '4px 6px' }}>
                              {stat.count > 0 ? (
                                <span style={{ background: '#27272a', border: '1px solid #3f3f46', color: '#f4f4f5', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 500 }}>
                                  {stat.count}
                                </span>
                              ) : (
                                <span style={{ color: '#52525b', fontSize: '11px' }}>0</span>
                              )}
                            </TableCell>
                            <TableCell style={{ padding: '2px 4px', textAlign: 'right' }}>
                              {isEditing ? (
                                <input
                                  data-field="balance"
                                  type="number"
                                  value={draft.balance !== undefined ? draft.balance : (p.balance !== undefined ? p.balance : 0)}
                                  onChange={(e) => handleDraftChange('balance', parseFloat(e.target.value) || 0)}
                                  style={{
                                    ...cellInputStyle,
                                    fontWeight: 600,
                                    textAlign: 'right'
                                  }}
                                />
                              ) : (
                                <span
                                  style={{ ...cellTextStyle, textAlign: 'right', fontWeight: 600, color: (p.balance || 0) < 0 ? '#ef4444' : '#f4f4f5' }}
                                  onDoubleClick={() => startInlineEdit(p, 'balance')}
                                >
                                  {(p.balance !== undefined ? p.balance : 0).toLocaleString('en-IN')}
                                </span>
                              )}
                            </TableCell>
                            <TableCell style={{ textAlign: 'center', padding: '2px 6px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                {isEditing ? (
                                  <>
                                    <Tooltip title="Save Party (Enter)" side="bottom">
                                      <button
                                        type="button"
                                        style={{
                                          display: 'inline-flex', alignItems: 'center', gap: '4px',
                                          padding: '2px 10px', height: '24px', borderRadius: '4px',
                                          background: '#38bdf8', color: '#09090b',
                                          border: 'none', fontSize: '11px', fontWeight: 600,
                                          cursor: 'pointer'
                                        }}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleCommitInlineParty(p.id);
                                        }}
                                      >
                                        <Check size={11} /> Save
                                      </button>
                                    </Tooltip>
                                    <Tooltip title="Cancel Edit (Esc)" side="bottom">
                                      <button
                                        type="button"
                                        style={{
                                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                          width: '24px', height: '24px', borderRadius: '4px',
                                          background: '#27272a', color: '#a1a1aa',
                                          border: '1px solid #3f3f46', cursor: 'pointer'
                                        }}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleCancelInlineParty();
                                        }}
                                      >
                                        <X size={11} />
                                      </button>
                                    </Tooltip>
                                  </>
                                ) : (
                                  <Tooltip title="Edit Party Details (Enter)" side="bottom">
                                    <button
                                      type="button"
                                      style={{
                                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                        width: '24px', height: '24px', borderRadius: '4px',
                                        background: 'transparent', color: '#a1a1aa',
                                        border: '1px solid transparent', cursor: 'pointer',
                                        transition: 'all 0.12s ease'
                                      }}
                                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#3f3f46'; (e.currentTarget as HTMLButtonElement).style.color = '#f4f4f5'; }}
                                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = '#a1a1aa'; }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        startInlineEdit(p, 'name');
                                      }}
                                    >
                                      <Edit3 size={12} />
                                    </button>
                                  </Tooltip>
                                )}
                              </div>
                            </TableCell>

                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          {/* Shadcn Pagination Footer */}
          <ShadcnPagination
            idPrefix="parties-pagination"
            totalCount={filteredParties.length}
            pageSize={PARTIES_PER_PAGE}
            currentPage={partyCurrentPage}
            onPageChange={(newPage, targetRow) => {
              setPartyCurrentPage(newPage);
              setTimeout(() => {
                const nextList = filteredParties.slice((newPage - 1) * PARTIES_PER_PAGE, newPage * PARTIES_PER_PAGE);
                if (nextList.length > 0) {
                  const targetIdx = targetRow === 'last' ? nextList.length - 1 : 0;
                  setSelectedPartyId(nextList[targetIdx].id);
                  const el = partyRowRefs.current[nextList[targetIdx].id] || document.getElementById(`party-row-${nextList[targetIdx].id}`);
                  if (el) {
                    el.scrollIntoView({ block: 'nearest', behavior: 'auto' });
                    el.focus({ preventScroll: true });
                  }
                }
              }, 20);
            }}
            onFocusTableFirstRow={() => {
              if (paginatedParties.length > 0) {
                setSelectedPartyId(paginatedParties[0].id);
                document.getElementById(`party-row-${paginatedParties[0].id}`)?.scrollIntoView({ block: 'nearest' });
              }
            }}
            onFocusTableLastRow={() => {
              if (paginatedParties.length > 0) {
                setSelectedPartyId(paginatedParties[paginatedParties.length - 1].id);
                document.getElementById(`party-row-${paginatedParties[paginatedParties.length - 1].id}`)?.scrollIntoView({ block: 'nearest' });
              }
            }}
            style={{ borderRadius: '0' }}
          />
        </div>
      )}


      {/* ========================================================================= */}
      {/* TAB F6: SYSTEM CONTROL & DIAGNOSTICS */}
      {/* ========================================================================= */}
      {activeTab === 'F6' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, overflow: 'hidden' }}>
          <ControlPanelView />
        </div>
      )}

      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* TAB F8: STOCK INVENTORY (5 Comprehensive Tabs: Entry, Inward, Outward, Balance, Barcode) */}
      {/* ========================================================================= */}
      {activeTab === 'F8' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, overflow: 'hidden' }}>
          <StockInventoryView 
            onBackToBill={onBackToBill}
            onOpenBillDetails={(billId) => {
              const b = bills.find((x: any) => x.id === billId);
              if (b && onLoadBillToEditor) {
                onLoadBillToEditor(b);
              }
            }}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB F9: LEDGER / KHATA BAHI */}
      {/* ========================================================================= */}
      {activeTab === 'F9' && (
        <LedgerTabView
          onBackToBill={onBackToBill}
          onLoadBillToEditor={onLoadBillToEditor ? (id) => {
            const bill = bills.find(b => String(b.id) === String(id) || String(b.token) === String(id));
            if (bill) onLoadBillToEditor(bill);
          } : undefined}
        />
      )}


      {/* ========================================================================= */}
      {/* TAB F10: SYSTEM SETTINGS & WALLPAPER (BILLAPP MAIN.PY TAB-WISE SETTINGS)  */}
      {/* ========================================================================= */}
      {activeTab === 'F10' && (
        <SettingsTabView
          themeMode={themeMode}
          onChangeThemeMode={onChangeThemeMode}
          bgType={bgType}
          onChangeBgType={onChangeBgType}
          bgImage={bgImage}
          onSelectBgImage={onSelectBgImage}
          blurAmount={blurAmount}
          onChangeBlur={onChangeBlur}
          overlayOpacity={overlayOpacity}
          onChangeOpacity={onChangeOpacity}
          glassOpacity={glassOpacity}
          onChangeGlassOpacity={onChangeGlassOpacity}
        />
      )}

      {/* Bill Print & Estimate Center Modal for Historical Bills */}
      {isPrintModalOpen && selectedBill && (
        <BillPrintModal
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
          header={{
            docType: (selectedBill as any).type || (selectedBill as any).docType || 'Bill',
            partyName: selectedBill.party || 'CASH SALE',
            typeSelection: 'Regular',
            vehicleNo: selectedBill.vehicle,
            date: selectedBill.date,
            tokenNo: formatBillNumber(selectedBill.token || selectedBill.id)
          }}
          rawItems={displayRawItems.map((r, i) => ({
            ...r,
            id: String(i),
            name: r.name,
            partyCode: r.partyCode,
            qty: r.qty || 0,
            uCap: r.uCap || 0,
            lCap: r.lCap || 0
          }))}
          finishedItems={displayFinishedItems.map((f, i) => ({
            id: String(i),
            mould: f.mould,
            qty: f.qty,
            price: f.price,
            total: f.total
          }))}
          initialMode="estimate"
          billNo={formatBillNumber(selectedBill.token || selectedBill.id)}
          dynamicCols={f2AllSizeCols.filter(c => !c.isBase).map(c => ({ field: c.field, label: c.label }))}
          hasPartyCodeCol={
            selectedBill.hasPartyCodeCol !== undefined
              ? Boolean(selectedBill.hasPartyCodeCol)
              : (selectedBill.rawItems || []).some(r => r.partyCode && r.partyCode.trim() !== '')
          }
          editId={selectedBill.editId || (selectedBill.version ? `${selectedBill.lastModifiedBy || 'USER'}-${selectedBill.version}` : undefined)}
        />
      )}

      {/* Delete Bill Confirmation Modal */}
      {deleteConfirmBillId && (() => {
        const billToDelete = filteredBills.find(b => b.id === deleteConfirmBillId);
        if (!billToDelete) return null;
        const formattedDelToken = formatBillNumber(billToDelete.token);
        return (
          <UnsavedChangesModal
            billNumber={formattedDelToken}
            titleText={`Delete Bill #${formattedDelToken}?`}
            descText={`"${billToDelete.party}" ka yeh bill permanently delete ho jaayega. Kya aap sure hain?`}
            discardLabel="Haan, Delete Karo"
            onSave={undefined}
            onDiscard={async () => {
              // Confirmed: Permanently delete the bill from SQLite & state
              const targetId = deleteConfirmBillId;
              if (!targetId) return;
              const currentIdx = filteredBills.findIndex(b => b.id === targetId);
              try {
                macAudio.playTrash();
              } catch {
                macAudio.playClick();
              }
              setDeleteConfirmBillId(null);
              await deleteBill(targetId);

              // Auto-select next or previous bill after deletion
              setTimeout(() => {
                const remaining = filteredBills.filter(b => b.id !== targetId);
                if (remaining.length > 0) {
                  const nextIdx = Math.min(currentIdx, remaining.length - 1);
                  setSelectedBillId(remaining[nextIdx]?.id || remaining[0]?.id || '');
                } else {
                  setSelectedBillId('');
                }
              }, 100);
            }}
            onCancel={() => {
              macAudio.playHover();
              setDeleteConfirmBillId(null);
            }}
          />
        );
      })()}

      {partyToDelete && (
        <UnsavedChangesModal
          titleText="Delete Party Record?"
          descText={`Kya aap sach me party "${partyToDelete.name}" ko database se delete karna chahte hain? Isse party details permanently delete ho jayengi.`}
          discardLabel="Haan, Delete Karo"
          onDiscard={confirmDeleteParty}
          onCancel={() => setPartyToDelete(null)}
        />
      )}

      {/* iOS 3D Stack Party Detail Modal (Inspired by deepseek_html_20260930_5ff871.html) */}
      <PartyDetailStackModal
        isOpen={isPartyStackModalOpen}
        party={viewingPartyForStack}
        bills={bills}
        onClose={() => {
          setIsPartyStackModalOpen(false);
          setViewingPartyForStack(null);
        }}
        onSelectPartyForBill={onSelectPartyForBill}
      />

      {/* Real-time Bill Cell & Edit Audit History Modal */}
      <BillAuditHistoryModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        billId={selectedBill?.id || ''}
        billToken={String(selectedBill?.token || selectedBill?.id || '')}
        partyName={selectedBill?.party}
      />
    </div>
  );
};

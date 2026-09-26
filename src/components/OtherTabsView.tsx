import { ControlPanelView } from './ControlPanelView';
import { SettingsTabView } from './SettingsTabView';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { NavKey } from '../types';
import { macAudio } from '../utils/macAudio';
import { extractSizeFromColLabel } from '../utils/mouldUtils';
import { useDatabase } from '../context/DatabaseContext';
import { useSettings } from '../context/SettingsContext';
import type { BillRecord } from '../services/db/schema';
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
  Hash
} from 'lucide-react';

interface Props {
  activeTab: NavKey;
  onBackToBill: () => void;
  onLoadBillToEditor?: (bill: any) => void;
  onSelectPartyForBill?: (partyName: string) => void;
  bgType: 'image' | 'color' | 'video';
  onChangeBgType: (t: 'image' | 'color' | 'video') => void;
  bgImage: string;
  onSelectBgImage: (url: string) => void;
  bgVideo?: string;
  onSelectBgVideo?: (url: string) => void;
  bgColor: string;
  onChangeBgColor: (c: string) => void;
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
  onSetTableFontSize: _onSetTableFontSize
}) => {
  // Live reactive Database Context
  const { bills, parties, stockItems, ledgerEntries, saveParty, deleteParty } = useDatabase();
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

  // Search query for invoices in F2 tab
  const [billSearchQuery, setBillSearchQuery] = useState('');

  const filteredBills = useMemo(() => {
    const rawQ = billSearchQuery.trim();
    if (!rawQ) return bills;
    const cleanNum = rawQ.replace(/^(bill|slip|#)\s*/i, '').trim();
    const qLower = cleanNum.toLowerCase();
    return bills.filter(b => 
      b.token === cleanNum ||
      b.token.toLowerCase().includes(qLower) ||
      b.party.toLowerCase().includes(rawQ.toLowerCase()) ||
      b.date.includes(rawQ)
    );
  }, [bills, billSearchQuery]);

  // Selected Bill Id tracking
  const [selectedBillId, setSelectedBillId] = useState<string>('');
  const selectedBill = (selectedBillId ? filteredBills.find(b => b.id === selectedBillId) : null) || filteredBills[0] || bills[0] || {
    id: 'empty',
    token: '0',
    date: '2026-09-18',
    party: 'No Invoices',
    docType: 'SALE BILL',
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
          container.scrollTop += step;
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
          macAudio.playHover();
          if (f2FocusArea === 'bills') {
            const currentIdx = filteredBills.findIndex(b => b.id === selectedBill.id);
            if (currentIdx >= 0 && currentIdx + 1 < filteredBills.length) {
              setSelectedBillId(filteredBills[currentIdx + 1].id);
            }
          } else if (f2FocusArea === 'raw') {
            setSelectedRawRowIdx(prev => (prev + 1 < displayRawItems.length ? prev + 1 : prev));
          } else if (f2FocusArea === 'finished') {
            setSelectedFinishedRowIdx(prev => (prev + 1 < displayFinishedItems.length ? prev + 1 : prev));
          }
          return;
        }

        if (e.key === 'ArrowUp') {
          e.preventDefault();
          macAudio.playHover();
          if (f2FocusArea === 'bills') {
            const currentIdx = filteredBills.findIndex(b => b.id === selectedBill.id);
            if (currentIdx > 0) {
              setSelectedBillId(filteredBills[currentIdx - 1].id);
            }
          } else if (f2FocusArea === 'raw') {
            setSelectedRawRowIdx(prev => (prev - 1 >= 0 ? prev - 1 : 0));
          } else if (f2FocusArea === 'finished') {
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
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, f2FocusArea, filteredBills, selectedBill, onLoadBillToEditor, onBackToBill]);

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

  const [editingPartyId, setEditingPartyId] = useState<string | null>(null);

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

  // Filtered parties across name, phone, station, district, state, pincode, gstin - Newest first
  const filteredParties = useMemo(() => {
    const q = partySearchQuery.trim().toLowerCase();
    const sorted = [...parties].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    if (!q) return sorted;
    return sorted.filter(p => {
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

  // F5 Keyboard Navigation (Enter to edit/save, Delete key to delete row, Arrow keys to navigate)
  useEffect(() => {
    if (activeTab !== 'F5') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        if (e.key === 'Enter') {
          e.preventDefault();
          macAudio.playSuccess();
          handleStartNewParty();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          setEditingPartyId(null);
        }
        return;
      }

      if (paginatedParties.length === 0) return;
      const currentIndex = paginatedParties.findIndex(p => p.id === selectedPartyId);

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        macAudio.playHover();
        const nextIdx = currentIndex < paginatedParties.length - 1 ? currentIndex + 1 : currentIndex;
        setSelectedPartyId(paginatedParties[nextIdx].id);
        return;
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        macAudio.playHover();
        const prevIdx = currentIndex > 0 ? currentIndex - 1 : 0;
        setSelectedPartyId(paginatedParties[prevIdx].id);
        return;
      }

      if (e.key === 'Enter' || e.key === 'Insert') {
        e.preventDefault();
        handleStartNewParty();
        return;
      }

      if (e.key === 'F2') {
        e.preventDefault();
        if (selectedPartyId) {
          macAudio.playClick();
          setEditingPartyId(selectedPartyId);
        }
        return;
      }

      if (e.key === 'Delete') {
        e.preventDefault();
        if (selectedPartyId && currentIndex >= 0) {
          macAudio.playTrash();
          const targetId = selectedPartyId;
          const nextSelected = paginatedParties[currentIndex + 1] || paginatedParties[currentIndex - 1];
          setSelectedPartyId(nextSelected ? nextSelected.id : null);
          setEditingPartyId(null);
          deleteParty(targetId);
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, paginatedParties, selectedPartyId, editingPartyId, deleteParty]);

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

  const handleStartNewParty = async () => {
    const newId = `P-${Date.now()}`;
    const newRecord = {
      id: newId,
      name: 'NEW PARTY',
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
      updatedAt: Date.now() + 100000,
      synced: false
    };
    await saveParty(newRecord);
    setPartyCurrentPage(1);
    setSelectedPartyId(newId);
    setEditingPartyId(newId);
    macAudio.playSuccess();
  };

  const handleInlinePartyChange = async (party: any, field: string, value: any) => {
    const updated = {
      ...party,
      [field]: value,
      updatedAt: Date.now()
    };
    await saveParty(updated);
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

  const handleDeletePartyAction = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to remove party "${name}"?`)) {
      await deleteParty(id);
      showPartyToast(`Party "${name}" removed`);
      macAudio.playClick();
    }
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
        <div style={{ flex: 1, display: 'flex', gap: '8px', height: '100%', minHeight: 0 }}>
          {/* PANEL 1: Bill List / Navigator (Left 26%) */}
          <div 
            className="glass-panel" 
            style={{ 
              width: '26%', 
              display: 'flex', 
              flexDirection: 'column', 
              borderRadius: '8px', 
              padding: '6px',
              minHeight: 0,
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
              <span>SAVED INVOICES</span>
              <span style={{ color: '#38bdf8', fontSize: '10px' }}>{filteredBills.length} BILLS</span>
            </div>

            {/* Quick Bill Search Filter Input */}
            <div style={{ padding: '6px 4px', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Search size={12} style={{ position: 'absolute', left: '8px', color: '#94a3b8', pointerEvents: 'none' }} />
                <input
                  type="text"
                  placeholder="Search Bill # or Party..."
                  value={billSearchQuery}
                  onChange={e => setBillSearchQuery(e.target.value)}
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
                  style={{
                    width: '100%',
                    padding: '5px 8px 5px 24px',
                    fontSize: '11px',
                    borderRadius: '6px',
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#ffffff',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            {/* Smooth Scroll Container with Top/Bottom Gradient Masks */}
            <div className="scroll-list-container" style={{ position: 'relative', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
              <div className="top-gradient" />

              <div 
                ref={billsListRef}
                className="scroll-list"
                onMouseMove={handleBillsMouseMove}
                onMouseLeave={handleBillsMouseLeave}
                style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', scrollBehavior: 'smooth' }}
              >
              {filteredBills.map((b, idx) => {
                const isSelected = selectedBill.id === b.id;
                return (
                  <div
                    key={b.id}
                    ref={el => { billItemRefs.current[idx] = el; }}
                    onClick={() => {
                      macAudio.playClick();
                      setSelectedBillId(b.id);
                      setF2FocusArea('bills');
                    }}
                    onMouseEnter={() => {
                      macAudio.playHover();
                      setSelectedBillId(b.id);
                      setF2FocusArea('bills');
                    }}
                    onDoubleClick={() => {
                      if (onLoadBillToEditor) onLoadBillToEditor(b);
                    }}
                    style={{
                      padding: '8px 10px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      background: isSelected 
                        ? 'rgba(0, 122, 255, 0.22)' 
                        : 'rgba(255, 255, 255, 0.02)',
                      border: isSelected 
                        ? '1px solid rgba(56, 189, 248, 0.45)' 
                        : '1px solid rgba(255, 255, 255, 0.04)',
                      boxShadow: isSelected 
                        ? '0 2px 10px rgba(0, 122, 255, 0.25), inset 2px 0 0 #007aff' 
                        : 'none',
                      transition: 'all 0.12s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px' }}>
                      <span style={{ 
                        fontSize: '11px', 
                        fontWeight: 800, 
                        color: isSelected ? '#ffffff' : '#38bdf8' 
                      }}>
                        #{b.token}
                      </span>
                      <span style={{ fontSize: '10px', color: '#e2e8f0' }}>{b.date}</span>
                    </div>

                    <div style={{ 
                      fontSize: '12px', 
                      fontWeight: 600, 
                      color: isSelected ? '#ffffff' : '#f1f5f9',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {b.party}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                      <span style={{
                        fontSize: '9px',
                        fontWeight: 700,
                        padding: '1px 5px',
                        borderRadius: '3px',
                        background: b.docType === 'SALE BILL' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(52, 211, 153, 0.15)',
                        color: b.docType === 'SALE BILL' ? '#38bdf8' : '#34d399'
                      }}>
                        {b.docType}
                      </span>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#34d399' }}>
                        ₹{b.total.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                );
              })}
              </div>
              <div className="bottom-gradient" />
            </div>
          </div>

          {/* RIGHT 74%: Selected Bill Header & Dual Tables */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', minHeight: 0 }}>
            {/* Top Quick Status & Actions Bar (All buttons styled uniformly) */}
            <div 
              className="glass-panel" 
              style={{ 
                padding: '6px 12px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                borderRadius: '8px' 
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ color: '#f8fafc' }}>Token:</span>
                  <strong style={{ color: '#38bdf8' }}>#{selectedBill.token}</strong>
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
                  title="Load Bill into F1"
                >
                  <ExternalLink size={13} color="#38bdf8" />
                </button>
                <button
                  type="button"
                  className="mac-btn"
                  style={{ width: '28px', height: '28px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  title="Print Bill"
                  onClick={() => macAudio.playClick()}
                  onMouseEnter={() => macAudio.playHover()}
                >
                  <Printer size={13} color="#38bdf8" />
                </button>
                <button
                  type="button"
                  className="mac-btn"
                  style={{ width: '28px', height: '28px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  title="Export PDF"
                  onClick={() => macAudio.playClick()}
                  onMouseEnter={() => macAudio.playHover()}
                >
                  <Download size={13} color="#34d399" />
                </button>
              </div>
            </div>

            {/* DUAL TABLES CONTAINER: PANEL 2 (Left Table) + PANEL 3 (Right Table) */}
            <div style={{ flex: 1, display: 'flex', gap: '8px', minHeight: 0 }}>
              {/* PANEL 2: LEFT TABLE (Raw Materials / Input Specs) */}
              <div 
                className="glass-panel" 
                style={{ 
                  flex: 1, 
                  display: 'flex', 
                  flexDirection: 'column', 
                  borderRadius: '8px', 
                  padding: '6px',
                  minHeight: 0,
                  border: f2FocusArea === 'raw' ? '1px solid rgba(56, 189, 248, 0.4)' : undefined
                }}
                onClick={() => setF2FocusArea('raw')}
              >
                <div style={{ 
                  fontSize: '10.5px', 
                  fontWeight: 700, 
                  color: '#38bdf8', 
                  letterSpacing: '0.05em', 
                  padding: '3px 6px 5px 6px',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span>LEFT TABLE: RAW MATERIALS / INPUT</span>
                  <span style={{ color: '#e2e8f0', fontSize: '10px' }}>{displayRawItems.length} ITEMS</span>
                </div>

                <div style={{ flex: 1, overflow: 'auto', minHeight: 0, marginTop: '2px' }}>
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
                  </table>
                </div>

                {/* Left Table Bottom Total Footer */}
                <div style={{ 
                  padding: '6px 8px', 
                  background: 'rgba(0, 0, 0, 0.35)', 
                  borderRadius: '6px', 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  fontSize: '11px',
                  fontWeight: 600,
                  marginTop: 'auto',
                  flexWrap: 'wrap',
                  gap: '8px'
                }}>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                    {f2AllSizeCols.map(sc => {
                      const colTotal = displayRawItems.reduce((acc, r) => acc + (Number((r as any)[sc.field]) || 0), 0);
                      return (
                        <span key={sc.field}>
                          {sc.label}: <strong style={{ color: sc.isBase ? '#38bdf8' : '#34d399' }}>{colTotal}</strong>
                        </span>
                      );
                    })}
                    <span>UCap: <strong style={{ color: '#a78bfa' }}>{totalRawUCap}</strong></span>
                    <span>LCap: <strong style={{ color: '#f472b6' }}>{totalRawLCap}</strong></span>
                  </div>
                  <div style={{ marginLeft: 'auto', color: '#fbbf24', background: 'rgba(251, 191, 36, 0.12)', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(251, 191, 36, 0.3)' }}>
                    ALL TOTAL: <strong>{grandTotalAllCols}</strong>
                  </div>
                </div>
              </div>

              {/* PANEL 3: RIGHT TABLE (Finished Moulds / Commercials) */}
              <div 
                className="glass-panel" 
                style={{ 
                  flex: 1, 
                  display: 'flex', 
                  flexDirection: 'column', 
                  borderRadius: '8px', 
                  padding: '6px',
                  minHeight: 0,
                  border: f2FocusArea === 'finished' ? '1px solid rgba(56, 189, 248, 0.4)' : undefined
                }}
                onClick={() => setF2FocusArea('finished')}
              >
                <div style={{ 
                  fontSize: '10.5px', 
                  fontWeight: 700, 
                  color: '#34d399', 
                  letterSpacing: '0.05em', 
                  padding: '3px 6px 5px 6px',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span>RIGHT TABLE: GROUP TOTAL</span>
                  <span style={{ color: '#e2e8f0', fontSize: '10px' }}>{displayFinishedItems.length} MOULDS</span>
                </div>

                <div style={{ flex: 1, overflow: 'auto', minHeight: 0, marginTop: '2px' }}>
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
                  </table>
                </div>

                {/* Right Table Bottom Total Footer */}
                <div style={{ 
                  padding: '6px 8px', 
                  background: 'rgba(0, 0, 0, 0.35)', 
                  borderRadius: '6px', 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  fontSize: '11px',
                  fontWeight: 600,
                  marginTop: 'auto'
                }}>
                  <span style={{ color: '#e2e8f0' }}>Total Moulds: <strong style={{ color: '#a78bfa' }}>{totalFinishedQty} pcs</strong></span>
                  <span>Grand Total: <strong style={{ color: '#34d399', fontSize: '12px' }}>₹{totalFinishedAmount.toLocaleString('en-IN')}</strong></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB F3: EQUATION & PRODUCTION SIMULATOR */}
      {/* ========================================================================= */}
      {activeTab === 'F3' && (
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '8px', minHeight: 0 }}>
          {/* Equation Matrix */}
          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '8px', borderRadius: '8px', minHeight: 0 }}>
            <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
              <table className="apple-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ width: `${tableCols.f3Matrix.mouldName}px`, position: 'relative', userSelect: 'none' }}>
                      MOULD NAME
                      <div className="th-resizer" onMouseDown={(e) => startResizeCol('f3Matrix', 'mouldName', e)} title="Drag to resize column" />
                    </th>
                    <th style={{ width: `${tableCols.f3Matrix.stdWt}px`, textAlign: 'center', position: 'relative', userSelect: 'none' }}>
                      STD WT
                      <div className="th-resizer" onMouseDown={(e) => startResizeCol('f3Matrix', 'stdWt', e)} title="Drag to resize column" />
                    </th>
                    <th style={{ width: `${tableCols.f3Matrix.uCapRatio}px`, textAlign: 'center', position: 'relative', userSelect: 'none' }}>
                      U-CAP
                      <div className="th-resizer" onMouseDown={(e) => startResizeCol('f3Matrix', 'uCapRatio', e)} title="Drag to resize column" />
                    </th>
                    <th style={{ width: `${tableCols.f3Matrix.lCapRatio}px`, textAlign: 'center', position: 'relative', userSelect: 'none' }}>
                      L-CAP
                      <div className="th-resizer" onMouseDown={(e) => startResizeCol('f3Matrix', 'lCapRatio', e)} title="Drag to resize column" />
                    </th>
                    <th style={{ width: `${tableCols.f3Matrix.recoveryRate}px`, textAlign: 'center', position: 'relative', userSelect: 'none' }}>
                      YIELD
                      <div className="th-resizer" onMouseDown={(e) => startResizeCol('f3Matrix', 'recoveryRate', e)} title="Drag to resize column" />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {eqFormulas.map((eq) => {
                    const isSelected = selectedEqId === eq.id;
                    return (
                      <tr 
                        key={eq.id} 
                        className={`mac-table-row ${isSelected ? 'selected' : ''}`}
                        style={{ height: `${activeRowHeight}px` }}
                        onMouseEnter={() => macAudio.playHover()}
                        onClick={() => {
                          macAudio.playClick();
                          setSelectedEqId(eq.id);
                        }}
                      >
                        <td style={{ fontWeight: 600, color: '#f8fafc', position: 'relative' }}>
                          {eq.mouldName}
                          <div className="row-resizer" onMouseDown={handleRowResizeMouseDown} title="Drag to resize ALL row heights" />
                        </td>
                        <td style={{ textAlign: 'center', color: '#38bdf8', fontWeight: 700 }}>{eq.stdWt} kg</td>
                        <td style={{ textAlign: 'center', color: '#a78bfa' }}>{(eq.uCapRatio * 100).toFixed(0)}%</td>
                        <td style={{ textAlign: 'center', color: '#f472b6' }}>{(eq.lCapRatio * 100).toFixed(0)}%</td>
                        <td style={{ textAlign: 'center', color: '#34d399', fontWeight: 700 }}>{eq.recoveryRate}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Interactive Simulation Sandbox */}
          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '10px', borderRadius: '8px' }}>
            <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#fbbf24' }}>Batch Simulator</span>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#f8fafc', marginBottom: '2px' }}>
                  <span>Ingot Input:</span>
                  <strong style={{ color: '#38bdf8' }}>{calcInputKg} KG</strong>
                </div>
                <input
                  type="range"
                  min={10}
                  max={1000}
                  step={5}
                  value={calcInputKg}
                  onChange={(e) => setCalcInputKg(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#38bdf8' }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#f8fafc', marginBottom: '2px' }}>
                  <span>Upper Cap (%):</span>
                  <strong style={{ color: '#a78bfa' }}>{calcUCap}%</strong>
                </div>
                <input
                  type="range"
                  min={50}
                  max={100}
                  value={calcUCap}
                  onChange={(e) => setCalcUCap(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#a78bfa' }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#f8fafc', marginBottom: '2px' }}>
                  <span>Lower Cap (%):</span>
                  <strong style={{ color: '#f472b6' }}>{calcLCap}%</strong>
                </div>
                <input
                  type="range"
                  min={40}
                  max={95}
                  value={calcLCap}
                  onChange={(e) => setCalcLCap(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#f472b6' }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#f8fafc', marginBottom: '2px' }}>
                  <span>Density (g/cm³):</span>
                  <strong style={{ color: '#fbbf24' }}>{calcDensity}</strong>
                </div>
                <input
                  type="range"
                  min={2.4}
                  max={3.2}
                  step={0.05}
                  value={calcDensity}
                  onChange={(e) => setCalcDensity(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#fbbf24' }}
                />
              </div>
            </div>

            {/* Calculated Results */}
            <div style={{ marginTop: 'auto', background: 'rgba(0,0,0,0.3)', padding: '8px 10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                <div>
                  <span style={{ fontSize: '10px', color: '#e2e8f0' }}>Finished Output:</span>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#34d399' }}>{((calcInputKg * (calcUCap / 100) * (calcLCap / 100))).toFixed(1)} KG</div>
                </div>
                <div>
                  <span style={{ fontSize: '10px', color: '#e2e8f0' }}>Estimated Value:</span>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#38bdf8' }}>₹{Math.round(calcInputKg * 215 * 1.35).toLocaleString('en-IN')}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB F4: DATA PANEL & MASTER REGISTRY */}
      {/* ========================================================================= */}
      {activeTab === 'F4' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', minHeight: 0 }}>
          {/* Sub-tabs switch */}
          <div className="glass-panel" style={{ padding: '4px 8px', display: 'flex', gap: '6px', alignItems: 'center', borderRadius: '8px' }}>
            {(['SALES', 'RAW', 'MOULDS'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => {
                  macAudio.playClick();
                  setDataTab(tab);
                }}
                onMouseEnter={() => macAudio.playHover()}
                className={'mac-btn ' + (dataTab === tab ? 'active' : '')}
                style={{ fontSize: '11px', padding: '3px 10px', height: '24px' }}
              >
                {tab === 'SALES' ? 'Sales Log' : tab === 'RAW' ? 'Raw Materials' : 'Moulds Specs'}
              </button>
            ))}
          </div>

          {/* Sub-panel content */}
          <div className="glass-panel" style={{ flex: 1, minHeight: 0, overflow: 'auto', borderRadius: '8px', padding: '6px' }}>
            {dataTab === 'RAW' && (
              <table className="apple-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ width: `${tableCols.f4Raw.code}px`, position: 'relative', userSelect: 'none' }}>
                      CODE
                      <div className="th-resizer" onMouseDown={(e) => startResizeCol('f4Raw', 'code', e)} title="Drag to resize column" />
                    </th>
                    <th style={{ width: `${tableCols.f4Raw.name}px`, position: 'relative', userSelect: 'none' }}>
                      RAW MATERIAL NAME
                      <div className="th-resizer" onMouseDown={(e) => startResizeCol('f4Raw', 'name', e)} title="Drag to resize column" />
                    </th>
                    <th style={{ width: `${tableCols.f4Raw.unit}px`, textAlign: 'center', position: 'relative', userSelect: 'none' }}>
                      UNIT
                      <div className="th-resizer" onMouseDown={(e) => startResizeCol('f4Raw', 'unit', e)} title="Drag to resize column" />
                    </th>
                    <th style={{ width: `${tableCols.f4Raw.stock}px`, textAlign: 'right', position: 'relative', userSelect: 'none' }}>
                      STOCK
                      <div className="th-resizer" onMouseDown={(e) => startResizeCol('f4Raw', 'stock', e)} title="Drag to resize column" />
                    </th>
                    <th style={{ width: `${tableCols.f4Raw.reorder}px`, textAlign: 'right', position: 'relative', userSelect: 'none' }}>
                      REORDER
                      <div className="th-resizer" onMouseDown={(e) => startResizeCol('f4Raw', 'reorder', e)} title="Drag to resize column" />
                    </th>
                    <th style={{ width: `${tableCols.f4Raw.rate}px`, textAlign: 'right', position: 'relative', userSelect: 'none' }}>
                      RATE (₹)
                      <div className="th-resizer" onMouseDown={(e) => startResizeCol('f4Raw', 'rate', e)} title="Drag to resize column" />
                    </th>
                    <th style={{ width: `${tableCols.f4Raw.supplier}px`, position: 'relative', userSelect: 'none' }}>
                      SUPPLIER
                      <div className="th-resizer" onMouseDown={(e) => startResizeCol('f4Raw', 'supplier', e)} title="Drag to resize column" />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rawMaterials.map((rm) => {
                    const isSelected = selectedDataId === rm.id;
                    return (
                      <tr 
                        key={rm.id} 
                        className={`mac-table-row ${isSelected ? 'selected' : ''}`}
                        style={{ height: `${activeRowHeight}px` }}
                        onMouseEnter={() => macAudio.playHover()}
                        onClick={() => {
                          macAudio.playClick();
                          setSelectedDataId(rm.id);
                        }}
                      >
                        <td style={{ color: '#38bdf8', fontWeight: 700, position: 'relative' }}>
                          {rm.code}
                          <div className="row-resizer" onMouseDown={handleRowResizeMouseDown} title="Drag to resize ALL row heights" />
                        </td>
                        <td style={{ fontWeight: 600, color: '#f8fafc' }}>{rm.name}</td>
                        <td style={{ textAlign: 'center', color: '#e2e8f0' }}>{rm.unit}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: '#34d399' }}>{rm.stock.toLocaleString('en-IN')}</td>
                        <td style={{ textAlign: 'right', color: '#fbbf24' }}>{rm.reorder}</td>
                        <td style={{ textAlign: 'right', color: '#e2e8f0' }}>₹{rm.rate}</td>
                        <td style={{ color: '#f8fafc' }}>{rm.supplier}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            {dataTab === 'MOULDS' && (
              <table className="apple-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ width: `${tableCols.f4Moulds.code}px`, position: 'relative', userSelect: 'none' }}>
                      CODE
                      <div className="th-resizer" onMouseDown={(e) => startResizeCol('f4Moulds', 'code', e)} title="Drag to resize column" />
                    </th>
                    <th style={{ width: `${tableCols.f4Moulds.name}px`, position: 'relative', userSelect: 'none' }}>
                      MOULD NAME
                      <div className="th-resizer" onMouseDown={(e) => startResizeCol('f4Moulds', 'name', e)} title="Drag to resize column" />
                    </th>
                    <th style={{ width: `${tableCols.f4Moulds.cavities}px`, textAlign: 'center', position: 'relative', userSelect: 'none' }}>
                      CAVITIES
                      <div className="th-resizer" onMouseDown={(e) => startResizeCol('f4Moulds', 'cavities', e)} title="Drag to resize column" />
                    </th>
                    <th style={{ width: `${tableCols.f4Moulds.cycleSec}px`, textAlign: 'center', position: 'relative', userSelect: 'none' }}>
                      CYCLE TIME
                      <div className="th-resizer" onMouseDown={(e) => startResizeCol('f4Moulds', 'cycleSec', e)} title="Drag to resize column" />
                    </th>
                    <th style={{ width: `${tableCols.f4Moulds.maxTemp}px`, textAlign: 'center', position: 'relative', userSelect: 'none' }}>
                      MAX TEMP
                      <div className="th-resizer" onMouseDown={(e) => startResizeCol('f4Moulds', 'maxTemp', e)} title="Drag to resize column" />
                    </th>
                    <th style={{ width: `${tableCols.f4Moulds.status}px`, textAlign: 'center', position: 'relative', userSelect: 'none' }}>
                      STATUS
                      <div className="th-resizer" onMouseDown={(e) => startResizeCol('f4Moulds', 'status', e)} title="Drag to resize column" />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {mouldSpecs.map((m) => {
                    const isSelected = selectedDataId === m.id;
                    return (
                      <tr 
                        key={m.id} 
                        className={`mac-table-row ${isSelected ? 'selected' : ''}`}
                        style={{ height: `${activeRowHeight}px` }}
                        onMouseEnter={() => macAudio.playHover()}
                        onClick={() => {
                          macAudio.playClick();
                          setSelectedDataId(m.id);
                        }}
                      >
                        <td style={{ color: '#fbbf24', fontWeight: 700, position: 'relative' }}>
                          {m.code}
                          <div className="row-resizer" onMouseDown={handleRowResizeMouseDown} title="Drag to resize ALL row heights" />
                        </td>
                        <td style={{ fontWeight: 600, color: '#f8fafc' }}>{m.name}</td>
                        <td style={{ textAlign: 'center', color: '#38bdf8', fontWeight: 700 }}>{m.cavities}</td>
                        <td style={{ textAlign: 'center', color: '#f8fafc' }}>{m.cycleSec}s</td>
                        <td style={{ textAlign: 'center', color: '#f472b6' }}>{m.maxTemp}°C</td>
                        <td style={{ textAlign: 'center' }}>
                          <span style={{
                            fontSize: '9.5px',
                            fontWeight: 700,
                            padding: '1px 6px',
                            borderRadius: '9999px',
                            background: m.status === 'ACTIVE' ? 'rgba(52, 211, 153, 0.2)' : 'rgba(251, 191, 36, 0.2)',
                            color: m.status === 'ACTIVE' ? '#34d399' : '#fbbf24'
                          }}>
                            {m.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            {dataTab === 'SALES' && (
              <table className="apple-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ width: `${tableCols.f4Sales.bill}px`, textAlign: 'center', position: 'relative', userSelect: 'none' }}>
                      BILL #
                      <div className="th-resizer" onMouseDown={(e) => startResizeCol('f4Sales', 'bill', e)} title="Drag to resize column" />
                    </th>
                    <th style={{ width: `${tableCols.f4Sales.date}px`, position: 'relative', userSelect: 'none' }}>
                      DATE
                      <div className="th-resizer" onMouseDown={(e) => startResizeCol('f4Sales', 'date', e)} title="Drag to resize column" />
                    </th>
                    <th style={{ width: `${tableCols.f4Sales.item}px`, position: 'relative', userSelect: 'none' }}>
                      ITEM NAME
                      <div className="th-resizer" onMouseDown={(e) => startResizeCol('f4Sales', 'item', e)} title="Drag to resize column" />
                    </th>
                    <th style={{ width: `${tableCols.f4Sales.qty}px`, textAlign: 'center', position: 'relative', userSelect: 'none' }}>
                      QTY
                      <div className="th-resizer" onMouseDown={(e) => startResizeCol('f4Sales', 'qty', e)} title="Drag to resize column" />
                    </th>
                    <th style={{ width: `${tableCols.f4Sales.price}px`, textAlign: 'right', position: 'relative', userSelect: 'none' }}>
                      PRICE
                      <div className="th-resizer" onMouseDown={(e) => startResizeCol('f4Sales', 'price', e)} title="Drag to resize column" />
                    </th>
                    <th style={{ width: `${tableCols.f4Sales.total}px`, textAlign: 'right', position: 'relative', userSelect: 'none' }}>
                      TOTAL
                      <div className="th-resizer" onMouseDown={(e) => startResizeCol('f4Sales', 'total', e)} title="Drag to resize column" />
                    </th>
                    <th style={{ width: `${tableCols.f4Sales.party}px`, position: 'relative', userSelect: 'none' }}>
                      CUSTOMER
                      <div className="th-resizer" onMouseDown={(e) => startResizeCol('f4Sales', 'party', e)} title="Drag to resize column" />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { id: 'S-1', bill: '625', date: '2026-09-17', item: 'Mould 14x20 Standard Housing', qty: 15, price: 650, total: 9750, party: 'S.K. Die Castings' },
                    { id: 'S-2', bill: '625', date: '2026-09-17', item: 'Mould 18x24 Reinforced Casing', qty: 12, price: 920, total: 11040, party: 'S.K. Die Castings' },
                    { id: 'S-3', bill: '624', date: '2026-09-17', item: 'Die Core Cap 50mm Precision', qty: 8, price: 1250, total: 10000, party: 'Apex Industrial Moldings' },
                    { id: 'S-4', bill: '623', date: '2026-09-16', item: 'Heat Sink Fin Mount Extrusion', qty: 24, price: 750, total: 18000, party: 'Mahalaxmi Engineering' },
                    { id: 'S-5', bill: '622', date: '2026-09-16', item: 'Flange Coupling 120mm Alloy', qty: 10, price: 1505, total: 15050, party: 'Vikas Metal & Hardware' }
                  ].map((s) => {
                    const isSelected = selectedDataId === s.id;
                    return (
                      <tr 
                        key={s.id} 
                        className={`mac-table-row ${isSelected ? 'selected' : ''}`}
                        style={{ height: `${activeRowHeight}px` }}
                        onMouseEnter={() => macAudio.playHover()}
                        onClick={() => {
                          macAudio.playClick();
                          setSelectedDataId(s.id);
                        }}
                      >
                        <td style={{ textAlign: 'center', color: '#38bdf8', fontWeight: 700, position: 'relative' }}>
                          #{s.bill}
                          <div className="row-resizer" onMouseDown={handleRowResizeMouseDown} title="Drag to resize ALL row heights" />
                        </td>
                        <td style={{ color: '#f8fafc' }}>{s.date}</td>
                        <td style={{ fontWeight: 600, color: '#f8fafc' }}>{s.item}</td>
                        <td style={{ textAlign: 'center', color: '#a78bfa', fontWeight: 700 }}>{s.qty}</td>
                        <td style={{ textAlign: 'right', color: '#f8fafc' }}>₹{s.price}</td>
                        <td style={{ textAlign: 'right', color: '#34d399', fontWeight: 700 }}>₹{s.total.toLocaleString('en-IN')}</td>
                        <td style={{ color: '#e2e8f0' }}>{s.party}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB F5: PARTY DIRECTORY & BALANCES */}
      {/* ========================================================================= */}
      {activeTab === 'F5' && (
        <div
          className="glass-panel"
          style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, borderRadius: '8px', padding: '6px', overflow: 'hidden' }}
          onPaste={handleBulkPartyPaste}
        >
          {/* Search & Action Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', padding: '2px 4px' }}>
            <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
              <Search size={14} style={{ position: 'absolute', left: '8px', color: '#94a3b8', pointerEvents: 'none' }} />
              <input
                type="text"
                placeholder="Search parties by Name, Phone, Station, District, State, Pincode... (Direct in-table editing)"
                value={partySearchQuery}
                onChange={(e) => {
                  setPartySearchQuery(e.target.value);
                  setPartyCurrentPage(1);
                }}
                className="mac-input"
                style={{ width: '100%', height: '28px', paddingLeft: '28px', paddingRight: partySearchQuery ? '26px' : '8px', fontSize: '11px' }}
              />
              {partySearchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setPartySearchQuery('');
                    setPartyCurrentPage(1);
                  }}
                  style={{ position: 'absolute', right: '6px', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Total counter badge */}
            <div style={{ fontSize: '10.5px', fontWeight: 600, color: '#38bdf8', background: 'rgba(56,189,248,0.12)', padding: '4px 8px', borderRadius: '4px', whiteSpace: 'nowrap' }}>
              {filteredParties.length === parties.length
                ? `${parties.length.toLocaleString('en-IN')} Parties`
                : `${filteredParties.length.toLocaleString('en-IN')} / ${parties.length.toLocaleString('en-IN')}`}
            </div>

            {/* Bulk paste badge */}
            <div style={{ fontSize: '10px', color: '#a78bfa', background: 'rgba(167,139,250,0.1)', padding: '4px 8px', borderRadius: '4px', border: '1px solid rgba(167,139,250,0.2)', whiteSpace: 'nowrap' }}>
              📋 Paste Excel Data (Ctrl+V) directly into table
            </div>

            {/* Pagination controls */}
            {totalPartyPages > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                <button
                  type="button"
                  disabled={partyCurrentPage <= 1}
                  onClick={() => setPartyCurrentPage(p => Math.max(1, p - 1))}
                  className="mac-btn secondary"
                  style={{ height: '26px', padding: '0 6px', fontSize: '10px', opacity: partyCurrentPage <= 1 ? 0.4 : 1 }}
                  title="Previous Page"
                >
                  <ChevronLeft size={13} />
                </button>
                <span style={{ fontSize: '10px', color: '#cbd5e1', padding: '0 4px', whiteSpace: 'nowrap' }}>
                  {partyCurrentPage}/{totalPartyPages}
                </span>
                <button
                  type="button"
                  disabled={partyCurrentPage >= totalPartyPages}
                  onClick={() => setPartyCurrentPage(p => Math.min(totalPartyPages, p + 1))}
                  className="mac-btn secondary"
                  style={{ height: '26px', padding: '0 6px', fontSize: '10px', opacity: partyCurrentPage >= totalPartyPages ? 0.4 : 1 }}
                  title="Next Page"
                >
                  <ChevronRight size={13} />
                </button>
              </div>
            )}

            {/* New Party Button */}
            <button
              type="button"
              className="mac-btn primary"
              style={{ height: '26px', padding: '0 10px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}
              onClick={() => {
                macAudio.playClick();
                handleStartNewParty();
              }}
            >
              <Plus size={13} /> Add Party Row
            </button>
          </div>

          {/* Table Area */}
          <div style={{ flex: 1, minHeight: 0, overflow: 'auto', borderRadius: '4px' }}>
            <table className="apple-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: '#0f172a' }}>
                <tr>
                  <th style={{ width: `${tableCols.f5Parties.index}px`, textAlign: 'center', position: 'relative', userSelect: 'none' }}>
                    #
                    <div className="th-resizer" onMouseDown={(e) => startResizeCol('f5Parties', 'index', e)} title="Drag to resize" />
                  </th>
                  <th style={{ width: `${tableCols.f5Parties.name}px`, position: 'relative', userSelect: 'none' }}>
                    PARTY NAME
                    <div className="th-resizer" onMouseDown={(e) => startResizeCol('f5Parties', 'name', e)} title="Drag to resize" />
                  </th>
                  <th style={{ width: `${tableCols.f5Parties.phone}px`, position: 'relative', userSelect: 'none' }}>
                    PHONE NUMBER
                    <div className="th-resizer" onMouseDown={(e) => startResizeCol('f5Parties', 'phone', e)} title="Drag to resize" />
                  </th>
                  <th style={{ width: `${tableCols.f5Parties.station}px`, position: 'relative', userSelect: 'none' }}>
                    STATION
                    <div className="th-resizer" onMouseDown={(e) => startResizeCol('f5Parties', 'station', e)} title="Drag to resize" />
                  </th>
                  <th style={{ width: `${tableCols.f5Parties.district}px`, position: 'relative', userSelect: 'none' }}>
                    DISTRICT
                    <div className="th-resizer" onMouseDown={(e) => startResizeCol('f5Parties', 'district', e)} title="Drag to resize" />
                  </th>
                  <th style={{ width: `${tableCols.f5Parties.state}px`, position: 'relative', userSelect: 'none' }}>
                    STATE
                    <div className="th-resizer" onMouseDown={(e) => startResizeCol('f5Parties', 'state', e)} title="Drag to resize" />
                  </th>
                  <th style={{ width: `${tableCols.f5Parties.pincode}px`, position: 'relative', userSelect: 'none' }}>
                    PINCODE
                    <div className="th-resizer" onMouseDown={(e) => startResizeCol('f5Parties', 'pincode', e)} title="Drag to resize" />
                  </th>
                  <th style={{ width: `${tableCols.f5Parties.bills}px`, textAlign: 'center', position: 'relative', userSelect: 'none' }}>
                    BILLS
                    <div className="th-resizer" onMouseDown={(e) => startResizeCol('f5Parties', 'bills', e)} title="Drag to resize" />
                  </th>
                  <th style={{ width: `${tableCols.f5Parties.balance}px`, textAlign: 'right', position: 'relative', userSelect: 'none' }}>
                    BALANCE
                    <div className="th-resizer" onMouseDown={(e) => startResizeCol('f5Parties', 'balance', e)} title="Drag to resize" />
                  </th>
                  <th style={{ width: '65px', textAlign: 'center', position: 'relative', userSelect: 'none' }}>
                    ACTION
                  </th>
                </tr>
              </thead>
                <tbody>
                  {paginatedParties.length === 0 ? (
                    <tr>
                      <td colSpan={10} style={{ textAlign: 'center', padding: '30px 10px', color: '#94a3b8', fontSize: '12px' }}>
                        No parties match "{partySearchQuery}". Click "Add Party Row" or paste Excel rows (Ctrl+V).
                      </td>
                    </tr>
                  ) : (
                    paginatedParties.map((p, idx) => {
                      const globalIdx = (partyCurrentPage - 1) * PARTIES_PER_PAGE + idx + 1;
                      const pNameKey = (p.name || '').trim().toLowerCase();
                      const stat = partyBillStats[pNameKey] || { count: 0, total: 0 };
                      const isSelected = selectedPartyId === p.id;
                      const isEditing = editingPartyId === p.id;

                      const cellInputStyle: React.CSSProperties = {
                        width: '100%',
                        background: 'rgba(15, 23, 42, 0.6)',
                        border: '1px solid rgba(56, 189, 248, 0.4)',
                        outline: 'none',
                        color: '#f8fafc',
                        fontSize: '11px',
                        padding: '3px 6px',
                        fontFamily: 'inherit',
                        borderRadius: '4px'
                      };

                      const cellTextStyle: React.CSSProperties = {
                        padding: '3px 6px',
                        display: 'block',
                        userSelect: 'text',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      };

                      return (
                        <tr
                          key={p.id || idx}
                          className={`mac-table-row ${isSelected ? 'selected' : ''}`}
                          style={{ height: `${activeRowHeight}px` }}
                          onClick={() => setSelectedPartyId(p.id)}
                          onDoubleClick={() => setEditingPartyId(p.id)}
                        >
                          <td style={{ textAlign: 'center', color: '#94a3b8', fontSize: '10px', position: 'relative' }}>
                            {globalIdx}
                            <div className="row-resizer" onMouseDown={handleRowResizeMouseDown} title="Drag to resize row height" />
                          </td>
                          <td style={{ padding: '1px' }}>
                            {isEditing ? (
                              <input
                                type="text"
                                value={p.name || ''}
                                onChange={(e) => handleInlinePartyChange(p, 'name', e.target.value)}
                                style={{ ...cellInputStyle, color: '#38bdf8', fontWeight: 600 }}
                                autoFocus
                              />
                            ) : (
                              <span style={{ ...cellTextStyle, color: '#38bdf8', fontWeight: 600 }}>{p.name}</span>
                            )}
                          </td>
                          <td style={{ padding: '1px' }}>
                            {isEditing ? (
                              <input
                                type="text"
                                value={p.phone || ''}
                                onChange={(e) => handleInlinePartyChange(p, 'phone', e.target.value)}
                                style={{ ...cellInputStyle, color: '#93c5fd', fontFamily: 'monospace' }}
                              />
                            ) : (
                              <span style={{ ...cellTextStyle, color: '#93c5fd', fontFamily: 'monospace' }}>{p.phone || '-'}</span>
                            )}
                          </td>
                          <td style={{ padding: '1px' }}>
                            {isEditing ? (
                              <input
                                type="text"
                                value={p.station || p.city || ''}
                                onChange={(e) => handleInlinePartyChange(p, 'station', e.target.value)}
                                style={{ ...cellInputStyle, color: '#e2e8f0' }}
                              />
                            ) : (
                              <span style={{ ...cellTextStyle, color: '#e2e8f0' }}>{p.station || p.city || '-'}</span>
                            )}
                          </td>
                          <td style={{ padding: '1px' }}>
                            {isEditing ? (
                              <input
                                type="text"
                                value={p.district || ''}
                                onChange={(e) => handleInlinePartyChange(p, 'district', e.target.value)}
                                style={{ ...cellInputStyle, color: '#cbd5e1' }}
                              />
                            ) : (
                              <span style={{ ...cellTextStyle, color: '#cbd5e1' }}>{p.district || '-'}</span>
                            )}
                          </td>
                          <td style={{ padding: '1px' }}>
                            {isEditing ? (
                              <input
                                type="text"
                                value={p.state || ''}
                                onChange={(e) => handleInlinePartyChange(p, 'state', e.target.value)}
                                style={{ ...cellInputStyle, color: '#94a3b8' }}
                              />
                            ) : (
                              <span style={{ ...cellTextStyle, color: '#94a3b8' }}>{p.state || '-'}</span>
                            )}
                          </td>
                          <td style={{ padding: '1px' }}>
                            {isEditing ? (
                              <input
                                type="text"
                                value={p.pincode || ''}
                                onChange={(e) => handleInlinePartyChange(p, 'pincode', e.target.value)}
                                style={{ ...cellInputStyle, color: '#94a3b8', fontFamily: 'monospace' }}
                              />
                            ) : (
                              <span style={{ ...cellTextStyle, color: '#94a3b8', fontFamily: 'monospace' }}>{p.pincode || '-'}</span>
                            )}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            {stat.count > 0 ? (
                              <span style={{ background: 'rgba(56,189,248,0.16)', color: '#38bdf8', padding: '1px 6px', borderRadius: '10px', fontSize: '9.5px', fontWeight: 600 }}>
                                {stat.count} bills
                              </span>
                            ) : (
                              <span style={{ color: '#475569', fontSize: '9.5px' }}>0</span>
                            )}
                          </td>
                          <td style={{ padding: '1px', textAlign: 'right' }}>
                            {isEditing ? (
                              <input
                                type="number"
                                value={p.balance !== undefined ? p.balance : 0}
                                onChange={(e) => handleInlinePartyChange(p, 'balance', parseFloat(e.target.value) || 0)}
                                style={{
                                  ...cellInputStyle,
                                  color: (p.balance || 0) >= 0 ? '#34d399' : '#f87171',
                                  fontWeight: 600,
                                  textAlign: 'right'
                                }}
                              />
                            ) : (
                              <span style={{ ...cellTextStyle, textAlign: 'right', fontWeight: 600, color: (p.balance || 0) >= 0 ? '#34d399' : '#f87171' }}>
                                {p.balance !== undefined ? p.balance : 0}
                              </span>
                            )}
                          </td>
                          <td style={{ textAlign: 'center', padding: '1px' }}>
                            {isEditing ? (
                              <button
                                type="button"
                                className="mac-btn primary"
                                style={{ padding: '2px 8px', height: '22px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '3px', margin: '0 auto' }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  macAudio.playSuccess();
                                  setEditingPartyId(null);
                                }}
                                title="Save Changes"
                              >
                                <Check size={12} /> Save
                              </button>
                            ) : null}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Bottom Status strip */}
          <div style={{ marginTop: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10px', color: '#64748b', padding: '2px 4px' }}>
            <span>Showing {paginatedParties.length} of {filteredParties.length} filtered ({parties.length.toLocaleString('en-IN')} total in Database) • All cell changes auto-save immediately</span>
            <span style={{ color: '#38bdf8' }}>💡 Tip: Copy columns from Excel and press Ctrl+V anywhere to bulk import!</span>
          </div>
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
      {/* TAB F8: STOCK INVENTORY & BARCODE (Sleek Dark Glass Barcode Card) */}
      {/* ========================================================================= */}
      {activeTab === 'F8' && (
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '8px', minHeight: 0 }}>
          {/* Stock Table */}
          <div className="glass-panel" style={{ flex: 1, minHeight: 0, overflow: 'auto', borderRadius: '8px', padding: '6px' }}>
            <table className="apple-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ width: `${tableCols.f8Stock.code}px`, position: 'relative', userSelect: 'none' }}>
                    CODE
                    <div className="th-resizer" onMouseDown={(e) => startResizeCol('f8Stock', 'code', e)} title="Drag to resize column" />
                  </th>
                  <th style={{ width: `${tableCols.f8Stock.name}px`, position: 'relative', userSelect: 'none' }}>
                    ITEM NAME
                    <div className="th-resizer" onMouseDown={(e) => startResizeCol('f8Stock', 'name', e)} title="Drag to resize column" />
                  </th>
                  <th style={{ width: `${tableCols.f8Stock.qty}px`, textAlign: 'right', position: 'relative', userSelect: 'none' }}>
                    QTY
                    <div className="th-resizer" onMouseDown={(e) => startResizeCol('f8Stock', 'qty', e)} title="Drag to resize column" />
                  </th>
                  <th style={{ width: `${tableCols.f8Stock.rack}px`, textAlign: 'center', position: 'relative', userSelect: 'none' }}>
                    RACK
                    <div className="th-resizer" onMouseDown={(e) => startResizeCol('f8Stock', 'rack', e)} title="Drag to resize column" />
                  </th>
                  <th style={{ width: `${tableCols.f8Stock.status}px`, textAlign: 'center', position: 'relative', userSelect: 'none' }}>
                    STATUS
                    <div className="th-resizer" onMouseDown={(e) => startResizeCol('f8Stock', 'status', e)} title="Drag to resize column" />
                  </th>
                </tr>
              </thead>
              <tbody>
                {stockItems.map((s) => {
                  const isSelected = selectedStockId === s.id;
                  return (
                    <tr 
                      key={s.id} 
                      className={`mac-table-row ${isSelected ? 'selected' : ''}`}
                      style={{ height: `${activeRowHeight}px` }}
                      onMouseEnter={() => macAudio.playHover()}
                      onClick={() => {
                        macAudio.playClick();
                        setSelectedStockId(s.id);
                      }}
                    >
                      <td style={{ color: '#38bdf8', fontWeight: 700, position: 'relative' }}>
                        {s.code}
                        <div className="row-resizer" onMouseDown={handleRowResizeMouseDown} title="Drag to resize ALL row heights" />
                      </td>
                      <td style={{ fontWeight: 600, color: '#f8fafc' }}>{s.name}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: s.status === 'CRITICAL' ? '#f87171' : '#34d399' }}>
                        {s.qty} {s.uom}
                      </td>
                      <td style={{ textAlign: 'center', color: '#f8fafc', fontFamily: 'monospace' }}>{s.rack}</td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{
                          fontSize: '9.5px',
                          fontWeight: 700,
                          padding: '1px 6px',
                          borderRadius: '9999px',
                          background: s.status === 'IN STOCK' ? 'rgba(52, 211, 153, 0.2)' : s.status === 'LOW STOCK' ? 'rgba(251, 191, 36, 0.2)' : 'rgba(248, 113, 113, 0.2)',
                          color: s.status === 'IN STOCK' ? '#34d399' : s.status === 'LOW STOCK' ? '#fbbf24' : '#f87171'
                        }}>
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Barcode / QR Generator Preview Card (Dark Liquid Glass Theme) */}
          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '10px', borderRadius: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#fb923c', alignSelf: 'flex-start' }}>Barcode Label</span>

            <div style={{ 
              background: 'rgba(0, 0, 0, 0.45)', 
              border: '1px solid rgba(255, 255, 255, 0.08)',
              padding: '12px', 
              borderRadius: '8px', 
              width: '190px', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              gap: '4px', 
              margin: 'auto' 
            }}>
              <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#f8fafc' }}>APEX INDUSTRIAL</div>
              <div style={{ fontFamily: 'monospace', fontSize: '22px', letterSpacing: '2px', fontWeight: 900, color: '#38bdf8' }}>|||| | ||||| ||</div>
              <div style={{ fontSize: '9.5px', fontFamily: 'monospace', color: '#e2e8f0' }}>*STK-01-MLD1420*</div>
            </div>

            <button type="button" className="mac-btn primary" style={{ width: '100%', padding: '6px', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }} onClick={() => macAudio.playClick()} onMouseEnter={() => macAudio.playHover()}>
              <Printer size={13} />
              <span>Print Barcode</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB F9: LEDGER / KHATA BAHI */}
      {/* ========================================================================= */}
      {activeTab === 'F9' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', minHeight: 0 }}>
          {/* Party Selector & Balance Ribbon */}
          <div className="glass-panel" style={{ padding: '4px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <select
                value={selectedLedgerParty}
                onChange={(e) => {
                  macAudio.playClick();
                  setSelectedLedgerParty(e.target.value);
                }}
                className="mac-input"
                style={{ height: '26px', fontSize: '11px', fontWeight: 600, minWidth: '220px' }}
              >
                {parties.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} ({p.city})</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '12px', fontSize: '11px' }}>
              <div><span style={{ color: '#e2e8f0' }}>Dr:</span> <strong style={{ color: '#38bdf8' }}>₹2,95,200</strong></div>
              <div><span style={{ color: '#e2e8f0' }}>Cr:</span> <strong style={{ color: '#34d399' }}>₹1,50,000</strong></div>
              <div><span style={{ color: '#e2e8f0' }}>Net:</span> <strong style={{ color: '#34d399' }}>₹1,45,200 Dr</strong></div>
            </div>
          </div>

          {/* Statement of Account Table */}
          <div className="glass-panel" style={{ flex: 1, minHeight: 0, overflow: 'auto', borderRadius: '8px', padding: '6px' }}>
            <table className="apple-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ width: `${tableCols.f9Ledger.date}px`, position: 'relative', userSelect: 'none' }}>
                    DATE
                    <div className="th-resizer" onMouseDown={(e) => startResizeCol('f9Ledger', 'date', e)} title="Drag to resize column" />
                  </th>
                  <th style={{ width: `${tableCols.f9Ledger.type}px`, position: 'relative', userSelect: 'none' }}>
                    TYPE
                    <div className="th-resizer" onMouseDown={(e) => startResizeCol('f9Ledger', 'type', e)} title="Drag to resize column" />
                  </th>
                  <th style={{ width: `${tableCols.f9Ledger.voucher}px`, position: 'relative', userSelect: 'none' }}>
                    VOUCHER #
                    <div className="th-resizer" onMouseDown={(e) => startResizeCol('f9Ledger', 'voucher', e)} title="Drag to resize column" />
                  </th>
                  <th style={{ width: `${tableCols.f9Ledger.particulars}px`, position: 'relative', userSelect: 'none' }}>
                    PARTICULARS
                    <div className="th-resizer" onMouseDown={(e) => startResizeCol('f9Ledger', 'particulars', e)} title="Drag to resize column" />
                  </th>
                  <th style={{ width: `${tableCols.f9Ledger.debit}px`, textAlign: 'right', position: 'relative', userSelect: 'none' }}>
                    DEBIT (₹)
                    <div className="th-resizer" onMouseDown={(e) => startResizeCol('f9Ledger', 'debit', e)} title="Drag to resize column" />
                  </th>
                  <th style={{ width: `${tableCols.f9Ledger.credit}px`, textAlign: 'right', position: 'relative', userSelect: 'none' }}>
                    CREDIT (₹)
                    <div className="th-resizer" onMouseDown={(e) => startResizeCol('f9Ledger', 'credit', e)} title="Drag to resize column" />
                  </th>
                  <th style={{ width: `${tableCols.f9Ledger.balance}px`, textAlign: 'right', position: 'relative', userSelect: 'none' }}>
                    BALANCE (₹)
                    <div className="th-resizer" onMouseDown={(e) => startResizeCol('f9Ledger', 'balance', e)} title="Drag to resize column" />
                  </th>
                </tr>
              </thead>
              <tbody>
                {ledgerEntries.map((l) => {
                  const isSelected = selectedLedgerRowId === l.id;
                  return (
                    <tr 
                      key={l.id} 
                      className={`mac-table-row ${isSelected ? 'selected' : ''}`}
                      style={{ height: `${activeRowHeight}px` }}
                      onMouseEnter={() => macAudio.playHover()}
                      onClick={() => {
                        macAudio.playClick();
                        setSelectedLedgerRowId(l.id);
                      }}
                    >
                      <td style={{ color: '#f8fafc', position: 'relative' }}>
                        {l.date}
                        <div className="row-resizer" onMouseDown={handleRowResizeMouseDown} title="Drag to resize ALL row heights" />
                      </td>
                      <td>
                        <span style={{
                          fontSize: '9.5px',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: l.type === 'SALE BILL' ? 'rgba(56, 189, 248, 0.15)' : l.type === 'PAYMENT' ? 'rgba(52, 211, 153, 0.15)' : 'rgba(161, 161, 170, 0.15)',
                          color: l.type === 'SALE BILL' ? '#38bdf8' : l.type === 'PAYMENT' ? '#34d399' : '#a1a1aa'
                        }}>
                          {l.type}
                        </span>
                      </td>
                      <td style={{ color: '#38bdf8', fontFamily: 'monospace', fontWeight: 600 }}>{l.voucher}</td>
                      <td style={{ fontWeight: 500, color: '#f8fafc' }}>{l.particulars}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: l.debit > 0 ? '#38bdf8' : '#64748b' }}>
                        {l.debit > 0 ? `₹${l.debit.toLocaleString('en-IN')}` : '-'}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: l.credit > 0 ? '#34d399' : '#64748b' }}>
                        {l.credit > 0 ? `₹${l.credit.toLocaleString('en-IN')}` : '-'}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: '#f8fafc' }}>
                        ₹{l.balance.toLocaleString('en-IN')} Dr
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB F10: SYSTEM SETTINGS & WALLPAPER (BILLAPP MAIN.PY TAB-WISE SETTINGS)  */}
      {/* ========================================================================= */}
      {activeTab === 'F10' && (
        <SettingsTabView
          bgType={bgType}
          onChangeBgType={onChangeBgType}
          bgImage={bgImage}
          onSelectBgImage={onSelectBgImage}
          bgVideo={bgVideo || ''}
          onSelectBgVideo={onSelectBgVideo || (() => {})}
          bgColor={bgColor}
          onChangeBgColor={onChangeBgColor}
          blurAmount={blurAmount}
          onChangeBlur={onChangeBlur}
          overlayOpacity={overlayOpacity}
          onChangeOpacity={onChangeOpacity}
          glassOpacity={glassOpacity}
          onChangeGlassOpacity={onChangeGlassOpacity}
        />
      )}
    </div>
  );
};

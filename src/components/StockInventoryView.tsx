import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AnimatedCounter } from './common/AnimatedCounter';
import { 
  Package, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Scale, 
  Barcode, 
  Plus, 
  Trash2, 
  Save, 
  RotateCcw, 
  Search, 
  FileSpreadsheet, 
  Printer, 
  Eye, 
  CheckSquare, 
  Square, 
  Sparkles, 
  Layers, 
  CheckCircle2, 
  AlertCircle,
  Calendar,
  X,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  PlusCircle,
  Columns,
  FileText,
  ShoppingCart,
  ArrowRightLeft,
  PackagePlus,
  SlidersHorizontal
} from 'lucide-react';
import { localDb } from '../services/db/localDb';
import type { BillRecord } from '../services/db/schema';
import { SQLITE_CONTROL_CONVERSIONS } from '../data/sqliteControlPanel';
import { useItemMode } from '../context/ItemModeContext';
import { resolveItemNameWithMode } from '../utils/itemExpansion';
import { macAudio } from '../utils/macAudio';
import UnsavedChangesModal from './UnsavedChangesModal';
import {
  loadBarcodeConfig,
  generateCode128SvgBars,
  generateQrMatrix,
  generateTsplCommand,
  generateZplCommand,
  downloadThermalScriptFile,
  parseWeighingScaleBarcode
} from '../utils/barcodeConfigHelper';
import {
  Button as ShadcnButton,
  Input as ShadcnInput,
  Card as ShadcnCard,
  CardHeader as ShadcnCardHeader,
  CardTitle as ShadcnCardTitle,
  CardDescription as ShadcnCardDescription,
  CardContent as ShadcnCardContent,
  Tabs as ShadcnTabs,
  TabsList as ShadcnTabsList,
  TabsTrigger as ShadcnTabsTrigger,
  Badge as ShadcnBadge,
  Label as ShadcnLabel,
  Separator as ShadcnSeparator,
  Select as ShadcnSelect,
  Pagination as ShadcnPagination,
  DatePicker as ShadcnDatePicker,
  Tooltip as ShadcnTooltip
} from './ui/shadcn';
import { useTableKeyboardNavigation } from '../hooks/useTableKeyboardNavigation';
import { ExcelCsvActions, type CsvColumnDef } from './common/ExcelCsvActions';


// =========================================================================
// TYPES & DATA CONTRACTS
// =========================================================================

export type StockInnerTab = 'entry' | 'inward' | 'outward' | 'balance' | 'barcode';

export interface StockDynamicCol {
  field: string;
  label: string;
  sizeNum: number;
}

export interface StockVoucherItem {
  id: string;
  name: string;
  qty: number; // Main column (10 FT)
  uCap: number;
  lCap: number;
  price?: number;
  total?: number;
  uom?: string;
  partyCode?: string;
  [key: string]: any; // Allow dynamic size columns like col_12ft, col_9_5ft, etc.
}

export interface StockVoucher {
  id: number;
  voucherNo: string;
  date: string;
  partyName: string;
  remarks: string;
  items: StockVoucherItem[];
  dynamicCols?: StockDynamicCol[];
  createdAt: number;
  updatedAt: number;
}

export interface OutwardStockItem {
  id: string;
  billId: string;
  token: string;
  docType: string;
  date: string;
  party: string;
  name: string;
  qty: number;
  uCap: number;
  lCap: number;
  sizeLabel: string;
}

export interface StockBalanceRow {
  itemName: string;
  category: string;
  inwardQty: number;
  outwardQty: number;
  balanceQty: number;
  inwardUCap: number;
  outwardUCap: number;
  balanceUCap: number;
  inwardLCap: number;
  outwardLCap: number;
  balanceLCap: number;
  status: 'IN STOCK' | 'LOW STOCK' | 'NEGATIVE' | 'ZERO';
}

export interface BarcodeItemState {
  itemName: string;
  category: string;
  qty: number;
  qtyChecked: boolean;
  uCapName: string;
  uCapQty: number;
  uCapChecked: boolean;
  lCapName: string;
  lCapQty: number;
  lCapChecked: boolean;
}

// Storage keys
const STOCK_VOUCHERS_KEY = 'modern_stock_vouchers';
const STOCK_COUNTER_KEY = 'modern_stock_voucher_counter';
const STOCK_DYNCOLS_KEY = 'modern_stock_dyncols';

// Helper: Extract clean base name without size e.g. "B.F.P 154 ((12FT)FT)" or "C M 161 (10FT)" -> "B.F.P 154"
export function extractBaseItemName(name: string): string {
  if (!name) return '';
  return name.replace(/\s*\(+[\d.]+\s*(?:FT|FEET)?\s*\)*(?:FT)?\s*\)*/gi, '').trim();
}

// Helper: Normalize item name with size e.g. "B.F.P 154", "(12 FT)" -> "B.F.P 154 (12FT)"
export function formatItemWithSize(rawName: string, sizeLabel?: string): string {
  const trimmed = (rawName || '').trim();
  if (!trimmed) return '';

  const baseName = extractBaseItemName(trimmed);

  // Extract clean numeric size e.g. "(12 FT)" -> "12", "12FT" -> "12", "10" -> "10"
  let sizeNum = '';
  if (sizeLabel) {
    sizeNum = sizeLabel.replace(/[^\d.]/g, '').trim();
  }

  if (!sizeNum) {
    // Check if rawName had a size inside parentheses e.g. "B.F.P 154 ((12FT)FT)" or "(12FT)"
    const match = trimmed.match(/\(+([\d.]+)/);
    if (match && match[1]) {
      sizeNum = match[1];
    }
  }

  // Fallback to 10 if no size found
  if (!sizeNum) {
    sizeNum = '10';
  }

  return `${baseName} (${sizeNum}FT)`;
}

// Helper: Extract size e.g. "C M 161 (10FT)" -> "10 FT", "Item (12 FT)" -> "12 FT"
export function extractSizeFromItem(name: string): string {
  if (!name) return '10 FT';
  const match = name.match(/\(+([\d.]+)/);
  if (match && match[1]) {
    return `${match[1]} FT`;
  }
  return '10 FT';
}

// Helper: Extract category prefix (first word)
export function getCategoryPrefix(name: string): string {
  const parts = name.trim().split(' ');
  return parts.length > 0 && parts[0] ? parts[0].toUpperCase() : 'GENERAL';
}

// =========================================================================
// MAIN STOCK INVENTORY COMPONENT
// =========================================================================

interface StockInventoryViewProps {
  onBackToBill?: () => void;
  onOpenBillDetails?: (billId: string) => void;
  showToast?: (message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
}

export const StockInventoryView: React.FC<StockInventoryViewProps> = ({
  onBackToBill,
  onOpenBillDetails,
  showToast = (msg) => console.log(msg)
}) => {
  // Navigation & Sub-Tabs
  const [activeTab, setActiveTab] = useState<StockInnerTab>('entry');

  // --- TAB 1: ENTER STOCK STATE ---
  const [editingVoucherId, setEditingVoucherId] = useState<number | null>(null);
  const [voucherToDelete, setVoucherToDelete] = useState<number | null>(null);
  const [voucherDate, setVoucherDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [voucherRemarks, setVoucherRemarks] = useState<string>('');
  const [loadVoucherIdInput, setLoadVoucherIdInput] = useState<string>('');
  const [barcodeScanInput, setBarcodeScanInput] = useState<string>('');

  // Multi-Column Dynamic Size Columns for Enter Stock (Just like Bill UI!)
  const [dynamicCols, setDynamicCols] = useState<StockDynamicCol[]>(() => {
    try {
      const saved = localStorage.getItem(STOCK_DYNCOLS_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      { field: 'col_12ft', label: '(12 FT)', sizeNum: 12 }
    ];
  });

  // Save dynamic columns layout
  useEffect(() => {
    try {
      localStorage.setItem(STOCK_DYNCOLS_KEY, JSON.stringify(dynamicCols));
    } catch {}
  }, [dynamicCols]);

  // Modal / Popup state to add a custom size column
  const [isAddColModalOpen, setIsAddColModalOpen] = useState<boolean>(false);
  const [newColSizeInput, setNewColSizeInput] = useState<string>('');

  // Smart Toggles (Auto-Convert, Auto-Item, Simple Mode) synced globally
  const { autoConvert, autoItem, simpleMode, handleToggle } = useItemMode();

  // Dynamic Item Rows for Voucher
  const [stockRows, setStockRows] = useState<StockVoucherItem[]>([
    { id: 'row-1', name: '', qty: 0, uCap: 0, lCap: 0 }
  ]);

  // Autocomplete dropdown state
  const [activeSuggestRow, setActiveSuggestRow] = useState<number | null>(null);
  const [suggestQuery, setSuggestQuery] = useState<string>('');
  const [suggestIndex, setSuggestIndex] = useState<number>(0);

  // --- TAB 2: INWARD HISTORY STATE ---
  const [inwardSearch, setInwardSearch] = useState<string>('');
  const [inwardTypeFilter, setInwardTypeFilter] = useState<string>('ALL TYPES');

  // --- TAB 3: SALE (OUTWARD) STATE ---
  const [outwardSearch, setOutwardSearch] = useState<string>('');
  const [outwardTypeFilter, setOutwardTypeFilter] = useState<string>('ALL TYPES');

  // --- TAB 4: STOCK BALANCE STATE ---
  const [balanceSearch, setBalanceSearch] = useState<string>('');
  const [balanceFilter, setBalanceFilter] = useState<string>('All Items');
  const [balanceCategory, setBalanceCategory] = useState<string>('All Categories');
  const [balanceSize, setBalanceSize] = useState<string>('All Sizes');

  // --- TAB 5: PRINT BARCODE STATE ---
  const [barcodeSearch, setBarcodeSearch] = useState<string>('');
  const [barcodeCategory, setBarcodeCategory] = useState<string>('All Categories');
  const [barcodeStates, setBarcodeStates] = useState<Record<string, BarcodeItemState>>({});
  const [isBarcodePreviewOpen, setIsBarcodePreviewOpen] = useState<boolean>(false);

  // --- PAGINATION STATE ---
  const [inwardPage, setInwardPage] = useState(1);
  const [inwardPageSize, setInwardPageSize] = useState(25);
  const [outwardPage, setOutwardPage] = useState(1);
  const [outwardPageSize, setOutwardPageSize] = useState(25);
  const [balancePage, setBalancePage] = useState(1);
  const [balancePageSize, setBalancePageSize] = useState(25);
  const [barcodePage, setBarcodePage] = useState(1);
  const [barcodePageSize, setBarcodePageSize] = useState(25);

  // Reset pages when filters change
  useEffect(() => { setInwardPage(1); }, [inwardSearch, inwardTypeFilter]);
  useEffect(() => { setOutwardPage(1); }, [outwardSearch, outwardTypeFilter]);
  useEffect(() => { setBalancePage(1); }, [balanceSearch, balanceFilter, balanceCategory, balanceSize]);
  useEffect(() => { setBarcodePage(1); }, [barcodeSearch, barcodeCategory]);

  // Selected row index state for Tally Keyboard Navigation
  const [inwardSelectedIndex, setInwardSelectedIndex] = useState(0);
  const [outwardSelectedIndex, setOutwardSelectedIndex] = useState(0);
  const [balanceSelectedIndex, setBalanceSelectedIndex] = useState(0);
  const [barcodeSelectedIndex, setBarcodeSelectedIndex] = useState(0);

  const inwardTableWrapperRef = useRef<HTMLDivElement>(null);
  const outwardTableWrapperRef = useRef<HTMLDivElement>(null);
  const balanceTableWrapperRef = useRef<HTMLDivElement>(null);
  const barcodeTableWrapperRef = useRef<HTMLDivElement>(null);

  // Auto-scroll selected row into view
  useEffect(() => {
    if (activeTab === 'inward') {
      const el = document.getElementById(`inward-row-${inwardSelectedIndex}`);
      if (el) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [inwardSelectedIndex, activeTab]);

  useEffect(() => {
    if (activeTab === 'outward') {
      const el = document.getElementById(`outward-row-${outwardSelectedIndex}`);
      if (el) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [outwardSelectedIndex, activeTab]);

  useEffect(() => {
    if (activeTab === 'balance') {
      const el = document.getElementById(`balance-row-${balanceSelectedIndex}`);
      if (el) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [balanceSelectedIndex, activeTab]);

  useEffect(() => {
    if (activeTab === 'barcode') {
      const el = document.getElementById(`barcode-row-${barcodeSelectedIndex}`);
      if (el) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [barcodeSelectedIndex, activeTab]);

  // --- REPOSITORIES & DATA STORAGE ---
  const [vouchers, setVouchers] = useState<StockVoucher[]>(() => {
    try {
      const saved = localStorage.getItem(STOCK_VOUCHERS_KEY);
      if (saved) {
        const parsed: StockVoucher[] = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map((v) => ({
            ...v,
            items: (v.items || []).map((it) => ({
              ...it,
              name: formatItemWithSize(it.name)
            }))
          }));
        }
      }
    } catch {}
    // Seed initial voucher if completely empty
    return [
      {
        id: 1,
        voucherNo: 'VOUCHER-1',
        date: new Date().toISOString().split('T')[0],
        partyName: 'FACTORY INWARD ENTRY',
        remarks: 'Opening Production Stock',
        items: [
          { id: '1', name: 'C M 161 (10FT)', qty: 150, uCap: 150, lCap: 150 },
          { id: '2', name: 'C M 161 (12FT)', qty: 80, uCap: 0, lCap: 0 },
          { id: '3', name: 'B.F.P-(G) (10FT)', qty: 200, uCap: 200, lCap: 200 },
          { id: '4', name: 'LOUVER-801 (10FT)', qty: 100, uCap: 0, lCap: 0 }
        ],
        dynamicCols: [{ field: 'col_12ft', label: '(12 FT)', sizeNum: 12 }],
        createdAt: Date.now() - 86400000,
        updatedAt: Date.now() - 86400000
      }
    ];
  });

  // Sync vouchers to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STOCK_VOUCHERS_KEY, JSON.stringify(vouchers));
    } catch (e) {
      console.warn('Failed to save stock vouchers to localStorage', e);
    }
  }, [vouchers]);

  // Master conversions & shortcuts lookup
  const conversions = useMemo(() => {
    try {
      const saved = localStorage.getItem('billapp_conversions');
      if (saved) return JSON.parse(saved);
    } catch {}
    return SQLITE_CONTROL_CONVERSIONS;
  }, []);

  // Quick lookup dictionary from shortcuts/conversions
  const conversionMap = useMemo(() => {
    const map = new Map<string, any>();
    for (const c of conversions) {
      if (c.shortcut) map.set(c.shortcut.toLowerCase(), c);
      if (c.conversion) map.set(c.conversion.toLowerCase(), c);
    }
    return map;
  }, [conversions]);

  // Bills loaded from reactive localDb
  const [bills, setBills] = useState<BillRecord[]>(() => localDb.getBills());

  useEffect(() => {
    const unsubscribe = localDb.subscribe<BillRecord[]>('bills', (updatedBills) => {
      setBills(updatedBills);
    });
    return () => unsubscribe();
  }, []);

  // =========================================================================
  // DYNAMIC OUTWARD STOCK AGGREGATION (WITH MULTI-COLUMN SIZES)
  // =========================================================================
  const outwardItems = useMemo<OutwardStockItem[]>(() => {
    const list: OutwardStockItem[] = [];

    bills.forEach((bill) => {
      const docTypeUpper = (bill.docType || 'SALE BILL').toUpperCase();
      if (docTypeUpper.includes('PURCHASE')) return;

      const bDynamicCols = bill.dynamicCols || [];

      (bill.rawItems || []).forEach((item, itemIdx) => {
        const baseName = (item.name || '').trim();
        if (!baseName) return;

        // 1. Main column (10 FT standard)
        const mainQty = Number(item.qty) || 0;
        if (mainQty > 0) {
          list.push({
            id: `${bill.id}-raw-${itemIdx}-main`,
            billId: bill.id,
            token: String(bill.token || bill.id),
            docType: bill.docType || 'Bill',
            date: bill.date || '',
            party: bill.party || 'Standard Party',
            name: formatItemWithSize(baseName, '10FT'),
            qty: mainQty,
            uCap: Number(item.uCap) || 0,
            lCap: Number(item.lCap) || 0,
            sizeLabel: '10FT'
          });
        }

        // 2. Dynamic multi-columns (e.g. 12FT, 9.5FT, 11FT, etc.)
        bDynamicCols.forEach((col) => {
          const colQty = Number((item as any)[col.field]) || 0;
          if (colQty > 0) {
            list.push({
              id: `${bill.id}-raw-${itemIdx}-${col.field}`,
              billId: bill.id,
              token: String(bill.token || bill.id),
              docType: bill.docType || 'Bill',
              date: bill.date || '',
              party: bill.party || 'Standard Party',
              name: formatItemWithSize(baseName, col.label || '12FT'),
              qty: colQty,
              uCap: 0,
              lCap: 0,
              sizeLabel: col.label || '12FT'
            });
          }
        });

        // 3. Fallback check for any extra fields starting with 'col_' or 'qty_'
        Object.keys(item).forEach((k) => {
          if (k.startsWith('col_') && !bDynamicCols.some((dc) => dc.field === k)) {
            const extraQty = Number((item as any)[k]) || 0;
            if (extraQty > 0) {
              const guessedSize = k.replace('col_', '').toUpperCase();
              list.push({
                id: `${bill.id}-raw-${itemIdx}-${k}`,
                billId: bill.id,
                token: String(bill.token || bill.id),
                docType: bill.docType || 'Bill',
                date: bill.date || '',
                party: bill.party || 'Standard Party',
                name: formatItemWithSize(baseName, guessedSize),
                qty: extraQty,
                uCap: 0,
                lCap: 0,
                sizeLabel: guessedSize
              });
            }
          }
        });
      });
    });

    return list;
  }, [bills]);

  // =========================================================================
  // DYNAMIC INWARD STOCK AGGREGATION
  // =========================================================================
  const inwardItems = useMemo(() => {
    const list: {
      id: string;
      voucherId: string;
      voucherType: 'STOCK VOUCHER' | 'PURCHASE';
      date: string;
      party: string;
      name: string;
      qty: number;
      uCap: number;
      lCap: number;
      rawVoucherId: number | null;
    }[] = [];

    // 1. Stock vouchers
    vouchers.forEach((v) => {
      v.items.forEach((item, idx) => {
        if (!item.name) return;
        list.push({
          id: `V-${v.id}-${idx}`,
          voucherId: `VOUCHER-${v.id}`,
          voucherType: 'STOCK VOUCHER',
          date: v.date,
          party: v.remarks ? `${v.partyName || 'Inward'} (${v.remarks})` : v.partyName || 'Stock Entry',
          name: formatItemWithSize(item.name),
          qty: Number(item.qty) || 0,
          uCap: Number(item.uCap) || 0,
          lCap: Number(item.lCap) || 0,
          rawVoucherId: v.id
        });
      });
    });

    // 2. Purchase Bills from localDb
    bills.forEach((b) => {
      const docTypeUpper = (b.docType || '').toUpperCase();
      if (!docTypeUpper.includes('PURCHASE')) return;

      (b.rawItems || []).forEach((item, idx) => {
        if (!item.name) return;
        list.push({
          id: `B-${b.id}-${idx}`,
          voucherId: `BILL-${b.id}`,
          voucherType: 'PURCHASE',
          date: b.date,
          party: b.party || 'Supplier',
          name: formatItemWithSize(item.name, '10FT'),
          qty: Number(item.qty) || 0,
          uCap: Number(item.uCap) || 0,
          lCap: Number(item.lCap) || 0,
          rawVoucherId: null
        });
      });
    });

    return list;
  }, [vouchers, bills]);

  // =========================================================================
  // STOCK BALANCE CALCULATION (PER EXACT ITEM + SIZE)
  // =========================================================================
  const stockBalanceList = useMemo<StockBalanceRow[]>(() => {
    const map = new Map<string, {
      itemName: string;
      category: string;
      inwardQty: number;
      outwardQty: number;
      inwardUCap: number;
      outwardUCap: number;
      inwardLCap: number;
      outwardLCap: number;
    }>();

    // Helper to get or init item
    const getOrInit = (rawName: string) => {
      const cleanName = formatItemWithSize(rawName);
      const key = cleanName.toLowerCase();
      if (!map.has(key)) {
        map.set(key, {
          itemName: cleanName,
          category: getCategoryPrefix(cleanName),
          inwardQty: 0,
          outwardQty: 0,
          inwardUCap: 0,
          outwardUCap: 0,
          inwardLCap: 0,
          outwardLCap: 0
        });
      }
      return map.get(key)!;
    };

    // Aggregate Inwards
    inwardItems.forEach((inw) => {
      const row = getOrInit(inw.name);
      row.inwardQty += inw.qty;
      row.inwardUCap += inw.uCap;
      row.inwardLCap += inw.lCap;
    });

    // Aggregate Outwards
    outwardItems.forEach((outw) => {
      const row = getOrInit(outw.name);
      row.outwardQty += outw.qty;
      row.outwardUCap += outw.uCap;
      row.outwardLCap += outw.lCap;
    });

    // Compute balances and status
    const result: StockBalanceRow[] = [];
    map.forEach((item) => {
      const balQty = item.inwardQty - item.outwardQty;
      const balUCap = item.inwardUCap - item.outwardUCap;
      const balLCap = item.inwardLCap - item.outwardLCap;

      let status: 'IN STOCK' | 'LOW STOCK' | 'NEGATIVE' | 'ZERO' = 'ZERO';
      if (balQty > 20) {
        status = 'IN STOCK';
      } else if (balQty > 0) {
        status = 'LOW STOCK';
      } else if (balQty < 0) {
        status = 'NEGATIVE';
      }

      result.push({
        itemName: item.itemName,
        category: item.category,
        inwardQty: item.inwardQty,
        outwardQty: item.outwardQty,
        balanceQty: balQty,
        inwardUCap: item.inwardUCap,
        outwardUCap: item.outwardUCap,
        balanceUCap: balUCap,
        inwardLCap: item.inwardLCap,
        outwardLCap: item.outwardLCap,
        balanceLCap: balLCap,
        status
      });
    });

    return result.sort((a, b) => a.itemName.localeCompare(b.itemName));
  }, [inwardItems, outwardItems]);

  // =========================================================================
  // LIVE BALANCE TRACKER FOR ENTER STOCK ROWS (QTY, U-CAP, L-CAP)
  // =========================================================================
  // Computes the live balance for any row item:
  // =========================================================================
  // LIVE BALANCE TRACKER FOR ENTER STOCK ROWS (QTY, U-CAP, L-CAP)
  // Real-time calculation: Previous DB Balance + Current Voucher's Inward Entry
  // =========================================================================
  const getLiveBalancesForRow = (rawName: string) => {
    const trimmed = (rawName || '').trim();
    if (!trimmed) {
      return { qtyBal: null, uCapBal: null, lCapBal: null, sizeBals: {} as Record<string, number>, hasItem: false };
    }

    const baseName = extractBaseItemName(trimmed).toLowerCase();
    let totalQty = 0;
    let totalU = 0;
    let totalL = 0;
    let matchFound = false;
    const sizeBals: Record<string, number> = {};

    // 1. Existing DB Balance from stockBalanceList
    stockBalanceList.forEach((b) => {
      const bBase = extractBaseItemName(b.itemName).toLowerCase();
      if (bBase === baseName || b.itemName.toLowerCase() === trimmed.toLowerCase()) {
        matchFound = true;
        totalQty += b.balanceQty;
        totalU += b.balanceUCap;
        totalL += b.balanceLCap;

        // Parse size suffix e.g. "C M 161 (10FT)" or "(12 FT)"
        const sizeMatch = b.itemName.match(/\(\s*([\d.]+\s*(?:FT|FEET)?)\s*\)/i);
        if (sizeMatch && sizeMatch[1]) {
          const sz = sizeMatch[1].toUpperCase().replace(/\s+/g, '');
          const norm = sz.endsWith('FT') ? sz : `${sz}FT`;
          sizeBals[norm] = (sizeBals[norm] || 0) + b.balanceQty;
        } else {
          sizeBals['10FT'] = (sizeBals['10FT'] || 0) + b.balanceQty;
        }
      }
    });

    // 2. Real-time Inward Additions from currently entered voucher rows (stockRows)
    let currentInward10 = 0;
    const currentInwardSizes: Record<string, number> = {};
    let currentInwardU = 0;
    let currentInwardL = 0;

    stockRows.forEach((sr) => {
      if (!sr.name || !sr.name.trim()) return;
      const srBase = extractBaseItemName(sr.name).toLowerCase();
      if (srBase === baseName || sr.name.toLowerCase().trim() === trimmed.toLowerCase()) {
        currentInward10 += Number(sr.qty) || 0;
        currentInwardU += Number(sr.uCap) || 0;
        currentInwardL += Number(sr.lCap) || 0;

        dynamicCols.forEach((dc) => {
          const szKey = dc.label.replace(/[()\s]/g, '').toUpperCase();
          const norm = szKey.endsWith('FT') ? szKey : `${szKey}FT`;
          currentInwardSizes[norm] = (currentInwardSizes[norm] || 0) + (Number(sr[dc.field]) || 0);
        });
      }
    });

    // Add current voucher's inward additions to live balance
    sizeBals['10FT'] = (sizeBals['10FT'] || 0) + currentInward10;
    dynamicCols.forEach((dc) => {
      const szKey = dc.label.replace(/[()\s]/g, '').toUpperCase();
      const norm = szKey.endsWith('FT') ? szKey : `${szKey}FT`;
      sizeBals[norm] = (sizeBals[norm] || 0) + (currentInwardSizes[norm] || 0);
    });

    return {
      qtyBal: (matchFound ? totalQty : 0) + currentInward10 + Object.values(currentInwardSizes).reduce((a, b) => a + b, 0),
      uCapBal: (matchFound ? totalU : 0) + currentInwardU,
      lCapBal: (matchFound ? totalL : 0) + currentInwardL,
      sizeBals,
      hasItem: true
    };
  };

  // Helper to render negative (RED), positive (GREEN), and zero (GRAY) balance badges without 'pcs' suffix
  const renderBalanceBadge = (val: number | null | undefined, hasItem: boolean) => {
    if (!hasItem || val === null || val === undefined) {
      return <span style={{ color: '#71717a' }}>-</span>;
    }
    if (val > 0) {
      return (
        <span style={{ color: '#22c55e', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", fontSize: '13px' }}>
          +{val}
        </span>
      );
    }
    if (val < 0) {
      return (
        <span style={{ color: '#ef4444', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", fontSize: '13px' }}>
          {val}
        </span>
      );
    }
    return <span style={{ color: '#71717a', fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", fontSize: '13px' }}>0</span>;
  };

  // Distinct Categories for filters
  const uniqueCategories = useMemo(() => {
    const set = new Set<string>();
    stockBalanceList.forEach((b) => set.add(b.category));
    return ['All Categories', ...Array.from(set).sort()];
  }, [stockBalanceList]);

  // Distinct Sizes for filters in Stock Balance tab
  const uniqueSizes = useMemo(() => {
    const set = new Set<string>();
    stockBalanceList.forEach((b) => {
      const sz = extractSizeFromItem(b.itemName);
      if (sz) set.add(sz);
    });
    const sorted = Array.from(set).sort((a, b) => {
      const numA = parseFloat(a) || 0;
      const numB = parseFloat(b) || 0;
      return numA - numB;
    });
    return ['All Sizes', ...sorted];
  }, [stockBalanceList]);

  // Overall KPI Balances
  const totalStats = useMemo(() => {
    let totalItems = stockBalanceList.length;
    let totalQty = 0;
    let totalUCap = 0;
    let totalLCap = 0;

    stockBalanceList.forEach((r) => {
      totalQty += r.balanceQty;
      totalUCap += r.balanceUCap;
      totalLCap += r.balanceLCap;
    });

    return { totalItems, totalQty, totalUCap, totalLCap };
  }, [stockBalanceList]);

  // =========================================================================
  // TAB 1: ENTER STOCK INTERACTIONS & HELPERS
  // =========================================================================

  // Add Dynamic Size Column (e.g. 12 FT, 9.5 FT)
  const handleAddDynamicCol = (sizeNumber: number | string) => {
    const num = parseFloat(String(sizeNumber).replace(/[^0-9.]/g, ''));
    if (isNaN(num) || num <= 0) {
      showToast('Please enter a valid numeric size (e.g. 12, 9.5, 14)', 'warning');
      return;
    }

    if (num === 10) {
      showToast('(10 FT) is already the default primary column!', 'info');
      return;
    }

    const field = `col_${String(num).replace('.', '_')}ft`;
    const label = `(${num} FT)`;

    if (dynamicCols.some((dc) => dc.field === field || dc.sizeNum === num)) {
      showToast(`Size (${num} FT) column already exists!`, 'info');
      return;
    }

    macAudio.playPop();
    const newCol: StockDynamicCol = { field, label, sizeNum: num };
    setDynamicCols((prev) => [...prev, newCol]);
    setIsAddColModalOpen(false);
    setNewColSizeInput('');
    showToast(`Added multi-column size: ${label}`, 'success');
  };

  // Remove Dynamic Size Column
  const handleRemoveDynamicCol = (field: string, label: string) => {
    macAudio.playTrash();
    setDynamicCols((prev) => prev.filter((dc) => dc.field !== field));
    showToast(`Removed size column ${label}`, 'info');
  };

  // Duplicate items detection
  const duplicateItemSummary = useMemo(() => {
    const counts = new Map<string, number>();
    stockRows.forEach((r) => {
      const base = extractBaseItemName(r.name).toLowerCase();
      if (base) {
        counts.set(base, (counts.get(base) || 0) + 1);
      }
    });

    let dupCount = 0;
    const dupNames: string[] = [];
    counts.forEach((cnt, name) => {
      if (cnt > 1) {
        dupCount += cnt - 1;
        dupNames.push(name);
      }
    });

    return { count: dupCount, names: dupNames };
  }, [stockRows]);

  // Stock rows live totals (including all dynamic size columns!)
  const entryTotals = useMemo(() => {
    let main10Qty = 0;
    const dynamicQtyTotals: Record<string, number> = {};
    dynamicCols.forEach((dc) => {
      dynamicQtyTotals[dc.field] = 0;
    });

    let totalPcs = 0;
    let uCap = 0;
    let lCap = 0;
    let validItems = 0;

    stockRows.forEach((r) => {
      if (r.name.trim()) {
        validItems++;
        const m10 = Number(r.qty) || 0;
        main10Qty += m10;
        totalPcs += m10;

        dynamicCols.forEach((dc) => {
          const dVal = Number(r[dc.field]) || 0;
          dynamicQtyTotals[dc.field] = (dynamicQtyTotals[dc.field] || 0) + dVal;
          totalPcs += dVal;
        });

        uCap += Number(r.uCap) || 0;
        lCap += Number(r.lCap) || 0;
      }
    });

    return { main10Qty, dynamicQtyTotals, totalPcs, uCap, lCap, validItems };
  }, [stockRows, dynamicCols]);

  // Real-time Balance Totals for Enter Stock footer
  const balanceTotals = useMemo(() => {
    let bal10 = 0;
    const dynamicBalTotals: Record<string, number> = {};
    dynamicCols.forEach((dc) => {
      dynamicBalTotals[dc.field] = 0;
    });
    let uCapBal = 0;
    let lCapBal = 0;

    // Deduplicate by base item name so multi-row vouchers don't multiply the same inventory
    const seenBases = new Set<string>();

    stockRows.forEach((r) => {
      const trimmed = (r.name || '').trim();
      if (!trimmed) return;
      const baseName = extractBaseItemName(trimmed).toLowerCase();
      if (seenBases.has(baseName)) return;
      seenBases.add(baseName);

      const b = getLiveBalancesForRow(trimmed);
      bal10 += (b.sizeBals['10FT'] || 0);

      dynamicCols.forEach((dc) => {
        const szKey = dc.label.replace(/[()\s]/g, '').toUpperCase();
        const normKey = szKey.endsWith('FT') ? szKey : `${szKey}FT`;
        dynamicBalTotals[dc.field] = (dynamicBalTotals[dc.field] || 0) + (b.sizeBals[normKey] || 0);
      });

      uCapBal += (b.uCapBal || 0);
      lCapBal += (b.lCapBal || 0);
    });

    return { bal10, dynamicBalTotals, uCapBal, lCapBal, count: seenBases.size };
  }, [stockRows, dynamicCols, stockBalanceList]);

  // Autocomplete suggestions generator
  const currentSuggestions = useMemo(() => {
    if (!suggestQuery.trim()) return [];
    const q = suggestQuery.trim().toLowerCase();

    const matches: { name: string; uCap: number; lCap: number; desc?: string }[] = [];

    // Check conversions
    for (const c of conversions) {
      const sc = (c.shortcut || '').toLowerCase();
      const conv = (c.conversion || '').toLowerCase();

      if (sc.startsWith(q) || conv.includes(q)) {
        const u = Number(c.u_cap) || (c.u_cap && c.u_cap !== '0' ? 1 : 0);
        const l = Number(c.l_cap) || (c.l_cap && c.l_cap !== '0' ? 1 : 0);
        
        matches.push({
          name: c.conversion || c.shortcut,
          uCap: u,
          lCap: l,
          desc: `Shortcut [${c.shortcut}]`
        });
      }
      if (matches.length >= 8) break;
    }

    return matches;
  }, [suggestQuery, conversions]);

  // Handle row field change
  const handleStockRowChange = (index: number, field: string, value: any) => {
    setStockRows((prev) => {
      const updated = [...prev];
      if (!updated[index]) return prev;
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Commit item name resolution on Enter or Blur (matches Bill UI behavior)
  const commitStockItemName = (index: number, explicitVal?: string) => {
    const row = stockRows[index];
    if (!row) return;
    const rawVal = explicitVal !== undefined ? explicitVal : (row.name || '');
    if (!rawVal.trim()) return;

    const prevItemName = index > 0 ? stockRows[index - 1]?.name : undefined;
    const { finalName, autoUCap, autoLCap, insertedSize } = resolveItemNameWithMode({
      rawVal,
      rowIndex: index,
      prevItemName,
      autoConvert,
      autoItem,
      simpleMode
    });

    // Auto-Insert Size Column if matched rule specifies a size (e.g. 12, 9.5) and not default 10
    if (insertedSize && !dynamicCols.some(c => c.field === `qty_${String(insertedSize).replace('.', '_')}`)) {
      const field = `qty_${String(insertedSize).replace('.', '_')}`;
      const label = `(${insertedSize} FT)`;
      setDynamicCols(prev => {
        if (prev.some(c => c.field === field)) return prev;
        return [...prev, { field, label }];
      });
      showToast?.(`Auto-inserted (${insertedSize} FT) size column for ${finalName}`, 'info');
    }

    setStockRows((prev) => {
      const updated = [...prev];
      if (!updated[index]) return prev;
      const target = { ...updated[index] };
      target.name = finalName;
      if (autoUCap !== undefined && autoUCap !== null && !isNaN(Number(autoUCap))) {
        target.uCap = Number(autoUCap);
      }
      if (autoLCap !== undefined && autoLCap !== null && !isNaN(Number(autoLCap))) {
        target.lCap = Number(autoLCap);
      }
      updated[index] = target;
      return updated;
    });
  };

  // Add blank row
  const handleAddStockRow = () => {
    macAudio.playPop();
    const blankRow: StockVoucherItem = {
      id: `row-${Date.now()}-${stockRows.length + 1}`,
      name: '',
      qty: 0,
      uCap: 0,
      lCap: 0
    };
    dynamicCols.forEach((dc) => {
      blankRow[dc.field] = 0;
    });
    setStockRows((prev) => [...prev, blankRow]);
  };

  // Delete row
  const handleDeleteStockRow = (index: number) => {
    if (stockRows.length === 1) {
      const freshRow: StockVoucherItem = { id: 'row-1', name: '', qty: 0, uCap: 0, lCap: 0 };
      dynamicCols.forEach((dc) => {
        freshRow[dc.field] = 0;
      });
      setStockRows([freshRow]);
      return;
    }
    macAudio.playTrash();
    setStockRows((prev) => prev.filter((_, i) => i !== index));
  };

  // Barcode quick scan into stock entry (Honors Marg ERP 9+ Rules)
  const handleBarcodeScan = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const rawCode = barcodeScanInput.trim();
      if (!rawCode) return;

      const bConf = loadBarcodeConfig();

      // Check min/max code length
      if (rawCode.length < (bConf.minCodeLength || 3)) {
        macAudio.playPosError();
        showToast(`Barcode too short (min ${bConf.minCodeLength} characters)`, 'warning');
        return;
      }

      // Check Indian Weighing Scale / Supermarket Barcode format
      let scannedItem = rawCode;
      let scannedQty = bConf.defaultSalesQty || 1;

      if (bConf.enableScaleBarcode) {
        const scaleData = parseWeighingScaleBarcode(rawCode);
        if (scaleData.isScale && scaleData.itemCode) {
          scannedItem = scaleData.itemCode;
          if (scaleData.weightKg) scannedQty = scaleData.weightKg;
        }
      }

      const baseName = extractBaseItemName(scannedItem);
      
      let u = 0;
      let l = 0;
      const match = conversionMap.get(scannedItem.toLowerCase()) || conversionMap.get(baseName.toLowerCase());
      if (match) {
        u = Number(match.u_cap) || 0;
        l = Number(match.l_cap) || 0;
      }

      // Audio Feedback (Marg POS Beep vs Mac Chime)
      if (bConf.soundType === 'POS_BEEP') {
        macAudio.playPosBeep();
      } else if (bConf.soundType === 'MAC_CHIME') {
        macAudio.playSuccess();
      }

      // Marg Rescan action: Increment existing row vs New row
      if (bConf.sameItemRescanAction === 'INCREMENT') {
        let foundExisting = false;
        setStockRows((prev) => {
          const updated = [...prev];
          for (let i = 0; i < updated.length; i++) {
            if (updated[i].name && updated[i].name.toLowerCase() === baseName.toLowerCase()) {
              updated[i] = {
                ...updated[i],
                qty: (Number(updated[i].qty) || 0) + scannedQty
              };
              foundExisting = true;
              break;
            }
          }
          if (foundExisting) {
            return updated;
          }
          // If not found, use last empty row or append
          const lastRow = prev[prev.length - 1];
          if (lastRow && !lastRow.name) {
            updated[prev.length - 1] = {
              ...lastRow,
              name: baseName,
              qty: scannedQty,
              uCap: u,
              lCap: l
            };
            return [...updated, { id: `row-${Date.now()}`, name: '', qty: 0, uCap: 0, lCap: 0 }];
          } else {
            return [
              ...prev,
              { id: `row-${Date.now()}`, name: baseName, qty: scannedQty, uCap: u, lCap: l },
              { id: `row-${Date.now() + 1}`, name: '', qty: 0, uCap: 0, lCap: 0 }
            ];
          }
        });
        showToast(foundExisting ? `+${scannedQty} Qty added to ${baseName}` : `Scanned item: ${baseName}`, 'success');
      } else {
        // New row mode
        setStockRows((prev) => {
          const lastRow = prev[prev.length - 1];
          if (lastRow && !lastRow.name) {
            const updated = [...prev];
            updated[prev.length - 1] = {
              ...lastRow,
              name: baseName,
              qty: scannedQty,
              uCap: u,
              lCap: l
            };
            return [...updated, { id: `row-${Date.now()}`, name: '', qty: 0, uCap: 0, lCap: 0 }];
          } else {
            return [
              ...prev,
              { id: `row-${Date.now()}`, name: baseName, qty: scannedQty, uCap: u, lCap: l },
              { id: `row-${Date.now() + 1}`, name: '', qty: 0, uCap: 0, lCap: 0 }
            ];
          }
        });
        showToast(`Scanned item: ${baseName}`, 'success');
      }

      setBarcodeScanInput('');
    }
  };


  // Save or Update Stock Voucher (Supports Multi-Column sizes!)
  const handleSaveVoucher = () => {
    const flatItemsToSave: StockVoucherItem[] = [];

    stockRows.forEach((r, rIdx) => {
      const baseName = extractBaseItemName(r.name);
      if (!baseName) return;

      const main10 = Number(r.qty) || 0;
      const u = Number(r.uCap) || 0;
      const l = Number(r.lCap) || 0;

      // 1. If has quantity in (10 FT)
      if (main10 > 0 || (u > 0 || l > 0)) {
        flatItemsToSave.push({
          id: `row-${rIdx}-10ft`,
          name: formatItemWithSize(baseName, '10FT'),
          qty: main10,
          uCap: u,
          lCap: l
        });
      }

      // 2. Multi-column sizes: (12 FT), (9.5 FT), etc.
      dynamicCols.forEach((dc) => {
        const dQty = Number(r[dc.field]) || 0;
        if (dQty > 0) {
          flatItemsToSave.push({
            id: `row-${rIdx}-${dc.field}`,
            name: formatItemWithSize(baseName, dc.label),
            qty: dQty,
            uCap: 0,
            lCap: 0
          });
        }
      });
    });

    if (flatItemsToSave.length === 0) {
      macAudio.playBeep();
      showToast('Please enter at least one item with valid quantity or caps!', 'warning');
      return;
    }

    if (editingVoucherId !== null) {
      // Update existing voucher
      setVouchers((prev) =>
        prev.map((v) =>
          v.id === editingVoucherId
            ? {
                ...v,
                date: voucherDate,
                remarks: voucherRemarks,
                items: flatItemsToSave,
                dynamicCols: [...dynamicCols],
                updatedAt: Date.now()
              }
            : v
        )
      );
      macAudio.playSuccess();
      showToast(`Stock Voucher #${editingVoucherId} Updated Successfully!`, 'success');
      setEditingVoucherId(null);
    } else {
      // Create new voucher
      let counter = 1;
      try {
        const c = localStorage.getItem(STOCK_COUNTER_KEY);
        counter = c ? parseInt(c, 10) + 1 : vouchers.length + 1;
      } catch {}
      localStorage.setItem(STOCK_COUNTER_KEY, String(counter));

      const newVoucher: StockVoucher = {
        id: counter,
        voucherNo: `VOUCHER-${counter}`,
        date: voucherDate,
        partyName: 'FACTORY INWARD ENTRY',
        remarks: voucherRemarks,
        items: flatItemsToSave,
        dynamicCols: [...dynamicCols],
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      setVouchers((prev) => [newVoucher, ...prev]);
      macAudio.playSuccess();
      showToast(`Stock Voucher #${counter} Saved Successfully!`, 'success');
    }

    // Reset table for next entry
    setVoucherRemarks('');
    const freshRow: StockVoucherItem = { id: 'row-1', name: '', qty: 0, uCap: 0, lCap: 0 };
    dynamicCols.forEach((dc) => {
      freshRow[dc.field] = 0;
    });
    setStockRows([freshRow]);
  };

  // Load Voucher into Enter Stock for editing (Re-groups multi-column sizes!)
  const handleLoadVoucherForEdit = (voucherId: number) => {
    const found = vouchers.find((v) => v.id === voucherId);
    if (!found) {
      macAudio.playBeep();
      showToast(`Stock Voucher #${voucherId} NOT FOUND!`, 'error');
      return;
    }

    macAudio.playPop();
    setEditingVoucherId(found.id);
    setVoucherDate(found.date);
    setVoucherRemarks(found.remarks || '');

    // Restore any dynamic cols from voucher
    if (found.dynamicCols && found.dynamicCols.length > 0) {
      setDynamicCols((prev) => {
        const merged = [...prev];
        found.dynamicCols!.forEach((fdc) => {
          if (!merged.some((m) => m.field === fdc.field)) {
            merged.push(fdc);
          }
        });
        return merged;
      });
    }

    // Group items by base name into multi-column rows!
    const groupedRows = new Map<string, StockVoucherItem>();
    found.items.forEach((item, idx) => {
      const base = extractBaseItemName(item.name);
      if (!groupedRows.has(base)) {
        groupedRows.set(base, {
          id: `edit-row-${idx}`,
          name: base,
          qty: 0,
          uCap: Number(item.uCap) || 0,
          lCap: Number(item.lCap) || 0
        });
      }

      const row = groupedRows.get(base)!;
      // Check size from name e.g. (10FT), (12FT), (9.5FT)
      const sizeMatch = item.name.match(/\(+([\d.]+)/);
      const sizeNum = sizeMatch ? parseFloat(sizeMatch[1]) : 10;

      if (sizeNum === 10 || isNaN(sizeNum)) {
        row.qty = Number(item.qty) || 0;
        if (Number(item.uCap)) row.uCap = Number(item.uCap);
        if (Number(item.lCap)) row.lCap = Number(item.lCap);
      } else {
        const fieldKey = `col_${String(sizeNum).replace('.', '_')}ft`;
        row[fieldKey] = Number(item.qty) || 0;
      }
    });

    setStockRows(Array.from(groupedRows.values()));
    setActiveTab('entry');
    showToast(`Loaded Voucher #${voucherId} for Editing`, 'info');
  };

  // Cancel edit mode
  const handleCancelEdit = () => {
    setEditingVoucherId(null);
    setVoucherRemarks('');
    const freshRow: StockVoucherItem = { id: 'row-1', name: '', qty: 0, uCap: 0, lCap: 0 };
    dynamicCols.forEach((dc) => {
      freshRow[dc.field] = 0;
    });
    setStockRows([freshRow]);
    showToast('Cancelled Voucher Edit Mode', 'info');
  };

  // Delete Voucher
  const handleDeleteVoucher = (voucherId: number) => {
    macAudio.playPop();
    setVoucherToDelete(voucherId);
  };

  const confirmDeleteVoucher = () => {
    if (voucherToDelete === null) return;
    const voucherId = voucherToDelete;
    macAudio.playSuccess();
    setVouchers((prev) => prev.filter((v) => v.id !== voucherId));
    if (editingVoucherId === voucherId) {
      handleCancelEdit();
    }
    showToast(`Voucher #${voucherId} deleted`, 'info');
    setVoucherToDelete(null);
  };

  // =========================================================================
  // KEYBOARD NAVIGATION & PAGINATION HOOKS FOR TABS 2, 3, 4
  // =========================================================================
  // Inward filtered & paginated
  const filteredInwardItems = useMemo(() => {
    return inwardItems.filter((item) => {
      const matchType = inwardTypeFilter === 'ALL TYPES' || item.voucherType === inwardTypeFilter;
      const q = inwardSearch.toLowerCase();
      const matchSearch = !q || item.voucherId.toLowerCase().includes(q) || item.party.toLowerCase().includes(q) || item.name.toLowerCase().includes(q) || item.date.includes(q);
      return matchType && matchSearch;
    });
  }, [inwardItems, inwardTypeFilter, inwardSearch]);

  const inwardPageSlice = useMemo(() => {
    const start = (inwardPage - 1) * inwardPageSize;
    return filteredInwardItems.slice(start, start + inwardPageSize);
  }, [filteredInwardItems, inwardPage, inwardPageSize]);

  const inwardKeyNav = useTableKeyboardNavigation({
    tableId: 'inward',
    itemCount: inwardPageSlice.length,
    selectedIndex: inwardSelectedIndex,
    onSelectIndex: setInwardSelectedIndex,
    isPaginated: filteredInwardItems.length > inwardPageSize,
    currentPage: inwardPage,
    totalPages: Math.max(1, Math.ceil(filteredInwardItems.length / inwardPageSize)),
    onPageChange: (newPage) => setInwardPage(newPage),
    onRowSubmit: (idx) => {
      const item = inwardPageSlice[idx];
      if (item && item.rawVoucherId !== null) {
        handleLoadVoucherForEdit(item.rawVoucherId);
      }
    },
    tableContainerRef: inwardTableWrapperRef
  });

  // Outward filtered & paginated
  const filteredOutwardItems = useMemo(() => {
    return outwardItems.filter((item) => {
      const matchType = outwardTypeFilter === 'ALL TYPES' || item.docType.toUpperCase().includes(outwardTypeFilter.toUpperCase());
      const q = outwardSearch.toLowerCase();
      const matchSearch = !q || item.token.toLowerCase().includes(q) || item.party.toLowerCase().includes(q) || item.name.toLowerCase().includes(q) || item.date.includes(q);
      return matchType && matchSearch;
    });
  }, [outwardItems, outwardTypeFilter, outwardSearch]);

  const outwardPageSlice = useMemo(() => {
    const start = (outwardPage - 1) * outwardPageSize;
    return filteredOutwardItems.slice(start, start + outwardPageSize);
  }, [filteredOutwardItems, outwardPage, outwardPageSize]);

  const outwardKeyNav = useTableKeyboardNavigation({
    tableId: 'outward',
    itemCount: outwardPageSlice.length,
    selectedIndex: outwardSelectedIndex,
    onSelectIndex: setOutwardSelectedIndex,
    isPaginated: filteredOutwardItems.length > outwardPageSize,
    currentPage: outwardPage,
    totalPages: Math.max(1, Math.ceil(filteredOutwardItems.length / outwardPageSize)),
    onPageChange: (newPage) => setOutwardPage(newPage),
    onRowSubmit: (idx) => {
      const item = outwardPageSlice[idx];
      if (item && onOpenBillDetails) {
        onOpenBillDetails(item.billId);
      }
    },
    tableContainerRef: outwardTableWrapperRef
  });

  // Balance filtered & paginated
  const filteredBalanceList = useMemo(() => {
    return stockBalanceList.filter((row) => {
      const q = balanceSearch.toLowerCase();
      const matchSearch = !q || row.itemName.toLowerCase().includes(q);
      const matchCat = balanceCategory === 'All Categories' || row.category === balanceCategory;
      const rowSize = extractSizeFromItem(row.itemName);
      const matchSize = balanceSize === 'All Sizes' || rowSize === balanceSize;
      let matchBal = true;
      if (balanceFilter === 'Positive Balance') matchBal = row.balanceQty > 0;
      if (balanceFilter === 'Negative Balance') matchBal = row.balanceQty < 0;
      if (balanceFilter === 'Zero Balance') matchBal = row.balanceQty === 0;
      return matchSearch && matchCat && matchSize && matchBal;
    });
  }, [stockBalanceList, balanceSearch, balanceCategory, balanceSize, balanceFilter]);

  const balancePageSlice = useMemo(() => {
    const start = (balancePage - 1) * balancePageSize;
    return filteredBalanceList.slice(start, start + balancePageSize);
  }, [filteredBalanceList, balancePage, balancePageSize]);

  const balanceKeyNav = useTableKeyboardNavigation({
    tableId: 'balance',
    itemCount: balancePageSlice.length,
    selectedIndex: balanceSelectedIndex,
    onSelectIndex: setBalanceSelectedIndex,
    isPaginated: filteredBalanceList.length > balancePageSize,
    currentPage: balancePage,
    totalPages: Math.max(1, Math.ceil(filteredBalanceList.length / balancePageSize)),
    onPageChange: (newPage) => setBalancePage(newPage),
    tableContainerRef: balanceTableWrapperRef
  });

  // =========================================================================
  // UNIVERSAL CSV / EXCEL DEFINITIONS & HANDLERS
  // =========================================================================
  const voucherItemCsvColumns: CsvColumnDef<StockVoucherItem>[] = useMemo(() => [
    { header: 'Item Name', key: 'name', sample: 'Aluminium Section 6063 T6', required: true },
    { header: '10 FT Qty', key: 'qty', sample: 25 },
    { header: 'U-Cap', key: 'uCap', sample: 5 },
    { header: 'L-Cap', key: 'lCap', sample: 5 },
    { header: 'Rate', key: 'price', sample: 420 },
    { header: 'Total', key: 'total', sample: 10500 }
  ], []);

  const handleImportVoucherItems = (imported: Partial<StockVoucherItem>[], mode: 'append' | 'replace') => {
    const validRows = imported
      .filter(r => r.name && String(r.name).trim() !== '')
      .map((r, i) => ({
        id: `row-${Date.now()}-${i}`,
        name: String(r.name).trim(),
        qty: Number(r.qty) || 0,
        uCap: Number(r.uCap) || 0,
        lCap: Number(r.lCap) || 0,
        price: Number(r.price) || 0,
        total: Number(r.total) || ((Number(r.qty) || 0) * (Number(r.price) || 0))
      }));

    if (validRows.length === 0) {
      showToast('No valid item rows found in CSV', 'error');
      return;
    }

    if (mode === 'replace') {
      setStockRows(validRows);
    } else {
      setStockRows(prev => [...prev.filter(r => r.name && r.name.trim() !== ''), ...validRows]);
    }
    showToast(`Loaded ${validRows.length} items into voucher`, 'success');
  };

  const stockBalanceCsvColumns: CsvColumnDef<StockBalanceRow>[] = useMemo(() => [
    { header: 'Item Name', key: 'itemName', sample: 'Aluminium Profile 6063', required: true },
    { header: 'Category', key: 'category', sample: 'PROFILES' },
    { header: 'Inward Qty', key: 'inwardQty', sample: 100 },
    { header: 'Outward Qty', key: 'outwardQty', sample: 30 },
    { header: 'Balance Qty', key: 'balanceQty', sample: 70 },
    { header: 'Inward U-Cap', key: 'inwardUCap', sample: 10 },
    { header: 'Outward U-Cap', key: 'outwardUCap', sample: 3 },
    { header: 'Balance U-Cap', key: 'balanceUCap', sample: 7 },
    { header: 'Inward L-Cap', key: 'inwardLCap', sample: 10 },
    { header: 'Outward L-Cap', key: 'outwardLCap', sample: 3 },
    { header: 'Balance L-Cap', key: 'balanceLCap', sample: 7 },
    { header: 'Status', key: 'status', sample: 'IN STOCK' }
  ], []);

  const inwardHistoryCsvColumns: CsvColumnDef<any>[] = useMemo(() => [
    { header: 'Voucher ID', key: 'voucherId', sample: 'VCH-1001', required: true },
    { header: 'Voucher Type', key: 'voucherType', sample: 'STOCK VOUCHER' },
    { header: 'Date', key: 'date', sample: '03/10/2026' },
    { header: 'Party / Remarks', key: 'party', sample: 'Hindalco Industries' },
    { header: 'Item Name', key: 'name', sample: 'Aluminium Ingot 6063 Grade' },
    { header: 'Qty', key: 'qty', sample: 50 },
    { header: 'U-Cap', key: 'uCap', sample: 10 },
    { header: 'L-Cap', key: 'lCap', sample: 10 }
  ], []);

  // =========================================================================
  // TAB 4: STOCK BALANCE TOOLS (EXPORT CSV & PRINT REPORT)
  // =========================================================================

  // Export Stock Balance CSV
  const handleExportStockCsv = () => {
    macAudio.playClick();
    const headers = [
      'Item Name',
      'Category',
      'Inward Qty',
      'Outward Qty',
      'Balance Qty',
      'Inward U-Cap',
      'Outward U-Cap',
      'Balance U-Cap',
      'Inward L-Cap',
      'Outward L-Cap',
      'Balance L-Cap',
      'Status'
    ];

    const rows = stockBalanceList.map((r) => [
      `"${r.itemName}"`,
      `"${r.category}"`,
      r.inwardQty,
      r.outwardQty,
      r.balanceQty,
      r.inwardUCap,
      r.outwardUCap,
      r.balanceUCap,
      r.inwardLCap,
      r.outwardLCap,
      r.balanceLCap,
      `"${r.status}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Stock_Balance_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Stock Balance CSV exported successfully!', 'success');
  };

  // Print Stock Report
  const handlePrintStockReport = () => {
    macAudio.playClick();
    const printWindow = window.open('', '_blank', 'width=950,height=750');
    if (!printWindow) {
      showToast('Could not open print window. Please allow popups.', 'error');
      return;
    }

    const rowsHtml = filteredBalanceList
      .map(
        (r, idx) => `
        <tr style="background: ${idx % 2 === 0 ? '#f8fafc' : '#ffffff'};">
          <td style="padding: 6px 8px; border: 1px solid #cbd5e1; font-weight: bold;">${r.itemName}</td>
          <td style="padding: 6px 8px; border: 1px solid #cbd5e1; text-align: center;">${r.inwardQty}</td>
          <td style="padding: 6px 8px; border: 1px solid #cbd5e1; text-align: center;">${r.outwardQty}</td>
          <td style="padding: 6px 8px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold; color: ${
            r.balanceQty < 0 ? '#dc2626' : '#059669'
          }">${r.balanceQty}</td>
          <td style="padding: 6px 8px; border: 1px solid #cbd5e1; text-align: center;">${r.inwardUCap}</td>
          <td style="padding: 6px 8px; border: 1px solid #cbd5e1; text-align: center;">${r.outwardUCap}</td>
          <td style="padding: 6px 8px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold;">${r.balanceUCap}</td>
          <td style="padding: 6px 8px; border: 1px solid #cbd5e1; text-align: center;">${r.inwardLCap}</td>
          <td style="padding: 6px 8px; border: 1px solid #cbd5e1; text-align: center;">${r.outwardLCap}</td>
          <td style="padding: 6px 8px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold;">${r.balanceLCap}</td>
        </tr>
      `
      )
      .join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Stock Inventory Balance Report</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 20px; color: #0f172a; }
            h2 { margin: 0 0 4px 0; color: #0f172a; }
            p { margin: 0 0 16px 0; color: #64748b; font-size: 13px; }
            table { width: 100%; border-collapse: collapse; font-size: 11px; }
            th { background: #0f172a; color: white; padding: 7px 8px; border: 1px solid #0f172a; }
            @media print {
              body { padding: 0; }
              @page { margin: 10mm; }
            }
          </style>
        </head>
        <body>
          <h2>STOCK INVENTORY BALANCE REPORT</h2>
          <p>Generated on ${new Date().toLocaleString()} | Total Items: ${stockBalanceList.length} | Net Qty: ${totalStats.totalQty}</p>
          <table>
            <thead>
              <tr>
                <th rowspan="2">Item Name (With Size)</th>
                <th colspan="3">ITEM QTY</th>
                <th colspan="3">U CAP</th>
                <th colspan="3">L CAP</th>
              </tr>
              <tr>
                <th>Inward</th><th>Outward</th><th>Balance</th>
                <th>Inward</th><th>Outward</th><th>Balance</th>
                <th>Inward</th><th>Outward</th><th>Balance</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // =========================================================================
  // TAB 5: PRINT BARCODE LOGIC
  // =========================================================================

  // Populate barcode states from stock items if empty
  useEffect(() => {
    if (Object.keys(barcodeStates).length === 0 && stockBalanceList.length > 0) {
      const initial: Record<string, BarcodeItemState> = {};
      stockBalanceList.forEach((b) => {
        initial[b.itemName] = {
          itemName: b.itemName,
          category: b.category,
          qty: 1,
          qtyChecked: true,
          uCapName: 'U Cap',
          uCapQty: 1,
          uCapChecked: false,
          lCapName: 'L Cap',
          lCapQty: 1,
          lCapChecked: false
        };
      });
      setBarcodeStates(initial);
    }
  }, [stockBalanceList, barcodeStates]);

  // Barcode items filtered
  const filteredBarcodeItems = useMemo(() => {
    return stockBalanceList.filter((b) => {
      const matchSearch = !barcodeSearch.trim() || b.itemName.toLowerCase().includes(barcodeSearch.toLowerCase());
      const matchCat = barcodeCategory === 'All Categories' || b.category === barcodeCategory;
      return matchSearch && matchCat;
    });
  }, [stockBalanceList, barcodeSearch, barcodeCategory]);

  const barcodePageSlice = useMemo(() => {
    const start = (barcodePage - 1) * barcodePageSize;
    return filteredBarcodeItems.slice(start, start + barcodePageSize);
  }, [filteredBarcodeItems, barcodePage, barcodePageSize]);

  const barcodeKeyNav = useTableKeyboardNavigation({
    tableId: 'barcode',
    itemCount: barcodePageSlice.length,
    selectedIndex: barcodeSelectedIndex,
    onSelectIndex: setBarcodeSelectedIndex,
    isPaginated: filteredBarcodeItems.length > barcodePageSize,
    currentPage: barcodePage,
    totalPages: Math.max(1, Math.ceil(filteredBarcodeItems.length / barcodePageSize)),
    onPageChange: (newPage) => setBarcodePage(newPage),
    tableContainerRef: barcodeTableWrapperRef
  });

  // Toggle all checkboxes
  const handleToggleAllBarcode = (field: 'qtyChecked' | 'uCapChecked' | 'lCapChecked', targetState: boolean) => {
    macAudio.playClick();
    setBarcodeStates((prev) => {
      const updated = { ...prev };
      filteredBarcodeItems.forEach((it) => {
        if (!updated[it.itemName]) {
          updated[it.itemName] = {
            itemName: it.itemName,
            category: it.category,
            qty: 1,
            qtyChecked: false,
            uCapName: 'U Cap',
            uCapQty: 1,
            uCapChecked: false,
            lCapName: 'L Cap',
            lCapQty: 1,
            lCapChecked: false
          };
        }
        updated[it.itemName] = {
          ...updated[it.itemName],
          [field]: targetState
        };
      });
      return updated;
    });
  };

  // Compile print jobs for barcode
  const barcodePrintJobs = useMemo(() => {
    const jobs: { name: string; component: string; code: string; qty: number }[] = [];

    Object.values(barcodeStates).forEach((st) => {
      if (st.qtyChecked && st.qty > 0) {
        jobs.push({
          name: st.itemName,
          component: 'ITEM',
          code: st.itemName.replace(/[^A-Za-z0-9]/g, '').slice(0, 10).toUpperCase(),
          qty: st.qty
        });
      }
      if (st.uCapChecked && st.uCapQty > 0) {
        jobs.push({
          name: `${st.itemName} (U-CAP)`,
          component: 'U-CAP',
          code: `U-${st.itemName.replace(/[^A-Za-z0-9]/g, '').slice(0, 8).toUpperCase()}`,
          qty: st.uCapQty
        });
      }
      if (st.lCapChecked && st.lCapQty > 0) {
        jobs.push({
          name: `${st.itemName} (L-CAP)`,
          component: 'L-CAP',
          code: `L-${st.itemName.replace(/[^A-Za-z0-9]/g, '').slice(0, 8).toUpperCase()}`,
          qty: st.lCapQty
        });
      }
    });

    return jobs;
  }, [barcodeStates]);

  // Unified Global Event Listeners for Stock Inventory Module
  useEffect(() => {
    const handleSubtabSwitch = (e: Event) => {
      const custom = e as CustomEvent<{ index: number }>;
      const idx = custom.detail?.index;
      if (idx === 1) setActiveTab('entry');
      else if (idx === 2) setActiveTab('inward');
      else if (idx === 3) setActiveTab('outward');
      else if (idx === 4) setActiveTab('balance');
      else if (idx === 5) setActiveTab('barcode');
    };

    const handleSave = () => {
      if (activeTab === 'entry') {
        handleSaveVoucher();
      }
    };

    const handlePrint = () => {
      if (activeTab === 'balance') {
        handlePrintStockReport();
      } else if (activeTab === 'barcode') {
        setIsBarcodePreviewOpen(true);
      }
    };

    const handleInsertRow = () => {
      if (activeTab === 'entry') {
        handleAddStockRow();
      }
    };

    const handleDeleteRow = () => {
      if (activeTab === 'entry') {
        if (stockRows.length > 1) {
          handleDeleteStockRow(stockRows.length - 1);
        }
      }
    };

    const handleHomeFocus = () => {
      if (activeTab === 'entry') {
        document.getElementById('stock-item-0')?.focus();
      } else if (activeTab === 'inward') {
        document.getElementById('inward-search-input')?.focus();
      } else if (activeTab === 'outward') {
        document.getElementById('outward-search-input')?.focus();
      } else if (activeTab === 'balance') {
        document.getElementById('balance-search-input')?.focus();
      } else if (activeTab === 'barcode') {
        document.getElementById('barcode-search-input')?.focus();
      }
    };

    window.addEventListener('app-subtab-switch', handleSubtabSwitch);
    window.addEventListener('app-save', handleSave);
    window.addEventListener('app-print', handlePrint);
    window.addEventListener('app-insert-row', handleInsertRow);
    window.addEventListener('app-delete-row', handleDeleteRow);
    window.addEventListener('app-home-focus', handleHomeFocus);

    return () => {
      window.removeEventListener('app-subtab-switch', handleSubtabSwitch);
      window.removeEventListener('app-save', handleSave);
      window.removeEventListener('app-print', handlePrint);
      window.removeEventListener('app-insert-row', handleInsertRow);
      window.removeEventListener('app-delete-row', handleDeleteRow);
      window.removeEventListener('app-home-focus', handleHomeFocus);
    };
  }, [activeTab, stockRows, handleSaveVoucher, handlePrintStockReport, handleAddStockRow, handleDeleteStockRow]);

  // =========================================================================
  // RENDER INTERFACE
  // =========================================================================

  return (
    <div 
      className="glass-panel" 
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 0,
        overflow: 'hidden',
        background: 'rgba(11, 15, 25, 0.94)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '10px'
      }}
    >
      {/* ------------------------------------------------------------- */}
      {/* TOP HEADER: TITLE & 5 SUB-TABS (MATCHING DESKTOP SOFTWARE) */}
      {/* ------------------------------------------------------------- */}
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(0, 0, 0, 0.35)',
          gap: '12px',
          flexShrink: 0
        }}
      >
        {/* Module Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div 
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: '#18181b',
              border: '1px solid #27272a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#f4f4f5'
            }}
          >
            <Package size={18} />
          </div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#f4f4f5', letterSpacing: '-0.3px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>Stock Inventory</span>
              <ShadcnBadge variant="outline" style={{ fontSize: '10px' }}>F8 Module</ShadcnBadge>
            </div>
            <div style={{ fontSize: '11px', color: '#a1a1aa' }}>
              Multi-Length Tracker • Inward/Outward Ledger • Balance Sheet
            </div>
          </div>
        </div>

        {/* 5 Inner Tabs Bar (Authentic shadcn/ui Tabs) */}
        <ShadcnTabs
          value={activeTab}
          onValueChange={(val) => {
            macAudio.playClick();
            setActiveTab(val as StockInnerTab);
          }}
        >
          <ShadcnTabsList>
            <ShadcnTabsTrigger value="entry">
              <ArrowDownLeft size={13} style={{ marginRight: 6 }} />
              <span>Enter Stock</span>
            </ShadcnTabsTrigger>
            <ShadcnTabsTrigger value="inward">
              <Layers size={13} style={{ marginRight: 6 }} />
              <span>Inward History</span>
            </ShadcnTabsTrigger>
            <ShadcnTabsTrigger value="outward">
              <ArrowUpRight size={13} style={{ marginRight: 6 }} />
              <span>Sale (Outward)</span>
            </ShadcnTabsTrigger>
            <ShadcnTabsTrigger value="balance">
              <Scale size={13} style={{ marginRight: 6 }} />
              <span>Stock Balance</span>
            </ShadcnTabsTrigger>
            <ShadcnTabsTrigger value="barcode">
              <Barcode size={13} style={{ marginRight: 6 }} />
              <span>Print Barcode</span>
            </ShadcnTabsTrigger>
          </ShadcnTabsList>
        </ShadcnTabs>

        {/* Quick Back to Bill or Status Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {editingVoucherId !== null && (
            <div 
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                borderRadius: '6px',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                color: '#f87171',
                fontSize: '11px',
                fontWeight: 700
              }}
            >
              <span>EDITING #{editingVoucherId}</span>
              <button
                type="button"
                onClick={handleCancelEdit}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#f87171',
                  cursor: 'pointer',
                  display: 'flex',
                  padding: 0
                }}
                title="Cancel Edit"
              >
                <X size={12} />
              </button>
            </div>
          )}

          {onBackToBill && (
            <ShadcnButton
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                macAudio.playClick();
                onBackToBill();
              }}
            >
              <span>Back to Bill</span>
              <ChevronRight size={13} />
            </ShadcnButton>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* INNER TAB CONTENT */}
      {/* ------------------------------------------------------------- */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* =========================================================== */}
        {/* TAB 1: ENTER STOCK (INWARD ENTRY WITH MULTI-COLUMNS & 3 BALANCES) */}
        {/* =========================================================== */}
        {activeTab === 'entry' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '8px', gap: '8px', minHeight: 0, overflow: 'hidden' }}>
            
            {/* Header: Date, Remarks, Voucher Load & Quick Size Column Bar */}
            <div 
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                background: '#18181b',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid #27272a',
                flexShrink: 0
              }}
            >
              {/* Row 1: Date, Remarks, Load by ID */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Date:</span>
                  <ShadcnDatePicker
                    value={voucherDate}
                    onChange={(val) => setVoucherDate(val)}
                    size="sm"
                    placeholder="Voucher Date"
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1 }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Remarks:</span>
                  <ShadcnInput
                    type="text"
                    placeholder=""
                    value={voucherRemarks}
                    onChange={(e) => setVoucherRemarks(e.target.value)}
                    style={{
                      height: '32px',
                      fontSize: '12px',
                      background: '#09090b',
                      border: '1px solid #27272a',
                      borderRadius: '6px'
                    }}
                  />
                </div>

                {/* Load Voucher by ID */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShadcnInput
                    type="number"
                    placeholder=""
                    value={loadVoucherIdInput}
                    onChange={(e) => setLoadVoucherIdInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && loadVoucherIdInput) {
                        handleLoadVoucherForEdit(parseInt(loadVoucherIdInput, 10));
                      }
                    }}
                    style={{
                      width: '110px',
                      height: '32px',
                      background: '#09090b',
                      border: '1px solid #27272a',
                      color: '#f4f4f5',
                      fontSize: '12px',
                      fontWeight: 600,
                      textAlign: 'center',
                      borderRadius: '6px',
                      fontFamily: 'monospace'
                    }}
                  />
                  <ShadcnButton
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      if (loadVoucherIdInput) {
                        handleLoadVoucherForEdit(parseInt(loadVoucherIdInput, 10));
                      }
                    }}
                    style={{ height: '32px', fontSize: '12px' }}
                  >
                    Load
                  </ShadcnButton>
                </div>
              </div>
            </div>

            {/* Inward Items Entry Table with MULTI-COLUMNS and 3 LIVE BALANCE COLUMNS */}
            <div 
              style={{
                flex: 1,
                minHeight: 0,
                overflow: 'auto',
                background: '#09090b',
                border: '1px solid #27272a',
                borderRadius: '8px'
              }}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: '#18181b' }}>
                  <tr style={{ borderBottom: '1px solid #27272a' }}>
                    <th style={{ width: '45px', padding: '8px 4px', textAlign: 'center', color: '#a1a1aa', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase' }}>#</th>
                    <th style={{ minWidth: '280px', padding: '8px 10px', textAlign: 'left', color: '#a1a1aa', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      ITEM NAME
                    </th>

                    {/* Primary Base Column (10 FT) */}
                    <th style={{ width: '95px', padding: '8px 8px', textAlign: 'right', color: '#a1a1aa', borderLeft: '1px solid #27272a', fontSize: '11px', fontWeight: 600 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                        <span>(10 FT)</span>
                        <button
                          type="button"
                          onClick={() => setIsAddColModalOpen(true)}
                          style={{
                            background: 'rgba(255, 255, 255, 0.15)',
                            border: '1px solid rgba(255, 255, 255, 0.3)',
                            color: '#ffffff',
                            borderRadius: '4px',
                            width: '18px',
                            height: '18px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: 700,
                            lineHeight: 1
                          }}
                          title="Add new size column"
                        >
                          +
                        </button>
                      </div>
                    </th>

                    {/* Dynamic Multi-Columns: (12 FT), (9.5 FT) etc. */}
                    {dynamicCols.map((dc) => (
                      <th 
                        key={dc.field} 
                        style={{
                          width: '95px',
                          padding: '8px 8px',
                          textAlign: 'right',
                          color: '#a1a1aa',
                          borderLeft: '1px solid #27272a',
                          fontSize: '11px',
                          fontWeight: 600
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                          <span>{dc.label}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveDynamicCol(dc.field, dc.label)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#ef4444',
                              cursor: 'pointer',
                              padding: 0,
                              display: 'flex',
                              alignItems: 'center'
                            }}
                            title={`Remove ${dc.label} column`}
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </th>
                    ))}

                    {/* U CAP & L CAP Input Columns (Always visible) */}
                    <th style={{ width: '85px', padding: '8px 8px', textAlign: 'right', color: '#a1a1aa', borderLeft: '1px solid #27272a', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>
                      U CAP
                    </th>
                    <th style={{ width: '85px', padding: '8px 8px', textAlign: 'right', color: '#a1a1aa', borderLeft: '1px solid #27272a', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>
                      L CAP
                    </th>

                    {/* REAL-TIME LIVE BALANCE TRACKING COLUMNS */}
                    {/* 1. Base (10 FT) Balance */}
                    <th 
                      style={{ 
                        width: '100px', 
                        padding: '8px 8px', 
                        textAlign: 'right', 
                        color: '#38bdf8', 
                        borderLeft: '2px solid rgba(56, 189, 248, 0.4)',
                        fontSize: '11px',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        background: 'rgba(56, 189, 248, 0.05)'
                      }}
                      title="Current live net balance of (10 FT)"
                    >
                      BAL (10 FT)
                    </th>

                    {/* 2. Dynamic Size Balances: BAL (12 FT), BAL (9.5 FT) etc. */}
                    {dynamicCols.map((dc) => (
                      <th 
                        key={`bal-${dc.field}`}
                        style={{ 
                          width: '100px', 
                          padding: '8px 8px', 
                          textAlign: 'right', 
                          color: '#38bdf8', 
                          borderLeft: '1px solid #27272a',
                          fontSize: '11px',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          background: 'rgba(56, 189, 248, 0.05)'
                        }}
                        title={`Current live net balance of ${dc.label}`}
                      >
                        BAL {dc.label}
                      </th>
                    ))}

                    {/* 3. U-Cap Balance */}
                    <th 
                      style={{ 
                        width: '95px', 
                        padding: '8px 8px', 
                        textAlign: 'right', 
                        color: '#a1a1aa', 
                        borderLeft: '1px solid #27272a',
                        fontSize: '11px',
                        fontWeight: 600,
                        textTransform: 'uppercase'
                      }}
                      title="Current live net balance of this item's U-Cap"
                    >
                      U-CAP BAL
                    </th>

                    {/* 4. L-Cap Balance */}
                    <th 
                      style={{ 
                        width: '95px', 
                        padding: '8px 8px', 
                        textAlign: 'right', 
                        color: '#a1a1aa', 
                        borderLeft: '1px solid #27272a',
                        fontSize: '11px',
                        fontWeight: 600,
                        textTransform: 'uppercase'
                      }}
                      title="Current live net balance of this item's L-Cap"
                    >
                      L-CAP BAL
                    </th>

                    <th style={{ width: '45px', padding: '8px 4px', textAlign: 'center', color: '#71717a', borderLeft: '1px solid #27272a', fontSize: '11px', fontWeight: 600 }}>DEL</th>
                  </tr>
                </thead>
                <tbody>
                  {stockRows.map((row, idx) => {
                    const balances = getLiveBalancesForRow(row.name);
                    const isDuplicate = duplicateItemSummary.names.includes(extractBaseItemName(row.name).toLowerCase());

                    return (
                      <tr 
                        key={row.id}
                        style={{
                          borderBottom: '1px solid #27272a',
                          background: isDuplicate ? 'rgba(239, 68, 68, 0.08)' : idx % 2 === 0 ? 'rgba(24, 24, 27, 0.4)' : 'transparent',
                          transition: 'background-color 0.15s ease'
                        }}
                      >
                        {/* Row Index */}
                        <td style={{ textAlign: 'center', color: '#71717a', fontWeight: 500, fontSize: '12px' }}>{idx + 1}</td>

                        {/* Item Name Input with Autocomplete */}
                        <td style={{ padding: '4px 6px', position: 'relative' }}>
                          <input
                            id={`stock-item-${idx}`}
                            type="text"
                            placeholder=""
                            value={row.name}
                            onChange={(e) => {
                              handleStockRowChange(idx, 'name', e.target.value);
                              setSuggestQuery(e.target.value);
                              setActiveSuggestRow(idx);
                              setSuggestIndex(0);
                            }}
                            onFocus={() => {
                              if (row.name) {
                                setSuggestQuery(row.name);
                                setActiveSuggestRow(idx);
                              }
                            }}
                            onBlur={(e) => {
                              setTimeout(() => setActiveSuggestRow(null), 200);
                              commitStockItemName(idx, e.target.value);
                            }}
                            onKeyDown={(e) => {
                              if (activeSuggestRow === idx && currentSuggestions.length > 0) {
                                if (e.key === 'ArrowDown') {
                                  e.preventDefault();
                                  setSuggestIndex((prev) => (prev + 1) % currentSuggestions.length);
                                  return;
                                }
                                if (e.key === 'ArrowUp') {
                                  e.preventDefault();
                                  setSuggestIndex((prev) => (prev - 1 + currentSuggestions.length) % currentSuggestions.length);
                                  return;
                                }
                                if (e.key === 'Enter' || e.key === 'Tab') {
                                  e.preventDefault();
                                  const selected = currentSuggestions[suggestIndex];
                                  if (selected) {
                                    handleStockRowChange(idx, 'name', selected.name);
                                    if (autoItem) {
                                      handleStockRowChange(idx, 'uCap', selected.uCap);
                                      handleStockRowChange(idx, 'lCap', selected.lCap);
                                    }
                                  }
                                  setActiveSuggestRow(null);
                                  document.getElementById(`stock-qty-10-${idx}`)?.focus();
                                  return;
                                }
                              }

                              if (e.key === 'ArrowDown') {
                                e.preventDefault();
                                const nextRow = document.getElementById(`stock-item-${idx + 1}`);
                                if (nextRow) nextRow.focus();
                                return;
                              }
                              if (e.key === 'ArrowUp') {
                                e.preventDefault();
                                const prevRow = document.getElementById(`stock-item-${idx - 1}`);
                                if (prevRow) prevRow.focus();
                                return;
                              }
                              if (e.key === 'ArrowRight' && (e.currentTarget.selectionEnd === e.currentTarget.value.length || !e.currentTarget.value)) {
                                e.preventDefault();
                                const nextCol = document.getElementById(`stock-qty-10-${idx}`);
                                if (nextCol) nextCol.focus();
                                return;
                              }

                              if (e.key === 'Enter') {
                                e.preventDefault();
                                setActiveSuggestRow(null);
                                commitStockItemName(idx, e.currentTarget.value);
                                const nextInput = document.getElementById(`stock-qty-10-${idx}`);
                                if (nextInput) nextInput.focus();
                              }
                            }}
                            style={{
                              width: '100%',
                              height: '30px',
                              background: '#18181b',
                              border: '1px solid #27272a',
                              borderRadius: '4px',
                              color: '#f4f4f5',
                              fontSize: '13px',
                              fontWeight: 500,
                              outline: 'none',
                              padding: '0 8px',
                              boxSizing: 'border-box'
                            }}
                          />

                          {/* Autocomplete Dropdown Popup */}
                          {activeSuggestRow === idx && currentSuggestions.length > 0 && (
                            <div 
                              style={{
                                position: 'absolute',
                                left: 6,
                                top: '100%',
                                zIndex: 100,
                                width: '320px',
                                background: '#18181b',
                                border: '1px solid #3f3f46',
                                borderRadius: '6px',
                                boxShadow: '0 12px 28px rgba(0,0,0,0.7)',
                                maxHeight: '200px',
                                overflowY: 'auto'
                              }}
                            >
                              {currentSuggestions.map((sug, sIdx) => {
                                const isHighlighted = sIdx === suggestIndex;
                                return (
                                  <div
                                    key={sug.name + sIdx}
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                      handleStockRowChange(idx, 'name', sug.name);
                                      if (autoItem) {
                                        handleStockRowChange(idx, 'uCap', sug.uCap);
                                        handleStockRowChange(idx, 'lCap', sug.lCap);
                                      }
                                      setActiveSuggestRow(null);
                                    }}
                                    style={{
                                      padding: '7px 10px',
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'center',
                                      background: isHighlighted ? '#27272a' : 'transparent',
                                      cursor: 'pointer',
                                      borderBottom: '1px solid #27272a'
                                    }}
                                  >
                                    <span style={{ color: '#f4f4f5', fontWeight: 500, fontSize: '12px' }}>
                                      {sug.name}
                                    </span>
                                    <span style={{ color: '#a1a1aa', fontSize: '11px' }}>{sug.desc || ''}</span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </td>

                        {/* Primary Base Column (10 FT) Qty Input */}
                        <td style={{ padding: '4px 6px', borderLeft: '1px solid #27272a' }}>
                          <input
                            id={`stock-qty-10-${idx}`}
                            type="number"
                            value={row.qty || ''}
                            onChange={(e) => handleStockRowChange(idx, 'qty', parseFloat(e.target.value) || 0)}
                            onKeyDown={(e) => {
                              if (e.key === 'ArrowDown') {
                                e.preventDefault();
                                document.getElementById(`stock-qty-10-${idx + 1}`)?.focus();
                                return;
                              }
                              if (e.key === 'ArrowUp') {
                                e.preventDefault();
                                document.getElementById(`stock-qty-10-${idx - 1}`)?.focus();
                                return;
                              }
                              if (e.key === 'ArrowLeft' && (e.currentTarget.selectionStart === 0 || !e.currentTarget.value)) {
                                e.preventDefault();
                                document.getElementById(`stock-item-${idx}`)?.focus();
                                return;
                              }
                              if (e.key === 'ArrowRight' && (e.currentTarget.selectionEnd === e.currentTarget.value.length || !e.currentTarget.value)) {
                                e.preventDefault();
                                if (dynamicCols.length > 0) {
                                  document.getElementById(`stock-${dynamicCols[0].field}-${idx}`)?.focus();
                                } else {
                                  document.getElementById(`stock-ucap-${idx}`)?.focus();
                                }
                                return;
                              }
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                if (dynamicCols.length > 0) {
                                  const nextDyn = document.getElementById(`stock-${dynamicCols[0].field}-${idx}`);
                                  if (nextDyn) nextDyn.focus();
                                } else {
                                  const next = document.getElementById(`stock-ucap-${idx}`);
                                  if (next) next.focus();
                                }
                              }
                            }}
                            style={{
                              width: '100%',
                              height: '30px',
                              textAlign: 'right',
                              background: '#18181b',
                              border: '1px solid #27272a',
                              borderRadius: '4px',
                              color: '#f4f4f5',
                              fontSize: '13px',
                              fontWeight: 500,
                              outline: 'none',
                              padding: '0 6px',
                              boxSizing: 'border-box'
                            }}
                          />
                        </td>

                        {/* Dynamic Multi-Column Inputs: (12 FT), (9.5 FT) etc. */}
                        {dynamicCols.map((dc, dcIdx) => (
                          <td key={dc.field} style={{ padding: '4px 6px', borderLeft: '1px solid #27272a' }}>
                            <input
                              id={`stock-${dc.field}-${idx}`}
                              type="number"
                              value={row[dc.field] || ''}
                              onChange={(e) => handleStockRowChange(idx, dc.field, parseFloat(e.target.value) || 0)}
                              onKeyDown={(e) => {
                                if (e.key === 'ArrowDown') {
                                  e.preventDefault();
                                  document.getElementById(`stock-${dc.field}-${idx + 1}`)?.focus();
                                  return;
                                }
                                if (e.key === 'ArrowUp') {
                                  e.preventDefault();
                                  document.getElementById(`stock-${dc.field}-${idx - 1}`)?.focus();
                                  return;
                                }
                                if (e.key === 'ArrowLeft' && (e.currentTarget.selectionStart === 0 || !e.currentTarget.value)) {
                                  e.preventDefault();
                                  if (dcIdx === 0) {
                                    document.getElementById(`stock-qty-10-${idx}`)?.focus();
                                  } else {
                                    document.getElementById(`stock-${dynamicCols[dcIdx - 1].field}-${idx}`)?.focus();
                                  }
                                  return;
                                }
                                if (e.key === 'ArrowRight' && (e.currentTarget.selectionEnd === e.currentTarget.value.length || !e.currentTarget.value)) {
                                  e.preventDefault();
                                  if (dcIdx < dynamicCols.length - 1) {
                                    document.getElementById(`stock-${dynamicCols[dcIdx + 1].field}-${idx}`)?.focus();
                                  } else {
                                    document.getElementById(`stock-ucap-${idx}`)?.focus();
                                  }
                                  return;
                                }
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  if (dcIdx < dynamicCols.length - 1) {
                                    const next = document.getElementById(`stock-${dynamicCols[dcIdx + 1].field}-${idx}`);
                                    if (next) next.focus();
                                  } else {
                                    const next = document.getElementById(`stock-ucap-${idx}`);
                                    if (next) next.focus();
                                  }
                                }
                              }}
                              style={{
                                width: '100%',
                                height: '30px',
                                textAlign: 'right',
                                background: '#18181b',
                                border: '1px solid #27272a',
                                borderRadius: '4px',
                                color: '#f4f4f5',
                                fontSize: '13px',
                                fontWeight: 500,
                                outline: 'none',
                                padding: '0 6px',
                                boxSizing: 'border-box'
                              }}
                            />
                          </td>
                        ))}

                        {/* U Cap Input (Always Visible) */}
                        <td style={{ padding: '4px 6px', borderLeft: '1px solid #27272a' }}>
                          <input
                            id={`stock-ucap-${idx}`}
                            type="number"
                            value={row.uCap || ''}
                            onChange={(e) => handleStockRowChange(idx, 'uCap', parseFloat(e.target.value) || 0)}
                            onKeyDown={(e) => {
                              if (e.key === 'ArrowDown') {
                                e.preventDefault();
                                document.getElementById(`stock-ucap-${idx + 1}`)?.focus();
                                return;
                              }
                              if (e.key === 'ArrowUp') {
                                e.preventDefault();
                                document.getElementById(`stock-ucap-${idx - 1}`)?.focus();
                                return;
                              }
                              if (e.key === 'ArrowLeft' && (e.currentTarget.selectionStart === 0 || !e.currentTarget.value)) {
                                e.preventDefault();
                                if (dynamicCols.length > 0) {
                                  document.getElementById(`stock-${dynamicCols[dynamicCols.length - 1].field}-${idx}`)?.focus();
                                } else {
                                  document.getElementById(`stock-qty-10-${idx}`)?.focus();
                                }
                                return;
                              }
                              if (e.key === 'ArrowRight' && (e.currentTarget.selectionEnd === e.currentTarget.value.length || !e.currentTarget.value)) {
                                e.preventDefault();
                                document.getElementById(`stock-lcap-${idx}`)?.focus();
                                return;
                              }
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                const next = document.getElementById(`stock-lcap-${idx}`);
                                if (next) next.focus();
                              }
                            }}
                            style={{
                              width: '100%',
                              height: '30px',
                              textAlign: 'right',
                              background: '#18181b',
                              border: '1px solid #27272a',
                              borderRadius: '4px',
                              color: '#f4f4f5',
                              fontSize: '13px',
                              fontWeight: 500,
                              outline: 'none',
                              padding: '0 6px',
                              boxSizing: 'border-box'
                            }}
                          />
                        </td>

                        {/* L Cap Input (Always Visible) */}
                        <td style={{ padding: '4px 6px', borderLeft: '1px solid #27272a' }}>
                          <input
                            id={`stock-lcap-${idx}`}
                            type="number"
                            value={row.lCap || ''}
                            onChange={(e) => handleStockRowChange(idx, 'lCap', parseFloat(e.target.value) || 0)}
                            onKeyDown={(e) => {
                              if (e.key === 'ArrowDown') {
                                e.preventDefault();
                                document.getElementById(`stock-lcap-${idx + 1}`)?.focus();
                                return;
                              }
                              if (e.key === 'ArrowUp') {
                                e.preventDefault();
                                document.getElementById(`stock-lcap-${idx - 1}`)?.focus();
                                return;
                              }
                              if (e.key === 'ArrowLeft' && (e.currentTarget.selectionStart === 0 || !e.currentTarget.value)) {
                                e.preventDefault();
                                document.getElementById(`stock-ucap-${idx}`)?.focus();
                                return;
                              }
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                if (idx === stockRows.length - 1) {
                                  handleAddStockRow();
                                  setTimeout(() => {
                                    document.getElementById(`stock-item-${idx + 1}`)?.focus();
                                  }, 50);
                                } else {
                                  document.getElementById(`stock-item-${idx + 1}`)?.focus();
                                }
                              }
                            }}
                            style={{
                              width: '100%',
                              height: '30px',
                              textAlign: 'right',
                              background: '#18181b',
                              border: '1px solid #27272a',
                              borderRadius: '4px',
                              color: '#f4f4f5',
                              fontSize: '13px',
                              fontWeight: 500,
                              outline: 'none',
                              padding: '0 6px',
                              boxSizing: 'border-box'
                            }}
                          />
                        </td>

                        {/* ========================================================= */}
                        {/* REAL-TIME LIVE BALANCE TRACKING CELLS (RED/GREEN/GRAY)     */}
                        {/* ========================================================= */}

                        {/* 1. Base (10 FT) Balance Cell */}
                        <td 
                          style={{
                            padding: '6px 8px',
                            textAlign: 'right',
                            fontSize: '12px',
                            borderLeft: '2px solid rgba(56, 189, 248, 0.4)',
                            background: 'rgba(56, 189, 248, 0.03)'
                          }}
                        >
                          {renderBalanceBadge(balances.sizeBals['10FT'] ?? (balances.hasItem ? 0 : null), balances.hasItem)}
                        </td>

                        {/* 2. Dynamic Size Balances: BAL (12 FT), BAL (9.5 FT) etc. */}
                        {dynamicCols.map((dc) => {
                          const szKey = dc.label.replace(/[()\s]/g, '').toUpperCase();
                          const normKey = szKey.endsWith('FT') ? szKey : `${szKey}FT`;
                          const szBal = balances.sizeBals[normKey] ?? (balances.hasItem ? 0 : null);
                          return (
                            <td 
                              key={`bal-cell-${dc.field}`}
                              style={{
                                padding: '6px 8px',
                                textAlign: 'right',
                                fontSize: '12px',
                                borderLeft: '1px solid #27272a',
                                background: 'rgba(56, 189, 248, 0.03)'
                              }}
                            >
                              {renderBalanceBadge(szBal, balances.hasItem)}
                            </td>
                          );
                        })}

                        {/* 3. U-Cap Balance Cell (Always Visible) */}
                        <td 
                          style={{
                            padding: '6px 8px',
                            textAlign: 'right',
                            fontSize: '12px',
                            borderLeft: '1px solid #27272a'
                          }}
                        >
                          {renderBalanceBadge(balances.uCapBal, balances.hasItem)}
                        </td>

                        {/* 4. L-Cap Balance Cell (Always Visible) */}
                        <td 
                          style={{
                            padding: '6px 8px',
                            textAlign: 'right',
                            fontSize: '12px',
                            borderLeft: '1px solid #27272a'
                          }}
                        >
                          {renderBalanceBadge(balances.lCapBal, balances.hasItem)}
                        </td>

                        {/* Delete Row Button */}
                        <td style={{ textAlign: 'center', borderLeft: '1px solid #27272a' }}>
                          <ShadcnButton
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteStockRow(idx)}
                            style={{
                              height: '26px',
                              width: '26px',
                              padding: 0,
                              color: '#71717a'
                            }}
                            title="Delete row"
                          >
                            <Trash2 size={13} />
                          </ShadcnButton>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot
                  style={{
                    position: 'sticky',
                    bottom: 0,
                    zIndex: 10,
                    background: '#121214',
                    borderTop: '2px solid #3f3f46',
                    boxShadow: '0 -4px 12px rgba(0,0,0,0.6)'
                  }}
                >
                  <tr style={{ height: '34px', background: '#121214' }}>
                    {/* # Index / Count */}
                    <td style={{ textAlign: 'center', color: '#71717a', fontSize: '11px', fontWeight: 600 }}>
                      #
                    </td>

                    {/* Item Name Column -> Shows "TOTAL" and Duplicates Badge if any */}
                    <td style={{ padding: '4px 10px', textAlign: 'left' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ color: '#38bdf8', fontSize: '11px', fontWeight: 800, letterSpacing: '0.05em' }}>
                          TOTAL {entryTotals.validItems > 0 ? `(${entryTotals.validItems})` : ''}
                        </span>
                        {duplicateItemSummary.count > 0 && (
                          <span style={{ 
                            background: 'rgba(239, 68, 68, 0.2)', 
                            color: '#ef4444', 
                            border: '1px solid rgba(239, 68, 68, 0.4)',
                            padding: '1px 6px', 
                            borderRadius: '4px', 
                            fontSize: '10px', 
                            fontWeight: 700 
                          }}>
                            DUP: {duplicateItemSummary.count}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* (10 FT) Column Total */}
                    <td style={{ 
                      padding: '4px 8px', 
                      textAlign: 'right', 
                      color: '#38bdf8', 
                      borderLeft: '1px solid #27272a',
                      fontSize: '13px', 
                      fontWeight: 800, 
                      fontFamily: "'JetBrains Mono', monospace" 
                    }}>
                      <AnimatedCounter value={entryTotals.main10Qty || 0} />
                    </td>

                    {/* Dynamic Size Columns Totals (e.g. 12 FT, 9.5 FT) */}
                    {dynamicCols.map((dc) => (
                      <td 
                        key={`foot-${dc.field}`} 
                        style={{ 
                          padding: '4px 8px', 
                          textAlign: 'right', 
                          color: '#38bdf8', 
                          borderLeft: '1px solid #27272a',
                          fontSize: '13px', 
                          fontWeight: 800, 
                          fontFamily: "'JetBrains Mono', monospace" 
                        }}
                      >
                        <AnimatedCounter value={entryTotals.dynamicQtyTotals[dc.field] || 0} />
                      </td>
                    ))}

                    {/* U CAP Total */}
                    <td style={{ 
                      padding: '4px 8px', 
                      textAlign: 'right', 
                      color: '#f4f4f5', 
                      borderLeft: '1px solid #27272a',
                      fontSize: '13px', 
                      fontWeight: 800, 
                      fontFamily: "'JetBrains Mono', monospace" 
                    }}>
                      <AnimatedCounter value={entryTotals.uCap || 0} />
                    </td>

                    {/* L CAP Total */}
                    <td style={{ 
                      padding: '4px 8px', 
                      textAlign: 'right', 
                      color: '#f4f4f5', 
                      borderLeft: '1px solid #27272a',
                      fontSize: '13px', 
                      fontWeight: 800, 
                      fontFamily: "'JetBrains Mono', monospace" 
                    }}>
                      <AnimatedCounter value={entryTotals.lCap || 0} />
                    </td>

                    {/* BAL (10 FT) Total */}
                    <td 
                      style={{ 
                        padding: '4px 8px', 
                        textAlign: 'right', 
                        color: balanceTotals.count === 0 ? '#71717a' : balanceTotals.bal10 > 0 ? '#22c55e' : balanceTotals.bal10 < 0 ? '#ef4444' : '#71717a',
                        borderLeft: '2px solid rgba(56, 189, 248, 0.4)', 
                        background: 'rgba(56, 189, 248, 0.02)',
                        fontSize: '13px', 
                        fontWeight: 800, 
                        fontFamily: "'JetBrains Mono', monospace" 
                      }}
                    >
                      <AnimatedCounter 
                        value={balanceTotals.bal10} 
                        prefix={balanceTotals.bal10 > 0 ? '+' : undefined} 
                        style={{ color: balanceTotals.count === 0 ? '#71717a' : balanceTotals.bal10 > 0 ? '#22c55e' : balanceTotals.bal10 < 0 ? '#ef4444' : '#71717a' }}
                      />
                    </td>

                    {/* Dynamic BAL Columns Totals */}
                    {dynamicCols.map((dc) => {
                      const val = balanceTotals.dynamicBalTotals[dc.field] || 0;
                      const colColor = balanceTotals.count === 0 ? '#71717a' : val > 0 ? '#22c55e' : val < 0 ? '#ef4444' : '#71717a';
                      return (
                        <td 
                          key={`foot-bal-${dc.field}`} 
                          style={{ 
                            padding: '4px 8px', 
                            textAlign: 'right', 
                            color: colColor,
                            borderLeft: '1px solid #27272a', 
                            background: 'rgba(56, 189, 248, 0.02)',
                            fontSize: '13px', 
                            fontWeight: 800, 
                            fontFamily: "'JetBrains Mono', monospace" 
                          }}
                        >
                          <AnimatedCounter 
                            value={val} 
                            prefix={val > 0 ? '+' : undefined} 
                            style={{ color: colColor }}
                          />
                        </td>
                      );
                    })}

                    {/* U-CAP BAL Total */}
                    <td 
                      style={{ 
                        padding: '4px 8px', 
                        textAlign: 'right', 
                        color: balanceTotals.count === 0 ? '#71717a' : balanceTotals.uCapBal > 0 ? '#22c55e' : balanceTotals.uCapBal < 0 ? '#ef4444' : '#71717a',
                        borderLeft: '1px solid #27272a',
                        fontSize: '13px', 
                        fontWeight: 800, 
                        fontFamily: "'JetBrains Mono', monospace" 
                      }}
                    >
                      <AnimatedCounter 
                        value={balanceTotals.uCapBal} 
                        prefix={balanceTotals.uCapBal > 0 ? '+' : undefined} 
                        style={{ color: balanceTotals.count === 0 ? '#71717a' : balanceTotals.uCapBal > 0 ? '#22c55e' : balanceTotals.uCapBal < 0 ? '#ef4444' : '#71717a' }}
                      />
                    </td>

                    {/* L-CAP BAL Total */}
                    <td 
                      style={{ 
                        padding: '4px 8px', 
                        textAlign: 'right', 
                        color: balanceTotals.count === 0 ? '#71717a' : balanceTotals.lCapBal > 0 ? '#22c55e' : balanceTotals.lCapBal < 0 ? '#ef4444' : '#71717a',
                        borderLeft: '1px solid #27272a',
                        fontSize: '13px', 
                        fontWeight: 800, 
                        fontFamily: "'JetBrains Mono', monospace" 
                      }}
                    >
                      <AnimatedCounter 
                        value={balanceTotals.lCapBal} 
                        prefix={balanceTotals.lCapBal > 0 ? '+' : undefined} 
                        style={{ color: balanceTotals.count === 0 ? '#71717a' : balanceTotals.lCapBal > 0 ? '#22c55e' : balanceTotals.lCapBal < 0 ? '#ef4444' : '#71717a' }}
                      />
                    </td>

                    {/* DEL */}
                    <td style={{ borderLeft: '1px solid #27272a' }}></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Footer Toolbar: 3 Apple-Box Mode Buttons (Matching Bill UI), Add Row, Barcode, Save Button */}
            <div 
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '4px 6px',
                gap: '10px',
                flexShrink: 0,
                background: 'rgba(24, 24, 27, 0.6)',
                border: '1px solid #27272a',
                borderRadius: '8px'
              }}
            >
              {/* Left: 3 Apple-Box Mode Buttons (Matching Bill UI BottomModeBar) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {/* Button 1: AUTO CONVERT */}
                <ShadcnTooltip title="AUTO CONVERT [Alt+A / Numpad *]" side="top">
                  <button
                    type="button"
                    onMouseEnter={() => macAudio.playHover()}
                    onClick={() => {
                      macAudio.playClick();
                      handleToggle('autoConvert');
                      showToast?.(`AUTO CONVERT: ${!autoConvert ? 'ON' : 'OFF'}`, !autoConvert ? 'success' : 'info');
                    }}
                    className={`apple-box-btn ${autoConvert ? 'active' : ''}`}
                    style={{ width: '36px', height: '36px' }}
                  >
                    <ArrowRightLeft size={16} color={autoConvert ? '#38bdf8' : 'currentColor'} />
                  </button>
                </ShadcnTooltip>

                {/* Button 2: AUTO ITEM */}
                <ShadcnTooltip title="AUTO ITEM [Alt+Z / Numpad *]" side="top">
                  <button
                    type="button"
                    onMouseEnter={() => macAudio.playHover()}
                    onClick={() => {
                      macAudio.playClick();
                      handleToggle('autoItem');
                      showToast?.(`AUTO ITEM: ${!autoItem ? 'ON' : 'OFF'}`, !autoItem ? 'success' : 'info');
                    }}
                    className={`apple-box-btn ${autoItem ? 'active' : ''}`}
                    style={{ width: '36px', height: '36px' }}
                  >
                    <PackagePlus size={16} color={autoItem ? '#38bdf8' : 'currentColor'} />
                  </button>
                </ShadcnTooltip>

                {/* Button 3: SIMPLE MODE */}
                <ShadcnTooltip title="SIMPLE MODE [Alt+X / Numpad *]" side="top">
                  <button
                    type="button"
                    onMouseEnter={() => macAudio.playHover()}
                    onClick={() => {
                      macAudio.playClick();
                      handleToggle('simpleMode');
                      showToast?.(`SIMPLE MODE: ${!simpleMode ? 'ON' : 'OFF'}`, !simpleMode ? 'success' : 'info');
                    }}
                    className={`apple-box-btn ${simpleMode ? 'active' : ''}`}
                    style={{ width: '36px', height: '36px' }}
                  >
                    <SlidersHorizontal size={16} color={simpleMode ? '#38bdf8' : 'currentColor'} />
                  </button>
                </ShadcnTooltip>

                <div style={{ width: '1px', height: '22px', background: '#27272a', margin: '0 2px' }} />

                {/* Quick Barcode Scanner Input */}
                <ShadcnInput
                  type="text"
                  placeholder="Scan barcode..."
                  value={barcodeScanInput}
                  onChange={(e) => setBarcodeScanInput(e.target.value)}
                  onKeyDown={handleBarcodeScan}
                  style={{
                    height: '34px',
                    width: '160px',
                    fontSize: '12px',
                    background: '#09090b',
                    border: '1px solid #27272a',
                    borderRadius: '6px',
                    color: '#f4f4f5'
                  }}
                />
              </div>

              {/* Right: Actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {/* Universal Excel/CSV Export, Import & Template */}
                <ExcelCsvActions<StockVoucherItem>
                  title="Inward Voucher Items"
                  filenamePrefix="Inward_Voucher_Items"
                  data={stockRows.filter(r => r.name && r.name.trim() !== '')}
                  columns={voucherItemCsvColumns}
                  onImport={handleImportVoucherItems}
                />

                <ShadcnButton
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={handleSaveVoucher}
                  style={{
                    height: '32px',
                    fontSize: '12px',
                    fontWeight: 600,
                    padding: '0 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Save size={13} />
                  <span>{editingVoucherId !== null ? 'Update Voucher' : 'Save Voucher'}</span>
                </ShadcnButton>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================== */}
        {/* TAB 2: INWARD HISTORY */}
        {/* =========================================================== */}
        {activeTab === 'inward' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '8px', gap: '8px', minHeight: 0, overflow: 'hidden' }}>
            
            {/* Filter Bar */}
            <div 
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                background: '#18181b',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid #27272a',
                flexShrink: 0
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, position: 'relative' }}>
                <Search size={14} style={{ color: '#71717a', position: 'absolute', left: '10px' }} />
                <ShadcnInput
                  id="inward-search-input"
                  data-search-box="true"
                  type="text"
                  placeholder="Search inward vouchers..."
                  value={inwardSearch}
                  onChange={(e) => setInwardSearch(e.target.value)}
                  style={{
                    height: '32px',
                    paddingLeft: '32px',
                    fontSize: '12px',
                    background: '#09090b',
                    border: '1px solid #27272a',
                    borderRadius: '6px'
                  }}
                />
              </div>

              <ShadcnSelect
                value={inwardTypeFilter}
                onChange={(e: any) => setInwardTypeFilter(e.target.value)}
                style={{
                  width: '160px',
                  height: '32px',
                  fontSize: '12px'
                }}
              >
                <option value="ALL TYPES">ALL TYPES</option>
                <option value="STOCK VOUCHER">STOCK VOUCHERS</option>
                <option value="PURCHASE">PURCHASE BILLS</option>
              </ShadcnSelect>

              <ShadcnButton
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  macAudio.playClick();
                  setInwardSearch('');
                  setInwardTypeFilter('ALL TYPES');
                }}
                style={{
                  height: '32px',
                  fontSize: '12px',
                  borderColor: '#27272a',
                  color: '#a1a1aa'
                }}
              >
                Clear
              </ShadcnButton>

              {/* Universal Excel/CSV Export, Import & Template */}
              <ExcelCsvActions<any>
                title="Inward History"
                filenamePrefix="Stock_Inward_History"
                data={filteredInwardItems}
                columns={inwardHistoryCsvColumns}
              />
            </div>

            {/* History Table */}
            <div 
              id="inward-wrapper"
              ref={inwardTableWrapperRef}
              tabIndex={0}
              onKeyDown={inwardKeyNav.handleKeyDown}
              style={{
                flex: 1,
                minHeight: 0,
                overflow: 'auto',
                background: '#09090b',
                border: '1px solid #27272a',
                borderRadius: '8px',
                outline: 'none'
              }}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: '#18181b' }}>
                  <tr style={{ borderBottom: '1px solid #27272a' }}>
                    <th style={{ width: '100px', padding: '8px 10px', textAlign: 'left', color: '#a1a1aa', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>ID</th>
                    <th style={{ width: '60px', padding: '8px 8px', textAlign: 'center', color: '#a1a1aa', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>TYPE</th>
                    <th style={{ width: '95px', padding: '8px 10px', textAlign: 'left', color: '#a1a1aa', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>DATE</th>
                    <th style={{ minWidth: '160px', padding: '8px 10px', textAlign: 'left', color: '#a1a1aa', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>PARTY / REMARKS</th>
                    <th style={{ minWidth: '240px', padding: '8px 10px', textAlign: 'left', color: '#a1a1aa', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>ITEM NAME (WITH SIZE)</th>
                    <th style={{ width: '75px', padding: '8px 10px', textAlign: 'right', color: '#a1a1aa', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>QTY</th>
                    <th style={{ width: '75px', padding: '8px 10px', textAlign: 'right', color: '#a1a1aa', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>U CAP</th>
                    <th style={{ width: '75px', padding: '8px 10px', textAlign: 'right', color: '#a1a1aa', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>L CAP</th>
                    <th style={{ width: '75px', padding: '8px 10px', textAlign: 'center', color: '#a1a1aa', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {inwardPageSlice.map((item, idx) => {
                    const isSelected = inwardSelectedIndex === idx;
                    return (
                      <tr
                        key={item.id}
                        id={`inward-row-${idx}`}
                        onClick={() => {
                          setInwardSelectedIndex(idx);
                          macAudio.playClick();
                        }}
                        onDoubleClick={() => {
                          if (item.rawVoucherId !== null) {
                            handleLoadVoucherForEdit(item.rawVoucherId);
                          }
                        }}
                        style={{
                          borderBottom: '1px solid #27272a',
                          background: isSelected ? '#27272a' : (idx % 2 === 0 ? 'rgba(24, 24, 27, 0.4)' : 'transparent'),
                          borderLeft: isSelected ? '3px solid #38bdf8' : '3px solid transparent',
                          cursor: item.rawVoucherId !== null ? 'pointer' : 'default',
                          transition: 'background-color 0.15s ease'
                        }}
                        title={item.rawVoucherId !== null ? 'Double click to edit voucher' : ''}
                      >
                        <td style={{ padding: '8px 10px', color: '#f4f4f5', fontWeight: 500, fontSize: '12px' }}>{item.voucherId}</td>
                        <td style={{ padding: '8px 8px', textAlign: 'center' }}>
                          {item.voucherType === 'STOCK VOUCHER' ? (
                            <span
                              title="Stock Voucher"
                              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '24px', borderRadius: '4px', background: '#27272a', border: '1px solid #3f3f46', color: '#f4f4f5' }}
                            >
                              <FileText size={13} />
                            </span>
                          ) : (
                            <span
                              title="Purchase Bill"
                              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '24px', borderRadius: '4px', background: '#18181b', border: '1px solid #27272a', color: '#a1a1aa' }}
                            >
                              <ShoppingCart size={13} />
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '8px 10px', color: '#a1a1aa', fontSize: '12px' }}>{item.date}</td>
                        <td style={{ padding: '8px 10px', color: '#e4e4e7', fontWeight: 500, fontSize: '12px' }}>{item.party}</td>
                        <td style={{ padding: '8px 10px', color: '#f4f4f5', fontWeight: 500, fontSize: '12px' }}>{item.name}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'right', color: '#f4f4f5', fontWeight: 500, fontSize: '12px' }}>{item.qty}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'right', color: '#f4f4f5', fontWeight: 500, fontSize: '12px' }}>{item.uCap}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'right', color: '#f4f4f5', fontWeight: 500, fontSize: '12px' }}>{item.lCap}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                          {item.rawVoucherId !== null ? (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                              <ShadcnTooltip title="Edit Stock Voucher" side="left">
                                <ShadcnButton type="button" variant="outline" size="sm" onClick={() => handleLoadVoucherForEdit(item.rawVoucherId!)} style={{ height: '26px', padding: '0 8px', fontSize: '12px', borderColor: '#27272a', color: '#f4f4f5' }}>Edit</ShadcnButton>
                              </ShadcnTooltip>
                              <ShadcnTooltip title="Delete Voucher (Delete)" side="left">
                                <ShadcnButton type="button" variant="ghost" size="sm" onClick={() => handleDeleteVoucher(item.rawVoucherId!)} style={{ height: '26px', width: '26px', padding: 0, color: '#71717a' }}><Trash2 size={13} /></ShadcnButton>
                              </ShadcnTooltip>
                            </div>
                          ) : (
                            <span style={{ color: '#71717a', fontSize: '12px' }}>Bill</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {/* Inward Pagination */}
            <ShadcnPagination
              idPrefix={inwardKeyNav.paginationIdPrefix}
              totalCount={filteredInwardItems.length}
              pageSize={inwardPageSize}
              currentPage={inwardPage}
              onPageChange={inwardKeyNav.handlePageChange}
              onPageSizeChange={(s) => { setInwardPageSize(s); setInwardPage(1); }}
              onFocusTableFirstRow={() => inwardKeyNav.focusTable('first')}
              onFocusTableLastRow={() => inwardKeyNav.focusTable('last')}
            />
          </div>
        )}


        {/* =========================================================== */}
        {/* TAB 3: SALE (OUTWARD) */}
        {/* =========================================================== */}
        {activeTab === 'outward' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '8px', gap: '8px', minHeight: 0, overflow: 'hidden' }}>
            
            {/* Filter Bar */}
            <div 
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                background: '#18181b',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid #27272a',
                flexShrink: 0
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, position: 'relative' }}>
                <Search size={14} style={{ color: '#71717a', position: 'absolute', left: '10px' }} />
                <ShadcnInput
                  id="outward-search-input"
                  data-search-box="true"
                  type="text"
                  placeholder="Search outward sales..."
                  value={outwardSearch}
                  onChange={(e) => setOutwardSearch(e.target.value)}
                  style={{
                    height: '32px',
                    paddingLeft: '32px',
                    fontSize: '12px',
                    background: '#09090b',
                    border: '1px solid #27272a',
                    borderRadius: '6px'
                  }}
                />
              </div>

              <ShadcnSelect
                value={outwardTypeFilter}
                onChange={(e: any) => setOutwardTypeFilter(e.target.value)}
                style={{
                  width: '150px',
                  height: '32px',
                  fontSize: '12px'
                }}
              >
                <option value="ALL TYPES">ALL TYPES</option>
                <option value="SALE BILL">SALE BILL</option>
                <option value="ESTIMATE">ESTIMATE</option>
                <option value="ORDER">ORDER</option>
                <option value="RETURN">RETURN</option>
              </ShadcnSelect>

              <ShadcnButton
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  macAudio.playClick();
                  setOutwardSearch('');
                  setOutwardTypeFilter('ALL TYPES');
                }}
                style={{
                  height: '32px',
                  fontSize: '12px',
                  borderColor: '#27272a',
                  color: '#a1a1aa'
                }}
              >
                Clear
              </ShadcnButton>
            </div>

            {/* Outward Table */}
            <div 
              id="outward-wrapper"
              ref={outwardTableWrapperRef}
              tabIndex={0}
              onKeyDown={outwardKeyNav.handleKeyDown}
              style={{
                flex: 1,
                minHeight: 0,
                overflow: 'auto',
                background: '#09090b',
                border: '1px solid #27272a',
                borderRadius: '8px',
                outline: 'none'
              }}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: '#18181b' }}>
                  <tr style={{ borderBottom: '1px solid #27272a' }}>
                    <th style={{ width: '90px', padding: '8px 10px', textAlign: 'left', color: '#a1a1aa', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>BILL NO</th>
                    <th style={{ width: '120px', padding: '8px 10px', textAlign: 'left', color: '#a1a1aa', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>DOC TYPE</th>
                    <th style={{ width: '95px', padding: '8px 10px', textAlign: 'left', color: '#a1a1aa', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>DATE</th>
                    <th style={{ minWidth: '160px', padding: '8px 10px', textAlign: 'left', color: '#a1a1aa', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>PARTY NAME</th>
                    <th style={{ minWidth: '240px', padding: '8px 10px', textAlign: 'left', color: '#a1a1aa', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>ITEM NAME (WITH SIZE)</th>
                    <th style={{ width: '75px', padding: '8px 10px', textAlign: 'right', color: '#a1a1aa', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>QTY</th>
                    <th style={{ width: '75px', padding: '8px 10px', textAlign: 'right', color: '#a1a1aa', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>U CAP</th>
                    <th style={{ width: '75px', padding: '8px 10px', textAlign: 'right', color: '#a1a1aa', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>L CAP</th>
                    <th style={{ width: '50px', padding: '8px 10px', textAlign: 'center', color: '#a1a1aa', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>VIEW</th>
                  </tr>
                </thead>
                <tbody>
                  {outwardPageSlice.map((item, idx) => {
                    const isSelected = outwardSelectedIndex === idx;
                    return (
                      <tr
                        key={item.id}
                        id={`outward-row-${idx}`}
                        onClick={() => {
                          setOutwardSelectedIndex(idx);
                          macAudio.playClick();
                        }}
                        onDoubleClick={() => { if (onOpenBillDetails) { onOpenBillDetails(item.billId); } }}
                        style={{
                          borderBottom: '1px solid #27272a',
                          background: isSelected ? '#27272a' : (idx % 2 === 0 ? 'rgba(24, 24, 27, 0.4)' : 'transparent'),
                          borderLeft: isSelected ? '3px solid #38bdf8' : '3px solid transparent',
                          cursor: 'pointer',
                          transition: 'background-color 0.15s ease'
                        }}
                        title="Double-click to open bill details"
                      >
                        <td style={{ padding: '8px 10px', color: '#f4f4f5', fontWeight: 500, fontSize: '12px' }}>#{item.token}</td>
                        <td style={{ padding: '8px 10px' }}>
                          <ShadcnBadge variant="secondary" style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', background: '#27272a', color: '#f4f4f5', border: '1px solid #3f3f46' }}>
                            {item.docType}
                          </ShadcnBadge>
                        </td>
                        <td style={{ padding: '8px 10px', color: '#a1a1aa', fontSize: '12px' }}>{item.date}</td>
                        <td style={{ padding: '8px 10px', color: '#e4e4e7', fontWeight: 500, fontSize: '12px' }}>{item.party}</td>
                        <td style={{ padding: '8px 10px', color: '#f4f4f5', fontWeight: 500, fontSize: '12px' }}>{item.name}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'right', color: '#f4f4f5', fontWeight: 500, fontSize: '12px' }}>{item.qty}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'right', color: '#f4f4f5', fontWeight: 500, fontSize: '12px' }}>{item.uCap}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'right', color: '#f4f4f5', fontWeight: 500, fontSize: '12px' }}>{item.lCap}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                          <ShadcnTooltip title="View Bill Details (Enter)" side="left">
                            <ShadcnButton type="button" variant="ghost" size="sm" onClick={() => { if (onOpenBillDetails) { onOpenBillDetails(item.billId); } }} style={{ height: '26px', width: '26px', padding: 0, color: '#a1a1aa' }}>
                              <ExternalLink size={13} />
                            </ShadcnButton>
                          </ShadcnTooltip>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {/* Outward Pagination */}
            <ShadcnPagination
              idPrefix={outwardKeyNav.paginationIdPrefix}
              totalCount={filteredOutwardItems.length}
              pageSize={outwardPageSize}
              currentPage={outwardPage}
              onPageChange={outwardKeyNav.handlePageChange}
              onPageSizeChange={(s) => { setOutwardPageSize(s); setOutwardPage(1); }}
              onFocusTableFirstRow={() => outwardKeyNav.focusTable('first')}
              onFocusTableLastRow={() => outwardKeyNav.focusTable('last')}
            />
          </div>
        )}


        {/* =========================================================== */}
        {/* TAB 4: STOCK BALANCE (GROUPED MULTI-COLUMN TABLE + CARDS) */}
        {/* =========================================================== */}
        {activeTab === 'balance' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '8px', gap: '8px', minHeight: 0, overflow: 'hidden' }}>
            
            {/* 4 shadcn/ui KPI Metric Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', flexShrink: 0 }}>
              <ShadcnCard>
                <ShadcnCardHeader style={{ padding: '14px 18px 10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '12px', fontWeight: 500, color: '#a1a1aa' }}>Total Unique Items</span>
                    <Package size={15} color="#a1a1aa" />
                  </div>
                  <ShadcnCardTitle style={{ fontSize: '22px', fontWeight: 700, marginTop: '4px' }}>
                    {totalStats.totalItems} Profiles
                  </ShadcnCardTitle>
                  <ShadcnCardDescription style={{ fontSize: '11px', marginTop: '2px' }}>
                    Active catalogued materials
                  </ShadcnCardDescription>
                </ShadcnCardHeader>
              </ShadcnCard>

              <ShadcnCard>
                <ShadcnCardHeader style={{ padding: '14px 18px 10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '12px', fontWeight: 500, color: '#a1a1aa' }}>Total Qty Balance</span>
                    <Scale size={15} color="#a1a1aa" />
                  </div>
                  <ShadcnCardTitle style={{ fontSize: '22px', fontWeight: 700, marginTop: '4px', color: totalStats.totalQty < 0 ? '#ef4444' : '#f4f4f5' }}>
                    <AnimatedCounter value={totalStats.totalQty} suffix={<span style={{ fontSize: '12px', fontWeight: 500, color: '#a1a1aa', marginLeft: '4px' }}>PCS</span>} />
                  </ShadcnCardTitle>
                  <ShadcnCardDescription style={{ fontSize: '11px', marginTop: '2px' }}>
                    {totalStats.totalQty >= 0 ? 'Optimal warehouse stock' : 'Negative stock alert'}
                  </ShadcnCardDescription>
                </ShadcnCardHeader>
              </ShadcnCard>

              <ShadcnCard>
                <ShadcnCardHeader style={{ padding: '14px 18px 10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '12px', fontWeight: 500, color: '#a1a1aa' }}>Total U-Cap Balance</span>
                    <ArrowDownLeft size={15} color="#a1a1aa" />
                  </div>
                  <ShadcnCardTitle style={{ fontSize: '22px', fontWeight: 700, marginTop: '4px', color: totalStats.totalUCap < 0 ? '#ef4444' : '#f4f4f5' }}>
                    <AnimatedCounter value={totalStats.totalUCap} suffix={<span style={{ fontSize: '12px', fontWeight: 500, color: '#a1a1aa', marginLeft: '4px' }}>PCS</span>} />
                  </ShadcnCardTitle>
                  <ShadcnCardDescription style={{ fontSize: '11px', marginTop: '2px' }}>
                    Upper cap inventory reserve
                  </ShadcnCardDescription>
                </ShadcnCardHeader>
              </ShadcnCard>

              <ShadcnCard>
                <ShadcnCardHeader style={{ padding: '14px 18px 10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '12px', fontWeight: 500, color: '#a1a1aa' }}>Total L-Cap Balance</span>
                    <ArrowUpRight size={15} color="#a1a1aa" />
                  </div>
                  <ShadcnCardTitle style={{ fontSize: '22px', fontWeight: 700, marginTop: '4px', color: totalStats.totalLCap < 0 ? '#ef4444' : '#f4f4f5' }}>
                    <AnimatedCounter value={totalStats.totalLCap} suffix={<span style={{ fontSize: '12px', fontWeight: 500, color: '#a1a1aa', marginLeft: '4px' }}>PCS</span>} />
                  </ShadcnCardTitle>
                  <ShadcnCardDescription style={{ fontSize: '11px', marginTop: '2px' }}>
                    Lower cap inventory reserve
                  </ShadcnCardDescription>
                </ShadcnCardHeader>
              </ShadcnCard>
            </div>

            {/* Filter & Export Toolbar */}
            <div 
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                background: '#18181b',
                borderRadius: '8px',
                border: '1px solid #27272a',
                gap: '10px',
                flexShrink: 0
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, position: 'relative' }}>
                <Search size={14} style={{ color: '#71717a', position: 'absolute', left: '10px' }} />
                <ShadcnInput
                  id="balance-search-input"
                  data-search-box="true"
                  type="text"
                  placeholder="Search stock balance..."
                  value={balanceSearch}
                  onChange={(e) => setBalanceSearch(e.target.value)}
                  style={{
                    height: '32px',
                    paddingLeft: '32px',
                    fontSize: '12px',
                    background: '#09090b',
                    border: '1px solid #27272a',
                    borderRadius: '6px',
                    maxWidth: '260px'
                  }}
                />

                {/* Stock Status Filter */}
                <ShadcnSelect
                  value={balanceFilter}
                  onChange={(e: any) => setBalanceFilter(e.target.value)}
                  style={{
                    width: '160px',
                    height: '32px',
                    fontSize: '12px'
                  }}
                >
                  <option value="All Items">All Items</option>
                  <option value="Positive Balance">Positive Balance (&gt;0)</option>
                  <option value="Negative Balance">Negative Balance (&lt;0)</option>
                  <option value="Zero Balance">Zero Balance (=0)</option>
                </ShadcnSelect>

                {/* Category Prefix Filter */}
                <ShadcnSelect
                  value={balanceCategory}
                  onChange={(e: any) => setBalanceCategory(e.target.value)}
                  style={{
                    width: '150px',
                    height: '32px',
                    fontSize: '12px'
                  }}
                  title="Filter by item category"
                >
                  {uniqueCategories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </ShadcnSelect>

                {/* Size Filter Dropdown */}
                <ShadcnSelect
                  value={balanceSize}
                  onChange={(e: any) => setBalanceSize(e.target.value)}
                  style={{
                    width: '130px',
                    height: '32px',
                    fontSize: '12px'
                  }}
                  title="Filter by item size"
                >
                  {uniqueSizes.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </ShadcnSelect>
              </div>

              {/* Action Buttons: Export CSV & Print */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {/* Universal Excel/CSV Export, Import & Template */}
                <ExcelCsvActions<StockBalanceRow>
                  title="Stock Balance"
                  filenamePrefix="Stock_Balance"
                  data={filteredBalanceList}
                  columns={stockBalanceCsvColumns}
                />

                <ShadcnButton
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={handlePrintStockReport}
                  style={{
                    height: '32px',
                    fontSize: '12px',
                    fontWeight: 600,
                    padding: '0 14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Printer size={13} />
                  <span>Print Report</span>
                </ShadcnButton>
              </div>
            </div>

            {/* Multi-Column Grouped Table (10 Columns Exact Schema) */}
            <div 
              id="balance-wrapper"
              ref={balanceTableWrapperRef}
              tabIndex={0}
              onKeyDown={balanceKeyNav.handleKeyDown}
              style={{
                flex: 1,
                minHeight: 0,
                overflow: 'auto',
                background: '#09090b',
                border: '1px solid #27272a',
                borderRadius: '8px',
                outline: 'none'
              }}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                  {/* Top Level Grouping Row */}
                  <tr style={{ background: '#18181b', borderBottom: '1px solid #27272a' }}>
                    <th rowSpan={2} style={{ minWidth: '280px', padding: '8px 12px', textAlign: 'left', color: '#a1a1aa', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', borderRight: '1px solid #27272a' }}>
                      ITEM NAME (WITH SIZE)
                    </th>
                    <th colSpan={3} style={{ padding: '6px 8px', textAlign: 'center', color: '#a1a1aa', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', borderRight: '1px solid #27272a', background: '#18181b' }}>
                      ITEM QTY
                    </th>
                    <th colSpan={3} style={{ padding: '6px 8px', textAlign: 'center', color: '#a1a1aa', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', borderRight: '1px solid #27272a', background: '#18181b' }}>
                      U CAP
                    </th>
                    <th colSpan={3} style={{ padding: '6px 8px', textAlign: 'center', color: '#a1a1aa', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', borderRight: '1px solid #27272a', background: '#18181b' }}>
                      L CAP
                    </th>
                    <th rowSpan={2} style={{ width: '90px', padding: '8px 8px', textAlign: 'center', color: '#a1a1aa', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>
                      STATUS
                    </th>
                  </tr>

                  {/* Sub-Header Row */}
                  <tr style={{ background: '#18181b', borderBottom: '1px solid #27272a' }}>
                    <th style={{ width: '65px', padding: '6px 8px', textAlign: 'right', color: '#71717a', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>In</th>
                    <th style={{ width: '65px', padding: '6px 8px', textAlign: 'right', color: '#71717a', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>Out</th>
                    <th style={{ width: '75px', padding: '6px 8px', textAlign: 'right', color: '#a1a1aa', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', borderRight: '1px solid #27272a' }}>Balance</th>

                    <th style={{ width: '65px', padding: '6px 8px', textAlign: 'right', color: '#71717a', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>In</th>
                    <th style={{ width: '65px', padding: '6px 8px', textAlign: 'right', color: '#71717a', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>Out</th>
                    <th style={{ width: '75px', padding: '6px 8px', textAlign: 'right', color: '#a1a1aa', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', borderRight: '1px solid #27272a' }}>Balance</th>

                    <th style={{ width: '65px', padding: '6px 8px', textAlign: 'right', color: '#71717a', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>In</th>
                    <th style={{ width: '65px', padding: '6px 8px', textAlign: 'right', color: '#71717a', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>Out</th>
                    <th style={{ width: '75px', padding: '6px 8px', textAlign: 'right', color: '#a1a1aa', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', borderRight: '1px solid #27272a' }}>Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {balancePageSlice.map((row, idx) => {
                    const isSelected = balanceSelectedIndex === idx;
                    return (
                      <tr 
                        key={row.itemName}
                        id={`balance-row-${idx}`}
                        onClick={() => {
                          setBalanceSelectedIndex(idx);
                          macAudio.playClick();
                        }}
                        style={{
                          borderBottom: '1px solid #27272a',
                          background: isSelected ? '#27272a' : (idx % 2 === 0 ? 'rgba(24, 24, 27, 0.4)' : 'transparent'),
                          borderLeft: isSelected ? '3px solid #38bdf8' : '3px solid transparent',
                          cursor: 'pointer',
                          transition: 'background-color 0.15s ease'
                        }}
                      >
                        {/* Item Name */}
                        <td style={{ padding: '8px 12px', color: '#f4f4f5', fontWeight: 500, borderRight: '1px solid #27272a', fontSize: '12px' }}>
                          {row.itemName}
                        </td>

                        {/* Qty In, Out, Balance */}
                        <td style={{ padding: '8px 8px', textAlign: 'right', color: '#a1a1aa', fontSize: '12px' }}>{row.inwardQty}</td>
                        <td style={{ padding: '8px 8px', textAlign: 'right', color: '#a1a1aa', fontSize: '12px' }}>{row.outwardQty}</td>
                        <td style={{ padding: '8px 8px', textAlign: 'right', fontWeight: 500, fontSize: '12px', color: row.balanceQty < 0 ? '#ef4444' : '#f4f4f5', borderRight: '1px solid #27272a' }}>
                          {row.balanceQty}
                        </td>

                        {/* U Cap In, Out, Balance */}
                        <td style={{ padding: '8px 8px', textAlign: 'right', color: '#a1a1aa', fontSize: '12px' }}>{row.inwardUCap}</td>
                        <td style={{ padding: '8px 8px', textAlign: 'right', color: '#a1a1aa', fontSize: '12px' }}>{row.outwardUCap}</td>
                        <td style={{ padding: '8px 8px', textAlign: 'right', fontWeight: 500, fontSize: '12px', color: row.balanceUCap < 0 ? '#ef4444' : '#f4f4f5', borderRight: '1px solid #27272a' }}>
                          {row.balanceUCap}
                        </td>

                        {/* L Cap In, Out, Balance */}
                        <td style={{ padding: '8px 8px', textAlign: 'right', color: '#a1a1aa', fontSize: '12px' }}>{row.inwardLCap}</td>
                        <td style={{ padding: '8px 8px', textAlign: 'right', color: '#a1a1aa', fontSize: '12px' }}>{row.outwardLCap}</td>
                        <td style={{ padding: '8px 8px', textAlign: 'right', fontWeight: 500, fontSize: '12px', color: row.balanceLCap < 0 ? '#ef4444' : '#f4f4f5', borderRight: '1px solid #27272a' }}>
                          {row.balanceLCap}
                        </td>

                        {/* Status Badge */}
                        <td style={{ textAlign: 'center', padding: '6px 8px' }}>
                          <ShadcnBadge
                            variant={row.status === 'NEGATIVE' ? 'destructive' : row.status === 'IN STOCK' ? 'secondary' : 'outline'}
                            style={{
                              fontSize: '11px', padding: '2px 7px', borderRadius: '4px',
                              ...(row.status === 'IN STOCK' ? { background: '#27272a', color: '#f4f4f5', border: '1px solid #3f3f46' }
                                : row.status === 'LOW STOCK' ? { background: '#27272a', color: '#fbbf24', border: '1px solid #3f3f46' }
                                : row.status === 'ZERO' ? { borderColor: '#27272a', color: '#71717a' }
                                : {})
                            }}
                          >
                            {row.status}
                          </ShadcnBadge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {/* Balance Pagination */}
            <ShadcnPagination
              idPrefix={balanceKeyNav.paginationIdPrefix}
              totalCount={filteredBalanceList.length}
              pageSize={balancePageSize}
              currentPage={balancePage}
              onPageChange={balanceKeyNav.handlePageChange}
              onPageSizeChange={(s) => { setBalancePageSize(s); setBalancePage(1); }}
              onFocusTableFirstRow={() => balanceKeyNav.focusTable('first')}
              onFocusTableLastRow={() => balanceKeyNav.focusTable('last')}
            />
          </div>
        )}


        {/* =========================================================== */}
        {/* TAB 5: PRINT BARCODE */}
        {/* =========================================================== */}
        {activeTab === 'barcode' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '8px', gap: '8px', minHeight: 0, overflow: 'hidden' }}>
            
            {/* Toolbar */}
            <div 
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                background: '#18181b',
                borderRadius: '8px',
                border: '1px solid #27272a',
                gap: '10px',
                flexShrink: 0
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, position: 'relative' }}>
                <Search size={14} style={{ color: '#71717a', position: 'absolute', left: '10px' }} />
                <ShadcnInput
                  id="barcode-search-input"
                  data-search-box="true"
                  type="text"
                  placeholder="Search items for barcode..."
                  value={barcodeSearch}
                  onChange={(e) => setBarcodeSearch(e.target.value)}
                  style={{
                    height: '32px',
                    paddingLeft: '32px',
                    fontSize: '12px',
                    background: '#09090b',
                    border: '1px solid #27272a',
                    borderRadius: '6px',
                    maxWidth: '220px'
                  }}
                />

                <ShadcnSelect
                  value={barcodeCategory}
                  onChange={(e: any) => setBarcodeCategory(e.target.value)}
                  style={{
                    width: '150px',
                    height: '32px',
                    fontSize: '12px'
                  }}
                >
                  {uniqueCategories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </ShadcnSelect>

                {/* Bulk Select Toggles */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: '12px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#a1a1aa', cursor: 'pointer', userSelect: 'none' }}>
                    <input
                      type="checkbox"
                      onChange={(e) => handleToggleAllBarcode('qtyChecked', e.target.checked)}
                      style={{ cursor: 'pointer', accentColor: '#10b981' }}
                    />
                    <span>All Qty</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#a1a1aa', cursor: 'pointer', userSelect: 'none' }}>
                    <input
                      type="checkbox"
                      onChange={(e) => handleToggleAllBarcode('uCapChecked', e.target.checked)}
                      style={{ cursor: 'pointer', accentColor: '#818cf8' }}
                    />
                    <span>All U-Cap</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#a1a1aa', cursor: 'pointer', userSelect: 'none' }}>
                    <input
                      type="checkbox"
                      onChange={(e) => handleToggleAllBarcode('lCapChecked', e.target.checked)}
                      style={{ cursor: 'pointer', accentColor: '#fb923c' }}
                    />
                    <span>All L-Cap</span>
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShadcnButton
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={() => {
                    macAudio.playPop();
                    setIsBarcodePreviewOpen(true);
                  }}
                  style={{
                    height: '32px',
                    fontSize: '12px',
                    fontWeight: 600,
                    padding: '0 14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Eye size={13} />
                  <span>PRINT PREVIEW ({barcodePrintJobs.length})</span>
                </ShadcnButton>
              </div>
            </div>

            {/* Barcode Item Configuration Table */}
            <div 
              id="barcode-wrapper"
              ref={barcodeTableWrapperRef}
              tabIndex={0}
              onKeyDown={barcodeKeyNav.handleKeyDown}
              style={{
                flex: 1,
                minHeight: 0,
                overflow: 'auto',
                background: '#09090b',
                border: '1px solid #27272a',
                borderRadius: '8px',
                outline: 'none'
              }}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: '#18181b' }}>
                  <tr style={{ borderBottom: '1px solid #27272a' }}>
                    <th style={{ minWidth: '240px', padding: '8px 12px', textAlign: 'left', color: '#a1a1aa', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>ITEM NAME</th>
                    <th style={{ width: '80px', padding: '8px 8px', textAlign: 'center', color: '#a1a1aa', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>QTY</th>
                    <th style={{ width: '50px', padding: '8px 8px', textAlign: 'center', color: '#a1a1aa', fontSize: '11px', fontWeight: 600 }}>☑</th>
                    <th style={{ width: '120px', padding: '8px 10px', textAlign: 'left', color: '#a1a1aa', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', borderLeft: '1px solid #27272a' }}>U CAP</th>
                    <th style={{ width: '80px', padding: '8px 8px', textAlign: 'center', color: '#a1a1aa', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>U QTY</th>
                    <th style={{ width: '50px', padding: '8px 8px', textAlign: 'center', color: '#a1a1aa', fontSize: '11px', fontWeight: 600 }}>☑ U</th>
                    <th style={{ width: '120px', padding: '8px 10px', textAlign: 'left', color: '#a1a1aa', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', borderLeft: '1px solid #27272a' }}>L CAP</th>
                    <th style={{ width: '80px', padding: '8px 8px', textAlign: 'center', color: '#a1a1aa', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>L QTY</th>
                    <th style={{ width: '50px', padding: '8px 8px', textAlign: 'center', color: '#a1a1aa', fontSize: '11px', fontWeight: 600 }}>☑ L</th>
                  </tr>
                </thead>
                <tbody>
                  {barcodePageSlice.map((item, idx) => {
                    const isSelected = barcodeSelectedIndex === idx;
                    const st = barcodeStates[item.itemName] || {
                      itemName: item.itemName,
                      category: item.category,
                      qty: 1,
                      qtyChecked: false,
                      uCapName: 'U Cap',
                      uCapQty: 1,
                      uCapChecked: false,
                      lCapName: 'L Cap',
                      lCapQty: 1,
                      lCapChecked: false
                    };

                    return (
                      <tr 
                        key={item.itemName}
                        id={`barcode-row-${idx}`}
                        onClick={() => {
                          setBarcodeSelectedIndex(idx);
                          macAudio.playClick();
                        }}
                        style={{
                          borderBottom: '1px solid #27272a',
                          background: isSelected ? '#27272a' : (idx % 2 === 0 ? 'rgba(24, 24, 27, 0.4)' : 'transparent'),
                          borderLeft: isSelected ? '3px solid #38bdf8' : '3px solid transparent',
                          cursor: 'pointer',
                          transition: 'background-color 0.15s ease'
                        }}
                      >
                        <td style={{ padding: '8px 12px', color: '#f4f4f5', fontWeight: 500, fontSize: '12px' }}>{item.itemName}</td>

                        {/* Main Item Qty & Checkbox */}
                        <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                          <input
                            type="number"
                            min="1"
                            value={st.qty}
                            onChange={(e) => {
                              const val = Math.max(1, parseInt(e.target.value, 10) || 1);
                              setBarcodeStates((prev) => ({ ...prev, [item.itemName]: { ...st, qty: val } }));
                            }}
                            style={{ width: '64px', height: '26px', textAlign: 'center', background: '#18181b', border: '1px solid #27272a', color: '#f4f4f5', borderRadius: '4px', fontSize: '12px', fontWeight: 500, outline: 'none' }}
                          />
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            checked={st.qtyChecked}
                            onChange={(e) => {
                              macAudio.playHover();
                              setBarcodeStates((prev) => ({ ...prev, [item.itemName]: { ...st, qtyChecked: e.target.checked } }));
                            }}
                            style={{ cursor: 'pointer', accentColor: '#10b981' }}
                          />
                        </td>

                        {/* U Cap Name, Qty & Checkbox */}
                        <td style={{ padding: '8px 10px', color: '#a1a1aa', fontSize: '12px', borderLeft: '1px solid #27272a' }}>U Cap</td>
                        <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                          <input
                            type="number"
                            min="1"
                            value={st.uCapQty}
                            onChange={(e) => {
                              const val = Math.max(1, parseInt(e.target.value, 10) || 1);
                              setBarcodeStates((prev) => ({ ...prev, [item.itemName]: { ...st, uCapQty: val } }));
                            }}
                            style={{ width: '64px', height: '26px', textAlign: 'center', background: '#18181b', border: '1px solid #27272a', color: '#f4f4f5', borderRadius: '4px', fontSize: '12px', fontWeight: 500, outline: 'none' }}
                          />
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            checked={st.uCapChecked}
                            onChange={(e) => {
                              macAudio.playHover();
                              setBarcodeStates((prev) => ({ ...prev, [item.itemName]: { ...st, uCapChecked: e.target.checked } }));
                            }}
                            style={{ cursor: 'pointer', accentColor: '#818cf8' }}
                          />
                        </td>

                        {/* L Cap Name, Qty & Checkbox */}
                        <td style={{ padding: '8px 10px', color: '#a1a1aa', fontSize: '12px', borderLeft: '1px solid #27272a' }}>L Cap</td>
                        <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                          <input
                            type="number"
                            min="1"
                            value={st.lCapQty}
                            onChange={(e) => {
                              const val = Math.max(1, parseInt(e.target.value, 10) || 1);
                              setBarcodeStates((prev) => ({ ...prev, [item.itemName]: { ...st, lCapQty: val } }));
                            }}
                            style={{ width: '64px', height: '26px', textAlign: 'center', background: '#18181b', border: '1px solid #27272a', color: '#f4f4f5', borderRadius: '4px', fontSize: '12px', fontWeight: 500, outline: 'none' }}
                          />
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            checked={st.lCapChecked}
                            onChange={(e) => {
                              macAudio.playHover();
                              setBarcodeStates((prev) => ({ ...prev, [item.itemName]: { ...st, lCapChecked: e.target.checked } }));
                            }}
                            style={{ cursor: 'pointer', accentColor: '#fb923c' }}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {/* Barcode Pagination */}
            <ShadcnPagination
              idPrefix={barcodeKeyNav.paginationIdPrefix}
              totalCount={filteredBarcodeItems.length}
              pageSize={barcodePageSize}
              currentPage={barcodePage}
              onPageChange={barcodeKeyNav.handlePageChange}
              onPageSizeChange={(s) => { setBarcodePageSize(s); setBarcodePage(1); }}
              onFocusTableFirstRow={() => barcodeKeyNav.focusTable('first')}
              onFocusTableLastRow={() => barcodeKeyNav.focusTable('last')}
            />
          </div>
        )}
      </div>


      {/* =========================================================== */}
      {/* MODAL: ADD CUSTOM MULTI-COLUMN SIZE */}
      {/* =========================================================== */}
      {isAddColModalOpen && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div 
            style={{
              width: '360px',
              background: '#18181b',
              border: '1px solid #27272a',
              borderRadius: '10px',
              padding: '18px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Columns size={16} style={{ color: '#38bdf8' }} />
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#f4f4f5' }}>Add Size Column</span>
              </div>
              <ShadcnButton
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsAddColModalOpen(false)}
                style={{ height: '24px', width: '24px', padding: 0, color: '#a1a1aa' }}
              >
                <X size={15} />
              </ShadcnButton>
            </div>

            <p style={{ margin: 0, fontSize: '12px', color: '#a1a1aa', lineHeight: 1.4 }}>
              Enter the length/feet size to add as a new column in Stock Entry:
            </p>

            <div style={{ display: 'flex', gap: '8px' }}>
              <ShadcnInput
                type="number"
                step="0.5"
                placeholder="e.g. 12, 9.5, 11, 14..."
                autoFocus
                value={newColSizeInput}
                onChange={(e) => setNewColSizeInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newColSizeInput) {
                    handleAddDynamicCol(newColSizeInput);
                  }
                }}
                style={{
                  flex: 1,
                  height: '34px',
                  background: '#09090b',
                  border: '1px solid #27272a',
                  color: '#f4f4f5',
                  fontSize: '13px',
                  fontWeight: 600,
                  fontFamily: 'monospace'
                }}
              />
              <ShadcnButton
                type="button"
                variant="default"
                size="sm"
                onClick={() => {
                  if (newColSizeInput) handleAddDynamicCol(newColSizeInput);
                }}
                style={{
                  height: '34px',
                  padding: '0 16px',
                  fontSize: '12px',
                  fontWeight: 600
                }}
              >
                Add
              </ShadcnButton>
            </div>

            {/* Quick Suggestions */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', paddingTop: '2px' }}>
              {[12, 9.5, 11, 13, 14, 8, 7].map((s) => (
                <ShadcnButton
                  key={s}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddDynamicCol(s)}
                  style={{
                    height: '24px',
                    padding: '0 8px',
                    fontSize: '11px',
                    borderColor: '#27272a',
                    fontFamily: 'monospace'
                  }}
                >
                  +{s} FT
                </ShadcnButton>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================== */}
      {/* BARCODE PRINT PREVIEW MODAL */}
      {/* =========================================================== */}
      {isBarcodePreviewOpen && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div 
            style={{
              width: '820px',
              maxWidth: '95vw',
              maxHeight: '90vh',
              background: '#18181b',
              border: '1px solid #27272a',
              borderRadius: '12px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
          >
            {/* Modal Header */}
            <div 
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 18px',
                borderBottom: '1px solid #27272a',
                background: '#18181b'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Barcode size={18} style={{ color: '#a855f7' }} />
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#f4f4f5' }}>
                  BARCODE PRINT PREVIEW ({barcodePrintJobs.length} Labels)
                </span>
              </div>
              <ShadcnButton
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsBarcodePreviewOpen(false)}
                style={{ height: '28px', width: '28px', padding: 0, color: '#a1a1aa' }}
              >
                <X size={16} />
              </ShadcnButton>
            </div>

            {/* Modal Content: Grid of Barcode Cards */}
            <div 
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '16px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                gap: '12px',
                background: '#09090b'
              }}
            >
              {barcodePrintJobs.length === 0 ? (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: '#71717a', fontSize: '13px' }}>
                  Please check at least one item or component in the list to generate barcodes!
                </div>
              ) : (
                barcodePrintJobs.map((job, idx) => {
                  const bConf = loadBarcodeConfig();
                  return (
                    <div
                      key={`${job.name}-${idx}`}
                      style={{
                        background: '#ffffff',
                        color: '#000000',
                        borderRadius: '6px',
                        padding: '10px 12px',
                        border: bConf.showBorder ? '1px dashed #94a3b8' : '1px solid #cbd5e1',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        textAlign: bConf.textAlign
                      }}
                    >
                      {bConf.printHeader && (
                        <div style={{ fontSize: `${bConf.headerFontSize}px`, fontWeight: 900, color: '#0f172a', borderBottom: '1px solid #e2e8f0', paddingBottom: '2px', marginBottom: '4px', textAlign: bConf.textAlign }}>
                          {bConf.headerText || 'COMPANY NAME'}
                        </div>
                      )}

                      {bConf.printItemName && (
                        <div
                          style={{
                            fontSize: `${bConf.itemNameFontSize}px`,
                            fontWeight: 800,
                            textAlign: bConf.textAlign,
                            color: '#0f172a',
                            lineHeight: 1.2,
                            marginBottom: '4px',
                            maxWidth: '100%',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                          title={job.name}
                        >
                          {job.name}
                        </div>
                      )}

                      {/* Barcode/QR Generation */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: bConf.textAlign === 'center' ? 'center' : bConf.textAlign === 'right' ? 'flex-end' : 'flex-start', margin: '4px 0' }}>
                        {bConf.textPosition === 'above' && (
                          <span style={{ fontSize: '9px', fontFamily: 'monospace', fontWeight: 700, letterSpacing: '1px', marginBottom: '2px' }}>
                            *{job.code}*
                          </span>
                        )}

                        {bConf.symbology === 'QR' ? (
                          <div style={{ width: '48px', height: '48px', display: 'grid', gridTemplateColumns: 'repeat(21, 1fr)', gap: '0px', background: '#fff', padding: '1px' }}>
                            {generateQrMatrix(job.code).map((row, rI) =>
                              row.map((cell, cI) => (
                                <div key={`${rI}-${cI}`} style={{ background: cell ? '#000' : '#fff' }} />
                              ))
                            )}
                          </div>
                        ) : (
                          (() => {
                            const { svgBars, totalWidth } = generateCode128SvgBars(job.code, bConf.barHeightMm, bConf.barScale);
                            return (
                              <svg width="100%" height={bConf.barHeightMm * 2.2} viewBox={`0 0 ${totalWidth} ${bConf.barHeightMm * 2.2}`} preserveAspectRatio="xMidYMid meet" style={{ display: 'block', maxWidth: '100%' }}>
                                {svgBars.map((b, i) => (
                                  <rect key={i} x={b.x} y={0} width={b.width} height={bConf.barHeightMm * 2.2} fill="#000000" />
                                ))}
                              </svg>
                            );
                          })()
                        )}

                        {bConf.textPosition === 'below' && (
                          <span style={{ fontFamily: 'monospace', fontSize: '9.5px', fontWeight: 700, letterSpacing: '1.5px', marginTop: '2px' }}>
                            *{job.code}*
                          </span>
                        )}
                      </div>

                      {/* Footer Row */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', width: '100%', marginTop: '4px', fontSize: '8.5px', color: '#475569', fontWeight: 700, borderTop: '1px solid #f1f5f9', paddingTop: '2px' }}>
                        {bConf.printTag ? <span>TAG: {job.component}</span> : <span />}
                        <span>QTY: {job.qty}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer with Thermal Script Batch Exports & Direct Raw Spooling */}
            <div 
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 18px',
                borderTop: '1px solid #27272a',
                background: '#18181b'
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '12px', color: '#f4f4f5' }}>
                  Configured: <strong style={{ fontFamily: 'monospace' }}>{loadBarcodeConfig().widthMm}mm × {loadBarcodeConfig().heightMm}mm</strong> • {loadBarcodeConfig().dpi} DPI
                </span>
                <span style={{ fontSize: '11px', color: '#71717a' }}>
                  {barcodePrintJobs.length} Labels queued for output
                </span>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <ShadcnButton
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsBarcodePreviewOpen(false)}
                  style={{
                    height: '32px',
                    borderColor: '#27272a',
                    fontSize: '12px',
                    color: '#a1a1aa'
                  }}
                >
                  Close
                </ShadcnButton>
                <ShadcnButton
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const bConf = loadBarcodeConfig();
                    const allTspl = barcodePrintJobs.map(job => 
                      generateTsplCommand(bConf, { name: job.name, code: job.code, tag: job.component }, job.qty)
                    ).join('\r\n');
                    downloadThermalScriptFile(allTspl, `batch_tspl_${barcodePrintJobs.length}_labels.prn`);
                    macAudio.playSuccess();
                    showToast?.(`Downloaded TSPL script for ${barcodePrintJobs.length} labels!`, 'success');
                  }}
                  style={{
                    height: '32px',
                    borderColor: '#27272a',
                    fontSize: '12px',
                    color: '#38bdf8'
                  }}
                >
                  Export TSPL (.PRN)
                </ShadcnButton>
                <ShadcnButton
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const bConf = loadBarcodeConfig();
                    const allZpl = barcodePrintJobs.map(job => 
                      generateZplCommand(bConf, { name: job.name, code: job.code, tag: job.component }, job.qty)
                    ).join('\r\n');
                    downloadThermalScriptFile(allZpl, `batch_zpl_${barcodePrintJobs.length}_labels.prn`);
                    macAudio.playSuccess();
                    showToast?.(`Downloaded ZPL script for ${barcodePrintJobs.length} labels!`, 'success');
                  }}
                  style={{
                    height: '32px',
                    borderColor: '#27272a',
                    fontSize: '12px',
                    color: '#c084fc'
                  }}
                >
                  Export ZPL (.PRN)
                </ShadcnButton>
                <ShadcnButton
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={() => {
                    macAudio.playSuccess();
                    window.print();
                  }}
                  style={{
                    height: '32px',
                    fontSize: '12px',
                    fontWeight: 600,
                    padding: '0 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Printer size={13} />
                  <span>Print Labels</span>
                </ShadcnButton>
              </div>
            </div>

          </div>
        </div>
      )}

      {voucherToDelete !== null && (
        <UnsavedChangesModal
          titleText={`Delete Stock Voucher #${voucherToDelete}?`}
          descText={`Kya aap sach me Stock Voucher #${voucherToDelete} ko delete karna chahte hain?`}
          discardLabel="Haan, Delete Karo"
          onDiscard={confirmDeleteVoucher}
          onCancel={() => setVoucherToDelete(null)}
        />
      )}
    </div>
  );
};

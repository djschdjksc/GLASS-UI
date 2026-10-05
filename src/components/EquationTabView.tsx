import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { macAudio } from '../utils/macAudio';
import { useDatabase } from '../context/DatabaseContext';
import { useSettings } from '../context/SettingsContext';
import { SQLITE_CONTROL_CONVERSIONS } from '../data/sqliteControlPanel';
import type { SqliteControlRow } from '../data/sqliteControlPanel';
import { downloadCSV } from '../utils/exportCsv';
import { ExcelCsvActions, type CsvColumnDef } from './common/ExcelCsvActions';
import {
  Button,
  Input,
  Badge,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Pagination as ShadcnPagination,
  Tooltip
} from './ui/shadcn';
import {
  Calculator,
  Search,
  Plus,
  Trash2,
  Printer,
  Copy,
  Check,
  FileSpreadsheet,
  ArrowRight,
  Download,
  RefreshCw,
  X,
  Building,
  Layers,
  Scale,
  DollarSign,
  Percent,
  SlidersHorizontal,
  ChevronDown,
  FileText,
  Users,
  UserPlus
} from 'lucide-react';

export interface Contributor {
  id: string;
  name: string;
  paidAmount: number | '';
}

export interface BaseEquationItem {
  id: string;
  name: string;
  qty: number;
  mult: number;
  boxSize: number;
  weightPc: number;
  price: number;
}

export interface EquationResultRow {
  id: string;
  partyName: string;
  sharePct: number;
  itemName: string;
  pcsQty: number;
  boxes: number;
  mult: number;
  billQtyShare: number;
  weightKg: number;
  price: number;
  totalGst: number;
  partyPaidAmt: number;
}

const PRINT_API_URL = 'http://localhost:5005';

export const EquationTabView: React.FC = () => {
  const { bills, parties } = useDatabase();
  const { defaultPrinter } = useSettings();

  // Load conversions lookup
  const conversions = useMemo<SqliteControlRow[]>(() => {
    try {
      const saved = localStorage.getItem('billapp_conversions');
      if (saved) return JSON.parse(saved);
    } catch {}
    return SQLITE_CONTROL_CONVERSIONS;
  }, []);

  // Conversion maps
  const { multMap, boxMap, weightMap } = useMemo(() => {
    const mult: Record<string, number> = {};
    const box: Record<string, number> = {};
    const wt: Record<string, number> = {};

    conversions.forEach((c) => {
      const k = (c.conversion || '').toLowerCase().trim();
      if (k) {
        mult[k] = Number(c.multiplication) || 1.0;
        box[k] = Number(c.box_size) || 1.0;
        wt[k] = Number(c.weight_per_pcs) || 0.0;
      }
      const s = (c.shortcut || '').toLowerCase().trim();
      if (s && !s.startsWith('__auto_')) {
        mult[s] = Number(c.multiplication) || 1.0;
        box[s] = Number(c.box_size) || 1.0;
        wt[s] = Number(c.weight_per_pcs) || 0.0;
      }
    });

    return { multMap: mult, boxMap: box, weightMap: wt };
  }, [conversions]);

  // Selected Bill state
  const [billSearchInput, setBillSearchInput] = useState<string>('');
  const [selectedBillId, setSelectedBillId] = useState<string>('');
  const [loadedBillParty, setLoadedBillParty] = useState<string>('');
  const [loadedBillTotal, setLoadedBillTotal] = useState<number>(0);
  const [loadedBillDate, setLoadedBillDate] = useState<string>('');
  const [loadedBillToken, setLoadedBillToken] = useState<string>('');

  // Base Items from Bill
  const [baseItems, setBaseItems] = useState<BaseEquationItem[]>([]);

  // Contributors State
  const [contributors, setContributors] = useState<Contributor[]>([
    { id: 'c1', name: 'Primary Party', paidAmount: '' }
  ]);

  // Active party suggestions (Portal Floating Popover outside scrolling table)
  const [partyDropdownOpenFor, setPartyDropdownOpenFor] = useState<string | null>(null);
  const [partyFilterText, setPartyFilterText] = useState<string>('');
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const [focusedSuggestionIndex, setFocusedSuggestionIndex] = useState<number>(-1);

  // Bill search suggestions (Left Panel)
  const [billDropdownOpen, setBillDropdownOpen] = useState<boolean>(false);
  const [billDropdownPos, setBillDropdownPos] = useState<{ top: number; left: number; width: number } | null>(null);

  // Result Prices override map
  const [resultPrices, setResultPrices] = useState<Record<string, number>>({});
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [tableSearchQuery, setTableSearchQuery] = useState<string>('');

  // Pagination for Results Table
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(50);

  // Status & Feedback
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [copiedExcel, setCopiedExcel] = useState<boolean>(false);

  // Print Dialog State
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);
  const [isDirectPrinting, setIsDirectPrinting] = useState<boolean>(false);

  // Add Party Modal State
  const [isAddPartyModalOpen, setIsAddPartyModalOpen] = useState<boolean>(false);
  const [modalPartyName, setModalPartyName] = useState<string>('');
  const [modalPartyAmount, setModalPartyAmount] = useState<number | ''>('');
  const [modalPartyPercent, setModalPartyPercent] = useState<number | ''>('');
  const [modalPartySuggestionsOpen, setModalPartySuggestionsOpen] = useState<boolean>(false);

  const billInputRef = useRef<HTMLInputElement>(null);
  const tableWrapperRef = useRef<HTMLDivElement>(null);

  // Helper for Indian Currency formatting
  const formatINR = useCallback((val: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
      minimumFractionDigits: 2
    }).format(val || 0);
  }, []);

  // Show Toast
  const showNotification = useCallback((text: string, type: 'success' | 'info' | 'error' = 'info') => {
    setStatusMsg({ text, type });
    if (type === 'success') macAudio.playSuccess();
    else if (type === 'error') macAudio.playPop();
    else macAudio.playHover();
    setTimeout(() => setStatusMsg(null), 4000);
  }, []);

  // Load Bill Function
  const loadBillData = useCallback(
    (targetIdOrToken?: string) => {
      const query = (targetIdOrToken || billSearchInput || selectedBillId).trim().toLowerCase();
      if (!query && bills.length === 0) {
        showNotification('No bills available in database to load', 'error');
        return;
      }

      // Match by exact id, token, or partial search
      const matched = bills.find((b) => {
        if (!query) return true;
        const bId = String(b.id || '').toLowerCase();
        const bToken = String(b.token || '').toLowerCase();
        const bParty = String(b.party || '').toLowerCase();
        return bId === query || bToken === query || bParty.includes(query);
      }) || bills[0];

      if (!matched) {
        showNotification(`Bill "${query}" not found in database`, 'error');
        return;
      }

      setSelectedBillId(matched.id);
      setLoadedBillParty(matched.party || 'Standard Account');
      const bTotal = Number(matched.total) || 0;
      setLoadedBillTotal(bTotal);
      setLoadedBillDate(matched.date || new Date().toISOString().split('T')[0]);
      setLoadedBillToken(String(matched.token || matched.id));

      // Extract items: finishedItems preferred, fallback to rawItems
      let itemsList: BaseEquationItem[] = [];

      if (matched.finishedItems && matched.finishedItems.length > 0) {
        itemsList = matched.finishedItems.map((fi, idx) => {
          const name = fi.mould || (fi as any).name || `Mould Item ${idx + 1}`;
          const nameLower = name.toLowerCase().trim();
          const mult = multMap[nameLower] ?? 1.0;
          const boxSize = boxMap[nameLower] ?? 1.0;
          const weightPc = weightMap[nameLower] ?? 0.0;
          const price = Number(fi.price) || 0;

          return {
            id: fi.id || `bi_${idx}`,
            name,
            qty: Number(fi.qty) || 1,
            mult,
            boxSize,
            weightPc,
            price
          };
        });
      } else if (matched.rawItems && matched.rawItems.length > 0) {
        itemsList = matched.rawItems.map((ri, idx) => {
          const name = ri.name || `Raw Item ${idx + 1}`;
          const nameLower = name.toLowerCase().trim();
          const mult = multMap[nameLower] ?? 1.0;
          const boxSize = boxMap[nameLower] ?? 1.0;
          const weightPc = weightMap[nameLower] ?? 0.0;

          return {
            id: ri.id || `bi_${idx}`,
            name,
            qty: Number(ri.qty) || 1,
            mult,
            boxSize,
            weightPc,
            price: 0
          };
        });
      }

      if (itemsList.length === 0) {
        // Fallback demo items if bill has no rows
        itemsList = [
          { id: 'bi_1', name: 'B.F.P-(G) 154 Standard Housing', qty: 120, mult: 0.915, boxSize: 10, weightPc: 1.45, price: 650 },
          { id: 'bi_2', name: 'B.F.P-(B) 200 Heavy Base Alloy', qty: 85, mult: 0.915, boxSize: 10, weightPc: 2.10, price: 920 },
          { id: 'bi_3', name: 'B.F.P-(A)-(Digital) Premium Panel', qty: 50, mult: 1.0, boxSize: 5, weightPc: 0.85, price: 480 }
        ];
      }

      setBaseItems(itemsList);

      // Default single 100% contributor = The bill's party with auto amount
      setContributors([
        {
          id: 'c_' + Date.now(),
          name: matched.party || 'Primary Party',
          paidAmount: '' as any
        }
      ]);
    },
    [bills, billSearchInput, selectedBillId, multMap, boxMap, weightMap]
  );

  // Real-time Contributor Shares & Auto-Equal Split Computation
  const contribShares = useMemo(() => {
    const validContribs = contributors.filter((c) => (c.name || '').trim().length > 0);
    if (validContribs.length === 0) return [];

    const totalBill = loadedBillTotal > 0 ? loadedBillTotal : 100000;
    const explicitContribs = validContribs.filter((c) => Number(c.paidAmount) > 0);
    const explicitSum = explicitContribs.reduce((sum, c) => sum + Number(c.paidAmount), 0);
    const autoContribs = validContribs.filter((c) => !Number(c.paidAmount) || Number(c.paidAmount) <= 0);

    if (autoContribs.length === 0) {
      const totalPaid = explicitSum > 0 ? explicitSum : 1;
      return validContribs.map((c) => {
        const amt = Number(c.paidAmount) || 0;
        return {
          id: c.id,
          name: c.name,
          effectivePaid: amt,
          sharePct: amt / totalPaid,
          isAuto: false
        };
      });
    }

    if (explicitContribs.length === 0) {
      const equalAmt = Math.round((totalBill / validContribs.length) * 100) / 100;
      const equalPct = 1 / validContribs.length;
      return validContribs.map((c) => ({
        id: c.id,
        name: c.name,
        effectivePaid: equalAmt,
        sharePct: equalPct,
        isAuto: true
      }));
    }

    // Mixed: some explicit, some auto-split remaining
    const remaining = Math.max(0, totalBill - explicitSum);
    const autoPortion = autoContribs.length > 0 ? Math.round((remaining / autoContribs.length) * 100) / 100 : 0;
    const overallTotal = explicitSum + autoPortion * autoContribs.length || totalBill || 1;

    return validContribs.map((c) => {
      const isExplicit = Number(c.paidAmount) > 0;
      const effectivePaid = isExplicit ? Number(c.paidAmount) : autoPortion;
      const sharePct = effectivePaid / overallTotal;
      return {
        id: c.id,
        name: c.name,
        effectivePaid,
        sharePct,
        isAuto: !isExplicit
      };
    });
  }, [contributors, loadedBillTotal]);

  // Total Paid Amount by all contributors
  const totalPaidSum = useMemo(() => {
    return contribShares.reduce((sum, c) => sum + (c.effectivePaid || 0), 0);
  }, [contribShares]);

  // Automatically computed Goods Distribution & 18% GST Results Matrix
  const results = useMemo<EquationResultRow[]>(() => {
    if (baseItems.length === 0 || contribShares.length === 0) {
      return [];
    }

    const newRows: EquationResultRow[] = [];

    contribShares.forEach((c) => {
      baseItems.forEach((itm) => {
        const rowKey = `${c.id}_${itm.id}`;
        const currentPrice = resultPrices[rowKey] !== undefined ? resultPrices[rowKey] : itm.price || 0;

        // Physical PCS share
        const shareQty = Math.round((c.sharePct * itm.qty + Number.EPSILON) * 100) / 100;
        // Boxes
        const boxes = itm.boxSize > 0 ? Math.round((shareQty / itm.boxSize + Number.EPSILON) * 10) / 10 : 0;
        // Full Bill Qty = Physical Qty * Multiplier
        const fullBillQty = itm.qty * itm.mult;
        const shareBillQty = Math.round(c.sharePct * fullBillQty);
        // Total Weight = (Physical Qty * Weight/Pc) * Share %
        const weightKg = Math.round(((itm.qty * itm.weightPc) * c.sharePct + Number.EPSILON) * 100) / 100;
        // Total (+18% GST) = Bill Qty Share * Price * 1.18
        const totalGst = Math.round((shareBillQty * currentPrice * 1.18 + Number.EPSILON) * 100) / 100;

        newRows.push({
          id: rowKey,
          partyName: c.name,
          sharePct: c.sharePct,
          itemName: itm.name,
          pcsQty: shareQty,
          boxes,
          mult: itm.mult,
          billQtyShare: shareBillQty,
          weightKg,
          price: currentPrice,
          totalGst,
          partyPaidAmt: c.effectivePaid
        });
      });
    });

    return newRows;
  }, [baseItems, contribShares, resultPrices]);

  // Auto-select first row if needed
  useEffect(() => {
    if (results.length > 0 && (!selectedRowId || !results.some((r) => r.id === selectedRowId))) {
      setSelectedRowId(results[0].id);
    }
  }, [results, selectedRowId]);

  // Backward compatibility alias for calculateDistribution
  const calculateDistribution = useCallback(() => {
    macAudio.playSuccess();
    showNotification('Live auto-calculation updated', 'success');
  }, [showNotification]);

  // Update item price on specific row
  const handleUpdatePrice = useCallback(
    (rowId: string, newPrice: number) => {
      setResultPrices((prev) => ({ ...prev, [rowId]: newPrice }));
    },
    []
  );

  // Per-Party Bill Totals (+18% GST sum)
  const partyBillTotals = useMemo<Record<string, number>>(() => {
    const totals: Record<string, number> = {};
    results.forEach((r) => {
      totals[r.partyName] = (totals[r.partyName] || 0) + (r.totalGst || 0);
    });
    return totals;
  }, [results]);

  // Sum of explicitly assigned paid amounts
  const explicitPaidSum = useMemo(() => {
    return contributors
      .filter((c) => Number(c.paidAmount) > 0)
      .reduce((sum, c) => sum + Number(c.paidAmount), 0);
  }, [contributors]);

  // Unallocated remaining bill balance
  const unallocatedAmount = useMemo(() => {
    if (loadedBillTotal <= 0) return 0;
    return Math.max(0, loadedBillTotal - explicitPaidSum);
  }, [loadedBillTotal, explicitPaidSum]);

  // Contributor CRUD handlers
  const handleOpenAddPartyModal = () => {
    macAudio.playClick();
    setModalPartyName('');
    const remaining = unallocatedAmount > 0 ? unallocatedAmount : (loadedBillTotal > 0 ? loadedBillTotal : '');
    setModalPartyAmount(remaining);
    if (loadedBillTotal > 0 && typeof remaining === 'number' && remaining > 0) {
      setModalPartyPercent(Math.round(((remaining / loadedBillTotal) * 100) * 10) / 10);
    } else {
      setModalPartyPercent('');
    }
    setModalPartySuggestionsOpen(false);
    setIsAddPartyModalOpen(true);
  };

  const handleConfirmAddPartyModal = () => {
    const trimmed = modalPartyName.trim();
    if (!trimmed) {
      showNotification('Please enter or select a party name', 'error');
      return;
    }
    macAudio.playSuccess();
    const newId = 'c_' + Date.now();
    const next: Contributor[] = [
      ...contributors,
      {
        id: newId,
        name: trimmed,
        paidAmount: modalPartyAmount !== '' ? Number(modalPartyAmount) : ('' as any)
      }
    ];
    setContributors(next);
    setIsAddPartyModalOpen(false);
    showNotification(`Added "${trimmed}" with ${formatINR(Number(modalPartyAmount) || 0)} share`, 'success');
  };

  const handleAddContributor = () => {
    handleOpenAddPartyModal();
  };

  const handleRemoveContributor = (id: string) => {
    macAudio.playClick();
    if (contributors.length <= 1) {
      showNotification('At least 1 contributing party is required', 'error');
      return;
    }
    const next = contributors.filter((c) => c.id !== id);
    setContributors(next);
  };

  const handleUpdateContributor = (id: string, field: 'name' | 'paidAmount', val: any) => {
    const next = contributors.map((c) => (c.id === id ? { ...c, [field]: val } : c));
    setContributors(next);
  };

  const handleUpdateContributorPercent = (id: string, pctVal: number | '') => {
    if (pctVal === '' || isNaN(Number(pctVal))) {
      handleUpdateContributor(id, 'paidAmount', '');
      return;
    }
    const pct = Math.max(0, Math.min(100, Number(pctVal)));
    const totalBill = loadedBillTotal > 0 ? loadedBillTotal : totalPaidSum || 100000;
    const calcAmt = Math.round(((pct / 100) * totalBill) * 100) / 100;
    handleUpdateContributor(id, 'paidAmount', calcAmt);
  };

  // Filtered results by search query
  const filteredResults = useMemo(() => {
    const q = tableSearchQuery.trim().toLowerCase();
    if (!q) return results;
    return results.filter(
      (r) =>
        r.partyName.toLowerCase().includes(q) ||
        r.itemName.toLowerCase().includes(q) ||
        String(r.pcsQty).includes(q) ||
        String(r.boxes).includes(q) ||
        String(r.price).includes(q) ||
        String(r.totalGst).includes(q)
    );
  }, [results, tableSearchQuery]);

  // Paginated Results Slice
  const totalPages = Math.max(1, Math.ceil(filteredResults.length / pageSize));
  const paginatedResults = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredResults.slice(start, start + pageSize);
  }, [filteredResults, currentPage, pageSize]);

  // Grand Totals Summary
  const grandSummary = useMemo(() => {
    const totalPcs = results.reduce((s, r) => s + r.pcsQty, 0);
    const totalBoxes = results.reduce((s, r) => s + r.boxes, 0);
    const totalBillQty = results.reduce((s, r) => s + r.billQtyShare, 0);
    const totalWeight = results.reduce((s, r) => s + r.weightKg, 0);
    const totalGstVal = results.reduce((s, r) => s + r.totalGst, 0);

    return {
      totalPcs: Math.round(totalPcs * 100) / 100,
      totalBoxes: Math.round(totalBoxes * 10) / 10,
      totalBillQty: Math.round(totalBillQty),
      totalWeight: Math.round(totalWeight * 100) / 100,
      totalGstVal: Math.round(totalGstVal * 100) / 100
    };
  }, [results]);

  // Selected row auto-scroll
  useEffect(() => {
    if (selectedRowId) {
      const el = document.getElementById(`eq-row-${selectedRowId}`);
      if (el) {
        el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedRowId]);

  // Keyboard navigation on Results table
  const handleTableKeyDown = (e: React.KeyboardEvent) => {
    if (paginatedResults.length === 0) return;
    const currentIdx = paginatedResults.findIndex((r) => r.id === selectedRowId);

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      macAudio.playHover();
      if (currentIdx >= 0 && currentIdx < paginatedResults.length - 1) {
        setSelectedRowId(paginatedResults[currentIdx + 1].id);
      } else if (currentIdx === paginatedResults.length - 1) {
        if (currentPage < totalPages) {
          const nextBtn = document.getElementById('eq-pagination-next') as HTMLButtonElement | null;
          if (nextBtn && !nextBtn.disabled) nextBtn.focus();
        }
      } else if (currentIdx === -1) {
        setSelectedRowId(paginatedResults[0].id);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      macAudio.playHover();
      if (currentIdx > 0) {
        setSelectedRowId(paginatedResults[currentIdx - 1].id);
      } else if (currentIdx === 0) {
        if (currentPage > 1) {
          const prevBtn = document.getElementById('eq-pagination-prev') as HTMLButtonElement | null;
          if (prevBtn && !prevBtn.disabled) prevBtn.focus();
        }
      }
    } else if (e.key === 'Home') {
      e.preventDefault();
      setSelectedRowId(paginatedResults[0].id);
    } else if (e.key === 'End') {
      e.preventDefault();
      setSelectedRowId(paginatedResults[paginatedResults.length - 1].id);
    }
  };

  // Global F3 / Equation Shortcuts: Ctrl+L, Ctrl+G, Ctrl+P, Ctrl+E
  useEffect(() => {
    const handleGlobalShortcuts = (e: KeyboardEvent) => {
      // Ctrl+L: Focus Bill ID input
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        billInputRef.current?.focus();
        billInputRef.current?.select();
        macAudio.playClick();
        return;
      }

      // Ctrl+G: Calculate
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'g') {
        e.preventDefault();
        calculateDistribution();
        return;
      }

      // Ctrl+P: Print modal
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        setIsPrintModalOpen(true);
        macAudio.playClick();
        return;
      }

      // Ctrl+E: Copy table
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        handleCopyTableForExcel();
        return;
      }
    };

    window.addEventListener('keydown', handleGlobalShortcuts);
    return () => window.removeEventListener('keydown', handleGlobalShortcuts);
  }, [calculateDistribution]);

  // Copy Entire Table formatted for Excel (TSV)
  const handleCopyTableForExcel = () => {
    if (results.length === 0) {
      showNotification('No distribution results to copy', 'error');
      return;
    }

    const headers = ['Party Name', '% Share', 'Item Name', 'PCS QTY', 'Boxes', 'SQM/Mult', 'Bill Qty (Share)', 'Weight (KG)', 'Price', 'Total (+18% GST)'];
    const rows = results.map((r) => [
      r.partyName,
      `${(r.sharePct * 100).toFixed(1)}%`,
      r.itemName,
      r.pcsQty,
      r.boxes,
      r.mult,
      r.billQtyShare,
      r.weightKg,
      r.price,
      r.totalGst
    ]);

    const tsvContent = [headers.join('\t'), ...rows.map((row) => row.join('\t'))].join('\n');

    navigator.clipboard
      .writeText(tsvContent)
      .then(() => {
        setCopiedExcel(true);
        macAudio.playSuccess();
        showNotification('Table copied to clipboard! Ready to paste into Excel (Ctrl+V)', 'success');
        setTimeout(() => setCopiedExcel(false), 3000);
      })
      .catch(() => {
        showNotification('Failed to copy to clipboard', 'error');
      });
  };

  // Download CSV
  const handleExportCSV = () => {
    if (results.length === 0) {
      showNotification('No distribution results to export', 'error');
      return;
    }

    const headers = ['Party Name', 'Share Percent', 'Item Name', 'PCS Qty', 'Boxes', 'SQM Mult', 'Bill Qty Share', 'Weight KG', 'Unit Price', 'Total With 18% GST'];
    const rows = results.map((r) => [
      r.partyName,
      `${(r.sharePct * 100).toFixed(2)}%`,
      r.itemName,
      r.pcsQty,
      r.boxes,
      r.mult,
      r.billQtyShare,
      r.weightKg,
      r.price,
      r.totalGst
    ]);

    const safeParty = loadedBillParty.replace(/[^a-zA-Z0-9_-]/g, '_');
    downloadCSV(`Equation_Distribution_${safeParty}_Bill_${loadedBillToken || selectedBillId}.csv`, headers, rows);
    macAudio.playSuccess();
    showNotification('Exported Equation Distribution CSV', 'success');
  };

  const equationCsvColumns: CsvColumnDef<EquationResultRow>[] = [
    { header: 'Party Name', key: 'partyName', sampleValue: 'Sharma Aluminium' },
    { header: 'Share Percent', key: 'sharePct', sampleValue: '50%', formatter: r => `${(r.sharePct * 100).toFixed(2)}%` },
    { header: 'Item Name', key: 'itemName', sampleValue: 'Aluminium Section' },
    { header: 'PCS Qty', key: 'pcsQty', sampleValue: 100 },
    { header: 'Boxes', key: 'boxes', sampleValue: 10 },
    { header: 'SQM Mult', key: 'mult', sampleValue: 1.0 },
    { header: 'Bill Qty Share', key: 'billQtyShare', sampleValue: 50 },
    { header: 'Weight KG', key: 'weightKg', sampleValue: 85 },
    { header: 'Unit Price', key: 'price', sampleValue: 450 },
    { header: 'Total With 18% GST', key: 'totalGst', sampleValue: 45135 }
  ];

  // Direct Native Print through PyQt print service (:5005) (Zero Browser Print)
  const handleTriggerPrint = async () => {
    setIsDirectPrinting(true);
    macAudio.playClick();

    try {
      const targetPrinter = defaultPrinter || localStorage.getItem('default_printer') || '';
      const payload = {
        title: 'MULTI-PARTY GOODS DISTRIBUTION & EQUATION REPORT',
        billToken: loadedBillToken || selectedBillId,
        billNo: loadedBillToken || selectedBillId,
        date: loadedBillDate,
        party: loadedBillParty,
        grandTotal: grandSummary.totalGstVal,
        printerName: targetPrinter || undefined,
        contributors: contributors.map((c) => ({
          name: c.name,
          paidAmount: c.paidAmount,
          billTotal: partyBillTotals[c.name] || 0
        })),
        items: results.map((r) => ({
          party: r.partyName,
          sharePct: `${(r.sharePct * 100).toFixed(1)}%`,
          item: r.itemName,
          pcs: r.pcsQty,
          boxes: r.boxes,
          mult: r.mult,
          billQty: r.billQtyShare,
          weight: r.weightKg,
          price: r.price,
          total: r.totalGst,
          paid_amt: String(r.partyPaidAmt || 0)
        }))
      };

      const res = await fetch(`${PRINT_API_URL}/api/print/equation-direct`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json().catch(() => null);

      if (res.ok && data?.success) {
        macAudio.playSuccess();
        showNotification(data.message || `Printed directly to ${data.printer || targetPrinter || 'Default Printer'}!`, 'success');
        setIsPrintModalOpen(false);
      } else {
        macAudio.playError();
        showNotification(data?.error || 'Native print spooling failed. Please check printer configuration in General Settings.', 'error');
      }
    } catch (err: any) {
      macAudio.playError();
      showNotification('Native print service (:5005) not running. Browser print is permanently disabled to maintain vector quality.', 'error');
    } finally {
      setIsDirectPrinting(false);
    }
  };

  // Comprehensive party suggestions (including parties from bills)
  const allPartyNames = useMemo(() => {
    const list: { id: string; name: string; station?: string; district?: string }[] = [];
    const seen = new Set<string>();

    parties.forEach((p) => {
      const key = (p.name || '').trim().toLowerCase();
      if (key && !seen.has(key)) {
        seen.add(key);
        list.push({ id: p.id, name: p.name, station: p.station, district: p.district });
      }
    });

    bills.forEach((b) => {
      const key = (b.party || '').trim().toLowerCase();
      if (key && !seen.has(key)) {
        seen.add(key);
        list.push({ id: `b_${b.id}`, name: b.party });
      }
    });

    return list;
  }, [parties, bills]);

  // Filtered party list for suggestions
  const filteredPartySuggestions = useMemo(() => {
    const q = partyFilterText.toLowerCase().trim();
    if (!q) return allPartyNames.slice(0, 40);
    return allPartyNames
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.station || '').toLowerCase().includes(q) ||
          (p.district || '').toLowerCase().includes(q)
      )
      .slice(0, 40);
  }, [allPartyNames, partyFilterText]);

  // Helper to update party dropdown coordinates
  const updateDropdownPos = useCallback((el: HTMLElement) => {
    const rect = el.getBoundingClientRect();
    setDropdownPos({
      top: rect.bottom + 4,
      left: rect.left,
      width: Math.max(rect.width, 320)
    });
  }, []);

  // Sync floating party dropdown position on window scroll or resize
  useEffect(() => {
    if (!partyDropdownOpenFor) return;
    const handleReposition = () => {
      const inputEl = document.getElementById(`party-input-${partyDropdownOpenFor}`);
      if (inputEl) {
        updateDropdownPos(inputEl);
      } else {
        setPartyDropdownOpenFor(null);
      }
    };
    window.addEventListener('scroll', handleReposition, true);
    window.addEventListener('resize', handleReposition);
    return () => {
      window.removeEventListener('scroll', handleReposition, true);
      window.removeEventListener('resize', handleReposition);
    };
  }, [partyDropdownOpenFor, updateDropdownPos]);

  // Click outside listener for party suggestions portal
  useEffect(() => {
    if (!partyDropdownOpenFor) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        !target.closest('#equation-party-dropdown') &&
        !target.closest(`[data-party-input="${partyDropdownOpenFor}"]`)
      ) {
        setPartyDropdownOpenFor(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [partyDropdownOpenFor]);

  // Bill search suggestions list for left panel
  const filteredBillSuggestions = useMemo(() => {
    const q = billSearchInput.toLowerCase().trim();
    if (!q) return bills.slice(0, 15);
    return bills
      .filter((b) => {
        const idMatch = String(b.id || '').toLowerCase().includes(q);
        const tokenMatch = String(b.token || '').toLowerCase().includes(q);
        const partyMatch = String(b.party || '').toLowerCase().includes(q);
        return idMatch || tokenMatch || partyMatch;
      })
      .slice(0, 15);
  }, [bills, billSearchInput]);

  // Click outside listener for bill suggestions portal
  useEffect(() => {
    if (!billDropdownOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        !target.closest('#equation-bill-dropdown') &&
        billInputRef.current &&
        !billInputRef.current.contains(target)
      ) {
        setBillDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [billDropdownOpen]);

  // Sync bill dropdown pos on scroll/resize
  useEffect(() => {
    if (!billDropdownOpen) return;
    const handleReposition = () => {
      if (billInputRef.current) {
        const rect = billInputRef.current.getBoundingClientRect();
        setBillDropdownPos({
          top: rect.bottom + 4,
          left: rect.left,
          width: Math.max(rect.width, 300)
        });
      } else {
        setBillDropdownOpen(false);
      }
    };
    window.addEventListener('scroll', handleReposition, true);
    window.addEventListener('resize', handleReposition);
    return () => {
      window.removeEventListener('scroll', handleReposition, true);
      window.removeEventListener('resize', handleReposition);
    };
  }, [billDropdownOpen]);

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        height: '100%',
        minHeight: 0,
        overflow: 'hidden',
        background: '#09090b',
        color: '#f4f4f5',
        fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, sans-serif"
      }}
    >
      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 1. TOP HEADER & QUICK ACTIONS BAR (MAC-GLASS / SHADCN STYLE)        */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div
        className="glass-panel"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 12px',
          borderRadius: '8px',
          flexShrink: 0,
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '7px',
              background: 'rgba(56, 189, 248, 0.12)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#38bdf8'
            }}
          >
            <Calculator size={15} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#f4f4f5', letterSpacing: '-0.2px' }}>
              Equation & Multi-Party Distribution
            </span>
            <span
              style={{
                background: '#27272a',
                color: '#94a3b8',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                fontSize: '10px',
                fontWeight: 700,
                padding: '1px 6px',
                borderRadius: '4px'
              }}
            >
              F3
            </span>
          </div>

          {loadedBillParty && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '6px' }}>
              <span style={{ height: '14px', width: '1px', background: 'rgba(255, 255, 255, 0.12)' }} />
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#38bdf8',
                  background: 'rgba(56, 189, 248, 0.08)',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  border: '1px solid rgba(56, 189, 248, 0.2)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>#{loadedBillToken || selectedBillId}</span>
                <span style={{ color: '#64748b' }}>•</span>
                <span>{loadedBillParty}</span>
                <span style={{ color: '#64748b' }}>•</span>
                <span style={{ color: '#34d399' }}>{formatINR(loadedBillTotal)}</span>
              </span>
            </div>
          )}
        </div>

        {/* Right Status & Action Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {statusMsg && (
            <div
              style={{
                fontSize: '11px',
                fontWeight: 600,
                padding: '3px 9px',
                borderRadius: '6px',
                background: statusMsg.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : statusMsg.type === 'error' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                color: statusMsg.type === 'success' ? '#34d399' : statusMsg.type === 'error' ? '#f87171' : '#38bdf8',
                border: `1px solid ${statusMsg.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : statusMsg.type === 'error' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(56, 189, 248, 0.3)'}`
              }}
            >
              {statusMsg.text}
            </div>
          )}

          {/* Print Button (Mac-glass style with Tooltip) */}
          <Tooltip title="Print Distribution Report (Ctrl+P)" side="bottom">
            <button
              type="button"
              className="mac-btn"
              onClick={() => {
                macAudio.playPop();
                setIsPrintModalOpen(true);
              }}
              onMouseEnter={() => macAudio.playHover()}
              style={{
                height: '28px',
                padding: '0 10px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '11.5px',
                fontWeight: 500
              }}
            >
              <Printer size={13} color="#38bdf8" />
              <span>Print</span>
            </button>
          </Tooltip>

          {/* Copy Table for Excel */}
          <Tooltip title="Copy Table for Excel (Ctrl+E)" side="bottom">
            <button
              type="button"
              className="mac-btn"
              onClick={handleCopyTableForExcel}
              onMouseEnter={() => macAudio.playHover()}
              style={{
                height: '28px',
                padding: '0 10px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '11.5px',
                fontWeight: 500,
                borderColor: copiedExcel ? 'rgba(16, 185, 129, 0.4)' : undefined,
                color: copiedExcel ? '#34d399' : undefined
              }}
            >
              {copiedExcel ? <Check size={13} color="#34d399" /> : <Copy size={13} />}
              <span>{copiedExcel ? 'Copied!' : 'Copy Excel'}</span>
            </button>
          </Tooltip>

          {/* Excel / CSV Data Center */}
          <ExcelCsvActions<EquationResultRow>
            entityName="Equation Distribution"
            filenamePrefix={`Equation_Distribution_${(loadedBillParty || 'Report').replace(/[^a-zA-Z0-9_-]/g, '_')}`}
            columns={equationCsvColumns}
            data={results}
            compact={true}
          />
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 2. MAIN 2-PANEL SPLIT (STRUCTURED MANNER LIKE BILL UI / HISTORY)    */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          gap: '8px',
          minHeight: 0,
          overflow: 'hidden'
        }}
      >
        {/* ── LEFT PANEL: Bill Selector & Contributors Manager (~320px) ───── */}
        <div
          style={{
            flex: '0 0 320px',
            width: '320px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            minHeight: 0,
            overflow: 'hidden'
          }}
        >
          {/* Card 1: Bill Selection */}
          <div
            className="glass-panel"
            style={{
              borderRadius: '8px',
              padding: '10px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              flexShrink: 0
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FileText size={13} color="#94a3b8" />
                <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.04em' }}>
                  Source Bill
                </span>
              </div>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 600,
                  color: '#38bdf8',
                  background: 'rgba(56, 189, 248, 0.08)',
                  padding: '1px 6px',
                  borderRadius: '4px',
                  border: '1px solid rgba(56, 189, 248, 0.2)'
                }}
              >
                {bills.length} Bills
              </span>
            </div>

            {/* Bill Search & Load Input */}
            <div style={{ display: 'flex', gap: '6px' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <Search size={12} style={{ position: 'absolute', left: '8px', top: '8px', color: '#71717a' }} />
                <input
                  ref={billInputRef}
                  type="text"
                  placeholder="Token / Party / ID..."
                  value={billSearchInput}
                  autoComplete="off"
                  onFocus={(e) => {
                    setBillDropdownOpen(true);
                    const rect = e.currentTarget.getBoundingClientRect();
                    setBillDropdownPos({
                      top: rect.bottom + 4,
                      left: rect.left,
                      width: Math.max(rect.width, 300)
                    });
                  }}
                  onChange={(e) => {
                    setBillSearchInput(e.target.value);
                    setBillDropdownOpen(true);
                    const rect = e.currentTarget.getBoundingClientRect();
                    setBillDropdownPos({
                      top: rect.bottom + 4,
                      left: rect.left,
                      width: Math.max(rect.width, 300)
                    });
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      setBillDropdownOpen(false);
                      loadBillData();
                    } else if (e.key === 'Escape') {
                      setBillDropdownOpen(false);
                    }
                  }}
                  style={{
                    width: '100%',
                    height: '28px',
                    background: 'rgba(0, 0, 0, 0.4)',
                    border: billDropdownOpen ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '6px',
                    paddingLeft: '26px',
                    paddingRight: '8px',
                    color: '#f4f4f5',
                    fontSize: '11.5px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <Tooltip title="Load Selected Bill (Ctrl+L)" side="bottom">
                <button
                  type="button"
                  className="mac-btn"
                  onClick={() => {
                    setBillDropdownOpen(false);
                    loadBillData();
                  }}
                  style={{
                    height: '28px',
                    padding: '0 10px',
                    fontSize: '11px',
                    fontWeight: 600,
                    whiteSpace: 'nowrap'
                  }}
                >
                  Load
                </button>
              </Tooltip>
            </div>

            {/* Loaded Bill Summary Strip */}
            {loadedBillParty && (
              <div
                style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '6px',
                  padding: '6px 8px',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '4px',
                  fontSize: '11px'
                }}
              >
                <div>
                  <span style={{ color: '#71717a' }}>Party: </span>
                  <span style={{ fontWeight: 600, color: '#f4f4f5' }}>{loadedBillParty}</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ color: '#71717a' }}>Gross: </span>
                  <span style={{ fontWeight: 700, color: '#34d399' }}>{formatINR(loadedBillTotal)}</span>
                </div>
                <div>
                  <span style={{ color: '#71717a' }}>Date: </span>
                  <span style={{ color: '#94a3b8' }}>{loadedBillDate || '—'}</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ color: '#71717a' }}>Items: </span>
                  <span style={{ color: '#38bdf8', fontWeight: 600 }}>{baseItems.length} Mould</span>
                </div>
              </div>
            )}
          </div>

          {/* Card 2: Contributor Parties & Allocation (Flex 1) */}
          <div
            className="glass-panel"
            style={{
              flex: 1,
              borderRadius: '8px',
              padding: '10px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              minHeight: 0,
              overflow: 'hidden'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Users size={13} color="#94a3b8" />
                <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.04em' }}>
                  Contributors
                </span>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 600,
                    color: '#c084fc',
                    background: 'rgba(192, 132, 252, 0.08)',
                    padding: '1px 6px',
                    borderRadius: '4px',
                    border: '1px solid rgba(192, 132, 252, 0.2)'
                  }}
                >
                  Paid: {formatINR(totalPaidSum)}
                </span>
              </div>

              <Tooltip title="Add contributing party to distribution" side="bottom">
                <button
                  type="button"
                  className="mac-btn"
                  onClick={handleAddContributor}
                  style={{
                    height: '24px',
                    padding: '0 8px',
                    fontSize: '10.5px',
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Plus size={11} color="#38bdf8" />
                  <span>Add Party</span>
                </button>
              </Tooltip>
            </div>

            {/* Scrollable Contributor Cards List */}
            <div
              style={{
                flex: 1,
                minHeight: 0,
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                paddingRight: '2px'
              }}
            >
              {contributors.map((c, idx) => {
                const shareInfo = contribShares.find((cs) => cs.id === c.id);
                const sharePct = shareInfo ? shareInfo.sharePct * 100 : 0;
                const effectiveAmt = shareInfo ? shareInfo.effectivePaid : 0;
                const isAutoSplit = shareInfo ? shareInfo.isAuto : true;
                const calculatedBillTotal = partyBillTotals[c.name] || 0;

                return (
                  <div
                    key={c.id}
                    style={{
                      background: 'rgba(24, 24, 27, 0.7)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '8px',
                      padding: '8px 10px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '7px',
                      transition: 'border-color 0.15s ease, background 0.15s ease',
                      boxShadow: '0 2px 6px rgba(0, 0, 0, 0.25)'
                    }}
                  >
                    {/* Top Row: Index Badge + Party Name Input + Trash */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          color: '#a1a1aa',
                          background: 'rgba(255, 255, 255, 0.06)',
                          borderRadius: '4px',
                          padding: '1px 5px',
                          fontFamily: "'JetBrains Mono', monospace"
                        }}
                      >
                        #{idx + 1}
                      </span>
                      <div style={{ flex: 1, position: 'relative' }}>
                        <input
                          id={`party-input-${c.id}`}
                          data-party-input={c.id}
                          type="text"
                          placeholder="Search or enter party name..."
                          value={c.name}
                          autoComplete="off"
                          autoCorrect="off"
                          spellCheck={false}
                          onFocus={(e) => {
                            setPartyDropdownOpenFor(c.id);
                            setPartyFilterText(c.name);
                            setFocusedSuggestionIndex(-1);
                            updateDropdownPos(e.currentTarget);
                          }}
                          onChange={(e) => {
                            handleUpdateContributor(c.id, 'name', e.target.value);
                            setPartyFilterText(e.target.value);
                            setFocusedSuggestionIndex(-1);
                            if (!partyDropdownOpenFor) setPartyDropdownOpenFor(c.id);
                            updateDropdownPos(e.currentTarget);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'ArrowDown') {
                              e.preventDefault();
                              if (!partyDropdownOpenFor) {
                                setPartyDropdownOpenFor(c.id);
                                setPartyFilterText(c.name);
                                updateDropdownPos(e.currentTarget);
                              }
                              setFocusedSuggestionIndex((prev) => Math.min(prev + 1, filteredPartySuggestions.length - 1));
                            } else if (e.key === 'ArrowUp') {
                              e.preventDefault();
                              setFocusedSuggestionIndex((prev) => Math.max(prev - 1, 0));
                            } else if (e.key === 'Enter') {
                              e.preventDefault();
                              if (partyDropdownOpenFor && filteredPartySuggestions.length > 0 && focusedSuggestionIndex >= 0) {
                                const chosen = filteredPartySuggestions[focusedSuggestionIndex];
                                handleUpdateContributor(c.id, 'name', chosen.name);
                                setPartyDropdownOpenFor(null);
                              } else if (partyFilterText.trim()) {
                                handleUpdateContributor(c.id, 'name', partyFilterText.trim());
                                setPartyDropdownOpenFor(null);
                              }
                              const amtInput = document.getElementById(`party-amount-${c.id}`);
                              if (amtInput) amtInput.focus();
                            } else if (e.key === 'Escape') {
                              e.preventDefault();
                              setPartyDropdownOpenFor(null);
                            }
                          }}
                          style={{
                            width: '100%',
                            height: '26px',
                            background: 'rgba(0, 0, 0, 0.45)',
                            border: partyDropdownOpenFor === c.id ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '5px',
                            padding: '0 8px',
                            color: '#f4f4f5',
                            fontSize: '11.5px',
                            fontWeight: 600,
                            fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                            outline: 'none',
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>

                      <Tooltip title={contributors.length <= 1 ? 'At least 1 party required' : 'Remove Contributor'} side="bottom">
                        <button
                          type="button"
                          className="mac-btn"
                          onClick={() => handleRemoveContributor(c.id)}
                          disabled={contributors.length <= 1}
                          style={{
                            width: '24px',
                            height: '24px',
                            padding: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: contributors.length <= 1 ? '#3f3f46' : '#71717a'
                          }}
                          onMouseEnter={(e) => {
                            if (contributors.length > 1) (e.currentTarget as HTMLButtonElement).style.color = '#f87171';
                          }}
                          onMouseLeave={(e) => {
                            if (contributors.length > 1) (e.currentTarget as HTMLButtonElement).style.color = '#71717a';
                          }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </Tooltip>
                    </div>

                    {/* Middle Row: Amount in Bill + % Share */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <span style={{ color: '#71717a', fontSize: '10.5px', fontWeight: 600 }}>Amount:</span>
                        <div style={{ position: 'relative', flex: 1 }}>
                          <span style={{ position: 'absolute', left: '5px', top: '4px', fontSize: '10.5px', color: '#71717a', fontWeight: 700 }}>₹</span>
                          <input
                            id={`party-amount-${c.id}`}
                            type="number"
                            value={c.paidAmount !== undefined && c.paidAmount !== null && c.paidAmount !== 0 ? c.paidAmount : ''}
                            placeholder={effectiveAmt > 0 ? `${Math.round(effectiveAmt)}` : 'Auto'}
                            onChange={(e) => {
                              const val = e.target.value === '' ? '' : parseFloat(e.target.value) || 0;
                              handleUpdateContributor(c.id, 'paidAmount', val);
                            }}
                            style={{
                              width: '100%',
                              height: '23px',
                              background: 'rgba(0, 0, 0, 0.4)',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                              borderRadius: '4px',
                              paddingLeft: '14px',
                              paddingRight: '4px',
                              color: isAutoSplit ? '#94a3b8' : '#34d399',
                              fontSize: '11px',
                              textAlign: 'right',
                              outline: 'none',
                              fontWeight: 700,
                              fontFamily: "'JetBrains Mono', monospace",
                              boxSizing: 'border-box'
                            }}
                            onFocus={(e) => (e.currentTarget.style.borderColor = '#38bdf8')}
                            onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)')}
                          />
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <span style={{ color: '#71717a', fontSize: '10.5px', fontWeight: 600 }}>Share:</span>
                        <div style={{ position: 'relative', flex: 1 }}>
                          <input
                            type="number"
                            step="0.1"
                            value={Number(sharePct.toFixed(1)) || ''}
                            placeholder="0.0"
                            onChange={(e) => {
                              const val = e.target.value === '' ? '' : parseFloat(e.target.value) || 0;
                              handleUpdateContributorPercent(c.id, val);
                            }}
                            style={{
                              width: '100%',
                              height: '23px',
                              background: 'rgba(0, 0, 0, 0.4)',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                              borderRadius: '4px',
                              paddingLeft: '4px',
                              paddingRight: '14px',
                              color: isAutoSplit ? '#38bdf8' : '#c084fc',
                              fontSize: '11px',
                              textAlign: 'right',
                              outline: 'none',
                              fontWeight: 700,
                              fontFamily: "'JetBrains Mono', monospace",
                              boxSizing: 'border-box'
                            }}
                            onFocus={(e) => (e.currentTarget.style.borderColor = '#c084fc')}
                            onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)')}
                          />
                          <span style={{ position: 'absolute', right: '4px', top: '4px', fontSize: '10.5px', color: '#71717a', fontWeight: 700 }}>%</span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Row: Net GST Share preview */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '3px 6px',
                        background: 'rgba(0, 0, 0, 0.25)',
                        borderRadius: '4px',
                        fontSize: '10.5px'
                      }}
                    >
                      <span style={{ color: '#71717a' }}>Net (+18% GST):</span>
                      <strong style={{ color: '#38bdf8', fontFamily: "'JetBrains Mono', monospace", fontSize: '11px' }}>
                        {formatINR(calculatedBillTotal)}
                      </strong>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 3. UNIFIED GOODS DISTRIBUTION & GST CALCULATION RESULTS TABLE       */}
      {/* ─────────────────────────────────────────────────────────────────── */}
        {/* ── RIGHT PANEL: Unified Goods Distribution Grid (Flex 1) ─────── */}
        <div
          className="glass-panel"
          style={{
            flex: 1,
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            borderRadius: '8px',
            overflow: 'hidden',
            minHeight: 0
          }}
        >
          {/* Table Filter & Toolbar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '7px 12px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              background: 'rgba(24, 24, 27, 0.6)',
              flexShrink: 0,
              gap: '10px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#f4f4f5' }}>
                Distribution & GST Calculation Grid
              </span>
              <span
                style={{
                  fontSize: '10.5px',
                  fontWeight: 600,
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: '#94a3b8',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  padding: '2px 7px',
                  borderRadius: '4px'
                }}
              >
                {filteredResults.length} Distributed Rows
              </span>
            </div>

            <div style={{ position: 'relative' }}>
              <Search size={12} style={{ position: 'absolute', left: '8px', top: '7px', color: '#71717a' }} />
              <input
                type="text"
                placeholder="Filter party, item or amount..."
                value={tableSearchQuery}
                onChange={(e) => {
                  setTableSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                style={{
                  height: '26px',
                  width: '220px',
                  background: 'rgba(0, 0, 0, 0.4)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '5px',
                  paddingLeft: '24px',
                  paddingRight: '8px',
                  fontSize: '11px',
                  color: '#f4f4f5',
                  outline: 'none'
                }}
              />
            </div>
          </div>

        {/* The Scrollable Table */}
        <div
          ref={tableWrapperRef}
          tabIndex={0}
          onKeyDown={handleTableKeyDown}
          style={{
            flex: 1,
            minHeight: 0,
            overflow: 'auto',
            background: '#09090b',
            outline: 'none'
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: '#18181b' }}>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <th style={{ width: '36px', padding: '8px 6px', textAlign: 'center', color: '#94a3b8', fontSize: '10.5px', fontWeight: 600 }}>#</th>
                <th style={{ width: '170px', padding: '8px 10px', textAlign: 'left', color: '#94a3b8', fontSize: '10.5px', fontWeight: 600 }}>PARTY NAME</th>
                <th style={{ width: '75px', padding: '8px 8px', textAlign: 'center', color: '#94a3b8', fontSize: '10.5px', fontWeight: 600 }}>% SHARE</th>
                <th style={{ minWidth: '180px', padding: '8px 10px', textAlign: 'left', color: '#94a3b8', fontSize: '10.5px', fontWeight: 600 }}>ITEM NAME</th>
                <th style={{ width: '85px', padding: '8px 8px', textAlign: 'right', color: '#94a3b8', fontSize: '10.5px', fontWeight: 600 }}>PCS QTY</th>
                <th style={{ width: '75px', padding: '8px 8px', textAlign: 'right', color: '#94a3b8', fontSize: '10.5px', fontWeight: 600 }}>BOXES</th>
                <th style={{ width: '75px', padding: '8px 8px', textAlign: 'center', color: '#94a3b8', fontSize: '10.5px', fontWeight: 600 }}>SQM/MULT</th>
                <th style={{ width: '110px', padding: '8px 8px', textAlign: 'right', color: '#94a3b8', fontSize: '10.5px', fontWeight: 600 }}>BILL QTY (SHARE)</th>
                <th style={{ width: '95px', padding: '8px 8px', textAlign: 'right', color: '#94a3b8', fontSize: '10.5px', fontWeight: 600 }}>WEIGHT (KG)</th>
                <th style={{ width: '95px', padding: '8px 8px', textAlign: 'right', color: '#94a3b8', fontSize: '10.5px', fontWeight: 600 }}>PRICE (₹)</th>
                <th style={{ width: '130px', padding: '8px 10px', textAlign: 'right', color: '#94a3b8', fontSize: '10.5px', fontWeight: 600 }}>TOTAL (+18% GST)</th>
              </tr>
            </thead>
            <tbody>
              {paginatedResults.length === 0 ? (
                <tr>
                  <td colSpan={11} style={{ textAlign: 'center', padding: '48px 10px', color: '#71717a', fontSize: '12.5px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <Layers size={28} style={{ color: '#3f3f46' }} />
                      <span>
                        {results.length === 0
                          ? 'No equation distribution to display. Load a bill and add parties to auto-calculate.'
                          : `No rows match "${tableSearchQuery}".`}
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedResults.map((r, idx) => {
                  const isSelected = selectedRowId === r.id;
                  const globalIdx = (currentPage - 1) * pageSize + idx + 1;

                  return (
                    <tr
                      key={r.id}
                      id={`eq-row-${r.id}`}
                      onClick={() => {
                        setSelectedRowId(r.id);
                        macAudio.playClick();
                      }}
                      style={{
                        height: '31px',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                        background: isSelected
                          ? 'rgba(56, 189, 248, 0.08)'
                          : idx % 2 === 0
                          ? 'rgba(255, 255, 255, 0.015)'
                          : 'transparent',
                        outline: isSelected ? '1px solid rgba(56, 189, 248, 0.25)' : 'none',
                        outlineOffset: '-1px',
                        cursor: 'pointer',
                        transition: 'background 0.12s ease'
                      }}
                    >
                      <td style={{ textAlign: 'center', color: '#52525b', fontSize: '11px', fontFamily: "'JetBrains Mono', monospace" }}>{globalIdx}</td>

                      {/* Party Name */}
                      <td style={{ padding: '4px 10px', fontWeight: 600, color: '#f4f4f5', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {r.partyName}
                      </td>

                      {/* % Share */}
                      <td style={{ padding: '4px 8px', textAlign: 'center' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '1px 6px',
                            borderRadius: '4px',
                            background: 'rgba(192, 132, 252, 0.1)',
                            border: '1px solid rgba(192, 132, 252, 0.25)',
                            color: '#c084fc',
                            fontWeight: 700,
                            fontSize: '10.5px',
                            fontFamily: "'JetBrains Mono', monospace"
                          }}
                        >
                          {(r.sharePct * 100).toFixed(1)}%
                        </span>
                      </td>

                      {/* Item Name */}
                      <td style={{ padding: '4px 10px', color: '#e4e4e7', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {r.itemName}
                      </td>

                      {/* PCS Qty */}
                      <td style={{ padding: '4px 8px', textAlign: 'right', fontWeight: 600, color: '#f4f4f5', fontFamily: "'JetBrains Mono', monospace", fontVariantNumeric: 'tabular-nums' }}>
                        {r.pcsQty.toLocaleString('en-IN')}
                      </td>

                      {/* Boxes */}
                      <td style={{ padding: '4px 8px', textAlign: 'right', color: '#38bdf8', fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", fontVariantNumeric: 'tabular-nums' }}>
                        {r.boxes.toLocaleString('en-IN')}
                      </td>

                      {/* SQM / Mult */}
                      <td style={{ padding: '4px 8px', textAlign: 'center', color: '#a1a1aa', fontFamily: "'JetBrains Mono', monospace", fontVariantNumeric: 'tabular-nums' }}>
                        {r.mult}
                      </td>

                      {/* Bill Qty Share */}
                      <td style={{ padding: '4px 8px', textAlign: 'right', fontWeight: 600, color: '#34d399', fontFamily: "'JetBrains Mono', monospace", fontVariantNumeric: 'tabular-nums' }}>
                        {Math.round(r.billQtyShare).toLocaleString('en-IN')}
                      </td>

                      {/* Weight KG */}
                      <td style={{ padding: '4px 8px', textAlign: 'right', fontWeight: 600, color: '#2dd4bf', fontFamily: "'JetBrains Mono', monospace", fontVariantNumeric: 'tabular-nums' }}>
                        {r.weightKg.toFixed(2)}
                      </td>

                      {/* Price (Editable) */}
                      <td style={{ padding: '2px 6px', textAlign: 'right' }}>
                        <input
                          type="number"
                          step="0.01"
                          value={r.price || ''}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => handleUpdatePrice(r.id, parseFloat(e.target.value) || 0)}
                          style={{
                            width: '76px',
                            height: '23px',
                            background: 'rgba(0, 0, 0, 0.45)',
                            border: '1px solid rgba(255, 255, 255, 0.12)',
                            borderRadius: '4px',
                            padding: '0 6px',
                            color: '#38bdf8',
                            fontSize: '11px',
                            textAlign: 'right',
                            outline: 'none',
                            fontWeight: 700,
                            fontFamily: "'JetBrains Mono', monospace",
                            fontVariantNumeric: 'tabular-nums'
                          }}
                          onFocus={(e) => {
                            e.currentTarget.style.borderColor = '#38bdf8';
                            e.currentTarget.select();
                          }}
                          onBlur={(e) => {
                            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                          }}
                        />
                      </td>

                      {/* Total (+18% GST) */}
                      <td style={{ padding: '4px 10px', textAlign: 'right', fontWeight: 700, color: '#f4f4f5', fontFamily: "'JetBrains Mono', monospace", fontVariantNumeric: 'tabular-nums' }}>
                        {formatINR(r.totalGst)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

            {/* ── STICKY TFOOT: Column-Aligned Totals Directly Under Each Column (Matching Enter Stock) ── */}
            <tfoot
              style={{
                position: 'sticky',
                bottom: 0,
                zIndex: 10,
                background: '#141417',
                borderTop: '2px solid rgba(56, 189, 248, 0.4)',
                boxShadow: '0 -4px 16px rgba(0, 0, 0, 0.8)'
              }}
            >
              <tr style={{ height: '34px', background: '#141417' }}>
                {/* 1. # Index */}
                <td style={{ textAlign: 'center', color: '#71717a', fontSize: '11px', fontWeight: 800 }}>Σ</td>

                {/* 2. Party Name + 3. % Share + 4. Item Name -> Span 3 columns */}
                <td
                  colSpan={3}
                  style={{
                    padding: '4px 10px',
                    textAlign: 'left',
                    color: '#38bdf8',
                    fontSize: '11px',
                    fontWeight: 800,
                    letterSpacing: '0.05em',
                    fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
                  }}
                >
                  TOTAL SUMMARY ({filteredResults.length} ROWS)
                </td>

                {/* 5. PCS Qty Column Total */}
                <td
                  style={{
                    padding: '4px 8px',
                    textAlign: 'right',
                    color: '#f4f4f5',
                    fontSize: '12px',
                    fontWeight: 800,
                    fontFamily: "'JetBrains Mono', monospace",
                    borderLeft: '1px solid rgba(255, 255, 255, 0.08)'
                  }}
                >
                  {grandSummary.totalPcs.toLocaleString('en-IN')}
                </td>

                {/* 6. Boxes Column Total */}
                <td
                  style={{
                    padding: '4px 8px',
                    textAlign: 'right',
                    color: '#38bdf8',
                    fontSize: '12px',
                    fontWeight: 800,
                    fontFamily: "'JetBrains Mono', monospace",
                    borderLeft: '1px solid rgba(255, 255, 255, 0.08)'
                  }}
                >
                  {grandSummary.totalBoxes.toLocaleString('en-IN')}
                </td>

                {/* 7. SQM / Mult */}
                <td
                  style={{
                    padding: '4px 8px',
                    textAlign: 'center',
                    color: '#71717a',
                    fontSize: '11px',
                    borderLeft: '1px solid rgba(255, 255, 255, 0.08)'
                  }}
                >
                  —
                </td>

                {/* 8. Bill Qty Share Column Total */}
                <td
                  style={{
                    padding: '4px 8px',
                    textAlign: 'right',
                    color: '#34d399',
                    fontSize: '12px',
                    fontWeight: 800,
                    fontFamily: "'JetBrains Mono', monospace",
                    borderLeft: '1px solid rgba(255, 255, 255, 0.08)'
                  }}
                >
                  {grandSummary.totalBillQty.toLocaleString('en-IN')}
                </td>

                {/* 9. Weight KG Column Total */}
                <td
                  style={{
                    padding: '4px 8px',
                    textAlign: 'right',
                    color: '#2dd4bf',
                    fontSize: '12px',
                    fontWeight: 800,
                    fontFamily: "'JetBrains Mono', monospace",
                    borderLeft: '1px solid rgba(255, 255, 255, 0.08)'
                  }}
                >
                  {grandSummary.totalWeight.toFixed(2)} KG
                </td>

                {/* 10. Price Column */}
                <td
                  style={{
                    padding: '4px 8px',
                    textAlign: 'center',
                    color: '#71717a',
                    fontSize: '11px',
                    borderLeft: '1px solid rgba(255, 255, 255, 0.08)'
                  }}
                >
                  —
                </td>

                {/* 11. Total (+18% GST) Column Total */}
                <td
                  style={{
                    padding: '4px 10px',
                    textAlign: 'right',
                    color: '#38bdf8',
                    fontSize: '12.5px',
                    fontWeight: 800,
                    fontFamily: "'JetBrains Mono', monospace",
                    borderLeft: '1px solid rgba(255, 255, 255, 0.08)'
                  }}
                >
                  {formatINR(grandSummary.totalGstVal)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* 4. PAGINATION FOOTER TOOLBAR                                        */}
        {/* ─────────────────────────────────────────────────────────────────── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '7px 12px',
            background: 'rgba(24, 24, 27, 0.8)',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            flexShrink: 0,
            gap: '12px'
          }}
        >
          {/* Status info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>
              Showing <strong style={{ color: '#f4f4f5', fontFamily: "'JetBrains Mono', monospace" }}>{paginatedResults.length}</strong> of{' '}
              <strong style={{ color: '#f4f4f5', fontFamily: "'JetBrains Mono', monospace" }}>{filteredResults.length}</strong> distributed rows
            </span>
            <span
              style={{
                fontSize: '10px',
                padding: '1px 6px',
                borderRadius: '4px',
                background: 'rgba(56, 189, 248, 0.08)',
                color: '#38bdf8',
                border: '1px solid rgba(56, 189, 248, 0.2)',
                fontWeight: 600
              }}
            >
              {contributors.length} Parties Active
            </span>
          </div>

          {/* Standard Shadcn Pagination */}
          {filteredResults.length > 0 && (
            <ShadcnPagination
              idPrefix="eq-pagination"
              totalCount={filteredResults.length}
              pageSize={pageSize}
              currentPage={currentPage}
              onPageChange={(p) => setCurrentPage(p)}
              onPageSizeChange={(sz) => {
                setPageSize(sz);
                setCurrentPage(1);
              }}
              pageSizeOptions={[25, 50, 100, 200]}
              onFocusTableFirstRow={() => {
                if (paginatedResults.length > 0) setSelectedRowId(paginatedResults[0].id);
              }}
              onFocusTableLastRow={() => {
                if (paginatedResults.length > 0) setSelectedRowId(paginatedResults[paginatedResults.length - 1].id);
              }}
              style={{ padding: 0, border: 'none', background: 'transparent' }}
            />
          )}
        </div>
      </div>
    </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 5. PROFESSIONAL PRINT / EXPORT MODAL (INDUSTRIAL EQUATION REPORT)   */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {isPrintModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(8px)',
            zIndex: 999999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div
            style={{
              width: '900px',
              maxWidth: '96vw',
              maxHeight: '92vh',
              background: '#18181b',
              border: '1px solid #27272a',
              borderRadius: '10px',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 24px 64px rgba(0, 0, 0, 0.9)',
              overflow: 'hidden'
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 18px',
                borderBottom: '1px solid #27272a',
                background: '#18181b'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Printer size={18} style={{ color: '#38bdf8' }} />
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#f4f4f5' }}>
                    Multi-Party Goods Distribution Report
                  </div>
                  <div style={{ fontSize: '11px', color: '#71717a' }}>
                    Bill #{loadedBillToken || selectedBillId} • {loadedBillParty} • Date: {loadedBillDate}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Tooltip content="Send document to PyQt6 native print engine / dialog" side="bottom">
                  <button
                    type="button"
                    className="mac-btn"
                    onClick={handleTriggerPrint}
                    disabled={isDirectPrinting}
                    style={{
                      background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                      color: '#ffffff',
                      fontWeight: 600,
                      fontSize: '11.5px',
                      height: '28px',
                      padding: '0 12px',
                      borderRadius: '5px',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: isDirectPrinting ? 'wait' : 'pointer'
                    }}
                  >
                    <Printer size={13} />
                    <span>{isDirectPrinting ? 'Spooling...' : 'Print Report'}</span>
                  </button>
                </Tooltip>

                <Tooltip content="Close print preview" side="bottom">
                  <button
                    type="button"
                    className="mac-btn"
                    onClick={() => setIsPrintModalOpen(false)}
                    style={{
                      height: '28px',
                      width: '28px',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#a1a1aa'
                    }}
                  >
                    <X size={15} />
                  </button>
                </Tooltip>
              </div>
            </div>

            {/* Printable Document Preview Area */}
            <div
              id="printable-equation-area"
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '24px',
                background: '#ffffff',
                color: '#000000',
                fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
              }}
            >
              {/* Report Header */}
              <div style={{ textAlign: 'center', borderBottom: '2px solid #000000', paddingBottom: '12px', marginBottom: '16px' }}>
                <div style={{ fontSize: '20px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  MULTI-PARTY GOODS DISTRIBUTION & EQUATION REPORT
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '12px', fontWeight: 600 }}>
                  <span>SOURCE BILL: #{loadedBillToken || selectedBillId}</span>
                  <span>DATE: {loadedBillDate}</span>
                  <span>ORIGINAL PARTY: {loadedBillParty}</span>
                </div>
              </div>

              {/* Grouped by Party Blocks */}
              {contributors.map((contrib) => {
                const partyRows = results.filter((r) => r.partyName === contrib.name);
                if (partyRows.length === 0) return null;

                const shareInfo = contribShares.find((cs) => cs.id === contrib.id || cs.name === contrib.name);
                const partyPct = shareInfo ? shareInfo.sharePct * 100 : (totalPaidSum > 0 ? (Number(contrib.paidAmount || 0) / totalPaidSum) * 100 : 0);
                const paidAmtDisplay = shareInfo ? shareInfo.effectivePaid : (Number(contrib.paidAmount) || 0);
                const partySubtotal = partyRows.reduce((s, r) => s + r.totalGst, 0);

                return (
                  <div key={contrib.id} style={{ marginBottom: '20px' }}>
                    {/* Party Header Row */}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: '#f1f5f9',
                        borderLeft: '4px solid #1e40af',
                        padding: '6px 10px',
                        marginBottom: '6px',
                        fontWeight: 700,
                        fontSize: '13px'
                      }}
                    >
                      <span style={{ color: '#1e40af' }}>
                        PARTY: {contrib.name} ({partyPct.toFixed(1)}%)
                      </span>
                      <span>
                        TOTAL PAID: {formatINR(paidAmtDisplay)}
                      </span>
                    </div>

                    {/* Table for Party */}
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px', marginBottom: '6px' }}>
                      <thead>
                        <tr style={{ background: '#000000', color: '#ffffff' }}>
                          <th style={{ padding: '6px 8px', textAlign: 'left' }}>ITEM NAME</th>
                          <th style={{ padding: '6px 8px', textAlign: 'right', width: '70px' }}>PCS</th>
                          <th style={{ padding: '6px 8px', textAlign: 'right', width: '65px' }}>BOXES</th>
                          <th style={{ padding: '6px 8px', textAlign: 'center', width: '65px' }}>MULT</th>
                          <th style={{ padding: '6px 8px', textAlign: 'right', width: '90px' }}>BILL QTY</th>
                          <th style={{ padding: '6px 8px', textAlign: 'right', width: '75px' }}>PRICE</th>
                          <th style={{ padding: '6px 8px', textAlign: 'right', width: '75px' }}>WEIGHT</th>
                          <th style={{ padding: '6px 8px', textAlign: 'right', width: '100px' }}>TOTAL (+18%)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {partyRows.map((r, i) => (
                          <tr key={r.id} style={{ borderBottom: '1px solid #e2e8f0', background: i % 2 === 0 ? '#f8fafc' : '#ffffff' }}>
                            <td style={{ padding: '5px 8px', fontWeight: 600 }}>{r.itemName}</td>
                            <td style={{ padding: '5px 8px', textAlign: 'right' }}>{r.pcsQty}</td>
                            <td style={{ padding: '5px 8px', textAlign: 'right' }}>{r.boxes}</td>
                            <td style={{ padding: '5px 8px', textAlign: 'center' }}>{r.mult}</td>
                            <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 700 }}>{Math.round(r.billQtyShare)}</td>
                            <td style={{ padding: '5px 8px', textAlign: 'right' }}>₹{r.price.toFixed(2)}</td>
                            <td style={{ padding: '5px 8px', textAlign: 'right' }}>{r.weightKg.toFixed(2)}</td>
                            <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 700 }}>{formatINR(r.totalGst)}</td>
                          </tr>
                        ))}
                        {/* Party Subtotal */}
                        <tr style={{ background: '#f1f5f9', fontWeight: 700, borderTop: '2px solid #000000' }}>
                          <td colSpan={7} style={{ padding: '6px 8px', textAlign: 'right' }}>
                            SUBTOTAL FOR {contrib.name}:
                          </td>
                          <td style={{ padding: '6px 8px', textAlign: 'right' }}>
                            {formatINR(partySubtotal)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                );
              })}

              {/* Grand Total Footer */}
              <div
                style={{
                  borderTop: '3px double #000000',
                  paddingTop: '10px',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '30px',
                  fontSize: '14px',
                  fontWeight: 900
                }}
              >
                <span>GRAND COMBINED TOTAL (+18% GST):</span>
                <span style={{ color: '#b91c1c' }}>{formatINR(grandSummary.totalGstVal)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 6. APPLE-STYLE ADD CONTRIBUTING PARTY MODAL                         */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {isAddPartyModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(10px)',
            zIndex: 999999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsAddPartyModalOpen(false);
          }}
        >
          <div
            style={{
              width: '460px',
              maxWidth: '94vw',
              background: 'rgba(24, 24, 27, 0.95)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '12px',
              boxShadow: '0 24px 64px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.05)',
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
                padding: '14px 16px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                background: 'rgba(39, 39, 42, 0.5)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '8px',
                    background: 'rgba(56, 189, 248, 0.15)',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#38bdf8'
                  }}
                >
                  <UserPlus size={16} />
                </div>
                <div>
                  <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#f4f4f5' }}>
                    Add Contributing Party
                  </div>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                    Bill #{loadedBillToken || selectedBillId} • Gross Total: {formatINR(loadedBillTotal)}
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="mac-btn"
                onClick={() => setIsAddPartyModalOpen(false)}
                style={{
                  width: '26px',
                  height: '26px',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#a1a1aa'
                }}
              >
                <X size={14} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Unallocated Balance Banner */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  background: 'rgba(56, 189, 248, 0.08)',
                  border: '1px solid rgba(56, 189, 248, 0.2)',
                  borderRadius: '7px',
                  fontSize: '11.5px'
                }}
              >
                <span style={{ color: '#94a3b8' }}>Unallocated Bill Balance:</span>
                <strong style={{ color: '#38bdf8', fontFamily: "'JetBrains Mono', monospace", fontSize: '12.5px' }}>
                  {formatINR(unallocatedAmount)}
                </strong>
              </div>

              {/* Field 1: Party Name */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8' }}>
                  PARTY NAME *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    autoFocus
                    placeholder="Enter or select party name..."
                    value={modalPartyName}
                    onChange={(e) => {
                      setModalPartyName(e.target.value);
                      setModalPartySuggestionsOpen(true);
                    }}
                    onFocus={() => setModalPartySuggestionsOpen(true)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const amountInput = document.getElementById('modal-party-amount-input');
                        if (amountInput) amountInput.focus();
                      }
                    }}
                    style={{
                      width: '100%',
                      height: '32px',
                      background: 'rgba(0, 0, 0, 0.5)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '6px',
                      padding: '0 10px',
                      color: '#f4f4f5',
                      fontSize: '12px',
                      fontWeight: 600,
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />

                  {/* Autocomplete Dropdown */}
                  {modalPartySuggestionsOpen && modalPartyName.trim() && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '36px',
                        left: 0,
                        right: 0,
                        maxHeight: '140px',
                        overflowY: 'auto',
                        background: '#18181b',
                        border: '1px solid #3f3f46',
                        borderRadius: '6px',
                        zIndex: 100,
                        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.8)',
                        padding: '4px'
                      }}
                    >
                      {parties
                        .filter((p) => p.name.toLowerCase().includes(modalPartyName.toLowerCase()))
                        .slice(0, 8)
                        .map((p) => (
                          <div
                            key={p.id}
                            onClick={() => {
                              setModalPartyName(p.name);
                              setModalPartySuggestionsOpen(false);
                              const amountInput = document.getElementById('modal-party-amount-input');
                              if (amountInput) amountInput.focus();
                            }}
                            style={{
                              padding: '6px 10px',
                              fontSize: '12px',
                              color: '#f4f4f5',
                              cursor: 'pointer',
                              borderRadius: '4px',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}
                            onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.background = '#27272a')}
                            onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.background = 'transparent')}
                          >
                            <span>{p.name}</span>
                            {p.station && (
                              <span style={{ fontSize: '10px', color: '#71717a' }}>{p.station}</span>
                            )}
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Field 2 & 3: Amount in Bill (₹) and Share Percentage (%) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '10px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8' }}>
                    AMOUNT IN THIS BILL (₹)
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span
                      style={{
                        position: 'absolute',
                        left: '9px',
                        top: '7px',
                        fontSize: '12px',
                        fontWeight: 700,
                        color: '#71717a'
                      }}
                    >
                      ₹
                    </span>
                    <input
                      id="modal-party-amount-input"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={modalPartyAmount !== '' ? modalPartyAmount : ''}
                      onChange={(e) => {
                        const val = e.target.value === '' ? '' : parseFloat(e.target.value) || 0;
                        setModalPartyAmount(val);
                        if (loadedBillTotal > 0 && typeof val === 'number') {
                          setModalPartyPercent(Math.round(((val / loadedBillTotal) * 100) * 10) / 10);
                        } else {
                          setModalPartyPercent('');
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleConfirmAddPartyModal();
                        }
                      }}
                      style={{
                        width: '100%',
                        height: '32px',
                        background: 'rgba(0, 0, 0, 0.5)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: '6px',
                        paddingLeft: '22px',
                        paddingRight: '8px',
                        color: '#34d399',
                        fontSize: '12px',
                        fontWeight: 700,
                        fontFamily: "'JetBrains Mono', monospace",
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8' }}>
                    SHARE (%)
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="0.0"
                      value={modalPartyPercent !== '' ? modalPartyPercent : ''}
                      onChange={(e) => {
                        const pct = e.target.value === '' ? '' : parseFloat(e.target.value) || 0;
                        setModalPartyPercent(pct);
                        if (loadedBillTotal > 0 && typeof pct === 'number') {
                          setModalPartyAmount(Math.round(((pct / 100) * loadedBillTotal) * 100) / 100);
                        } else {
                          setModalPartyAmount('');
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleConfirmAddPartyModal();
                        }
                      }}
                      style={{
                        width: '100%',
                        height: '32px',
                        background: 'rgba(0, 0, 0, 0.5)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: '6px',
                        paddingLeft: '10px',
                        paddingRight: '22px',
                        color: '#c084fc',
                        fontSize: '12px',
                        fontWeight: 700,
                        fontFamily: "'JetBrains Mono', monospace",
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                    <span
                      style={{
                        position: 'absolute',
                        right: '9px',
                        top: '7px',
                        fontSize: '12px',
                        fontWeight: 700,
                        color: '#71717a'
                      }}
                    >
                      %
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '10.5px', color: '#71717a' }}>Presets:</span>
                {[10, 25, 33.33, 50].map((p) => (
                  <button
                    key={p}
                    type="button"
                    className="mac-btn"
                    onClick={() => {
                      setModalPartyPercent(p);
                      if (loadedBillTotal > 0) {
                        setModalPartyAmount(Math.round(((p / 100) * loadedBillTotal) * 100) / 100);
                      }
                    }}
                    style={{ height: '22px', padding: '0 7px', fontSize: '10.5px', fontWeight: 600 }}
                  >
                    {p}%
                  </button>
                ))}
                {unallocatedAmount > 0 && (
                  <button
                    type="button"
                    className="mac-btn"
                    onClick={() => {
                      setModalPartyAmount(unallocatedAmount);
                      if (loadedBillTotal > 0) {
                        setModalPartyPercent(Math.round(((unallocatedAmount / loadedBillTotal) * 100) * 10) / 10);
                      }
                    }}
                    style={{
                      height: '22px',
                      padding: '0 8px',
                      fontSize: '10.5px',
                      fontWeight: 600,
                      color: '#38bdf8',
                      borderColor: 'rgba(56, 189, 248, 0.3)'
                    }}
                  >
                    Remaining ({formatINR(unallocatedAmount)})
                  </button>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                padding: '12px 16px',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                background: 'rgba(24, 24, 27, 0.6)',
                gap: '8px'
              }}
            >
              <button
                type="button"
                className="mac-btn"
                onClick={() => setIsAddPartyModalOpen(false)}
                style={{ height: '28px', padding: '0 12px', fontSize: '11.5px' }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="mac-btn"
                onClick={handleConfirmAddPartyModal}
                style={{
                  height: '28px',
                  padding: '0 14px',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                  color: '#ffffff',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                <Plus size={13} />
                <span>Add to Distribution</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* FLOATING BILL UI STYLE PARTY SEARCH DROPDOWN (PORTAL TO BODY)       */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {partyDropdownOpenFor && dropdownPos && createPortal(
        <div
          id="equation-party-dropdown"
          style={{
            position: 'fixed',
            top: `${dropdownPos.top}px`,
            left: `${dropdownPos.left}px`,
            width: `${dropdownPos.width}px`,
            maxHeight: '250px',
            overflowY: 'auto',
            background: 'rgba(24, 24, 27, 0.98)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid #3f3f46',
            borderRadius: '8px',
            zIndex: 99999999,
            boxShadow: '0 16px 40px rgba(0, 0, 0, 0.9)',
            padding: '5px',
            fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
          }}
          onMouseDown={(e) => {
            // Prevent input blur before click event fires
            e.preventDefault();
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '4px 8px',
              borderBottom: '1px solid #27272a',
              color: '#a1a1aa',
              fontSize: '10.5px',
              fontWeight: 700,
              letterSpacing: '0.4px'
            }}
          >
            <span>SUGGESTED PARTIES ({filteredPartySuggestions.length})</span>
            <span
              style={{ cursor: 'pointer', color: '#ef4444', fontSize: '11px', padding: '1px 5px', borderRadius: '4px' }}
              onClick={() => setPartyDropdownOpenFor(null)}
            >
              ✕ Close
            </span>
          </div>

          <div style={{ marginTop: '4px' }}>
            {filteredPartySuggestions.length === 0 && !partyFilterText.trim() && (
              <div style={{ padding: '10px 8px', fontSize: '11.5px', color: '#71717a', textAlign: 'center' }}>
                No parties available in database
              </div>
            )}

            {filteredPartySuggestions.map((p, idx) => {
              const isFocused = focusedSuggestionIndex === idx;
              const currentContributor = contributors.find((c) => c.id === partyDropdownOpenFor);
              const isCurrent = currentContributor && currentContributor.name.toLowerCase() === p.name.toLowerCase();

              return (
                <div
                  key={p.id || idx}
                  onClick={() => {
                    if (partyDropdownOpenFor) {
                      macAudio.playClick();
                      handleUpdateContributor(partyDropdownOpenFor, 'name', p.name);
                      setPartyDropdownOpenFor(null);
                    }
                  }}
                  style={{
                    padding: '6px 10px',
                    fontSize: '12px',
                    color: '#f4f4f5',
                    cursor: 'pointer',
                    borderRadius: '5px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: isFocused ? 'rgba(59, 130, 246, 0.25)' : isCurrent ? 'rgba(39, 39, 42, 0.7)' : 'transparent',
                    border: isFocused ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid transparent',
                    marginBottom: '2px',
                    transition: 'background 0.12s ease'
                  }}
                  onMouseEnter={() => setFocusedSuggestionIndex(idx)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
                    <span style={{ fontWeight: 600, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {p.name}
                    </span>
                    {isCurrent && <Check size={12} color="#34d399" />}
                  </div>
                  {(p.station || p.district) && (
                    <span
                      style={{
                        fontSize: '10px',
                        color: '#a1a1aa',
                        background: '#27272a',
                        padding: '1px 5px',
                        borderRadius: '3px',
                        whiteSpace: 'nowrap',
                        marginLeft: '8px'
                      }}
                    >
                      {p.station || p.district}
                    </span>
                  )}
                </div>
              );
            })}

            {/* If Typed Party is New (not matching any existing) */}
            {partyFilterText.trim() &&
              !allPartyNames.some((p) => p.name.toLowerCase() === partyFilterText.trim().toLowerCase()) && (
                <div
                  onClick={() => {
                    if (partyDropdownOpenFor) {
                      macAudio.playClick();
                      handleUpdateContributor(partyDropdownOpenFor, 'name', partyFilterText.trim());
                      setPartyDropdownOpenFor(null);
                    }
                  }}
                  style={{
                    padding: '7px 10px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    borderRadius: '5px',
                    background: 'rgba(59, 130, 246, 0.15)',
                    color: '#38bdf8',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginTop: '4px',
                    border: '1px dashed rgba(56, 189, 248, 0.4)'
                  }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.background = 'rgba(59, 130, 246, 0.3)')}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.background = 'rgba(59, 130, 246, 0.15)')}
                >
                  <Plus size={13} />
                  <span>Use "{partyFilterText.trim()}" as Party Name</span>
                </div>
              )}
          </div>
        </div>,
        document.body
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* FLOATING BILL SEARCH DROPDOWN (PORTAL TO BODY)                      */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {billDropdownOpen && billDropdownPos && createPortal(
        <div
          id="equation-bill-dropdown"
          style={{
            position: 'fixed',
            top: `${billDropdownPos.top}px`,
            left: `${billDropdownPos.left}px`,
            width: `${billDropdownPos.width}px`,
            maxHeight: '260px',
            overflowY: 'auto',
            background: 'rgba(24, 24, 27, 0.98)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid #3f3f46',
            borderRadius: '8px',
            zIndex: 99999999,
            boxShadow: '0 16px 40px rgba(0, 0, 0, 0.9)',
            padding: '5px',
            fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
          }}
          onMouseDown={(e) => {
            // Prevent input blur before click event fires
            e.preventDefault();
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '4px 8px',
              borderBottom: '1px solid #27272a',
              color: '#a1a1aa',
              fontSize: '10.5px',
              fontWeight: 700,
              letterSpacing: '0.4px'
            }}
          >
            <span>SELECT BILL TO LOAD ({filteredBillSuggestions.length})</span>
            <span
              style={{ cursor: 'pointer', color: '#ef4444', fontSize: '11px', padding: '1px 5px', borderRadius: '4px' }}
              onClick={() => setBillDropdownOpen(false)}
            >
              ✕ Close
            </span>
          </div>

          <div style={{ marginTop: '4px' }}>
            {filteredBillSuggestions.length === 0 ? (
              <div style={{ padding: '10px 8px', fontSize: '11.5px', color: '#71717a', textAlign: 'center' }}>
                No bills found matching search
              </div>
            ) : (
              filteredBillSuggestions.map((b) => {
                const isSelected = selectedBillId === b.id;
                return (
                  <div
                    key={b.id}
                    onClick={() => {
                      macAudio.playClick();
                      setBillDropdownOpen(false);
                      loadBillData(b.id);
                    }}
                    style={{
                      padding: '7px 10px',
                      fontSize: '12px',
                      color: '#f4f4f5',
                      cursor: 'pointer',
                      borderRadius: '5px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: isSelected ? 'rgba(59, 130, 246, 0.25)' : 'transparent',
                      border: isSelected ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid transparent',
                      marginBottom: '2px',
                      transition: 'background 0.12s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = '#27272a';
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = 'transparent';
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontWeight: 700, color: '#38bdf8' }}>#{b.token || b.id}</span>
                        <span style={{ fontWeight: 600 }}>{b.party || 'Standard Account'}</span>
                        {isSelected && <Check size={12} color="#34d399" />}
                      </div>
                      <div style={{ fontSize: '10.5px', color: '#71717a' }}>{b.date || '—'}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#34d399' }}>
                        {formatINR(Number(b.total) || 0)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

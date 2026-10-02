import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Search,
  Calendar,
  Plus,
  Trash2,
  Printer,
  FileSpreadsheet,
  RotateCcw,
  Receipt,
  ArrowDownLeft,
  ArrowUpRight,
  Wallet,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ExternalLink,
  Building,
  AlertTriangle
} from 'lucide-react';
import {
  Button as ShadcnButton,
  Input as ShadcnInput,
  Badge as ShadcnBadge,
  Card as ShadcnCard,
  Label as ShadcnLabel,
  DatePicker as ShadcnDatePicker,
  Pagination as ShadcnPagination
} from './ui/shadcn';
import { useTableKeyboardNavigation } from '../hooks/useTableKeyboardNavigation';
import { macAudio } from '../utils/macAudio';
import { downloadCSV } from '../utils/exportCsv';
import { ExcelCsvActions, type CsvColumnDef } from './common/ExcelCsvActions';
import { useDatabase } from '../context/DatabaseContext';

export interface LedgerEntry {
  id: string;
  rawId: string | number;
  date: string;
  type: string; // 'SALE BILL' | 'ORDER' | 'SALE RETURN' | 'RECEIPT' | 'ADJUSTMENT'
  voucher: string;
  particulars: string;
  debit: number;
  credit: number;
  balance: number;
  canDelete?: boolean;
}

interface Props {
  onBackToBill?: () => void;
  onLoadBillToEditor?: (billId: string) => void;
}

const DB_API_URL = 'http://127.0.0.1:5006';
const PRINT_API_URL = 'http://127.0.0.1:5005';

export const LedgerTabView: React.FC<Props> = ({ onBackToBill, onLoadBillToEditor }) => {
  const { parties: contextParties, bills: contextBills } = useDatabase();

  // State
  const [partiesList, setPartiesList] = useState<string[]>([]);
  const [selectedParty, setSelectedParty] = useState<string>('');
  const [partySearchQuery, setPartySearchQuery] = useState<string>('');
  const [isPartyDropdownOpen, setIsPartyDropdownOpen] = useState<boolean>(false);
  const [highlightedPartyIndex, setHighlightedPartyIndex] = useState<number>(-1);
  const partyDropdownRef = useRef<HTMLDivElement>(null);
  const partyListDropdownRef = useRef<HTMLDivElement>(null);

  // Date filters
  const [dateFrom, setDateFrom] = useState<string>(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 1);
    return d.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState<string>(() => new Date().toISOString().split('T')[0]);

  // Ledger entries and state
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [openingBalance, setOpeningBalance] = useState<number>(0);
  const [partyInfo, setPartyInfo] = useState<{
    name?: string;
    phone?: string;
    station?: string;
    district?: string;
    state?: string;
    gstin?: string;
  } | null>(null);

  // In-table search & quick type filter
  const [tableSearchQuery, setTableSearchQuery] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'SALE BILL' | 'RECEIPT' | 'SALE RETURN'>('ALL');

  // Pagination state
  const [ledgerPage, setLedgerPage] = useState<number>(1);
  const [ledgerPageSize, setLedgerPageSize] = useState<number>(50);

  const [totalDebit, setTotalDebit] = useState<number>(0);
  const [totalCredit, setTotalCredit] = useState<number>(0);
  const [netBalance, setNetBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);

  const ledgerTableWrapperRef = useRef<HTMLDivElement>(null);

  // Modals
  const [isAddReceiptOpen, setIsAddReceiptOpen] = useState<boolean>(false);
  const [receiptAmount, setReceiptAmount] = useState<string>('');
  const [receiptDate, setReceiptDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [receiptRemarks, setReceiptRemarks] = useState<string>('Payment Received');
  const [isReceiptSaving, setIsReceiptSaving] = useState<boolean>(false);

  const [receiptToDelete, setReceiptToDelete] = useState<LedgerEntry | null>(null);
  const [isDeletingReceipt, setIsDeletingReceipt] = useState<boolean>(false);

  // Print modal
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);
  const [printPageNum, setPrintPageNum] = useState<number>(0);
  const [printTotalPages, setPrintTotalPages] = useState<number>(1);
  const [printPreviewImg, setPrintPreviewImg] = useState<string | null>(null);
  const [isRenderingPrint, setIsRenderingPrint] = useState<boolean>(false);
  const [availablePrinters, setAvailablePrinters] = useState<string[]>([]);
  const [selectedPrinter, setSelectedPrinter] = useState<string>('');
  const [isDirectPrinting, setIsDirectPrinting] = useState<boolean>(false);
  const [printStatusMsg, setPrintStatusMsg] = useState<string | null>(null);

  // Reset page when filter or party changes
  useEffect(() => {
    setLedgerPage(1);
  }, [selectedParty, dateFrom, dateTo, tableSearchQuery, typeFilter]);

  // Filtered displayed entries based on in-table search & type filter
  const displayedEntries = useMemo(() => {
    let result = entries;

    if (typeFilter !== 'ALL') {
      result = result.filter(e => e.type === typeFilter || e.type === 'OPENING BALANCE');
    }

    const q = tableSearchQuery.trim().toLowerCase();
    if (q) {
      result = result.filter(e => 
        (e.voucher || '').toLowerCase().includes(q) ||
        (e.particulars || '').toLowerCase().includes(q) ||
        (e.type || '').toLowerCase().includes(q) ||
        (e.date || '').includes(q) ||
        String(e.debit).includes(q) ||
        String(e.credit).includes(q) ||
        String(e.balance).includes(q)
      );
    }

    return result;
  }, [entries, typeFilter, tableSearchQuery]);

  const totalLedgerPages = Math.max(1, Math.ceil(displayedEntries.length / ledgerPageSize));

  // Current page entries slice
  const paginatedEntries = useMemo(() => {
    if (displayedEntries.length <= ledgerPageSize) return displayedEntries;
    const start = (ledgerPage - 1) * ledgerPageSize;
    return displayedEntries.slice(start, start + ledgerPageSize);
  }, [displayedEntries, ledgerPage, ledgerPageSize]);

  // Load parties on mount
  useEffect(() => {
    const fetchParties = async () => {
      try {
        const res = await fetch(`${DB_API_URL}/api/db/parties`);
        if (res.ok) {
          const data = await res.json();
          const names = Array.from(new Set(data.map((p: any) => p.name || p.party_name))).filter(Boolean) as string[];
          names.sort((a, b) => a.localeCompare(b));
          setPartiesList(names);
          if (names.length > 0 && !selectedParty) {
            setSelectedParty(names[0]);
            setPartySearchQuery(names[0]);
          }
        } else {
          // fallback to context
          const names = Array.from(new Set(contextParties.map(p => p.name))).filter(Boolean);
          names.sort((a, b) => a.localeCompare(b));
          setPartiesList(names);
          if (names.length > 0 && !selectedParty) {
            setSelectedParty(names[0]);
            setPartySearchQuery(names[0]);
          }
        }
      } catch {
        const names = Array.from(new Set(contextParties.map(p => p.name))).filter(Boolean);
        names.sort((a, b) => a.localeCompare(b));
        setPartiesList(names);
        if (names.length > 0 && !selectedParty) {
          setSelectedParty(names[0]);
          setPartySearchQuery(names[0]);
        }
      }
    };
    fetchParties();
  }, [contextParties]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (partyDropdownRef.current && !partyDropdownRef.current.contains(e.target as Node)) {
        setIsPartyDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch ledger data
  const loadLedger = useCallback(async (partyToLoad?: string) => {
    const targetParty = (partyToLoad !== undefined ? partyToLoad : selectedParty).trim();
    if (!targetParty) return;

    setIsLoading(true);
    try {
      const url = `${DB_API_URL}/api/db/ledger?party=${encodeURIComponent(targetParty)}&dateFrom=${dateFrom}&dateTo=${dateTo}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const list: LedgerEntry[] = Array.isArray(data) ? data : (data.entries || []);
        setEntries(list);
        setOpeningBalance(data.openingBalance !== undefined ? data.openingBalance : 0);
        if (data.partyInfo && Object.keys(data.partyInfo).length > 0) {
          setPartyInfo(data.partyInfo);
        } else {
          const found = contextParties.find(p => p.name.toLowerCase() === targetParty.toLowerCase());
          if (found) {
            setPartyInfo({
              name: found.name,
              phone: found.phone || '',
              station: found.station || '',
              district: found.district || '',
              state: found.state || '',
              gstin: found.gstin || ''
            });
          } else {
            setPartyInfo({ name: targetParty });
          }
        }
        setTotalDebit(data.totalDebit !== undefined ? data.totalDebit : list.filter(e => e.type !== 'OPENING BALANCE').reduce((s: number, e: any) => s + (e.debit || 0), 0));
        setTotalCredit(data.totalCredit !== undefined ? data.totalCredit : list.filter(e => e.type !== 'OPENING BALANCE').reduce((s: number, e: any) => s + (e.credit || 0), 0));
        setNetBalance(data.netBalance !== undefined ? data.netBalance : (list.length > 0 ? list[list.length - 1].balance : 0));
        if (list.length > 0) {
          setSelectedRowId(list[0].id);
        } else {
          setSelectedRowId(null);
        }
      } else {
        calculateFallbackLedger(targetParty);
      }
    } catch {
      calculateFallbackLedger(targetParty);
    } finally {
      setIsLoading(false);
    }
  }, [selectedParty, dateFrom, dateTo, contextBills, contextParties]);

  // Fallback calculation if server offline
  const calculateFallbackLedger = (party: string) => {
    const partyLower = party.toLowerCase();
    const partyBills = contextBills.filter(b => (b.party || '').toLowerCase() === partyLower);
    const foundParty = contextParties.find(p => p.name.toLowerCase() === partyLower);

    if (foundParty) {
      setPartyInfo({
        name: foundParty.name,
        phone: foundParty.phone || '',
        station: foundParty.station || '',
        district: foundParty.district || '',
        state: foundParty.state || '',
        gstin: foundParty.gstin || ''
      });
    } else {
      setPartyInfo({ name: party });
    }

    // 1. Calculate opening balance prior to dateFrom
    let openBal = 0;
    if (dateFrom) {
      for (const b of partyBills) {
        const bDate = (b.date || '').slice(0, 10);
        if (bDate < dateFrom) {
          const tot = Math.round((Number(b.total || 0) + Number.EPSILON) * 100) / 100;
          const isReturn = (b.docType || '').toUpperCase().includes('RETURN');
          if (isReturn) {
            openBal = Math.round((openBal - tot + Number.EPSILON) * 100) / 100;
          } else {
            openBal = Math.round((openBal + tot + Number.EPSILON) * 100) / 100;
          }
        }
      }
    }
    setOpeningBalance(openBal);

    // 2. Bills in range
    const inRangeBills = partyBills.filter(b => {
      const bDate = (b.date || '').slice(0, 10);
      if (dateFrom && bDate < dateFrom) return false;
      if (dateTo && bDate > dateTo) return false;
      return true;
    });

    inRangeBills.sort((a, b) => {
      const cmp = (a.date || '').localeCompare(b.date || '');
      if (cmp !== 0) return cmp;
      return String(a.token || a.id).localeCompare(String(b.token || b.id));
    });

    const list: LedgerEntry[] = [];
    if (dateFrom) {
      list.push({
        id: 'opening_bf',
        rawId: 0,
        date: dateFrom,
        type: 'OPENING BALANCE',
        voucher: 'B/F',
        particulars: 'Opening Balance (Brought Forward)',
        debit: openBal > 0 ? openBal : 0,
        credit: openBal < 0 ? Math.abs(openBal) : 0,
        balance: openBal,
        canDelete: false
      });
    }

    let running = openBal;
    let drSum = 0;
    let crSum = 0;

    for (const b of inRangeBills) {
      const isReturn = (b.docType || '').toUpperCase().includes('RETURN');
      const isOrder = (b.docType || '').toUpperCase().includes('ORDER');
      const tot = Math.round((Number(b.total || 0) + Number.EPSILON) * 100) / 100;
      const bDate = (b.date || '').slice(0, 10);

      if (isReturn) {
        running = Math.round((running - tot + Number.EPSILON) * 100) / 100;
        crSum = Math.round((crSum + tot + Number.EPSILON) * 100) / 100;
        list.push({
          id: `b_${b.id}`,
          rawId: b.id,
          date: bDate,
          type: 'SALE RETURN',
          voucher: `R-${b.token}`,
          particulars: 'Sale Return',
          debit: 0,
          credit: tot,
          balance: running,
          canDelete: false
        });
      } else {
        running = Math.round((running + tot + Number.EPSILON) * 100) / 100;
        drSum = Math.round((drSum + tot + Number.EPSILON) * 100) / 100;
        list.push({
          id: `b_${b.id}`,
          rawId: b.id,
          date: bDate,
          type: isOrder ? 'ORDER' : 'SALE BILL',
          voucher: isOrder ? `O-${b.token}` : `B-${b.token}`,
          particulars: isOrder ? 'Order Estimate' : 'Sale Bill',
          debit: tot,
          credit: 0,
          balance: running,
          canDelete: false
        });
      }
    }

    setEntries(list);
    setTotalDebit(drSum);
    setTotalCredit(crSum);
    setNetBalance(running);
    if (list.length > 0) setSelectedRowId(list[0].id);
  };

  // Auto load when party changes
  useEffect(() => {
    if (selectedParty) {
      loadLedger(selectedParty);
    }
  }, [selectedParty]);

  // Robust party selection handler with immediate execution
  const handleSelectParty = useCallback((partyName: string) => {
    const trimmed = (partyName || '').trim();
    if (!trimmed) return;
    macAudio.playClick();
    setSelectedParty(trimmed);
    setPartySearchQuery(trimmed);
    setIsPartyDropdownOpen(false);
    setHighlightedPartyIndex(-1);
    loadLedger(trimmed);
  }, [loadLedger]);

  // Clear date filters
  const handleClearFilter = () => {
    macAudio.playClick();
    const d = new Date();
    d.setFullYear(d.getFullYear() - 1);
    setDateFrom(d.toISOString().split('T')[0]);
    setDateTo(new Date().toISOString().split('T')[0]);
    setTimeout(() => loadLedger(), 50);
  };

  // Add Receipt Save
  const handleSaveReceipt = async () => {
    if (!selectedParty) {
      alert('Pehle party select karein.');
      return;
    }
    const amt = parseFloat(receiptAmount.replace(/,/g, '').trim());
    if (isNaN(amt) || amt <= 0) {
      alert('Kripya valid amount darj karein.');
      return;
    }

    setIsReceiptSaving(true);
    try {
      const res = await fetch(`${DB_API_URL}/api/db/receipts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          party: selectedParty,
          amount: amt,
          receipt_date: receiptDate,
          remarks: receiptRemarks.trim() || 'Payment Received'
        })
      });
      if (res.ok) {
        macAudio.playPop();
        setIsAddReceiptOpen(false);
        setReceiptAmount('');
        setReceiptRemarks('Payment Received');
        loadLedger();
      } else {
        const err = await res.json();
        alert(`Receipt save nahi hui: ${err.error || 'Unknown error'}`);
      }
    } catch (e: any) {
      alert(`Server error: ${e.message}`);
    } finally {
      setIsReceiptSaving(false);
    }
  };

  // Delete Receipt
  const handleDeleteReceipt = async () => {
    if (!receiptToDelete) return;
    setIsDeletingReceipt(true);
    try {
      const res = await fetch(`${DB_API_URL}/api/db/receipts/${receiptToDelete.rawId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        macAudio.playTrash();
        setReceiptToDelete(null);
        loadLedger();
      } else {
        alert('Delete failed');
      }
    } catch (e: any) {
      alert(`Delete error: ${e.message}`);
    } finally {
      setIsDeletingReceipt(false);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    macAudio.playClick();
    if (displayedEntries.length === 0) {
      alert('Export karne ke liye koi data nahi hai.');
      return;
    }

    const headers = ['Date', 'Type', 'Voucher #', 'Particulars', 'Debit (Dr)', 'Credit (Cr)', 'Running Balance'];
    const rows = [
      [`Party: ${partyInfo?.name || selectedParty}`, `Phone: ${partyInfo?.phone || '—'}`, `GSTIN: ${partyInfo?.gstin || '—'}`, `Station: ${[partyInfo?.station, partyInfo?.district].filter(Boolean).join(', ') || '—'}`, `Period: ${dateFrom} to ${dateTo}`, `Opening Bal (B/F): ${openingBalance.toFixed(2)}`, ''],
      ...displayedEntries.map(e => [
        e.date,
        e.type,
        e.voucher,
        e.particulars,
        e.debit > 0 ? e.debit.toFixed(2) : '0.00',
        e.credit > 0 ? e.credit.toFixed(2) : '0.00',
        `${Math.abs(e.balance).toFixed(2)} ${e.balance > 0 ? 'Dr' : (e.balance < 0 ? 'Cr' : '')}`
      ]),
      [
        'TOTALS / CLOSING BALANCE',
        '',
        '',
        '',
        totalDebit.toFixed(2),
        totalCredit.toFixed(2),
        `${Math.abs(netBalance).toFixed(2)} ${netBalance > 0 ? 'Dr' : (netBalance < 0 ? 'Cr' : 'Nil')}`
      ]
    ];

    downloadCSV(`Ledger_${selectedParty.replace(/\s+/g, '_')}_${dateFrom}_to_${dateTo}.csv`, headers, rows);
  };

  // CSV Columns definition for Ledger Statement & Receipts
  const ledgerCsvColumns: CsvColumnDef<LedgerEntry>[] = useMemo(() => [
    { header: 'Date', key: 'date', sample: '2026-10-03', required: true },
    { header: 'Type', key: 'type', sample: 'RECEIPT' },
    { header: 'Voucher No', key: 'voucher', sample: 'REC-101' },
    { header: 'Particulars', key: 'particulars', sample: 'Payment Received via Bank' },
    {
      header: 'Debit (Dr)',
      key: 'debit',
      sample: 0,
      formatter: (v) => Number(v || 0) > 0 ? Number(v).toLocaleString('en-IN') : '',
      parser: (raw) => Number(String(raw).replace(/[^0-9.-]/g, '')) || 0
    },
    {
      header: 'Credit (Cr)',
      key: 'credit',
      sample: 50000,
      formatter: (v) => Number(v || 0) > 0 ? Number(v).toLocaleString('en-IN') : '',
      parser: (raw) => Number(String(raw).replace(/[^0-9.-]/g, '')) || 0
    },
    {
      header: 'Balance',
      key: 'balance',
      sample: 25000,
      formatter: (v) => Number(v || 0).toLocaleString('en-IN'),
      parser: (raw) => Number(String(raw).replace(/[^0-9.-]/g, '')) || 0
    }
  ], []);

  const handleImportLedgerReceipts = useCallback(async (imported: Partial<LedgerEntry>[]) => {
    if (!selectedParty) {
      alert('Pehle party select karein jisme receipts import karni hai.');
      return;
    }
    let count = 0;
    for (const row of imported) {
      const amt = Number(row.credit || (row as any).amount || row.debit || 0);
      if (amt <= 0) continue;
      const recDate = row.date ? String(row.date).trim() : new Date().toISOString().split('T')[0];
      const remarks = row.particulars ? String(row.particulars).trim() : 'Payment Received via CSV';

      try {
        await fetch(`${DB_API_URL}/api/db/receipts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            party: selectedParty,
            amount: amt,
            receipt_date: recDate,
            remarks: remarks
          })
        });
        count++;
      } catch (e) {
        console.error('Error importing receipt:', e);
      }
    }
    if (count > 0) {
      macAudio.playSuccess();
      loadLedger();
      alert(`${count} payment receipts successfully imported into Ledger!`);
    }
  }, [selectedParty, loadLedger]);

  // Print Preview
  const handleOpenPrintModal = async () => {
    macAudio.playClick();
    setIsPrintModalOpen(true);
    setPrintPageNum(0);
    setPrintStatusMsg(null);

    // Fetch available printers
    try {
      const statusRes = await fetch(`${PRINT_API_URL}/api/status`);
      if (statusRes.ok) {
        const sData = await statusRes.json();
        setAvailablePrinters(sData.availablePrinters || []);
        setSelectedPrinter(sData.printer || '');
      }
    } catch {}

    fetchPrintPreview(0);
  };

  const fetchPrintPreview = async (pageNum: number) => {
    setIsRenderingPrint(true);
    try {
      const payload = {
        party: selectedParty,
        partyInfo,
        openingBalance,
        dateFrom,
        dateTo,
        entries: displayedEntries,
        totalDebit,
        totalCredit,
        netBalance,
        pageNum
      };
      const res = await fetch(`${PRINT_API_URL}/api/print/ledger-render`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        setPrintPreviewImg(data.dataUrl);
        setPrintTotalPages(data.totalPages || 1);
        setPrintPageNum(data.currentPage || 0);
      } else {
        setPrintStatusMsg('Failed to render preview from native print server.');
      }
    } catch (e: any) {
      setPrintStatusMsg(`Native print service not reachable on :5005 (${e.message})`);
    } finally {
      setIsRenderingPrint(false);
    }
  };

  const handleDirectPrint = async () => {
    setIsDirectPrinting(true);
    setPrintStatusMsg('Printing in progress...');
    try {
      const payload = {
        party: selectedParty,
        partyInfo,
        openingBalance,
        dateFrom,
        dateTo,
        entries: displayedEntries,
        totalDebit,
        totalCredit,
        netBalance,
        printerName: selectedPrinter,
        showDialog: false
      };
      const res = await fetch(`${PRINT_API_URL}/api/print/ledger-direct`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        macAudio.playPop();
        setPrintStatusMsg(data.message || 'Print successful!');
        setTimeout(() => setIsPrintModalOpen(false), 1500);
      } else {
        setPrintStatusMsg(`Print error: ${data.error || data.message}`);
      }
    } catch (e: any) {
      setPrintStatusMsg(`Print server error: ${e.message}`);
    } finally {
      setIsDirectPrinting(false);
    }
  };

  const currentSelectedIndex = useMemo(() => {
    const idx = paginatedEntries.findIndex(e => e.id === selectedRowId);
    return idx >= 0 ? idx : 0;
  }, [paginatedEntries, selectedRowId]);

  // Unified Tally Keyboard Navigation on ledger rows & pagination
  const {
    handleKeyDown: handleTableKeyDown,
    handlePageChange: handleTablePageChange,
    focusTable,
    paginationIdPrefix
  } = useTableKeyboardNavigation({
    tableId: 'ledger',
    itemCount: paginatedEntries.length,
    selectedIndex: currentSelectedIndex,
    onSelectIndex: (idx) => {
      if (paginatedEntries[idx]) {
        setSelectedRowId(paginatedEntries[idx].id);
      }
    },
    isPaginated: displayedEntries.length > ledgerPageSize,
    currentPage: ledgerPage,
    totalPages: totalLedgerPages,
    onPageChange: (newPage, targetRow) => {
      setLedgerPage(newPage);
      if (targetRow) {
        setTimeout(() => focusTable(targetRow), 40);
      }
    },
    onRowSubmit: (idx) => {
      const item = paginatedEntries[idx];
      if (item && item.type !== 'RECEIPT' && item.type !== 'OPENING BALANCE' && onLoadBillToEditor && item.rawId) {
        onLoadBillToEditor(String(item.rawId));
      }
    },
    onRowDelete: (idx) => {
      const item = paginatedEntries[idx];
      if (item && item.type === 'RECEIPT') {
        setReceiptToDelete(item);
      }
    },
    tableContainerRef: ledgerTableWrapperRef
  });

  // Auto-scroll selected row into view
  useEffect(() => {
    if (selectedRowId) {
      const idx = paginatedEntries.findIndex(e => e.id === selectedRowId);
      const el = (idx >= 0 ? document.getElementById(`ledger-row-${idx}`) : null) || document.getElementById(`ledger-row-${selectedRowId}`);
      if (el) {
        el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedRowId, paginatedEntries]);

  // Filter parties for autocomplete
  const filteredParties = useMemo(() => {
    if (!partySearchQuery) return partiesList.slice(0, 50);
    const q = partySearchQuery.toLowerCase();
    return partiesList.filter(p => p.toLowerCase().includes(q)).slice(0, 50);
  }, [partiesList, partySearchQuery]);

  // Global app event listeners for Ledger
  useEffect(() => {
    const handlePrint = () => {
      handleOpenPrintModal();
    };
    const handleInsert = () => {
      setIsAddReceiptOpen(true);
    };
    const handleHomeFocus = () => {
      document.getElementById('ledger-party-search')?.focus();
    };

    window.addEventListener('app-print', handlePrint);
    window.addEventListener('app-insert-row', handleInsert);
    window.addEventListener('app-home-focus', handleHomeFocus);

    return () => {
      window.removeEventListener('app-print', handlePrint);
      window.removeEventListener('app-insert-row', handleInsert);
      window.removeEventListener('app-home-focus', handleHomeFocus);
    };
  }, [handleOpenPrintModal]);

  const selectedRow = entries.find(e => e.id === selectedRowId);

  return (
    <div
      id="ledger-wrapper"
      ref={ledgerTableWrapperRef}
      tabIndex={0}
      onKeyDown={handleTableKeyDown}
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        minHeight: 0,
        outline: 'none',
        background: '#09090b',
        color: '#f4f4f5',
        padding: '12px 16px',
        boxSizing: 'border-box',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Inter", sans-serif'
      }}
    >
      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 1. TOP HEADER & ACTION CONTROLS (ui.shadcn.com Zinc Style)         */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          background: '#18181b',
          border: '1px solid #27272a',
          borderRadius: '8px',
          padding: '10px 14px'
        }}
      >
        {/* Left: Party Selector + Date Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', flex: 1 }}>
          {/* Party Searchable Combobox */}
          <div ref={partyDropdownRef} style={{ position: 'relative', width: '280px' }}>
            <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
              <Building size={14} style={{ position: 'absolute', left: '10px', color: '#71717a', pointerEvents: 'none' }} />
              <input
                id="ledger-party-search"
                data-search-box="true"
                type="text"
                autoComplete="off"
                placeholder="Search party name..."
                value={partySearchQuery}
                onFocus={() => {
                  setIsPartyDropdownOpen(true);
                  setHighlightedPartyIndex(-1);
                }}
                onChange={(e) => {
                  setPartySearchQuery(e.target.value);
                  setIsPartyDropdownOpen(true);
                  setHighlightedPartyIndex(0);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    if (!isPartyDropdownOpen) {
                      setIsPartyDropdownOpen(true);
                      setHighlightedPartyIndex(0);
                    } else {
                      setHighlightedPartyIndex((prev) => {
                        const next = Math.min(prev + 1, filteredParties.length - 1);
                        const el = document.getElementById(`ledger-party-opt-${next}`);
                        if (el) el.scrollIntoView({ block: 'nearest' });
                        return next;
                      });
                    }
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setHighlightedPartyIndex((prev) => {
                      const next = Math.max(prev - 1, 0);
                      const el = document.getElementById(`ledger-party-opt-${next}`);
                      if (el) el.scrollIntoView({ block: 'nearest' });
                      return next;
                    });
                  } else if (e.key === 'Enter') {
                    e.preventDefault();
                    if (filteredParties.length > 0) {
                      const target = (highlightedPartyIndex >= 0 && highlightedPartyIndex < filteredParties.length)
                        ? filteredParties[highlightedPartyIndex]
                        : filteredParties[0];
                      handleSelectParty(target);
                    } else if (partySearchQuery.trim()) {
                      handleSelectParty(partySearchQuery.trim());
                    }
                  } else if (e.key === 'Escape') {
                    e.preventDefault();
                    setIsPartyDropdownOpen(false);
                  }
                }}
                style={{
                  width: '100%',
                  height: '34px',
                  background: '#09090b',
                  border: isPartyDropdownOpen ? '1px solid #38bdf8' : '1px solid #27272a',
                  borderRadius: '6px',
                  paddingLeft: '32px',
                  paddingRight: '54px',
                  color: '#f4f4f5',
                  fontSize: '13px',
                  fontWeight: 500,
                  outline: 'none',
                  boxShadow: isPartyDropdownOpen ? '0 0 0 2px rgba(56, 189, 248, 0.25)' : 'none',
                  boxSizing: 'border-box'
                }}
              />

              {/* Action Icons: Clear & Dropdown Toggle */}
              <div style={{ position: 'absolute', right: '6px', display: 'flex', alignItems: 'center', gap: '2px' }}>
                {partySearchQuery && (
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => {
                      setPartySearchQuery('');
                      setIsPartyDropdownOpen(true);
                      setHighlightedPartyIndex(-1);
                      document.getElementById('ledger-party-search')?.focus();
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#71717a',
                      cursor: 'pointer',
                      padding: '3px',
                      display: 'flex',
                      alignItems: 'center',
                      borderRadius: '4px'
                    }}
                    title="Clear search"
                  >
                    <X size={12} />
                  </button>
                )}
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => {
                    setIsPartyDropdownOpen((prev) => !prev);
                    if (!isPartyDropdownOpen) {
                      document.getElementById('ledger-party-search')?.focus();
                    }
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#71717a',
                    cursor: 'pointer',
                    padding: '3px',
                    display: 'flex',
                    alignItems: 'center',
                    borderRadius: '4px'
                  }}
                  title="Toggle party list"
                >
                  <ChevronDown
                    size={13}
                    style={{
                      transition: 'transform 0.15s ease',
                      transform: isPartyDropdownOpen ? 'rotate(180deg)' : 'none'
                    }}
                  />
                </button>
              </div>
            </div>

            {/* Dropdown List */}
            {isPartyDropdownOpen && (
              <div
                ref={partyListDropdownRef}
                style={{
                  position: 'absolute',
                  top: '38px',
                  left: 0,
                  width: '100%',
                  maxHeight: '260px',
                  overflowY: 'auto',
                  background: '#09090b',
                  border: '1px solid #27272a',
                  borderRadius: '6px',
                  boxShadow: '0 12px 32px rgba(0,0,0,0.85)',
                  zIndex: 999999
                }}
              >
                {filteredParties.length === 0 ? (
                  <div
                    style={{
                      padding: '10px 12px',
                      fontSize: '12px',
                      color: '#71717a',
                      textAlign: 'center'
                    }}
                  >
                    No parties match "{partySearchQuery}". Press Enter to search.
                  </div>
                ) : (
                  filteredParties.map((pName, idx) => {
                    const isSelected = selectedParty.toLowerCase() === pName.toLowerCase();
                    const isHighlighted = idx === highlightedPartyIndex;
                    return (
                      <div
                        id={`ledger-party-opt-${idx}`}
                        key={pName}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleSelectParty(pName);
                        }}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleSelectParty(pName);
                        }}
                        onMouseEnter={() => setHighlightedPartyIndex(idx)}
                        style={{
                          padding: '8px 12px',
                          fontSize: '12.5px',
                          color: isSelected ? '#38bdf8' : isHighlighted ? '#ffffff' : '#e4e4e7',
                          background: isHighlighted ? '#27272a' : isSelected ? 'rgba(56, 189, 248, 0.12)' : 'transparent',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          borderBottom: '1px solid #18181b',
                          userSelect: 'none'
                        }}
                      >
                        <span style={{ fontWeight: isSelected || isHighlighted ? 600 : 400 }}>{pName}</span>
                        {isSelected && <Check size={14} style={{ color: '#38bdf8' }} />}
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* Date From */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', color: '#71717a', fontWeight: 500 }}>From:</span>
            <ShadcnDatePicker
              value={dateFrom}
              onChange={(val) => setDateFrom(val)}
              size="sm"
              placeholder="From date"
            />
          </div>

          {/* Date To */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', color: '#71717a', fontWeight: 500 }}>To:</span>
            <ShadcnDatePicker
              value={dateTo}
              onChange={(val) => setDateTo(val)}
              size="sm"
              placeholder="To date"
            />
          </div>

          {/* Load / Refresh button */}
          <ShadcnButton
            variant="default"
            size="sm"
            onClick={() => {
              macAudio.playClick();
              loadLedger();
            }}
            disabled={isLoading}
          >
            <RotateCcw size={13} className={isLoading ? 'animate-spin' : ''} />
            <span>Load</span>
          </ShadcnButton>

          {/* Clear button */}
          <ShadcnButton variant="outline" size="sm" onClick={handleClearFilter}>
            Clear
          </ShadcnButton>
        </div>

        {/* Right: Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Add Receipt */}
          <ShadcnButton
            variant="default"
            size="sm"
            onClick={() => {
              macAudio.playClick();
              setIsAddReceiptOpen(true);
            }}
            style={{ background: '#10b981', color: '#ffffff' }}
          >
            <Plus size={14} />
            <span>Add Receipt</span>
          </ShadcnButton>

          {/* Delete Receipt (enabled only when receipt selected) */}
          <ShadcnButton
            variant="destructive"
            size="sm"
            disabled={!selectedRow || selectedRow.type !== 'RECEIPT'}
            onClick={() => {
              if (selectedRow && selectedRow.type === 'RECEIPT') {
                macAudio.playClick();
                setReceiptToDelete(selectedRow);
              }
            }}
          >
            <Trash2 size={13} />
            <span>Delete Receipt</span>
          </ShadcnButton>

          {/* Print */}
          <ShadcnButton variant="outline" size="sm" onClick={handleOpenPrintModal}>
            <Printer size={13} />
            <span>Print</span>
          </ShadcnButton>

          {/* Universal Excel/CSV Export, Import & Template */}
          <ExcelCsvActions<LedgerEntry>
            title="Party Ledger Statement"
            filenamePrefix={`Ledger_${(selectedParty || 'All').replace(/\s+/g, '_')}`}
            data={entries}
            columns={ledgerCsvColumns}
            onImport={handleImportLedgerReceipts}
          />
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 2. PARTY INFORMATION & STATEMENT PERIOD BANNER                     */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#18181b',
          border: '1px solid #27272a',
          borderRadius: '8px',
          padding: '8px 14px',
          fontSize: '12.5px',
          gap: '12px',
          flexWrap: 'wrap'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Building size={14} style={{ color: '#38bdf8' }} />
            <span style={{ fontWeight: 700, color: '#f4f4f5', fontSize: '13.5px' }}>
              {partyInfo?.name || selectedParty || 'Select Party'}
            </span>
          </div>

          {partyInfo?.phone && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#a1a1aa' }}>
              <span style={{ color: '#71717a' }}>Tel:</span>
              <span style={{ color: '#f4f4f5', fontFamily: 'monospace' }}>{partyInfo.phone}</span>
            </div>
          )}

          {partyInfo?.gstin && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#a1a1aa' }}>
              <span style={{ color: '#71717a' }}>GSTIN:</span>
              <span style={{ color: '#38bdf8', fontFamily: 'monospace', fontWeight: 600 }}>{partyInfo.gstin}</span>
            </div>
          )}

          {(partyInfo?.station || partyInfo?.district) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#a1a1aa' }}>
              <span style={{ color: '#71717a' }}>Station:</span>
              <span style={{ color: '#f4f4f5' }}>{[partyInfo.station, partyInfo.district].filter(Boolean).join(', ')}</span>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#71717a', fontSize: '12px' }}>
          <Calendar size={13} style={{ color: '#71717a' }} />
          <span>Statement:</span>
          <span style={{ color: '#e4e4e7', fontFamily: 'monospace', fontWeight: 600 }}>{dateFrom}</span>
          <span>to</span>
          <span style={{ color: '#e4e4e7', fontFamily: 'monospace', fontWeight: 600 }}>{dateTo}</span>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 3. SUMMARY KPI CARDS (B/F Opening, Dr, Cr, Net Balance)            */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
        {/* 1. Opening Balance (Brought Forward) */}
        <div
          style={{
            background: '#18181b',
            border: '1px solid #27272a',
            borderRadius: '8px',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <div style={{ fontSize: '11px', color: '#71717a', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Opening Balance (B/F)
            </div>
            <div
              style={{
                fontSize: '18px',
                fontWeight: 700,
                color: openingBalance > 0 ? '#f87171' : (openingBalance < 0 ? '#34d399' : '#a1a1aa'),
                marginTop: '2px',
                fontVariantNumeric: 'tabular-nums'
              }}
            >
              ₹{Math.abs(openingBalance).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
              <span style={{ fontSize: '11px', fontWeight: 600 }}>{openingBalance > 0 ? 'Dr' : (openingBalance < 0 ? 'Cr' : 'Nil')}</span>
            </div>
            <div style={{ fontSize: '10px', color: '#71717a', marginTop: '1px' }}>
              Prior to {dateFrom}
            </div>
          </div>
          <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '7px', borderRadius: '8px', color: '#f59e0b' }}>
            <Calendar size={18} />
          </div>
        </div>

        {/* 2. Total Billed (Dr) */}
        <div
          style={{
            background: '#18181b',
            border: '1px solid #27272a',
            borderRadius: '8px',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <div style={{ fontSize: '11px', color: '#71717a', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Total Billed (Dr)
            </div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#f87171', marginTop: '2px', fontVariantNumeric: 'tabular-nums' }}>
              ₹{totalDebit.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: '10px', color: '#71717a', marginTop: '1px' }}>
              Sales & Invoices
            </div>
          </div>
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '7px', borderRadius: '8px', color: '#ef4444' }}>
            <ArrowUpRight size={18} />
          </div>
        </div>

        {/* 3. Total Received & Return (Cr) */}
        <div
          style={{
            background: '#18181b',
            border: '1px solid #27272a',
            borderRadius: '8px',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <div style={{ fontSize: '11px', color: '#71717a', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Total Received & Return (Cr)
            </div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#34d399', marginTop: '2px', fontVariantNumeric: 'tabular-nums' }}>
              ₹{totalCredit.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: '10px', color: '#71717a', marginTop: '1px' }}>
              Receipts & Returns
            </div>
          </div>
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '7px', borderRadius: '8px', color: '#10b981' }}>
            <ArrowDownLeft size={18} />
          </div>
        </div>

        {/* 4. Net Closing Balance */}
        <div
          style={{
            background: '#18181b',
            border: '1px solid #27272a',
            borderRadius: '8px',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <div style={{ fontSize: '11px', color: '#71717a', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Net Closing Balance
            </div>
            <div
              style={{
                fontSize: '18px',
                fontWeight: 700,
                color: netBalance > 0 ? '#f87171' : (netBalance < 0 ? '#34d399' : '#a1a1aa'),
                marginTop: '2px',
                fontVariantNumeric: 'tabular-nums'
              }}
            >
              ₹{Math.abs(netBalance).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
              <span style={{ fontSize: '11px', fontWeight: 600 }}>{netBalance > 0 ? 'Dr' : (netBalance < 0 ? 'Cr' : '')}</span>
            </div>
            <div style={{ fontSize: '10px', marginTop: '1px', fontWeight: 600, color: netBalance > 0 ? '#f87171' : (netBalance < 0 ? '#34d399' : '#10b981') }}>
              {netBalance === 0 ? 'Settled / Nil (₹0.00)' : (netBalance < 0 ? 'Advance Jama (Credit)' : 'Receivable / Udhari (Debit)')}
            </div>
          </div>
          <div style={{ background: 'rgba(56, 189, 248, 0.1)', padding: '7px', borderRadius: '8px', color: '#38bdf8' }}>
            <Wallet size={18} />
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 4. TABLE TOOLBAR (Search & Type Filter Pills)                      */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px',
          flexWrap: 'wrap'
        }}
      >
        {/* Left: Quick Search */}
        <div style={{ display: 'flex', alignItems: 'center', position: 'relative', width: '320px' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', color: '#71717a' }} />
          <input
            type="text"
            placeholder="Search voucher, particulars, amount..."
            value={tableSearchQuery}
            onChange={(e) => setTableSearchQuery(e.target.value)}
            style={{
              width: '100%',
              height: '32px',
              background: '#18181b',
              border: '1px solid #27272a',
              borderRadius: '6px',
              paddingLeft: '32px',
              paddingRight: tableSearchQuery ? '28px' : '10px',
              color: '#f4f4f5',
              fontSize: '12.5px',
              outline: 'none'
            }}
          />
          {tableSearchQuery && (
            <button
              type="button"
              onClick={() => setTableSearchQuery('')}
              style={{
                position: 'absolute',
                right: '8px',
                background: 'transparent',
                border: 'none',
                color: '#71717a',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: '2px'
              }}
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Center: Type Filter Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#18181b', padding: '3px', borderRadius: '6px', border: '1px solid #27272a' }}>
          {(['ALL', 'SALE BILL', 'RECEIPT', 'SALE RETURN'] as const).map(f => {
            const isActive = typeFilter === f;
            const label = f === 'ALL' ? 'All' : (f === 'SALE BILL' ? 'Sale Bills' : (f === 'RECEIPT' ? 'Receipts' : 'Returns'));
            return (
              <button
                key={f}
                type="button"
                onClick={() => {
                  macAudio.playClick();
                  setTypeFilter(f);
                }}
                style={{
                  padding: '3px 10px',
                  borderRadius: '4px',
                  fontSize: '11.5px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  border: 'none',
                  background: isActive ? '#27272a' : 'transparent',
                  color: isActive ? '#f4f4f5' : '#a1a1aa',
                  transition: 'background 0.15s ease'
                }}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Right: Record count */}
        <div style={{ fontSize: '12px', color: '#71717a' }}>
          Showing <span style={{ color: '#f4f4f5', fontWeight: 600 }}>{displayedEntries.length}</span> of {entries.length} entries
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 5. LEDGER TABLE (Flat dark, no zebra striping, shadcn styling)     */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          background: '#09090b',
          border: '1px solid #27272a',
          borderRadius: '8px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        <div style={{ flex: 1, overflowY: 'auto', position: 'relative' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            {/* Header */}
            <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: '#18181b', borderBottom: '1px solid #27272a' }}>
              <tr>
                <th style={{ padding: '10px 14px', width: '110px', color: '#a1a1aa', fontWeight: 600, fontSize: '12px' }}>DATE</th>
                <th style={{ padding: '10px 14px', width: '120px', color: '#a1a1aa', fontWeight: 600, fontSize: '12px' }}>TYPE</th>
                <th style={{ padding: '10px 14px', width: '110px', color: '#a1a1aa', fontWeight: 600, fontSize: '12px' }}>VOUCHER #</th>
                <th style={{ padding: '10px 14px', color: '#a1a1aa', fontWeight: 600, fontSize: '12px' }}>PARTICULARS</th>
                <th style={{ padding: '10px 14px', width: '130px', textAlign: 'right', color: '#a1a1aa', fontWeight: 600, fontSize: '12px' }}>DEBIT (Dr)</th>
                <th style={{ padding: '10px 14px', width: '130px', textAlign: 'right', color: '#a1a1aa', fontWeight: 600, fontSize: '12px' }}>CREDIT (Cr)</th>
                <th style={{ padding: '10px 14px', width: '140px', textAlign: 'right', color: '#a1a1aa', fontWeight: 600, fontSize: '12px' }}>BALANCE</th>
                <th style={{ padding: '10px 14px', width: '70px', textAlign: 'center', color: '#a1a1aa', fontWeight: 600, fontSize: '12px' }}>ACTION</th>
              </tr>
            </thead>

            {/* Body */}
            <tbody>
              {displayedEntries.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '48px 16px', color: '#71717a' }}>
                    {isLoading ? (
                      'Loading ledger statement...'
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                        <Receipt size={28} style={{ color: '#52525b' }} />
                        <div style={{ fontWeight: 600, color: '#e4e4e7', fontSize: '14px' }}>
                          No transactions found
                        </div>
                        <div style={{ fontSize: '12px', color: '#71717a' }}>
                          No records match for {selectedParty || 'selected party'} in this period/filter.
                        </div>
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                paginatedEntries.map((item, idx) => {
                  const isSelected = selectedRowId === item.id;
                  const isOpening = item.type === 'OPENING BALANCE';
                  const isDebit = item.debit > 0;
                  const isCredit = item.credit > 0;

                  return (
                    <tr
                      key={item.id}
                      id={`ledger-row-${idx}`}
                      data-row-id={item.id}
                      data-row-index={idx}
                      data-row-selected={isSelected ? 'true' : undefined}
                      onClick={() => {
                        setSelectedRowId(item.id);
                        macAudio.playClick();
                      }}
                      onDoubleClick={() => {
                        if (item.type !== 'RECEIPT' && item.type !== 'OPENING BALANCE' && onLoadBillToEditor && item.rawId) {
                          onLoadBillToEditor(String(item.rawId));
                        }
                      }}
                      style={{
                        background: isOpening
                          ? 'rgba(245, 158, 11, 0.06)'
                          : isSelected
                          ? '#27272a'
                          : 'transparent',
                        borderBottom: '1px solid #18181b',
                        borderLeft: isOpening ? '3px solid #f59e0b' : (isSelected ? '3px solid #38bdf8' : '3px solid transparent'),
                        cursor: 'pointer',
                        transition: 'background-color 0.1s ease'
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected && !isOpening) e.currentTarget.style.background = '#18181b';
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected && !isOpening) e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      {/* Date */}
                      <td style={{ padding: '8px 14px', color: '#e4e4e7', fontFamily: 'monospace' }}>
                        {item.date}
                      </td>

                      {/* Type Badge */}
                      <td style={{ padding: '8px 14px' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 600,
                            letterSpacing: '0.2px',
                            background:
                              isOpening
                                ? 'rgba(245, 158, 11, 0.15)'
                                : item.type === 'SALE BILL'
                                ? 'rgba(56, 189, 248, 0.12)'
                                : item.type === 'ORDER'
                                ? 'rgba(168, 85, 247, 0.12)'
                                : item.type === 'SALE RETURN'
                                ? 'rgba(251, 146, 60, 0.12)'
                                : item.type === 'RECEIPT'
                                ? 'rgba(52, 211, 153, 0.12)'
                                : 'rgba(161, 161, 170, 0.12)',
                            color:
                              isOpening
                                ? '#f59e0b'
                                : item.type === 'SALE BILL'
                                ? '#38bdf8'
                                : item.type === 'ORDER'
                                ? '#c084fc'
                                : item.type === 'SALE RETURN'
                                ? '#fb923c'
                                : item.type === 'RECEIPT'
                                ? '#34d399'
                                : '#a1a1aa',
                            border: `1px solid ${
                              isOpening
                                ? 'rgba(245, 158, 11, 0.3)'
                                : item.type === 'SALE BILL'
                                ? 'rgba(56, 189, 248, 0.25)'
                                : item.type === 'ORDER'
                                ? 'rgba(168, 85, 247, 0.25)'
                                : item.type === 'SALE RETURN'
                                ? 'rgba(251, 146, 60, 0.25)'
                                : item.type === 'RECEIPT'
                                ? 'rgba(52, 211, 153, 0.25)'
                                : 'rgba(161, 161, 170, 0.25)'
                            }`
                          }}
                        >
                          {isOpening ? 'B/F OPENING' : item.type}
                        </span>
                      </td>

                      {/* Voucher # */}
                      <td style={{ padding: '8px 14px', color: isOpening ? '#f59e0b' : '#38bdf8', fontWeight: 600, fontFamily: 'monospace' }}>
                        {item.voucher}
                      </td>

                      {/* Particulars */}
                      <td style={{ padding: '8px 14px', color: isOpening ? '#fbbf24' : '#f4f4f5' }}>
                        {item.particulars}
                      </td>

                      {/* Debit (Dr) */}
                      <td
                        style={{
                          padding: '8px 14px',
                          textAlign: 'right',
                          fontWeight: 600,
                          color: isDebit ? '#f87171' : '#52525b',
                          fontVariantNumeric: 'tabular-nums',
                          fontFamily: 'monospace'
                        }}
                      >
                        {isDebit ? `₹${item.debit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}
                      </td>

                      {/* Credit (Cr) */}
                      <td
                        style={{
                          padding: '8px 14px',
                          textAlign: 'right',
                          fontWeight: 600,
                          color: isCredit ? '#34d399' : '#52525b',
                          fontVariantNumeric: 'tabular-nums',
                          fontFamily: 'monospace'
                        }}
                      >
                        {isCredit ? `₹${item.credit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}
                      </td>

                      {/* Balance */}
                      <td
                        style={{
                          padding: '8px 14px',
                          textAlign: 'right',
                          fontWeight: 700,
                          color: item.balance > 0 ? '#f87171' : (item.balance < 0 ? '#34d399' : '#e4e4e7'),
                          fontVariantNumeric: 'tabular-nums',
                          fontFamily: 'monospace'
                        }}
                      >
                        ₹{Math.abs(item.balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}{' '}
                        <span style={{ fontSize: '11px', fontWeight: 600 }}>{item.balance > 0 ? 'Dr' : (item.balance < 0 ? 'Cr' : '')}</span>
                      </td>

                      {/* Action */}
                      <td style={{ padding: '8px 14px', textAlign: 'center' }}>
                        {item.type === 'RECEIPT' ? (
                          <button
                            type="button"
                            title="Delete this payment receipt"
                            onClick={(e) => {
                              e.stopPropagation();
                              macAudio.playClick();
                              setReceiptToDelete(item);
                            }}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#ef4444',
                              cursor: 'pointer',
                              padding: '4px',
                              borderRadius: '4px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <Trash2 size={13} />
                          </button>
                        ) : !isOpening && onLoadBillToEditor && item.rawId ? (
                          <button
                            type="button"
                            title="Open Bill in Editor"
                            onClick={(e) => {
                              e.stopPropagation();
                              macAudio.playClick();
                              onLoadBillToEditor(String(item.rawId));
                            }}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#71717a',
                              cursor: 'pointer',
                              padding: '4px',
                              borderRadius: '4px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = '#38bdf8')}
                            onMouseLeave={(e) => (e.currentTarget.style.color = '#71717a')}
                          >
                            <ExternalLink size={13} />
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

        {/* Grand Totals Footer Row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 16px',
            background: '#18181b',
            borderTop: '2px solid #27272a',
            fontSize: '13px',
            fontWeight: 700
          }}
        >
          <div style={{ color: '#a1a1aa' }}>
            ENTRIES: <span style={{ color: '#f4f4f5' }}>{displayedEntries.length}</span>
            {displayedEntries.length !== entries.length && (
              <span style={{ color: '#71717a', fontSize: '11px', marginLeft: '6px' }}>
                (of {entries.length} total)
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <div style={{ fontVariantNumeric: 'tabular-nums' }}>
              <span style={{ color: '#71717a', marginRight: '6px' }}>Total Dr:</span>
              <span style={{ color: '#f87171' }}>₹{totalDebit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div style={{ fontVariantNumeric: 'tabular-nums' }}>
              <span style={{ color: '#71717a', marginRight: '6px' }}>Total Cr:</span>
              <span style={{ color: '#34d399' }}>₹{totalCredit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div style={{ fontVariantNumeric: 'tabular-nums' }}>
              <span style={{ color: '#71717a', marginRight: '6px' }}>Final Balance:</span>
              <span style={{ color: netBalance > 0 ? '#f87171' : (netBalance < 0 ? '#34d399' : '#f4f4f5') }}>
                ₹{Math.abs(netBalance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}{' '}
                {netBalance > 0 ? 'Dr' : (netBalance < 0 ? 'Cr' : 'Nil')}
              </span>
            </div>
          </div>
        </div>

        {/* Shadcn Pagination Footer */}
        {displayedEntries.length > 0 && (
          <ShadcnPagination
            idPrefix={paginationIdPrefix}
            totalCount={displayedEntries.length}
            pageSize={ledgerPageSize}
            currentPage={ledgerPage}
            onPageChange={handleTablePageChange}
            onPageSizeChange={(sz) => {
              setLedgerPageSize(sz);
              setLedgerPage(1);
            }}
            pageSizeOptions={[25, 50, 100, 200]}
            onFocusTableFirstRow={() => focusTable('first')}
            onFocusTableLastRow={() => focusTable('last')}
            style={{ borderRadius: '0', borderLeft: 'none', borderRight: 'none', borderBottom: 'none' }}
          />
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 4. ADD PAYMENT RECEIPT MODAL (shadcn dialog style)                 */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {isAddReceiptOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
        >
          <div
            style={{
              width: '420px',
              background: '#09090b',
              border: '1px solid #27272a',
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#f4f4f5' }}>Add Payment Received</h3>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#71717a' }}>Record incoming payment to reduce party balance</p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddReceiptOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#71717a', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Form */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', color: '#a1a1aa', fontWeight: 500 }}>Party Name</label>
                <div style={{ marginTop: '4px', fontSize: '13px', fontWeight: 600, color: '#38bdf8' }}>{selectedParty}</div>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#a1a1aa', fontWeight: 500 }}>Amount Received (₹) *</label>
                <input
                  type="number"
                  placeholder="e.g. 5000"
                  value={receiptAmount}
                  onChange={(e) => setReceiptAmount(e.target.value)}
                  autoFocus
                  style={{
                    width: '100%',
                    height: '36px',
                    background: '#18181b',
                    border: '1px solid #27272a',
                    borderRadius: '6px',
                    padding: '0 10px',
                    color: '#f4f4f5',
                    fontSize: '14px',
                    fontWeight: 600,
                    outline: 'none',
                    marginTop: '4px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#a1a1aa', fontWeight: 500, display: 'block', marginBottom: '4px' }}>Date</label>
                <ShadcnDatePicker
                  value={receiptDate}
                  onChange={(val) => setReceiptDate(val)}
                  style={{ width: '100%' }}
                  placeholder="Select payment date"
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#a1a1aa', fontWeight: 500 }}>Remarks / Mode</label>
                <input
                  type="text"
                  placeholder="e.g. Cash, GPay, Cheque #1234, Bank Transfer"
                  value={receiptRemarks}
                  onChange={(e) => setReceiptRemarks(e.target.value)}
                  style={{
                    width: '100%',
                    height: '36px',
                    background: '#18181b',
                    border: '1px solid #27272a',
                    borderRadius: '6px',
                    padding: '0 10px',
                    color: '#f4f4f5',
                    fontSize: '13px',
                    outline: 'none',
                    marginTop: '4px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            {/* Footer Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
              <ShadcnButton variant="outline" size="sm" onClick={() => setIsAddReceiptOpen(false)}>
                Cancel
              </ShadcnButton>
              <ShadcnButton
                variant="default"
                size="sm"
                onClick={handleSaveReceipt}
                disabled={isReceiptSaving}
                style={{ background: '#10b981', color: '#ffffff' }}
              >
                {isReceiptSaving ? 'Saving...' : 'Save Receipt'}
              </ShadcnButton>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 5. DELETE RECEIPT CONFIRMATION MODAL                               */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {receiptToDelete && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
        >
          <div
            style={{
              width: '400px',
              background: '#09090b',
              border: '1px solid #27272a',
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '8px', borderRadius: '8px', color: '#ef4444' }}>
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#f4f4f5' }}>Delete Payment Receipt?</h3>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#71717a' }}>This action will restore the party balance in SQLite.</p>
              </div>
            </div>

            <div style={{ background: '#18181b', borderRadius: '6px', padding: '10px 12px', fontSize: '12.5px' }}>
              <div style={{ color: '#a1a1aa' }}>Party: <strong style={{ color: '#f4f4f5' }}>{selectedParty}</strong></div>
              <div style={{ color: '#a1a1aa', marginTop: '4px' }}>Date: <strong style={{ color: '#f4f4f5' }}>{receiptToDelete.date}</strong></div>
              <div style={{ color: '#a1a1aa', marginTop: '4px' }}>Amount: <strong style={{ color: '#34d399' }}>₹{receiptToDelete.credit.toLocaleString('en-IN')}</strong></div>
              <div style={{ color: '#a1a1aa', marginTop: '4px' }}>Remarks: <strong style={{ color: '#f4f4f5' }}>{receiptToDelete.particulars}</strong></div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <ShadcnButton variant="outline" size="sm" onClick={() => setReceiptToDelete(null)}>
                Cancel
              </ShadcnButton>
              <ShadcnButton
                variant="destructive"
                size="sm"
                onClick={handleDeleteReceipt}
                disabled={isDeletingReceipt}
              >
                {isDeletingReceipt ? 'Deleting...' : 'Yes, Delete'}
              </ShadcnButton>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 6. HIGH-RESOLUTION NATIVE PRINT MODAL                              */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {isPrintModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.8)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
        >
          <div
            style={{
              width: '800px',
              maxHeight: '92vh',
              background: '#09090b',
              border: '1px solid #27272a',
              borderRadius: '12px',
              padding: '16px 20px',
              boxShadow: '0 25px 50px rgba(0,0,0,0.7)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Printer size={18} style={{ color: '#38bdf8' }} />
                <div>
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#f4f4f5' }}>
                    Print Ledger / Khata Bahi — {selectedParty}
                  </h3>
                  <div style={{ fontSize: '11.5px', color: '#71717a' }}>
                    PyQt6 Vector Canvas Engine (1000 x 1414 Virtual Canvas)
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {/* Printer Selector */}
                {availablePrinters.length > 0 && (
                  <select
                    value={selectedPrinter}
                    onChange={(e) => setSelectedPrinter(e.target.value)}
                    style={{
                      height: '30px',
                      background: '#18181b',
                      border: '1px solid #27272a',
                      borderRadius: '6px',
                      color: '#f4f4f5',
                      fontSize: '12px',
                      padding: '0 8px',
                      outline: 'none'
                    }}
                  >
                    {availablePrinters.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                )}

                <button
                  type="button"
                  onClick={() => setIsPrintModalOpen(false)}
                  style={{ background: 'transparent', border: 'none', color: '#71717a', cursor: 'pointer' }}
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Preview Canvas Area */}
            <div
              style={{
                flex: 1,
                minHeight: '440px',
                maxHeight: '62vh',
                overflowY: 'auto',
                background: '#18181b',
                border: '1px solid #27272a',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '12px'
              }}
            >
              {isRenderingPrint ? (
                <div style={{ textAlign: 'center', color: '#a1a1aa' }}>
                  <RotateCcw size={24} className="animate-spin" style={{ margin: '0 auto 8px' }} />
                  <div>Rendering high-fidelity vector preview...</div>
                </div>
              ) : printPreviewImg ? (
                <img
                  src={printPreviewImg}
                  alt="Ledger Preview"
                  style={{
                    maxHeight: '100%',
                    maxWidth: '100%',
                    objectFit: 'contain',
                    borderRadius: '4px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
                  }}
                />
              ) : (
                <div style={{ color: '#ef4444' }}>{printStatusMsg || 'Preview unavailable'}</div>
              )}
            </div>

            {/* Footer with Page Navigation & Print Button */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShadcnButton
                  variant="outline"
                  size="sm"
                  disabled={printPageNum <= 0 || isRenderingPrint}
                  onClick={() => {
                    const prev = printPageNum - 1;
                    fetchPrintPreview(prev);
                  }}
                >
                  <ChevronLeft size={14} />
                  <span>Prev Page</span>
                </ShadcnButton>

                <span style={{ fontSize: '12px', color: '#a1a1aa' }}>
                  Page {printPageNum + 1} of {printTotalPages}
                </span>

                <ShadcnButton
                  variant="outline"
                  size="sm"
                  disabled={printPageNum >= printTotalPages - 1 || isRenderingPrint}
                  onClick={() => {
                    const next = printPageNum + 1;
                    fetchPrintPreview(next);
                  }}
                >
                  <span>Next Page</span>
                  <ChevronRight size={14} />
                </ShadcnButton>
              </div>

              {printStatusMsg && (
                <div style={{ fontSize: '12px', color: '#38bdf8' }}>{printStatusMsg}</div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShadcnButton variant="outline" size="sm" onClick={() => setIsPrintModalOpen(false)}>
                  Close
                </ShadcnButton>
                <ShadcnButton
                  variant="default"
                  size="sm"
                  onClick={handleDirectPrint}
                  disabled={isDirectPrinting}
                  style={{ background: '#38bdf8', color: '#09090b', fontWeight: 600 }}
                >
                  <Printer size={14} />
                  <span>{isDirectPrinting ? 'Sending...' : 'Direct Print'}</span>
                </ShadcnButton>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default LedgerTabView;

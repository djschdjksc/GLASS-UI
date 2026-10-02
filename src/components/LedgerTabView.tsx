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
  ExternalLink,
  Building,
  AlertTriangle
} from 'lucide-react';
import {
  Button as ShadcnButton,
  Input as ShadcnInput,
  Badge as ShadcnBadge,
  Card as ShadcnCard,
  Label as ShadcnLabel
} from './ui/shadcn';
import { macAudio } from '../utils/macAudio';
import { downloadCSV } from '../utils/exportCsv';
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
  const partyDropdownRef = useRef<HTMLDivElement>(null);

  // Date filters
  const [dateFrom, setDateFrom] = useState<string>(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 1);
    return d.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState<string>(() => new Date().toISOString().split('T')[0]);

  // Ledger entries and state
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [totalDebit, setTotalDebit] = useState<number>(0);
  const [totalCredit, setTotalCredit] = useState<number>(0);
  const [netBalance, setNetBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);

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
        const list = Array.isArray(data) ? data : (data.entries || []);
        setEntries(list);
        setTotalDebit(data.totalDebit !== undefined ? data.totalDebit : list.reduce((s: number, e: any) => s + (e.debit || 0), 0));
        setTotalCredit(data.totalCredit !== undefined ? data.totalCredit : list.reduce((s: number, e: any) => s + (e.credit || 0), 0));
        setNetBalance(data.netBalance !== undefined ? data.netBalance : (list.length > 0 ? list[list.length - 1].balance : 0));
        if (list.length > 0) {
          setSelectedRowId(list[0].id);
        } else {
          setSelectedRowId(null);
        }
      } else {
        // Local calculation fallback from contextBills
        calculateFallbackLedger(targetParty);
      }
    } catch {
      calculateFallbackLedger(targetParty);
    } finally {
      setIsLoading(false);
    }
  }, [selectedParty, dateFrom, dateTo, contextBills]);

  // Fallback calculation if server offline
  const calculateFallbackLedger = (party: string) => {
    const filtered = contextBills.filter(b => b.party?.toLowerCase() === party.toLowerCase());
    const list: LedgerEntry[] = [];
    let running = 0;
    let drSum = 0;
    let crSum = 0;

    filtered.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    for (const b of filtered) {
      const isReturn = (b.docType || '').toUpperCase().includes('RETURN');
      const isOrder = (b.docType || '').toUpperCase().includes('ORDER');
      const tot = Number(b.total || 0);

      if (isReturn) {
        running -= tot;
        crSum += tot;
        list.push({
          id: `b_${b.id}`,
          rawId: b.id,
          date: b.date,
          type: 'SALE RETURN',
          voucher: `R-${b.token}`,
          particulars: 'Sale Return',
          debit: 0,
          credit: tot,
          balance: running,
          canDelete: false
        });
      } else {
        running += tot;
        drSum += tot;
        list.push({
          id: `b_${b.id}`,
          rawId: b.id,
          date: b.date,
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
    if (entries.length === 0) {
      alert('Export karne ke liye koi data nahi hai.');
      return;
    }

    const headers = ['Date', 'Type', 'Voucher #', 'Particulars', 'Debit (Dr)', 'Credit (Cr)', 'Running Balance'];
    const rows = entries.map(e => [
      e.date,
      e.type,
      e.voucher,
      e.particulars,
      e.debit > 0 ? e.debit.toFixed(2) : '0.00',
      e.credit > 0 ? e.credit.toFixed(2) : '0.00',
      `${Math.abs(e.balance).toFixed(2)} ${e.balance >= 0 ? 'Dr' : 'Cr'}`
    ]);

    // Summary row
    rows.push([
      'TOTALS / BALANCE',
      '',
      '',
      '',
      totalDebit.toFixed(2),
      totalCredit.toFixed(2),
      `${Math.abs(netBalance).toFixed(2)} ${netBalance >= 0 ? 'Dr' : 'Cr'}`
    ]);

    downloadCSV(`Ledger_${selectedParty.replace(/\s+/g, '_')}_${dateFrom}_to_${dateTo}.csv`, headers, rows);
  };

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
        dateFrom,
        dateTo,
        entries,
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
        dateFrom,
        dateTo,
        entries,
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

  // Keyboard navigation on ledger rows
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (entries.length === 0) return;
    const currentIndex = entries.findIndex(item => item.id === selectedRowId);

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = Math.min(currentIndex + 1, entries.length - 1);
      setSelectedRowId(entries[nextIndex].id);
      macAudio.playHover();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIndex = Math.max(currentIndex - 1, 0);
      setSelectedRowId(entries[prevIndex].id);
      macAudio.playHover();
    } else if (e.key === 'Delete') {
      const current = entries.find(item => item.id === selectedRowId);
      if (current && current.type === 'RECEIPT') {
        e.preventDefault();
        setReceiptToDelete(current);
      }
    }
  };

  // Filter parties for autocomplete
  const filteredParties = useMemo(() => {
    if (!partySearchQuery) return partiesList.slice(0, 50);
    const q = partySearchQuery.toLowerCase();
    return partiesList.filter(p => p.toLowerCase().includes(q)).slice(0, 50);
  }, [partiesList, partySearchQuery]);

  const selectedRow = entries.find(e => e.id === selectedRowId);

  return (
    <div
      tabIndex={0}
      onKeyDown={handleKeyDown}
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
              <Building size={14} style={{ position: 'absolute', left: '10px', color: '#71717a' }} />
              <input
                type="text"
                placeholder="Search party name..."
                value={partySearchQuery}
                onFocus={() => setIsPartyDropdownOpen(true)}
                onChange={(e) => {
                  setPartySearchQuery(e.target.value);
                  setIsPartyDropdownOpen(true);
                }}
                style={{
                  width: '100%',
                  height: '34px',
                  background: '#09090b',
                  border: '1px solid #27272a',
                  borderRadius: '6px',
                  paddingLeft: '32px',
                  paddingRight: '10px',
                  color: '#f4f4f5',
                  fontSize: '13px',
                  fontWeight: 500,
                  outline: 'none'
                }}
              />
            </div>

            {isPartyDropdownOpen && filteredParties.length > 0 && (
              <div
                style={{
                  position: 'absolute',
                  top: '38px',
                  left: 0,
                  width: '100%',
                  maxHeight: '260px',
                  overflowY: 'auto',
                  background: '#18181b',
                  border: '1px solid #27272a',
                  borderRadius: '6px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                  zIndex: 999
                }}
              >
                {filteredParties.map(pName => (
                  <div
                    key={pName}
                    onClick={() => {
                      setSelectedParty(pName);
                      setPartySearchQuery(pName);
                      setIsPartyDropdownOpen(false);
                      macAudio.playClick();
                    }}
                    style={{
                      padding: '8px 12px',
                      fontSize: '12.5px',
                      color: selectedParty === pName ? '#38bdf8' : '#e4e4e7',
                      background: selectedParty === pName ? '#27272a' : 'transparent',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderBottom: '1px solid #27272a'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#27272a')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = selectedParty === pName ? '#27272a' : 'transparent')}
                  >
                    <span>{pName}</span>
                    {selectedParty === pName && <Check size={14} style={{ color: '#38bdf8' }} />}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Date From */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', color: '#71717a' }}>From:</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              style={{
                height: '34px',
                background: '#09090b',
                border: '1px solid #27272a',
                borderRadius: '6px',
                color: '#f4f4f5',
                fontSize: '12.5px',
                padding: '0 8px',
                outline: 'none'
              }}
            />
          </div>

          {/* Date To */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', color: '#71717a' }}>To:</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              style={{
                height: '34px',
                background: '#09090b',
                border: '1px solid #27272a',
                borderRadius: '6px',
                color: '#f4f4f5',
                fontSize: '12.5px',
                padding: '0 8px',
                outline: 'none'
              }}
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

          {/* Export CSV */}
          <ShadcnButton variant="outline" size="sm" onClick={handleExportCSV}>
            <FileSpreadsheet size={13} />
            <span>Export CSV</span>
          </ShadcnButton>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 2. SUMMARY KPI CARDS (Dr, Cr, Net Balance)                         */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
        {/* Total Billed (Dr) */}
        <div
          style={{
            background: '#18181b',
            border: '1px solid #27272a',
            borderRadius: '8px',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <div style={{ fontSize: '12px', color: '#71717a', fontWeight: 500 }}>Total Billed (Dr)</div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#f87171', marginTop: '2px' }}>
              ₹{totalDebit.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '8px', borderRadius: '8px', color: '#ef4444' }}>
            <ArrowUpRight size={20} />
          </div>
        </div>

        {/* Total Received & Return (Cr) */}
        <div
          style={{
            background: '#18181b',
            border: '1px solid #27272a',
            borderRadius: '8px',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <div style={{ fontSize: '12px', color: '#71717a', fontWeight: 500 }}>Total Received & Return (Cr)</div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#34d399', marginTop: '2px' }}>
              ₹{totalCredit.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '8px', borderRadius: '8px', color: '#10b981' }}>
            <ArrowDownLeft size={20} />
          </div>
        </div>

        {/* Net Balance (Bakaya) */}
        <div
          style={{
            background: '#18181b',
            border: '1px solid #27272a',
            borderRadius: '8px',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <div style={{ fontSize: '12px', color: '#71717a', fontWeight: 500 }}>Net Balance (Bakaya)</div>
            <div
              style={{
                fontSize: '20px',
                fontWeight: 700,
                color: netBalance > 0 ? '#f87171' : netBalance < 0 ? '#34d399' : '#a1a1aa',
                marginTop: '2px'
              }}
            >
              ₹{Math.abs(netBalance).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
              <span style={{ fontSize: '13px', fontWeight: 600 }}>{netBalance > 0 ? 'Dr' : netBalance < 0 ? 'Cr' : ''}</span>
            </div>
          </div>
          <div style={{ background: 'rgba(56, 189, 248, 0.1)', padding: '8px', borderRadius: '8px', color: '#38bdf8' }}>
            <Wallet size={20} />
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 3. LEDGER TABLE (Flat dark, no zebra striping, shadcn styling)     */}
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
                <th style={{ padding: '10px 14px', width: '60px', textAlign: 'center', color: '#a1a1aa', fontWeight: 600, fontSize: '12px' }}>ACTION</th>
              </tr>
            </thead>

            {/* Body */}
            <tbody>
              {entries.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '48px 16px', color: '#71717a' }}>
                    {isLoading ? 'Loading ledger statement...' : `No records found for ${selectedParty || 'selected party'}`}
                  </td>
                </tr>
              ) : (
                entries.map((item) => {
                  const isSelected = selectedRowId === item.id;
                  const isDebit = item.debit > 0;
                  const isCredit = item.credit > 0;

                  return (
                    <tr
                      key={item.id}
                      onClick={() => {
                        setSelectedRowId(item.id);
                        macAudio.playClick();
                      }}
                      onDoubleClick={() => {
                        if (item.type !== 'RECEIPT' && onLoadBillToEditor && item.rawId) {
                          onLoadBillToEditor(String(item.rawId));
                        }
                      }}
                      style={{
                        background: isSelected ? '#27272a' : 'transparent',
                        borderBottom: '1px solid #18181b',
                        cursor: 'pointer',
                        transition: 'background-color 0.1s ease'
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) e.currentTarget.style.background = '#18181b';
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) e.currentTarget.style.background = 'transparent';
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
                              item.type === 'SALE BILL'
                                ? 'rgba(56, 189, 248, 0.12)'
                                : item.type === 'ORDER'
                                ? 'rgba(168, 85, 247, 0.12)'
                                : item.type === 'SALE RETURN'
                                ? 'rgba(251, 146, 60, 0.12)'
                                : item.type === 'RECEIPT'
                                ? 'rgba(52, 211, 153, 0.12)'
                                : 'rgba(161, 161, 170, 0.12)',
                            color:
                              item.type === 'SALE BILL'
                                ? '#38bdf8'
                                : item.type === 'ORDER'
                                ? '#c084fc'
                                : item.type === 'SALE RETURN'
                                ? '#fb923c'
                                : item.type === 'RECEIPT'
                                ? '#34d399'
                                : '#a1a1aa',
                            border: `1px solid ${
                              item.type === 'SALE BILL'
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
                          {item.type}
                        </span>
                      </td>

                      {/* Voucher # */}
                      <td style={{ padding: '8px 14px', color: '#38bdf8', fontWeight: 600, fontFamily: 'monospace' }}>
                        {item.voucher}
                      </td>

                      {/* Particulars */}
                      <td style={{ padding: '8px 14px', color: '#f4f4f5' }}>
                        {item.particulars}
                      </td>

                      {/* Debit (Dr) */}
                      <td style={{ padding: '8px 14px', textAlign: 'right', fontWeight: 600, color: isDebit ? '#f87171' : '#52525b' }}>
                        {isDebit ? `₹${item.debit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}
                      </td>

                      {/* Credit (Cr) */}
                      <td style={{ padding: '8px 14px', textAlign: 'right', fontWeight: 600, color: isCredit ? '#34d399' : '#52525b' }}>
                        {isCredit ? `₹${item.credit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}
                      </td>

                      {/* Balance */}
                      <td style={{ padding: '8px 14px', textAlign: 'right', fontWeight: 700, color: item.balance > 0 ? '#f87171' : item.balance < 0 ? '#34d399' : '#e4e4e7' }}>
                        ₹{Math.abs(item.balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}{' '}
                        <span style={{ fontSize: '11px', fontWeight: 600 }}>{item.balance > 0 ? 'Dr' : item.balance < 0 ? 'Cr' : ''}</span>
                      </td>

                      {/* Action */}
                      <td style={{ padding: '8px 14px', textAlign: 'center' }}>
                        {item.type === 'RECEIPT' && (
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
                        )}
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
            TOTAL ENTRIES: <span style={{ color: '#f4f4f5' }}>{entries.length}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <div>
              <span style={{ color: '#71717a', marginRight: '6px' }}>Total Dr:</span>
              <span style={{ color: '#f87171' }}>₹{totalDebit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div>
              <span style={{ color: '#71717a', marginRight: '6px' }}>Total Cr:</span>
              <span style={{ color: '#34d399' }}>₹{totalCredit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div>
              <span style={{ color: '#71717a', marginRight: '6px' }}>Final Balance:</span>
              <span style={{ color: netBalance > 0 ? '#f87171' : netBalance < 0 ? '#34d399' : '#f4f4f5' }}>
                ₹{Math.abs(netBalance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}{' '}
                {netBalance > 0 ? 'Dr' : netBalance < 0 ? 'Cr' : ''}
              </span>
            </div>
          </div>
        </div>
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
                <label style={{ fontSize: '12px', color: '#a1a1aa', fontWeight: 500 }}>Date</label>
                <input
                  type="date"
                  value={receiptDate}
                  onChange={(e) => setReceiptDate(e.target.value)}
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

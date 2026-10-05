import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { BillHeader, RawItem, FinishedItem } from '../types';
import {
  X,
  Printer,
  Camera,
  Download,
  Plus,
  Trash2,
  FileText,
  Truck,
  Layers,
  Check,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minus,
  ArrowDownLeft,
  ArrowUpRight,
  RotateCcw,
  Scale,
  Search,
  History
} from 'lucide-react';
import { macAudio } from '../utils/macAudio';
import { localDb } from '../services/db/localDb';
import type { BillRecord, PartyRecord } from '../services/db/schema';
import { supabaseSyncService } from '../services/supabaseSync';
import { normalizeDocType, getBillCategory } from '../utils/billDocTypes';
import type { BillPrintPayload, PrintAdjustment } from '../utils/billCanvasPainter';
import {
  renderBillToCanvas,
  copyBillCanvasToClipboard,
  downloadBillCanvasAsImage,
  formatIndianCurrency
} from '../utils/billCanvasPainter';

export interface BillPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  header: BillHeader;
  rawItems: RawItem[];
  finishedItems: FinishedItem[];
  initialMode?: 'estimate' | 'summary_only' | 'loading_slip';
  billNo?: string | number;
  dynamicCols?: Array<{ field: string; label: string }>;
  hasPartyCodeCol?: boolean;
  editId?: string;
}

export const BillPrintModal: React.FC<BillPrintModalProps> = ({
  isOpen,
  onClose,
  header,
  rawItems,
  finishedItems,
  initialMode = 'estimate',
  billNo = '0001',
  dynamicCols,
  hasPartyCodeCol,
  editId
}) => {
  const [printMode, setPrintMode] = useState<'estimate' | 'summary_only' | 'loading_slip'>(initialMode);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [isFitPage, setIsFitPage] = useState<boolean>(true);
  const [zoomScale, setZoomScale] = useState<number>(100);
  const [balanceLabel, setBalanceLabel] = useState('BALANCE');
  const [adjustments, setAdjustments] = useState<PrintAdjustment[]>([]);
  const [copiedSuccess, setCopiedSuccess] = useState(false);
  const [nativeImage, setNativeImage] = useState<string | null>(null);
  const [isNativeServiceActive, setIsNativeServiceActive] = useState<boolean>(false);
  const [detectedPrinter, setDetectedPrinter] = useState<string | null>(null);
  const [isPrintingNative, setIsPrintingNative] = useState<boolean>(false);
  const [newlyAddedId, setNewlyAddedId] = useState<string | null>(null);
  const [retryTrigger, setRetryTrigger] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Return Bill Modal State
  const [isReturnModalOpen, setIsReturnModalOpen] = useState<boolean>(false);
  const [returnSearchQuery, setReturnSearchQuery] = useState<string>('');

  // Old Balance Modal State
  const [isOldBalanceModalOpen, setIsOldBalanceModalOpen] = useState<boolean>(false);
  const [customOldBalanceInput, setCustomOldBalanceInput] = useState<string>('');

  // Sale Return bills of this party for Maal Return selection (from SALE RETURN tab)
  const partyPreviousBills = useMemo(() => {
    if (!header.partyName) return [];
    const partyClean = header.partyName.trim().toLowerCase();
    try {
      const allBills = localDb.getBills();
      return allBills.filter(b => {
        const bParty = (b.party || '').trim().toLowerCase();
        const matchesParty = bParty === partyClean || bParty.includes(partyClean) || partyClean.includes(bParty);
        const isDifferentBill = String(b.token || b.id) !== String(billNo);
        // Strictly filter to SALE RETURN vouchers/bills
        const category = getBillCategory(b);
        const isSaleReturn = category === 'SALE RETURN' ||
          (b.docType || '').toUpperCase().includes('RETURN') ||
          (b.typeSelection || '').toUpperCase().includes('RETURN');
        return matchesParty && isDifferentBill && isSaleReturn;
      });
    } catch {
      return [];
    }
  }, [header.partyName, billNo, isOpen]);

  // Find party record for ledger balance
  const activePartyRecord = useMemo<PartyRecord | undefined>(() => {
    if (!header.partyName) return undefined;
    const partyClean = header.partyName.trim().toLowerCase();
    try {
      const parties = localDb.getParties();
      return parties.find(p => {
        const pName = (p.name || '').trim().toLowerCase();
        return pName === partyClean || pName.includes(partyClean) || partyClean.includes(pName);
      });
    } catch {
      return undefined;
    }
  }, [header.partyName, isOpen]);

  // Filtered return bills
  const filteredReturnBills = useMemo(() => {
    const q = returnSearchQuery.trim().toLowerCase();
    if (!q) return partyPreviousBills;
    return partyPreviousBills.filter(b => {
      const token = String(b.token || '').toLowerCase();
      const docType = String(b.docType || '').toLowerCase();
      const date = String(b.date || '').toLowerCase();
      const total = String(b.total || '').toLowerCase();
      return token.includes(q) || docType.includes(q) || date.includes(q) || total.includes(q);
    });
  }, [partyPreviousBills, returnSearchQuery]);

  // Sync initialMode when modal opens
  useEffect(() => {
    if (isOpen) {
      setPrintMode(initialMode);
      setCurrentPage(0);
      setTotalPages(1);
      setIsFitPage(true);
      setZoomScale(100);
      setCopiedSuccess(false);
      setNativeImage(null);
      try {
        const cacheKey = `bill_adj_${billNo}_${header.partyName || 'CASH'}`;
        const saved = localStorage.getItem(cacheKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed.adjustments)) setAdjustments(parsed.adjustments);
          if (parsed.balanceLabel) setBalanceLabel(parsed.balanceLabel);
        } else {
          // Fallback to bill in localDb (synced from other machines)
          const all = localDb.getBills();
          const target = all.find(b => String(b.token) === String(billNo) || b.id === String(billNo));
          if (target && Array.isArray(target.adjustments) && target.adjustments.length > 0) {
            setAdjustments(target.adjustments);
            setBalanceLabel(target.balanceLabel || 'BALANCE');
          } else {
            setAdjustments([]);
            setBalanceLabel('BALANCE');
          }
        }
      } catch {
        setAdjustments([]);
        setBalanceLabel('BALANCE');
      }
    }
  }, [isOpen, initialMode, billNo, header.partyName]);

  // Save adjustments to localStorage and broadcast to cloud
  const saveAdjustmentsCache = (newAdjs: PrintAdjustment[], newLabel: string) => {
    try {
      const cacheKey = `bill_adj_${billNo}_${header.partyName || 'CASH'}`;
      localStorage.setItem(cacheKey, JSON.stringify({ adjustments: newAdjs, balanceLabel: newLabel }));
    } catch { }

    // Persist into localDb and push to Supabase so other counters receive updated adjustments
    try {
      const all = localDb.getBills();
      const target = all.find(b => String(b.token) === String(billNo) || b.id === String(billNo));
      if (target) {
        const updatedBill: BillRecord = {
          ...target,
          adjustments: newAdjs,
          balanceLabel: newLabel,
          updatedAt: Date.now()
        };
        supabaseSyncService.saveAndSyncBill(updatedBill, target);
      }
    } catch (e) {
      console.warn('Sync adjustments to cloud error:', e);
    }
  };

  // Calculate Subtotal & Final Balance
  const subTotal = useMemo(() => {
    return finishedItems.reduce((acc, it) => acc + (Number(it.total) || 0), 0);
  }, [finishedItems]);

  const finalBalance = useMemo(() => {
    let bal = subTotal;
    adjustments.forEach(adj => {
      const v = Number(adj.val) || 0;
      if (adj.type === 'sub') bal -= v;
      else bal += v;
    });
    return bal;
  }, [subTotal, adjustments]);

  // Build Payload (Format 100% untouched)
  const printPayload: BillPrintPayload = useMemo(() => {
    const showPartyCode = hasPartyCodeCol !== undefined
      ? Boolean(hasPartyCodeCol)
      : rawItems.some(r => (r.partyCode || '').trim().length > 0);

    let skipGroupEntries: Array<{ prefix: string; group: string }> = [];
    try {
      const raw: any[] = JSON.parse(localStorage.getItem('billapp_skip_items') || '[]');
      skipGroupEntries = raw
        .filter((it: any) => it.itemPrefix && it.mainGroup)
        .map((it: any) => ({ prefix: it.itemPrefix.trim().toLowerCase(), group: it.mainGroup.trim() }));
    } catch { }

    return {
      docType: header.docType || 'Bill',
      billNo: billNo,
      date: header.date || new Date().toISOString().split('T')[0],
      partyName: header.partyName || 'CASH SALE',
      vehicleNo: header.vehicleNo,
      showPartyCode,
      mode: printMode,
      dynamicCols,
      editId,
      pageNum: currentPage,
      skipGroupEntries,
      items: rawItems.map(r => ({
        ...r,
        name: r.name,
        partyCode: r.partyCode,
        qty: r.qty,
        uCap: r.uCap,
        lCap: r.lCap
      })),
      groups: finishedItems.map(f => ({
        mould: f.mould,
        qty: f.qty,
        price: f.price,
        total: f.total
      })),
      adjustments,
      balanceLabel,
      subTotal,
      finalBalance
    };
  }, [header, rawItems, finishedItems, printMode, billNo, adjustments, balanceLabel, subTotal, finalBalance, dynamicCols, hasPartyCodeCol, editId, currentPage]);

  // Live Canvas Rendering & Native PyQt6 Engine fetch
  useEffect(() => {
    if (!isOpen) return;

    const validRawCount = rawItems.filter(r => (r.name || '').trim().length > 0 || Number(r.qty) > 0).length;
    const calcPages = printMode === 'summary_only' ? 1 : Math.max(1, Math.ceil(validRawCount / (printMode === 'loading_slip' ? 27 : 20)));
    setTotalPages(calcPages);

    if (canvasRef.current) {
      renderBillToCanvas(printPayload, canvasRef.current);
      canvasRef.current.style.width = 'auto';
      canvasRef.current.style.height = 'auto';
    }

    let active = true;

    // Detect default Windows printer & status
    fetch('http://127.0.0.1:5005/api/status')
      .then(res => res.json())
      .then(statusData => {
        if (active && statusData.status === 'ok') {
          setIsNativeServiceActive(true);
          if (statusData.printer) setDetectedPrinter(statusData.printer);
        }
      })
      .catch(() => {
        if (active) {
          setIsNativeServiceActive(false);
          setDetectedPrinter(null);
        }
      });

    fetch('http://127.0.0.1:5005/api/print/render-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(printPayload)
    })
      .then(res => res.json())
      .then(data => {
        if (active && data.success && data.dataUrl) {
          setNativeImage(data.dataUrl);
          setIsNativeServiceActive(true);
          if (typeof data.totalPages === 'number') {
            setTotalPages(Math.max(1, data.totalPages));
          }
        }
      })
      .catch(() => {
        if (active) {
          setIsNativeServiceActive(false);
          setNativeImage(null);
        }
      });

    return () => {
      active = false;
    };
  }, [isOpen, printPayload, retryTrigger, rawItems, printMode]);

  // Modal Keyboard Shortcuts
  useEffect(() => {
    if (!isOpen) return;
    const handleModalKeyDown = (e: KeyboardEvent) => {
      const isCtrlOrCmd = e.ctrlKey || e.metaKey;

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (isCtrlOrCmd && e.shiftKey && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault();
        handleDirectPrint(true);
        return;
      }

      if (isCtrlOrCmd && !e.shiftKey && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault();
        handleDirectPrint(false);
        return;
      }

      if (isCtrlOrCmd && (e.key === 'e' || e.key === 'E')) {
        e.preventDefault();
        try { macAudio.playPop(); } catch { }
        setPrintMode('estimate');
        setCurrentPage(0);
        return;
      }

      if (e.altKey && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        try { macAudio.playPop(); } catch { }
        setPrintMode('summary_only');
        setCurrentPage(0);
        return;
      }

      if (isCtrlOrCmd && (e.key === 'l' || e.key === 'L')) {
        e.preventDefault();
        try { macAudio.playPop(); } catch { }
        setPrintMode('loading_slip');
        setCurrentPage(0);
        return;
      }

      if (e.key === 'Insert') {
        e.preventDefault();
        try { macAudio.playClick(); } catch { }
        handleAddAdjustment(e.shiftKey ? 'sub' : 'add');
        return;
      }

      // Keyboard shortcuts: + for Receive, - for Pay (when not typing in an input/textarea)
      const isInputFocused = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement;
      if (!isInputFocused && !isCtrlOrCmd && !e.altKey) {
        if (e.key === '+' || e.key === '=') {
          e.preventDefault();
          try { macAudio.playClick(); } catch { }
          handleAddAdjustment('add');
          return;
        }
        if (e.key === '-' || e.key === '_') {
          e.preventDefault();
          try { macAudio.playClick(); } catch { }
          handleAddAdjustment('sub');
          return;
        }
        if (e.key === 'r' || e.key === 'R') {
          e.preventDefault();
          try { macAudio.playClick(); } catch { }
          setIsReturnModalOpen(true);
          return;
        }
        if (e.key === 'b' || e.key === 'B') {
          e.preventDefault();
          try { macAudio.playClick(); } catch { }
          setIsOldBalanceModalOpen(true);
          return;
        }
      }

      if (e.key === 'PageDown' || (e.altKey && e.key === 'ArrowRight')) {
        e.preventDefault();
        try { macAudio.playPop(); } catch { }
        setCurrentPage(p => Math.min(totalPages - 1, p + 1));
        return;
      }

      if (e.key === 'PageUp' || (e.altKey && e.key === 'ArrowLeft')) {
        e.preventDefault();
        try { macAudio.playPop(); } catch { }
        setCurrentPage(p => Math.max(0, p - 1));
        return;
      }
    };

    window.addEventListener('keydown', handleModalKeyDown);
    return () => window.removeEventListener('keydown', handleModalKeyDown);
  }, [isOpen, printPayload, totalPages]);

  // Autofocus newly added adjustment row
  useEffect(() => {
    if (newlyAddedId) {
      const timer = setTimeout(() => {
        const input = document.getElementById(`adj_desc_${newlyAddedId}`) as HTMLInputElement | null;
        if (input) {
          input.focus();
          setNewlyAddedId(null);
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [newlyAddedId]);

  if (!isOpen) return null;

  // Add adjustment row (supports optional defaultDesc and defaultVal)
  const handleAddAdjustment = (type: 'add' | 'sub', defaultDesc: string = '', defaultVal: number = 0) => {
    try { macAudio.playClick(); } catch { }
    const newId = 'adj_' + Date.now() + Math.random().toString(36).substring(2, 6);
    const newAdj: PrintAdjustment = {
      id: newId,
      type,
      desc: defaultDesc,
      val: defaultVal
    };
    const updated = [...adjustments, newAdj];
    setAdjustments(updated);
    if (!defaultVal) {
      setNewlyAddedId(newId);
    }
    saveAdjustmentsCache(updated, balanceLabel);
  };

  // Helper when user selects a previous bill for Maal Return
  const handleSelectReturnBill = (b: BillRecord) => {
    try { macAudio.playSuccess(); } catch { }
    const desc = `Return Bill #${b.token || b.id} (${b.date || ''})`;
    const amt = Number(b.total) || 0;
    handleAddAdjustment('sub', desc, amt);
    setIsReturnModalOpen(false);
    setReturnSearchQuery('');
  };

  // Helper when user applies Old Balance
  const handleApplyOldBalance = (type: 'add' | 'sub', amt: number, labelSuffix: string = '') => {
    if (amt <= 0) return;
    try { macAudio.playSuccess(); } catch { }
    const desc = labelSuffix ? `Purana Bakaya (${labelSuffix})` : 'Purana Bakaya';
    handleAddAdjustment(type, desc, amt);
    setIsOldBalanceModalOpen(false);
    setCustomOldBalanceInput('');
  };

  const handleUpdateAdjustment = (id: string, field: 'desc' | 'val', val: any) => {
    const updated = adjustments.map(a => {
      if (a.id === id) {
        return { ...a, [field]: field === 'val' ? Number(val) || 0 : val };
      }
      return a;
    });
    setAdjustments(updated);
    saveAdjustmentsCache(updated, balanceLabel);
  };

  const handleDeleteAdjustment = (id: string) => {
    try { macAudio.playPop(); } catch { }
    const updated = adjustments.filter(a => a.id !== id);
    setAdjustments(updated);
    saveAdjustmentsCache(updated, balanceLabel);
  };

  const handleBalanceLabelChange = (newLabel: string) => {
    setBalanceLabel(newLabel);
    saveAdjustmentsCache(adjustments, newLabel);
  };

  const handleDirectPrint = async (showDialog = false) => {
    try { macAudio.playSuccess(); } catch { }

    setIsPrintingNative(true);
    try {
      const res = await fetch('http://127.0.0.1:5005/api/print/direct-print', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...printPayload, showDialog })
      });
      const data = await res.json();
      if (data.success) {
        setIsNativeServiceActive(true);
        return;
      } else if (data.message && data.message.includes('cancelled')) {
        return;
      } else {
        console.warn('Native direct-print returned error:', data.error);
      }
    } catch (err) {
      console.warn('Native direct-print network error:', err);
    } finally {
      setIsPrintingNative(false);
    }
  };

  const handleCopyAsImage = async () => {
    try { macAudio.playClick(); } catch { }
    try {
      let blob: Blob | null = null;
      if (nativeImage) {
        const res = await fetch(nativeImage);
        blob = await res.blob();
      } else if (canvasRef.current) {
        blob = await new Promise<Blob | null>((resolve) =>
          canvasRef.current!.toBlob(resolve, 'image/png')
        );
      }

      if (blob) {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);
        try { macAudio.playSuccess(); } catch { }
        setCopiedSuccess(true);
        setTimeout(() => setCopiedSuccess(false), 2500);
        return;
      }
    } catch (err) {
      console.warn('Direct browser clipboard write failed, trying canvas fallback:', err);
    }

    if (canvasRef.current) {
      const success = await copyBillCanvasToClipboard(canvasRef.current);
      if (success) {
        try { macAudio.playSuccess(); } catch { }
        setCopiedSuccess(true);
        setTimeout(() => setCopiedSuccess(false), 2500);
      }
    }
  };

  const handleSaveAsImage = () => {
    try { macAudio.playClick(); } catch { }
    const cleanParty = (header.partyName || 'SALE').replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `${printMode.toUpperCase()}_${billNo}_${cleanParty}.png`;

    if (nativeImage) {
      const link = document.createElement('a');
      link.download = filename;
      link.href = nativeImage;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    if (canvasRef.current) {
      downloadBillCanvasAsImage(canvasRef.current, filename);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(3, 7, 18, 0.88)',
        backdropFilter: 'blur(30px)',
        WebkitBackdropFilter: 'blur(30px)',
        zIndex: 9999999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.15s ease',
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", Roboto, sans-serif'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: '96vw',
          maxWidth: '1360px',
          height: '93vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '22px',
          overflow: 'hidden',
          boxShadow: '0 35px 80px -15px rgba(0, 0, 0, 0.85), 0 0 0 1px rgba(255, 255, 255, 0.14), inset 0 1px 1px rgba(255, 255, 255, 0.25)',
          background: 'rgba(15, 23, 42, 0.82)',
          backdropFilter: 'blur(45px) saturate(210%)',
          WebkitBackdropFilter: 'blur(45px) saturate(210%)'
        }}
      >
        {/* ─── Apple Unified Header Bar ─── */}
        <div
          style={{
            padding: '12px 20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(255, 255, 255, 0.03)',
            userSelect: 'none',
            flexShrink: 0
          }}
        >
          {/* Left: Window Controls & Minimal Clean Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
              <button
                type="button"
                onClick={() => {
                  try { macAudio.playClick(); } catch { }
                  onClose();
                }}
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: '#ff5f56',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 1px 4px rgba(255, 95, 86, 0.55)',
                  padding: 0
                }}
              />
              <span
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: '#febc2e',
                  display: 'inline-block',
                  opacity: 0.65
                }}
              />
              <span
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: '#28c840',
                  display: 'inline-block',
                  opacity: 0.65
                }}
              />
            </div>

            <span style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.85)', letterSpacing: '-0.01em' }}>
              Print Preview
            </span>
          </div>

          {/* Center: Apple Segmented Pill Switcher (Estimate | Summary Only | Loading Slip) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'rgba(0, 0, 0, 0.4)',
              padding: '3px',
              borderRadius: '9999px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.4)'
            }}
          >
            <button
              type="button"
              onClick={() => {
                try { macAudio.playPop(); } catch { }
                setPrintMode('estimate');
                setCurrentPage(0);
              }}
              style={{
                background: printMode === 'estimate' ? 'rgba(255, 255, 255, 0.18)' : 'transparent',
                color: printMode === 'estimate' ? '#ffffff' : 'rgba(255, 255, 255, 0.55)',
                border: 'none',
                padding: '5px 16px',
                borderRadius: '9999px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                boxShadow: printMode === 'estimate' ? '0 2px 8px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.3)' : 'none'
              }}
            >
              <FileText size={13} color={printMode === 'estimate' ? '#007AFF' : 'rgba(255, 255, 255, 0.6)'} />
              <span>Full Estimate</span>
            </button>

            <button
              type="button"
              onClick={() => {
                try { macAudio.playPop(); } catch { }
                setPrintMode('summary_only');
                setCurrentPage(0);
              }}
              style={{
                background: printMode === 'summary_only' ? 'rgba(255, 255, 255, 0.18)' : 'transparent',
                color: printMode === 'summary_only' ? '#ffffff' : 'rgba(255, 255, 255, 0.55)',
                border: 'none',
                padding: '5px 16px',
                borderRadius: '9999px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                boxShadow: printMode === 'summary_only' ? '0 2px 8px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.3)' : 'none'
              }}
            >
              <Layers size={13} color={printMode === 'summary_only' ? '#bf5af2' : 'rgba(255, 255, 255, 0.6)'} />
              <span>Summary Only</span>
            </button>

            <button
              type="button"
              onClick={() => {
                try { macAudio.playPop(); } catch { }
                setPrintMode('loading_slip');
                setCurrentPage(0);
              }}
              style={{
                background: printMode === 'loading_slip' ? 'rgba(255, 255, 255, 0.18)' : 'transparent',
                color: printMode === 'loading_slip' ? '#ffffff' : 'rgba(255, 255, 255, 0.55)',
                border: 'none',
                padding: '5px 16px',
                borderRadius: '9999px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                boxShadow: printMode === 'loading_slip' ? '0 2px 8px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.3)' : 'none'
              }}
            >
              <Truck size={13} color={printMode === 'loading_slip' ? '#34c759' : 'rgba(255, 255, 255, 0.6)'} />
              <span>Loading Slip</span>
            </button>
          </div>

          {/* Right: Close Action */}
          <button
            type="button"
            onClick={() => {
              try { macAudio.playClick(); } catch { }
              onClose();
            }}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              borderRadius: '50%',
              width: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'rgba(255, 255, 255, 0.65)',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.16)';
              e.currentTarget.style.color = '#ffffff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
              e.currentTarget.style.color = 'rgba(255, 255, 255, 0.65)';
            }}
          >
            <X size={15} />
          </button>
        </div>

        {/* ─── Main Content Split Stage ─── */}
        <div style={{ flex: 1, display: 'flex', minHeight: 0, overflow: 'hidden' }}>
          {/* LEFT: Live Document Preview Stage */}
          <div
            style={{
              flex: 1,
              background: '#070b14',
              display: 'flex',
              flexDirection: 'column',
              minHeight: 0,
              overflow: 'hidden'
            }}
          >
            {/* Stage Integrated Control Bar (Clean, Unified, NO Duplicate Pagers!) */}
            <div
              style={{
                padding: '8px 18px',
                background: 'rgba(255, 255, 255, 0.03)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexShrink: 0
              }}
            >
              {/* Left Side: Page Pager */}
              {printMode !== 'summary_only' ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    type="button"
                    disabled={currentPage <= 0}
                    onClick={() => {
                      try { macAudio.playPop(); } catch { }
                      setCurrentPage(p => Math.max(0, p - 1));
                    }}
                    style={{
                      background: currentPage <= 0 ? 'transparent' : 'rgba(255, 255, 255, 0.08)',
                      border: 'none',
                      borderRadius: '8px',
                      color: currentPage <= 0 ? 'rgba(255, 255, 255, 0.2)' : '#ffffff',
                      padding: '4px 10px',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: currentPage <= 0 ? 'default' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <ChevronLeft size={13} />
                    <span>Prev</span>
                  </button>

                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: '#00F0FF',
                      padding: '0 8px',
                      letterSpacing: '0.04em'
                    }}
                  >
                    PAGE {currentPage + 1} OF {totalPages}
                  </span>

                  <button
                    type="button"
                    disabled={currentPage >= totalPages - 1}
                    onClick={() => {
                      try { macAudio.playPop(); } catch { }
                      setCurrentPage(p => Math.min(totalPages - 1, p + 1));
                    }}
                    style={{
                      background: currentPage >= totalPages - 1 ? 'transparent' : 'rgba(0, 122, 255, 0.3)',
                      border: currentPage >= totalPages - 1 ? 'none' : '1px solid rgba(0, 122, 255, 0.5)',
                      borderRadius: '8px',
                      color: currentPage >= totalPages - 1 ? 'rgba(255, 255, 255, 0.2)' : '#ffffff',
                      padding: '4px 10px',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: currentPage >= totalPages - 1 ? 'default' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <span>Next</span>
                    <ChevronRight size={13} />
                  </button>
                </div>
              ) : (
                <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.45)', fontWeight: 500 }}>
                  Single Page Summary View
                </span>
              )}

              {/* Right Side: Zoom & Fit Page Capsule */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: 'rgba(0, 0, 0, 0.35)',
                  padding: '3px 6px',
                  borderRadius: '9999px',
                  border: '1px solid rgba(255, 255, 255, 0.08)'
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    try { macAudio.playClick(); } catch { }
                    setIsFitPage(false);
                    setZoomScale(z => Math.max(50, z - 10));
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'rgba(255, 255, 255, 0.7)',
                    cursor: 'pointer',
                    padding: '3px 6px',
                    borderRadius: '6px'
                  }}
                >
                  <Minus size={13} />
                </button>

                <span style={{ fontSize: '10.5px', color: '#ffffff', fontWeight: 600, minWidth: '40px', textAlign: 'center' }}>
                  {isFitPage ? 'Fit' : `${zoomScale}%`}
                </span>

                <button
                  type="button"
                  onClick={() => {
                    try { macAudio.playClick(); } catch { }
                    setIsFitPage(false);
                    setZoomScale(z => Math.min(200, z + 10));
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'rgba(255, 255, 255, 0.7)',
                    cursor: 'pointer',
                    padding: '3px 6px',
                    borderRadius: '6px'
                  }}
                >
                  <Plus size={13} />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    try { macAudio.playClick(); } catch {}
                    setIsFitPage(!isFitPage);
                    if (!isFitPage) setZoomScale(100);
                  }}
                  style={{
                    background: isFitPage ? 'rgba(0, 122, 255, 0.35)' : 'rgba(255, 255, 255, 0.08)',
                    border: isFitPage ? '1px solid #007AFF' : '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '9999px',
                    padding: '2px 8px',
                    fontSize: '10px',
                    fontWeight: 600,
                    color: '#ffffff',
                    cursor: 'pointer',
                    marginLeft: '4px'
                  }}
                >
                  Fit Page
                </button>
              </div>
            </div>

            {/* Document Sheet Display with Paper Drop Shadow */}
            <div
              style={{
                flex: 1,
                overflow: 'auto',
                padding: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                scrollbarWidth: 'thin'
              }}
            >
              <div
                style={{
                  boxShadow: '0 25px 60px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(255, 255, 255, 0.1)',
                  borderRadius: '4px',
                  overflow: 'hidden',
                  background: '#ffffff',
                  transform: isFitPage ? 'none' : `scale(${zoomScale / 100})`,
                  transformOrigin: 'top center',
                  transition: 'transform 0.15s ease',
                  display: 'inline-block'
                }}
              >
                {nativeImage ? (
                  <img
                    src={nativeImage}
                    alt="Native Qt Print Preview"
                    style={{
                      display: 'block',
                      maxHeight: isFitPage ? 'calc(90vh - 145px)' : 'none',
                      maxWidth: '100%',
                      width: isFitPage ? 'auto' : '100%',
                      height: isFitPage ? 'auto' : 'auto',
                      objectFit: 'contain',
                      filter: 'contrast(1.02)'
                    }}
                  />
                ) : (
                  <canvas
                    ref={canvasRef}
                    style={{
                      display: 'block',
                      maxHeight: isFitPage ? 'calc(90vh - 145px)' : 'none',
                      maxWidth: '100%',
                      width: isFitPage ? 'auto' : '100%',
                      height: isFitPage ? 'auto' : 'auto',
                      objectFit: 'contain',
                      filter: 'contrast(1.02)'
                    }}
                  />
                )}
              </div>
            </div>
          </div>

          {/* RIGHT: Inspector Sidebar (Actions, Adjustments, Balance) */}
          <div
            style={{
              width: '380px',
              borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
              background: 'rgba(15, 23, 42, 0.65)',
              padding: '18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              overflowY: 'auto',
              scrollbarWidth: 'thin'
            }}
          >
            {/* ─── Hero Primary Action: Animated Print Button ─── */}
            <button
              type="button"
              disabled={isPrintingNative}
              onClick={() => handleDirectPrint(false)}
              onMouseEnter={() => { try { macAudio.playHover(); } catch { } }}
              className={`print-animated-btn ${isPrintingNative ? 'is-printing' : ''}`}
            >
              <span className="printer-wrapper">
                <span className="printer-container">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 92 75">
                    <path
                      strokeWidth={5}
                      stroke="#ffffff"
                      d="M12 37.5H80C85.2467 37.5 89.5 41.7533 89.5 47V69C89.5 70.933 87.933 72.5 86 72.5H6C4.067 72.5 2.5 70.933 2.5 69V47C2.5 41.7533 6.75329 37.5 12 37.5Z"
                    />
                    <mask fill="white" id="printer-paper-mask">
                      <path d="M12 12C12 5.37258 17.3726 0 24 0H57C70.2548 0 81 10.7452 81 24V29H12V12Z" />
                    </mask>
                    <path
                      mask="url(#printer-paper-mask)"
                      fill="#ffffff"
                      d="M7 12C7 2.61116 14.6112 -5 24 -5H57C73.0163 -5 86 7.98374 86 24H76C76 13.5066 67.4934 5 57 5H24C20.134 5 17 8.13401 17 12H7ZM81 29H12H81ZM7 29V12C7 2.61116 14.6112 -5 24 -5V5C20.134 5 17 8.13401 17 12V29H7ZM57 -5C73.0163 -5 86 7.98374 86 24V29H76V24C76 13.5066 67.4934 5 57 5V-5Z"
                    />
                    <circle fill="#ffffff" r={3} cy={49} cx={78} />
                  </svg>
                </span>
                <span className="printer-page-wrapper">
                  <span className="printer-page" />
                </span>
              </span>
              <span>{isPrintingNative ? 'Printing...' : 'Print'}</span>
            </button>

            {/* Actions: Copy & Save */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button
                type="button"
                onClick={handleCopyAsImage}
                onMouseEnter={() => { try { macAudio.playHover(); } catch { } }}
                style={{
                  background: copiedSuccess
                    ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                    : 'rgba(255, 255, 255, 0.08)',
                  color: '#ffffff',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  height: '30px',
                  borderRadius: '7px',
                  fontWeight: 600,
                  fontSize: '11px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {copiedSuccess ? <Check size={13} /> : <Camera size={13} />}
                <span>{copiedSuccess ? 'Copied' : 'Copy Image'}</span>
              </button>

              <button
                type="button"
                onClick={handleSaveAsImage}
                onMouseEnter={() => { try { macAudio.playHover(); } catch { } }}
                style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  color: '#cbd5e1',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  height: '30px',
                  borderRadius: '7px',
                  fontWeight: 600,
                  fontSize: '11px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <Download size={13} />
                <span>Save PNG</span>
              </button>
            </div>

            {/* ─── Adjustments / Extras Panel ─── */}
            {printMode !== 'loading_slip' && (
              <div
                style={{
                  background: 'rgba(0, 0, 0, 0.35)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#f8fafc', letterSpacing: '0.04em' }}>
                    ADJUSTMENTS & BILL LINKING
                  </span>
                  <span style={{ fontSize: '9.5px', color: 'rgba(255, 255, 255, 0.45)' }}>
                    {adjustments.length} Rows (<kbd style={{ background: 'rgba(255,255,255,0.08)', padding: '0 3px', borderRadius: '3px' }}>+</kbd> / <kbd style={{ background: 'rgba(255,255,255,0.08)', padding: '0 3px', borderRadius: '3px' }}>-</kbd>)
                  </span>
                </div>

                {/* Receive, Pay, Return Bill & Old Balance Action Buttons */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => handleAddAdjustment('add')}
                    title="Add amount to receive (+ shortcut)"
                    style={{
                      background: 'rgba(16, 185, 129, 0.12)',
                      border: '1px solid rgba(16, 185, 129, 0.28)',
                      color: '#6ee7b7',
                      height: '28px',
                      borderRadius: '6px',
                      fontSize: '10.5px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <ArrowDownLeft size={13} />
                    <span>Receive</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAddAdjustment('sub')}
                    title="Deduct amount to pay/discount (- shortcut)"
                    style={{
                      background: 'rgba(239, 68, 68, 0.12)',
                      border: '1px solid rgba(239, 68, 68, 0.28)',
                      color: '#fca5a5',
                      height: '28px',
                      borderRadius: '6px',
                      fontSize: '10.5px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <ArrowUpRight size={13} />
                    <span>Pay</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      try { macAudio.playClick(); } catch { }
                      setIsReturnModalOpen(true);
                    }}
                    title="Select previous bill for Maal Return deduction (R shortcut)"
                    style={{
                      background: 'rgba(245, 158, 11, 0.12)',
                      border: '1px solid rgba(245, 158, 11, 0.28)',
                      color: '#fcd34d',
                      height: '28px',
                      borderRadius: '6px',
                      fontSize: '10.5px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <RotateCcw size={12} />
                    <span>Return Bill</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      try { macAudio.playClick(); } catch { }
                      setIsOldBalanceModalOpen(true);
                    }}
                    title="Add ledger outstanding balance / Purana Bakaya (B shortcut)"
                    style={{
                      background: 'rgba(56, 189, 248, 0.12)',
                      border: '1px solid rgba(56, 189, 248, 0.28)',
                      color: '#7dd3fc',
                      height: '28px',
                      borderRadius: '6px',
                      fontSize: '10.5px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <Scale size={12} />
                    <span>Old Balance</span>
                  </button>
                </div>

                {/* Adjustments Rows List */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '5px',
                    maxHeight: '160px',
                    overflowY: 'auto'
                  }}
                >
                  {adjustments.length === 0 ? (
                    <div style={{ fontSize: '10.5px', color: '#64748b', textAlign: 'center', padding: '10px 0' }}>
                      No adjustments added. Press <kbd style={{ background: 'rgba(255,255,255,0.08)', padding: '1px 5px', borderRadius: '4px' }}>+</kbd> for Receive or <kbd style={{ background: 'rgba(255,255,255,0.08)', padding: '1px 5px', borderRadius: '4px' }}>-</kbd> for Pay.
                    </div>
                  ) : (
                    adjustments.map((adj) => (
                      <div
                        key={adj.id}
                        style={{
                          background: 'rgba(255, 255, 255, 0.04)',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          borderRadius: '6px',
                          padding: '4px 6px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        {/* Interactive Type Switcher (+ / -) */}
                        <button
                          type="button"
                          onClick={() => {
                            const newType = adj.type === 'sub' ? 'add' : 'sub';
                            const updated = adjustments.map(a => a.id === adj.id ? { ...a, type: newType } : a);
                            setAdjustments(updated);
                            saveAdjustmentsCache(updated, balanceLabel);
                          }}
                          title={`Click to switch between Receive (+) and Pay (-). Current: ${adj.type === 'sub' ? 'Pay (-)' : 'Receive (+)'}`}
                          style={{
                            background: adj.type === 'sub' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                            border: `1px solid ${adj.type === 'sub' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(16, 185, 129, 0.4)'}`,
                            color: adj.type === 'sub' ? '#f87171' : '#34d399',
                            width: '22px',
                            height: '22px',
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            flexShrink: 0,
                            padding: 0
                          }}
                        >
                          {adj.type === 'sub' ? <Minus size={12} /> : <Plus size={12} />}
                        </button>

                        {/* Editable Description Input */}
                        <input
                          id={`adj_desc_${adj.id}`}
                          type="text"
                          placeholder="Description (e.g. Receive, Freight, Return)"
                          value={adj.desc}
                          onChange={(e) => handleUpdateAdjustment(adj.id, 'desc', e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const amtInput = document.getElementById(`adj_val_${adj.id}`) as HTMLInputElement | null;
                              if (amtInput) amtInput.focus();
                            }
                          }}
                          style={{
                            flex: 1,
                            height: '24px',
                            fontSize: '11px',
                            padding: '2px 7px',
                            background: 'rgba(0, 0, 0, 0.25)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '5px',
                            color: '#ffffff',
                            outline: 'none'
                          }}
                        />

                        {/* Editable Amount Input */}
                        <input
                          id={`adj_val_${adj.id}`}
                          type="number"
                          placeholder="0"
                          value={adj.val || ''}
                          onChange={(e) => handleUpdateAdjustment(adj.id, 'val', parseFloat(e.target.value) || 0)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddAdjustment(adj.type);
                            }
                          }}
                          style={{
                            width: '76px',
                            height: '24px',
                            fontSize: '11px',
                            fontWeight: 700,
                            textAlign: 'right',
                            padding: '2px 7px',
                            background: 'rgba(0, 0, 0, 0.25)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '5px',
                            color: '#ffffff',
                            outline: 'none'
                          }}
                        />

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => handleDeleteAdjustment(adj.id)}
                          title="Delete adjustment"
                          style={{
                            background: 'rgba(239, 68, 68, 0.18)',
                            border: 'none',
                            color: '#f87171',
                            borderRadius: '4px',
                            width: '22px',
                            height: '22px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            flexShrink: 0
                          }}
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* ─── Balance Summary Card ─── */}
            {printMode !== 'loading_slip' && (
              <div
                style={{
                  background: 'rgba(0, 0, 0, 0.4)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px' }}>
                  <span style={{ color: 'rgba(255, 255, 255, 0.5)' }}>Mould Subtotal:</span>
                  <strong style={{ color: '#ffffff' }}>{formatIndianCurrency(subTotal)}</strong>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.45)', fontWeight: 600 }}>
                    CUSTOM BALANCE LABEL:
                  </span>
                  <input
                    type="text"
                    value={balanceLabel}
                    onChange={(e) => handleBalanceLabelChange(e.target.value)}
                    style={{
                      height: '26px',
                      fontSize: '11px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      background: 'rgba(0, 0, 0, 0.25)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '5px',
                      color: '#ffffff',
                      padding: '2px 8px',
                      outline: 'none'
                    }}
                  />
                </div>

                <div
                  style={{
                    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                    paddingTop: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline'
                  }}
                >
                  <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#f8fafc' }}>
                    {balanceLabel || 'BALANCE'}:
                  </span>
                  <span style={{ fontSize: '18px', fontWeight: 900, color: '#00F0FF', letterSpacing: '-0.02em' }}>
                    {formatIndianCurrency(finalBalance)}
                  </span>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* ─── RETURN BILL SELECTOR MODAL OVERLAY ─── */}
        {isReturnModalOpen && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              backdropFilter: 'blur(10px)',
              zIndex: 99999999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px'
            }}
            onClick={() => setIsReturnModalOpen(false)}
          >
            <div
              style={{
                width: '100%',
                maxWidth: '520px',
                background: '#0d131f',
                border: '1px solid rgba(245, 158, 11, 0.35)',
                borderRadius: '14px',
                boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8), 0 0 30px rgba(245, 158, 11, 0.15)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div
                style={{
                  padding: '14px 16px',
                  background: 'linear-gradient(90deg, rgba(245, 158, 11, 0.15) 0%, rgba(245, 158, 11, 0.03) 100%)',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <RotateCcw size={16} color="#fbbf24" />
                  <div>
                    <h3 style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#f8fafc' }}>
                      Select Sale Return Bill / Voucher
                    </h3>
                    <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)' }}>
                      Party: <strong style={{ color: '#fbbf24' }}>{header.partyName || 'All Parties'}</strong> (From Sale Return tab)
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsReturnModalOpen(false)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: 'none',
                    color: '#94a3b8',
                    borderRadius: '6px',
                    width: '26px',
                    height: '26px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <X size={14} />
                </button>
              </div>

              {/* Search Bar */}
              <div style={{ padding: '12px 16px 8px 16px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    padding: '6px 10px'
                  }}
                >
                  <Search size={14} color="#94a3b8" />
                  <input
                    type="text"
                    placeholder="Search sale return bill by number, date, or amount..."
                    value={returnSearchQuery}
                    onChange={(e) => setReturnSearchQuery(e.target.value)}
                    autoFocus
                    style={{
                      flex: 1,
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      color: '#ffffff',
                      fontSize: '12px'
                    }}
                  />
                  {returnSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setReturnSearchQuery('')}
                      style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 0 }}
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              </div>

              {/* Bill List */}
              <div
                style={{
                  padding: '8px 16px 16px 16px',
                  maxHeight: '340px',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}
              >
                {filteredReturnBills.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '30px 10px', color: '#64748b' }}>
                    <p style={{ margin: 0, fontSize: '12px', fontWeight: 600 }}>No Sale Return bills found for this party</p>
                    <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#475569' }}>
                      {returnSearchQuery ? 'Try matching a different keyword' : 'Create a return voucher under SALE RETURN tab or enter deduction using "-" (Pay)'}
                    </p>
                  </div>
                ) : (
                  filteredReturnBills.map((b) => (
                    <div
                      key={b.id || b.token}
                      onClick={() => handleSelectReturnBill(b)}
                      style={{
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.07)',
                        borderRadius: '8px',
                        padding: '10px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(245, 158, 11, 0.12)';
                        e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.35)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.07)';
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#f8fafc' }}>
                            Bill #{b.token || b.id}
                          </span>
                          <span
                            style={{
                              fontSize: '9.5px',
                              padding: '1px 5px',
                              borderRadius: '4px',
                              background: 'rgba(255, 255, 255, 0.08)',
                              color: 'rgba(255, 255, 255, 0.6)'
                            }}
                          >
                            {b.docType || 'SALE'}
                          </span>
                        </div>
                        <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.45)' }}>
                          {b.date || 'No Date'} &bull; {(b.rawItems || []).length} items
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 800, color: '#fbbf24' }}>
                          {formatIndianCurrency(Number(b.total) || 0)}
                        </span>
                        <button
                          type="button"
                          style={{
                            background: 'rgba(245, 158, 11, 0.2)',
                            border: '1px solid rgba(245, 158, 11, 0.4)',
                            color: '#fcd34d',
                            fontSize: '10.5px',
                            fontWeight: 600,
                            padding: '4px 9px',
                            borderRadius: '5px',
                            cursor: 'pointer'
                          }}
                        >
                          Select
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* ─── OLD BALANCE (PURANA BAKAYA) MODAL OVERLAY ─── */}
        {isOldBalanceModalOpen && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              backdropFilter: 'blur(10px)',
              zIndex: 99999999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px'
            }}
            onClick={() => setIsOldBalanceModalOpen(false)}
          >
            <div
              style={{
                width: '100%',
                maxWidth: '460px',
                background: '#0d131f',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                borderRadius: '14px',
                boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8), 0 0 30px rgba(56, 189, 248, 0.15)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div
                style={{
                  padding: '14px 16px',
                  background: 'linear-gradient(90deg, rgba(56, 189, 248, 0.15) 0%, rgba(56, 189, 248, 0.03) 100%)',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Scale size={16} color="#38bdf8" />
                  <div>
                    <h3 style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#f8fafc' }}>
                      Party Outstanding / Purana Bakaya
                    </h3>
                    <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)' }}>
                      Party: <strong style={{ color: '#38bdf8' }}>{header.partyName || 'Party'}</strong>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOldBalanceModalOpen(false)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: 'none',
                    color: '#94a3b8',
                    borderRadius: '6px',
                    width: '26px',
                    height: '26px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <X size={14} />
                </button>
              </div>

              {/* Body */}
              <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* Ledger Current Balance Card */}
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '10px',
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <span style={{ fontSize: '10.5px', color: 'rgba(255, 255, 255, 0.5)', textTransform: 'uppercase' }}>
                      Ledger Record Balance
                    </span>
                    <div style={{ fontSize: '17px', fontWeight: 800, color: '#f8fafc', marginTop: '2px' }}>
                      {formatIndianCurrency(Math.abs(activePartyRecord?.balance || 0))}
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          marginLeft: '6px',
                          color: (activePartyRecord?.balance || 0) >= 0 ? '#34d399' : '#f87171'
                        }}
                      >
                        {(activePartyRecord?.balance || 0) >= 0 ? 'Lene Wala (Receivable)' : 'Dene Wala (Advance)'}
                      </span>
                    </div>
                  </div>

                  {/* Quick Apply Button */}
                  {Boolean(activePartyRecord?.balance) && (
                    <button
                      type="button"
                      onClick={() => {
                        const bal = activePartyRecord?.balance || 0;
                        if (bal >= 0) {
                          handleApplyOldBalance('add', bal, 'Lene Wala');
                        } else {
                          handleApplyOldBalance('sub', Math.abs(bal), 'Dene Wala');
                        }
                      }}
                      style={{
                        background: (activePartyRecord?.balance || 0) >= 0
                          ? 'rgba(16, 185, 129, 0.2)'
                          : 'rgba(239, 68, 68, 0.2)',
                        border: `1px solid ${(activePartyRecord?.balance || 0) >= 0 ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
                        color: (activePartyRecord?.balance || 0) >= 0 ? '#6ee7b7' : '#fca5a5',
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '6px 12px',
                        borderRadius: '6px',
                        cursor: 'pointer'
                      }}
                    >
                      Apply Full Ledger
                    </button>
                  )}
                </div>

                {/* Custom Amount Form */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.7)' }}>
                    Or Enter Custom Purana Bakaya Amount:
                  </label>
                  <input
                    type="number"
                    placeholder="Enter amount (e.g. 5000)"
                    value={customOldBalanceInput}
                    onChange={(e) => setCustomOldBalanceInput(e.target.value)}
                    style={{
                      height: '34px',
                      fontSize: '13px',
                      fontWeight: 700,
                      padding: '4px 10px',
                      background: 'rgba(0, 0, 0, 0.35)',
                      border: '1px solid rgba(255, 255, 255, 0.14)',
                      borderRadius: '7px',
                      color: '#ffffff',
                      outline: 'none'
                    }}
                  />

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '4px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        const amt = parseFloat(customOldBalanceInput) || 0;
                        handleApplyOldBalance('add', amt, 'Lene Wala');
                      }}
                      disabled={!parseFloat(customOldBalanceInput)}
                      style={{
                        background: 'rgba(16, 185, 129, 0.15)',
                        border: '1px solid rgba(16, 185, 129, 0.35)',
                        color: '#6ee7b7',
                        height: '32px',
                        borderRadius: '7px',
                        fontSize: '11px',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        cursor: parseFloat(customOldBalanceInput) ? 'pointer' : 'not-allowed',
                        opacity: parseFloat(customOldBalanceInput) ? 1 : 0.4
                      }}
                    >
                      <Plus size={13} />
                      <span>+ Lene Wala (Add)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const amt = parseFloat(customOldBalanceInput) || 0;
                        handleApplyOldBalance('sub', amt, 'Dene Wala');
                      }}
                      disabled={!parseFloat(customOldBalanceInput)}
                      style={{
                        background: 'rgba(239, 68, 68, 0.15)',
                        border: '1px solid rgba(239, 68, 68, 0.35)',
                        color: '#fca5a5',
                        height: '32px',
                        borderRadius: '7px',
                        fontSize: '11px',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        cursor: parseFloat(customOldBalanceInput) ? 'pointer' : 'not-allowed',
                        opacity: parseFloat(customOldBalanceInput) ? 1 : 0.4
                      }}
                    >
                      <Minus size={13} />
                      <span>- Dene Wala (Deduct)</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

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
  Zap,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minus
} from 'lucide-react';
import { macAudio } from '../utils/macAudio';
import type { BillPrintPayload, PrintAdjustment } from '../utils/billCanvasPainter';
import {
  renderBillToCanvas,
  copyBillCanvasToClipboard,
  downloadBillCanvasAsImage,
  formatIndianCurrency
} from '../utils/billCanvasPainter';
import { directPrintBill } from '../utils/printHtmlHelper';

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
  const [printStatusMessage, setPrintStatusMessage] = useState<string | null>(null);
  const [retryTrigger, setRetryTrigger] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

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
          setAdjustments([]);
          setBalanceLabel('BALANCE');
        }
      } catch {
        setAdjustments([]);
        setBalanceLabel('BALANCE');
      }
    }
  }, [isOpen, initialMode, billNo, header.partyName]);

  // Save adjustments to localStorage
  const saveAdjustmentsCache = (newAdjs: PrintAdjustment[], newLabel: string) => {
    try {
      const cacheKey = `bill_adj_${billNo}_${header.partyName || 'CASH'}`;
      localStorage.setItem(cacheKey, JSON.stringify({ adjustments: newAdjs, balanceLabel: newLabel }));
    } catch {}
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
    } catch {}

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
        try { macAudio.playPop(); } catch {}
        setPrintMode('estimate');
        setCurrentPage(0);
        return;
      }

      if (e.altKey && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        try { macAudio.playPop(); } catch {}
        setPrintMode('summary_only');
        setCurrentPage(0);
        return;
      }

      if (isCtrlOrCmd && (e.key === 'l' || e.key === 'L')) {
        e.preventDefault();
        try { macAudio.playPop(); } catch {}
        setPrintMode('loading_slip');
        setCurrentPage(0);
        return;
      }

      if (e.key === 'PageDown' || (e.altKey && e.key === 'ArrowRight')) {
        e.preventDefault();
        try { macAudio.playPop(); } catch {}
        setCurrentPage(p => Math.min(totalPages - 1, p + 1));
        return;
      }

      if (e.key === 'PageUp' || (e.altKey && e.key === 'ArrowLeft')) {
        e.preventDefault();
        try { macAudio.playPop(); } catch {}
        setCurrentPage(p => Math.max(0, p - 1));
        return;
      }
    };

    window.addEventListener('keydown', handleModalKeyDown);
    return () => window.removeEventListener('keydown', handleModalKeyDown);
  }, [isOpen, printPayload, totalPages]);

  if (!isOpen) return null;

  // Add adjustment row
  const handleAddAdjustment = (type: 'add' | 'sub') => {
    try { macAudio.playClick(); } catch {}
    const newAdj: PrintAdjustment = {
      id: 'adj_' + Date.now() + Math.random().toString(36).substring(2, 6),
      type,
      desc: type === 'add' ? 'Extra Freight / Labour' : 'Discount / Round Off',
      val: 0
    };
    const updated = [...adjustments, newAdj];
    setAdjustments(updated);
    saveAdjustmentsCache(updated, balanceLabel);
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
    try { macAudio.playPop(); } catch {}
    const updated = adjustments.filter(a => a.id !== id);
    setAdjustments(updated);
    saveAdjustmentsCache(updated, balanceLabel);
  };

  const handleBalanceLabelChange = (newLabel: string) => {
    setBalanceLabel(newLabel);
    saveAdjustmentsCache(adjustments, newLabel);
  };

  const handleDirectPrint = async (showDialog = false) => {
    try { macAudio.playSuccess(); } catch {}

    if (isNativeServiceActive) {
      setIsPrintingNative(true);
      setPrintStatusMessage('🖨️ Preparing high-resolution vector print job...');
      try {
        const res = await fetch('http://127.0.0.1:5005/api/print/direct-print', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...printPayload, showDialog })
        });
        const data = await res.json();
        if (data.success) {
          setPrintStatusMessage(`✅ ${data.message || 'Print job sent successfully!'}`);
          setTimeout(() => setPrintStatusMessage(null), 4500);
          return;
        } else if (data.message && data.message.includes('cancelled')) {
          setPrintStatusMessage('ℹ️ Print cancelled');
          setTimeout(() => setPrintStatusMessage(null), 2500);
          return;
        } else {
          console.warn('Native direct-print returned error:', data.error);
        }
      } catch (err) {
        console.warn('Native direct-print network error, falling back to vector browser print:', err);
      } finally {
        setIsPrintingNative(false);
      }
    }

    setPrintStatusMessage('📄 Opening browser vector print...');
    directPrintBill(printPayload);
    setTimeout(() => setPrintStatusMessage(null), 2000);
  };

  const handleCopyAsImage = async () => {
    try { macAudio.playClick(); } catch {}
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
        try { macAudio.playSuccess(); } catch {}
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
        try { macAudio.playSuccess(); } catch {}
        setCopiedSuccess(true);
        setTimeout(() => setCopiedSuccess(false), 2500);
      }
    }
  };

  const handleSaveAsImage = () => {
    try { macAudio.playClick(); } catch {}
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
          {/* Left: Window Dots & Bill Identity Pill */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {/* macOS Red Close Dot */}
            <button
              type="button"
              onClick={() => {
                try { macAudio.playClick(); } catch {}
                onClose();
              }}
              title="Close (Esc)"
              style={{
                width: '13px',
                height: '13px',
                borderRadius: '50%',
                background: '#ff5f56',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 1px 4px rgba(255, 95, 86, 0.55)',
                padding: 0
              }}
            />

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#ffffff',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  padding: '3px 10px',
                  borderRadius: '9999px',
                  letterSpacing: '0.02em'
                }}
              >
                Token #{billNo}
              </span>

              <span style={{ fontSize: '13px', fontWeight: 600, color: '#e2e8f0' }}>
                {header.partyName || 'CASH SALE'}
              </span>

              <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)' }}>
                • {header.date}
              </span>

              {isNativeServiceActive ? (
                <span
                  style={{
                    fontSize: '10.5px',
                    color: '#34d399',
                    background: 'rgba(16, 185, 129, 0.14)',
                    border: '1px solid rgba(16, 185, 129, 0.35)',
                    padding: '2px 9px',
                    borderRadius: '9999px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    marginLeft: '4px'
                  }}
                >
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#34d399', boxShadow: '0 0 6px #34d399' }} />
                  Vector Laser 600 DPI {detectedPrinter && `(${detectedPrinter.split(' ')[0]})`}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    try { macAudio.playPop(); } catch {}
                    setRetryTrigger(prev => prev + 1);
                  }}
                  style={{
                    fontSize: '10.5px',
                    color: '#fbbf24',
                    background: 'rgba(245, 158, 11, 0.12)',
                    border: '1px solid rgba(245, 158, 11, 0.35)',
                    padding: '2px 9px',
                    borderRadius: '9999px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <AlertTriangle size={11} /> Reconnect Native Engine
                </button>
              )}
            </div>
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
                try { macAudio.playPop(); } catch {}
                setPrintMode('estimate');
                setCurrentPage(0);
              }}
              style={{
                background: printMode === 'estimate' ? 'rgba(255, 255, 255, 0.18)' : 'transparent',
                color: printMode === 'estimate' ? '#ffffff' : 'rgba(255, 255, 255, 0.55)',
                border: 'none',
                padding: '4px 14px',
                borderRadius: '9999px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                boxShadow: printMode === 'estimate' ? '0 2px 8px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.3)' : 'none'
              }}
              title="Full Estimate with Items + Mould Summary (Ctrl+E)"
            >
              <FileText size={12} color={printMode === 'estimate' ? '#007AFF' : 'rgba(255, 255, 255, 0.6)'} />
              <span>Full Estimate (Ctrl+E)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                try { macAudio.playPop(); } catch {}
                setPrintMode('summary_only');
                setCurrentPage(0);
              }}
              style={{
                background: printMode === 'summary_only' ? 'rgba(255, 255, 255, 0.18)' : 'transparent',
                color: printMode === 'summary_only' ? '#ffffff' : 'rgba(255, 255, 255, 0.55)',
                border: 'none',
                padding: '4px 14px',
                borderRadius: '9999px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                boxShadow: printMode === 'summary_only' ? '0 2px 8px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.3)' : 'none'
              }}
              title="Summary Only without Raw Items (Alt+S)"
            >
              <Layers size={12} color={printMode === 'summary_only' ? '#bf5af2' : 'rgba(255, 255, 255, 0.6)'} />
              <span>Summary Only (Alt+S)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                try { macAudio.playPop(); } catch {}
                setPrintMode('loading_slip');
                setCurrentPage(0);
              }}
              style={{
                background: printMode === 'loading_slip' ? 'rgba(255, 255, 255, 0.18)' : 'transparent',
                color: printMode === 'loading_slip' ? '#ffffff' : 'rgba(255, 255, 255, 0.55)',
                border: 'none',
                padding: '4px 14px',
                borderRadius: '9999px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                boxShadow: printMode === 'loading_slip' ? '0 2px 8px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.3)' : 'none'
              }}
              title="Loading Slip for Dispatch (Ctrl+L)"
            >
              <Truck size={12} color={printMode === 'loading_slip' ? '#34c759' : 'rgba(255, 255, 255, 0.6)'} />
              <span>Loading Slip (Ctrl+L)</span>
            </button>
          </div>

          {/* Right: Close Action */}
          <button
            type="button"
            onClick={() => {
              try { macAudio.playClick(); } catch {}
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
            title="Close (Esc)"
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
                      try { macAudio.playPop(); } catch {}
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
                    title="Previous Page (PageUp)"
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
                      try { macAudio.playPop(); } catch {}
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
                    title="Next Page (PageDown)"
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
                    try { macAudio.playClick(); } catch {}
                    setIsFitPage(false);
                    setZoomScale(z => Math.max(50, z - 10));
                  }}
                  title="Zoom Out"
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
                    try { macAudio.playClick(); } catch {}
                    setIsFitPage(false);
                    setZoomScale(z => Math.min(200, z + 10));
                  }}
                  title="Zoom In"
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
                  title={isFitPage ? "Switch to 100% Zoom" : "Fit Full Page"}
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
                  transition: 'transform 0.15s ease'
                }}
              >
                {nativeImage ? (
                  <img
                    src={nativeImage}
                    alt="Native Qt Print Preview"
                    style={{
                      display: 'block',
                      maxHeight: isFitPage ? 'calc(93vh - 145px)' : 'none',
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
                      maxHeight: isFitPage ? 'calc(93vh - 145px)' : 'none',
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
            {/* Status Message Notification */}
            {printStatusMessage && (
              <div
                style={{
                  background: printStatusMessage.startsWith('✅')
                    ? 'rgba(16, 185, 129, 0.18)'
                    : 'rgba(0, 122, 255, 0.18)',
                  border: `1px solid ${printStatusMessage.startsWith('✅') ? '#34c759' : '#007AFF'}`,
                  color: printStatusMessage.startsWith('✅') ? '#6ee7b7' : '#bae6fd',
                  borderRadius: '10px',
                  padding: '8px 12px',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  textAlign: 'center',
                  animation: 'fadeIn 0.15s ease'
                }}
              >
                {printStatusMessage}
              </div>
            )}

            {/* ─── Hero Primary Action: Direct Vector Print ─── */}
            <button
              type="button"
              disabled={isPrintingNative}
              onClick={() => handleDirectPrint(false)}
              onMouseEnter={() => { try { macAudio.playHover(); } catch {} }}
              style={{
                background: isPrintingNative
                  ? 'rgba(16, 185, 129, 0.5)'
                  : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#ffffff',
                border: 'none',
                minHeight: '50px',
                borderRadius: '12px',
                fontWeight: 800,
                fontSize: '13px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '2px',
                padding: '8px 14px',
                boxShadow: '0 8px 24px rgba(16, 185, 129, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
                cursor: isPrintingNative ? 'wait' : 'pointer',
                transition: 'all 0.18s ease'
              }}
              title="Shortcut: Ctrl+P"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Printer size={18} />
                <span>{isPrintingNative ? 'PRINTING VECTOR...' : 'DIRECT PRINT (Ctrl+P)'}</span>
              </div>
              {detectedPrinter && isNativeServiceActive && (
                <span style={{ fontSize: '10px', opacity: 0.9, fontWeight: 500 }}>
                  🖨️ {detectedPrinter} (High-Speed Vector)
                </span>
              )}
            </button>

            {/* Secondary Print Actions Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button
                type="button"
                onClick={() => handleDirectPrint(true)}
                onMouseEnter={() => { try { macAudio.playHover(); } catch {} }}
                style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  color: '#cbd5e1',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  height: '34px',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '11px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease'
                }}
                title="Select another printer or print to PDF via Windows dialog (Ctrl+Shift+P)"
              >
                <span>Windows Dialog...</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  try { macAudio.playClick(); } catch {}
                  directPrintBill(printPayload);
                }}
                onMouseEnter={() => { try { macAudio.playHover(); } catch {} }}
                style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  color: '#cbd5e1',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  height: '34px',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '11px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease'
                }}
                title="Browser HTML Vector Print"
              >
                <span>Browser Print</span>
              </button>
            </div>

            {/* Copy / Save Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button
                type="button"
                onClick={handleCopyAsImage}
                onMouseEnter={() => { try { macAudio.playHover(); } catch {} }}
                style={{
                  background: copiedSuccess
                    ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                    : 'rgba(0, 122, 255, 0.2)',
                  color: '#ffffff',
                  border: '1px solid rgba(0, 122, 255, 0.4)',
                  height: '36px',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '11px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                title="Copy high-res image to clipboard for WhatsApp"
              >
                {copiedSuccess ? <Check size={14} /> : <Camera size={14} />}
                <span>{copiedSuccess ? 'Copied!' : 'Copy Image'}</span>
              </button>

              <button
                type="button"
                onClick={handleSaveAsImage}
                onMouseEnter={() => { try { macAudio.playHover(); } catch {} }}
                style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  color: '#cbd5e1',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  height: '36px',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '11px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  cursor: 'pointer'
                }}
                title="Download bill image file"
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
                  borderRadius: '14px',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#f8fafc', letterSpacing: '0.04em' }}>
                    ADJUSTMENTS / EXTRAS
                  </span>
                  <span style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.45)' }}>
                    {adjustments.length} Rows
                  </span>
                </div>

                {/* + ADD and - SUBTRACT Buttons */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => handleAddAdjustment('add')}
                    style={{
                      background: 'rgba(16, 185, 129, 0.15)',
                      border: '1px solid rgba(16, 185, 129, 0.35)',
                      color: '#a7f3d0',
                      height: '32px',
                      borderRadius: '8px',
                      fontSize: '11px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    <Plus size={13} />
                    <span>+ Extra / Freight</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAddAdjustment('sub')}
                    style={{
                      background: 'rgba(239, 68, 68, 0.15)',
                      border: '1px solid rgba(239, 68, 68, 0.35)',
                      color: '#fca5a5',
                      height: '32px',
                      borderRadius: '8px',
                      fontSize: '11px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    <Minus size={13} />
                    <span>- Discount / Less</span>
                  </button>
                </div>

                {/* Adjustments Rows List */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    maxHeight: '160px',
                    overflowY: 'auto'
                  }}
                >
                  {adjustments.length === 0 ? (
                    <div style={{ fontSize: '10.5px', color: '#64748b', textAlign: 'center', padding: '10px 0' }}>
                      No adjustments added yet. Click + or - above.
                    </div>
                  ) : (
                    adjustments.map((adj) => (
                      <div
                        key={adj.id}
                        style={{
                          background: 'rgba(255, 255, 255, 0.04)',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          borderRadius: '8px',
                          padding: '6px 8px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            color: adj.type === 'sub' ? '#f87171' : '#34d399',
                            width: '20px'
                          }}
                        >
                          {adj.type === 'sub' ? '(-)' : '(+)'}
                        </span>

                        <input
                          type="text"
                          value={adj.desc}
                          onChange={(e) => handleUpdateAdjustment(adj.id, 'desc', e.target.value)}
                          placeholder="Details / Description"
                          style={{
                            flex: 1,
                            height: '26px',
                            fontSize: '11px',
                            padding: '2px 6px',
                            background: 'rgba(0, 0, 0, 0.25)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '4px',
                            color: '#ffffff',
                            outline: 'none'
                          }}
                        />

                        <input
                          type="number"
                          value={adj.val || ''}
                          onChange={(e) => handleUpdateAdjustment(adj.id, 'val', parseFloat(e.target.value) || 0)}
                          placeholder="Amount"
                          style={{
                            width: '80px',
                            height: '26px',
                            fontSize: '11px',
                            fontWeight: 700,
                            textAlign: 'right',
                            padding: '2px 6px',
                            background: 'rgba(0, 0, 0, 0.25)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '4px',
                            color: '#ffffff',
                            outline: 'none'
                          }}
                        />

                        <button
                          type="button"
                          onClick={() => handleDeleteAdjustment(adj.id)}
                          style={{
                            background: 'rgba(239, 68, 68, 0.2)',
                            border: 'none',
                            color: '#ef4444',
                            borderRadius: '4px',
                            width: '24px',
                            height: '24px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer'
                          }}
                          title="Remove"
                        >
                          <Trash2 size={12} />
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
                  borderRadius: '14px',
                  padding: '14px',
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
                    placeholder="BALANCE"
                    style={{
                      height: '28px',
                      fontSize: '11px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      background: 'rgba(0, 0, 0, 0.25)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '6px',
                      color: '#ffffff',
                      padding: '2px 8px',
                      outline: 'none'
                    }}
                  />
                </div>

                <div
                  style={{
                    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                    paddingTop: '10px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline'
                  }}
                >
                  <span style={{ fontSize: '12px', fontWeight: 800, color: '#f8fafc' }}>
                    {balanceLabel || 'BALANCE'}:
                  </span>
                  <span style={{ fontSize: '19px', fontWeight: 900, color: '#00F0FF', letterSpacing: '-0.02em' }}>
                    {formatIndianCurrency(finalBalance)}
                  </span>
                </div>
              </div>
            )}

            {/* Clean Keyboard Shortcuts Helper Card */}
            <div
              style={{
                marginTop: 'auto',
                padding: '10px 12px',
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                fontSize: '10px',
                color: 'rgba(255, 255, 255, 0.4)',
                display: 'flex',
                flexDirection: 'column',
                gap: '3px'
              }}
            >
              <div>⚡ <strong>Ctrl+P</strong>: Direct Vector Laser Print</div>
              <div>⚡ <strong>Ctrl+E</strong>: Full Estimate Mode</div>
              <div>⚡ <strong>Alt+S</strong>: Summary Only Mode</div>
              <div>⚡ <strong>Ctrl+L</strong>: Warehouse Loading Slip</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

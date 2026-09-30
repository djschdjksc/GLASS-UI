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
  RefreshCw,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { macAudio } from '../utils/macAudio';
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
  hasPartyCodeCol
}) => {
  const [printMode, setPrintMode] = useState<'estimate' | 'summary_only' | 'loading_slip'>(initialMode);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [balanceLabel, setBalanceLabel] = useState('BALANCE');
  const [adjustments, setAdjustments] = useState<PrintAdjustment[]>([]);
  const [copiedSuccess, setCopiedSuccess] = useState(false);
  const [nativeImage, setNativeImage] = useState<string | null>(null);
  const [isNativeServiceActive, setIsNativeServiceActive] = useState<boolean>(false);
  const [retryTrigger, setRetryTrigger] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Sync initialMode when modal opens
  useEffect(() => {
    if (isOpen) {
      setPrintMode(initialMode);
      setCurrentPage(0);
      setTotalPages(1);
      setCopiedSuccess(false);
      setNativeImage(null);
      // Load saved adjustments from localStorage for this bill/party if available
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

  // Build Payload
  const printPayload: BillPrintPayload = useMemo(() => {
    // Only show PARTY CODE in print if visible in the UI (hasPartyCodeCol)
    const showPartyCode = hasPartyCodeCol !== undefined
      ? Boolean(hasPartyCodeCol)
      : rawItems.some(r => (r.partyCode || '').trim().length > 0);

    return {
      docType: header.docType || 'Bill',
      billNo: billNo,
      date: header.date || new Date().toISOString().split('T')[0],
      partyName: header.partyName || 'CASH SALE',
      vehicleNo: header.vehicleNo,
      showPartyCode,
      mode: printMode,
      dynamicCols,
      pageNum: currentPage,
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
  }, [header, rawItems, finishedItems, printMode, billNo, adjustments, balanceLabel, subTotal, finalBalance, dynamicCols, hasPartyCodeCol, currentPage]);

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

      // Ctrl+P: Direct Print
      if (isCtrlOrCmd && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault();
        handleDirectPrint();
        return;
      }

      // Ctrl+E: Switch to Estimate
      if (isCtrlOrCmd && (e.key === 'e' || e.key === 'E')) {
        e.preventDefault();
        macAudio.playPop();
        setPrintMode('estimate');
        setCurrentPage(0);
        return;
      }

      // Alt+S: Switch to Summary Only
      if (e.altKey && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        macAudio.playPop();
        setPrintMode('summary_only');
        setCurrentPage(0);
        return;
      }

      // Ctrl+L: Switch to Loading Slip
      if (isCtrlOrCmd && (e.key === 'l' || e.key === 'L')) {
        e.preventDefault();
        macAudio.playPop();
        setPrintMode('loading_slip');
        setCurrentPage(0);
        return;
      }

      // PageDown / Next Page
      if (e.key === 'PageDown' || (e.altKey && e.key === 'ArrowRight')) {
        e.preventDefault();
        macAudio.playPop();
        setCurrentPage(p => Math.min(totalPages - 1, p + 1));
        return;
      }

      // PageUp / Previous Page
      if (e.key === 'PageUp' || (e.altKey && e.key === 'ArrowLeft')) {
        e.preventDefault();
        macAudio.playPop();
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
    macAudio.playClick();
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
    macAudio.playPop();
    const updated = adjustments.filter(a => a.id !== id);
    setAdjustments(updated);
    saveAdjustmentsCache(updated, balanceLabel);
  };

  const handleBalanceLabelChange = (newLabel: string) => {
    setBalanceLabel(newLabel);
    saveAdjustmentsCache(adjustments, newLabel);
  };

  const handleDirectPrint = async () => {
    macAudio.playSuccess();
    if (isNativeServiceActive) {
      try {
        const resp = await fetch('http://127.0.0.1:5005/api/print/direct-print', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...printPayload, showDialog: true })
        });
        const res = await resp.json();
        if (res.success || res.message === 'Print cancelled by user') {
          return;
        }
      } catch (err) {
        console.warn('Native direct-print failed:', err);
      }
    }

    // High-resolution image print (Native PyQt6 or Canvas fallback)
    const imgToPrint = nativeImage || (canvasRef.current ? canvasRef.current.toDataURL('image/png') : null);
    if (imgToPrint) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`<!DOCTYPE html><html><head><title>Print - ${header.partyName || 'Bill'}</title><style>@page{size:A4 portrait;margin:0;}body{margin:0;padding:0;display:flex;justify-content:center;background:#fff;}img{width:100%;max-width:210mm;height:auto;display:block;}</style></head><body><img src="${imgToPrint}" onload="window.print();setTimeout(()=>window.close(),1200);"/></body></html>`);
        printWindow.document.close();
        return;
      }
    }
  };

  const handleCopyAsImage = async () => {
    macAudio.playClick();
    if (isNativeServiceActive) {
      try {
        const resp = await fetch('http://127.0.0.1:5005/api/print/copy-to-clipboard', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(printPayload)
        });
        const res = await resp.json();
        if (res.success) {
          macAudio.playSuccess();
          setCopiedSuccess(true);
          setTimeout(() => setCopiedSuccess(false), 2500);
          return;
        }
      } catch {}
    }

    if (canvasRef.current) {
      const success = await copyBillCanvasToClipboard(canvasRef.current);
      if (success) {
        macAudio.playSuccess();
        setCopiedSuccess(true);
        setTimeout(() => setCopiedSuccess(false), 2500);
      }
    }
  };

  const handleSaveAsImage = () => {
    macAudio.playClick();
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
        backdropFilter: 'blur(20px)',
        zIndex: 9999999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.15s ease'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '95vw',
          maxWidth: '1280px',
          height: '92vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '14px',
          overflow: 'hidden',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.12)',
          background: 'rgba(15, 23, 42, 0.85)'
        }}
      >
        {/* TOP BAR: Title, Shortcut Selector Pills, Close Button */}
        <div
          style={{
            padding: '10px 18px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(30, 41, 59, 0.5)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '15px', fontWeight: 800, color: '#f8fafc', letterSpacing: '0.04em' }}>
              HIGH-SPEED PRINT & ESTIMATE CENTER
            </span>
            <span style={{ fontSize: '11px', color: '#94a3b8', background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: '4px' }}>
              BILL NO: <strong style={{ color: '#38bdf8' }}>{billNo}</strong> • {header.partyName || 'CASH SALE'}
            </span>
            {isNativeServiceActive ? (
              <span style={{ fontSize: '10px', color: '#34d399', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.4)', padding: '2px 8px', borderRadius: '4px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Zap size={11} fill="#34d399" /> ⚡ PYTHON QPAINTER ACTIVE (F:\SUMMARY 1:1)
              </span>
            ) : (
              <button
                type="button"
                onClick={() => {
                  macAudio.playPop();
                  setRetryTrigger(prev => prev + 1);
                }}
                style={{
                  fontSize: '10px',
                  color: '#fbbf24',
                  background: 'rgba(245, 158, 11, 0.12)',
                  border: '1px solid rgba(245, 158, 11, 0.4)',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
                title="Python PyQt6 engine offline. Run 'run_app.bat' or 'python server/native_print_server.py'. Click to reconnect."
              >
                <AlertTriangle size={11} /> ⚠️ PYTHON ENGINE OFFLINE (Click to Reconnect)
              </button>
            )}
          </div>

          {/* Mode Switcher Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(0,0,0,0.3)', padding: '3px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <button
              type="button"
              onClick={() => {
                macAudio.playPop();
                setPrintMode('estimate');
              }}
              style={{
                background: printMode === 'estimate' ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' : 'transparent',
                color: printMode === 'estimate' ? '#ffffff' : '#94a3b8',
                border: 'none',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
              title="Full Estimate with Raw Items + Mould Summary (Ctrl+E)"
            >
              <FileText size={12} />
              <span>Estimate (Ctrl+E)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                macAudio.playPop();
                setPrintMode('summary_only');
              }}
              style={{
                background: printMode === 'summary_only' ? 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)' : 'transparent',
                color: printMode === 'summary_only' ? '#ffffff' : '#94a3b8',
                border: 'none',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
              title="Summary Only without Raw Items (Alt+S)"
            >
              <Layers size={12} />
              <span>Summary Only (Alt+S)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                macAudio.playPop();
                setPrintMode('loading_slip');
              }}
              style={{
                background: printMode === 'loading_slip' ? 'linear-gradient(135deg, #059669 0%, #047857 100%)' : 'transparent',
                color: printMode === 'loading_slip' ? '#ffffff' : '#94a3b8',
                border: 'none',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
              title="Loading Slip for Dispatch (Ctrl+L)"
            >
              <Truck size={12} />
              <span>Loading Slip (Ctrl+L)</span>
            </button>
          </div>

          {/* TOP BAR PAGE NAVIGATION */}
          {printMode !== 'summary_only' && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(255, 255, 255, 0.06)',
                padding: '3px 8px',
                borderRadius: '20px',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              <button
                type="button"
                disabled={currentPage <= 0}
                onClick={() => {
                  macAudio.playPop();
                  setCurrentPage(p => Math.max(0, p - 1));
                }}
                style={{
                  background: currentPage <= 0 ? 'transparent' : 'rgba(255, 255, 255, 0.12)',
                  color: currentPage <= 0 ? '#475569' : '#f8fafc',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '3px 8px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: currentPage <= 0 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                  opacity: currentPage <= 0 ? 0.4 : 1
                }}
                title="Previous Page (PageUp)"
              >
                <ChevronLeft size={13} />
                <span>Prev</span>
              </button>

              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  color: '#38bdf8',
                  padding: '0 6px',
                  letterSpacing: '0.04em'
                }}
              >
                PAGE {currentPage + 1} OF {totalPages}
              </span>

              <button
                type="button"
                disabled={currentPage >= totalPages - 1}
                onClick={() => {
                  macAudio.playPop();
                  setCurrentPage(p => Math.min(totalPages - 1, p + 1));
                }}
                style={{
                  background: currentPage >= totalPages - 1 ? 'transparent' : 'rgba(56, 189, 248, 0.25)',
                  color: currentPage >= totalPages - 1 ? '#475569' : '#38bdf8',
                  border: currentPage >= totalPages - 1 ? 'none' : '1px solid rgba(56, 189, 248, 0.4)',
                  borderRadius: '12px',
                  padding: '3px 8px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: currentPage >= totalPages - 1 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                  opacity: currentPage >= totalPages - 1 ? 0.4 : 1
                }}
                title="Next Page (PageDown)"
              >
                <span>Next</span>
                <ChevronRight size={13} />
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              macAudio.playClick();
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
              color: '#94a3b8',
              transition: 'all 0.15s ease'
            }}
            title="Close (Esc)"
          >
            <X size={15} />
          </button>
        </div>

        {/* MAIN BODY: SPLIT VIEW (LEFT: Live High-Res Canvas Preview, RIGHT: Adjustments & Controls) */}
        <div style={{ flex: 1, display: 'flex', minHeight: 0, overflow: 'hidden' }}>
          {/* LEFT: Live Preview Container with Zoom & Scroll */}
          <div
            style={{
              flex: 1,
              background: '#090d16',
              padding: '20px',
              overflow: 'auto',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}
          >
            {/* DEDICATED PREVIEW PAGE BAR */}
            {printMode !== 'summary_only' && (
              <div
                style={{
                  width: '780px',
                  maxWidth: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  padding: '8px 14px',
                  marginBottom: '14px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', letterSpacing: '0.05em' }}>
                    PAGE NAVIGATION:
                  </span>
                  <span
                    style={{
                      background: 'rgba(56, 189, 248, 0.15)',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                      color: '#38bdf8',
                      padding: '2px 10px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: 800
                    }}
                  >
                    PAGE {currentPage + 1} OF {totalPages}
                  </span>
                  {totalPages > 1 && (
                    <span style={{ fontSize: '10.5px', color: '#38bdf8', fontWeight: 600 }}>
                      ⚡ Multiple pages available! Click Next Page to view.
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    disabled={currentPage <= 0}
                    onClick={() => {
                      macAudio.playPop();
                      setCurrentPage(p => Math.max(0, p - 1));
                    }}
                    style={{
                      background: currentPage <= 0 ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.1)',
                      color: currentPage <= 0 ? '#475569' : '#f8fafc',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '6px',
                      padding: '5px 12px',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: currentPage <= 0 ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      opacity: currentPage <= 0 ? 0.4 : 1,
                      transition: 'all 0.15s ease'
                    }}
                    title="Previous Page (PageUp)"
                  >
                    <ChevronLeft size={13} />
                    <span>Previous Page</span>
                  </button>

                  <button
                    type="button"
                    disabled={currentPage >= totalPages - 1}
                    onClick={() => {
                      macAudio.playPop();
                      setCurrentPage(p => Math.min(totalPages - 1, p + 1));
                    }}
                    style={{
                      background: currentPage >= totalPages - 1 ? 'rgba(255, 255, 255, 0.03)' : 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                      color: currentPage >= totalPages - 1 ? '#475569' : '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '5px 14px',
                      fontSize: '11px',
                      fontWeight: 800,
                      cursor: currentPage >= totalPages - 1 ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      opacity: currentPage >= totalPages - 1 ? 0.4 : 1,
                      boxShadow: currentPage >= totalPages - 1 ? 'none' : '0 2px 8px rgba(2, 132, 199, 0.4)',
                      transition: 'all 0.15s ease'
                    }}
                    title="Next Page (PageDown)"
                  >
                    <span>Next Page</span>
                    <ChevronRight size={13} />
                  </button>
                </div>
              </div>
            )}
            <div
              style={{
                boxShadow: '0 15px 35px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.15)',
                borderRadius: '4px',
                overflow: 'hidden',
                background: '#ffffff',
                maxWidth: '100%',
                width: '780px'
              }}
            >
              {nativeImage && (
                <img
                  src={nativeImage}
                  alt="Native Qt Print Preview"
                  style={{
                    display: 'block',
                    width: '100%',
                    height: 'auto',
                    imageRendering: 'crisp-edges'
                  }}
                />
              )}
              <canvas
                ref={canvasRef}
                style={{
                  display: nativeImage ? 'none' : 'block',
                  width: '100%',
                  height: 'auto'
                }}
              />
            </div>
          </div>

          {/* RIGHT: Adjustments & Actions Sidebar (matching F:\SUMMARY\BillApp\main.py) */}
          <div
            style={{
              width: '380px',
              borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
              background: 'rgba(15, 23, 42, 0.6)',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              overflowY: 'auto'
            }}
          >
            {/* 1. DIRECT PRINT BUTTON */}
            <button
              type="button"
              onClick={handleDirectPrint}
              onMouseEnter={() => macAudio.playHover()}
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#ffffff',
                border: 'none',
                height: '46px',
                borderRadius: '8px',
                fontWeight: 800,
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              title="Shortcut: Ctrl+P"
            >
              <Printer size={18} />
              <span>DIRECT PRINT (Ctrl+P)</span>
            </button>

            {/* 2. COPY AS IMAGE TO CLIPBOARD */}
            <button
              type="button"
              onClick={handleCopyAsImage}
              onMouseEnter={() => macAudio.playHover()}
              style={{
                background: copiedSuccess
                  ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                  : 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                color: '#ffffff',
                border: 'none',
                height: '44px',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(2, 132, 199, 0.3)',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              title="Render high-res PNG and copy to clipboard for WhatsApp / Telegram"
            >
              {copiedSuccess ? <Check size={16} /> : <Camera size={16} />}
              <span>{copiedSuccess ? 'COPIED TO CLIPBOARD!' : '📸 COPY AS IMAGE (CLIPBOARD)'}</span>
            </button>

            {/* 3. SAVE AS IMAGE BUTTON */}
            <button
              type="button"
              onClick={handleSaveAsImage}
              onMouseEnter={() => macAudio.playHover()}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                color: '#94a3b8',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                height: '34px',
                borderRadius: '6px',
                fontWeight: 600,
                fontSize: '11px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                cursor: 'pointer'
              }}
              title="Download bill image to file"
            >
              <Download size={13} />
              <span>Save PNG File</span>
            </button>

            {/* 4. ADJUSTMENTS PANEL (Only in Estimate & Summary Only modes) */}
            {printMode !== 'loading_slip' && (
              <div
                style={{
                  background: 'rgba(0, 0, 0, 0.35)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '10px',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#f8fafc', letterSpacing: '0.05em' }}>
                    ADJUSTMENTS / AURGESTMENT
                  </span>
                  <span style={{ fontSize: '10px', color: '#94a3b8' }}>
                    {adjustments.length} ROWS
                  </span>
                </div>

                {/* + ADD and - SUBTRACT Buttons */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => handleAddAdjustment('add')}
                    style={{
                      background: 'rgba(16, 185, 129, 0.2)',
                      border: '1px solid rgba(16, 185, 129, 0.4)',
                      color: '#a7f3d0',
                      height: '36px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    <Plus size={13} />
                    <span>+ ADD Amount</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAddAdjustment('sub')}
                    style={{
                      background: 'rgba(239, 68, 68, 0.2)',
                      border: '1px solid rgba(239, 68, 68, 0.4)',
                      color: '#fca5a5',
                      height: '36px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    <Plus size={13} style={{ transform: 'rotate(45deg)' }} />
                    <span>- SUBTRACT Amount</span>
                  </button>
                </div>

                {/* Adjustments Rows List */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    maxHeight: '190px',
                    overflowY: 'auto'
                  }}
                >
                  {adjustments.length === 0 ? (
                    <div style={{ fontSize: '10.5px', color: '#64748b', textAlign: 'center', padding: '10px 0' }}>
                      No adjustments added yet. Click + Add or - Subtract above.
                    </div>
                  ) : (
                    adjustments.map((adj) => (
                      <div
                        key={adj.id}
                        style={{
                          background: 'rgba(255, 255, 255, 0.04)',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          borderRadius: '6px',
                          padding: '6px 8px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 800,
                            color: adj.type === 'sub' ? '#f87171' : '#34d399',
                            width: '24px'
                          }}
                        >
                          {adj.type === 'sub' ? '(-)' : '(+)'}
                        </span>

                        <input
                          type="text"
                          value={adj.desc}
                          onChange={(e) => handleUpdateAdjustment(adj.id, 'desc', e.target.value)}
                          placeholder="Details / Description"
                          className="mac-input"
                          style={{
                            flex: 1,
                            height: '26px',
                            fontSize: '11px',
                            padding: '2px 6px'
                          }}
                        />

                        <input
                          type="number"
                          value={adj.val || ''}
                          onChange={(e) => handleUpdateAdjustment(adj.id, 'val', parseFloat(e.target.value) || 0)}
                          placeholder="Amount"
                          className="mac-input"
                          style={{
                            width: '85px',
                            height: '26px',
                            fontSize: '11px',
                            fontWeight: 700,
                            textAlign: 'right',
                            padding: '2px 6px'
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
                          title="Remove row"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* 5. CUSTOM BALANCE LABEL & REALTIME TOTALS (Only in Estimate & Summary Only) */}
            {printMode !== 'loading_slip' && (
              <div
                style={{
                  background: 'rgba(0, 0, 0, 0.45)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '10px',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                  <span style={{ color: '#94a3b8' }}>Mould Sub-Total:</span>
                  <strong style={{ color: '#ffffff' }}>{formatIndianCurrency(subTotal)}</strong>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
                  <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600 }}>
                    CUSTOM BALANCE LABEL (e.g. NET PAYABLE, FINAL BALANCE):
                  </span>
                  <input
                    type="text"
                    value={balanceLabel}
                    onChange={(e) => handleBalanceLabelChange(e.target.value)}
                    placeholder="BALANCE"
                    className="mac-input"
                    style={{
                      height: '28px',
                      fontSize: '11px',
                      fontWeight: 700,
                      textTransform: 'uppercase'
                    }}
                  />
                </div>

                <div
                  style={{
                    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                    paddingTop: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#f8fafc' }}>
                    {balanceLabel || 'BALANCE'}:
                  </span>
                  <span style={{ fontSize: '17px', fontWeight: 900, color: '#38bdf8' }}>
                    {formatIndianCurrency(finalBalance)}
                  </span>
                </div>
              </div>
            )}

            {/* Quick Shortcuts Helper Card */}
            <div
              style={{
                marginTop: 'auto',
                padding: '8px 10px',
                background: 'rgba(255,255,255,0.03)',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.05)',
                fontSize: '10px',
                color: '#64748b',
                display: 'flex',
                flexDirection: 'column',
                gap: '3px'
              }}
            >
              <div>⚡ <strong>Ctrl+P</strong>: Direct Print immediately</div>
              <div>⚡ <strong>Ctrl+E</strong>: Full Estimate (Items + Moulds)</div>
              <div>⚡ <strong>Alt+S</strong>: Summary Only (Moulds only)</div>
              <div>⚡ <strong>Ctrl+L</strong>: Warehouse Loading Slip</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

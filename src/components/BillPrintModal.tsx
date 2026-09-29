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
  Zap
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
}

export const BillPrintModal: React.FC<BillPrintModalProps> = ({
  isOpen,
  onClose,
  header,
  rawItems,
  finishedItems,
  initialMode = 'estimate',
  billNo = '0001'
}) => {
  const [printMode, setPrintMode] = useState<'estimate' | 'summary_only' | 'loading_slip'>(initialMode);
  const [balanceLabel, setBalanceLabel] = useState('BALANCE');
  const [adjustments, setAdjustments] = useState<PrintAdjustment[]>([]);
  const [copiedSuccess, setCopiedSuccess] = useState(false);
  const [nativeImage, setNativeImage] = useState<string | null>(null);
  const [isNativeServiceActive, setIsNativeServiceActive] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Sync initialMode when modal opens
  useEffect(() => {
    if (isOpen) {
      setPrintMode(initialMode);
      setCopiedSuccess(false);
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
    const showPartyCode = rawItems.some(r => (r.partyCode || '').trim().length > 0);
    return {
      docType: header.docType || 'Bill',
      billNo: billNo,
      date: header.date || new Date().toISOString().split('T')[0],
      partyName: header.partyName || 'CASH SALE',
      vehicleNo: header.vehicleNo,
      showPartyCode,
      mode: printMode,
      items: rawItems.map(r => ({
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
  }, [header, rawItems, finishedItems, printMode, billNo, adjustments, balanceLabel, subTotal, finalBalance]);

  // Live Canvas Rendering & Native PyQt6 Engine fetch
  useEffect(() => {
    if (!isOpen) return;

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
  }, [isOpen, printPayload]);

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
        return;
      }

      // Alt+S: Switch to Summary Only
      if (e.altKey && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        macAudio.playPop();
        setPrintMode('summary_only');
        return;
      }

      // Ctrl+L: Switch to Loading Slip
      if (isCtrlOrCmd && (e.key === 'l' || e.key === 'L')) {
        e.preventDefault();
        macAudio.playPop();
        setPrintMode('loading_slip');
        return;
      }
    };

    window.addEventListener('keydown', handleModalKeyDown);
    return () => window.removeEventListener('keydown', handleModalKeyDown);
  }, [isOpen, printPayload]);

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
          body: JSON.stringify(printPayload)
        });
        const res = await resp.json();
        if (res.success) {
          return;
        }
      } catch (err) {
        console.warn('Native direct-print fallback:', err);
      }
    }
    directPrintBill(printPayload);
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
              <span style={{ fontSize: '10px', color: '#94a3b8', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                CANVAS ENGINE (LOCAL)
              </span>
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
              justifyContent: 'center',
              alignItems: 'flex-start'
            }}
          >
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

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
  History,
  Settings,
  Copy,
  FolderOpen,
  FileCheck,
  Send,
  Users,
  MessageSquare,
  ExternalLink
} from 'lucide-react';
import { macAudio } from '../utils/macAudio';
import { localDb } from '../services/db/localDb';
import type { BillRecord, PartyRecord } from '../services/db/schema';
import { supabaseSyncService } from '../services/supabaseSync';
import { getCachedSkipItems, getParties } from '../services/db/sqliteDb';
import { normalizeDocType, getBillCategory, formatBillNumber } from '../utils/billDocTypes';
import type { BillPrintPayload, PrintAdjustment } from '../utils/billCanvasPainter';
import {
  renderBillToCanvas,
  copyBillCanvasToClipboard,
  downloadBillCanvasAsImage,
  formatIndianCurrency,
  isAdjustmentReceive
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

export interface PrintSettings {
  printerName: string;
  estimateRowsPerPage: number;
  loadingSlipRowsPerPage: number;
  copies: number;
  showDialog: boolean;
  paperSize: 'A4' | 'Letter';
  pdfSaveDirectory: string;
}

export const DEFAULT_PRINT_SETTINGS: PrintSettings = {
  printerName: '',
  estimateRowsPerPage: 27,
  loadingSlipRowsPerPage: 27,
  copies: 1,
  showDialog: false,
  paperSize: 'A4',
  pdfSaveDirectory: ''
};

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
  const [copiedCombinedSuccess, setCopiedCombinedSuccess] = useState(false);
  const [isNativeServiceActive, setIsNativeServiceActive] = useState<boolean>(false);
  const [detectedPrinter, setDetectedPrinter] = useState<string | null>(() => {
    try {
      return localStorage.getItem('modern_cached_default_printer') || null;
    } catch {
      return null;
    }
  });
  const [availablePrinters, setAvailablePrinters] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('modern_cached_printers');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [defaultDesktopPath, setDefaultDesktopPath] = useState<string>('');
  const [defaultDownloadsPath, setDefaultDownloadsPath] = useState<string>('');
  const [isPrintingNative, setIsPrintingNative] = useState<boolean>(false);
  const [newlyAddedId, setNewlyAddedId] = useState<string | null>(null);
  const [retryTrigger, setRetryTrigger] = useState(0);
  const [printStatusToast, setPrintStatusToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [lastSavedPdfPath, setLastSavedPdfPath] = useState<string | null>(null);
  const [isPathCopied, setIsPathCopied] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Missing Rate Alert State (Checks for forgotten mould rates in Estimate / Summary modes)
  const [missingRateAlert, setMissingRateAlert] = useState<{
    items: FinishedItem[];
    actionToProceed: () => void;
  } | null>(null);

  // Print & Page Settings Modal State
  const [isPrintSettingsOpen, setIsPrintSettingsOpen] = useState<boolean>(false);
  const [printSettings, setPrintSettings] = useState<PrintSettings>(() => {
    try {
      const saved = localStorage.getItem('modern_print_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_PRINT_SETTINGS,
          ...parsed,
          estimateRowsPerPage: parsed.estimateRowsPerPage && parsed.estimateRowsPerPage !== 20 ? parsed.estimateRowsPerPage : 27,
          loadingSlipRowsPerPage: parsed.loadingSlipRowsPerPage || 27,
          pdfSaveDirectory: parsed.pdfSaveDirectory || '',
          showDialog: false
        };
      }
    } catch {}
    return { ...DEFAULT_PRINT_SETTINGS, showDialog: false };
  });

  const updatePrintSettings = (newSettings: Partial<PrintSettings>) => {
    setPrintSettings(prev => {
      const next = { ...prev, ...newSettings };
      try {
        localStorage.setItem('modern_print_settings', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const currentRowsPerPage = printMode === 'loading_slip'
    ? (Number(printSettings.loadingSlipRowsPerPage) || 27)
    : (Number(printSettings.estimateRowsPerPage) || 27);

  // WhatsApp Modal & Target Number State
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState<boolean>(false);
  const [primaryPhone, setPrimaryPhone] = useState<string>(() => {
    try {
      return localStorage.getItem('modern_primary_whatsapp') || '';
    } catch {
      return '';
    }
  });
  const [customPhoneInput, setCustomPhoneInput] = useState<string>('');
  const [whatsAppTab, setWhatsAppTab] = useState<'party' | 'primary' | 'custom' | 'group'>('party');
  const [customGroupLinkInput, setCustomGroupLinkInput] = useState<string>(() => {
    try {
      return localStorage.getItem('modern_default_whatsapp_group') || '';
    } catch {
      return '';
    }
  });

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

  // Find party record for ledger balance (Exact match only)
  const activePartyRecord = useMemo<PartyRecord | undefined>(() => {
    if (!header.partyName) return undefined;
    const partyClean = header.partyName.trim().toLowerCase();
    const cleanAlpha = partyClean.replace(/[^a-z0-9]/g, '');
    try {
      const parties = localDb.getParties();
      return parties.find(p => {
        const pName = (p.name || '').trim().toLowerCase();
        return pName === partyClean || (cleanAlpha && pName.replace(/[^a-z0-9]/g, '') === cleanAlpha);
      });
    } catch {
      return undefined;
    }
  }, [header.partyName, isOpen]);

  // Find party phone number
  const activePartyPhone = useMemo<string>(() => {
    if (!activePartyRecord) {
      if (!header.partyName) return '';
      const partyClean = header.partyName.trim().toLowerCase();
      try {
        const found = localDb.getParties().find(p => (p.name || '').trim().toLowerCase() === partyClean);
        return (found?.phone || found?.contact || '').trim();
      } catch {
        return '';
      }
    }
    return (activePartyRecord.phone || activePartyRecord.contact || '').trim();
  }, [activePartyRecord, header.partyName]);

  // Lookup District for Party strictly by exact name match & non-empty district only
  const [partyDistrict, setPartyDistrict] = useState<string>('');

  useEffect(() => {
    if (!header.partyName) {
      setPartyDistrict('');
      return;
    }
    const clean = header.partyName.trim().toLowerCase();
    const cleanAlpha = clean.replace(/[^a-z0-9]/g, '');

    const isMatch = (name?: string) => {
      if (!name) return false;
      const pn = name.trim().toLowerCase();
      return pn === clean || (cleanAlpha.length > 2 && pn.replace(/[^a-z0-9]/g, '') === cleanAlpha);
    };

    // 1. Try activePartyRecord strictly
    if (activePartyRecord && isMatch(activePartyRecord.name)) {
      const d = (activePartyRecord.district || '').trim();
      if (d) {
        setPartyDistrict(d);
        return;
      }
    }

    // 2. Try localDb exact match
    try {
      const p = localDb.getParties().find(p => isMatch(p.name));
      if (p) {
        const d = (p.district || '').trim();
        if (d) {
          setPartyDistrict(d);
          return;
        } else {
          // Party found but has NO district -> do NOT print district
          setPartyDistrict('');
          return;
        }
      }
    } catch {}

    // 3. Fallback to SQLite DB (exact match only, strictly non-empty district)
    getParties().then(parties => {
      if (Array.isArray(parties)) {
        const found = parties.find((p: any) => isMatch(p.name));
        if (found) {
          const d = (found.district || '').trim();
          if (d) {
            setPartyDistrict(d);
            return;
          }
        }
      }
      setPartyDistrict('');
    }).catch(() => {
      setPartyDistrict('');
    });
  }, [header.partyName, activePartyRecord, isOpen]);

  const displayPartyWithDistrict = useMemo(() => {
    const rawParty = (header.partyName || 'CASH SALE').trim();
    const cleanDist = (partyDistrict || '').trim();
    if (!cleanDist || rawParty.toLowerCase() === 'cash sale') return rawParty;
    const lowerParty = rawParty.toLowerCase();
    const lowerDist = cleanDist.toLowerCase();
    if (lowerParty.includes(lowerDist)) {
      return rawParty;
    }
    return `${rawParty} (${cleanDist})`;
  }, [header.partyName, partyDistrict]);

  const fullVehicleDisplay = useMemo(() => {
    const vType = (header.vehicleType || '').trim();
    const vNo = (header.vehicleNo || '').trim();
    if (vType && vNo) {
      if (vType.toLowerCase().includes(vNo.toLowerCase())) return vType;
      if (vNo.toLowerCase().includes(vType.toLowerCase())) return vNo;
      return `${vType} - ${vNo}`;
    }
    if (vType) return vType;
    if (vNo) return vNo;
    return '';
  }, [header.vehicleType, header.vehicleNo]);

  const formattedBillNo = useMemo(() => {
    return formatBillNumber(billNo);
  }, [billNo]);

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
      if (isAdjustmentReceive(adj)) {
        bal -= v;
      } else {
        bal += v;
      }
    });
    return bal;
  }, [subTotal, adjustments]);

  const prevBalanceSignRef = useRef<'pos' | 'neg' | null>(null);

  useEffect(() => {
    if (isOpen) {
      prevBalanceSignRef.current = null;
    }
  }, [isOpen, billNo]);

  // Auto-switch Custom Balance Label text box to 'ADVANCE' when balance transitions to negative (and back to 'BALANCE' if positive)
  useEffect(() => {
    const currentSign = finalBalance < 0 ? 'neg' : 'pos';
    if (prevBalanceSignRef.current !== null && prevBalanceSignRef.current !== currentSign) {
      if (currentSign === 'neg') {
        if (!balanceLabel || balanceLabel.trim().toUpperCase() === 'BALANCE') {
          setBalanceLabel('ADVANCE');
          saveAdjustmentsCache(adjustments, 'ADVANCE');
        }
      } else {
        if (!balanceLabel || balanceLabel.trim().toUpperCase() === 'ADVANCE') {
          setBalanceLabel('BALANCE');
          saveAdjustmentsCache(adjustments, 'BALANCE');
        }
      }
    } else if (prevBalanceSignRef.current === null) {
      if (currentSign === 'neg' && (!balanceLabel || balanceLabel.trim().toUpperCase() === 'BALANCE')) {
        setBalanceLabel('ADVANCE');
      }
    }
    prevBalanceSignRef.current = currentSign;
  }, [finalBalance]);

  // Build Payload (Format 100% untouched)
  const printPayload: BillPrintPayload = useMemo(() => {
    const showPartyCode = hasPartyCodeCol !== undefined
      ? Boolean(hasPartyCodeCol)
      : rawItems.some(r => (r.partyCode || '').trim().length > 0);

    let skipGroupEntries: Array<{ prefix: string; group: string }> = [];
    try {
      const raw: any[] = getCachedSkipItems();
      skipGroupEntries = raw
        .filter((it: any) => (it.itemPrefix || it.item_prefix) && (it.mainGroup || it.main_group))
        .map((it: any) => ({
          prefix: (it.itemPrefix || it.item_prefix).trim().toLowerCase(),
          group: (it.mainGroup || it.main_group).trim()
        }));
    } catch { }

    return {
      docType: header.docType || 'Bill',
      billNo: formattedBillNo,
      date: header.date || new Date().toISOString().split('T')[0],
      partyName: displayPartyWithDistrict,
      vehicleNo: (header.vehicleNo || '').trim(),
      vehicleType: (header.vehicleType || '').trim(),
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
      balanceLabel: (balanceLabel && balanceLabel.trim()) ? balanceLabel.trim() : (finalBalance < 0 ? 'ADVANCE' : 'BALANCE'),
      subTotal,
      finalBalance,
      isColorful: true,
      rowsPerPage: currentRowsPerPage,
      printerName: printSettings.printerName || detectedPrinter || undefined,
      copies: printSettings.copies || 1,
      showDialog: printSettings.showDialog,
      paperSize: printSettings.paperSize || 'A4'
    };
  }, [header, rawItems, finishedItems, printMode, formattedBillNo, displayPartyWithDistrict, fullVehicleDisplay, adjustments, balanceLabel, subTotal, finalBalance, dynamicCols, hasPartyCodeCol, editId, currentPage, currentRowsPerPage, printSettings, detectedPrinter]);

  // Live Canvas Rendering & Native PyQt6 Engine fetch
  useEffect(() => {
    if (!isOpen) return;

    const validRawCount = rawItems.filter(r => (r.name || '').trim().length > 0 || Number(r.qty) > 0).length;
    const calcPages = printMode === 'summary_only' ? 1 : Math.max(1, Math.ceil(validRawCount / currentRowsPerPage));
    setTotalPages(calcPages);

    if (canvasRef.current) {
      renderBillToCanvas(printPayload, canvasRef.current);
      canvasRef.current.style.width = 'auto';
      canvasRef.current.style.height = 'auto';
    }

    let active = true;

    // Detect default Windows printer & status
    const fetchStatus = () => {
      fetch('http://127.0.0.1:5005/api/status')
        .then(res => res.json())
        .then(statusData => {
          if (active && statusData.status === 'ok') {
            setIsNativeServiceActive(true);
            if (statusData.printer) {
              setDetectedPrinter(statusData.printer);
              try { localStorage.setItem('modern_cached_default_printer', statusData.printer); } catch {}
            }
            if (Array.isArray(statusData.availablePrinters) && statusData.availablePrinters.length > 0) {
              setAvailablePrinters(statusData.availablePrinters);
              try { localStorage.setItem('modern_cached_printers', JSON.stringify(statusData.availablePrinters)); } catch {}
            }
            if (statusData.defaultDesktopPath) setDefaultDesktopPath(statusData.defaultDesktopPath);
            if (statusData.defaultDownloadsPath) setDefaultDownloadsPath(statusData.defaultDownloadsPath);
          }
        })
        .catch(() => {
          if (active) {
            setIsNativeServiceActive(false);
          }
        });
    };

    fetchStatus();
    const retryTimer = setTimeout(fetchStatus, 800);

    return () => {
      active = false;
      clearTimeout(retryTimer);
    };
  }, [isOpen, printPayload, retryTrigger, rawItems, printMode]);

  // Modal Keyboard Shortcuts
  useEffect(() => {
    if (!isOpen) return;
    const handleModalKeyDown = (e: KeyboardEvent) => {
      const isCtrlOrCmd = e.ctrlKey || e.metaKey;

      if (e.key === 'Escape') {
        e.preventDefault();
        if (missingRateAlert) {
          setMissingRateAlert(null);
          return;
        }
        onClose();
        return;
      }

      if (isCtrlOrCmd && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault();
        e.stopPropagation();
        if (e.shiftKey) {
          handleDirectPrint(true);
        } else {
          handleDirectPrint(false);
        }
        return;
      }

      if (isCtrlOrCmd && (e.key === 'e' || e.key === 'E')) {
        e.preventDefault();
        e.stopPropagation();
        try { macAudio.playPop(); } catch { }
        setPrintMode('estimate');
        setCurrentPage(0);
        return;
      }

      if (e.altKey && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        e.stopPropagation();
        try { macAudio.playPop(); } catch { }
        setPrintMode('summary_only');
        setCurrentPage(0);
        return;
      }

      if (isCtrlOrCmd && (e.key === 'l' || e.key === 'L')) {
        e.preventDefault();
        e.stopPropagation();
        try { macAudio.playPop(); } catch { }
        setPrintMode('loading_slip');
        setCurrentPage(0);
        return;
      }

      if (e.key === 'Insert') {
        if (e.repeat) return;
        e.preventDefault();
        e.stopPropagation();
        try { macAudio.playClick(); } catch { }
        handleAddAdjustment(e.shiftKey ? 'pay' : 'receive', e.shiftKey ? 'Pay' : 'Receive');
        return;
      }

      // Keyboard shortcuts: + for Receive, - for Pay (when not typing in an input/textarea)
      const isInputFocused = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement;
      if (!isInputFocused && !isCtrlOrCmd && !e.altKey) {
        if (e.key === '+' || e.key === '=') {
          if (e.repeat) return;
          e.preventDefault();
          e.stopPropagation();
          try { macAudio.playClick(); } catch { }
          handleAddAdjustment('receive', 'Receive');
          return;
        }
        if (e.key === '-' || e.key === '_') {
          if (e.repeat) return;
          e.preventDefault();
          e.stopPropagation();
          try { macAudio.playClick(); } catch { }
          handleAddAdjustment('pay', 'Pay');
          return;
        }
        if (e.key === 'r' || e.key === 'R') {
          e.preventDefault();
          e.stopPropagation();
          try { macAudio.playClick(); } catch { }
          setIsReturnModalOpen(true);
          return;
        }
        if (e.key === 'b' || e.key === 'B') {
          e.preventDefault();
          e.stopPropagation();
          try { macAudio.playClick(); } catch { }
          setIsOldBalanceModalOpen(true);
          return;
        }
      }

      if (e.key === 'PageDown' || (e.altKey && e.key === 'ArrowRight')) {
        e.preventDefault();
        e.stopPropagation();
        try { macAudio.playPop(); } catch { }
        setCurrentPage(p => Math.min(totalPages - 1, p + 1));
        return;
      }

      if (e.key === 'PageUp' || (e.altKey && e.key === 'ArrowLeft')) {
        e.preventDefault();
        e.stopPropagation();
        try { macAudio.playPop(); } catch { }
        setCurrentPage(p => Math.max(0, p - 1));
        return;
      }
    };

    window.addEventListener('keydown', handleModalKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleModalKeyDown, { capture: true });
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
  const handleAddAdjustment = (type: 'receive' | 'pay' | 'add' | 'sub', defaultDesc: string = '', defaultVal: number = 0) => {
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
    handleAddAdjustment('receive', desc, amt);
    setIsReturnModalOpen(false);
    setReturnSearchQuery('');
  };

  // Helper when user applies Old Balance
  const handleApplyOldBalance = (type: 'receive' | 'pay' | 'add' | 'sub', amt: number, labelSuffix: string = '') => {
    if (amt <= 0) return;
    try { macAudio.playSuccess(); } catch { }
    const desc = labelSuffix ? `Purana Bakaya (${labelSuffix})` : 'Purana Bakaya';
    handleAddAdjustment(type, desc, amt);
    setIsOldBalanceModalOpen(false);
    setCustomOldBalanceInput('');
  };

  const handleUpdateAdjustment = (id: string, field: 'desc' | 'val', val: any) => {
    let finalVal = val;
    if (field === 'desc' && typeof val === 'string' && val.length > 0) {
      finalVal = val.replace(/(^|[\s\-_/(\[])([a-z])/g, (_, boundary, char) => boundary + char.toUpperCase());
    } else if (field === 'val') {
      finalVal = Number(val) || 0;
    }
    const updated = adjustments.map(a => {
      if (a.id === id) {
        return { ...a, [field]: finalVal };
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
    const formatted = newLabel ? newLabel.replace(/(^|[\s\-_/(\[])([a-z])/g, (_, boundary, char) => boundary + char.toUpperCase()) : '';
    setBalanceLabel(formatted);
    saveAdjustmentsCache(adjustments, formatted);
  };


  const checkMissingRates = (): FinishedItem[] => {
    // Only check for Estimate and Summary modes (NOT for loading slip)
    if (printMode !== 'estimate' && printMode !== 'summary_only') {
      return [];
    }
    return (finishedItems || []).filter(it => {
      const hasMould = Boolean(it.mould && it.mould.trim().length > 0);
      const hasQty = Number(it.qty) > 0;
      const hasPrice = Number(it.price) > 0;
      // Item is flagged if it has a mould or qty, but price is missing / 0
      return (hasMould || hasQty) && !hasPrice;
    });
  };

  const executeDirectPrint = async (showDialog = false) => {
    try { macAudio.playSuccess(); } catch { }

    setIsPrintingNative(true);
    setPrintStatusToast(null);
    try {
      const res = await fetch('http://127.0.0.1:5005/api/print/direct-print', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...printPayload,
          printerName: printSettings.printerName || detectedPrinter || undefined,
          copies: printSettings.copies || 1,
          rowsPerPage: currentRowsPerPage,
          paperSize: printSettings.paperSize || 'A4',
          pdfSaveDirectory: printSettings.pdfSaveDirectory || undefined,
          showDialog: showDialog,
          isImageMode: false,
          isColorful: false
        })
      });
      const data = await res.json();
      if (data.success) {
        setIsNativeServiceActive(true);
        if (data.filePath) {
          setLastSavedPdfPath(data.filePath);
          try {
            navigator.clipboard.writeText(data.filePath);
            setIsPathCopied(true);
            setTimeout(() => setIsPathCopied(false), 3000);
          } catch {}
        }
        setPrintStatusToast({ type: 'success', msg: data.message || 'Printed in 0.05s!' });
        setTimeout(() => setPrintStatusToast(null), 5000);
        return;
      } else if (data.message && data.message.includes('cancelled')) {
        return;
      } else {
        console.warn('Native direct-print returned error:', data.error);
        setPrintStatusToast({ type: 'error', msg: 'Print error: ' + (data.error || 'Check printer') });
        setTimeout(() => setPrintStatusToast(null), 4000);
      }
    } catch (err) {
      console.warn('Native direct-print network error:', err);
      setPrintStatusToast({ 
        type: 'error', 
        msg: 'Print Error: Python Native Print Engine (Port 5005) not responding. Please check server.' 
      });
      setTimeout(() => setPrintStatusToast(null), 5000);
    } finally {
      setIsPrintingNative(false);
    }
  };

  const handleDirectPrint = async (showDialog = false) => {
    const missing = checkMissingRates();
    if (missing.length > 0) {
      try { macAudio.playPop(); } catch {}
      setMissingRateAlert({
        items: missing,
        actionToProceed: () => executeDirectPrint(showDialog)
      });
      return;
    }
    executeDirectPrint(showDialog);
  };

  const handleCopyPdfPath = async () => {
    if (!lastSavedPdfPath) return;
    try {
      await navigator.clipboard.writeText(lastSavedPdfPath);
      setIsPathCopied(true);
      try { macAudio.playSuccess(); } catch {}
      setTimeout(() => setIsPathCopied(false), 3000);
    } catch {}
  };

  const handleOpenFolder = async () => {
    if (!lastSavedPdfPath) return;
    try {
      await fetch('http://127.0.0.1:5005/api/print/open-path', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: lastSavedPdfPath })
      });
    } catch {}
  };

  const executeCopyAsImage = async (isCombined = false) => {
    try { macAudio.playClick(); } catch { }
    let targetCanvas: HTMLCanvasElement | null = null;
    if (isCombined) {
      targetCanvas = document.createElement('canvas');
      renderBillToCanvas({ ...printPayload, pageNum: -1, combineAllPages: true }, targetCanvas);
    } else {
      targetCanvas = canvasRef.current;
    }

    if (targetCanvas) {
      const success = await copyBillCanvasToClipboard(targetCanvas);
      if (success) {
        try { macAudio.playSuccess(); } catch { }
        if (isCombined) {
          setCopiedCombinedSuccess(true);
          setTimeout(() => setCopiedCombinedSuccess(false), 2500);
        } else {
          setCopiedSuccess(true);
          setTimeout(() => setCopiedSuccess(false), 2500);
        }
      }
    }
  };

  const handleCopyAsImage = async (isCombined = false) => {
    const missing = checkMissingRates();
    if (missing.length > 0) {
      try { macAudio.playPop(); } catch {}
      setMissingRateAlert({
        items: missing,
        actionToProceed: () => executeCopyAsImage(isCombined)
      });
      return;
    }
    executeCopyAsImage(isCombined);
  };

  const executeSaveAsImage = (isCombined = false) => {
    try { macAudio.playClick(); } catch { }
    const cleanParty = (header.partyName || 'SALE').replace(/[^a-zA-Z0-9_-]/g, '_');
    const suffix = isCombined ? '_COMBINED' : (totalPages > 1 ? `_PAGE_${currentPage + 1}` : '');
    const filename = `${printMode.toUpperCase()}_${billNo}_${cleanParty}${suffix}.png`;

    let targetCanvas: HTMLCanvasElement | null = null;
    if (isCombined) {
      targetCanvas = document.createElement('canvas');
      renderBillToCanvas({ ...printPayload, pageNum: -1, combineAllPages: true }, targetCanvas);
    } else {
      targetCanvas = canvasRef.current;
    }

    if (targetCanvas) {
      downloadBillCanvasAsImage(targetCanvas, filename);
    }
  };

  const handleSaveAsImage = (isCombined = false) => {
    const missing = checkMissingRates();
    if (missing.length > 0) {
      try { macAudio.playPop(); } catch {}
      setMissingRateAlert({
        items: missing,
        actionToProceed: () => executeSaveAsImage(isCombined)
      });
      return;
    }
    executeSaveAsImage(isCombined);
  };

  // WhatsApp Sharing Logic
  const generateWhatsAppSummaryText = (): string => {
    const docName = (header.docType || 'BILL').toUpperCase();
    const party = displayPartyWithDistrict || 'Sir/Madam';
    const bNum = formattedBillNo;
    const dt = header.date || new Date().toISOString().split('T')[0];
    const totalAmt = formatIndianCurrency(finalBalance);
    const subTot = formatIndianCurrency(subTotal);
    const totalQty = rawItems.reduce((acc, r) => acc + (Number(r.qty) || 0), 0);

    let text = `📄 *${docName} #${bNum}*\n`;
    text += `👤 *Party:* ${party}\n`;
    text += `📅 *Date:* ${dt}\n`;
    if (header.vehicleNo) text += `🚛 *Vehicle:* ${header.vehicleNo}\n`;
    text += `📦 *Total Qty:* ${totalQty}\n`;
    if (printMode !== 'loading_slip') {
      text += `💰 *Sub Total:* ₹${subTot}\n`;
      text += `💵 *${balanceLabel}:* ₹${totalAmt}\n`;
    }
    text += `\n📎 _Bill summary image copied to your clipboard (Press Ctrl+V to attach image)_`;
    return text;
  };

  const sanitizePhoneForWhatsApp = (raw: string): string => {
    let clean = (raw || '').replace(/[^0-9]/g, '');
    if (clean.length === 10) clean = '91' + clean;
    if (clean.startsWith('0') && clean.length === 11) clean = '91' + clean.slice(1);
    return clean;
  };

  const handleSendWhatsApp = async (phoneOrGroupUrl?: string) => {
    try { macAudio.playClick(); } catch {}

    // Auto copy image to clipboard so user can just Ctrl+V in WhatsApp Web/App
    try {
      await executeCopyAsImage(totalPages > 1);
    } catch {}

    const summaryText = encodeURIComponent(generateWhatsAppSummaryText());

    if (phoneOrGroupUrl && (phoneOrGroupUrl.includes('chat.whatsapp.com') || phoneOrGroupUrl.startsWith('http'))) {
      // It's a WhatsApp Group Link
      window.open(phoneOrGroupUrl, '_blank');
      setPrintStatusToast({ type: 'success', msg: 'WhatsApp Group opened! Image copied (Press Ctrl+V)' });
      setTimeout(() => setPrintStatusToast(null), 4000);
      setIsWhatsAppModalOpen(false);
      return;
    }

    const targetPhone = sanitizePhoneForWhatsApp(phoneOrGroupUrl || activePartyPhone);
    let waUrl = `https://wa.me/?text=${summaryText}`;

    if (targetPhone && targetPhone.length >= 10) {
      waUrl = `https://wa.me/${targetPhone}?text=${summaryText}`;
    }

    window.open(waUrl, '_blank');
    setPrintStatusToast({ 
      type: 'success', 
      msg: targetPhone ? `WhatsApp Web opened for ${targetPhone}! Image copied (Ctrl+V)` : 'WhatsApp opened! Image copied to clipboard (Ctrl+V)' 
    });
    setTimeout(() => setPrintStatusToast(null), 4500);
    setIsWhatsAppModalOpen(false);
  };

  const savePrimaryPhone = (num: string) => {
    const clean = num.trim();
    setPrimaryPhone(clean);
    try {
      localStorage.setItem('modern_primary_whatsapp', clean);
    } catch {}
  };

  const saveDefaultGroupLink = (link: string) => {
    const clean = link.trim();
    setCustomGroupLinkInput(clean);
    try {
      localStorage.setItem('modern_default_whatsapp_group', clean);
    } catch {}
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

          {/* Right: Settings & Close Action */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              title="Print & Page Settings"
              onClick={() => {
                try { macAudio.playClick(); } catch { }
                setIsPrintSettingsOpen(true);
              }}
              style={{
                background: isPrintSettingsOpen ? 'rgba(0, 122, 255, 0.35)' : 'rgba(255, 255, 255, 0.08)',
                border: isPrintSettingsOpen ? '1px solid #007AFF' : '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '50%',
                width: '28px',
                height: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: isPrintSettingsOpen ? '#38bdf8' : 'rgba(255, 255, 255, 0.75)',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.16)';
                e.currentTarget.style.color = '#ffffff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = isPrintSettingsOpen ? 'rgba(0, 122, 255, 0.35)' : 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.color = isPrintSettingsOpen ? '#38bdf8' : 'rgba(255, 255, 255, 0.75)';
              }}
            >
              <Settings size={14} />
            </button>

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

                <button
                  type="button"
                  title="Print & Page Settings"
                  onClick={() => {
                    try { macAudio.playClick(); } catch {}
                    setIsPrintSettingsOpen(true);
                  }}
                  style={{
                    background: isPrintSettingsOpen ? 'rgba(0, 122, 255, 0.35)' : 'transparent',
                    border: isPrintSettingsOpen ? '1px solid #007AFF' : 'none',
                    borderRadius: '9999px',
                    padding: '2px 8px',
                    fontSize: '10px',
                    fontWeight: 600,
                    color: isPrintSettingsOpen ? '#38bdf8' : 'rgba(255, 255, 255, 0.75)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    marginLeft: '3px'
                  }}
                >
                  <Settings size={11} />
                  <span>Settings</span>
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
            {/* Quick Printer Selector Bar */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.09)',
                borderRadius: '8px',
                padding: '10px 12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Printer size={13} />
                  Target Printer
                </span>
                <span style={{ fontSize: '10px', color: '#34d399', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}>
                  ⚡ High-Speed Vector
                </span>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <select
                  value={printSettings.printerName}
                  onChange={(e) => updatePrintSettings({ printerName: e.target.value })}
                  style={{
                    flex: 1,
                    height: '32px',
                    fontSize: '11.5px',
                    fontWeight: 600,
                    padding: '2px 8px',
                    background: 'rgba(0, 0, 0, 0.45)',
                    border: '1px solid rgba(255, 255, 255, 0.14)',
                    borderRadius: '6px',
                    color: '#ffffff',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="" style={{ background: '#1e293b' }}>
                    Default ({detectedPrinter || 'Windows Default'})
                  </option>
                  {availablePrinters.map(p => (
                    <option key={p} value={p} style={{ background: '#1e293b' }}>
                      {p}
                    </option>
                  ))}
                </select>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontSize: '10.5px', color: 'rgba(255, 255, 255, 0.6)' }}>Qty:</span>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={printSettings.copies}
                    onChange={(e) => updatePrintSettings({ copies: Math.max(1, parseInt(e.target.value) || 1) })}
                    style={{
                      width: '42px',
                      height: '32px',
                      textAlign: 'center',
                      fontSize: '12px',
                      fontWeight: 700,
                      background: 'rgba(0, 0, 0, 0.45)',
                      border: '1px solid rgba(255, 255, 255, 0.14)',
                      borderRadius: '6px',
                      color: '#ffffff',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Print Status Feedback Toast */}
            {printStatusToast && (
              <div
                style={{
                  padding: '8px 12px',
                  borderRadius: '7px',
                  fontSize: '11px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: printStatusToast.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                  border: `1px solid ${printStatusToast.type === 'success' ? 'rgba(16, 185, 129, 0.35)' : 'rgba(239, 68, 68, 0.35)'}`,
                  color: printStatusToast.type === 'success' ? '#6ee7b7' : '#fca5a5',
                  animation: 'fadeIn 0.15s ease-out'
                }}
              >
                <span>{printStatusToast.type === 'success' ? '✓' : '⚠'}</span>
                <span>{printStatusToast.msg}</span>
              </div>
            )}

            {/* Last Saved PDF Path Card with Copy & Open Folder buttons */}
            {lastSavedPdfPath && (
              <div
                style={{
                  background: 'rgba(56, 189, 248, 0.08)',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  animation: 'fadeIn 0.2s ease-out'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <FileCheck size={13} />
                    Saved PDF File
                  </span>
                  {isPathCopied && (
                    <span style={{ fontSize: '10px', color: '#34d399', fontWeight: 700 }}>
                      ✓ Path Copied!
                    </span>
                  )}
                </div>

                <div
                  title={lastSavedPdfPath}
                  style={{
                    fontSize: '10.5px',
                    fontFamily: 'monospace',
                    color: 'rgba(255, 255, 255, 0.9)',
                    background: 'rgba(0, 0, 0, 0.4)',
                    padding: '6px 8px',
                    borderRadius: '5px',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {lastSavedPdfPath}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={handleCopyPdfPath}
                    style={{
                      height: '28px',
                      background: isPathCopied ? 'rgba(16, 185, 129, 0.25)' : 'rgba(56, 189, 248, 0.15)',
                      border: `1px solid ${isPathCopied ? 'rgba(16, 185, 129, 0.5)' : 'rgba(56, 189, 248, 0.35)'}`,
                      color: isPathCopied ? '#6ee7b7' : '#38bdf8',
                      borderRadius: '5px',
                      fontSize: '11px',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px',
                      cursor: 'pointer'
                    }}
                  >
                    <Copy size={12} />
                    <span>{isPathCopied ? 'Copied!' : 'Copy Path'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenFolder}
                    style={{
                      height: '28px',
                      background: 'rgba(255, 255, 255, 0.07)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#e2e8f0',
                      borderRadius: '5px',
                      fontSize: '11px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px',
                      cursor: 'pointer'
                    }}
                  >
                    <FolderOpen size={12} />
                    <span>Show Folder</span>
                  </button>
                </div>
              </div>
            )}

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
              <span>{isPrintingNative ? 'Printing in 0.05s...' : 'Print (Ctrl+P)'}</span>
            </button>

            {/* Direct PDF / Dialog quick triggers */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '-4px' }}>
              <span style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.45)' }}>
                Hardware Spool (0.05s)
              </span>
              <button
                type="button"
                onClick={() => handleDirectPrint(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#38bdf8',
                  fontSize: '10px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '2px 0'
                }}
                title="Open standard system print dialog"
              >
                <span>Print Dialog (Ctrl+Shift+P)</span>
              </button>
            </div>

            {/* Multi-page Combined Image Actions (When > 1 page) */}
            {totalPages > 1 && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                <button
                  type="button"
                  onClick={() => handleCopyAsImage(true)}
                  onMouseEnter={() => { try { macAudio.playHover(); } catch { } }}
                  title="Copy ALL pages combined as one continuous long image (WhatsApp / Share)"
                  style={{
                    background: copiedCombinedSuccess
                      ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                      : 'linear-gradient(135deg, rgba(14, 165, 233, 0.25) 0%, rgba(2, 132, 199, 0.35) 100%)',
                    color: '#38bdf8',
                    border: '1px solid rgba(56, 189, 248, 0.45)',
                    height: '32px',
                    borderRadius: '7px',
                    fontWeight: 700,
                    fontSize: '11px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(14, 165, 233, 0.2)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {copiedCombinedSuccess ? <Check size={13} color="#ffffff" /> : <Layers size={13} />}
                  <span>{copiedCombinedSuccess ? 'Combined Copied!' : `Copy Combined (${totalPages} Pgs)`}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveAsImage(true)}
                  onMouseEnter={() => { try { macAudio.playHover(); } catch { } }}
                  title="Download ALL pages combined as one continuous PNG file"
                  style={{
                    background: 'rgba(56, 189, 248, 0.1)',
                    color: '#7dd3fc',
                    border: '1px solid rgba(56, 189, 248, 0.25)',
                    height: '32px',
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
                  <span>Save Combined</span>
                </button>
              </div>
            )}

            {/* Actions: Copy & Save Single/Current Page */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button
                type="button"
                onClick={() => handleCopyAsImage(false)}
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
                <span>{copiedSuccess ? 'Copied' : (totalPages > 1 ? `Copy Page ${currentPage + 1}` : 'Copy Image')}</span>
              </button>

              <button
                type="button"
                onClick={() => handleSaveAsImage(false)}
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
                <span>{totalPages > 1 ? `Save Page ${currentPage + 1}` : 'Save PNG'}</span>
              </button>
            </div>

            {/* WhatsApp Share Button */}
            <button
              type="button"
              onClick={() => {
                try { macAudio.playClick(); } catch {}
                setIsWhatsAppModalOpen(true);
              }}
              onMouseEnter={() => { try { macAudio.playHover(); } catch { } }}
              title="Share bill details & copy image to WhatsApp (Party / Primary No / Groups)"
              style={{
                background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
                color: '#ffffff',
                border: 'none',
                height: '34px',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '11.5px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: 'pointer',
                boxShadow: '0 2px 10px rgba(37, 211, 102, 0.3)',
                transition: 'all 0.15s ease'
              }}
            >
              <Send size={14} />
              <span>Send WhatsApp {activePartyPhone ? `(${activePartyPhone})` : ''}</span>
            </button>

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
                    onClick={() => handleAddAdjustment('receive', 'Receive')}
                    title="Receive amount from customer (- Subtotal) (+ shortcut)"
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
                    onClick={() => handleAddAdjustment('pay', 'Pay')}
                    title="Pay amount to customer / freight (+ Balance) (- shortcut)"
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
                        {/* Interactive Type Switcher (Receive / Pay) */}
                        {(() => {
                          const isRecv = isAdjustmentReceive(adj);
                          return (
                            <button
                              type="button"
                              onClick={() => {
                                const newType: 'pay' | 'receive' = isRecv ? 'pay' : 'receive';
                                const updated = adjustments.map(a => a.id === adj.id ? { ...a, type: newType } : a);
                                setAdjustments(updated);
                                saveAdjustmentsCache(updated, balanceLabel);
                              }}
                              title={`Click to switch between Receive (-) and Pay (+). Current: ${isRecv ? 'Receive (-)' : 'Pay (+)'}`}
                              style={{
                                background: isRecv ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                                border: `1px solid ${isRecv ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
                                color: isRecv ? '#34d399' : '#f87171',
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
                              {isRecv ? <Minus size={12} /> : <Plus size={12} />}
                            </button>
                          );
                        })()}

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
                            outline: 'none',
                            textTransform: 'capitalize'
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

                {(() => {
                  const isAdvance = finalBalance < 0;
                  const effectiveLabel = (balanceLabel && balanceLabel.trim()) ? balanceLabel.trim().toUpperCase() : (isAdvance ? 'ADVANCE' : 'BALANCE');
                  const displayBal = isAdvance ? Math.abs(finalBalance) : finalBalance;
                  return (
                    <div
                      style={{
                        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                        paddingTop: '8px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'baseline'
                      }}
                    >
                      <span style={{ fontSize: '11.5px', fontWeight: 800, color: isAdvance ? '#34d399' : '#f8fafc' }}>
                        {effectiveLabel}:
                      </span>
                      <span style={{ fontSize: '18px', fontWeight: 900, color: isAdvance ? '#34d399' : '#00F0FF', letterSpacing: '-0.02em' }}>
                        {formatIndianCurrency(displayBal)}
                      </span>
                    </div>
                  );
                })()}
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
                          handleApplyOldBalance('pay', bal, 'Lene Wala');
                        } else {
                          handleApplyOldBalance('receive', Math.abs(bal), 'Dene Wala');
                        }
                      }}
                      style={{
                        background: (activePartyRecord?.balance || 0) >= 0
                          ? 'rgba(239, 68, 68, 0.2)'
                          : 'rgba(16, 185, 129, 0.2)',
                        border: `1px solid ${(activePartyRecord?.balance || 0) >= 0 ? 'rgba(239, 68, 68, 0.4)' : 'rgba(16, 185, 129, 0.4)'}`,
                        color: (activePartyRecord?.balance || 0) >= 0 ? '#fca5a5' : '#6ee7b7',
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
                        handleApplyOldBalance('pay', amt, 'Lene Wala');
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
                      <Plus size={13} />
                      <span>+ Lene Wala (Add)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const amt = parseFloat(customOldBalanceInput) || 0;
                        handleApplyOldBalance('receive', amt, 'Dene Wala');
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

        {/* Print Settings Modal */}
        {isPrintSettingsOpen && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.75)',
              backdropFilter: 'blur(5px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 999999,
              padding: '16px'
            }}
            onClick={() => setIsPrintSettingsOpen(false)}
          >
            <div
              style={{
                width: '100%',
                maxWidth: '480px',
                background: '#13161c',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '12px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 30px rgba(56, 189, 248, 0.15)',
                overflow: 'hidden',
                animation: 'fadeIn 0.15s ease-out'
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
                  <Settings size={16} color="#38bdf8" />
                  <div>
                    <h3 style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#f8fafc' }}>
                      Print &amp; Page Settings
                    </h3>
                    <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)' }}>
                      Printer, rows limit, paper size &amp; print copies
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPrintSettingsOpen(false)}
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
              <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '70vh', overflowY: 'auto' }}>
                {/* Section 1: Printer Selection */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ fontSize: '11.5px', fontWeight: 700, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Printer size={13} color="#38bdf8" />
                      Target Printer
                    </label>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 600,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: isNativeServiceActive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        color: isNativeServiceActive ? '#34d399' : '#f87171',
                        border: `1px solid ${isNativeServiceActive ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
                      }}
                    >
                      {isNativeServiceActive ? 'Service Ready (Port 5005)' : 'Service Offline'}
                    </span>
                  </div>
                  <select
                    value={printSettings.printerName}
                    onChange={(e) => updatePrintSettings({ printerName: e.target.value })}
                    style={{
                      height: '34px',
                      fontSize: '12px',
                      fontWeight: 600,
                      padding: '4px 10px',
                      background: 'rgba(0, 0, 0, 0.35)',
                      border: '1px solid rgba(255, 255, 255, 0.14)',
                      borderRadius: '7px',
                      color: '#ffffff',
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="" style={{ background: '#1e293b' }}>
                      Default Printer {detectedPrinter ? `(${detectedPrinter})` : ''}
                    </option>
                    {availablePrinters.map(p => (
                      <option key={p} value={p} style={{ background: '#1e293b' }}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Section 2: Rows Per Page */}
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.07)',
                    borderRadius: '8px',
                    padding: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}
                >
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Rows Per Page (Page Cutoff Settings)
                  </span>

                  {/* Estimate Rows */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.85)' }}>
                        Full Estimate Rows:
                      </label>
                      <input
                        type="number"
                        min={5}
                        max={50}
                        value={printSettings.estimateRowsPerPage}
                        onChange={(e) => {
                          const val = Math.max(5, Math.min(50, parseInt(e.target.value) || 27));
                          updatePrintSettings({ estimateRowsPerPage: val });
                        }}
                        style={{
                          width: '64px',
                          height: '28px',
                          textAlign: 'center',
                          fontSize: '12px',
                          fontWeight: 700,
                          background: 'rgba(0, 0, 0, 0.4)',
                          border: '1px solid rgba(56, 189, 248, 0.3)',
                          borderRadius: '6px',
                          color: '#38bdf8',
                          outline: 'none'
                        }}
                      />
                    </div>
                    <span style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.45)', lineHeight: 1.3 }}>
                      Default: <strong>27 rows</strong>. (Standard A4 Page Height)
                    </span>
                  </div>

                  {/* Loading Slip Rows */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.85)' }}>
                        Loading Slip Rows:
                      </label>
                      <input
                        type="number"
                        min={5}
                        max={50}
                        value={printSettings.loadingSlipRowsPerPage}
                        onChange={(e) => {
                          const val = Math.max(5, Math.min(50, parseInt(e.target.value) || 27));
                          updatePrintSettings({ loadingSlipRowsPerPage: val });
                        }}
                        style={{
                          width: '64px',
                          height: '28px',
                          textAlign: 'center',
                          fontSize: '12px',
                          fontWeight: 700,
                          background: 'rgba(0, 0, 0, 0.4)',
                          border: '1px solid rgba(56, 189, 248, 0.3)',
                          borderRadius: '6px',
                          color: '#38bdf8',
                          outline: 'none'
                        }}
                      />
                    </div>
                    <span style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.45)', lineHeight: 1.3 }}>
                      Default: <strong>27 rows</strong>. (Standard A4 Page Height)
                    </span>
                  </div>
                </div>

                {/* Section 3: Paper Size & Copies */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.8)' }}>
                      Paper Size
                    </label>
                    <select
                      value={printSettings.paperSize}
                      onChange={(e) => updatePrintSettings({ paperSize: e.target.value as 'A4' | 'Letter' })}
                      style={{
                        height: '32px',
                        fontSize: '11.5px',
                        fontWeight: 600,
                        padding: '4px 8px',
                        background: 'rgba(0, 0, 0, 0.35)',
                        border: '1px solid rgba(255, 255, 255, 0.14)',
                        borderRadius: '6px',
                        color: '#ffffff',
                        outline: 'none'
                      }}
                    >
                      <option value="A4" style={{ background: '#1e293b' }}>A4 (Standard)</option>
                      <option value="Letter" style={{ background: '#1e293b' }}>Letter</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.8)' }}>
                      Print Copies
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={printSettings.copies}
                      onChange={(e) => {
                        const val = Math.max(1, Math.min(20, parseInt(e.target.value) || 1));
                        updatePrintSettings({ copies: val });
                      }}
                      style={{
                        height: '32px',
                        fontSize: '12px',
                        fontWeight: 700,
                        padding: '4px 8px',
                        textAlign: 'center',
                        background: 'rgba(0, 0, 0, 0.35)',
                        border: '1px solid rgba(255, 255, 255, 0.14)',
                        borderRadius: '6px',
                        color: '#ffffff',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>

                {/* Section 4: PDF Save Location / Output Folder */}
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.07)',
                    borderRadius: '8px',
                    padding: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <FolderOpen size={13} />
                      PDF Save Directory (Output Folder)
                    </span>
                    <span style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.5)' }}>
                      Custom or Default
                    </span>
                  </div>

                  {/* Quick Preset Buttons */}
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => updatePrintSettings({ pdfSaveDirectory: defaultDesktopPath || '' })}
                      style={{
                        padding: '4px 9px',
                        borderRadius: '5px',
                        fontSize: '10.5px',
                        fontWeight: 600,
                        background: (printSettings.pdfSaveDirectory === defaultDesktopPath || !printSettings.pdfSaveDirectory) ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.06)',
                        border: `1px solid ${(printSettings.pdfSaveDirectory === defaultDesktopPath || !printSettings.pdfSaveDirectory) ? 'rgba(56, 189, 248, 0.4)' : 'rgba(255, 255, 255, 0.1)'}`,
                        color: (printSettings.pdfSaveDirectory === defaultDesktopPath || !printSettings.pdfSaveDirectory) ? '#38bdf8' : '#cbd5e1',
                        cursor: 'pointer'
                      }}
                    >
                      🖥️ Desktop (Default)
                    </button>

                    <button
                      type="button"
                      onClick={() => updatePrintSettings({ pdfSaveDirectory: defaultDownloadsPath || '' })}
                      style={{
                        padding: '4px 9px',
                        borderRadius: '5px',
                        fontSize: '10.5px',
                        fontWeight: 600,
                        background: printSettings.pdfSaveDirectory === defaultDownloadsPath ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.06)',
                        border: `1px solid ${printSettings.pdfSaveDirectory === defaultDownloadsPath ? 'rgba(56, 189, 248, 0.4)' : 'rgba(255, 255, 255, 0.1)'}`,
                        color: printSettings.pdfSaveDirectory === defaultDownloadsPath ? '#38bdf8' : '#cbd5e1',
                        cursor: 'pointer'
                      }}
                    >
                      📥 Downloads
                    </button>

                    {printSettings.pdfSaveDirectory && (
                      <button
                        type="button"
                        onClick={() => updatePrintSettings({ pdfSaveDirectory: '' })}
                        style={{
                          padding: '4px 9px',
                          borderRadius: '5px',
                          fontSize: '10.5px',
                          fontWeight: 600,
                          background: 'rgba(255, 255, 255, 0.04)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          color: '#94a3b8',
                          cursor: 'pointer'
                        }}
                      >
                        ↺ Reset
                      </button>
                    )}
                  </div>

                  {/* Custom Directory Input */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <input
                      type="text"
                      placeholder={defaultDesktopPath ? `Default Desktop (${defaultDesktopPath})` : "Enter custom folder path (e.g. D:\\Bills)"}
                      value={printSettings.pdfSaveDirectory}
                      onChange={(e) => updatePrintSettings({ pdfSaveDirectory: e.target.value })}
                      style={{
                        height: '32px',
                        fontSize: '11.5px',
                        fontFamily: 'monospace',
                        fontWeight: 600,
                        padding: '4px 10px',
                        background: 'rgba(0, 0, 0, 0.4)',
                        border: '1px solid rgba(255, 255, 255, 0.14)',
                        borderRadius: '6px',
                        color: '#ffffff',
                        outline: 'none'
                      }}
                    />
                    <span style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.45)', lineHeight: 1.3 }}>
                      Type or paste any custom folder path. If the folder does not exist, it will be automatically created on save.
                    </span>
                  </div>
                </div>

                {/* Section 4: Print Dialog Checkbox */}
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 10px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={printSettings.showDialog}
                    onChange={(e) => updatePrintSettings({ showDialog: e.target.checked })}
                    style={{ cursor: 'pointer', accentColor: '#38bdf8' }}
                  />
                  <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.8)', userSelect: 'none' }}>
                    Always show Windows Print Dialog (Prompt printer selection)
                  </span>
                </label>

                {/* Section 5: Action Buttons */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                  <button
                    type="button"
                    onClick={() => updatePrintSettings(DEFAULT_PRINT_SETTINGS)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#94a3b8',
                      borderRadius: '7px',
                      fontSize: '11px',
                      fontWeight: 600,
                      padding: '7px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      cursor: 'pointer'
                    }}
                  >
                    <RotateCcw size={12} />
                    <span>Reset Defaults</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsPrintSettingsOpen(false)}
                    style={{
                      background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                      border: 'none',
                      color: '#ffffff',
                      borderRadius: '7px',
                      fontSize: '11.5px',
                      fontWeight: 700,
                      padding: '7px 18px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(2, 132, 199, 0.4)'
                    }}
                  >
                    <Check size={13} />
                    <span>Done</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── Missing Rate Alert Modal (Estimate & Summary Only) ─── */}
        {missingRateAlert && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.85)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              zIndex: 99999999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
              animation: 'fadeIn 0.15s ease'
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setMissingRateAlert(null);
              }
            }}
          >
            <div
              style={{
                width: '100%',
                maxWidth: '480px',
                background: '#18181b',
                border: '1.5px solid #ef4444',
                borderRadius: '18px',
                padding: '24px',
                boxShadow: '0 25px 60px -15px rgba(239, 68, 68, 0.35), 0 0 0 1px rgba(255, 255, 255, 0.1)',
                color: '#f4f4f5',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    background: 'rgba(239, 68, 68, 0.18)',
                    border: '1px solid rgba(239, 68, 68, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px'
                  }}
                >
                  ⚠️
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#f87171' }}>
                    Rate Lagana Bhul Gaye Hain!
                  </h3>
                  <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#a1a1aa' }}>
                    Missing Rate Warning ({printMode === 'estimate' ? 'Estimate' : 'Summary'} Mode)
                  </p>
                </div>
              </div>

              <p style={{ margin: 0, fontSize: '13px', color: '#e4e4e7', lineHeight: 1.5 }}>
                Print ya save karne se pehle kripya in moulds ka rate lagayein:
              </p>

              {/* Items List */}
              <div
                style={{
                  maxHeight: '170px',
                  overflowY: 'auto',
                  background: '#09090b',
                  border: '1px solid #27272a',
                  borderRadius: '10px',
                  padding: '8px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}
              >
                {missingRateAlert.items.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '4px 0',
                      borderBottom: idx < missingRateAlert.items.length - 1 ? '1px solid #1f1f23' : 'none'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '11px', color: '#71717a' }}>#{idx + 1}</span>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#38bdf8' }}>{item.mould || 'Unnamed Mould'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '12px', color: '#a1a1aa' }}>{item.qty || 0} Pcs</span>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#ef4444', background: 'rgba(239, 68, 68, 0.12)', padding: '2px 8px', borderRadius: '4px' }}>
                        Rate: ₹0
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                <button
                  type="button"
                  onClick={() => {
                    try { macAudio.playClick(); } catch {}
                    setMissingRateAlert(null);
                    onClose(); // Closes print modal so user is immediately back at the summary table to enter rate!
                  }}
                  style={{
                    flex: 1,
                    height: '38px',
                    borderRadius: '9px',
                    background: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)',
                    border: 'none',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    boxShadow: '0 4px 14px rgba(56, 189, 248, 0.35)'
                  }}
                  autoFocus
                >
                  <span>✏️ Wapas Jaake Rate Lagayein</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    try { macAudio.playClick(); } catch {}
                    const action = missingRateAlert.actionToProceed;
                    setMissingRateAlert(null);
                    action();
                  }}
                  style={{
                    height: '38px',
                    padding: '0 14px',
                    borderRadius: '9px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.16)',
                    color: '#a1a1aa',
                    fontWeight: 600,
                    fontSize: '11px',
                    cursor: 'pointer'
                  }}
                  title="Proceed without setting rate"
                >
                  <span>Bina Rate Print Karein</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════
            WHATSAPP SHARING DIALOG (Party, Primary No, Group)
        ══════════════════════════════════════════ */}
        {isWhatsAppModalOpen && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(2, 6, 23, 0.85)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              zIndex: 99999999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px'
            }}
            onClick={() => setIsWhatsAppModalOpen(false)}
          >
            <div
              className="anim-pop"
              onClick={e => e.stopPropagation()}
              style={{
                width: '460px',
                maxWidth: '94vw',
                background: '#18181b',
                border: '1px solid rgba(37, 211, 102, 0.4)',
                borderRadius: '16px',
                padding: '22px 24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                boxShadow: '0 25px 60px rgba(0, 0, 0, 0.85), 0 0 30px rgba(37, 211, 102, 0.2)',
                color: '#f4f4f5'
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '10px',
                      background: 'rgba(37, 211, 102, 0.15)',
                      border: '1px solid rgba(37, 211, 102, 0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#25D366'
                    }}
                  >
                    <Send size={18} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#f8fafc' }}>
                      Share Bill on WhatsApp
                    </h3>
                    <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>
                      Bill summary + auto copied image ready to paste (Ctrl+V)
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsWhatsAppModalOpen(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#a1a1aa',
                    cursor: 'pointer',
                    padding: '4px'
                  }}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Tabs for Destination */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', background: '#09090b', padding: '4px', borderRadius: '10px', border: '1px solid #27272a' }}>
                <button
                  type="button"
                  onClick={() => setWhatsAppTab('party')}
                  style={{
                    padding: '6px 4px',
                    borderRadius: '7px',
                    border: 'none',
                    background: whatsAppTab === 'party' ? '#25D366' : 'transparent',
                    color: whatsAppTab === 'party' ? '#09090b' : '#a1a1aa',
                    fontWeight: 700,
                    fontSize: '11px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  Party No
                </button>
                <button
                  type="button"
                  onClick={() => setWhatsAppTab('primary')}
                  style={{
                    padding: '6px 4px',
                    borderRadius: '7px',
                    border: 'none',
                    background: whatsAppTab === 'primary' ? '#25D366' : 'transparent',
                    color: whatsAppTab === 'primary' ? '#09090b' : '#a1a1aa',
                    fontWeight: 700,
                    fontSize: '11px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  Primary No
                </button>
                <button
                  type="button"
                  onClick={() => setWhatsAppTab('custom')}
                  style={{
                    padding: '6px 4px',
                    borderRadius: '7px',
                    border: 'none',
                    background: whatsAppTab === 'custom' ? '#25D366' : 'transparent',
                    color: whatsAppTab === 'custom' ? '#09090b' : '#a1a1aa',
                    fontWeight: 700,
                    fontSize: '11px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  Other No
                </button>
                <button
                  type="button"
                  onClick={() => setWhatsAppTab('group')}
                  style={{
                    padding: '6px 4px',
                    borderRadius: '7px',
                    border: 'none',
                    background: whatsAppTab === 'group' ? '#25D366' : 'transparent',
                    color: whatsAppTab === 'group' ? '#09090b' : '#a1a1aa',
                    fontWeight: 700,
                    fontSize: '11px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  Group / Web
                </button>
              </div>

              {/* TAB 1: Party Number */}
              {whatsAppTab === 'party' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ background: '#09090b', padding: '12px 14px', borderRadius: '10px', border: '1px solid #27272a' }}>
                    <div style={{ fontSize: '11px', color: '#a1a1aa', marginBottom: '2px' }}>Party Name</div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#38bdf8' }}>{displayPartyWithDistrict}</div>
                    <div style={{ fontSize: '11px', color: '#a1a1aa', marginTop: '8px', marginBottom: '2px' }}>Registered Mobile Number</div>
                    <div style={{ fontSize: '15px', fontWeight: 800, color: activePartyPhone ? '#25D366' : '#f87171' }}>
                      {activePartyPhone || 'No number saved in Party Panel!'}
                    </div>
                  </div>
                  {activePartyPhone ? (
                    <button
                      type="button"
                      onClick={() => handleSendWhatsApp(activePartyPhone)}
                      style={{
                        height: '40px',
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
                        color: '#ffffff',
                        border: 'none',
                        fontWeight: 700,
                        fontSize: '13px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        boxShadow: '0 4px 15px rgba(37, 211, 102, 0.35)'
                      }}
                    >
                      <Send size={15} />
                      <span>Send to {activePartyPhone}</span>
                    </button>
                  ) : (
                    <div style={{ fontSize: '11.5px', color: '#fbbf24', textAlign: 'center', background: 'rgba(251, 191, 36, 0.1)', padding: '8px', borderRadius: '8px', border: '1px solid rgba(251, 191, 36, 0.25)' }}>
                      💡 Tip: "Other No" tab me jakar manual number dalein ya Party panel me number save karein.
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: Primary Number (e.g. Owner/Manager main number) */}
              {whatsAppTab === 'primary' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ background: '#09090b', padding: '12px 14px', borderRadius: '10px', border: '1px solid #27272a' }}>
                    <div style={{ fontSize: '11.5px', color: '#e4e4e7', fontWeight: 600, marginBottom: '6px' }}>
                      Aapka Primary / Main WhatsApp Number
                    </div>
                    <p style={{ margin: '0 0 8px 0', fontSize: '11px', color: '#a1a1aa' }}>
                      Ye number save ho jayega taaki aap jab chahein bina dobara type kiye 1-click me kisi bhi bill ka data apne main number par bhej sakein.
                    </p>
                    <input
                      type="text"
                      placeholder="e.g. 9876543210 (10 digits)"
                      value={primaryPhone}
                      onChange={e => savePrimaryPhone(e.target.value)}
                      style={{
                        width: '100%',
                        background: '#18181b',
                        border: '1px solid #3f3f46',
                        borderRadius: '7px',
                        padding: '8px 12px',
                        color: '#ffffff',
                        fontSize: '13px',
                        fontWeight: 700,
                        outline: 'none'
                      }}
                    />
                  </div>
                  {primaryPhone && primaryPhone.replace(/[^0-9]/g, '').length >= 10 && (
                    <button
                      type="button"
                      onClick={() => handleSendWhatsApp(primaryPhone)}
                      style={{
                        height: '40px',
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
                        color: '#ffffff',
                        border: 'none',
                        fontWeight: 700,
                        fontSize: '13px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        boxShadow: '0 4px 15px rgba(37, 211, 102, 0.35)'
                      }}
                    >
                      <Send size={15} />
                      <span>Send to Primary ({primaryPhone})</span>
                    </button>
                  )}
                </div>
              )}

              {/* TAB 3: Custom / Other Number */}
              {whatsAppTab === 'custom' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ background: '#09090b', padding: '12px 14px', borderRadius: '10px', border: '1px solid #27272a' }}>
                    <div style={{ fontSize: '11.5px', color: '#e4e4e7', fontWeight: 600, marginBottom: '6px' }}>
                      Kisi Bhi Doosre Number Par Bhejein
                    </div>
                    <input
                      type="text"
                      placeholder="Mobile number dalein (e.g. 9812345678)"
                      value={customPhoneInput}
                      onChange={e => setCustomPhoneInput(e.target.value)}
                      style={{
                        width: '100%',
                        background: '#18181b',
                        border: '1px solid #3f3f46',
                        borderRadius: '7px',
                        padding: '8px 12px',
                        color: '#ffffff',
                        fontSize: '13px',
                        fontWeight: 700,
                        outline: 'none'
                      }}
                      autoFocus
                    />
                  </div>
                  <button
                    type="button"
                    disabled={!customPhoneInput.replace(/[^0-9]/g, '')}
                    onClick={() => handleSendWhatsApp(customPhoneInput)}
                    style={{
                      height: '40px',
                      borderRadius: '10px',
                      background: customPhoneInput ? 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)' : '#27272a',
                      color: customPhoneInput ? '#ffffff' : '#71717a',
                      border: 'none',
                      fontWeight: 700,
                      fontSize: '13px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      cursor: customPhoneInput ? 'pointer' : 'not-allowed',
                      boxShadow: customPhoneInput ? '0 4px 15px rgba(37, 211, 102, 0.35)' : 'none'
                    }}
                  >
                    <Send size={15} />
                    <span>Send to {customPhoneInput || 'Number'}</span>
                  </button>
                </div>
              )}

              {/* TAB 4: Group / Open Web */}
              {whatsAppTab === 'group' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ background: '#09090b', padding: '12px 14px', borderRadius: '10px', border: '1px solid #27272a' }}>
                    <div style={{ fontSize: '11.5px', color: '#e4e4e7', fontWeight: 600, marginBottom: '4px' }}>
                      👥 WhatsApp Group Mein Send Kaise Karein?
                    </div>
                    <p style={{ margin: '0 0 10px 0', fontSize: '11px', color: '#a1a1aa', lineHeight: 1.4 }}>
                      WhatsApp ka direct group number nahi hota (invite link ya WhatsApp Web kholkar select kiya jata hai). Humne bill summary text link generate kiya hai aur <b>Bill Image automatically copy</b> kar di hai. Bas open karke group me <b>Ctrl+V</b> karein!
                    </p>

                    <div style={{ fontSize: '11px', color: '#71717a', marginBottom: '4px' }}>
                      (Optional) Aapke WhatsApp Group ka Invite Link yahan save karein:
                    </div>
                    <input
                      type="text"
                      placeholder="e.g. https://chat.whatsapp.com/..."
                      value={customGroupLinkInput}
                      onChange={e => saveDefaultGroupLink(e.target.value)}
                      style={{
                        width: '100%',
                        background: '#18181b',
                        border: '1px solid #3f3f46',
                        borderRadius: '7px',
                        padding: '6px 10px',
                        color: '#ffffff',
                        fontSize: '12px',
                        outline: 'none'
                      }}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSendWhatsApp(customGroupLinkInput || '')}
                    style={{
                      height: '40px',
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
                      color: '#ffffff',
                      border: 'none',
                      fontWeight: 700,
                      fontSize: '13px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                      boxShadow: '0 4px 15px rgba(37, 211, 102, 0.35)'
                    }}
                  >
                    <Users size={16} />
                    <span>{customGroupLinkInput ? 'Open Saved Group & Share' : 'Open WhatsApp & Pick Any Group'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

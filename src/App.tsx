import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ConfigProvider, theme as antdTheme } from 'antd';
import { glassAntdTheme } from './theme/glassAntdTheme';
import './theme/antdGlassOverrides.css';
import { SQLITE_SHORTCUTS, SQLITE_BILLS, SQLITE_PARTIES } from './data/sqliteData';
import { SQLITE_CONTROL_CONVERSIONS } from './data/sqliteControlPanel';
import { SQLITE_SKIP_MAIN_GROUPS, SQLITE_SKIP_SUB_GROUPS, SQLITE_SKIP_ITEMS } from './data/sqliteSkipData';
import type { BillHeader, RawItem, FinishedItem, EnterDirection } from './types';
import { AppleHeader } from './components/AppleHeader';
import { LeftActionRail } from './components/LeftActionRail';
import { RightNavRail } from './components/RightNavRail';
import { LeftGrid } from './components/LeftGrid';
import { RightGrid } from './components/RightGrid';
import { SlipModal } from './components/SlipModal';
import { GoodsDistributionModal } from './components/GoodsDistributionModal';
import { OcrModal } from './components/OcrModal';
import { NoteModal } from './components/NoteModal';
import { JsonModal } from './components/JsonModal';
import { OtherTabsView } from './components/OtherTabsView';
import { BottomModeBar } from './components/BottomModeBar';
import type { AppMode, SavedSlipData } from './components/BottomModeBar';
import { NumpadNavigator } from './components/common/NumpadNavigator';
import { CheckCircle2, Info, AlertTriangle, Save, Trash2, X } from 'lucide-react';
import { DatabaseProvider } from './context/DatabaseContext';
import { SettingsProvider } from './context/SettingsContext';
import { localDb } from './services/db/localDb';
import type { BillRecord } from './services/db/schema';
import { loadMediaFromDB } from './services/mediaStorage';
import { LoginPanel } from './components/LoginPanel';
import { SpaceLoader } from './components/common/SpaceLoader';
import { parseProductAndSize, formatMouldWithSize, calculateProportionalPrice, extractSizeFromColLabel } from './utils/mouldUtils';

const playTapSound = () => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.05);
  } catch {}
};

const LATEST_SQLITE_BILL = (SQLITE_BILLS && SQLITE_BILLS.length > 0) ? SQLITE_BILLS[0] : null;

const INITIAL_HEADER: BillHeader = LATEST_SQLITE_BILL ? {
  docType: LATEST_SQLITE_BILL.docType || 'SALE BILL',
  partyName: LATEST_SQLITE_BILL.party || 'GOURAV - Kapurthala',
  typeSelection: LATEST_SQLITE_BILL.typeSelection || 'WHOLESALE',
  vehicleNo: LATEST_SQLITE_BILL.vehicle || '',
  date: LATEST_SQLITE_BILL.date || '2026-07-23',
  tokenNo: LATEST_SQLITE_BILL.token || '528'
} : {
  docType: 'SALE BILL',
  partyName: 'GOURAV - Kapurthala',
  typeSelection: 'WHOLESALE',
  vehicleNo: '',
  date: '2026-07-23',
  tokenNo: '528'
};

const INITIAL_RAW_ITEMS: RawItem[] = (LATEST_SQLITE_BILL && LATEST_SQLITE_BILL.rawItems && LATEST_SQLITE_BILL.rawItems.length > 0)
  ? LATEST_SQLITE_BILL.rawItems.map((r: any) => ({
      id: String(r.id),
      name: r.name,
      qty: Number(r.qty) || 0, // 10 FT
      uCap: Number(r.uCap) || 0,
      lCap: Number(r.lCap) || 0
    }))
  : [
      { id: '13217', name: 'B.F.P 185', qty: 10, uCap: 2, lCap: 0 },
      { id: '13218', name: 'S.L 716', qty: 34, uCap: 13, lCap: 4 }
    ];

const INITIAL_FINISHED_ITEMS: FinishedItem[] = (LATEST_SQLITE_BILL && LATEST_SQLITE_BILL.finishedItems && LATEST_SQLITE_BILL.finishedItems.length > 0)
  ? LATEST_SQLITE_BILL.finishedItems.map((f: any) => ({
      id: String(f.id),
      mould: f.mould,
      qty: Number(f.qty) || 0,
      price: Number(f.price) || 0,
      total: Number(f.total) || 0
    }))
  : [];

function loadStored<T>(key: string, defaultValue: T): T {
  try {
    const val = localStorage.getItem(key);
    return val !== null ? JSON.parse(val) : defaultValue;
  } catch {
    return defaultValue;
  }
}

// Dirty-state Fingerprinting Helper for accurate change detection
const getBillFingerprint = (h: BillHeader, raws: RawItem[], moulds: FinishedItem[], dynCols: any[], hasPartyCodeCol?: boolean) => {
  return JSON.stringify({
    h: {
      docType: h.docType,
      partyName: (h.partyName || '').trim(),
      typeSelection: h.typeSelection,
      vehicleNo: (h.vehicleNo || '').trim(),
      date: h.date,
      tokenNo: String(h.tokenNo || '').trim()
    },
    hasPartyCodeCol: Boolean(hasPartyCodeCol),
    raws: (raws || []).map(r => ({
      name: (r.name || '').trim(),
      partyCode: (r.partyCode || '').trim(),
      qty: Number(r.qty) || 0,
      uCap: Number(r.uCap) || 0,
      lCap: Number(r.lCap) || 0,
      ...Object.fromEntries(
        Object.entries(r).filter(([k, v]) => (k.startsWith('qty_') || k.startsWith('size_')) && Number(v) > 0)
      )
    })).filter(r => r.name !== '' || r.partyCode !== '' || r.qty > 0 || r.uCap > 0 || r.lCap > 0 || Object.keys(r).some(k => (k.startsWith('qty_') || k.startsWith('size_')) && Number((r as any)[k]) > 0)),
    moulds: (moulds || []).map(m => ({
      mould: (m.mould || '').trim(),
      qty: Number(m.qty) || 0,
      price: Number(m.price) || 0,
      total: Number(m.total) || 0
    })).filter(m => m.mould !== '' || m.qty > 0 || m.price > 0),
    dynCols: (dynCols || []).map(d => ({ field: d.field, label: d.label }))
  });
};

const isBillEmpty = (h: BillHeader, raws: RawItem[], moulds: FinishedItem[]) => {
  const hasParty = (h.partyName || '').trim().length > 0;
  const hasRaws = (raws || []).some(r => (r.name || '').trim().length > 0 || (Number(r.qty) || 0) > 0);
  const hasMoulds = (moulds || []).some(m => (m.mould || '').trim().length > 0 || (Number(m.qty) || 0) > 0);
  return !hasParty && !hasRaws && !hasMoulds;
};

function AppContent() {
  const [isGoodsModalOpen, setIsGoodsModalOpen] = useState(false);

  // 1. Persisted Header (fallback to real SQLite bill if empty or dummy)
  const [header, setHeader] = useState<BillHeader>(() => {
    const saved = loadStored('modern_app_header', INITIAL_HEADER);
    const isValid = saved && saved.tokenNo && saved.partyName && saved.partyName !== 'Apex Industrial Moldings Pvt Ltd';
    return isValid ? saved : INITIAL_HEADER;
  });
  useEffect(() => {
    localStorage.setItem('modern_app_header', JSON.stringify(header));
  }, [header]);

  // 2. Persisted Items (fallback to real SQLite bill if empty or all blank)
  const [rawItems, setRawItems] = useState<RawItem[]>(() => {
    const saved = loadStored('modern_app_raw_items', INITIAL_RAW_ITEMS);
    const hasRealItems = Array.isArray(saved) && saved.length > 0 && saved.some(it => it.name && it.name.trim() !== '');
    return hasRealItems ? saved : INITIAL_RAW_ITEMS;
  });
  useEffect(() => {
    localStorage.setItem('modern_app_raw_items', JSON.stringify(rawItems));
  }, [rawItems]);

  const [finishedItems, setFinishedItems] = useState<FinishedItem[]>(() => {
    const saved = loadStored('modern_app_finished_items', INITIAL_FINISHED_ITEMS);
    return (Array.isArray(saved) && saved.length > 0) ? saved : INITIAL_FINISHED_ITEMS;
  });
  useEffect(() => {
    localStorage.setItem('modern_app_finished_items', JSON.stringify(finishedItems));
  }, [finishedItems]);

  const [dynamicCols, setDynamicCols] = useState<{ field: string; label: string }[]>(() => {
    try {
      const saved = localStorage.getItem('modern_left_dyncols');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  useEffect(() => {
    localStorage.setItem('modern_left_dyncols', JSON.stringify(dynamicCols));
  }, [dynamicCols]);

  const [hasPartyCodeCol, setHasPartyCodeCol] = useState<boolean>(() => {
    try {
      return localStorage.getItem('modern_has_party_code_col') === 'true';
    } catch {
      return false;
    }
  });
  useEffect(() => {
    localStorage.setItem('modern_has_party_code_col', String(hasPartyCodeCol));
  }, [hasPartyCodeCol]);

  // Dirty tracking snapshot and modal state
  const lastSavedSnapshotRef = useRef<string>(getBillFingerprint(header, rawItems, finishedItems, dynamicCols, hasPartyCodeCol));
  const [confirmClearDialog, setConfirmClearDialog] = useState<{
    isOpen: boolean;
    tokenNo: string;
  } | null>(null);
  const [dialogFocus, setDialogFocus] = useState<'save' | 'discard' | 'cancel'>('save');

  // Database Save & Navigation Handlers
  const handleSaveCurrentBill = useCallback(async () => {
    // Filter out completely blank/dummy raw rows (keep only rows with actual name, qty, partyCode, dynamic feet qty, or caps)
    const validRawItems = rawItems
      .filter(r => {
        const hasName = Boolean(r.name && r.name.trim() !== '');
        const hasQty = (Number(r.qty) || 0) > 0;
        const hasPartyCode = Boolean(r.partyCode && r.partyCode.trim() !== '');
        const hasDyn = dynamicCols.some(dc => (Number((r as any)[dc.field]) || 0) > 0);
        const hasCaps = (Number(r.uCap) || 0) > 0 || (Number(r.lCap) || 0) > 0;
        return hasName || hasQty || hasPartyCode || hasDyn || hasCaps;
      })
      .map(r => ({ ...r }));

    // Filter out completely blank/dummy finished rows (keep only rows with actual mould, qty, price, or total)
    const validFinishedItems = finishedItems
      .filter(f => {
        const hasMould = Boolean(f.mould && f.mould.trim() !== '' && f.mould !== 'Mould Name' && f.mould !== '-');
        const hasQty = (Number(f.qty) || 0) > 0;
        const hasTotal = (Number(f.total) || 0) > 0;
        const hasPrice = (Number(f.price) || 0) > 0;
        return hasMould && (hasQty || hasTotal || hasPrice);
      })
      .map(f => ({ ...f }));

    const total = validFinishedItems.reduce((acc, f) => acc + (Number(f.total) || 0), 0);
    const tokenStr = String(header.tokenNo || '1');
    const billToSave: BillRecord = {
      id: `B-${tokenStr}`,
      token: tokenStr,
      date: header.date || new Date().toISOString().split('T')[0],
      party: (header?.partyName || '').trim() || 'Cash Sale',
      docType: header.docType || 'SALE BILL',
      vehicle: header.vehicleNo || '',
      typeSelection: header.typeSelection || 'WHOLESALE',
      total,
      status: 'PAID',
      rawItems: validRawItems,
      finishedItems: validFinishedItems,
      dynamicCols: dynamicCols.map(c => ({ ...c })),
      hasPartyCodeCol: Boolean(hasPartyCodeCol),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      synced: false,
      version: 1
    };

    await localDb.saveBill(billToSave);
    lastSavedSnapshotRef.current = getBillFingerprint(header, rawItems, finishedItems, dynamicCols, hasPartyCodeCol);

    // Sync to localStorage
    try {
      localStorage.setItem('modern_app_header', JSON.stringify(header));
      localStorage.setItem('modern_app_raw_items', JSON.stringify(rawItems));
      localStorage.setItem('modern_app_finished_items', JSON.stringify(finishedItems));
      localStorage.setItem('modern_left_dyncols', JSON.stringify(dynamicCols));
      localStorage.setItem('modern_has_party_code_col', String(hasPartyCodeCol));
    } catch {}

    showToast(`Bill #${billToSave.token} (${billToSave.party}) Saved Successfully!`, 'success');
    playTapSound();
  }, [header, rawItems, finishedItems, dynamicCols, hasPartyCodeCol]);

  const handlePrevBill = useCallback(() => {
    const allBills = localDb.getBills();
    if (allBills.length === 0) return;
    const currentIdx = allBills.findIndex(b => b.token === String(header.tokenNo));
    const targetIdx = currentIdx > 0 ? currentIdx - 1 : allBills.length - 1;
    const target = allBills[targetIdx];
    if (target) {
      setHeader({
        docType: target.docType,
        partyName: target.party,
        typeSelection: target.typeSelection,
        vehicleNo: target.vehicle,
        date: target.date,
        tokenNo: target.token
      });
      setRawItems(target.rawItems || []);
      setFinishedItems(target.finishedItems || []);
      setDynamicCols(target.dynamicCols || []);
      const partyCodeCol = Boolean(target.hasPartyCodeCol || target.rawItems?.some(r => r.partyCode && r.partyCode.trim() !== ''));
      setHasPartyCodeCol(partyCodeCol);
      lastSavedSnapshotRef.current = getBillFingerprint(
        {
          docType: target.docType,
          partyName: target.party,
          typeSelection: target.typeSelection,
          vehicleNo: target.vehicle,
          date: target.date,
          tokenNo: target.token
        },
        target.rawItems || [],
        target.finishedItems || [],
        target.dynamicCols || [],
        partyCodeCol
      );
      showToast(`Loaded Bill #${target.token}`, 'info');
      playTapSound();
    }
  }, [header]);

  const handleNextBill = useCallback(() => {
    const allBills = localDb.getBills();
    if (allBills.length === 0) return;
    const currentIdx = allBills.findIndex(b => b.token === String(header.tokenNo));
    const targetIdx = (currentIdx >= 0 && currentIdx + 1 < allBills.length) ? currentIdx + 1 : 0;
    const target = allBills[targetIdx];
    if (target) {
      setHeader({
        docType: target.docType,
        partyName: target.party,
        typeSelection: target.typeSelection,
        vehicleNo: target.vehicle,
        date: target.date,
        tokenNo: target.token
      });
      setRawItems(target.rawItems || []);
      setFinishedItems(target.finishedItems || []);
      setDynamicCols(target.dynamicCols || []);
      const partyCodeCol = Boolean(target.hasPartyCodeCol || target.rawItems?.some(r => r.partyCode && r.partyCode.trim() !== ''));
      setHasPartyCodeCol(partyCodeCol);
      lastSavedSnapshotRef.current = getBillFingerprint(
        {
          docType: target.docType,
          partyName: target.party,
          typeSelection: target.typeSelection,
          vehicleNo: target.vehicle,
          date: target.date,
          tokenNo: target.token
        },
        target.rawItems || [],
        target.finishedItems || [],
        target.dynamicCols || [],
        partyCodeCol
      );
      showToast(`Loaded Bill #${target.token}`, 'info');
      playTapSound();
    }
  }, [header]);

  const prevBillRef = useRef(handlePrevBill);
  prevBillRef.current = handlePrevBill;

  const nextBillRef = useRef(handleNextBill);
  nextBillRef.current = handleNextBill;

  const saveBillRef = useRef(handleSaveCurrentBill);
  saveBillRef.current = handleSaveCurrentBill;

  const calcSummaryRef = useRef<(() => void) | null>(null);
  const loadOldPriceRef = useRef<(() => void) | null>(null);

  const escapeClearRef = useRef<() => void>(() => {});
  const confirmSaveAndClearRef = useRef<() => Promise<void>>(() => Promise.resolve());
  const confirmDiscardAndClearRef = useRef<() => void>(() => {});
  const confirmClearDialogRef = useRef<{ isOpen: boolean; tokenNo: string } | null>(null);
  const dialogFocusRef = useRef<'save' | 'discard' | 'cancel'>('save');

  // Global Browser Interceptor: Disable Chrome shortcuts and Chrome native contextmenu
  useEffect(() => {
    // 1. Prevent default Chrome right-click browser menu everywhere
    const handleGlobalContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    // 2. Intercept and block Chrome default keyboard shortcuts
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // 0. Confirm Clear Dialog Modal Controls (Y: Save & New, N: Discard & New, Esc: Cancel, Arrows/Tab: navigate, Enter: confirm)
      if (confirmClearDialogRef.current?.isOpen) {
        if (e.key === 'y' || e.key === 'Y') {
          e.preventDefault();
          confirmSaveAndClearRef.current();
          return;
        }
        if (e.key === 'n' || e.key === 'N') {
          e.preventDefault();
          confirmDiscardAndClearRef.current();
          return;
        }
        if (e.key === 'Escape' || e.key === 'c' || e.key === 'C') {
          e.preventDefault();
          setConfirmClearDialog(null);
          return;
        }
        if (e.key === 'ArrowRight' || e.key === 'Tab') {
          e.preventDefault();
          setDialogFocus(prev => prev === 'save' ? 'discard' : prev === 'discard' ? 'cancel' : 'save');
          return;
        }
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          setDialogFocus(prev => prev === 'save' ? 'cancel' : prev === 'cancel' ? 'discard' : 'save');
          return;
        }
        if (e.key === 'Enter') {
          e.preventDefault();
          if (dialogFocusRef.current === 'save') confirmSaveAndClearRef.current();
          else if (dialogFocusRef.current === 'discard') confirmDiscardAndClearRef.current();
          else setConfirmClearDialog(null);
          return;
        }
        return;
      }

      // Escape key: SKIP current loaded bill or clear panel to new blank bill (only in F1/HOME)
      if (e.key === 'Escape') {
        if (activeTab === 'F1' || activeTab === 'HOME') {
          e.preventDefault();
          escapeClearRef.current();
        }
        return;
      }

      const isCtrlOrCmd = e.ctrlKey || e.metaKey;

      // Ctrl + Shift + ArrowLeft: Previous Bill
      if (isCtrlOrCmd && e.shiftKey && e.key === 'ArrowLeft') {
        e.preventDefault();
        prevBillRef.current();
        return;
      }

      // Ctrl + Shift + ArrowRight: Next Bill
      if (isCtrlOrCmd && e.shiftKey && e.key === 'ArrowRight') {
        e.preventDefault();
        nextBillRef.current();
        return;
      }

      // Ctrl+S: Instant Local DB Save
      if (isCtrlOrCmd && !e.shiftKey && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        saveBillRef.current();
        return;
      }

      // Ctrl+G or Ctrl++: Instant Calculate Left Panel into Right Panel (Mould Table)
      if (isCtrlOrCmd && (e.key === 'g' || e.key === 'G' || e.key === '+' || e.key === '=' || e.code === 'NumpadAdd')) {
        e.preventDefault();
        calcSummaryRef.current?.();
        return;
      }

      // Alt+P or Ctrl+Shift+L: Instant Load Old Price from Party History
      if ((e.altKey && (e.key === 'p' || e.key === 'P')) || (isCtrlOrCmd && e.shiftKey && (e.key === 'l' || e.key === 'L'))) {
        e.preventDefault();
        loadOldPriceRef.current?.();
        return;
      }

      // Chrome View Source (Ctrl+U)
      if (isCtrlOrCmd && (e.key === 'u' || e.key === 'U')) {
        e.preventDefault();
        return;
      }

      // Chrome Downloads (Ctrl+J)
      if (isCtrlOrCmd && (e.key === 'j' || e.key === 'J')) {
        e.preventDefault();
        return;
      }

      // Chrome History (Ctrl+H)
      if (isCtrlOrCmd && (e.key === 'h' || e.key === 'H')) {
        e.preventDefault();
        return;
      }

      // Chrome Bookmark (Ctrl+D)
      if (isCtrlOrCmd && (e.key === 'd' || e.key === 'D')) {
        e.preventDefault();
        return;
      }

      // Chrome Find (Ctrl+F, Ctrl+G)
      if (isCtrlOrCmd && (e.key === 'f' || e.key === 'F' || e.key === 'g' || e.key === 'G')) {
        e.preventDefault();
        return;
      }

      // Chrome DevTools (F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C)
      if (
        e.key === 'F12' || 
        (isCtrlOrCmd && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j' || e.key === 'C' || e.key === 'c'))
      ) {
        e.preventDefault();
        return;
      }

      // Chrome Reload (Ctrl+R, F5) -> Prevent accidental reload / loss of data
      if ((isCtrlOrCmd && (e.key === 'r' || e.key === 'R')) || e.key === 'F5') {
        e.preventDefault();
        showToast('Page Reload prevented to protect session data', 'info');
        return;
      }
    };

    window.addEventListener('contextmenu', handleGlobalContextMenu, { capture: true });
    window.addEventListener('keydown', handleGlobalKeyDown);

    return () => {
      window.removeEventListener('contextmenu', handleGlobalContextMenu, { capture: true });
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, []);

  const [activeTab, setActiveTab] = useState<any>('F1');
  const [activeMode, setActiveMode] = useState<AppMode>('ENTRY');
  const [activeTable, setActiveTable] = useState<'left' | 'right' | null>('left');

  const handleLoadSlip = (slip: SavedSlipData) => {
    setHeader({
      docType: slip.docType,
      partyName: slip.partyName,
      typeSelection: slip.typeSelection,
      vehicleNo: slip.vehicleNo,
      date: slip.date,
      tokenNo: slip.tokenNo
    });
    setRawItems(slip.rawItems || []);
    setFinishedItems(slip.finishedItems || []);
    setDynamicCols(slip.dynamicCols || []);
    lastSavedSnapshotRef.current = getBillFingerprint(
      {
        docType: slip.docType,
        partyName: slip.partyName,
        typeSelection: slip.typeSelection,
        vehicleNo: slip.vehicleNo,
        date: slip.date,
        tokenNo: slip.tokenNo
      },
      slip.rawItems || [],
      slip.finishedItems || [],
      slip.dynamicCols || []
    );
    setActiveTab('F1');
    playTapSound();
  };

  // 3. Persisted Enter Direction
  // Persisted Global Row Height (All rows scale together)
  const [rowHeight, setRowHeight] = useState<number>(() => loadStored('modern_app_row_height', 28));
  useEffect(() => {
    localStorage.setItem('modern_app_row_height', JSON.stringify(rowHeight));
  }, [rowHeight]);

    // 3b. Persisted Global Table Font Size (Text Size)
  const [tableFontSize, setTableFontSize] = useState<number>(() => loadStored('modern_app_table_font_size', 12));
  useEffect(() => {
    localStorage.setItem('modern_app_table_font_size', JSON.stringify(tableFontSize));
    document.documentElement.style.setProperty('--table-font-size', `${tableFontSize}px`);
  }, [tableFontSize]);

  const [enterDirection, setEnterDirection] = useState<EnterDirection>(() => loadStored('modern_app_enter_dir', 'right'));
  useEffect(() => {
    localStorage.setItem('modern_app_enter_dir', JSON.stringify(enterDirection));
  }, [enterDirection]);

  // 4. Persisted Split Percent
  const [splitPercent, setSplitPercent] = useState<number>(() => loadStored('modern_app_split_pct', 48));
  useEffect(() => {
    localStorage.setItem('modern_app_split_pct', JSON.stringify(splitPercent));
  }, [splitPercent]);

  const [isDraggingSplitter, setIsDraggingSplitter] = useState<boolean>(false);
  const splitContainerRef = useRef<HTMLDivElement>(null);

  // 5. Persisted Background & Styling Settings (Supports Image, Color, and Looping Motion Video)
  const [bgType, setBgType] = useState<'image' | 'color' | 'video'>(() => loadStored('modern_app_bg_type', 'image'));
  useEffect(() => {
    localStorage.setItem('modern_app_bg_type', JSON.stringify(bgType));
  }, [bgType]);

  const [bgImage, setBgImage] = useState<string>(() => loadStored('modern_app_bg_image', '/panda_bg.jpg'));
  useEffect(() => {
    localStorage.setItem('modern_app_bg_image', JSON.stringify(bgImage));
  }, [bgImage]);

  const [bgVideo, setBgVideo] = useState<string>(() => loadStored('modern_app_bg_video', '/custom_video.mp4'));
  useEffect(() => {
    try {
      if (bgVideo && !bgVideo.startsWith('blob:') && !bgVideo.startsWith('data:')) {
        localStorage.setItem('modern_app_bg_video', JSON.stringify(bgVideo));
      }
    } catch (e) {
      console.warn('LocalStorage save skipped for large video URL:', e);
    }
  }, [bgVideo]);

  // Load HD media from IndexedDB if previously uploaded by user
  useEffect(() => {
    loadMediaFromDB().then((media) => {
      if (media && media.url) {
        if (media.type === 'video') {
          setBgVideo(media.url);
          setBgType('video');
        } else {
          setBgImage(media.url);
          setBgType('image');
        }
      }
    }).catch((e) => console.warn('IndexedDB media load error:', e));
  }, []);

  const [bgColor, setBgColor] = useState<string>(() => loadStored('modern_app_bg_color', 'linear-gradient(135deg, #070b14 0%, #0d1a30 50%, #080f1e 100%)'));
  useEffect(() => {
    localStorage.setItem('modern_app_bg_color', JSON.stringify(bgColor));
  }, [bgColor]);

  const [blurAmount, setBlurAmount] = useState<number>(() => loadStored('modern_app_blur', 24));
  useEffect(() => {
    localStorage.setItem('modern_app_blur', JSON.stringify(blurAmount));
  }, [blurAmount]);

  const [dimOverlay, setDimOverlay] = useState<number>(() => loadStored('modern_app_dim', 35));
  useEffect(() => {
    localStorage.setItem('modern_app_dim', JSON.stringify(dimOverlay));
  }, [dimOverlay]);

  const [glassOpacity, setGlassOpacity] = useState<number>(() => loadStored('modern_app_glass_op', 0.55));
  useEffect(() => {
    localStorage.setItem('modern_app_glass_op', JSON.stringify(glassOpacity));
  }, [glassOpacity]);

  // Apply CSS Variables directly to documentElement for live blur & opacity changes
  useEffect(() => {
    document.documentElement.style.setProperty('--glass-blur', `${blurAmount}px`);
    document.documentElement.style.setProperty('--glass-opacity', String(glassOpacity));
  }, [blurAmount, glassOpacity]);

  // Quick Action Toggles
  const [autoConvert, setAutoConvert] = useState<boolean>(true);
  const [autoItem, setAutoItem] = useState<boolean>(false);
  const [simpleMode, setSimpleMode] = useState<boolean>(false);
  const [rowMode, setRowMode] = useState<boolean>(false);

  // Modals
  const [isSlipOpen, setIsSlipOpen] = useState<boolean>(false);
  const [isOcrOpen, setIsOcrOpen] = useState<boolean>(false);
  const [isNoteOpen, setIsNoteOpen] = useState<boolean>(false);
  const [isJsonOpen, setIsJsonOpen] = useState<boolean>(false);
  const [noteText, setNoteText] = useState<string>('Urgent delivery for Apex Industries scheduled by end of week.');

  // Notification toast disabled per user request
  const showToast = (_message: string, _type: 'success' | 'info' | 'warning' = 'info') => {
    // Disabled: no recurring top toast notifications
  };

  // Keyboard-Friendly Skip / Clear Bill Handlers
  const handleClearToNewBill = useCallback(() => {
    const allBills = localDb.getBills();
    let maxTokenNum = 0;
    allBills.forEach(b => {
      const n = parseInt(b.token, 10);
      if (!isNaN(n) && n > maxTokenNum) maxTokenNum = n;
    });
    const currentTokenNum = parseInt(String(header.tokenNo), 10);
    if (!isNaN(currentTokenNum) && currentTokenNum > maxTokenNum) {
      maxTokenNum = currentTokenNum;
    }
    const nextToken = maxTokenNum > 0 ? String(maxTokenNum + 1) : '1';
    const todayStr = new Date().toISOString().split('T')[0];

    const blankHeader: BillHeader = {
      docType: 'SALE BILL',
      partyName: '',
      typeSelection: 'WHOLESALE',
      vehicleNo: '',
      date: todayStr,
      tokenNo: nextToken
    };

    const blankRaws: RawItem[] = Array.from({ length: 10 }, (_, i) => ({
      id: String(Date.now() + i),
      name: '',
      qty: 0,
      uCap: 0,
      lCap: 0
    }));

    setHeader(blankHeader);
    setRawItems(blankRaws);
    setFinishedItems([]);
    setDynamicCols([]);

    lastSavedSnapshotRef.current = getBillFingerprint(blankHeader, blankRaws, [], []);
    setConfirmClearDialog(null);

    showToast(`New Blank Bill #${nextToken} Ready (Panel Cleared)`, 'success');
    playTapSound();

    setActiveTab('F1');

    // Automatically focus party input without requiring mouse
    setTimeout(() => {
      const partyInput = document.querySelector<HTMLInputElement>('[data-np-target="1-2"]');
      if (partyInput) {
        partyInput.focus();
        partyInput.select();
      }
    }, 80);
  }, [header.tokenNo]);

  const handleConfirmSaveAndClear = useCallback(async () => {
    await handleSaveCurrentBill();
    handleClearToNewBill();
  }, [handleSaveCurrentBill, handleClearToNewBill]);

  const handleConfirmDiscardAndClear = useCallback(() => {
    showToast(`Modifications on Bill #${header.tokenNo} discarded`, 'warning');
    handleClearToNewBill();
  }, [header.tokenNo, handleClearToNewBill]);

  const handleTriggerEscapeClear = useCallback(() => {
    // 1. If confirm dialog is already open, cancel it
    if (confirmClearDialog?.isOpen) {
      setConfirmClearDialog(null);
      return;
    }
    // 2. If sub-modals are open, close them
    if (isGoodsModalOpen) { setIsGoodsModalOpen(false); return; }
    if (isSlipOpen) { setIsSlipOpen(false); return; }
    if (isOcrOpen) { setIsOcrOpen(false); return; }
    if (isNoteOpen) { setIsNoteOpen(false); return; }
    if (isJsonOpen) { setIsJsonOpen(false); return; }

    // 3. Check if current bill is already empty
    if (isBillEmpty(header, rawItems, finishedItems)) {
      showToast('Bill is already empty / ready for typing', 'info');
      const partyInput = document.querySelector<HTMLInputElement>('[data-np-target="1-2"]');
      partyInput?.focus();
      return;
    }

    // 5. Check if dirty / modified
    const currentFingerprint = getBillFingerprint(header, rawItems, finishedItems, dynamicCols, hasPartyCodeCol);
    const isDirty = currentFingerprint !== lastSavedSnapshotRef.current;

    if (isDirty) {
      setDialogFocus('save');
      setConfirmClearDialog({
        isOpen: true,
        tokenNo: String(header.tokenNo || 'Current')
      });
      playTapSound();
    } else {
      // Clean or saved bill, clear directly to new blank bill
      handleClearToNewBill();
    }
  }, [
    confirmClearDialog,
    isGoodsModalOpen,
    isSlipOpen,
    isOcrOpen,
    isNoteOpen,
    isJsonOpen,
    activeTab,
    header,
    rawItems,
    finishedItems,
    dynamicCols,
    hasPartyCodeCol,
    handleClearToNewBill
  ]);

  escapeClearRef.current = handleTriggerEscapeClear;
  confirmSaveAndClearRef.current = handleConfirmSaveAndClear;
  confirmDiscardAndClearRef.current = handleConfirmDiscardAndClear;
  confirmClearDialogRef.current = confirmClearDialog;
  dialogFocusRef.current = dialogFocus;

  // Draggable Splitter mouse event handlers
  const handleMouseDownSplitter = () => {
    setIsDraggingSplitter(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingSplitter || !splitContainerRef.current) return;
      const rect = splitContainerRef.current.getBoundingClientRect();
      const relativeX = e.clientX - rect.left;
      const newPercent = (relativeX / rect.width) * 100;
      if (newPercent >= 18 && newPercent <= 82) {
        setSplitPercent(newPercent);
      }
    };

    const handleMouseUp = () => {
      if (isDraggingSplitter) setIsDraggingSplitter(false);
    };

    if (isDraggingSplitter) {
      document.body.style.userSelect = 'none';
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      document.body.style.userSelect = 'text';
    }
    return () => {
      document.body.style.userSelect = 'text';
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingSplitter]);

  // Handlers for Raw Items
  const handleUpdateRawItem = (id: string, field: keyof RawItem, value: any) => {
    setRawItems(prev => prev.map(it => it.id === id ? { ...it, [field]: value } : it));
  };

  const handleAddRawItem = () => {
    const newId = 'raw-' + Date.now();
    setRawItems(prev => [
      ...prev,
      { id: newId, name: '', qty: 0, uCap: 0, lCap: 0 }
    ]);
  };

  const handleInsertRawRow = (index: number) => {
    const newId = 'raw-ins-' + Date.now();
    setRawItems(prev => {
      const copy = [...prev];
      copy.splice(index, 0, { id: newId, name: '', qty: 0, uCap: 0, lCap: 0 });
      return copy;
    });
    showToast(`Inserted Row at #${index + 1}`, 'info');
  };

  
  const handleReorderRawItems = (fromIndex: number, toIndex: number) => {
    setRawItems(prev => {
      const copy = [...prev];
      const [moved] = copy.splice(fromIndex, 1);
      copy.splice(toIndex, 0, moved);
      return copy;
    });
    showToast(`Moved Row #${fromIndex + 1} to #${toIndex + 1}`, 'info');
  };

  const handleReorderFinishedItems = (fromIndex: number, toIndex: number) => {
    setFinishedItems(prev => {
      const copy = [...prev];
      const [moved] = copy.splice(fromIndex, 1);
      copy.splice(toIndex, 0, moved);
      return copy;
    });
    showToast(`Moved Row #${fromIndex + 1} to #${toIndex + 1}`, 'info');
  };

  const handleDeleteRawRows = (indices: number[]) => {
    setRawItems(prev => prev.filter((_, idx) => !indices.includes(idx)));
    showToast(`Deleted ${indices.length} Row(s)`, 'warning');
  };

  const handleClearRawCells = (cells: { rowIndex: number; colIndex: number; field?: string }[]) => {
    setRawItems(prev => {
      const next = [...prev];
      cells.forEach(({ rowIndex, colIndex, field }) => {
        if (next[rowIndex]) {
          const item = { ...next[rowIndex] } as any;
          if (field) {
            item[field] = (field === 'name' || field === 'partyCode') ? '' : 0;
          } else {
            if (colIndex === 0) item.name = '';
            else if (hasPartyCodeCol && colIndex === 1) item.partyCode = '';
            else if (colIndex === 1) item.qty = 0;
            else if (colIndex === 2) item.uCap = 0;
            else if (colIndex === 3) item.lCap = 0;
          }
          next[rowIndex] = item;
        }
      });
      return next;
    });
    showToast(`Cleared ${cells.length} Cell(s)`, 'info');
  };

  // Intelligent Excel Paste for Raw Items: Overwrites starting at (startRow, startCol) or appends
  const handleBulkPasteRaw = (rows: string[][], startRow?: number, startCol: number = 0) => {
    setRawItems(prev => {
      const next = [...prev];
      const actualStart = startRow !== undefined ? startRow : next.length;

      rows.forEach((r, rIdx) => {
        const targetRowIdx = actualStart + rIdx;
        const nameVal = r[0] !== undefined ? r[0] : '';
        const qtyVal = parseInt(r[1]) || 0;
        const uCapVal = parseInt(r[2]) || 0;
        const lCapVal = parseInt(r[3]) || 0;

        if (targetRowIdx < next.length) {
          const current = { ...next[targetRowIdx] };
          if (startCol <= 0 && r[0] !== undefined) current.name = nameVal;
          if (startCol <= 1 && r[1] !== undefined) current.qty = qtyVal;
          if (startCol <= 2 && r[2] !== undefined) current.uCap = uCapVal;
          if (startCol <= 3 && r[3] !== undefined) current.lCap = lCapVal;
          next[targetRowIdx] = current;
        } else {
          next.push({
            id: 'raw-paste-' + Date.now() + '-' + rIdx,
            name: nameVal || ('Item ' + (targetRowIdx + 1)),
            qty: qtyVal,
            uCap: uCapVal,
            lCap: lCapVal
          });
        }
      });
      return next;
    });
    showToast(`Pasted ${rows.length} row(s) into table!`, 'success');
  };

  // Handlers for Finished Items
  const handleUpdateFinishedItem = (id: string, field: keyof FinishedItem, value: any) => {
    setFinishedItems(prev => {
      const targetItem = prev.find(it => it.id === id);
      if (!targetItem) return prev;

      if (field === 'price') {
        const newPrice = Number(value) || 0;
        const targetParsed = parseProductAndSize(targetItem.mould);

        // If target item has a product name and valid price, propagate proportionally to same products
        if (targetParsed.baseProduct && newPrice > 0) {
          const targetNorm = targetParsed.normalizedBase;
          const targetSize = targetParsed.size > 0 ? targetParsed.size : 10;
          let affectedOtherCount = 0;

          const updated = prev.map(it => {
            if (it.id === id) {
              return { ...it, price: newPrice, total: (Number(it.qty) || 0) * newPrice };
            }
            if (it.mould) {
              const otherParsed = parseProductAndSize(it.mould);
              const otherPrice = Number(it.price) || 0;
              // User Rule: Only auto-fill when price is NOT already set (otherPrice === 0)
              if (otherParsed.normalizedBase === targetNorm && targetNorm.length > 0 && otherPrice === 0) {
                const otherSize = otherParsed.size > 0 ? otherParsed.size : 10;
                const propPrice = calculateProportionalPrice(newPrice, targetSize, otherSize);
                affectedOtherCount++;
                return { ...it, price: propPrice, total: (Number(it.qty) || 0) * propPrice };
              }
            }
            return it;
          });

          if (affectedOtherCount > 0) {
            showToast(`Auto-filled ${targetParsed.baseProduct} size rate(s) proportionally!`, 'info');
          }
          return updated;
        }

        return prev.map(it => it.id === id ? { ...it, price: newPrice, total: (Number(it.qty) || 0) * newPrice } : it);
      }

      if (field === 'qty') {
        const newQty = Number(value) || 0;
        return prev.map(it => it.id === id ? { ...it, qty: newQty, total: newQty * (Number(it.price) || 0) } : it);
      }

      if (field === 'total') {
        const newTotal = Number(value) || 0;
        return prev.map(it => it.id === id ? { ...it, total: newTotal } : it);
      }

      if (field === 'mould') {
        const newMould = String(value || '');
        const targetParsed = parseProductAndSize(newMould);
        let derivedPrice = targetItem.price;

        // Auto-derive price only if current price is 0
        if (targetParsed.baseProduct && (!derivedPrice || derivedPrice === 0)) {
          const targetNorm = targetParsed.normalizedBase;
          const targetSize = targetParsed.size > 0 ? targetParsed.size : 10;

          // Find if any other row already has a rate for this base product
          const matchExisting = prev.find(it => {
            if (it.id === id || !it.mould || !((Number(it.price) || 0) > 0)) return false;
            return parseProductAndSize(it.mould).normalizedBase === targetNorm;
          });

          if (matchExisting) {
            const matchParsed = parseProductAndSize(matchExisting.mould);
            const matchSize = matchParsed.size > 0 ? matchParsed.size : 10;
            derivedPrice = calculateProportionalPrice(Number(matchExisting.price), matchSize, targetSize);
          }
        }

        return prev.map(it => it.id === id ? {
          ...it,
          mould: newMould,
          price: derivedPrice,
          total: (Number(it.qty) || 0) * derivedPrice
        } : it);
      }

      return prev.map(it => it.id === id ? { ...it, [field]: value } : it);
    });
  };

  const handleAddFinishedItem = () => {
    const newId = 'fin-' + Date.now();
    setFinishedItems(prev => [
      ...prev,
      { id: newId, mould: '', qty: 0, price: 0, total: 0 }
    ]);
  };

  const handleInsertFinishedRow = (index: number) => {
    const newId = 'fin-ins-' + Date.now();
    setFinishedItems(prev => {
      const copy = [...prev];
      copy.splice(index, 0, { id: newId, mould: '', qty: 0, price: 0, total: 0 });
      return copy;
    });
    showToast(`Inserted Row at #${index + 1}`, 'info');
  };

  const handleDeleteFinishedRows = (indices: number[]) => {
    setFinishedItems(prev => prev.filter((_, idx) => !indices.includes(idx)));
    showToast(`Deleted ${indices.length} Row(s)`, 'warning');
  };

  const handleJumpToRightGrid = (row: number) => {
    setActiveTable('right');
    if (row >= finishedItems.length) {
      const newId = 'fin-' + Date.now();
      setFinishedItems(prev => [
        ...prev,
        { id: newId, mould: '', qty: 0, price: 0, total: 0 }
      ]);
    }
    setTimeout(() => {
      const rightInput = document.getElementById(`right-cell-${row}-0`) as HTMLInputElement;
      if (rightInput) {
        rightInput.focus();
        rightInput.select();
      }
    }, 45);
  };

  const handleJumpToLeftGrid = (row: number) => {
    setActiveTable('left');
    if (row >= rawItems.length) {
      const newId = 'raw-' + Date.now();
      setRawItems(prev => [
        ...prev,
        { id: newId, name: '', qty: 0, uCap: 0, lCap: 0 }
      ]);
    }
    const lastCol = (hasPartyCodeCol ? 3 : 2) + dynamicCols.length;
    setTimeout(() => {
      const leftInput = document.getElementById(`left-cell-${row}-${lastCol}`) as HTMLInputElement;
      if (leftInput) {
        leftInput.focus();
        leftInput.select();
      }
    }, 45);
  };

  const handleClearFinishedCells = (cells: { rowIndex: number; colIndex: number }[]) => {
    setFinishedItems(prev => {
      const next = [...prev];
      cells.forEach(({ rowIndex, colIndex }) => {
        if (next[rowIndex]) {
          const item = { ...next[rowIndex] };
          if (colIndex === 0) item.mould = '';
          if (colIndex === 1) { item.qty = 0; item.total = 0; }
          if (colIndex === 2) { item.price = 0; item.total = 0; }
          next[rowIndex] = item;
        }
      });
      return next;
    });
    showToast(`Cleared ${cells.length} Cell(s)`, 'info');
  };

  // Helper to group raw items into mould and cap totals (shared by Ctrl+G and Load Old Price)
  // EXACT LOGIC from F:\SUMMARY\BillApp\main.py lines 8088-8170
  const groupRawItemsForSummary = useCallback((rawList: RawItem[], dynCols: { field: string; label: string }[]) => {
    const itemSummary: { [mouldName: string]: number } = {};
    const groupSummary: { [groupName: string]: number } = {};

    // 1. Active conversions from Manage Conversions (localStorage or fallback SQLite control panel)
    let activeConversions: any[] = SQLITE_CONTROL_CONVERSIONS;
    try {
      const saved = localStorage.getItem('billapp_conversions') || localStorage.getItem('ctrl_conv_rules_v3');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          activeConversions = parsed;
        }
      }
    } catch {}

    // Sort by conversion string length (longest first), exactly matching main.py line 8099:
    // control_data_sorted = sorted(control_data, key=lambda x: len(str(x[1])), reverse=True)
    const sortedConversions = [...activeConversions].sort((a: any, b: any) => {
      const lenB = String(b.conversion || '').trim().length;
      const lenA = String(a.conversion || '').trim().length;
      return lenB - lenA;
    });

    // 2. Load Skip Items from localStorage or use Seed
    let skipMainGroups = SQLITE_SKIP_MAIN_GROUPS;
    let skipSubGroups = SQLITE_SKIP_SUB_GROUPS;
    let skipItems = SQLITE_SKIP_ITEMS;
    try {
      const isClean = localStorage.getItem('billapp_skip_version_v5');
      if (isClean) {
        const ms = localStorage.getItem('billapp_skip_main_groups'); if (ms) skipMainGroups = JSON.parse(ms);
        const ss = localStorage.getItem('billapp_skip_sub_groups'); if (ss) skipSubGroups = JSON.parse(ss);
        const is = localStorage.getItem('billapp_skip_items'); if (is) skipItems = JSON.parse(is);
      }
    } catch {}

    const sortedSkipItems = [...skipItems].sort((a: any, b: any) => ((b.itemPrefix || '').length - (a.itemPrefix || '').length));

    rawList.forEach(it => {
      const name = (it.name || '').trim();
      if (!name) return;

      const qty10 = Number(it.qty) || 0;
      const uCap = Number(it.uCap) || 0;
      const lCap = Number(it.lCap) || 0;
      const nameLower = name.toLowerCase();

      // Find matching conversion (longest conversion first)
      let matchedConv = '';
      let uGroup = '';
      let lGroup = '';

      for (const sc of sortedConversions) {
        const conv = String(sc.conversion || '').trim();
        const code = String(sc.shortcut || '').trim();
        const convLower = conv.toLowerCase();
        const codeLower = code.toLowerCase();

        const matchByConv = conv && (
          nameLower === convLower ||
          nameLower.startsWith(convLower + ' ') ||
          nameLower.startsWith(convLower + '-') ||
          nameLower.startsWith(convLower)
        );

        const matchByCode = code && (
          nameLower === codeLower ||
          nameLower.startsWith(codeLower + ' ') ||
          (nameLower.startsWith(codeLower) && name.length > code.length)
        );

        if (matchByConv || matchByCode) {
          matchedConv = conv;
          const rawU = String(sc.u_cap !== undefined ? sc.u_cap : (sc.uCap || '')).trim();
          const rawL = String(sc.l_cap !== undefined ? sc.l_cap : (sc.lCap || '')).trim();
          uGroup = (!['0', '0.0', 'none', 'null', 'undefined', ''].includes(rawU.toLowerCase())) ? rawU : '';
          lGroup = (!['0', '0.0', 'none', 'null', 'undefined', ''].includes(rawL.toLowerCase())) ? rawL : '';
          break;
        }
      }

      // 3. Check Skip Items (for special sub-group QTY summing)
      let isSkipQty = false;
      const matchedSkipItem = sortedSkipItems.find((si: any) => {
        const pfx = (si.itemPrefix || '').toLowerCase().trim();
        if (!pfx) return false;
        return nameLower === pfx || nameLower.startsWith(pfx + ' ') || nameLower.startsWith(pfx + '-') || nameLower.startsWith(pfx + '/');
      });

      if (matchedSkipItem) {
        const subGrp = skipSubGroups.find((sg: any) => 
          sg.id === matchedSkipItem.subGroupId || 
          sg.groupName === matchedSkipItem.subGroupId ||
          (sg.groupName === matchedSkipItem.groupName && (!matchedSkipItem.mainGroup || sg.mainGroup === matchedSkipItem.mainGroup))
        );
        if (subGrp) {
          const sumCol = subGrp.sumColumn || 'QTY';
          const baseName = subGrp.groupName || subGrp.id;

          if (sumCol === 'QTY') {
            isSkipQty = true;
            if (qty10 > 0) {
              const key10 = formatMouldWithSize(baseName, 10);
              itemSummary[key10] = (itemSummary[key10] || 0) + qty10;
            }
            if (dynCols && dynCols.length > 0) {
              dynCols.forEach(col => {
                const colQty = Number((it as any)[col.field]) || 0;
                if (colQty > 0) {
                  const size = extractSizeFromColLabel(col.label || col.field);
                  const keyCol = formatMouldWithSize(baseName, size);
                  itemSummary[keyCol] = (itemSummary[keyCol] || 0) + colQty;
                }
              });
            }
          } else if (sumCol === 'U CAP') {
            if (uCap > 0) {
              groupSummary[baseName] = (groupSummary[baseName] || 0) + uCap;
            }
          } else if (sumCol === 'L CAP') {
            if (lCap > 0) {
              groupSummary[baseName] = (groupSummary[baseName] || 0) + lCap;
            }
          }
        }
      }

      // 4. Normal Item QTY summing (when not overridden by skip sub-group)
      if (!isSkipQty) {
        const baseMould = matchedConv || (name.includes(' ') ? name.split(' ')[0] : name);

        if (qty10 > 0) {
          const key10 = formatMouldWithSize(baseMould, 10);
          itemSummary[key10] = (itemSummary[key10] || 0) + qty10;
        }

        if (dynCols && dynCols.length > 0) {
          dynCols.forEach(col => {
            const colQty = Number((it as any)[col.field]) || 0;
            if (colQty > 0) {
              const size = extractSizeFromColLabel(col.label || col.field);
              const keyCol = formatMouldWithSize(baseMould, size);
              itemSummary[keyCol] = (itemSummary[keyCol] || 0) + colQty;
            }
          });
        }
      }

      // 5. U CAP & L CAP SUMMING: Exact logic as main.py lines 8164-8169
      // In main.py:
      // if matched_conversion:
      //     if u_group and u_group not in ['0', '0.0', 'None']:
      //         dict_groups[u_group] += ucap_val
      //     if l_group and l_group not in ['0', '0.0', 'None']:
      //         dict_groups[l_group] += lcap_val
      if (uCap > 0) {
        const targetU = uGroup || (matchedConv ? '' : 'Fluted Jointer');
        if (targetU) {
          groupSummary[targetU] = (groupSummary[targetU] || 0) + uCap;
        }
      }

      if (lCap > 0) {
        const targetL = lGroup || (matchedConv ? '' : 'Jointer');
        if (targetL) {
          groupSummary[targetL] = (groupSummary[targetL] || 0) + lCap;
        }
      }
    });

    return { itemSummary, groupSummary };
  }, []);

  // Left Panel -> Right Panel Summary Calculation Engine (Ctrl+G)
  // Groups quantities accurately. Does NOT inject default rates automatically (rates stay 0 unless user typed/loaded)
  const calculateRightGridFromLeft = useCallback(() => {
    const { itemSummary, groupSummary } = groupRawItemsForSummary(rawItems, dynamicCols);

    const totalCalculated = Object.keys(itemSummary).length + Object.keys(groupSummary).length;
    if (totalCalculated === 0) {
      showToast('Left Table is empty! Enter items & quantities first.', 'warning');
      return;
    }

    const newMoulds: FinishedItem[] = [];
    let idCounter = 1;

    // 1. Grouped Mould Items (Sorted by base mould name and descending by size)
    const sortedItemEntries = Object.entries(itemSummary).sort(([nameA], [nameB]) => {
      const baseA = nameA.replace(/\s*\([\d.]+(?:\s*ft)?\)/i, '').trim();
      const baseB = nameB.replace(/\s*\([\d.]+(?:\s*ft)?\)/i, '').trim();
      if (baseA !== baseB) return baseA.localeCompare(baseB);
      const matchA = nameA.match(/([\d]+(?:\.[\d]+)?)/);
      const matchB = nameB.match(/([\d]+(?:\.[\d]+)?)/);
      const sA = matchA ? parseFloat(matchA[1]) : 0;
      const sB = matchB ? parseFloat(matchB[1]) : 0;
      return sB - sA;
    });

    sortedItemEntries.forEach(([mouldName, sumQty]) => {
      const parsed = parseProductAndSize(mouldName);
      const targetNorm = parsed.normalizedBase;
      const targetSize = parsed.size > 0 ? parsed.size : 10;

      // 1. Check if this exact mould already has an existing price entered by user
      const exactExisting = finishedItems.find(m => {
        if (!m?.mould || !((Number(m.price) || 0) > 0)) return false;
        return m.mould.trim().toLowerCase() === mouldName.trim().toLowerCase();
      });

      let price = 0;
      if (exactExisting && Number(exactExisting.price) > 0) {
        price = Number(exactExisting.price);
      } else {
        // 2. Check if finishedItems has ANY other size of this product with price entered by user
        const otherExisting = finishedItems.find(m => {
          if (!m?.mould || !((Number(m.price) || 0) > 0)) return false;
          return parseProductAndSize(m.mould).normalizedBase === targetNorm;
        });

        if (otherExisting) {
          const existParsed = parseProductAndSize(otherExisting.mould);
          const existSize = existParsed.size > 0 ? existParsed.size : 10;
          price = calculateProportionalPrice(Number(otherExisting.price), existSize, targetSize);
        } else {
          // No arbitrary default rate! Keep rate = 0
          price = 0;
        }
      }

      newMoulds.push({
        id: 'fin-calc-' + idCounter++,
        mould: mouldName,
        qty: sumQty,
        price: price,
        total: sumQty * price
      });
    });

    // 2. Grouped Caps (Fluted Jointer / Jointer)
    Object.entries(groupSummary).forEach(([groupName, sumQty]) => {
      const pKey = groupName.toLowerCase();
      const existing = finishedItems.find(m => (m?.mould || '').toLowerCase() === pKey);
      const price = (existing && Number(existing.price) > 0) ? Number(existing.price) : 0;
      newMoulds.push({
        id: 'fin-calc-' + idCounter++,
        mould: groupName,
        qty: sumQty,
        price: price,
        total: sumQty * price
      });
    });

    while (newMoulds.length < 10) {
      newMoulds.push({ id: 'fin-empty-' + idCounter++, mould: '', qty: 0, price: 0, total: 0 });
    }

    setFinishedItems(newMoulds);
    playTapSound();
    showToast(`⚡ Calculated Right Panel: ${totalCalculated} Groups/Moulds (Ctrl+G)`, 'success');
  }, [rawItems, dynamicCols, finishedItems, groupRawItemsForSummary, playTapSound]);
  calcSummaryRef.current = calculateRightGridFromLeft;

  // Load Old Price from Party History:
  // Scans history for the same person/party, finds each item/mould, and picks the LATEST rate (most recent bill)
  const handleLoadOldPriceFromHistory = useCallback(() => {
    const currentParty = (header?.partyName || '').trim();
    if (!currentParty) {
      showToast('Please enter or select a Party Name first!', 'warning');
      return;
    }

    const allBills = localDb.getBills();
    if (!allBills || allBills.length === 0) {
      showToast('No bills in database history!', 'info');
      return;
    }

    const cleanCurrentParty = currentParty.toLowerCase().replace(/[-–—(),.]/g, ' ').replace(/\s+/g, ' ').trim();
    const currentPartyRoot = currentParty.split('-')[0].trim().toLowerCase();

    // Filter bills for the same party/person
    const partyBills = allBills.filter(b => {
      if (!b.party) return false;
      const bParty = b.party.trim();
      const cleanBParty = bParty.toLowerCase().replace(/[-–—(),.]/g, ' ').replace(/\s+/g, ' ').trim();
      const bPartyRoot = bParty.split('-')[0].trim().toLowerCase();

      // Don't compare bill to current draft token if editing
      if (b.token === String(header.tokenNo)) return false;

      // Exact or clean match
      if (bParty.toLowerCase() === currentParty.toLowerCase() || cleanBParty === cleanCurrentParty) {
        return true;
      }
      // Station or prefix match (e.g., "Gourav" vs "Gourav - Kapurthala")
      if (currentPartyRoot.length >= 3 && (bPartyRoot === currentPartyRoot || cleanBParty.includes(currentPartyRoot) || cleanCurrentParty.includes(bPartyRoot))) {
        return true;
      }
      return false;
    });

    if (partyBills.length === 0) {
      showToast(`No previous bill history found for "${currentParty}"`, 'info');
      return;
    }

    // Sort bills strictly from LATEST/NEWEST to OLDEST:
    // 1. Date (most recent first)
    // 2. Token number (highest first)
    // 3. UpdatedAt/CreatedAt (latest first)
    const sortedBills = [...partyBills].sort((a, b) => {
      const timeA = a.date ? new Date(a.date).getTime() : 0;
      const timeB = b.date ? new Date(b.date).getTime() : 0;
      if (!isNaN(timeA) && !isNaN(timeB) && timeA !== timeB) {
        return timeB - timeA;
      }
      const tokA = parseInt(a.token, 10);
      const tokB = parseInt(b.token, 10);
      if (!isNaN(tokA) && !isNaN(tokB) && tokA !== tokB) {
        return tokB - tokA;
      }
      return (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0);
    });

    // Check if finishedItems is already populated or if we should derive it from rawItems
    let workingMoulds: FinishedItem[] = [];
    const validExistingFinished = finishedItems.filter(f => f.mould && f.mould.trim() !== '' && f.mould !== 'Mould Name' && f.mould !== '-');

    if (validExistingFinished.length > 0) {
      workingMoulds = finishedItems.map(f => ({ ...f }));
    } else {
      // Build moulds from rawItems
      const { itemSummary, groupSummary } = groupRawItemsForSummary(rawItems, dynamicCols);
      let idCounter = 1;

      const sortedItemEntries = Object.entries(itemSummary).sort(([nameA], [nameB]) => {
        const baseA = nameA.replace(/\s*\([\d.]+(?:\s*ft)?\)/i, '').trim();
        const baseB = nameB.replace(/\s*\([\d.]+(?:\s*ft)?\)/i, '').trim();
        if (baseA !== baseB) return baseA.localeCompare(baseB);
        const matchA = nameA.match(/([\d]+(?:\.[\d]+)?)/);
        const matchB = nameB.match(/([\d]+(?:\.[\d]+)?)/);
        const sA = matchA ? parseFloat(matchA[1]) : 0;
        const sB = matchB ? parseFloat(matchB[1]) : 0;
        return sB - sA;
      });

      sortedItemEntries.forEach(([mouldName, sumQty]) => {
        workingMoulds.push({
          id: 'fin-calc-' + idCounter++,
          mould: mouldName,
          qty: sumQty,
          price: 0,
          total: 0
        });
      });

      Object.entries(groupSummary).forEach(([groupName, sumQty]) => {
        workingMoulds.push({
          id: 'fin-calc-' + idCounter++,
          mould: groupName,
          qty: sumQty,
          price: 0,
          total: 0
        });
      });

      if (workingMoulds.length === 0) {
        showToast('Please enter items in Left Table first!', 'warning');
        return;
      }
    }

    let updatedCount = 0;
    const tokensUsed = new Set<string>();

    const updatedFinishedItems = workingMoulds.map(item => {
      const mouldName = (item.mould || '').trim();
      if (!mouldName || mouldName === 'Mould Name' || mouldName === '-') {
        return item;
      }

      const parsedTarget = parseProductAndSize(mouldName);
      const targetNorm = parsedTarget.normalizedBase;
      const targetSize = parsedTarget.size > 0 ? parsedTarget.size : 10;

      let foundPrice: number | null = null;
      let matchedToken: string | null = null;

      // Scan through party's bills from LATEST (newest) to OLDEST
      // As soon as we find a rate for this product in the nearest bill, we take it and STOP!
      for (const bill of sortedBills) {
        if (!bill.finishedItems || bill.finishedItems.length === 0) continue;

        // 1. Exact match on mould name (e.g. "B.F.P (10)" or "Fluted Jointer" or "Jointer")
        const exactMatch = bill.finishedItems.find(f => {
          if (!f.mould || !((Number(f.price) || 0) > 0)) return false;
          return f.mould.trim().toLowerCase() === mouldName.toLowerCase();
        });

        if (exactMatch) {
          foundPrice = Number(exactMatch.price);
          matchedToken = bill.token;
          break; // LATEST RATE FOUND! Do NOT look at older bills!
        }

        // 2. Normalized product match with proportional size calculation
        // e.g. historical bill had "B.F.P" (standard 10 FT) at 320, current item is "B.F.P (12)"
        const baseMatch = bill.finishedItems.find(f => {
          if (!f.mould || !((Number(f.price) || 0) > 0)) return false;
          const parsed = parseProductAndSize(f.mould);
          return parsed.normalizedBase === targetNorm && targetNorm.length > 0;
        });

        if (baseMatch) {
          const matchParsed = parseProductAndSize(baseMatch.mould);
          const matchSize = matchParsed.size > 0 ? matchParsed.size : 10;
          foundPrice = calculateProportionalPrice(Number(baseMatch.price), matchSize, targetSize);
          matchedToken = bill.token;
          break; // LATEST RATE FOUND! Do NOT look at older bills!
        }
      }

      if (foundPrice !== null && foundPrice > 0) {
        updatedCount++;
        if (matchedToken) tokensUsed.add(matchedToken);
        const qty = Number(item.qty) || 0;
        return {
          ...item,
          price: foundPrice,
          total: qty * foundPrice
        };
      }

      return item;
    });

    while (updatedFinishedItems.length < 10) {
      updatedFinishedItems.push({
        id: 'fin-empty-' + (updatedFinishedItems.length + 1),
        mould: '',
        qty: 0,
        price: 0,
        total: 0
      });
    }

    setFinishedItems(updatedFinishedItems);

    if (updatedCount > 0) {
      macAudio.playSuccess();
      const tokenList = Array.from(tokensUsed).map(t => `#${t}`).join(', ');
      showToast(`⚡ Loaded latest rate(s) for "${currentParty}" (${updatedCount} items from Bill ${tokenList})`, 'success');
    } else {
      showToast(`Found history for "${currentParty}", but no previous rates recorded for these items`, 'info');
    }
  }, [header, finishedItems, rawItems, dynamicCols, groupRawItemsForSummary, showToast]);
  loadOldPriceRef.current = handleLoadOldPriceFromHistory;

  const handleBulkPasteFinished = (rows: string[][], startRow?: number, startCol: number = 0) => {
    setFinishedItems(prev => {
      const next = [...prev];
      const actualStart = startRow !== undefined ? startRow : next.length;

      rows.forEach((r, rIdx) => {
        const targetRowIdx = actualStart + rIdx;
        const mouldVal = r[0] !== undefined ? r[0] : '';
        const qtyVal = parseInt(r[1]) || 0;
        const priceVal = parseFloat(r[2]) || 0;

        if (targetRowIdx < next.length) {
          const current = { ...next[targetRowIdx] };
          if (startCol <= 0 && r[0] !== undefined) current.mould = mouldVal;
          if (startCol <= 1 && r[1] !== undefined) current.qty = qtyVal;
          if (startCol <= 2 && r[2] !== undefined) current.price = priceVal;
          current.total = current.qty * current.price;
          next[targetRowIdx] = current;
        } else {
          next.push({
            id: 'fin-paste-' + Date.now() + '-' + rIdx,
            mould: mouldVal || ('Mould ' + (targetRowIdx + 1)),
            qty: qtyVal,
            price: priceVal,
            total: qtyVal * priceVal
          });
        }
      });
      return next;
    });
    showToast(`Pasted ${rows.length} mould(s) into table!`, 'success');
  };

  // Quick Action Toggles
  const handleToggle = (key: 'autoConvert' | 'autoItem' | 'simpleMode' | 'rowMode') => {
    if (key === 'autoConvert') setAutoConvert(v => !v);
    if (key === 'autoItem') setAutoItem(v => !v);
    if (key === 'simpleMode') setSimpleMode(v => !v);
    if (key === 'rowMode') setRowMode(v => !v);
    showToast('Toggle Updated', 'info');
  };

  return (
    <div 
      style={{
        position: 'relative',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Dynamic Background: Wallpaper Image, Motion Video, or Solid / Gradient Color */}
      {bgType === 'video' ? (
        <video
          key={bgVideo}
          className="apple-wallpaper"
          src={bgVideo}
          autoPlay
          loop
          muted
          playsInline
          onLoadedData={(e) => {
            (e.target as HTMLVideoElement).play().catch(() => {});
          }}
          onError={(e) => {
            console.warn('Background video load error:', bgVideo, e);
          }}
          style={{
            position: 'fixed',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            filter: `blur(${blurAmount * 0.4}px)`,
            transform: 'scale(1.05)',
            pointerEvents: 'none',
            zIndex: 0
          }}
        />
      ) : bgType === 'image' ? (
        <div 
          className="apple-wallpaper"
          style={{
            backgroundImage: `url(${bgImage})`,
            filter: `blur(${blurAmount * 0.4}px)`,
            transform: 'scale(1.05)'
          }}
        />
      ) : (
        <div 
          className="apple-wallpaper"
          style={{
            background: bgColor,
            filter: `blur(${blurAmount * 0.4}px)`
          }}
        />
      )}

      {/* Background Overlay */}
      <div 
        className="apple-wallpaper-overlay"
        style={{
          backgroundColor: `rgba(5, 7, 12, ${dimOverlay / 100})`
        }}
      />

      {/* Main App Container */}
      <div 
        style={{
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          padding: '12px 14px',
          gap: '10px'
        }}
      >
        {/* Workspace Container: Bill UI (F1) vs Dedicated Module (F2-F10) */}
        {(activeTab === 'HOME' || activeTab === 'F1') ? (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, gap: '10px' }}>
            {/* Top Bill Header */}
            <AppleHeader
              header={header}
              onChange={(up) => setHeader(h => ({ ...h, ...up }))}
              onCloseApp={() => showToast('Apple App Session Active', 'info')}
              onAddNewParty={(name) => showToast(`Added "${name}" to Party Registry`, 'success')}
              onSkipBill={handleTriggerEscapeClear}
              onSaveBill={handleSaveCurrentBill}
            />

            {/* Center Workspace */}
            <div style={{ display: 'flex', flex: 1, gap: '12px', minHeight: 0, overflow: 'visible' }}>
              {/* Left Action Rail */}
              <LeftActionRail
                onSummary={calculateRightGridFromLeft}
                onLoadOldPrice={handleLoadOldPriceFromHistory}
                onSave={handleSaveCurrentBill}
                onPrintSlip={() => setIsSlipOpen(true)}
                onAddRawRow={handleAddRawItem}
                onOpenOcr={() => setIsOcrOpen(true)}
                onOpenNote={() => setIsNoteOpen(true)}
                onPartyCode={() => showToast('Party Code Dialog', 'info')}
                onRecheck={() => showToast('Totals Verified Clean', 'success')}
                onSpeakSelection={() => showToast('Voice: Reading Selection', 'info')}
                onCombine={() => showToast('Items Combined', 'info')}
                onExportJson={() => setIsJsonOpen(true)}
                onReset={handleTriggerEscapeClear}
                onPrevRecord={handlePrevBill}
                onNextRecord={handleNextBill}
              />

              {/* Grids Area with Draggable Splitter & Bottom Mode Bar */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', height: '100%', minHeight: 0 }}>
                <div 
                  ref={splitContainerRef}
                  style={{ 
                    flex: 1, 
                    display: 'flex', 
                    gap: '0px', 
                    height: '100%', 
                    minHeight: 0, 
                    position: 'relative' 
                  }}
                >
                  {/* LEFT GRID */}
                  <div style={{ width: `${splitPercent}%`, height: '100%', minWidth: '180px' }}>
                    <LeftGrid
                      autoConvert={autoConvert}
                      autoItem={autoItem}
                      rowHeight={rowHeight}
                      onSetRowHeight={setRowHeight}
                      tableFontSize={tableFontSize}
                      onSetTableFontSize={setTableFontSize}
                      items={rawItems}
                      onUpdateItem={handleUpdateRawItem}
                      onBulkPaste={handleBulkPasteRaw}
                      onAddNewRow={handleAddRawItem}
                      onInsertRow={handleInsertRawRow}
                      onDeleteRows={handleDeleteRawRows}
                      onReorderItems={handleReorderRawItems}
                      onClearCells={handleClearRawCells}
                      onToast={showToast}
                      onJumpToRightGrid={handleJumpToRightGrid}
                      onCalculateSummary={calculateRightGridFromLeft}
                      onLoadOldPrice={handleLoadOldPriceFromHistory}
                      dynamicCols={dynamicCols}
                      onSetDynamicCols={setDynamicCols}
                      hasPartyCodeCol={hasPartyCodeCol}
                      onTogglePartyCodeCol={setHasPartyCodeCol}
                      enterDirection={enterDirection}
                      onSetEnterDirection={(dir) => {
                        setEnterDirection(dir);
                        showToast(`Enter Jump Direction: ${dir.toUpperCase()}`, 'info');
                      }}
                    />
                  </div>

                  {/* DRAGGABLE SPLIT RESIZER BAR */}
                  <div 
                    className={'split-resizer ' + (isDraggingSplitter ? 'dragging' : '')}
                    onMouseDown={handleMouseDownSplitter}
                    title="Drag to resize tables (Left / Right)"
                  />

                  {/* RIGHT GRID */}
                  <div style={{ width: `${100 - splitPercent}%`, height: '100%', minWidth: '180px' }}>
                    <RightGrid
                      autoConvert={autoConvert}
                      autoItem={autoItem}
                      rowHeight={rowHeight}
                      onSetRowHeight={setRowHeight}
                      tableFontSize={tableFontSize}
                      onSetTableFontSize={setTableFontSize}
                      items={finishedItems}
                      onUpdateItem={handleUpdateFinishedItem}
                      onBulkPaste={handleBulkPasteFinished}
                      onAddNewRow={handleAddFinishedItem}
                      onInsertRow={handleInsertFinishedRow}
                      onDeleteRows={handleDeleteFinishedRows}
                      onReorderItems={handleReorderFinishedItems}
                      onClearCells={handleClearFinishedCells}
                      onToast={showToast}
                      onJumpToLeftGrid={handleJumpToLeftGrid}
                      onLoadOldPrice={handleLoadOldPriceFromHistory}
                      enterDirection={enterDirection}
                      onSetEnterDirection={(dir) => {
                        setEnterDirection(dir);
                        showToast(`Enter Jump Direction: ${dir.toUpperCase()}`, 'info');
                      }}
                    />
                  </div>
                </div>

                {/* Bottom Mode Bar: 3 Modes + Instant Slip Search to Load */}
                <BottomModeBar
                  autoConvert={autoConvert}
                  autoItem={autoItem}
                  simpleMode={simpleMode}
                  onToggle={handleToggle}
                  activeMode={activeMode}
                  onChangeMode={(m) => {
                    setActiveMode(m);
                    showToast(`Mode switched to ${m}`, 'info');
                  }}
                  onLoadSlipData={handleLoadSlip}
                  onToast={showToast}
                />
              </div>

              {/* Right Navigation Rail */}
              <RightNavRail
                activeTab={activeTab}
                onCloseApp={() => showToast('App Closed', 'info')}
                onSelectTab={(t) => {
                  setActiveTab(t);
                }}
              />
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flex: 1, gap: '12px', height: '100%', minHeight: 0 }}>
            {/* Dedicated Full Height Module Workspace (F2 - F10) */}
            <div style={{ flex: 1, height: '100%', minHeight: 0 }}>
              <OtherTabsView
                activeTab={activeTab}
                onBackToBill={() => setActiveTab('F1')}
                onLoadBillToEditor={(bill: any) => {
                  setHeader({
                    docType: bill.docType,
                    partyName: bill.party,
                    typeSelection: bill.typeSelection || 'WHOLESALE',
                    vehicleNo: bill.vehicle || '',
                    date: bill.date,
                    tokenNo: bill.token
                  });
                  const loadedRaws = (bill.rawItems || []).map((r: any) => ({ ...r }));
                  const padCount = Math.max(0, 10 - loadedRaws.length);
                  for (let i = 0; i < padCount; i++) {
                    loadedRaws.push({
                      id: String(Date.now() + i),
                      name: '',
                      qty: 0,
                      uCap: 0,
                      lCap: 0
                    });
                  }
                  setRawItems(loadedRaws);

                  const loadedFinished = (bill.finishedItems || []).map((f: any) => ({ ...f }));
                  const padFinishedCount = Math.max(0, 8 - loadedFinished.length);
                  for (let i = 0; i < padFinishedCount; i++) {
                    loadedFinished.push({
                      id: String(Date.now() + 50 + i),
                      mould: 'Mould Name',
                      qty: 0,
                      price: 0,
                      total: 0
                    });
                  }
                  setFinishedItems(loadedFinished);
                  setDynamicCols(bill.dynamicCols || []);
                  const partyCodeCol = Boolean(bill.hasPartyCodeCol || bill.rawItems?.some((r: any) => r.partyCode && r.partyCode.trim() !== ''));
                  setHasPartyCodeCol(partyCodeCol);
                  lastSavedSnapshotRef.current = getBillFingerprint(
                    {
                      docType: bill.docType,
                      partyName: bill.party,
                      typeSelection: bill.typeSelection || 'WHOLESALE',
                      vehicleNo: bill.vehicle || '',
                      date: bill.date,
                      tokenNo: bill.token
                    },
                    loadedRaws,
                    loadedFinished,
                    bill.dynamicCols || [],
                    partyCodeCol
                  );
                  setActiveTab('F1');
                  showToast('Loaded Invoice #' + bill.token + ' into Bill UI', 'success');
                }}
                onSelectPartyForBill={(pName: string) => {
                  setHeader(prev => ({ ...prev, partyName: pName }));
                  setActiveTab('F1');
                  showToast(`Selected Party "${pName}" for new bill`, 'success');
                }}
                bgType={bgType}
                onChangeBgType={(t) => {
                  setBgType(t);
                  showToast(`Switched to ${t.toUpperCase()} Background`, 'info');
                }}
                bgImage={bgImage}
                onSelectBgImage={(url) => {
                  setBgImage(url);
                  showToast('Wallpaper Updated', 'success');
                }}
                bgVideo={bgVideo}
                onSelectBgVideo={(url) => {
                  setBgVideo(url);
                  showToast('Motion Video Wallpaper Updated', 'success');
                }}
                bgColor={bgColor}
                onChangeBgColor={(c) => {
                  setBgColor(c);
                  showToast('Background Color Updated', 'success');
                }}
                blurAmount={blurAmount}
                onChangeBlur={(val) => {
                  setBlurAmount(val);
                  document.documentElement.style.setProperty('--glass-blur', `${val}px`);
                }}
                overlayOpacity={dimOverlay / 100}
                onChangeOpacity={(val) => {
                  setDimOverlay(Math.round(val * 100));
                }}
                glassOpacity={glassOpacity}
                onChangeGlassOpacity={(val) => {
                  setGlassOpacity(val);
                  document.documentElement.style.setProperty('--glass-opacity', String(val));
                }}
                rowHeight={rowHeight}
                onSetRowHeight={setRowHeight}
                tableFontSize={tableFontSize}
                onSetTableFontSize={setTableFontSize}
              />
            </div>

            {/* Right Navigation Rail */}
            <RightNavRail
              activeTab={activeTab}
              onCloseApp={() => showToast('App Closed', 'info')}
              onSelectTab={(t) => {
                setActiveTab(t);
              }}
            />
          </div>
        )}
      </div>

      {/* Apple Modals */}
            {/* Goods Distribution & GST Calculator (Ctrl+G) */}
      <GoodsDistributionModal
        isOpen={isGoodsModalOpen}
        onClose={() => setIsGoodsModalOpen(false)}
        rawItems={rawItems}
        finishedItems={finishedItems}
        onToast={showToast}
      />

      <SlipModal
        isOpen={isSlipOpen}
        onClose={() => setIsSlipOpen(false)}
        header={header}
        rawItems={rawItems}
        finishedItems={finishedItems}
      />

      <OcrModal
        isOpen={isOcrOpen}
        onClose={() => setIsOcrOpen(false)}
        onApplyOcrData={(raws: any[], moulds: any[]) => {
          if (raws && raws.length) setRawItems(prev => [...prev, ...raws]);
          if (moulds && moulds.length) setFinishedItems(prev => [...prev, ...moulds]);
          showToast(`OCR Imported Data!`, 'success');
        }}
      />

      <NoteModal
        isOpen={isNoteOpen}
        onClose={() => setIsNoteOpen(false)}
        note={noteText}
        onSaveNote={(txt) => {
          setNoteText(txt);
          showToast('Note Updated', 'success');
        }}
      />

      <JsonModal
        isOpen={isJsonOpen}
        onClose={() => setIsJsonOpen(false)}
        data={{ header, rawItems, finishedItems }}
        onImport={(imported) => {
          if (imported.header) setHeader(imported.header);
          if (imported.rawItems) setRawItems(imported.rawItems);
          if (imported.finishedItems) setFinishedItems(imported.finishedItems);
          showToast('Data Imported', 'success');
        }}
      />

      {/* Keyboard-Friendly Confirm Clear / Skip Bill Modal */}
      {confirmClearDialog?.isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999999
          }}
          onClick={() => setConfirmClearDialog(null)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '540px',
              maxWidth: '92vw',
              background: 'rgba(18, 22, 30, 0.96)',
              backdropFilter: 'blur(28px)',
              WebkitBackdropFilter: 'blur(28px)',
              border: '1px solid rgba(255, 255, 255, 0.16)',
              borderRadius: '16px',
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.8), 0 0 1px 1px rgba(255, 255, 255, 0.1)',
              padding: '24px 28px',
              color: '#f8fafc',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px'
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
              <div 
                style={{ 
                  width: '44px', 
                  height: '44px', 
                  borderRadius: '12px', 
                  background: 'rgba(245, 158, 11, 0.15)', 
                  border: '1px solid rgba(245, 158, 11, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <AlertTriangle size={22} color="#fbbf24" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#ffffff', letterSpacing: '-0.3px' }}>
                    Unsaved Changes in Bill #{confirmClearDialog.tokenNo}
                  </h3>
                  <span style={{ 
                    fontSize: '11px', 
                    padding: '2px 7px', 
                    borderRadius: '999px', 
                    background: 'rgba(239, 68, 68, 0.2)', 
                    color: '#fca5a5', 
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    fontWeight: 600
                  }}>
                    MODIFIED
                  </span>
                </div>
                <p style={{ margin: '6px 0 0 0', fontSize: '13px', color: '#94a3b8', lineHeight: 1.5 }}>
                  Aapne is bill me changes kiye hain. Kya aap ise <strong style={{ color: '#34d399' }}>SAVE</strong> karke new bill kholna chahte hain ya changes <strong style={{ color: '#f87171' }}>DISCARD</strong> karna chahte hain?
                </p>
              </div>
            </div>

            {/* Buttons Options Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginTop: '4px' }}>
              {/* Save & Clear [Y] */}
              <button
                type="button"
                onClick={handleConfirmSaveAndClear}
                onMouseEnter={() => setDialogFocus('save')}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '14px 10px',
                  borderRadius: '12px',
                  background: dialogFocus === 'save' ? 'rgba(34, 197, 94, 0.22)' : 'rgba(34, 197, 94, 0.08)',
                  border: dialogFocus === 'save' ? '2px solid #22c55e' : '1px solid rgba(34, 197, 94, 0.35)',
                  boxShadow: dialogFocus === 'save' ? '0 0 18px rgba(34, 197, 94, 0.35)' : 'none',
                  color: '#86efac',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  outline: 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Save size={16} />
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>Save & Clear</span>
                </div>
                <kbd style={{
                  fontSize: '11px',
                  padding: '2px 8px',
                  borderRadius: '5px',
                  background: 'rgba(0, 0, 0, 0.45)',
                  border: '1px solid rgba(34, 197, 94, 0.4)',
                  color: '#4ade80',
                  fontWeight: 700
                }}>
                  Press Y
                </kbd>
              </button>

              {/* Discard & Clear [N] */}
              <button
                type="button"
                onClick={handleConfirmDiscardAndClear}
                onMouseEnter={() => setDialogFocus('discard')}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '14px 10px',
                  borderRadius: '12px',
                  background: dialogFocus === 'discard' ? 'rgba(239, 68, 68, 0.22)' : 'rgba(239, 68, 68, 0.08)',
                  border: dialogFocus === 'discard' ? '2px solid #ef4444' : '1px solid rgba(239, 68, 68, 0.35)',
                  boxShadow: dialogFocus === 'discard' ? '0 0 18px rgba(239, 68, 68, 0.35)' : 'none',
                  color: '#fca5a5',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  outline: 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Trash2 size={16} />
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>Discard & Clear</span>
                </div>
                <kbd style={{
                  fontSize: '11px',
                  padding: '2px 8px',
                  borderRadius: '5px',
                  background: 'rgba(0, 0, 0, 0.45)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  color: '#f87171',
                  fontWeight: 700
                }}>
                  Press N
                </kbd>
              </button>

              {/* Cancel / Keep Editing [Esc] */}
              <button
                type="button"
                onClick={() => setConfirmClearDialog(null)}
                onMouseEnter={() => setDialogFocus('cancel')}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '14px 10px',
                  borderRadius: '12px',
                  background: dialogFocus === 'cancel' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                  border: dialogFocus === 'cancel' ? '2px solid #94a3b8' : '1px solid rgba(255, 255, 255, 0.15)',
                  boxShadow: dialogFocus === 'cancel' ? '0 0 18px rgba(255, 255, 255, 0.2)' : 'none',
                  color: '#e2e8f0',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  outline: 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <X size={16} />
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>Keep Editing</span>
                </div>
                <kbd style={{
                  fontSize: '11px',
                  padding: '2px 8px',
                  borderRadius: '5px',
                  background: 'rgba(0, 0, 0, 0.45)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  color: '#cbd5e1',
                  fontWeight: 700
                }}>
                  Press Esc
                </kbd>
              </button>
            </div>

            {/* Keyboard Footer Tip */}
            <div 
              style={{
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                paddingTop: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '11.5px',
                color: '#64748b'
              }}
            >
              <span>💡 Keyboard Fast Controls:</span>
              <div style={{ display: 'flex', gap: '12px' }}>
                <span><strong style={{ color: '#34d399' }}>[Y]</strong> Save</span>
                <span><strong style={{ color: '#f87171' }}>[N]</strong> Discard</span>
                <span><strong style={{ color: '#94a3b8' }}>[Esc]</strong> Cancel</span>
                <span><strong style={{ color: '#38bdf8' }}>[← / →]</strong> Select</span>
                <span><strong style={{ color: '#38bdf8' }}>[Enter]</strong> Apply</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NumPad Shortcut Navigator (Press '.' on NumPad) */}
      <NumpadNavigator 
        isActiveTabBill={activeTab === 'HOME' || activeTab === 'F1'} 
        onToast={showToast} 
      />

    </div>
  );
}

export default function App() {
  // Set to true temporarily to bypass login panel during development
  const [isAuthenticated, setIsAuthenticated] = React.useState(true);
  const [isAppLoading, setIsAppLoading] = React.useState(true);

  React.useEffect(() => {
    const timer = setTimeout(() => setIsAppLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  if (isAppLoading) {
    return <SpaceLoader text="Loading System..." />;
  }

  if (!isAuthenticated) {
    return <LoginPanel onLogin={handleLogin} />;
  }

  return (
    <ConfigProvider theme={{ ...glassAntdTheme, algorithm: antdTheme.darkAlgorithm }}>
      <DatabaseProvider>
        <SettingsProvider>
          <AppContent />
        </SettingsProvider>
      </DatabaseProvider>
    </ConfigProvider>
  );
}
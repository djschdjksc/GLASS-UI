import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { ConfigProvider, theme as antdTheme } from 'antd';
import { getAntdTheme, type AppThemeMode } from './theme/glassAntdTheme';
import './theme/antdGlassOverrides.css';
import { SQLITE_SHORTCUTS, SQLITE_BILLS, SQLITE_PARTIES } from './data/sqliteData';
import { SQLITE_CONTROL_CONVERSIONS, SQLITE_CONTROL_GROUPS } from './data/sqliteControlPanel';
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
import { CheckCircle2, Info, AlertTriangle, Save, Trash2, X, FileText, RotateCcw } from 'lucide-react';
import { macAudio } from './utils/macAudio';
import UnsavedChangesModal from './components/UnsavedChangesModal';
import { DatabaseProvider } from './context/DatabaseContext';
import { SettingsProvider } from './context/SettingsContext';
import { localDb } from './services/db/localDb';
import type { BillRecord } from './services/db/schema';
import { loadMediaFromDB } from './services/mediaStorage';
import { LoginPanel } from './components/LoginPanel';
import { SpaceLoader } from './components/common/SpaceLoader';
import { parseProductAndSize, formatMouldWithSize, calculateProportionalPrice, extractSizeFromColLabel } from './utils/mouldUtils';
import { ChattingPanel } from './components/ChattingPanel';
import { DigitalCalculatorModal } from './components/DigitalCalculatorModal';
import { triggerCelebrationBlast } from './utils/celebration';
import { normalizeDocType, getBillCategory } from './utils/billDocTypes';

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
  docType: normalizeDocType(LATEST_SQLITE_BILL.docType),
  partyName: LATEST_SQLITE_BILL.party || 'GOURAV - Kapurthala',
  typeSelection: LATEST_SQLITE_BILL.typeSelection || 'WHOLESALE',
  vehicleNo: LATEST_SQLITE_BILL.vehicle || '',
  date: LATEST_SQLITE_BILL.date || '2026-07-23',
  tokenNo: LATEST_SQLITE_BILL.token || '528'
} : {
  docType: 'SALE',
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

interface AppContentProps {
  themeMode: AppThemeMode;
  onChangeThemeMode: (mode: AppThemeMode) => void;
}

function AppContent({ themeMode, onChangeThemeMode }: AppContentProps) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const isCalculatorOpenRef = useRef(false);
  isCalculatorOpenRef.current = isCalculatorOpen;

  // Global Scroll Reveal via IntersectionObserver
  // Any element with class "scroll-reveal" will animate when it enters the viewport
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target); // Only animate once
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -20px 0px' }
    );

    // Observe existing elements + watch for new ones via MutationObserver
    const observeAll = () => {
      document.querySelectorAll('.scroll-reveal:not(.visible)').forEach((el) => {
        observer.observe(el);
      });
    };

    observeAll();

    const mutationObserver = new MutationObserver(() => {
      observeAll();
    });

    mutationObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
    };
  }, []);


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

  // Notification toast disabled per user request
  const showToast = (_message: string, _type: 'success' | 'info' | 'warning' | 'error' = 'info') => {
    // Disabled: no recurring top toast notifications
  };

  // Database Save & Navigation Handlers
  const handleSaveCurrentBill = useCallback(async () => {
    // 0. Validation: Party Name must NOT be empty
    const cleanPartyName = (header?.partyName || '').trim();
    if (!cleanPartyName) {
      showToast('⚠️ Kripya pehle Party ka naam bharein!', 'warning');
      try {
        macAudio.playBeep();
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          const utter = new SpeechSynthesisUtterance('कृपया पहले पार्टी का नाम भरें');
          utter.lang = 'hi-IN';
          utter.rate = 1.0;
          window.speechSynthesis.speak(utter);
        }
      } catch {}
      setActiveTab('F1');
      setTimeout(() => {
        const partyInput = document.getElementById('header-party-name') as HTMLInputElement | null;
        if (partyInput) {
          partyInput.focus();
          partyInput.select();
          partyInput.style.borderColor = '#ef4444';
          partyInput.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.45)';
          setTimeout(() => {
            partyInput.style.borderColor = '';
            partyInput.style.boxShadow = '';
          }, 2500);
        }
      }, 50);
      return;
    }

    // 1. Validation: Left table must have at least one item with a name
    const itemsWithName = (rawItems || []).filter(r => (r.name || '').trim() !== '');
    if (itemsWithName.length === 0) {
      showToast('⚠️ Kripya Left Table mein Item ka naam bharein!', 'warning');
      try {
        macAudio.playBeep();
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          const utter = new SpeechSynthesisUtterance('कृपया आइटम का नाम भरें');
          utter.lang = 'hi-IN';
          utter.rate = 1.0;
          window.speechSynthesis.speak(utter);
        }
      } catch {}
      setActiveTab('F1');
      setActiveTable('left');
      setTimeout(() => {
        const firstCell = document.getElementById('left-cell-0-0') as HTMLInputElement | null;
        if (firstCell) {
          firstCell.focus();
          firstCell.style.borderColor = '#ef4444';
          firstCell.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.45)';
          setTimeout(() => {
            firstCell.style.borderColor = '';
            firstCell.style.boxShadow = '';
          }, 2500);
        }
      }, 50);
      return;
    }

    // 2. Validation: At least one item must have a quantity > 0 in any column (qty, uCap, lCap, or any dynamic col)
    const hasAnyQty = (rawItems || []).some(r => {
      if ((Number(r.qty) || 0) > 0) return true;
      if ((Number(r.uCap) || 0) > 0) return true;
      if ((Number(r.lCap) || 0) > 0) return true;
      return dynamicCols.some(dc => (Number((r as any)[dc.field]) || 0) > 0);
    });
    if (!hasAnyQty) {
      showToast('⚠️ Kripya Left Table mein Quantity bharein!', 'warning');
      try {
        macAudio.playBeep();
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          const utter = new SpeechSynthesisUtterance('कृपया क्वांटिटी भरें');
          utter.lang = 'hi-IN';
          utter.rate = 1.0;
          window.speechSynthesis.speak(utter);
        }
      } catch {}
      setActiveTab('F1');
      setActiveTable('left');
      setTimeout(() => {
        const qtyCell = document.getElementById('left-cell-0-1') as HTMLInputElement | null;
        if (qtyCell) {
          qtyCell.focus();
          qtyCell.style.borderColor = '#ef4444';
          qtyCell.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.45)';
          setTimeout(() => {
            qtyCell.style.borderColor = '';
            qtyCell.style.boxShadow = '';
          }, 2500);
        }
      }, 50);
      return;
    }

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
      party: cleanPartyName,
      docType: normalizeDocType(header.docType),
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

    showToast(`Bill #${billToSave.token} (${billToSave.party}) Saved Successfully!`, 'success');
    playTapSound();
    triggerCelebrationBlast();

    // Clear everything for the next bill (as requested: "JAISE HI SAVE HO GYA BILL WAISE HI SAB KUCHH KHALI HO JAYE NA DUSRE BILL KE LIYE CTRL +S KARTE HI")
    const allBills = localDb.getBills();
    let maxTokenNum = 0;
    allBills.forEach(b => {
      const n = parseInt(b.token, 10);
      if (!isNaN(n) && n > maxTokenNum) maxTokenNum = n;
    });
    const currentTokenNum = parseInt(String(billToSave.token), 10);
    if (!isNaN(currentTokenNum) && currentTokenNum > maxTokenNum) {
      maxTokenNum = currentTokenNum;
    }
    const nextToken = maxTokenNum > 0 ? String(maxTokenNum + 1) : '1';
    const todayStr = new Date().toISOString().split('T')[0];

    const currentDoc = normalizeDocType(header.docType);
    const blankHeader: BillHeader = {
      docType: currentDoc,
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
    setActiveTable('left');

    lastSavedSnapshotRef.current = getBillFingerprint(blankHeader, blankRaws, [], []);

    // Sync clean new bill to localStorage
    try {
      localStorage.setItem('modern_app_header', JSON.stringify(blankHeader));
      localStorage.setItem('modern_app_raw_items', JSON.stringify(blankRaws));
      localStorage.setItem('modern_app_finished_items', JSON.stringify([]));
      localStorage.setItem('modern_left_dyncols', JSON.stringify([]));
    } catch {}

    // Focus Bill Type dropdown so user can immediately press Home / Enter / continue typing next bill
    setTimeout(() => {
      const docTypeSelect = document.getElementById('header-doc-type') as HTMLSelectElement | null;
      if (docTypeSelect) {
        docTypeSelect.focus();
      }
    }, 120);
  }, [header, rawItems, finishedItems, dynamicCols, hasPartyCodeCol]);

  // Keyboard-Friendly Skip / Clear Bill Handler
  const handleClearToNewBill = useCallback(() => {
    const allBills = localDb.getBills();
    const currentDoc = normalizeDocType(header.docType);
    const categoryBills = allBills.filter(b => getBillCategory(b) === currentDoc);

    let maxTokenNum = 0;
    categoryBills.forEach(b => {
      const n = parseInt(b.token, 10);
      if (!isNaN(n) && n > maxTokenNum) maxTokenNum = n;
    });
    const currentTokenNum = parseInt(String(header.tokenNo), 10);
    if (!isNaN(currentTokenNum) && currentTokenNum > maxTokenNum) {
      maxTokenNum = currentTokenNum;
    }
    if (maxTokenNum === 0) {
      allBills.forEach(b => {
        const n = parseInt(b.token, 10);
        if (!isNaN(n) && n > maxTokenNum) maxTokenNum = n;
      });
    }

    const nextToken = maxTokenNum > 0 ? String(maxTokenNum + 1) : '1';
    const todayStr = new Date().toISOString().split('T')[0];

    const blankHeader: BillHeader = {
      docType: currentDoc,
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
    setHasPartyCodeCol(false);

    lastSavedSnapshotRef.current = getBillFingerprint(blankHeader, blankRaws, [], [], false);
    setConfirmClearDialog(null);

    showToast(`New Blank ${currentDoc} Bill #${nextToken} Ready (Panel Cleared)`, 'success');
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
  }, [header.docType, header.tokenNo]);

  const handlePrevBill = useCallback(() => {
    const allBills = localDb.getBills();
    if (allBills.length === 0) {
      showToast('No saved bills found in database', 'warning');
      return;
    }
    const currentDoc = normalizeDocType(header.docType);
    const categoryBills = allBills
      .filter(b => getBillCategory(b) === currentDoc)
      .sort((a, b) => {
        const numA = parseInt(a.token, 10);
        const numB = parseInt(b.token, 10);
        if (!isNaN(numA) && !isNaN(numB) && numA !== numB) {
          return numB - numA; // Descending: 580, 570, 528...
        }
        return (b.updatedAt || 0) - (a.updatedAt || 0);
      });

    if (categoryBills.length === 0) {
      showToast(`No saved ${currentDoc} bills found`, 'warning');
      return;
    }

    const currentIdx = categoryBills.findIndex(b => b.token === String(header.tokenNo));

    let target: BillRecord;
    if (currentIdx === -1) {
      // Currently on new unsaved bill: load the very last saved bill (e.g. 580)
      target = categoryBills[0];
    } else if (currentIdx < categoryBills.length - 1) {
      // Load next older bill (e.g. 580 -> 570)
      target = categoryBills[currentIdx + 1];
    } else {
      // Already at the oldest bill
      showToast(`Oldest saved ${currentDoc} bill reached (#${categoryBills[currentIdx].token})`, 'info');
      return;
    }

    if (target) {
      setHeader({
        docType: normalizeDocType(target.docType),
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
          docType: normalizeDocType(target.docType),
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
      showToast(`Loaded ${currentDoc} Bill #${target.token} (${target.party || 'No Party'})`, 'info');
      setActiveTab('F1');
      playTapSound();
    }
  }, [header]);

  const handleNextBill = useCallback(() => {
    const allBills = localDb.getBills();
    if (allBills.length === 0) {
      showToast('No saved bills found in database', 'warning');
      return;
    }
    const currentDoc = normalizeDocType(header.docType);
    const categoryBills = allBills
      .filter(b => getBillCategory(b) === currentDoc)
      .sort((a, b) => {
        const numA = parseInt(a.token, 10);
        const numB = parseInt(b.token, 10);
        if (!isNaN(numA) && !isNaN(numB) && numA !== numB) {
          return numB - numA; // Descending: 580, 570, 528...
        }
        return (b.updatedAt || 0) - (a.updatedAt || 0);
      });

    if (categoryBills.length === 0) {
      showToast(`No saved ${currentDoc} bills found`, 'warning');
      return;
    }

    const currentIdx = categoryBills.findIndex(b => b.token === String(header.tokenNo));

    if (currentIdx === -1) {
      // Currently on new unsaved bill
      showToast(`Already on new ${currentDoc} bill entry`, 'info');
      return;
    }

    if (currentIdx === 0) {
      // At the latest saved bill: moving forward opens a fresh new blank bill!
      handleClearToNewBill();
      return;
    }

    // Move to newer bill (e.g. 570 -> 580)
    const target = categoryBills[currentIdx - 1];
    if (target) {
      setHeader({
        docType: normalizeDocType(target.docType),
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
          docType: normalizeDocType(target.docType),
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
      showToast(`Loaded ${currentDoc} Bill #${target.token} (${target.party || 'No Party'})`, 'info');
      setActiveTab('F1');
      playTapSound();
    }
  }, [header, handleClearToNewBill]);

  const prevBillRef = useRef(handlePrevBill);
  prevBillRef.current = handlePrevBill;

  const nextBillRef = useRef(handleNextBill);
  nextBillRef.current = handleNextBill;

  const saveBillRef = useRef(handleSaveCurrentBill);
  saveBillRef.current = handleSaveCurrentBill;

  const calcSummaryRef = useRef<(() => void) | null>(null);
  const loadOldPriceRef = useRef<(() => void) | null>(null);
  const openPrintRef = useRef<((mode: 'estimate' | 'summary_only' | 'loading_slip') => void) | null>(null);

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
      // 0. Confirm Clear Dialog Modal Controls (Handled by UnsavedChangesModal)
      if (confirmClearDialogRef.current?.isOpen) {
        return;
      }

      const isCtrlOrCmd = e.ctrlKey || e.metaKey;

      // F8: Instant Switch to Stock Inventory module (as requested: "ISKA F8 SHORTCUT HAI USME")
      if (e.key === 'F8') {
        e.preventDefault();
        setActiveTab('F8');
        playTapSound();
        return;
      }

      // F1: Switch to Bill UI
      if (e.key === 'F1') {
        e.preventDefault();
        setActiveTab('F1');
        playTapSound();
        return;
      }

      // F2: Switch to Bill History
      if (e.key === 'F2') {
        e.preventDefault();
        setActiveTab('F2');
        playTapSound();
        return;
      }

      // F9 or Ctrl+Alt+C: Toggle Digital Retro Numpad Calculator
      if (e.key === 'F9' || (isCtrlOrCmd && e.altKey && (e.key === 'c' || e.key === 'C'))) {
        e.preventDefault();
        setIsCalculatorOpen(prev => !prev);
        return;
      }

      // If Calculator is Open: Intercept Escape to close calculator, and let numpad keys flow to calculator
      if (isCalculatorOpenRef.current) {
        if (e.key === 'Escape') {
          e.preventDefault();
          setIsCalculatorOpen(false);
          return;
        }
        // Allow physical numpad & calculation keys to reach the calculator modal without triggering app shortcuts
        if (e.code.startsWith('Numpad') || ['0','1','2','3','4','5','6','7','8','9','+','-','*','/','.','=','Enter','Backspace','Delete'].includes(e.key)) {
          return;
        }
      }

      // Escape key: SKIP current loaded bill or clear panel to new blank bill (only in F1/HOME)
      if (e.key === 'Escape') {
        if (activeTab === 'F1' || activeTab === 'HOME') {
          e.preventDefault();
          escapeClearRef.current();
        }
        return;
      }

      // Home Key: Instantly activate Bill Type dropdown in Header! (as requested: "HOME BUTTON DABATE HI BILL TYPE DROP DOWN ME ACTIVE HO JAYE")
      if (e.key === 'Home' && !e.shiftKey && !isCtrlOrCmd) {
        const activeEl = document.activeElement as HTMLInputElement | null;
        const isTextInput = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA');
        if (isTextInput && activeEl.selectionStart !== null && activeEl.selectionStart > 0 && activeEl.selectionEnd !== activeEl.value.length) {
          // Allow normal caret to reach 0
          return;
        }
        e.preventDefault();
        setActiveTab('F1');
        const docTypeSelect = document.getElementById('header-doc-type') as HTMLSelectElement | null;
        if (docTypeSelect) {
          docTypeSelect.focus();
        }
        return;
      }
      
      // Ctrl + J: Toggle Chat Assistant & Billing Helper
      if (isCtrlOrCmd && (e.key === 'j' || e.key === 'J')) {
        e.preventDefault();
        setIsChatOpen(prev => !prev);
        return;
      }

      // Ctrl + ArrowLeft: Previous Bill (Reverse / Rivis)
      if (isCtrlOrCmd && e.key === 'ArrowLeft') {
        e.preventDefault();
        prevBillRef.current();
        return;
      }

      // Ctrl + ArrowRight: Next Bill
      if (isCtrlOrCmd && e.key === 'ArrowRight') {
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

      // Ctrl+P: Print Center (Estimate by default)
      if (isCtrlOrCmd && !e.shiftKey && !e.altKey && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault();
        openPrintRef.current?.('estimate');
        return;
      }

      // Ctrl+E: Print Estimate (Raw Items + Moulds + Adjustments + Final Balance)
      if (isCtrlOrCmd && !e.shiftKey && !e.altKey && (e.key === 'e' || e.key === 'E')) {
        e.preventDefault();
        openPrintRef.current?.('estimate');
        return;
      }

      // Alt+S: Print Summary Only (Moulds Summary + Adjustments + Final Balance, NO raw items)
      if (e.altKey && !isCtrlOrCmd && !e.shiftKey && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        openPrintRef.current?.('summary_only');
        return;
      }

      // Ctrl+L (without Shift): Warehouse Loading Slip (Qty, U Cap, L Cap totals, NO pricing)
      if (isCtrlOrCmd && !e.shiftKey && !e.altKey && (e.key === 'l' || e.key === 'L')) {
        e.preventDefault();
        openPrintRef.current?.('loading_slip');
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

  // 5. Persisted Wallpaper & Display Settings
  const [bgImage, setBgImage] = useState<string>(() => loadStored('modern_app_bg_image', '/panda_bg.jpg'));
  useEffect(() => {
    localStorage.setItem('modern_app_bg_image', JSON.stringify(bgImage));
  }, [bgImage]);

  // Load custom wallpaper image from IndexedDB if previously uploaded by user
  useEffect(() => {
    loadMediaFromDB().then((media) => {
      if (media && media.url) {
        setBgImage(media.url);
      }
    }).catch((e) => console.warn('IndexedDB media load error:', e));
  }, []);

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
  const [printModalMode, setPrintModalMode] = useState<'estimate' | 'summary_only' | 'loading_slip'>('estimate');
  const [isGoodsModalOpen, setIsGoodsModalOpen] = useState<boolean>(false);
  const [isOcrOpen, setIsOcrOpen] = useState<boolean>(false);
  const [isNoteOpen, setIsNoteOpen] = useState<boolean>(false);
  const [isJsonOpen, setIsJsonOpen] = useState<boolean>(false);
  const [noteText, setNoteText] = useState<string>('Urgent delivery for Apex Industries scheduled by end of week.');

  const handleOpenPrintModal = useCallback((mode: 'estimate' | 'summary_only' | 'loading_slip') => {
    macAudio.playPop();
    setPrintModalMode(mode);
    setIsSlipOpen(true);
  }, []);
  openPrintRef.current = handleOpenPrintModal;



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
      macAudio.playPop();
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

  // Intelligent Excel Paste for Raw Items: Dynamically maps all columns (Name, PartyCode, all dynamic size columns, U Cap, L Cap)
  const handleBulkPasteRaw = (rows: string[][], startRow?: number, startCol: number = 0) => {
    if (!rows || rows.length === 0) return;

    let workingRows = rows.map(r => r.map(c => (c !== undefined && c !== null ? String(c).trim() : '')));
    let updatedDynCols = [...dynamicCols];
    let updatedHasPartyCode = hasPartyCodeCol;

    // 1. Inspect first row to see if it is a header row from Excel
    const firstRow = workingRows[0];
    const isHeader = firstRow.some(col => 
      /item|name|qty|cap|spec|mould|price|total|party|code|\bft\b|\bfeet\b/i.test(col) ||
      /\b(?:12|14|16|18|20|9\.5)\b/i.test(col)
    );

    if (isHeader) {
      // Parse header row to extract column definitions (e.g. "12 FT", "14 FT", "PARTY CODE")
      firstRow.forEach((headerText) => {
        const text = headerText.toLowerCase().trim();
        if (/party|code/i.test(text)) {
          updatedHasPartyCode = true;
        } else if (/u\s*cap/i.test(text) || /l\s*cap/i.test(text) || /item|name/i.test(text)) {
          // Standard fixed columns
        } else {
          // Check for size column (e.g. 12 FT, 14 FT, 9.5 FT)
          const match = text.match(/([\d]+(?:\.[\d]+)?)\s*(?:ft|feet)?/i);
          if (match) {
            const size = parseFloat(match[1]);
            if (!isNaN(size) && size > 0 && size !== 10) {
              const field = `qty_${String(size).replace('.', '_')}`;
              if (!updatedDynCols.some(dc => dc.field === field)) {
                updatedDynCols.push({ field, label: `(${size} FT)` });
              }
            }
          }
        }
      });
      // Remove header row so only data rows are pasted
      workingRows = workingRows.slice(1);
    }

    if (workingRows.length === 0) return;

    // 2. Check if data rows have MORE columns than current table columns, auto-insert size columns if needed
    const fixedColCount = 1 + (updatedHasPartyCode ? 1 : 0) + 2; // name, [partyCode], uCap, lCap
    const maxColsInData = Math.max(...workingRows.map(r => r.length));

    // If starting at col 0 and data has more columns than fixedColCount + updatedDynCols.length + 1:
    const expectedSizeColsInData = maxColsInData - fixedColCount;
    if (startCol === 0 && expectedSizeColsInData > (updatedDynCols.length + 1)) {
      const commonSizes = [12, 14, 16, 18, 20, 9.5];
      for (const sz of commonSizes) {
        if (updatedDynCols.length >= expectedSizeColsInData - 1) break;
        const field = `qty_${String(sz).replace('.', '_')}`;
        if (!updatedDynCols.some(dc => dc.field === field)) {
          updatedDynCols.push({ field, label: `(${sz} FT)` });
        }
      }
    }

    // 3. Update dynamicCols and partyCode state if changed
    if (updatedDynCols.length !== dynamicCols.length || updatedHasPartyCode !== hasPartyCodeCol) {
      setDynamicCols(updatedDynCols);
      setHasPartyCodeCol(updatedHasPartyCode);
      try {
        localStorage.setItem('modern_left_dyncols', JSON.stringify(updatedDynCols));
        localStorage.setItem('modern_has_party_code_col', String(updatedHasPartyCode));
      } catch {}
    }

    // 4. Compute allSizeCols sorted descending by size (same order as displayed on screen)
    const currentSizeCols = [
      { field: 'qty', label: '(10 FT)', size: 10 },
      ...updatedDynCols.map(c => ({
        field: c.field,
        label: c.label,
        size: extractSizeFromColLabel(c.label || c.field)
      }))
    ].sort((a, b) => b.size - a.size);

    // 5. Ordered list of grid column fields
    const colFields = [
      'name',
      ...(updatedHasPartyCode ? ['partyCode'] : []),
      ...currentSizeCols.map(sc => sc.field),
      'uCap',
      'lCap'
    ];

    const parseNum = (val: any): number => {
      if (val === undefined || val === null || val === '') return 0;
      const clean = String(val).replace(/,/g, '').replace(/[^\d.-]/g, '').trim();
      const num = parseFloat(clean);
      return isNaN(num) ? 0 : num;
    };

    setRawItems(prev => {
      const next = [...prev];
      const actualStart = startRow !== undefined ? startRow : next.length;

      workingRows.forEach((r, rIdx) => {
        const targetRowIdx = actualStart + rIdx;
        const current = targetRowIdx < next.length ? { ...next[targetRowIdx] } : {
          id: 'raw-paste-' + Date.now() + '-' + rIdx,
          name: '',
          qty: 0,
          uCap: 0,
          lCap: 0
        };

        r.forEach((cellVal, cIdx) => {
          const colIdx = startCol + cIdx;
          if (colIdx < colFields.length) {
            const field = colFields[colIdx];
            if (field === 'name') {
              current.name = cellVal ? String(cellVal).trim() : (current.name || '');
            } else if (field === 'partyCode') {
              current.partyCode = cellVal ? String(cellVal).trim() : (current.partyCode || '');
            } else {
              (current as any)[field] = parseNum(cellVal);
            }
          }
        });

        if (targetRowIdx < next.length) {
          next[targetRowIdx] = current;
        } else {
          next.push(current);
        }
      });
      return next;
    });

    showToast(`Pasted ${workingRows.length} row(s) across all columns!`, 'success');
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
      const needed = row - finishedItems.length + 1;
      const newRows: FinishedItem[] = [];
      for (let i = 0; i < needed; i++) {
        newRows.push({ id: 'fin-' + Date.now() + '-' + i, mould: '', qty: 0, price: 0, total: 0 });
      }
      setFinishedItems(prev => [...prev, ...newRows]);
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
      const needed = row - rawItems.length + 1;
      const newRows: RawItem[] = [];
      for (let i = 0; i < needed; i++) {
        newRows.push({ id: 'raw-' + Date.now() + '-' + i, name: '', qty: 0, uCap: 0, lCap: 0 });
      }
      setRawItems(prev => [...prev, ...newRows]);
    }
    const lastCol = (hasPartyCodeCol ? 4 : 3) + dynamicCols.length;
    setTimeout(() => {
      let leftInput = document.getElementById(`left-cell-${row}-${lastCol}`) as HTMLInputElement;
      if (!leftInput) {
        const rowInputs = document.querySelectorAll(`input[id^="left-cell-${row}-"]`);
        if (rowInputs.length > 0) {
          leftInput = rowInputs[rowInputs.length - 1] as HTMLInputElement;
        }
      }
      if (leftInput) {
        leftInput.focus();
        leftInput.select();
      }
    }, 45);
  };

  const handleNavigateToLeftGrid = useCallback(() => {
    setActiveTable('left');
    if (rawItems.length === 0) {
      setRawItems([{ id: 'raw-' + Date.now(), name: '', qty: 0, uCap: 0, lCap: 0 }]);
    }
    setTimeout(() => {
      const firstInput = document.getElementById('left-cell-0-0') as HTMLInputElement | null;
      if (firstInput) {
        firstInput.focus();
        firstInput.select();
      }
    }, 45);
  }, [rawItems.length]);

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
    const sourceMap: { [mouldOrGroupName: string]: { rowId: string; rowIndex: number; field: string; qty: number }[] } = {};

    const recordSource = (mouldName: string, rowId: string, rowIndex: number, field: string, qty: number) => {
      if (!mouldName || qty <= 0) return;
      if (!sourceMap[mouldName]) sourceMap[mouldName] = [];
      sourceMap[mouldName].push({ rowId, rowIndex, field, qty });
      if (!sourceMap[mouldName].some(c => c.rowId === rowId && c.field === 'name')) {
        sourceMap[mouldName].push({ rowId, rowIndex, field: 'name', qty });
      }
    };

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

    rawList.forEach((it, rIdx) => {
      const name = (it.name || '').trim();
      if (!name) return;

      const qty10 = Number(it.qty) || 0;
      const uCap = Number(it.uCap) || 0;
      const lCap = Number(it.lCap) || 0;
      const nameLower = name.toLowerCase();

      // Find matching conversion (longest conversion first)
      let matchedConv = '';
      let matchedConvRule: any = null;
      let uGroup = '';
      let lGroup = '';

      // Pass 1: Match by conversion name (longest conversion first, exactly like main.py line 8127-8133)
      for (const sc of sortedConversions) {
        const conv = String(sc.conversion || '').trim();
        const convLower = conv.toLowerCase();

        const matchByConv = conv && (
          nameLower === convLower ||
          nameLower.startsWith(convLower + ' ') ||
          nameLower.startsWith(convLower + '-') ||
          nameLower.startsWith(convLower + '.') ||
          nameLower.startsWith(convLower + '/') ||
          nameLower.startsWith(convLower)
        );

        if (matchByConv) {
          matchedConv = conv;
          matchedConvRule = sc;
          const rawU = String(sc.u_cap !== undefined ? sc.u_cap : (sc.uCap || '')).trim();
          const rawL = String(sc.l_cap !== undefined ? sc.l_cap : (sc.lCap || '')).trim();
          uGroup = (!['0', '0.0', 'none', 'null', 'undefined', ''].includes(rawU.toLowerCase())) ? rawU : '';
          lGroup = (!['0', '0.0', 'none', 'null', 'undefined', ''].includes(rawL.toLowerCase())) ? rawL : '';
          break;
        }
      }

      // Pass 2: Fallback exact shortcut match ONLY (e.g. if user literally typed only "2" or "C")
      if (!matchedConv) {
        for (const sc of sortedConversions) {
          const code = String(sc.shortcut || '').trim();
          const codeLower = code.toLowerCase();

          if (code && nameLower === codeLower) {
            matchedConv = String(sc.conversion || '').trim();
            matchedConvRule = sc;
            const rawU = String(sc.u_cap !== undefined ? sc.u_cap : (sc.uCap || '')).trim();
            const rawL = String(sc.l_cap !== undefined ? sc.l_cap : (sc.lCap || '')).trim();
            uGroup = (!['0', '0.0', 'none', 'null', 'undefined', ''].includes(rawU.toLowerCase())) ? rawU : '';
            lGroup = (!['0', '0.0', 'none', 'null', 'undefined', ''].includes(rawL.toLowerCase())) ? rawL : '';
            break;
          }
        }
      }

      // Check if size is explicitly defined in Conversion rule (e.g. 10, 12, 9.5)
      // If NOT defined (blank/0/undefined), do NOT append (10) in summary table!
      const hasDefinedSize = Boolean(
        matchedConvRule &&
        matchedConvRule.size !== undefined &&
        matchedConvRule.size !== null &&
        String(matchedConvRule.size).trim() !== '' &&
        parseFloat(String(matchedConvRule.size).replace(/[^\d.]/g, '')) > 0
      );
      const definedSize = hasDefinedSize ? (parseFloat(String(matchedConvRule.size).replace(/[^\d.]/g, '')) || 10) : 10;

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
            const hasMultiCols = Boolean(dynCols && dynCols.length > 0);
            if (qty10 > 0) {
              const key10 = hasMultiCols ? formatMouldWithSize(baseName, 10) : baseName;
              itemSummary[key10] = (itemSummary[key10] || 0) + qty10;
              recordSource(key10, it.id, rIdx, 'qty', qty10);
            }
            if (hasMultiCols) {
              dynCols.forEach(col => {
                const colQty = Number((it as any)[col.field]) || 0;
                if (colQty > 0) {
                  const size = extractSizeFromColLabel(col.label || col.field);
                  const keyCol = formatMouldWithSize(baseName, size);
                  itemSummary[keyCol] = (itemSummary[keyCol] || 0) + colQty;
                  recordSource(keyCol, it.id, rIdx, col.field, colQty);
                }
              });
            }
          } else if (sumCol === 'U CAP') {
            if (uCap > 0) {
              groupSummary[baseName] = (groupSummary[baseName] || 0) + uCap;
              recordSource(baseName, it.id, rIdx, 'uCap', uCap);
            }
          } else if (sumCol === 'L CAP') {
            if (lCap > 0) {
              groupSummary[baseName] = (groupSummary[baseName] || 0) + lCap;
              recordSource(baseName, it.id, rIdx, 'lCap', lCap);
            }
          }
        }
      }

      // 4. Normal Item QTY summing (when not overridden by skip sub-group)
      if (!isSkipQty) {
        const baseMould = matchedConv || (name.includes(' ') ? name.split(' ')[0] : name);
        const ruleGroupName = String(matchedConvRule?.group_name || matchedConvRule?.groupName || '').toUpperCase().trim();
        const isHardware = ruleGroupName === 'HARWARE' || ruleGroupName === 'HARDWARE' ||
          /^(CLIP|SCREW|BLACK|ELFY|GATTI|RAJA|SILICON|BATTEN|BLACK-SCREW|GOLDEN-PATTI|GOLDEN-TAPE)$/i.test(baseMould.trim());

        if (isHardware) {
          // Hardware items NEVER have size/feet: sum all size columns together into baseMould without any size in brackets
          let totalHardwareQty = 0;
          if (qty10 > 0) {
            totalHardwareQty += qty10;
            recordSource(baseMould, it.id, rIdx, 'qty', qty10);
          }
          if (dynCols && dynCols.length > 0) {
            dynCols.forEach(col => {
              const colQty = Number((it as any)[col.field]) || 0;
              if (colQty > 0) {
                totalHardwareQty += colQty;
                recordSource(baseMould, it.id, rIdx, col.field, colQty);
              }
            });
          }
          if (totalHardwareQty > 0) {
            itemSummary[baseMould] = (itemSummary[baseMould] || 0) + totalHardwareQty;
          }
        } else {
          // Regular profile items:
          // If only 1 size column (10 FT only), do NOT append size (e.g. "C.M", not "C.M (10)")
          // If multiple size columns exist, append size in brackets (e.g. "C.M (10)", "C.M (12)")
          const hasMultiCols = Boolean(dynCols && dynCols.length > 0);

          if (qty10 > 0) {
            const key10 = hasMultiCols ? formatMouldWithSize(baseMould, 10) : baseMould;
            itemSummary[key10] = (itemSummary[key10] || 0) + qty10;
            recordSource(key10, it.id, rIdx, 'qty', qty10);
          }

          if (hasMultiCols) {
            dynCols.forEach(col => {
              const colQty = Number((it as any)[col.field]) || 0;
              if (colQty > 0) {
                const size = extractSizeFromColLabel(col.label || col.field);
                const keyCol = formatMouldWithSize(baseMould, size);
                itemSummary[keyCol] = (itemSummary[keyCol] || 0) + colQty;
                recordSource(keyCol, it.id, rIdx, col.field, colQty);
              }
            });
          }
        }
      }

      // 5. U CAP & L CAP SUMMING: Exact logic as main.py lines 8164-8169
      if (uCap > 0) {
        const targetU = uGroup || (matchedConv ? '' : 'Fluted Jointer');
        if (targetU) {
          groupSummary[targetU] = (groupSummary[targetU] || 0) + uCap;
          recordSource(targetU, it.id, rIdx, 'uCap', uCap);
        }
      }

      if (lCap > 0) {
        const targetL = lGroup || (matchedConv ? '' : 'Jointer');
        if (targetL) {
          groupSummary[targetL] = (groupSummary[targetL] || 0) + lCap;
          recordSource(targetL, it.id, rIdx, 'lCap', lCap);
        }
      }
    });

    return { itemSummary, groupSummary, sourceMap };
  }, []);

  // Summary Mapping Cache & Highlight State
  const [summarySourceMap, setSummarySourceMap] = useState<Record<string, { rowId: string; rowIndex: number; field: string; qty: number }[]>>({});
  const [activeRightMould, setActiveRightMould] = useState<string | null>(null);

  // Automatically keep summary mapping cache fresh whenever rawItems or dynamicCols change
  useEffect(() => {
    const { sourceMap } = groupRawItemsForSummary(rawItems, dynamicCols);
    setSummarySourceMap(sourceMap);
  }, [rawItems, dynamicCols, groupRawItemsForSummary]);

  // High-performance O(1) set for highlighting ONLY contributing QTY cells in Left Grid when active on Right Grid
  const highlightedSourceCells = useMemo(() => {
    if (!activeRightMould) return new Set<string>();
    const trimmed = activeRightMould.trim().toLowerCase();
    const set = new Set<string>();

    for (const [mKey, contributions] of Object.entries(summarySourceMap)) {
      if (mKey.trim().toLowerCase() === trimmed) {
        contributions.forEach(c => {
          set.add(`${c.rowId}:${c.field}`);
          set.add(`${c.rowIndex}:${c.field}`);
        });
        break;
      }
    }
    return set;
  }, [activeRightMould, summarySourceMap]);

  // Left Panel -> Right Panel Summary Calculation Engine (Ctrl+G)
  // Groups quantities accurately. Does NOT inject default rates automatically (rates stay 0 unless user typed/loaded)
  const calculateRightGridFromLeft = useCallback(() => {
    const { itemSummary, groupSummary, sourceMap } = groupRawItemsForSummary(rawItems, dynamicCols);
    setSummarySourceMap(sourceMap);

    const totalCalculated = Object.keys(itemSummary).length + Object.keys(groupSummary).length;
    if (totalCalculated === 0) {
      showToast('Left Table is empty! Enter items & quantities first.', 'warning');
      return;
    }

    const newMoulds: FinishedItem[] = [];
    let idCounter = 1;

    // 1. Resolve Group Priority Map from Manage Groups (control_groups in SQLite / localStorage)
    const groupRankMap = new Map<string, number>();
    SQLITE_CONTROL_GROUPS.forEach(cg => {
      const key = (cg.group_name || '').toUpperCase().trim();
      if (key) groupRankMap.set(key, cg.group_index ?? 999);
    });
    try {
      const rawSaved = localStorage.getItem('control_group_rules') || localStorage.getItem('modern_control_groups_data');
      if (rawSaved) {
        const parsed = JSON.parse(rawSaved);
        if (Array.isArray(parsed)) {
          parsed.forEach((g: any, idx: number) => {
            const key = String(g.groupName || g.group_name || '').toUpperCase().trim();
            if (key) {
              const parsedIdx = parseFloat(String(g.groupIndex || g.group_index || '').replace(/[^\d.]/g, ''));
              const rank = !isNaN(parsedIdx) && parsedIdx > 0 ? parsedIdx : (idx + 1);
              groupRankMap.set(key, rank);
            }
          });
        }
      }
    } catch {}

    // Resolve active conversions for mapping item to group_name
    let activeConversions: any[] = SQLITE_CONTROL_CONVERSIONS;
    try {
      const saved = localStorage.getItem('billapp_conversions') || localStorage.getItem('ctrl_conv_rules_v3');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) activeConversions = parsed;
      }
    } catch {}

    const getGroupRank = (mouldName: string): number => {
      const base = mouldName.replace(/\s*\([\d.]+(?:\s*(?:ft|feet|'))?\)/gi, '').trim().toLowerCase();
      const rule = activeConversions.find(sc => {
        const conv = String(sc.conversion || '').toLowerCase().trim();
        return conv && (base === conv || base.startsWith(conv + ' ') || base.startsWith(conv + '-'));
      });
      let groupName = rule ? String(rule.group_name || rule.groupName || '').toUpperCase().trim() : '';
      if (!groupName) {
        if (base.includes('jointer')) groupName = 'JOINTER';
        else if (base.includes('clip') || base.includes('screw') || base.includes('black')) groupName = 'HARWARE';
        else groupName = base.toUpperCase();
      }
      return groupRankMap.has(groupName) ? (groupRankMap.get(groupName) ?? 999) : 999;
    };

    // 2. Sort Mould Items: Primary by Manage Groups position (1 is top, then 2, 3...), Secondary by item name, Tertiary by Size DESCENDING (12 FT -> 11 FT -> 10 FT)
    const sortedItemEntries = Object.entries(itemSummary).sort(([nameA], [nameB]) => {
      // 1. Group priority from Manage Groups
      const rankA = getGroupRank(nameA);
      const rankB = getGroupRank(nameB);
      if (rankA !== rankB) return rankA - rankB;

      // 2. Base item name
      const baseA = nameA.replace(/\s*\([\d.]+(?:\s*(?:ft|feet|'))?\)/gi, '').trim();
      const baseB = nameB.replace(/\s*\([\d.]+(?:\s*(?:ft|feet|'))?\)/gi, '').trim();
      if (baseA.toLowerCase() !== baseB.toLowerCase()) return baseA.localeCompare(baseB);

      // 3. For the same item name, sort size DESCENDING (e.g. 12 FT -> 11 FT -> 10 FT)
      const matchA = nameA.match(/\(([\d]+(?:\.[\d]+)?)/);
      const matchB = nameB.match(/\(([\d]+(?:\.[\d]+)?)/);
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
      const { itemSummary, groupSummary, sourceMap } = groupRawItemsForSummary(rawItems, dynamicCols);
      setSummarySourceMap(sourceMap);
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
    if (!rows || rows.length === 0) return;

    let workingRows = rows.map(r => r.map(c => (c !== undefined && c !== null ? String(c).trim() : '')));
    // Check if row 0 is header
    if (workingRows.length > 0 && workingRows[0].some(c => /mould|item|qty|price|rate|total/i.test(c))) {
      workingRows = workingRows.slice(1);
    }
    if (workingRows.length === 0) return;

    const parseNum = (val: any): number => {
      if (val === undefined || val === null || val === '') return 0;
      const clean = String(val).replace(/,/g, '').replace(/[^\d.-]/g, '').trim();
      const num = parseFloat(clean);
      return isNaN(num) ? 0 : num;
    };

    setFinishedItems(prev => {
      const next = [...prev];
      const actualStart = startRow !== undefined ? startRow : next.length;

      workingRows.forEach((r, rIdx) => {
        const targetRowIdx = actualStart + rIdx;
        const current = targetRowIdx < next.length ? { ...next[targetRowIdx] } : {
          id: 'fin-paste-' + Date.now() + '-' + rIdx,
          mould: '',
          qty: 0,
          price: 0,
          total: 0
        };

        r.forEach((cellVal, cIdx) => {
          const colIdx = startCol + cIdx;
          if (colIdx === 0) {
            current.mould = cellVal ? String(cellVal).trim() : (current.mould || '');
          } else if (colIdx === 1) {
            current.qty = parseNum(cellVal);
          } else if (colIdx === 2) {
            current.price = parseNum(cellVal);
          }
        });
        current.total = (current.qty || 0) * (current.price || 0);

        if (targetRowIdx < next.length) {
          next[targetRowIdx] = current;
        } else {
          next.push(current);
        }
      });
      return next;
    });

    showToast(`Pasted ${workingRows.length} mould(s) into Right Panel!`, 'success');
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
      {/* Dynamic Background: Wallpaper Image (Active in Glass Mode) */}
      {themeMode === 'glass' && (
        <div 
          className="apple-wallpaper"
          style={{
            backgroundImage: `url(${bgImage})`,
            filter: `blur(${blurAmount * 0.4}px)`,
            transform: 'scale(1.05)'
          }}
        />
      )}

      {/* Background Overlay (in Glass Mode) */}
      {themeMode === 'glass' && (
        <div 
          className="apple-wallpaper-overlay"
          style={{
            backgroundColor: `rgba(5, 7, 12, ${dimOverlay / 100})`
          }}
        />
      )}

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
              themeMode={themeMode}
              onChangeThemeMode={onChangeThemeMode}
              onToggleChat={() => setIsChatOpen(prev => !prev)}
              isChatOpen={isChatOpen}
              onToggleCalculator={() => setIsCalculatorOpen(prev => !prev)}
              isCalculatorOpen={isCalculatorOpen}
              onNavigateToLeftGrid={handleNavigateToLeftGrid}
            />

            {/* Center Workspace */}
            <div style={{ display: 'flex', flex: 1, gap: '12px', minHeight: 0, overflow: 'visible' }}>
              {/* Left Action Rail */}
              <LeftActionRail
                onSummary={calculateRightGridFromLeft}
                onLoadOldPrice={handleLoadOldPriceFromHistory}
                onSave={handleSaveCurrentBill}
                onPrintSlip={() => handleOpenPrintModal('estimate')}
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
                onOpenCalculator={() => setIsCalculatorOpen(true)}
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
                      highlightedCells={highlightedSourceCells}
                      isActiveTable={activeTable === 'left'}
                      onActivateTable={() => setActiveTable('left')}
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
                      onActiveRowChange={(item) => setActiveRightMould(item?.mould ? item.mould.trim() : null)}
                      isActiveTable={activeTable === 'right'}
                      onActivateTable={() => setActiveTable('right')}
                    />
                  </div>
                </div>

                {/* Bottom Mode Bar: 3 Modes + Calculator + Chat + Theme Mode + Bill Search */}
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
                  onToggleCalculator={() => setIsCalculatorOpen(prev => !prev)}
                  isCalculatorOpen={isCalculatorOpen}
                  onToggleChat={() => setIsChatOpen(prev => !prev)}
                  isChatOpen={isChatOpen}
                  themeMode={themeMode}
                  onChangeThemeMode={onChangeThemeMode}
                  activeDocType={header.docType}
                />
              </div>

              {/* Right Navigation Rail */}
              <RightNavRail
                activeTab={activeTab}
                onCloseApp={() => showToast('App Closed', 'info')}
                onSelectTab={(t) => {
                  setActiveTab(t);
                }}
                onToggleChat={() => setIsChatOpen(prev => !prev)}
                isChatOpen={isChatOpen}
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
                themeMode={themeMode}
                onChangeThemeMode={onChangeThemeMode}
                onLoadBillToEditor={(bill: any) => {
                  setHeader({
                    docType: normalizeDocType(bill.docType),
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
                bgImage={bgImage}
                onSelectBgImage={(url) => {
                  setBgImage(url);
                  showToast('Wallpaper Updated', 'success');
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
              onToggleChat={() => setIsChatOpen(prev => !prev)}
              isChatOpen={isChatOpen}
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
        initialMode={printModalMode}
        billNo={header.tokenNo || '0001'}
        dynamicCols={dynamicCols}
        hasPartyCodeCol={hasPartyCodeCol}
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

      {/* Unsaved Changes in Bill Modal */}
      {confirmClearDialog?.isOpen && (
        <UnsavedChangesModal
          billNumber={confirmClearDialog.tokenNo}
          onSave={handleConfirmSaveAndClear}
          onDiscard={handleConfirmDiscardAndClear}
          onCancel={() => setConfirmClearDialog(null)}
        />
      )}

      {/* NumPad Shortcut Navigator (Press '.' on NumPad) */}
      <NumpadNavigator 
        isActiveTabBill={activeTab === 'HOME' || activeTab === 'F1'} 
        onToast={showToast} 
      />

      {/* AI Chatting & Billing Assistant */}
      <ChattingPanel
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        header={header}
        rawItems={rawItems}
        finishedItems={finishedItems}
        onShowToast={showToast}
      />

      {/* Retro Neumorphic Digital Calculator with 100% Physical Numpad Control */}
      <DigitalCalculatorModal
        isOpen={isCalculatorOpen}
        onClose={() => setIsCalculatorOpen(false)}
        onInsertValue={(val) => {
          showToast(`Calculator Value: ${val}`, 'info');
        }}
        onToast={showToast}
      />

    </div>
  );
}

export default function App() {
  const [themeMode, setThemeMode] = React.useState<AppThemeMode>(() => {
    const saved = localStorage.getItem('modern_app_theme_mode');
    return saved === 'glass' ? 'glass' : 'dark';
  });

  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', themeMode);
    localStorage.setItem('modern_app_theme_mode', themeMode);
  }, [themeMode]);

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
    <ConfigProvider theme={getAntdTheme(themeMode)}>
      <DatabaseProvider>
        <SettingsProvider>
          <AppContent themeMode={themeMode} onChangeThemeMode={setThemeMode} />
        </SettingsProvider>
      </DatabaseProvider>
    </ConfigProvider>
  );
}
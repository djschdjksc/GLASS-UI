import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SQLITE_SHORTCUTS } from './data/sqliteData';
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
import { CheckCircle2, Info, AlertTriangle } from 'lucide-react';
import { DatabaseProvider } from './context/DatabaseContext';
import { SettingsProvider } from './context/SettingsContext';
import { localDb } from './services/db/localDb';
import type { BillRecord } from './services/db/schema';

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

const INITIAL_RAW_ITEMS: RawItem[] = [
  { id: '1', name: 'Aluminium Ingot 6063', qty: 120, uCap: 95, lCap: 80 },
  { id: '2', name: 'Silicon Carbide Grain', qty: 45, uCap: 30, lCap: 25 },
  { id: '3', name: 'Hardener Rod H-88', qty: 250, uCap: 180, lCap: 160 },
  { id: '4', name: 'Graphite Die Core 40mm', qty: 80, uCap: 65, lCap: 60 },
  { id: '5', name: 'Flux Powder Grade-A', qty: 60, uCap: 50, lCap: 44 },
  { id: '6', name: 'Degasser Tablet Pack', qty: 100, uCap: 70, lCap: 60 }
];

const INITIAL_FINISHED_ITEMS: FinishedItem[] = [
  { id: '1', mould: 'Mould 14x20 Standard Housing', qty: 15, price: 650, total: 9750 },
  { id: '2', mould: 'Mould 18x24 Reinforced Casing', qty: 12, price: 920, total: 11040 },
  { id: '3', mould: 'Die Core Cap 50mm Precision', qty: 8, price: 1250, total: 10000 },
  { id: '4', mould: 'Heat Sink Fin Mount Extrusion', qty: 6, price: 750, total: 4500 },
  { id: '5', mould: 'Flange Coupling 120mm Alloy', qty: 2, price: 1505, total: 3010 }
];

const INITIAL_HEADER: BillHeader = {
  docType: 'SALE BILL',
  partyName: 'Apex Industrial Moldings Pvt Ltd',
  typeSelection: 'WHOLESALE',
  vehicleNo: 'UP-16-AX-9921',
  date: '2026-09-18',
  tokenNo: '626'
};

function loadStored<T>(key: string, defaultValue: T): T {
  try {
    const val = localStorage.getItem(key);
    return val !== null ? JSON.parse(val) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function AppContent() {
  const [isGoodsModalOpen, setIsGoodsModalOpen] = useState(false);

  // 1. Persisted Header
  const [header, setHeader] = useState<BillHeader>(() => loadStored('modern_app_header', INITIAL_HEADER));
  useEffect(() => {
    localStorage.setItem('modern_app_header', JSON.stringify(header));
  }, [header]);

  // 2. Persisted Items
  const [rawItems, setRawItems] = useState<RawItem[]>(() => loadStored('modern_app_raw_items', INITIAL_RAW_ITEMS));
  useEffect(() => {
    localStorage.setItem('modern_app_raw_items', JSON.stringify(rawItems));
  }, [rawItems]);

  const [finishedItems, setFinishedItems] = useState<FinishedItem[]>(() => loadStored('modern_app_finished_items', INITIAL_FINISHED_ITEMS));
  useEffect(() => {
    localStorage.setItem('modern_app_finished_items', JSON.stringify(finishedItems));
  }, [finishedItems]);

  // Database Save & Navigation Handlers
  const handleSaveCurrentBill = useCallback(async () => {
    const total = finishedItems.reduce((acc, f) => acc + (Number(f.total) || 0), 0);
    const billToSave: BillRecord = {
      id: `B-${header.tokenNo || Date.now()}`,
      token: String(header.tokenNo || '0'),
      date: header.date || new Date().toISOString().split('T')[0],
      party: header.partyName || 'Apex Industrial Moldings Pvt Ltd',
      docType: header.docType || 'SALE BILL',
      vehicle: header.vehicleNo || '',
      typeSelection: header.typeSelection || 'WHOLESALE',
      total,
      status: 'PAID',
      rawItems: rawItems.map(r => ({ ...r })),
      finishedItems: finishedItems.map(f => ({ ...f })),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      synced: false,
      version: 1
    };
    await localDb.saveBill(billToSave);
    showToast(`Invoice #${billToSave.token} saved to local DB!`, 'success');
    playTapSound();
  }, [header, rawItems, finishedItems]);

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
      showToast(`Loaded Bill #${target.token}`, 'info');
      playTapSound();
    }
  }, [header]);

  // Global Browser Interceptor: Disable Chrome shortcuts and Chrome native contextmenu
  useEffect(() => {
    // 1. Prevent default Chrome right-click browser menu everywhere
    const handleGlobalContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    // 2. Intercept and block Chrome default keyboard shortcuts
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const isCtrlOrCmd = e.ctrlKey || e.metaKey;

      // Ctrl+S: Instant Local DB Save
      if (isCtrlOrCmd && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        handleSaveCurrentBill();
        return;
      }

            // Ctrl+G: Instant Calculate Left Panel into Right Panel (Mould Table)
      if (isCtrlOrCmd && !e.shiftKey && (e.key === 'g' || e.key === 'G')) {
        e.preventDefault();
        calculateRightGridFromLeft();
        return;
      }

      // Ctrl+Shift+G: Open Multi-Party Goods Distribution & GST Calculator
      if (isCtrlOrCmd && e.shiftKey && (e.key === 'g' || e.key === 'G')) {
        e.preventDefault();
        setIsGoodsModalOpen(true);
        showToast('Opened Goods Distribution (Ctrl+Shift+G)', 'info');
        return;
      }

      // Alt+A: Toggle Auto-Convert
      if (e.altKey && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault();
        setAutoConvert(prev => {
          const next = !prev;
          if (next) { setAutoItem(false); setSimpleMode(false); }
          showToast(`Auto-Convert: ${next ? 'ON' : 'OFF'} (Alt+A)`, next ? 'success' : 'info');
          return next;
        });
        return;
      }

      // Alt+Z: Toggle Auto-Item
      if (e.altKey && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault();
        setAutoItem(prev => {
          const next = !prev;
          if (next) { setAutoConvert(false); setSimpleMode(false); }
          showToast(`Auto-Item: ${next ? 'ON' : 'OFF'} (Alt+Z)`, next ? 'success' : 'info');
          return next;
        });
        return;
      }

      // Alt+X: Toggle Simple Mode
      if (e.altKey && (e.key === 'x' || e.key === 'X')) {
        e.preventDefault();
        setSimpleMode(prev => {
          const next = !prev;
          if (next) { setAutoConvert(false); setAutoItem(false); }
          showToast(`Simple Mode: ${next ? 'ON' : 'OFF'} (Alt+X)`, next ? 'success' : 'info');
          return next;
        });
        return;
      }

      // Chrome Print (Ctrl+P) -> Prevent Chrome print, open Party Code
      if (isCtrlOrCmd && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault();
        showToast('Party Code (Ctrl+P)', 'info');
        return;
      }

      // Chrome Save (Ctrl+S) -> Prevent Chrome HTML save, trigger App Save
      if (isCtrlOrCmd && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        showToast('Bill Saved Successfully (Ctrl+S)', 'success');
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
    setRawItems(slip.rawItems);
    setFinishedItems(slip.finishedItems);
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

  // 5. Persisted Background & Styling Settings
  const [bgType, setBgType] = useState<'image' | 'color'>(() => loadStored('modern_app_bg_type', 'image'));
  useEffect(() => {
    localStorage.setItem('modern_app_bg_type', JSON.stringify(bgType));
  }, [bgType]);

  const [bgImage, setBgImage] = useState<string>(() => loadStored('modern_app_bg_image', '/panda_bg.jpg'));
  useEffect(() => {
    localStorage.setItem('modern_app_bg_image', JSON.stringify(bgImage));
  }, [bgImage]);

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

  // Notification Toast Capsule
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'warning' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'warning' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  };

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

  const handleClearRawCells = (cells: { rowIndex: number; colIndex: number }[]) => {
    setRawItems(prev => {
      const next = [...prev];
      cells.forEach(({ rowIndex, colIndex }) => {
        if (next[rowIndex]) {
          const item = { ...next[rowIndex] };
          if (colIndex === 0) item.name = '';
          if (colIndex === 1) item.qty = 0;
          if (colIndex === 2) item.uCap = 0;
          if (colIndex === 3) item.lCap = 0;
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
    setFinishedItems(prev => prev.map(it => it.id === id ? { ...it, [field]: value } : it));
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
    setTimeout(() => {
      const leftInput = document.getElementById(`left-cell-${row}-3`) as HTMLInputElement;
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

  // Intelligent Excel Paste for Finished Items
  // Left Panel -> Right Panel Summary Calculation Engine (Ctrl+G)
  const calculateRightGridFromLeft = useCallback(() => {
    const itemSummary: { [mouldName: string]: number } = {};
    const groupSummary: { [groupName: string]: number } = {};

    const sortedShortcuts = [...SQLITE_SHORTCUTS].sort((a: any, b: any) => ((b.shortcut || '').length - (a.shortcut || '').length));

    // Default rate lookup map from bill_groups / mould_prices
    const defaultPriceMap: { [key: string]: number } = {
      'cm': 120,
      'c.m': 120,
      'sl': 54,
      's.l': 54,
      'tg': 120,
      't.g': 120,
      'lu': 84,
      'l.u': 84,
      'la': 84,
      'l.a': 84,
      'b.f.p': 54,
      'bfp': 54,
      'b.f.p-(g)': 54,
      'b.f.p-(b)': 54,
      'b.f.p-(a)': 54,
      'fluted jointer': 154,
      'jointer': 84,
      'f.p': 54,
      'h.o': 54,
      's.p': 54,
      'u.v': 80,
      'uv': 80,
      'clip': 12,
      'screw': 15,
      'black-screw': 18,
      'gatti': 25,
      'elfy': 40
    };

    rawItems.forEach(it => {
      const name = (it.name || '').trim();
      if (!name) return;

      const qty = Number(it.qty) || 0;
      const uCap = Number(it.uCap) || 0;
      const lCap = Number(it.lCap) || 0;

      let matchedConv = '';
      let uGroup = '';
      let lGroup = '';
      const nameLower = name.toLowerCase();

      for (const sc of sortedShortcuts as any[]) {
        const conv = (sc.conversion || '').toLowerCase().trim();
        const code = (sc.shortcut || '').toLowerCase().trim();
        if (conv && (nameLower === conv || nameLower.startsWith(conv + ' '))) {
          matchedConv = sc.conversion;
          uGroup = (sc.u_cap || '').trim();
          lGroup = (sc.l_cap || '').trim();
          break;
        } else if (code && (nameLower === code || nameLower.startsWith(code + ' '))) {
          matchedConv = sc.conversion;
          uGroup = (sc.u_cap || '').trim();
          lGroup = (sc.l_cap || '').trim();
          break;
        }
      }

      const mouldKey = matchedConv || name;
      if (qty > 0) {
        itemSummary[mouldKey] = (itemSummary[mouldKey] || 0) + qty;
      }

      if (uCap > 0) {
        const capName = (uGroup && uGroup !== '0' && uGroup !== '0.0' && uGroup !== 'None') ? uGroup : 'Fluted Jointer';
        groupSummary[capName] = (groupSummary[capName] || 0) + uCap;
      }

      if (lCap > 0) {
        const capName = (lGroup && lGroup !== '0' && lGroup !== '0.0' && lGroup !== 'None') ? lGroup : 'Jointer';
        groupSummary[capName] = (groupSummary[capName] || 0) + lCap;
      }
    });

    const totalCalculated = Object.keys(itemSummary).length + Object.keys(groupSummary).length;
    if (totalCalculated === 0) {
      showToast('Left Table is empty! Enter items & quantities first.', 'warning');
      return;
    }

    const newMoulds: FinishedItem[] = [];
    let idCounter = 1;

    // 1. Grouped Mould Items
    Object.entries(itemSummary).forEach(([mouldName, sumQty]) => {
      const pKey = mouldName.toLowerCase();
      const existing = finishedItems.find(m => m.mould.toLowerCase() === pKey);
      const price = (existing && existing.price > 0) ? existing.price : (defaultPriceMap[pKey] || 0);
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
      const existing = finishedItems.find(m => m.mould.toLowerCase() === pKey);
      const price = (existing && existing.price > 0) ? existing.price : (defaultPriceMap[pKey] || 0);
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
  }, [rawItems, finishedItems, playTapSound]);

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
      {/* Dynamic Background: Wallpaper Image or Solid / Gradient Color */}
      {bgType === 'image' ? (
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
            />

            {/* Center Workspace */}
            <div style={{ display: 'flex', flex: 1, gap: '12px', minHeight: 0, overflow: 'visible' }}>
              {/* Left Action Rail */}
              <LeftActionRail
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
                onReset={() => {
                  setHeader(INITIAL_HEADER);
                  setRawItems(INITIAL_RAW_ITEMS);
                  setFinishedItems(INITIAL_FINISHED_ITEMS);
                  showToast('Reset to Defaults', 'warning');
                }}
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
                onLoadBillToEditor={(bill) => {
                  setHeader({
                    docType: bill.docType,
                    partyName: bill.party,
                    typeSelection: bill.typeSelection || 'WHOLESALE',
                    vehicleNo: bill.vehicle || '',
                    date: bill.date,
                    tokenNo: bill.token
                  });
                  setRawItems(bill.rawItems || []);
                  setFinishedItems(bill.finishedItems || []);
                  setActiveTab('F1');
                  showToast('Loaded Invoice #' + bill.token + ' into Bill UI', 'success');
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

      {/* Apple Toast Capsule */}
      {toast && (
        <div 
          style={{
            position: 'fixed',
            top: '18px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999999,
            background: 'rgba(18, 22, 28, 0.92)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
            padding: '6px 16px',
            borderRadius: '9999px',
            display: 'flex',
            alignItems: 'center',
            gap: '7px',
            fontSize: '12px',
            fontWeight: 500,
            color: '#f5f5f7'
          }}
        >
          {toast.type === 'success' && <CheckCircle2 size={13} color="#34c759" />}
          {toast.type === 'info' && <Info size={13} color="#38bdf8" />}
          {toast.type === 'warning' && <AlertTriangle size={13} color="#fbbf24" />}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <DatabaseProvider>
      <SettingsProvider>
        <AppContent />
      </SettingsProvider>
    </DatabaseProvider>
  );
}

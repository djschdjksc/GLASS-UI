import { macAudio } from '../utils/macAudio';
import React, { useState } from 'react';
import { 
  ArrowRightLeft, 
  PackagePlus, 
  SlidersHorizontal, 
  Search, 
  Download,
  Calculator,
  MessageSquare,
  Moon,
  Sparkles
} from 'lucide-react';
import { localDb } from '../services/db/localDb';
import type { RawItem, FinishedItem } from '../types';
import { SQLITE_BILLS } from '../data/sqliteData';
import { normalizeDocType, getBillCategory } from '../utils/billDocTypes';

export type AppMode = 'ENTRY' | 'SEARCH_LOAD' | 'SUMMARY';

export interface SavedSlipData {
  tokenNo: string;
  docType: string;
  partyName: string;
  typeSelection: string;
  vehicleNo: string;
  date: string;
  rawItems: RawItem[];
  finishedItems: FinishedItem[];
  dynamicCols?: { field: string; label: string }[];
}

export const PRESET_SLIPS: SavedSlipData[] = [
  {
    tokenNo: '626',
    docType: 'SALE BILL',
    partyName: 'Apex Industrial Moldings Pvt Ltd',
    typeSelection: 'WHOLESALE',
    vehicleNo: 'UP-16-AX-9921',
    date: '2026-09-18',
    rawItems: [
      { id: '1', name: 'Aluminium Ingot 6063', qty: 120, uCap: 95, lCap: 80 },
      { id: '2', name: 'Silicon Carbide Grain', qty: 45, uCap: 30, lCap: 25 },
      { id: '3', name: 'Hardener Rod H-88', qty: 250, uCap: 180, lCap: 160 },
      { id: '4', name: 'Graphite Die Core 40mm', qty: 80, uCap: 65, lCap: 60 }
    ],
    finishedItems: [
      { id: '1', mould: 'Mould 14x20 Standard Housing', qty: 15, price: 650, total: 9750 },
      { id: '2', mould: 'Mould 18x24 Reinforced Casing', qty: 12, price: 920, total: 11040 },
      { id: '3', mould: 'Die Core Cap 50mm Precision', qty: 8, price: 1250, total: 10000 },
      { id: '4', mould: 'Heat Sink Fin Mount Extrusion', qty: 6, price: 750, total: 4500 }
    ]
  },
  {
    tokenNo: '625',
    docType: 'TAX INVOICE',
    partyName: 'Shree Balaji Traders & Co.',
    typeSelection: 'RETAIL',
    vehicleNo: 'DL-01-BK-4421',
    date: '2026-09-17',
    rawItems: [
      { id: '1', name: 'Copper Wire Rods 8mm', qty: 200, uCap: 150, lCap: 140 },
      { id: '2', name: 'Zinc Alloy Ingots #5', qty: 90, uCap: 70, lCap: 65 },
      { id: '3', name: 'Brass Billet Extrusion', qty: 110, uCap: 85, lCap: 75 }
    ],
    finishedItems: [
      { id: '1', mould: 'Mould 22x30 Heavy Flange', qty: 20, price: 1400, total: 28000 },
      { id: '2', mould: 'Precision Die Block 60mm', qty: 10, price: 1450, total: 14500 }
    ]
  },
  {
    tokenNo: '624',
    docType: 'SALE BILL',
    partyName: 'Precision Die & Tools Corp',
    typeSelection: 'JOB WORK',
    vehicleNo: 'HR-26-CV-8812',
    date: '2026-09-16',
    rawItems: [
      { id: '1', name: 'High Carbon Steel Sheet', qty: 320, uCap: 280, lCap: 240 },
      { id: '2', name: 'Tungsten Carbide Insert', qty: 150, uCap: 120, lCap: 110 }
    ],
    finishedItems: [
      { id: '1', mould: 'Mould 30x40 Automotive Panel', qty: 10, price: 5500, total: 55000 },
      { id: '2', mould: 'Die Shank Adaptor 90mm', qty: 15, price: 2266, total: 34000 }
    ]
  },
  {
    tokenNo: '623',
    docType: 'ESTIMATE',
    partyName: 'Gupta Electro-Mechanical Works',
    typeSelection: 'WHOLESALE',
    vehicleNo: 'UP-32-DN-1109',
    date: '2026-09-15',
    rawItems: [
      { id: '1', name: 'Cast Iron Block Grade-2', qty: 180, uCap: 140, lCap: 130 },
      { id: '2', name: 'Nickel Powder Catalyst', qty: 40, uCap: 30, lCap: 25 }
    ],
    finishedItems: [
      { id: '1', mould: 'Mould 16x16 Rotor Housing', qty: 12, price: 1200, total: 14400 },
      { id: '2', mould: 'Stator Core Clamp Ring', qty: 15, price: 680, total: 10200 }
    ]
  },
  {
    tokenNo: '622',
    docType: 'TAX INVOICE',
    partyName: 'Supertech Electro India Ltd',
    typeSelection: 'INTER-STATE',
    vehicleNo: 'MH-02-EZ-5590',
    date: '2026-09-14',
    rawItems: [
      { id: '1', name: 'Silver Contact Rivets', qty: 500, uCap: 450, lCap: 400 },
      { id: '2', name: 'Phosphor Bronze Strip', qty: 180, uCap: 150, lCap: 140 }
    ],
    finishedItems: [
      { id: '1', mould: 'Mould 25x35 Transformer Casing', qty: 16, price: 4200, total: 67200 },
      { id: '2', mould: 'Circuit Breaker Armature Mould', qty: 14, price: 3200, total: 44800 }
    ]
  }
];

interface Props {
  autoConvert: boolean;
  autoItem: boolean;
  simpleMode: boolean;
  onToggle: (key: 'autoConvert' | 'autoItem' | 'simpleMode' | 'rowMode') => void;
  activeMode?: AppMode;
  onChangeMode?: (mode: AppMode) => void;
  onLoadSlipData: (slip: SavedSlipData) => void;
  onToast: (msg: string, type?: 'success' | 'info' | 'warning') => void;
  onToggleCalculator?: () => void;
  isCalculatorOpen?: boolean;
  onToggleChat?: () => void;
  isChatOpen?: boolean;
  unreadChatCount?: number;
  themeMode?: 'dark' | 'glass';
  onChangeThemeMode?: (mode: 'dark' | 'glass') => void;
  activeDocType?: string;
}

export const BottomModeBar: React.FC<Props> = ({
  autoConvert,
  autoItem,
  simpleMode,
  onToggle,
  onLoadSlipData,
  onToast,
  onToggleCalculator,
  isCalculatorOpen = false,
  onToggleChat,
  isChatOpen = false,
  unreadChatCount = 0,
  themeMode = 'dark',
  onChangeThemeMode,
  activeDocType
}) => {
  const [searchSlipQuery, setSearchSlipQuery] = useState('');

  const executeSlipSearchAndLoad = () => {
    const rawQ = searchSlipQuery.trim();
    if (!rawQ) {
      onToast('Enter Bill # or Party Name to search!', 'warning');
      return;
    }
    const cleanNum = rawQ.replace(/^(bill|slip|#)\s*/i, '').trim();
    const qLower = cleanNum.toLowerCase();
    const currentDoc = normalizeDocType(activeDocType);

    // 1. Filter localDb bills by selected DocType
    const allBills = localDb.getBills();
    const categoryBills = allBills.filter(b => getBillCategory(b) === currentDoc);

    // Priority 1: Match by token number within selected DocType
    let matched: any = categoryBills.find(b => 
      b.token === cleanNum || b.token.toLowerCase() === qLower
    );

    // Priority 2: Match by party name within selected DocType
    if (!matched) {
      matched = categoryBills.find(b => 
        b.party && b.party.toLowerCase().includes(rawQ.toLowerCase())
      );
    }

    // Priority 3: Search in SQLITE_BILLS with selected DocType
    if (!matched && SQLITE_BILLS && SQLITE_BILLS.length > 0) {
      const sqliteCategoryBills = SQLITE_BILLS.filter((b: any) => getBillCategory(b) === currentDoc);
      matched = sqliteCategoryBills.find((b: any) => 
        String(b.token) === cleanNum || String(b.token).toLowerCase() === qLower
      ) || sqliteCategoryBills.find((b: any) => 
        b.party && b.party.toLowerCase().includes(rawQ.toLowerCase())
      );
    }

    // If not matched under current DocType, check if it exists in another DocType to give smart feedback
    if (!matched) {
      const otherMatch = allBills.find(b => 
        b.token === cleanNum || String(b.token).toLowerCase() === qLower
      ) || (SQLITE_BILLS || []).find((b: any) => 
        String(b.token) === cleanNum || String(b.token).toLowerCase() === qLower
      );

      if (otherMatch) {
        const otherDoc = getBillCategory(otherMatch);
        onToast(`Bill #${cleanNum} exists under "${otherDoc}", not "${currentDoc}". Change Bill Type to load it.`, 'warning');
        return;
      }

      onToast(`Bill #${rawQ} not found under ${currentDoc}!`, 'warning');
      return;
    }

    if (matched) {
      const slipData: SavedSlipData = {
        tokenNo: String(matched.token),
        docType: currentDoc,
        partyName: matched.party || '',
        typeSelection: matched.typeSelection || 'WHOLESALE',
        vehicleNo: matched.vehicle || '',
        date: matched.date || new Date().toISOString().split('T')[0],
        rawItems: (matched.rawItems || []).map((r: any) => ({ ...r })),
        finishedItems: (matched.finishedItems || []).map((f: any) => ({ ...f })),
        dynamicCols: matched.dynamicCols ? matched.dynamicCols.map((c: any) => ({ ...c })) : []
      };
      onLoadSlipData(slipData);
      onToast(`Loaded ${currentDoc} Bill #${matched.token} — ${matched.party || 'No Party'}`, 'success');
      setSearchSlipQuery('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      executeSlipSearchAndLoad();
    }
  };

  return (
    <div 
      data-np-zone="5"
      className="glass-panel"
      style={{
        padding: '5px 12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        borderRadius: '10px',
        position: 'relative',
        zIndex: 40,
        overflow: 'visible'
      }}
    >
      {/* LEFT: 3 Action Toggle Buttons matching Left/Right Rails */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'visible' }}>
        {/* Button 1: AUTO CONVERT */}
        <button
          data-np-target="5-1"
          type="button"
          onMouseEnter={() => macAudio.playHover()}
          onClick={() => {
            macAudio.playClick();
            onToggle('autoConvert');
            onToast(`AUTO CONVERT: ${!autoConvert ? 'ON' : 'OFF'}`, !autoConvert ? 'success' : 'info');
          }}
          className={`apple-box-btn ${autoConvert ? 'active' : ''}`}
          style={{ width: '36px', height: '36px' }}
        >
          <span className="box-tooltip-top">AUTO CONVERT [Alt+A / Numpad *]</span>
          <ArrowRightLeft size={16} color={autoConvert ? '#38bdf8' : 'currentColor'} />
        </button>

        {/* Button 2: AUTO ITEM */}
        <button
          data-np-target="5-2"
          type="button"
          onMouseEnter={() => macAudio.playHover()}
          onClick={() => {
            macAudio.playClick();
            onToggle('autoItem');
            onToast(`AUTO ITEM: ${!autoItem ? 'ON' : 'OFF'}`, !autoItem ? 'success' : 'info');
          }}
          className={`apple-box-btn ${autoItem ? 'active' : ''}`}
          style={{ width: '36px', height: '36px' }}
        >
          <span className="box-tooltip-top">AUTO ITEM [Alt+Z / Numpad *]</span>
          <PackagePlus size={16} color={autoItem ? '#38bdf8' : 'currentColor'} />
        </button>

        {/* Button 3: SIMPLE MODE */}
        <button
          data-np-target="5-3"
          type="button"
          onMouseEnter={() => macAudio.playHover()}
          onClick={() => {
            macAudio.playClick();
            onToggle('simpleMode');
            onToast(`SIMPLE MODE: ${!simpleMode ? 'ON' : 'OFF'}`, !simpleMode ? 'success' : 'info');
          }}
          className={`apple-box-btn ${simpleMode ? 'active' : ''}`}
          style={{ width: '36px', height: '36px' }}
        >
          <span className="box-tooltip-top">SIMPLE MODE [Alt+X / Numpad *]</span>
          <SlidersHorizontal size={16} color={simpleMode ? '#38bdf8' : 'currentColor'} />
        </button>
      </div>

      {/* RIGHT: Tools (Calculator, Chat, Theme Mode) + Bill Search */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'visible' }}>
        
        {/* Calculator Button */}
        {onToggleCalculator && (
          <button
            type="button"
            onMouseEnter={() => macAudio.playHover()}
            onClick={() => {
              macAudio.playClick();
              onToggleCalculator();
            }}
            className={`apple-box-btn ${isCalculatorOpen ? 'active' : ''}`}
            style={{ 
              width: '36px', 
              height: '36px',
              borderRadius: '8px',
              background: isCalculatorOpen ? 'rgba(56, 189, 248, 0.25)' : undefined,
              borderColor: isCalculatorOpen ? '#38bdf8' : undefined
            }}
            title="Calculator (Numpad Ready • F9)"
          >
            <span className="box-tooltip-top">Calculator (F9)</span>
            <Calculator size={16} color={isCalculatorOpen ? '#38bdf8' : 'currentColor'} />
          </button>
        )}

        {/* AI Chat Assistant Button */}
        {onToggleChat && (
          <button
            type="button"
            onMouseEnter={() => macAudio.playHover()}
            onClick={() => {
              macAudio.playClick();
              onToggleChat();
            }}
            className={`apple-box-btn ${isChatOpen ? 'active' : ''}`}
            style={{ 
              position: 'relative',
              width: '36px', 
              height: '36px',
              borderRadius: '8px',
              background: isChatOpen ? 'rgba(59, 130, 246, 0.25)' : undefined,
              borderColor: isChatOpen ? '#3b82f6' : undefined
            }}
            title="Chat Assistant (Ctrl+J)"
          >
            <span className="box-tooltip-top">Chat Assistant (Ctrl+J)</span>
            <MessageSquare size={16} color={isChatOpen ? '#38bdf8' : 'currentColor'} />
            {unreadChatCount > 0 && !isChatOpen && (
              <span
                style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  background: '#ef4444',
                  color: '#ffffff',
                  fontSize: '9.5px',
                  fontWeight: 800,
                  minWidth: '16px',
                  height: '16px',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 3px',
                  boxShadow: '0 2px 6px rgba(239, 68, 68, 0.6)',
                  border: '1.5px solid #000'
                }}
              >
                {unreadChatCount}
              </span>
            )}
          </button>
        )}

        {/* Theme Mode Button (Dark / Glass) */}
        {onChangeThemeMode && (
          <button
            type="button"
            onMouseEnter={() => macAudio.playHover()}
            onClick={() => {
              macAudio.playClick();
              const nextMode: 'dark' | 'glass' = themeMode === 'dark' ? 'glass' : 'dark';
              onChangeThemeMode(nextMode);
              onToast(`Theme switched to ${nextMode.toUpperCase()}`, 'info');
            }}
            className="apple-box-btn"
            style={{ 
              width: '36px', 
              height: '36px',
              borderRadius: '8px'
            }}
            title={`Theme: ${themeMode?.toUpperCase()} (Click to toggle)`}
          >
            <span className="box-tooltip-top">{themeMode === 'dark' ? 'Switch to Glass' : 'Switch to Dark'}</span>
            {themeMode === 'dark' ? (
              <Moon size={16} color="#38bdf8" />
            ) : (
              <Sparkles size={16} color="#a855f7" />
            )}
          </button>
        )}

        {/* Subtle Separator */}
        <div style={{ width: '1px', height: '20px', background: 'rgba(255, 255, 255, 0.12)', margin: '0 2px' }} />

        {/* Compact Slip Search Input (sized for ~15415, press Enter to Load) */}
        <div 
          className="apple-search-pill" 
          style={{ 
            width: '135px', 
            height: '34px',
            padding: '0 8px 0 28px',
            display: 'flex',
            alignItems: 'center',
            borderRadius: '8px',
            position: 'relative'
          }}
        >
          <Search 
            size={13} 
            style={{ 
              position: 'absolute', 
              left: '9px', 
              top: '50%', 
              transform: 'translateY(-50%)', 
              color: '#38bdf8',
              pointerEvents: 'none'
            }} 
          />
          <input
            data-np-target="5-4"
            type="text"
            placeholder={`Bill # (${normalizeDocType(activeDocType)})`}
            value={searchSlipQuery}
            onChange={(e) => setSearchSlipQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            title={`Type Bill # in ${normalizeDocType(activeDocType)} & press Enter to load`}
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'inherit',
              fontSize: '12px',
              fontWeight: 600,
              fontFamily: 'inherit'
            }}
          />
        </div>
      </div>
    </div>
  );
};

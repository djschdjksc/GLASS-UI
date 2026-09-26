import { macAudio } from '../utils/macAudio';
import React, { useState } from 'react';
import { 
  ArrowRightLeft, 
  PackagePlus, 
  SlidersHorizontal, 
  Search, 
  Download 
} from 'lucide-react';
import type { RawItem, FinishedItem } from '../types';
import { localDb } from '../services/db/localDb';
import { SQLITE_BILLS } from '../data/sqliteData';

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
}

export const BottomModeBar: React.FC<Props> = ({
  autoConvert,
  autoItem,
  simpleMode,
  onToggle,
  onLoadSlipData,
  onToast
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

    // 1. Search in localDb
    const allBills = localDb.getBills();
    let matched: any = allBills.find(b => 
      b.token === cleanNum || 
      b.token.toLowerCase() === qLower ||
      b.party.toLowerCase().includes(rawQ.toLowerCase())
    );

    // 2. If not found in localDb, search in real SQLITE_BILLS
    if (!matched && SQLITE_BILLS && SQLITE_BILLS.length > 0) {
      matched = SQLITE_BILLS.find((b: any) => 
        String(b.token) === cleanNum || 
        String(b.token).toLowerCase() === qLower ||
        (b.party && b.party.toLowerCase().includes(rawQ.toLowerCase()))
      );
    }

    if (matched) {
      const slipData: SavedSlipData = {
        tokenNo: String(matched.token),
        docType: matched.docType || 'SALE BILL',
        partyName: matched.party || '',
        typeSelection: matched.typeSelection || 'WHOLESALE',
        vehicleNo: matched.vehicle || '',
        date: matched.date || new Date().toISOString().split('T')[0],
        rawItems: (matched.rawItems || []).map((r: any) => ({ ...r })),
        finishedItems: (matched.finishedItems || []).map((f: any) => ({ ...f })),
        dynamicCols: matched.dynamicCols ? matched.dynamicCols.map((c: any) => ({ ...c })) : []
      };
      onLoadSlipData(slipData);
      onToast(`Loaded Bill #${matched.token} — ${matched.party || 'No Party'}`, 'success');
      setSearchSlipQuery('');
    } else {
      onToast(`Bill #${rawQ} not found in database!`, 'warning');
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
          <span className="box-tooltip-top">AUTO CONVERT</span>
          <ArrowRightLeft size={16} color={autoConvert ? '#38bdf8' : '#d4d4d8'} />
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
          <span className="box-tooltip-top">AUTO ITEM</span>
          <PackagePlus size={16} color={autoItem ? '#38bdf8' : '#d4d4d8'} />
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
          <span className="box-tooltip-top">SIMPLE MODE</span>
          <SlidersHorizontal size={16} color={simpleMode ? '#38bdf8' : '#d4d4d8'} />
        </button>
      </div>

      {/* RIGHT: Compact Slip Search Input (sized for ~15415, press Enter to Load) */}
      <div style={{ display: 'flex', alignItems: 'center', overflow: 'visible' }}>
        <div 
          className="apple-search-pill" 
          style={{ 
            width: '95px', 
            height: '34px',
            background: 'rgba(0, 0, 0, 0.35)',
            border: '1px solid rgba(0, 113, 227, 0.35)',
            padding: '0 8px 0 26px',
            display: 'flex',
            alignItems: 'center',
            borderRadius: '8px',
            position: 'relative'
          }}
        >
          <Search 
            size={12} 
            style={{ 
              position: 'absolute', 
              left: '8px', 
              top: '50%', 
              transform: 'translateY(-50%)', 
              color: '#38bdf8',
              pointerEvents: 'none'
            }} 
          />
          <input
            data-np-target="5-4"
            type="text"
            placeholder="Bill #..."
            value={searchSlipQuery}
            onChange={(e) => setSearchSlipQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            title="Type Bill # (e.g. 528) & press Enter"
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#ffffff',
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

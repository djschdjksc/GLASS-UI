import React, { useState } from 'react';
import type { BillHeader } from '../types';
import { AppleTrafficLights } from './AppleTrafficLights';
import { Plus, Check, ChevronDown, Calendar, Moon, Sun, Sparkles, MessageSquare } from 'lucide-react';
import { SQLITE_PARTIES } from '../data/sqliteData';
import { ShadcnDatePicker } from './common/ShadcnDatePicker';
import { macAudio } from '../utils/macAudio';

interface Props {
  header: BillHeader;
  onChange: (updated: Partial<BillHeader>) => void;
  onCloseApp: () => void;
  onAddNewParty: (name: string) => void;
  onSkipBill?: () => void;
  onSaveBill?: () => void;
  themeMode?: 'dark' | 'white' | 'glass';
  onChangeThemeMode?: (mode: 'dark' | 'white' | 'glass') => void;
  onToggleChat?: () => void;
  isChatOpen?: boolean;
}

const COMMON_PARTIES = [
  'Shree Balaji Traders & Co.',
  'Apex Industrial Moldings Pvt Ltd',
  'Gupta Electro-Mechanical Works',
  'Shiv Shakti Engineering',
  'Precision Die & Tools Corp',
  'Mahaveer Enterprises',
  'Om Sai Tech Industries',
  'Supertech Electro India Ltd'
];

const REAL_PARTIES: string[] = (SQLITE_PARTIES && SQLITE_PARTIES.length > 0)
  ? Array.from(new Set(SQLITE_PARTIES.map((p: any) => p.party_name).filter(Boolean)))
  : COMMON_PARTIES;

const DOC_TYPES = ['SALE BILL', 'PURCHASE BILL', 'TAX INVOICE', 'ESTIMATE', 'CHALLAN'];
const TYPE_SELECTIONS = ['RETAIL', 'WHOLESALE', 'JOB WORK', 'INTER-STATE', 'EXPORT'];

export const AppleHeader: React.FC<Props> = ({ 
  header, 
  onChange, 
  onCloseApp, 
  onAddNewParty, 
  onSkipBill,
  onSaveBill,
  themeMode = 'dark',
  onChangeThemeMode,
  onToggleChat,
  isChatOpen = false
}) => {
  const [showPartySuggestions, setShowPartySuggestions] = useState(false);
  const [partyList, setPartyList] = useState<string[]>(REAL_PARTIES);
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const partyNameStr = (header?.partyName || '').trim();
  const filteredParties = partyList.filter(p => 
    (p || '').toLowerCase().includes(partyNameStr.toLowerCase())
  );

  const handleQuickAdd = () => {
    const entered = partyNameStr;
    if (entered && !partyList.includes(entered)) {
      setPartyList(prev => [entered, ...prev]);
      onAddNewParty(entered);
      setShowPartySuggestions(false);
    }
  };

  return (
    <div 
      data-np-zone="1"
      className="glass-panel" 
      style={{ 
        position: 'relative',
        zIndex: 9999,
        padding: '10px 16px', 
        marginBottom: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
        <AppleTrafficLights onClose={onCloseApp} />

        {/* Document Type Dropdown */}
        <div style={{ position: 'relative', width: '130px' }}>
          <select
            data-np-target="1-1"
            className="apple-select"
            style={{ width: '100%', paddingRight: '22px', fontWeight: 600, color: '#38bdf8' }}
            value={header.docType}
            onChange={(e) => onChange({ docType: e.target.value })}
          >
            {DOC_TYPES.map(t => (
              <option key={t} value={t} style={{ background: '#161b22', color: '#ffffff' }}>
                {t}
              </option>
            ))}
          </select>
          <ChevronDown size={11} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#a1a1aa' }} />
        </div>

        {/* Party Name Search Box with Quick Add (+) Button */}
        <div style={{ position: 'relative', flex: 1.5, display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <input
              data-np-target="1-2"
              type="text"
              className="apple-input"
              placeholder="Search or Enter Party..."
              value={header.partyName}
              onFocus={() => setShowPartySuggestions(true)}
              onBlur={() => setTimeout(() => setShowPartySuggestions(false), 240)}
              onChange={(e) => {
                onChange({ partyName: e.target.value });
                setFocusedIndex(-1);
              }}
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  if (!showPartySuggestions) setShowPartySuggestions(true);
                  setFocusedIndex(prev => Math.min(prev + 1, filteredParties.length - 1));
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  setFocusedIndex(prev => Math.max(prev - 1, 0));
                } else if (e.key === 'Enter') {
                  e.preventDefault();
                  if (showPartySuggestions && focusedIndex >= 0 && focusedIndex < filteredParties.length) {
                    onChange({ partyName: filteredParties[focusedIndex] });
                    setShowPartySuggestions(false);
                  } else {
                    handleQuickAdd();
                  }
                } else if (e.key === 'Escape' && showPartySuggestions) {
                  e.stopPropagation();
                  setShowPartySuggestions(false);
                }
              }}
              style={{ width: '100%', fontWeight: 500 }}
            />

            {showPartySuggestions && (
              <div 
                className="party-suggestions-dropdown ant-dropdown-anim"
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  marginTop: '4px',
                  borderRadius: '7px',
                  zIndex: 99999999,
                  maxHeight: '180px',
                  overflowY: 'auto'
                }}
              >
                {filteredParties.map((party, idx) => (
                  <div
                    key={party}
                    onClick={() => {
                      onChange({ partyName: party });
                      setShowPartySuggestions(false);
                    }}
                    style={{
                      padding: '7px 10px',
                      fontSize: '11.5px',
                      cursor: 'pointer',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: focusedIndex === idx ? 'rgba(0, 113, 227, 0.4)' : 'transparent'
                    }}
                    onMouseEnter={() => setFocusedIndex(idx)}
                    
                  >
                    <span>{party}</span>
                    {header.partyName === party && <Check size={12} color="#34c759" />}
                  </div>
                ))}

                {/* If Party Not Found or Typed New */}
                {partyNameStr && !filteredParties.includes(partyNameStr) && (
                  <div
                    onClick={handleQuickAdd}
                    style={{
                      padding: '8px 10px',
                      fontSize: '11.5px',
                      cursor: 'pointer',
                      background: 'rgba(0, 113, 227, 0.15)',
                      color: '#38bdf8',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0, 113, 227, 0.35)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0, 113, 227, 0.15)'}
                  >
                    <Plus size={13} />
                    <span>Add "{partyNameStr}" as New Party</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Dedicated Quick Add (+) Button next to search box */}
          <button
            type="button"
            onClick={handleQuickAdd}
            className="apple-box-btn"
            style={{ width: '32px', height: '32px', borderRadius: '7px', flexShrink: 0 }}
            title="Add Party (+)"
          >
            <span className="box-tooltip-right">Add Party (+)</span>
            <Plus size={14} />
          </button>
        </div>

        {/* Type Selection Dropdown */}
        <div style={{ position: 'relative', width: '110px' }}>
          <select
            data-np-target="1-3"
            className="apple-select"
            style={{ width: '100%', paddingRight: '20px' }}
            value={header.typeSelection}
            onChange={(e) => onChange({ typeSelection: e.target.value })}
          >
            {TYPE_SELECTIONS.map(ts => (
              <option key={ts} value={ts}>
                {ts}
              </option>
            ))}
          </select>
          <ChevronDown size={11} style={{ position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#a1a1aa' }} />
        </div>

        {/* Vehicle No Input */}
        <div style={{ width: '130px' }}>
          <input
            data-np-target="1-4"
            type="text"
            className="apple-input"
            placeholder="Vehicle No..."
            value={header.vehicleNo}
            onChange={(e) => onChange({ vehicleNo: e.target.value })}
            style={{ width: '100%' }}
          />
        </div>

        {/* Modern Shadcn Date Picker */}
        <ShadcnDatePicker
          value={header.date}
          onChange={(newDate) => onChange({ date: newDate })}
          placeholder="Bill Date"
        />
      </div>

      {/* Right Controls: 3-Mode Theme Switcher, Chat AI Button, Token Badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Single Multi-Click Cycling Theme Mode Button */}
        {onChangeThemeMode && (
          <button
            type="button"
            onClick={() => {
              macAudio.playClick();
              const nextMode = 
                themeMode === 'dark' ? 'white' :
                themeMode === 'white' ? 'glass' : 'dark';
              onChangeThemeMode(nextMode);
            }}
            className="apple-box-btn"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              cursor: 'pointer',
              flexShrink: 0
            }}
            title={`Mode: ${themeMode?.toUpperCase()} (Click to switch to ${
              themeMode === 'dark' ? 'White' : themeMode === 'white' ? 'Glass' : 'Dark'
            })`}
          >
            <span className="box-tooltip-left">
              {themeMode === 'dark' && 'Dark Mode → Click for White'}
              {themeMode === 'white' && 'White Mode → Click for Glass'}
              {themeMode === 'glass' && 'Glass Mode → Click for Dark'}
            </span>
            {themeMode === 'dark' && <Moon size={15} color="#38bdf8" />}
            {themeMode === 'white' && <Sun size={15} color="#f59e0b" />}
            {themeMode === 'glass' && <Sparkles size={15} color="#a855f7" />}
          </button>
        )}

        {/* Red Token Badge */}
        <div 
          data-np-target="1-6"
          className="apple-token-badge"
          tabIndex={0}
          title="Token Number"
        >
          <span>#{header.tokenNo}</span>
        </div>
      </div>
    </div>
  );
};

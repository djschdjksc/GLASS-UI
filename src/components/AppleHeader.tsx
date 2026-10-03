import React, { useState } from 'react';
import type { BillHeader } from '../types';
import { Plus, Check, ChevronDown, Calendar, Moon, Sparkles, MessageSquare, Calculator, User, History } from 'lucide-react';
import { SQLITE_PARTIES } from '../data/sqliteData';
import { ShadcnDatePicker } from './common/ShadcnDatePicker';
import { macAudio } from '../utils/macAudio';
import { DOC_TYPES } from '../utils/billDocTypes';
import { getUserProfile } from '../services/supabaseClient';
import { Select as ShadcnSelect } from './ui/shadcn';

interface Props {
  header: BillHeader;
  onChange: (updated: Partial<BillHeader>) => void;
  onCloseApp?: () => void;
  onAddNewParty: (name: string) => void;
  onSkipBill?: () => void;
  onSaveBill?: () => void;
  themeMode?: 'dark' | 'glass';
  onChangeThemeMode?: (mode: 'dark' | 'glass') => void;
  onToggleChat?: () => void;
  isChatOpen?: boolean;
  onToggleCalculator?: () => void;
  isCalculatorOpen?: boolean;
  onNavigateToLeftGrid?: () => void;
  onOpenUserProfile?: () => void;
  onOpenAuditHistory?: () => void;
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
  isChatOpen = false,
  onToggleCalculator,
  isCalculatorOpen = false,
  onNavigateToLeftGrid,
  onOpenUserProfile,
  onOpenAuditHistory
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
        padding: '8px 14px', 
        marginBottom: '0px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>

        {/* Document Type Dropdown */}
        <div style={{ position: 'relative', width: '130px' }}>
          <ShadcnSelect
            id="header-doc-type"
            data-np-target="1-1"
            style={{ width: '100%', height: '32px', fontWeight: 600, color: '#f4f4f5' }}
            value={header.docType}
            onChange={(e: any) => onChange({ docType: e.target.value })}
            onKeyDown={(e: any) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                const partyInput = document.getElementById('header-party-name') as HTMLInputElement | null;
                if (partyInput) {
                  partyInput.focus();
                  partyInput.select();
                }
              }
            }}
          >
            {DOC_TYPES.map(t => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </ShadcnSelect>
        </div>

        {/* Party Name Search Box with Quick Add (+) Button */}
        <div style={{ position: 'relative', flex: 1.5, display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <input
              id="header-party-name"
              data-np-target="1-2"
              type="text"
              className="apple-input"
              placeholder="Search or Enter Party..."
              value={header.partyName}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              data-lpignore="true"
              data-form-type="other"
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
                  if (showPartySuggestions && filteredParties.length > 0) {
                    const chosen = (focusedIndex >= 0 && focusedIndex < filteredParties.length)
                      ? filteredParties[focusedIndex]
                      : filteredParties[0];
                    onChange({ partyName: chosen });
                    setShowPartySuggestions(false);
                  } else {
                    handleQuickAdd();
                  }
                  setTimeout(() => {
                    const typeSelect = document.getElementById('header-type-selection') as HTMLSelectElement | null;
                    if (typeSelect) {
                      typeSelect.focus();
                    }
                  }, 40);
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
                    className="anim-cascade"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onChange({ partyName: party });
                      setShowPartySuggestions(false);
                    }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
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
                      background: focusedIndex === idx ? 'rgba(0, 113, 227, 0.4)' : 'transparent',
                      animationDelay: `${Math.min(idx, 10) * 0.025}s`
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
          <ShadcnSelect
            id="header-type-selection"
            data-np-target="1-3"
            style={{ width: '100%', height: '32px' }}
            value={header.typeSelection}
            onChange={(e: any) => onChange({ typeSelection: e.target.value })}
            onKeyDown={(e: any) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                const vehicleInput = document.getElementById('header-vehicle-no') as HTMLInputElement | null;
                if (vehicleInput) {
                  vehicleInput.focus();
                  vehicleInput.select();
                }
              }
            }}
          >
            {TYPE_SELECTIONS.map(ts => (
              <option key={ts} value={ts}>
                {ts}
              </option>
            ))}
          </ShadcnSelect>
        </div>

        {/* Vehicle No Input */}
        <div style={{ width: '130px' }}>
          <input
            id="header-vehicle-no"
            data-np-target="1-4"
            type="text"
            className="apple-input"
            placeholder="Vehicle No..."
            value={header.vehicleNo}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            data-lpignore="true"
            data-form-type="other"
            onChange={(e) => onChange({ vehicleNo: e.target.value })}
            style={{ width: '100%' }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                const dateBtn = document.getElementById('header-date-picker') as HTMLElement | null;
                if (dateBtn) {
                  dateBtn.focus();
                }
              }
            }}
          />
        </div>

        {/* Modern Shadcn Date Picker */}
        <ShadcnDatePicker
          id="header-date-picker"
          value={header.date}
          onChange={(newDate) => onChange({ date: newDate })}
          onEnterNext={onNavigateToLeftGrid}
          placeholder="Bill Date"
        />
      </div>

      {/* Right Controls: Token Badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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

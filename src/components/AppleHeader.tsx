import React, { useState, useEffect } from 'react';
import type { BillHeader } from '../types';
import { Plus, Check, ChevronDown, Calendar, Moon, Sparkles, MessageSquare, Calculator, User, History, Building2 } from 'lucide-react';
import { SQLITE_PARTIES } from '../data/sqliteData';
import { ShadcnDatePicker } from './common/ShadcnDatePicker';
import { macAudio } from '../utils/macAudio';
import { DOC_TYPES } from '../utils/billDocTypes';
import { getUserProfile } from '../services/supabaseClient';
import { Select as ShadcnSelect } from './ui/shadcn';
import { localDb } from '../services/db/localDb';
import type { PartyRecord } from '../services/db/schema';

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
  const [partyList, setPartyList] = useState<string[]>(() => {
    const dbParties = localDb.getParties().map(p => p.name).filter(Boolean);
    const sqliteParties = (SQLITE_PARTIES && SQLITE_PARTIES.length > 0)
      ? SQLITE_PARTIES.map((p: any) => p.party_name).filter(Boolean)
      : COMMON_PARTIES;
    return Array.from(new Set([...dbParties, ...sqliteParties]));
  });
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [newPartyConfirm, setNewPartyConfirm] = useState<{
    isOpen: boolean;
    name: string;
  } | null>(null);

  // Subscribe to live Party changes across DB
  useEffect(() => {
    const unsub = localDb.subscribe('parties', (parties: PartyRecord[]) => {
      const names = parties.map(p => p.name).filter(Boolean);
      setPartyList(prev => Array.from(new Set([...names, ...prev])));
    });
    return () => unsub();
  }, []);

  const partyNameStr = (header?.partyName || '').trim();
  const filteredParties = partyList.filter(p => 
    (p || '').toLowerCase().includes(partyNameStr.toLowerCase())
  );

  const focusNextInput = () => {
    setTimeout(() => {
      const typeSelect = document.getElementById('header-type-selection') as HTMLSelectElement | null;
      if (typeSelect) {
        typeSelect.focus();
      }
    }, 40);
  };

  const handleConfirmSaveNewParty = async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) {
      setNewPartyConfirm(null);
      return;
    }

    const newParty: PartyRecord = {
      id: `P-${Date.now()}`,
      name: trimmed,
      contact: '',
      phone: '',
      city: 'Local',
      station: '',
      district: '',
      state: '',
      pincode: '',
      balance: 0,
      limit: 500000,
      gstin: '',
      updatedAt: Date.now(),
      synced: false
    };

    try {
      await localDb.saveParty(newParty);
    } catch {}

    setPartyList(prev => Array.from(new Set([trimmed, ...prev])));
    onAddNewParty(trimmed);
    onChange({ partyName: trimmed });
    macAudio.playPop();
    setNewPartyConfirm(null);
    focusNextInput();
  };

  // Keyboard accessibility for confirmation modal
  useEffect(() => {
    if (!newPartyConfirm?.isOpen) return;
    const handleModalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        handleConfirmSaveNewParty(newPartyConfirm.name);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        setNewPartyConfirm(null);
        focusNextInput();
      }
    };
    window.addEventListener('keydown', handleModalKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleModalKeyDown, { capture: true });
  }, [newPartyConfirm]);

  const handleTriggerAddParty = (nameToAdd?: string) => {
    const entered = (nameToAdd !== undefined ? nameToAdd : partyNameStr).trim();
    if (!entered) {
      const partyInput = document.getElementById('header-party-name') as HTMLInputElement | null;
      partyInput?.focus();
      return;
    }
    const exactMatch = partyList.find(p => p.trim().toLowerCase() === entered.toLowerCase());
    if (exactMatch) {
      onChange({ partyName: exactMatch });
      setShowPartySuggestions(false);
      focusNextInput();
    } else {
      setShowPartySuggestions(false);
      setNewPartyConfirm({ isOpen: true, name: entered });
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
                  const entered = (header?.partyName || '').trim();
                  if (!entered) {
                    focusNextInput();
                    return;
                  }

                  // 1. If suggestion dropdown is open and user highlighted an item
                  if (showPartySuggestions && filteredParties.length > 0 && focusedIndex >= 0 && focusedIndex < filteredParties.length) {
                    const chosen = filteredParties[focusedIndex];
                    onChange({ partyName: chosen });
                    setShowPartySuggestions(false);
                    focusNextInput();
                    return;
                  }

                  // 2. Check if entered name has exact match in existing DB parties
                  const exactMatch = partyList.find(p => p.trim().toLowerCase() === entered.toLowerCase());
                  if (exactMatch) {
                    onChange({ partyName: exactMatch });
                    setShowPartySuggestions(false);
                    focusNextInput();
                    return;
                  }

                  // 3. New party NOT in DB: Trigger confirmation modal!
                  handleTriggerAddParty(entered);
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
                {partyNameStr && !partyList.some(p => p.toLowerCase() === partyNameStr.toLowerCase()) && (
                  <div
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleTriggerAddParty(partyNameStr);
                    }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleTriggerAddParty(partyNameStr);
                    }}
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
                    <span>Add "{partyNameStr}" as New Party (Database Save)</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Dedicated Quick Add (+) Button next to search box */}
          <button
            type="button"
            onClick={() => handleTriggerAddParty()}
            className="apple-box-btn"
            style={{ width: '32px', height: '32px', borderRadius: '7px', flexShrink: 0 }}
            title="Add New Party to Database (+)"
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

      {/* New Party Confirmation Modal */}
      {newPartyConfirm && newPartyConfirm.isOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(14px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999999,
            animation: 'fadeIn 0.15s ease'
          }}
          onClick={() => {
            // Do not dismiss on accidental click
          }}
        >
          <div
            style={{
              width: '440px',
              maxWidth: '92vw',
              background: 'rgba(18, 22, 32, 0.98)',
              border: '1px solid rgba(56, 189, 248, 0.45)',
              borderRadius: '16px',
              boxShadow: '0 24px 64px rgba(0, 0, 0, 0.85), 0 0 25px rgba(56, 189, 248, 0.25)',
              padding: '22px 24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              animation: 'antSlideDown 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '11px',
                background: 'rgba(56, 189, 248, 0.16)',
                border: '1px solid rgba(56, 189, 248, 0.38)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Building2 size={23} color="#38bdf8" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '15.5px', fontWeight: 700, color: '#f4f4f5', letterSpacing: '-0.01em' }}>
                  Save New Party? / नई पार्टी सेव करें?
                </h3>
                <p style={{ margin: '3px 0 0', fontSize: '11.5px', color: '#94a3b8' }}>
                  Party not available in database registry
                </p>
              </div>
            </div>

            <div style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.09)',
              borderRadius: '10px',
              padding: '13px 15px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              <div style={{ fontSize: '10.5px', color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>
                Party Name (नया नाम)
              </div>
              <div style={{ fontSize: '17px', fontWeight: 800, color: '#38bdf8', fontFamily: "'JetBrains Mono', sans-serif" }}>
                {newPartyConfirm.name}
              </div>
              <div style={{ fontSize: '12px', color: '#cbd5e1', marginTop: '4px', lineHeight: '1.45' }}>
                Kya aap <strong>"{newPartyConfirm.name}"</strong> ko Database mein <strong>Permanently Save</strong> karna chahte hain?
                <br />
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                  (Save karne par yeh aage se suggestions, bill history aur ledger mein hamesha show hogi)
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px', marginTop: '4px' }}>
              <button
                type="button"
                onClick={() => {
                  setNewPartyConfirm(null);
                  focusNextInput();
                }}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.16)',
                  background: 'rgba(255, 255, 255, 0.06)',
                  color: '#d4d4d8',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                ✕ No, Use Once Only (Esc)
              </button>

              <button
                type="button"
                autoFocus
                onClick={() => handleConfirmSaveNewParty(newPartyConfirm.name)}
                style={{
                  padding: '8px 18px',
                  borderRadius: '8px',
                  border: '1px solid rgba(52, 211, 153, 0.55)',
                  background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                  color: '#ffffff',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 16px rgba(16, 185, 129, 0.45)'
                }}
              >
                <Check size={14} />
                <span>YES, Save Permanently (Enter)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

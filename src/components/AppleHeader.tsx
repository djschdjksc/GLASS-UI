import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { BillHeader } from '../types';
import { Plus, Check, ChevronDown, Calendar, Moon, Sparkles, MessageSquare, Calculator, User, History, Building2, X } from 'lucide-react';
import { ShadcnDatePicker } from './common/ShadcnDatePicker';
import { macAudio } from '../utils/macAudio';
import { DOC_TYPES } from '../utils/billDocTypes';
import { getUserProfile } from '../services/supabaseClient';
import { Select as ShadcnSelect, Button, Input, Tooltip } from './ui/shadcn';
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

const REAL_PARTIES: string[] = COMMON_PARTIES;

const TYPE_SELECTIONS = ['RETAIL', 'WHOLESALE', 'JOB WORK', 'INTER-STATE', 'EXPORT'];

const DEFAULT_VEHICLE_TYPES = [
  'SELF',
  'TRUCK',
  'TEMPO',
  'AUTO',
  'COURIER',
  'HAND DELIVERY',
  'TRAIN',
  'BUS',
  'BY HAND',
];

export interface HeaderPartyOption {
  name: string;
  district?: string;
  station?: string;
}

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
  const [partyList, setPartyList] = useState<HeaderPartyOption[]>(() => {
    const map = new Map<string, HeaderPartyOption>();

    localDb.getParties().forEach((p) => {
      const name = (p.name || '').trim();
      if (name && !map.has(name.toLowerCase())) {
        map.set(name.toLowerCase(), {
          name,
          district: (p.district || '').trim(),
          station: (p.station || '').trim()
        });
      }
    });

    return Array.from(map.values());
  });
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [newPartyConfirm, setNewPartyConfirm] = useState<{
    isOpen: boolean;
    name: string;
    district: string;
    phone: string;
  } | null>(null);
  const [vehicleTypes, setVehicleTypes] = useState<string[]>(DEFAULT_VEHICLE_TYPES);
  const [addVehicleTypeModal, setAddVehicleTypeModal] = useState(false);
  const [newVehicleTypeInput, setNewVehicleTypeInput] = useState('');

  // Subscribe to live Party changes across DB
  useEffect(() => {
    const unsub = localDb.subscribe('parties', (parties: PartyRecord[]) => {
      setPartyList((prev) => {
        const map = new Map<string, HeaderPartyOption>();
        prev.forEach((p) => map.set(p.name.toLowerCase(), p));
        parties.forEach((p) => {
          const name = (p.name || '').trim();
          if (name) {
            const existing = map.get(name.toLowerCase());
            map.set(name.toLowerCase(), {
              name,
              district: (p.district || existing?.district || '').trim(),
              station: (p.station || existing?.station || '').trim()
            });
          }
        });
        return Array.from(map.values());
      });
    });
    return () => unsub();
  }, []);

  const partyNameStr = (header?.partyName || '').trim();
  const filteredParties = useMemo(() => {
    const q = partyNameStr.toLowerCase();
    if (!q) return partyList.slice(0, 50);
    return partyList
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.district && p.district.toLowerCase().includes(q)) ||
          (p.station && p.station.toLowerCase().includes(q))
      )
      .slice(0, 50);
  }, [partyList, partyNameStr]);

  const focusNextInput = () => {
    setTimeout(() => {
      const vehSelect = document.getElementById('header-vehicle-type') as HTMLElement | null;
      if (vehSelect) {
        vehSelect.focus();
      } else {
        const vno = document.getElementById('header-vehicle-no') as HTMLInputElement | null;
        if (vno) {
          vno.focus();
          vno.select();
        }
      }
    }, 40);
  };

  const handleConfirmSaveNewParty = async (name: string, district = '', phone = '') => {
    const trimmed = name.trim();
    if (!trimmed) {
      setNewPartyConfirm(null);
      return;
    }

    const cleanDistrict = (district || '').trim();
    const cleanPhone = (phone || '').trim();

    const newParty: PartyRecord = {
      id: `P-${Date.now()}`,
      name: trimmed,
      contact: trimmed,
      phone: cleanPhone,
      city: cleanDistrict || 'Local',
      station: cleanDistrict,
      district: cleanDistrict,
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

    setPartyList(prev => [{ name: trimmed, district: cleanDistrict, station: cleanDistrict }, ...prev]);
    onAddNewParty(trimmed);
    onChange({ partyName: trimmed });
    macAudio.playPop();
    setNewPartyConfirm(null);
    focusNextInput();
  };

  // Auto focus district or name when modal opens
  useEffect(() => {
    if (newPartyConfirm?.isOpen) {
      const timer = setTimeout(() => {
        const districtInput = document.getElementById('modal-party-district') as HTMLInputElement | null;
        if (districtInput) {
          districtInput.focus();
        } else {
          const nameInput = document.getElementById('modal-party-name') as HTMLInputElement | null;
          nameInput?.focus();
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [newPartyConfirm?.isOpen]);

  // Keyboard accessibility for confirmation modal
  useEffect(() => {
    if (!newPartyConfirm?.isOpen) return;
    const handleModalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        setNewPartyConfirm(null);
        focusNextInput();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        handleConfirmSaveNewParty(newPartyConfirm.name, newPartyConfirm.district, newPartyConfirm.phone);
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
    const exactMatch = partyList.find(p => p.name.trim().toLowerCase() === entered.toLowerCase());
    if (exactMatch) {
      onChange({ partyName: exactMatch.name });
      setShowPartySuggestions(false);
      focusNextInput();
    } else {
      setShowPartySuggestions(false);
      setNewPartyConfirm({ isOpen: true, name: entered, district: '', phone: '' });
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

        {/* Party Name Search Box (Quick + icon removed as requested) */}
        <div style={{ position: 'relative', flex: 1.5 }}>
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
                  onChange({ partyName: chosen.name });
                  setShowPartySuggestions(false);
                  focusNextInput();
                  return;
                }

                // 2. Check if entered name has exact match in existing DB parties
                const exactMatch = partyList.find(p => p.name.trim().toLowerCase() === entered.toLowerCase());
                if (exactMatch) {
                  onChange({ partyName: exactMatch.name });
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
                borderRadius: '8px',
                background: '#121215',
                border: '1px solid #27272a',
                padding: '4px',
                boxShadow: '0 16px 36px rgba(0, 0, 0, 0.9), 0 0 1px rgba(255, 255, 255, 0.15)',
                zIndex: 99999999,
                maxHeight: '240px',
                overflowY: 'auto'
              }}
            >
              {filteredParties.map((party, idx) => {
                const isSelected = (header.partyName || '').trim().toLowerCase() === party.name.toLowerCase();
                const isFocused = focusedIndex === idx;
                const districtLabel = party.district || party.station || '';

                return (
                  <div
                    key={party.name}
                    className="anim-cascade"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onChange({ partyName: party.name });
                      setShowPartySuggestions(false);
                      focusNextInput();
                    }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onChange({ partyName: party.name });
                      setShowPartySuggestions(false);
                      focusNextInput();
                    }}
                    style={{
                      padding: '7px 10px',
                      borderRadius: '6px',
                      fontSize: '12.5px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: isFocused ? '#27272a' : isSelected ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                      color: isFocused || isSelected ? '#ffffff' : '#f4f4f5',
                      transition: 'background-color 0.1s ease',
                      gap: '8px'
                    }}
                    onMouseEnter={() => setFocusedIndex(idx)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                      <Building2 size={13} style={{ color: '#ffffff', flexShrink: 0 }} />
                      <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {party.name}
                      </span>
                      {districtLabel && (
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 500,
                            color: '#a1a1aa',
                            background: 'rgba(255, 255, 255, 0.06)',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            padding: '1px 6px',
                            borderRadius: '4px',
                            flexShrink: 0
                          }}
                        >
                          {districtLabel}
                        </span>
                      )}
                    </div>
                    {isSelected && <Check size={12} color="#ffffff" />}
                  </div>
                );
              })}

              {/* If Party Not Found or Typed New */}
              {partyNameStr && !partyList.some(p => p.name.toLowerCase() === partyNameStr.toLowerCase()) && (
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
                  <span>Add "{partyNameStr}" as New Party (Database Save)</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Vehicle Type Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <ShadcnSelect
            id="header-vehicle-type"
            data-np-target="1-3"
            style={{ width: '130px', height: '32px' }}
            value={(!header.vehicleType || header.vehicleType === 'OWN VEHICLE') ? 'SELF' : header.vehicleType}
            onChange={(e: any) => onChange({ vehicleType: e.target.value })}
            onKeyDown={(e: any) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
                const vno = document.getElementById('header-vehicle-no') as HTMLInputElement | null;
                if (vno) {
                  vno.focus();
                  vno.select();
                }
              }
            }}
          >
            {vehicleTypes.map(vt => (
              <option key={vt} value={vt}>{vt}</option>
            ))}
          </ShadcnSelect>
          <Tooltip title="Add New Vehicle Type (+)" side="bottom">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => { setNewVehicleTypeInput(''); setAddVehicleTypeModal(true); }}
              style={{
                width: '32px',
                height: '32px',
                padding: 0,
                borderRadius: '6px',
                borderColor: '#27272a',
                backgroundColor: '#18181b',
                color: '#f4f4f5',
                flexShrink: 0
              }}
            >
              <Plus size={14} />
            </Button>
          </Tooltip>
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
        <Tooltip
          title={`Bill Token: ${header.tokenNo || '1'} | Date: ${header.date || 'Today'} | Party: ${header.partyName || 'Not Set'}`}
          placement="bottom"
        >
          <div 
            data-np-target="1-6"
            className="apple-token-badge"
            tabIndex={0}
            style={{
              cursor: 'pointer',
              background: 'transparent',
              border: '1px solid rgba(255, 255, 255, 0.18)',
              boxShadow: 'none',
              padding: '3px 9px',
              borderRadius: '6px',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: 600,
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: '0.3px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              userSelect: 'none'
            }}
          >
            <span>{header.tokenNo}</span>
          </div>
        </Tooltip>
      </div>

      {/* New Party Registration Modal - Sleek Shadcn UI */}
      {newPartyConfirm && newPartyConfirm.isOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999999,
            animation: 'fadeIn 0.15s ease'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setNewPartyConfirm(null);
              focusNextInput();
            }
          }}
        >
          <div
            style={{
              width: '460px',
              maxWidth: '94vw',
              background: '#09090b',
              border: '1px solid #27272a',
              borderRadius: '12px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(255, 255, 255, 0.05)',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              animation: 'antSlideDown 0.18s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'rgba(244, 244, 245, 0.08)',
                    border: '1px solid #27272a',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Building2 size={16} color="#f4f4f5" />
                  </div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#f4f4f5', letterSpacing: '-0.01em' }}>
                    Save Party to Database
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setNewPartyConfirm(null);
                    focusNextInput();
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#71717a',
                    cursor: 'pointer',
                    padding: '4px',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <X size={16} />
                </button>
              </div>
              <p style={{ margin: '4px 0 0', fontSize: '12.5px', color: '#a1a1aa', lineHeight: 1.4 }}>
                "{newPartyConfirm.name}" is not registered. Save permanently to auto-suggest in bills and reports.
              </p>
            </div>

            {/* Inputs Body */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Field 1: Party Name */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                  Party Name <span style={{ color: '#38bdf8' }}>*</span>
                </label>
                <input
                  id="modal-party-name"
                  type="text"
                  value={newPartyConfirm.name}
                  onChange={(e) => setNewPartyConfirm(prev => prev ? { ...prev, name: e.target.value } : null)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      document.getElementById('modal-party-district')?.focus();
                    }
                  }}
                  style={{
                    width: '100%',
                    height: '38px',
                    padding: '0 12px',
                    fontSize: '13.5px',
                    fontWeight: 600,
                    color: '#f4f4f5',
                    background: '#18181b',
                    border: '1px solid #27272a',
                    borderRadius: '8px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#52525b')}
                  onBlur={(e) => (e.target.style.borderColor = '#27272a')}
                />
              </div>

              {/* Field 2: District / City (Optional) */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                  District / Station <span style={{ color: '#71717a', fontWeight: 400, textTransform: 'none' }}>(Optional)</span>
                </label>
                <input
                  id="modal-party-district"
                  type="text"
                  value={newPartyConfirm.district}
                  placeholder="e.g. Jaipur, Kota, Delhi... (Optional)"
                  onChange={(e) => setNewPartyConfirm(prev => prev ? { ...prev, district: e.target.value } : null)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      document.getElementById('modal-party-phone')?.focus();
                    }
                  }}
                  style={{
                    width: '100%',
                    height: '38px',
                    padding: '0 12px',
                    fontSize: '13.5px',
                    color: '#f4f4f5',
                    background: '#18181b',
                    border: '1px solid #27272a',
                    borderRadius: '8px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#52525b')}
                  onBlur={(e) => (e.target.style.borderColor = '#27272a')}
                />
              </div>

              {/* Field 3: Phone Number (Optional) */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                  Phone Number <span style={{ color: '#71717a', fontWeight: 400, textTransform: 'none' }}>(Optional)</span>
                </label>
                <input
                  id="modal-party-phone"
                  type="text"
                  value={newPartyConfirm.phone}
                  placeholder="e.g. 9876543210 (Optional)"
                  onChange={(e) => setNewPartyConfirm(prev => prev ? { ...prev, phone: e.target.value } : null)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleConfirmSaveNewParty(newPartyConfirm.name, newPartyConfirm.district, newPartyConfirm.phone);
                    }
                  }}
                  style={{
                    width: '100%',
                    height: '38px',
                    padding: '0 12px',
                    fontSize: '13.5px',
                    color: '#f4f4f5',
                    background: '#18181b',
                    border: '1px solid #27272a',
                    borderRadius: '8px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#52525b')}
                  onBlur={(e) => (e.target.style.borderColor = '#27272a')}
                />
              </div>
            </div>

            {/* Footer Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px', paddingTop: '4px' }}>
              <button
                type="button"
                onClick={() => {
                  setNewPartyConfirm(null);
                  focusNextInput();
                }}
                style={{
                  height: '36px',
                  padding: '0 16px',
                  borderRadius: '6px',
                  border: '1px solid #27272a',
                  background: 'transparent',
                  color: '#a1a1aa',
                  fontSize: '12.5px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => { (e.currentTarget.style.background = '#18181b'); (e.currentTarget.style.color = '#f4f4f5'); }}
                onMouseLeave={(e) => { (e.currentTarget.style.background = 'transparent'); (e.currentTarget.style.color = '#a1a1aa'); }}
              >
                Use Once (Esc)
              </button>

              <button
                type="button"
                id="modal-save-party-btn"
                onClick={() => handleConfirmSaveNewParty(newPartyConfirm.name, newPartyConfirm.district, newPartyConfirm.phone)}
                style={{
                  height: '36px',
                  padding: '0 18px',
                  borderRadius: '6px',
                  border: 'none',
                  background: '#f4f4f5',
                  color: '#09090b',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                  transition: 'background 0.15s ease'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#ffffff')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#f4f4f5')}
              >
                <Check size={14} />
                <span>Save Party (Enter)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Vehicle Type Modal (Shadcn Dialog Style) */}
      {addVehicleTypeModal && createPortal(
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(6px)',
            zIndex: 99999999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
          onClick={() => setAddVehicleTypeModal(false)}
        >
          <div
            style={{
              background: '#09090b',
              border: '1px solid #27272a',
              borderRadius: '10px',
              padding: '22px 24px',
              width: '380px',
              maxWidth: '92vw',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.85), 0 0 0 1px rgba(255, 255, 255, 0.08)'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '15px', fontWeight: 600, color: '#fafafa' }}>Add Vehicle Type</div>
                <div style={{ fontSize: '12px', color: '#a1a1aa', marginTop: '2px' }}>New vehicle type will appear in the dropdown.</div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setAddVehicleTypeModal(false)}
                style={{ width: '28px', height: '28px', padding: 0, color: '#71717a' }}
              >
                ✕
              </Button>
            </div>

            <Input
              autoFocus
              type="text"
              placeholder="e.g. MINI TRUCK, AUTO..."
              value={newVehicleTypeInput}
              onChange={e => setNewVehicleTypeInput(e.target.value.toUpperCase())}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  const trimmed = newVehicleTypeInput.trim();
                  if (trimmed && !vehicleTypes.includes(trimmed)) {
                    setVehicleTypes(prev => [...prev, trimmed]);
                    onChange({ vehicleType: trimmed });
                  }
                  setAddVehicleTypeModal(false);
                } else if (e.key === 'Escape') {
                  setAddVehicleTypeModal(false);
                }
              }}
              style={{
                height: '38px',
                fontSize: '13px',
                fontFamily: 'monospace',
                letterSpacing: '0.04em'
              }}
            />

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '4px' }}>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAddVehicleTypeModal(false)}
                style={{ height: '34px', fontSize: '12px' }}
              >
                Cancel (Esc)
              </Button>
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={() => {
                  const trimmed = newVehicleTypeInput.trim();
                  if (trimmed && !vehicleTypes.includes(trimmed)) {
                    setVehicleTypes(prev => [...prev, trimmed]);
                    onChange({ vehicleType: trimmed });
                  }
                  setAddVehicleTypeModal(false);
                }}
                style={{ height: '34px', fontSize: '12px', gap: '6px' }}
              >
                <Check size={14} /> Add Type
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

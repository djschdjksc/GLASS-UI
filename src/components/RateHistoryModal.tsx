import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  History, 
  Search, 
  X, 
  Check, 
  ArrowRight, 
  Calendar, 
  Building2, 
  Package, 
  Sparkles,
  CheckSquare,
  Square,
  Clock,
  Tag
} from 'lucide-react';
import { localDb } from '../services/db/localDb';
import { SQLITE_BILLS } from '../data/sqliteData';
import type { FinishedItem, RawItem } from '../types';
import { Tooltip } from './ui/shadcn';

export interface RateHistoryItem {
  id: string;
  mould: string;
  latestPrice: number;
  latestDate: string;
  latestToken: string;
  latestParty: string;
  timeAgo: string;
  isInCurrentBill: boolean;
  hasBilledToParty: boolean;
  partyLatestPrice?: number;
  partyLatestDate?: string;
  partyLatestToken?: string;
  partyTimeAgo?: string;
  overallLatestPrice: number;
  overallLatestDate: string;
  overallLatestToken: string;
  overallLatestParty: string;
  overallTimeAgo: string;
  history: {
    price: number;
    date: string;
    token: string;
    party: string;
  }[];
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentParty: string;
  currentFinishedItems: FinishedItem[];
  rawItems: RawItem[];
  onApplyRates: (selectedItems: { mould: string; price: number }[]) => void;
}

// Calculate relative time ago for "Kab Gaya" display
export function formatTimeAgo(dateStr: string): string {
  if (!dateStr) return 'Recent';
  const billDate = new Date(dateStr);
  if (isNaN(billDate.getTime())) return dateStr;
  const now = new Date();
  const diffMs = now.getTime() - billDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'Recent';
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 30) return `${diffDays}d ago`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths === 1) return '1 mo ago';
  if (diffMonths < 12) return `${diffMonths} mos ago`;
  const diffYears = Math.floor(diffDays / 365);
  return `${diffYears} yr${diffYears > 1 ? 's' : ''} ago`;
}

// Robust party matching matching variations, roots, and substrings
export function isPartyMatch(bParty: string, currentParty: string): boolean {
  if (!bParty || !currentParty) return false;
  const p1 = bParty.toLowerCase().trim();
  const p2 = currentParty.toLowerCase().trim();
  if (p1 === p2) return true;
  if (p1.includes(p2) || p2.includes(p1)) return true;
  const clean1 = p1.replace(/[-–—(),.]/g, ' ').replace(/\s+/g, ' ').trim();
  const clean2 = p2.replace(/[-–—(),.]/g, ' ').replace(/\s+/g, ' ').trim();
  if (clean1 === clean2 || clean1.includes(clean2) || clean2.includes(clean1)) return true;
  const root1 = p1.split('-')[0].trim();
  const root2 = p2.split('-')[0].trim();
  if (root1.length >= 3 && root2.length >= 3 && (root1 === root2 || root1.includes(root2) || root2.includes(root1))) {
    return true;
  }
  return false;
}

export const RateHistoryModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentParty,
  currentFinishedItems,
  rawItems,
  onApplyRates
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'party' | 'all' | 'current_bill'>('party');
  const [selectedMoulds, setSelectedMoulds] = useState<Set<string>>(new Set());
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Set default active tab on open:
  // When a party name is provided, default to that party's rate history!
  useEffect(() => {
    if (isOpen) {
      if (currentParty && currentParty.trim().length > 0) {
        setActiveTab('party');
      } else {
        setActiveTab('all');
      }
      setSearchQuery('');
    }
  }, [isOpen, currentParty]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [isOpen, onClose]);

  // Focus search input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 80);
    }
  }, [isOpen]);

  // Active item names currently in draft bill
  const currentBillMouldNames = useMemo(() => {
    const names = new Set<string>();
    currentFinishedItems.forEach(f => {
      const m = (f.mould || '').trim();
      if (m && m !== 'Mould Name' && m !== '-') names.add(m.toLowerCase());
    });
    rawItems.forEach(r => {
      const n = (r.name || '').trim();
      if (n) names.add(n.toLowerCase());
    });
    return names;
  }, [currentFinishedItems, rawItems]);

  // Compute rate history for all unique items across all bills,
  // tracking both party-specific recent bill & overall recent bill (kab gaya & rate)
  const rateHistoryData = useMemo(() => {
    if (!isOpen) return { all: [], party: [] };

    const allBills = localDb.getBills();
    const sourceBills = allBills && allBills.length > 0 ? allBills : (SQLITE_BILLS || []);

    // Sort bills strictly from NEWEST/MOST RECENT to OLDEST
    const sortedBills = [...sourceBills].sort((a, b) => {
      const timeA = a.createdAt || (a.date ? new Date(a.date).getTime() : 0) || Number(a.token) || 0;
      const timeB = b.createdAt || (b.date ? new Date(b.date).getTime() : 0) || Number(b.token) || 0;
      return timeB - timeA;
    });

    // 1. Overall Map: mouldKey -> most recent bill info across ALL bills
    const globalMap = new Map<string, {
      mould: string;
      latestPrice: number;
      latestDate: string;
      latestToken: string;
      latestParty: string;
      history: { price: number; date: string; token: string; party: string }[];
    }>();

    // 2. Party Map: mouldKey -> most recent bill info specifically for currentParty
    const partyMap = new Map<string, {
      mould: string;
      latestPrice: number;
      latestDate: string;
      latestToken: string;
      latestParty: string;
      history: { price: number; date: string; token: string; party: string }[];
    }>();

    for (const bill of sortedBills) {
      const bParty = (bill.party || '').trim();
      const bDate = bill.date || '';
      const bToken = String(bill.token || '');
      const isThisParty = isPartyMatch(bParty, currentParty);

      for (const item of bill.finishedItems || []) {
        const rawMould = (item.mould || '').trim();
        const price = Number(item.price) || 0;
        if (!rawMould || rawMould === 'Mould Name' || rawMould === '-' || price <= 0) continue;

        const key = rawMould.toLowerCase();
        const entry = { price, date: bDate, token: bToken, party: bParty };

        // Global entry (first encounter is most recent because sorted newest-first)
        if (!globalMap.has(key)) {
          globalMap.set(key, {
            mould: rawMould,
            latestPrice: price,
            latestDate: bDate,
            latestToken: bToken,
            latestParty: bParty,
            history: [entry]
          });
        } else {
          const g = globalMap.get(key)!;
          if (g.history.length < 8) g.history.push(entry);
        }

        // Party entry (most recent bill specifically for currentParty)
        if (isThisParty) {
          if (!partyMap.has(key)) {
            partyMap.set(key, {
              mould: rawMould,
              latestPrice: price,
              latestDate: bDate,
              latestToken: bToken,
              latestParty: bParty,
              history: [entry]
            });
          } else {
            const p = partyMap.get(key)!;
            if (p.history.length < 8) p.history.push(entry);
          }
        }
      }
    }

    // Build party items list (sorted by latest bill date descending)
    const partyList: RateHistoryItem[] = [];
    partyMap.forEach((val, key) => {
      const isInCurrent = currentBillMouldNames.has(key);
      const gVal = globalMap.get(key);
      partyList.push({
        id: `rate-party-${key}`,
        mould: val.mould,
        latestPrice: val.latestPrice,
        latestDate: val.latestDate,
        latestToken: val.latestToken,
        latestParty: val.latestParty,
        timeAgo: formatTimeAgo(val.latestDate),
        hasBilledToParty: true,
        partyLatestPrice: val.latestPrice,
        partyLatestDate: val.latestDate,
        partyLatestToken: val.latestToken,
        partyTimeAgo: formatTimeAgo(val.latestDate),
        overallLatestPrice: gVal ? gVal.latestPrice : val.latestPrice,
        overallLatestDate: gVal ? gVal.latestDate : val.latestDate,
        overallLatestToken: gVal ? gVal.latestToken : val.latestToken,
        overallLatestParty: gVal ? gVal.latestParty : val.latestParty,
        overallTimeAgo: formatTimeAgo(gVal ? gVal.latestDate : val.latestDate),
        isInCurrentBill: isInCurrent,
        history: val.history
      });
    });
    partyList.sort((a, b) => {
      if (a.isInCurrentBill && !b.isInCurrentBill) return -1;
      if (!a.isInCurrentBill && b.isInCurrentBill) return 1;
      const tA = a.latestDate ? new Date(a.latestDate).getTime() : 0;
      const tB = b.latestDate ? new Date(b.latestDate).getTime() : 0;
      if (tA !== tB) return tB - tA;
      return a.mould.localeCompare(b.mould);
    });

    // Build all unique items list (sorted by party-billed first, then latest bill date descending)
    const allList: RateHistoryItem[] = [];
    globalMap.forEach((val, key) => {
      const isInCurrent = currentBillMouldNames.has(key);
      const pVal = partyMap.get(key);
      const hasParty = !!pVal;

      allList.push({
        id: `rate-all-${key}`,
        mould: val.mould,
        latestPrice: hasParty ? pVal.latestPrice : val.latestPrice,
        latestDate: hasParty ? pVal.latestDate : val.latestDate,
        latestToken: hasParty ? pVal.latestToken : val.latestToken,
        latestParty: hasParty ? pVal.latestParty : val.latestParty,
        timeAgo: formatTimeAgo(hasParty ? pVal.latestDate : val.latestDate),
        hasBilledToParty: hasParty,
        partyLatestPrice: pVal?.latestPrice,
        partyLatestDate: pVal?.latestDate,
        partyLatestToken: pVal?.latestToken,
        partyTimeAgo: pVal?.latestDate ? formatTimeAgo(pVal.latestDate) : undefined,
        overallLatestPrice: val.latestPrice,
        overallLatestDate: val.latestDate,
        overallLatestToken: val.latestToken,
        overallLatestParty: val.latestParty,
        overallTimeAgo: formatTimeAgo(val.latestDate),
        isInCurrentBill: isInCurrent,
        history: hasParty ? pVal.history : val.history
      });
    });
    allList.sort((a, b) => {
      if (a.isInCurrentBill && !b.isInCurrentBill) return -1;
      if (!a.isInCurrentBill && b.isInCurrentBill) return 1;
      if (a.hasBilledToParty && !b.hasBilledToParty) return -1;
      if (!a.hasBilledToParty && b.hasBilledToParty) return 1;
      const tA = a.latestDate ? new Date(a.latestDate).getTime() : 0;
      const tB = b.latestDate ? new Date(b.latestDate).getTime() : 0;
      if (tA !== tB) return tB - tA;
      return a.mould.localeCompare(b.mould);
    });

    return { all: allList, party: partyList };
  }, [isOpen, currentBillMouldNames, currentParty]);

  // Initial selection: select items in current bill by default
  useEffect(() => {
    if (isOpen) {
      const initial = new Set<string>();
      rateHistoryData.all.forEach(item => {
        if (item.isInCurrentBill) {
          initial.add(item.mould);
        }
      });
      setSelectedMoulds(initial);
    }
  }, [isOpen, rateHistoryData]);

  // Source list based on active tab
  const sourceData = useMemo(() => {
    if (activeTab === 'party') return rateHistoryData.party;
    return rateHistoryData.all;
  }, [rateHistoryData, activeTab]);

  // Filtered items based on tab & search
  const filteredData = useMemo(() => {
    return sourceData.filter(item => {
      // current_bill tab filter
      if (activeTab === 'current_bill' && !item.isInCurrentBill) return false;

      // Search filter across item name, price, party, token, date
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchesName = item.mould.toLowerCase().includes(q);
        const matchesParty = (item.latestParty || '').toLowerCase().includes(q) || (item.overallLatestParty || '').toLowerCase().includes(q);
        const matchesPrice = String(item.latestPrice).includes(q);
        const matchesToken = String(item.latestToken).includes(q) || String(item.overallLatestToken).includes(q);
        const matchesDate = (item.latestDate || '').toLowerCase().includes(q) || (item.timeAgo || '').toLowerCase().includes(q);
        if (!matchesName && !matchesParty && !matchesPrice && !matchesToken && !matchesDate) return false;
      }

      return true;
    });
  }, [sourceData, activeTab, searchQuery]);

  // Toggle selection
  const toggleSelect = (mould: string) => {
    setSelectedMoulds(prev => {
      const next = new Set(prev);
      if (next.has(mould)) next.delete(mould);
      else next.add(mould);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedMoulds.size === filteredData.length && filteredData.length > 0) {
      setSelectedMoulds(new Set());
    } else {
      const next = new Set<string>();
      filteredData.forEach(item => next.add(item.mould));
      setSelectedMoulds(next);
    }
  };

  const handleApply = () => {
    const allItems = [...rateHistoryData.all, ...rateHistoryData.party];
    const seen = new Set<string>();
    const toApply = allItems
      .filter(item => {
        if (!selectedMoulds.has(item.mould) || seen.has(item.mould)) return false;
        seen.add(item.mould);
        return true;
      })
      .map(item => ({
        mould: item.mould,
        price: item.latestPrice
      }));

    if (toApply.length === 0) {
      onClose();
      return;
    }

    onApplyRates(toApply);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.15s ease'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Shadcn Card Dialog Modal */}
      <div
        style={{
          width: '840px',
          maxWidth: '96vw',
          maxHeight: '92vh',
          backgroundColor: '#09090b',
          border: '1px solid #27272a',
          borderRadius: '12px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.85), 0 0 1px rgba(255, 255, 255, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'antSlideDown 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header (Shadcn DialogHeader) */}
        <div style={{
          padding: '18px 24px 14px',
          borderBottom: '1px solid #27272a',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '12px',
          background: '#0e0e11'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                backgroundColor: '#18181b',
                border: '1px solid #27272a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <History size={17} color="#38bdf8" />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h2 style={{
                    margin: 0,
                    fontSize: '16px',
                    fontWeight: 600,
                    color: '#fafafa',
                    letterSpacing: '-0.02em'
                  }}>
                    Recent Rate History
                  </h2>
                  {currentParty && (
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: '5px',
                      backgroundColor: 'rgba(56, 189, 248, 0.12)',
                      border: '1px solid rgba(56, 189, 248, 0.28)',
                      color: '#38bdf8'
                    }}>
                      Party: {currentParty}
                    </span>
                  )}
                </div>
                <p style={{
                  margin: '3px 0 0',
                  fontSize: '12px',
                  color: '#a1a1aa'
                }}>
                  {currentParty
                    ? `Showing rate history & last bill date (kab gaya) for "${currentParty}".`
                    : 'Showing recent rate history of all unique items across all bills.'}
                </p>
              </div>
            </div>
          </div>

          <Tooltip title="Close (Esc)" side="bottom">
            <button
              type="button"
              onClick={onClose}
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                border: '1px solid #27272a',
                backgroundColor: '#18181b',
                color: '#a1a1aa',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <X size={14} />
            </button>
          </Tooltip>
        </div>

        {/* Toolbar & Filters (Shadcn Tabs & Input) */}
        <div style={{
          padding: '12px 24px',
          borderBottom: '1px solid #27272a',
          backgroundColor: '#0c0a09',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          {/* Top Row: Search Input */}
          <div style={{ position: 'relative', width: '100%' }}>
            <Search
              size={15}
              color="#71717a"
              style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search by item name, rate, token #, date or party..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                height: '36px',
                padding: '0 12px 0 36px',
                backgroundColor: '#18181b',
                border: '1px solid #27272a',
                borderRadius: '6px',
                color: '#fafafa',
                fontSize: '13px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: '#71717a',
                  cursor: 'pointer'
                }}
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Bottom Row: Tabs & Select All */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
            {/* Shadcn Tabs List */}
            <div style={{
              display: 'inline-flex',
              backgroundColor: '#18181b',
              padding: '3px',
              borderRadius: '8px',
              border: '1px solid #27272a',
              gap: '2px'
            }}>
              {currentParty && (
                <button
                  type="button"
                  onClick={() => setActiveTab('party')}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: activeTab === 'party' ? '#27272a' : 'transparent',
                    color: activeTab === 'party' ? '#38bdf8' : '#a1a1aa',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Building2 size={13} />
                  <span>{currentParty} Items ({rateHistoryData.party.length})</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setActiveTab('all')}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: activeTab === 'all' ? '#27272a' : 'transparent',
                  color: activeTab === 'all' ? '#fafafa' : '#a1a1aa',
                  fontSize: '12px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease'
                }}
              >
                <Package size={13} />
                <span>All Unique Items ({rateHistoryData.all.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('current_bill')}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: activeTab === 'current_bill' ? '#27272a' : 'transparent',
                  color: activeTab === 'current_bill' ? '#fafafa' : '#a1a1aa',
                  fontSize: '12px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease'
                }}
              >
                <Sparkles size={13} />
                <span>In Current Bill ({rateHistoryData.all.filter(i => i.isInCurrentBill).length})</span>
              </button>
            </div>

            {/* Select All / Deselect Toggle */}
            <button
              type="button"
              onClick={handleSelectAll}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 10px',
                borderRadius: '6px',
                backgroundColor: 'transparent',
                border: '1px solid #27272a',
                color: '#d4d4d8',
                fontSize: '12px',
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              {selectedMoulds.size === filteredData.length && filteredData.length > 0 ? (
                <>
                  <CheckSquare size={13} color="#fafafa" />
                  <span>Deselect All</span>
                </>
              ) : (
                <>
                  <Square size={13} color="#71717a" />
                  <span>Select All ({filteredData.length})</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Items List Table (Shadcn Table Style) */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          maxHeight: '460px',
          backgroundColor: '#09090b'
        }}>
          {filteredData.length === 0 ? (
            <div style={{
              padding: '60px 20px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px'
            }}>
              <Package size={32} color="#52525b" />
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#a1a1aa' }}>
                No rate history found
              </div>
              <div style={{ fontSize: '12px', color: '#71717a', maxWidth: '340px' }}>
                {activeTab === 'party'
                  ? `No previous bills found with items for "${currentParty}". Switch to "All Unique Items" to view rates from all bills.`
                  : activeTab === 'current_bill'
                  ? 'No previous sales history recorded for the items currently in this draft bill.'
                  : 'No items match your search filter.'}
              </div>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{
                  borderBottom: '1px solid #27272a',
                  backgroundColor: '#18181b',
                  fontSize: '11px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: '#a1a1aa'
                }}>
                  <th style={{ padding: '9px 12px', width: '38px', textAlign: 'center' }}></th>
                  <th style={{ padding: '9px 14px' }}>Item / Mould Specification</th>
                  <th style={{ padding: '9px 14px', textAlign: 'right' }}>Recent Rate</th>
                  <th style={{ padding: '9px 14px' }}>Most Recent Bill (Kab Gaya)</th>
                  <th style={{ padding: '9px 14px' }}>Billed Party Context</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((item) => {
                  const isSelected = selectedMoulds.has(item.mould);

                  return (
                    <tr
                      key={item.id}
                      onClick={() => toggleSelect(item.mould)}
                      style={{
                        borderBottom: '1px solid #1c1917',
                        backgroundColor: isSelected ? 'rgba(39, 39, 42, 0.45)' : 'transparent',
                        cursor: 'pointer',
                        transition: 'background-color 0.1s ease',
                        fontSize: '12.5px'
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) e.currentTarget.style.backgroundColor = '#141417';
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      {/* Checkbox */}
                      <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                        <div style={{
                          width: '16px',
                          height: '16px',
                          borderRadius: '4px',
                          border: isSelected ? '1px solid #fafafa' : '1px solid #3f3f46',
                          backgroundColor: isSelected ? '#fafafa' : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          margin: '0 auto'
                        }}>
                          {isSelected && <Check size={11} color="#09090b" strokeWidth={3} />}
                        </div>
                      </td>

                      {/* Mould Specification */}
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 600, color: '#fafafa', fontSize: '13px' }}>
                            {item.mould}
                          </span>
                          {item.isInCurrentBill && (
                            <span style={{
                              fontSize: '10px',
                              fontWeight: 600,
                              padding: '1px 6px',
                              borderRadius: '4px',
                              backgroundColor: 'rgba(56, 189, 248, 0.15)',
                              border: '1px solid rgba(56, 189, 248, 0.35)',
                              color: '#38bdf8'
                            }}>
                              In Current Bill
                            </span>
                          )}
                          {currentParty && item.hasBilledToParty && activeTab === 'all' && (
                            <span style={{
                              fontSize: '10px',
                              fontWeight: 600,
                              padding: '1px 6px',
                              borderRadius: '4px',
                              backgroundColor: 'rgba(52, 211, 153, 0.12)',
                              border: '1px solid rgba(52, 211, 153, 0.3)',
                              color: '#34d399'
                            }}>
                              Billed to {currentParty}
                            </span>
                          )}
                          {currentParty && !item.hasBilledToParty && activeTab === 'all' && (
                            <span style={{
                              fontSize: '10px',
                              fontWeight: 600,
                              padding: '1px 6px',
                              borderRadius: '4px',
                              backgroundColor: 'rgba(251, 191, 36, 0.1)',
                              border: '1px solid rgba(251, 191, 36, 0.25)',
                              color: '#fbbf24'
                            }}>
                              New for this party
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Recent Rate */}
                      <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                          <span style={{
                            fontWeight: 700,
                            fontSize: '14px',
                            color: '#34d399',
                            fontFamily: "'JetBrains Mono', monospace"
                          }}>
                            ₹{item.latestPrice.toLocaleString('en-IN')}
                          </span>
                          {item.history.length > 1 && (
                            <span style={{ fontSize: '10px', color: '#71717a' }}>
                              Prev: ₹{item.history[1].price.toLocaleString('en-IN')}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Sabse Recent Bill Kab Gaya (Date, Token, Time Ago) */}
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                          <Calendar size={13} style={{ color: '#38bdf8', flexShrink: 0 }} />
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ color: '#38bdf8', fontWeight: 700, fontSize: '12px' }}>
                                #{item.latestToken || '—'}
                              </span>
                              <span style={{ color: '#71717a', fontSize: '11px' }}>•</span>
                              <span style={{ color: '#e4e4e7', fontSize: '12px', fontWeight: 500 }}>
                                {item.latestDate || '—'}
                              </span>
                            </div>
                            <span style={{
                              fontSize: '10.5px',
                              fontWeight: 600,
                              color: item.timeAgo.includes('Today') || item.timeAgo.includes('Yesterday') || item.timeAgo.includes('d ago') ? '#34d399' : '#a1a1aa'
                            }}>
                              {item.timeAgo || 'Recent'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Billed Party Context */}
                      <td style={{ padding: '10px 14px', color: '#d4d4d8' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <Building2 size={12} style={{ color: item.hasBilledToParty ? '#38bdf8' : '#71717a', flexShrink: 0 }} />
                            <span style={{
                              fontWeight: item.hasBilledToParty ? 600 : 400,
                              color: item.hasBilledToParty ? '#fafafa' : '#a1a1aa',
                              fontSize: '12px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              maxWidth: '180px'
                            }}>
                              {item.latestParty || 'Standard Account'}
                            </span>
                          </div>
                          {item.history.length > 1 && (
                            <span style={{ fontSize: '10px', color: '#71717a', paddingLeft: '17px' }}>
                              {item.history.length} bills recorded
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer (Shadcn DialogFooter & Actions) */}
        <div style={{
          padding: '14px 24px',
          borderTop: '1px solid #27272a',
          backgroundColor: '#0c0a09',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px'
        }}>
          {/* Left stats */}
          <div style={{ fontSize: '12px', color: '#a1a1aa' }}>
            <span>Selected: </span>
            <strong style={{ color: '#fafafa' }}>{selectedMoulds.size}</strong> of {filteredData.length} items
          </div>

          {/* Right Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Cancel Button */}
            <button
              type="button"
              onClick={onClose}
              style={{
                height: '36px',
                padding: '0 16px',
                borderRadius: '6px',
                border: '1px solid #27272a',
                backgroundColor: 'transparent',
                color: '#fafafa',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              Cancel (Esc)
            </button>

            {/* Load Button (Primary Shadcn Button) */}
            <button
              type="button"
              onClick={handleApply}
              disabled={selectedMoulds.size === 0}
              style={{
                height: '36px',
                padding: '0 18px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: selectedMoulds.size > 0 ? '#fafafa' : '#27272a',
                color: selectedMoulds.size > 0 ? '#09090b' : '#71717a',
                fontSize: '13px',
                fontWeight: 600,
                cursor: selectedMoulds.size > 0 ? 'pointer' : 'not-allowed',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: selectedMoulds.size > 0 ? '0 1px 3px rgba(0, 0, 0, 0.4)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <Check size={14} />
              <span>Load Rates into Bill ({selectedMoulds.size})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

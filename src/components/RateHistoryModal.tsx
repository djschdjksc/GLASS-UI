import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  History, 
  Search, 
  X, 
  Check, 
  ArrowRight, 
  TrendingUp, 
  Calendar, 
  Building2, 
  Package, 
  Sparkles,
  CheckSquare,
  Square,
  Filter
} from 'lucide-react';
import { localDb } from '../services/db/localDb';
import type { FinishedItem, RawItem } from '../types';
import { parseProductAndSize, calculateProportionalPrice } from '../utils/mouldUtils';
import { Tooltip } from './ui/shadcn';

export interface RateHistoryItem {
  id: string;
  mould: string;
  latestPrice: number;
  latestDate: string;
  latestToken: string;
  latestParty: string;
  isInCurrentBill: boolean;
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

export const RateHistoryModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentParty,
  currentFinishedItems,
  rawItems,
  onApplyRates
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'current_bill' | 'party' | 'all'>('current_bill');
  const [selectedMoulds, setSelectedMoulds] = useState<Set<string>>(new Set());
  const searchInputRef = useRef<HTMLInputElement>(null);

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

  // Active names in current bill (from finishedItems and rawItems)
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

  // Compute rate history across all saved bills
  const rateHistoryData = useMemo(() => {
    if (!isOpen) return { all: [], party: [] };

    const allBills = localDb.getBills();
    const sourceBills = allBills && allBills.length > 0 ? allBills : (SQLITE_BILLS || []);

    // Sort bills latest to oldest
    const sortedBills = [...sourceBills].sort((a, b) => {
      const timeA = a.date ? new Date(a.date).getTime() : 0;
      const timeB = b.date ? new Date(b.date).getTime() : 0;
      if (!isNaN(timeA) && !isNaN(timeB) && timeA !== timeB) return timeB - timeA;
      const tokA = parseInt(String(a.token || '0'), 10);
      const tokB = parseInt(String(b.token || '0'), 10);
      if (!isNaN(tokA) && !isNaN(tokB) && tokA !== tokB) return tokB - tokA;
      return (Number(b.updatedAt || 0)) - (Number(a.updatedAt || 0));
    });

    // --- Global map: mouldKey -> most recent entry across ALL bills ---
    const globalMap = new Map<string, {
      mould: string;
      latestPrice: number;
      latestDate: string;
      latestToken: string;
      latestParty: string;
      history: { price: number; date: string; token: string; party: string }[];
    }>();

    // --- Party map: mouldKey -> most recent entry for THIS party only ---
    // Contains ALL unique items ever sent to this party, each with its most recent rate for that party
    const partyMap = new Map<string, {
      mould: string;
      latestPrice: number;
      latestDate: string;
      latestToken: string;
      latestParty: string;
      history: { price: number; date: string; token: string; party: string }[];
    }>();

    const cleanCurrentParty = (currentParty || '').trim().toLowerCase();

    for (const bill of sortedBills) {
      const bParty = (bill.party || '').trim();
      const bDate = bill.date || '';
      const bToken = String(bill.token || '');
      const items = bill.finishedItems || [];
      const isThisPartyBill = cleanCurrentParty && bParty.toLowerCase().includes(cleanCurrentParty);

      for (const item of items) {
        const rawMould = (item.mould || '').trim();
        const price = Number(item.price) || 0;
        if (!rawMould || rawMould === 'Mould Name' || rawMould === '-' || price <= 0) continue;

        const key = rawMould.toLowerCase();
        const entry = { price, date: bDate, token: bToken, party: bParty };

        // Global map (all bills, most recent rate per item)
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
          if (g.history.length < 5) g.history.push(entry);
        }

        // Party map: collect ALL unique items for this party, most recent rate per item
        if (isThisPartyBill) {
          if (!partyMap.has(key)) {
            // First time seeing this item for this party = most recent (bills are sorted newest first)
            partyMap.set(key, {
              mould: rawMould,
              latestPrice: price,
              latestDate: bDate,
              latestToken: bToken,
              latestParty: bParty,
              history: [entry]
            });
          } else {
            // Already have the most recent rate; just keep adding history
            const p = partyMap.get(key)!;
            if (p.history.length < 5) p.history.push(entry);
          }
        }
      }
    }

    const buildList = (map: typeof globalMap) => {
      const itemsList: RateHistoryItem[] = [];
      map.forEach((val, key) => {
        const isInCurrent = currentBillMouldNames.has(key);
        itemsList.push({
          id: `rate-hist-${key}`,
          mould: val.mould,
          latestPrice: val.latestPrice,
          latestDate: val.latestDate,
          latestToken: val.latestToken,
          latestParty: val.latestParty,
          isInCurrentBill: isInCurrent,
          history: val.history
        });
      });
      return itemsList.sort((a, b) => {
        if (a.isInCurrentBill && !b.isInCurrentBill) return -1;
        if (!a.isInCurrentBill && b.isInCurrentBill) return 1;
        return a.mould.localeCompare(b.mould);
      });
    };

    return {
      all: buildList(globalMap),
      party: buildList(partyMap)
    };
  }, [isOpen, currentBillMouldNames, currentParty]);

  // Initial selection: select items in current bill by default
  useEffect(() => {
    if (isOpen && rateHistoryData.all.length > 0) {
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

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchesName = item.mould.toLowerCase().includes(q);
        const matchesParty = item.latestParty.toLowerCase().includes(q);
        const matchesPrice = String(item.latestPrice).includes(q);
        if (!matchesName && !matchesParty && !matchesPrice) return false;
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
          width: '740px',
          maxWidth: '96vw',
          maxHeight: '90vh',
          backgroundColor: '#09090b', // Zinc 950
          border: '1px solid #27272a', // Zinc 800
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
          padding: '20px 24px 16px',
          borderBottom: '1px solid #27272a',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '12px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: '#18181b', // Zinc 900
                border: '1px solid #27272a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <History size={16} color="#fafafa" />
              </div>
              <div>
                <h2 style={{
                  margin: 0,
                  fontSize: '16px',
                  fontWeight: 600,
                  color: '#fafafa', // Zinc 50
                  letterSpacing: '-0.02em'
                }}>
                  Recent Rate History
                </h2>
                <p style={{
                  margin: '2px 0 0',
                  fontSize: '12px',
                  color: '#a1a1aa' // Zinc 400
                }}>
                  {currentParty ? `View and apply recent rates for "${currentParty}" or all items` : 'View and apply recent rates from bill history'}
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
          padding: '14px 24px',
          borderBottom: '1px solid #27272a',
          backgroundColor: '#0c0a09',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
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
              placeholder="Search by item name, party or price..."
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
                  transition: 'all 0.15s ease'
                }}
              >
                Current Bill Items ({rateHistoryData.all.filter(i => i.isInCurrentBill).length})
              </button>

              {currentParty && (
                <button
                  type="button"
                  onClick={() => setActiveTab('party')}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: activeTab === 'party' ? '#27272a' : 'transparent',
                    color: activeTab === 'party' ? '#fafafa' : '#a1a1aa',
                    fontSize: '12px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  Party History
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
                  transition: 'all 0.15s ease'
                }}
              >
                All Items ({rateHistoryData.all.length})
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
          maxHeight: '440px',
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
              <div style={{ fontSize: '12px', color: '#71717a', maxWidth: '320px' }}>
                {activeTab === 'current_bill'
                  ? 'No previous sales history recorded for the items currently in this bill.'
                  : 'Try searching with a different term or switch to "All Items".'}
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
                  <th style={{ padding: '8px 12px', width: '38px', textAlign: 'center' }}></th>
                  <th style={{ padding: '8px 14px' }}>Item / Mould Specification</th>
                  <th style={{ padding: '8px 14px', textAlign: 'right' }}>Recent Rate</th>
                  <th style={{ padding: '8px 14px' }}>Last Billed Party</th>
                  <th style={{ padding: '8px 14px' }}>Bill & Date</th>
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
                        if (!isSelected) e.currentTarget.style.backgroundColor = '#18181b';
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 600, color: '#fafafa' }}>
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
                              color: '#38bdf8',
                              letterSpacing: '0.02em'
                            }}>
                              In Bill
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Recent Rate */}
                      <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                        <span style={{
                          fontWeight: 700,
                          fontSize: '13.5px',
                          color: '#34d399',
                          fontFamily: "'JetBrains Mono', monospace"
                        }}>
                          ₹{item.latestPrice.toLocaleString('en-IN')}
                        </span>
                      </td>

                      {/* Last Billed Party */}
                      <td style={{ padding: '10px 14px', color: '#d4d4d8' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            maxWidth: '180px'
                          }}>
                            {item.latestParty || 'Unknown Party'}
                          </span>
                        </div>
                      </td>

                      {/* Bill & Date */}
                      <td style={{ padding: '10px 14px', color: '#71717a', fontSize: '11.5px', fontFamily: "'JetBrains Mono', monospace" }}>
                        <span>#{item.latestToken} • {item.latestDate || 'Recent'}</span>
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

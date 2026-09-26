import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, FileText, Users, Package, BookOpen, Settings, Zap, ArrowRight, X } from 'lucide-react';
import { useDatabase } from '../../context/DatabaseContext';
import { macAudio } from '../../utils/macAudio';
import type { NavKey } from '../../types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: NavKey) => void;
  onLoadBill?: (bill: any) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
  onLoadBill
}) => {
  const { bills, parties, stockItems } = useDatabase();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Aggregate and filter results
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list: Array<{
      id: string;
      title: string;
      subtitle: string;
      category: 'NAVIGATION' | 'INVOICES' | 'PARTIES' | 'STOCK';
      icon: React.ReactNode;
      action: () => void;
    }> = [];

    // 1. Navigation items
    const navs = [
      { key: 'F1' as NavKey, title: 'F1: Bill Editor & Calculator', subtitle: 'Main Billing screen' },
      { key: 'F2' as NavKey, title: 'F2: Bill History & Invoices', subtitle: 'Saved vouchers archive' },
      { key: 'F3' as NavKey, title: 'F3: Equation & Formulas', subtitle: 'Mould calculation parameters' },
      { key: 'F4' as NavKey, title: 'F4: Master Data Panel', subtitle: 'Raw materials & specs' },
      { key: 'F5' as NavKey, title: 'F5: Party Directory', subtitle: 'Customer ledger & accounts' },
      { key: 'F8' as NavKey, title: 'F8: Stock Inventory', subtitle: 'Warehouse stock tracking' },
      { key: 'F9' as NavKey, title: 'F9: Financial Ledger', subtitle: 'Vouchers debit/credit audit' },
      { key: 'F10' as NavKey, title: 'F10: Control Panel & Settings', subtitle: 'System preferences & themes' }
    ];

    navs.forEach(n => {
      if (!q || n.title.toLowerCase().includes(q) || n.subtitle.toLowerCase().includes(q)) {
        list.push({
          id: `nav-${n.key}`,
          title: n.title,
          subtitle: n.subtitle,
          category: 'NAVIGATION',
          icon: <Zap size={14} color="#38bdf8" />,
          action: () => {
            onNavigateTab(n.key);
            onClose();
          }
        });
      }
    });

    // 2. Invoices matching query (search across all bills in database)
    const cleanNum = q.replace(/^(bill|slip|#)\s*/i, '').trim();
    bills
      .filter(b => 
        !q || 
        b.token === cleanNum || 
        b.token.toLowerCase().includes(q) || 
        b.party.toLowerCase().includes(q) || 
        b.date.includes(q)
      )
      .slice(0, 25)
      .forEach(b => {
        list.push({
          id: `bill-${b.id}`,
          title: `Invoice #${b.token} — ${b.party}`,
          subtitle: `${b.date} • ${b.docType} • ₹${b.total.toLocaleString('en-IN')}`,
          category: 'INVOICES',
          icon: <FileText size={14} color="#a78bfa" />,
          action: () => {
            if (onLoadBill) onLoadBill(b);
            onNavigateTab('F1');
            onClose();
          }
        });
      });

    // 3. Parties matching query
    parties.slice(0, 10).forEach(p => {
      if (!q || p.name.toLowerCase().includes(q) || p.city.toLowerCase().includes(q)) {
        list.push({
          id: `party-${p.id}`,
          title: p.name,
          subtitle: `${p.city} • ${p.phone} • Limit: ₹${p.limit.toLocaleString('en-IN')}`,
          category: 'PARTIES',
          icon: <Users size={14} color="#34d399" />,
          action: () => {
            onNavigateTab('F5');
            onClose();
          }
        });
      }
    });

    // 4. Stock items matching query
    stockItems.slice(0, 10).forEach(s => {
      if (!q || s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q)) {
        list.push({
          id: `stock-${s.id}`,
          title: `${s.code}: ${s.name}`,
          subtitle: `Qty: ${s.qty} ${s.uom} • Rack: ${s.rack} • Status: ${s.status}`,
          category: 'STOCK',
          icon: <Package size={14} color="#f59e0b" />,
          action: () => {
            onNavigateTab('F8');
            onClose();
          }
        });
      }
    });

    return list;
  }, [query, bills, parties, stockItems, onNavigateTab, onLoadBill, onClose]);

  // Keyboard navigation inside command palette
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        macAudio.playHover();
        setSelectedIndex(prev => (prev + 1 < results.length ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        macAudio.playHover();
        setSelectedIndex(prev => (prev - 1 >= 0 ? prev - 1 : results.length - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (results[selectedIndex]) {
          macAudio.playClick();
          results[selectedIndex].action();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed', animation: "antSlideDown 0.2s cubic-bezier(0.23, 1, 0.32, 1) forwards", transformOrigin: "top center", backdropFilter: "blur(60px) saturate(200%)", background: "rgba(10, 15, 25, 0.98)",
        inset: 0,
        background: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(16px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '10vh'
      }}
      onClick={onClose}
    >
      <div
        className="glass-panel"
        style={{
          width: '580px',
          maxWidth: '92vw',
          maxHeight: '75vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '12px',
          border: '1px solid rgba(56, 189, 248, 0.35)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 30px rgba(0, 122, 255, 0.2)',
          overflow: 'hidden'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Search header */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', gap: '10px' }}>
          <Search size={18} color="#38bdf8" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command, search invoice #, party, or stock item..."
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: 500
            }}
          />
          <span style={{ fontSize: '10px', padding: '2px 6px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '4px', color: '#94a3b8', fontFamily: 'monospace' }}>
            ESC
          </span>
        </div>

        {/* Results List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
          {results.length === 0 ? (
            <div style={{ padding: '30px 16px', textAlign: 'center', color: '#94a3b8', fontSize: '12.5px' }}>
              No matching records or actions found.
            </div>
          ) : (
            results.map((r, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={r.id}
                  onClick={() => {
                    macAudio.playClick();
                    r.action();
                  }}
                  onMouseEnter={() => {
                    macAudio.playHover();
                    setSelectedIndex(idx);
                  }}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    background: isSelected ? 'rgba(0, 122, 255, 0.25)' : 'transparent',
                    border: isSelected ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid transparent',
                    transition: 'all 0.1s ease',
                    marginBottom: '2px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ padding: '6px', borderRadius: '5px', background: 'rgba(255, 255, 255, 0.05)', display: 'flex' }}>
                      {r.icon}
                    </div>
                    <div>
                      <div style={{ fontSize: '12.5px', fontWeight: 600, color: isSelected ? '#ffffff' : '#f1f5f9' }}>
                        {r.title}
                      </div>
                      <div style={{ fontSize: '10.5px', color: '#94a3b8' }}>
                        {r.subtitle}
                      </div>
                    </div>
                  </div>

                  <span style={{
                    fontSize: '9px',
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: '3px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    color: '#94a3b8'
                  }}>
                    {r.category}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div style={{
          padding: '6px 14px',
          background: 'rgba(0, 0, 0, 0.3)',
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '10px',
          color: '#64748b'
        }}>
          <span>Navigate: <strong>↑↓</strong> • Select: <strong>Enter</strong></span>
          <span>Instant Database Search</span>
        </div>
      </div>
    </div>
  );
};

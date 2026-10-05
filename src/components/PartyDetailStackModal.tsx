import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { PartyRecord, BillRecord } from '../services/db/schema';
import { macAudio } from '../utils/macAudio';
import {
  X,
  Phone,
  MessageCircle,
  FileText,
  MapPin,
  Building,
  CreditCard,
  TrendingUp,
  Receipt,
  Sparkles,
  Calendar,
  ExternalLink,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { Tooltip } from './ui/shadcn';
import './PartyDetailStackModal.css';

interface Props {
  isOpen: boolean;
  party: PartyRecord | null;
  bills: BillRecord[];
  onClose: () => void;
  onSelectPartyForBill?: (partyName: string) => void;
}

interface StackCardItem {
  id: string;
  icon: string;
  color: string;
  label: string;
  title: string;
  sub?: string;
  type: 'overview' | 'balance' | 'contact' | 'address' | 'gst' | 'business' | 'invoices' | 'actions';
}

export const PartyDetailStackModal: React.FC<Props> = ({
  isOpen,
  party,
  bills,
  onClose,
  onSelectPartyForBill
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeIndexRef = useRef(0);
  const targetIndexRef = useRef(0);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const lastSwitchTimeRef = useRef(0);

  // Filter bills associated with this party
  const partyBills = React.useMemo(() => {
    if (!party) return [];
    const pName = (party.name || '').trim().toLowerCase();
    return bills.filter(b => (b.party || '').trim().toLowerCase() === pName);
  }, [party, bills]);

  const totalBusiness = React.useMemo(() => {
    return partyBills.reduce((acc, b) => acc + (Number(b.total) || 0), 0);
  }, [partyBills]);

  // Generate cards config
  const cards: StackCardItem[] = React.useMemo(() => {
    if (!party) return [];

    const balanceVal = Number(party.balance || 0);
    const balanceType = balanceVal >= 0 ? 'RECEIVABLE' : 'PAYABLE';

    return [
      {
        id: 'overview',
        icon: '👤',
        color: '#0a84ff',
        label: 'OVERVIEW',
        title: party.name,
        sub: `${party.station || party.city || 'Station N/A'} • ${partyBills.length} Invoices Recorded`,
        type: 'overview'
      },
      {
        id: 'balance',
        icon: '💰',
        color: balanceVal >= 0 ? '#30d158' : '#ff375f',
        label: 'ACCOUNT BALANCE',
        title: `₹${Math.abs(balanceVal).toLocaleString('en-IN')}`,
        sub: balanceVal >= 0 ? 'Receivable (Party has to pay)' : 'Advance / Credit Balance',
        type: 'balance'
      },
      {
        id: 'contact',
        icon: '📞',
        color: '#ff9f0a',
        label: 'CONTACT & COMMUNICATION',
        title: party.phone || 'No phone number added',
        sub: party.contact ? `Contact Person: ${party.contact}` : 'Click WhatsApp or Call below',
        type: 'contact'
      },
      {
        id: 'address',
        icon: '📍',
        color: '#bf5af2',
        label: 'STATION & ADDRESS',
        title: [party.station, party.district].filter(Boolean).join(', ') || 'Address Details',
        sub: [party.state, party.pincode ? `PIN: ${party.pincode}` : ''].filter(Boolean).join(' • ') || 'No station entered',
        type: 'address'
      },
      {
        id: 'gst',
        icon: '🏛️',
        color: '#64d2ff',
        label: 'TAX IDENTIFICATION',
        title: party.gstin || 'UNREGISTERED / COMPOSITION',
        sub: party.gstin ? 'Verified GST Identification Number' : 'Regular Party Account without GST',
        type: 'gst'
      },
      {
        id: 'business',
        icon: '📊',
        color: '#ffd60a',
        label: 'LIFETIME BUSINESS',
        title: `₹${totalBusiness.toLocaleString('en-IN')}`,
        sub: `Total volume across ${partyBills.length} recorded invoices`,
        type: 'business'
      },
      {
        id: 'invoices',
        icon: '🧾',
        color: '#ff375f',
        label: 'RECENT INVOICES',
        title: `${partyBills.length} Invoices`,
        sub: 'Latest transactions with status & token number',
        type: 'invoices'
      },
      {
        id: 'actions',
        icon: '⚡',
        color: '#5e5ce6',
        label: 'QUICK ACTIONS',
        title: 'Instant Operations',
        sub: 'Create new sale bill or connect via messaging',
        type: 'actions'
      }
    ];
  }, [party, partyBills, totalBusiness]);

  // Keep active index in sync
  useEffect(() => {
    activeIndexRef.current = activeIndex;
    targetIndexRef.current = activeIndex;
  }, [activeIndex]);

  // Reset to 0 when opening or party changes
  useEffect(() => {
    if (isOpen) {
      setActiveIndex(0);
      targetIndexRef.current = 0;
      activeIndexRef.current = 0;
      setTimeout(() => {
        applyCardStyles(0);
      }, 50);
    }
  }, [isOpen, party]);

  /* ════════════════════════════════════════════════════════════════════════
     APPLY CARD STYLES (iOS 3D Stack Physics)
     ════════════════════════════════════════════════════════════════════════ */
  const applyCardStyles = useCallback((pos: number) => {
    const intTarget = targetIndexRef.current;
    const MAX_VISIBLE = 4;

    cardRefs.current.forEach((card, i) => {
      if (!card) return;

      const rel = i - pos;
      const relTarget = i - intTarget;

      let translateY = 0;
      let scale = 1;
      let opacity = 1;
      let blur = 0;
      let z = 1000 - Math.abs(relTarget) * 10;

      if (relTarget === 0) {
        z = 1000;
      }

      if (rel === 0) {
        translateY = 0;
        scale = 1;
        opacity = 1;
        blur = 0;
      } else if (rel > 0) {
        // CARDS BELOW: Stacked with peek
        const step = Math.min(rel, MAX_VISIBLE);
        translateY = step * 14;
        scale = Math.max(0.85, 1 - step * 0.045);
        opacity = Math.max(0.2, 1 - step * 0.16);
        blur = step * 0.8;
      } else {
        // CARDS ABOVE: Gliding up and folding away
        const up = Math.abs(rel);
        translateY = -up * 85;
        scale = Math.max(0.88, 1 - Math.min(up, 1) * 0.03);
        opacity = Math.max(0, 1 - up * 1.25);
        blur = up * 4;
      }

      card.style.transform = `translate3d(-50%, ${translateY}px, 0) scale(${scale})`;
      card.style.opacity = String(Math.max(0, Math.min(1, opacity)));
      card.style.filter = blur > 0.1 ? `blur(${blur}px)` : 'none';
      card.style.zIndex = String(z);
    });
  }, []);

  // 60FPS loop
  useEffect(() => {
    if (!isOpen) return;
    let animId: number;
    const tick = () => {
      const diff = targetIndexRef.current - activeIndexRef.current;
      if (Math.abs(diff) > 0.001) {
        activeIndexRef.current += diff * 0.22;
        applyCardStyles(activeIndexRef.current);
      } else if (activeIndexRef.current !== targetIndexRef.current) {
        activeIndexRef.current = targetIndexRef.current;
        applyCardStyles(activeIndexRef.current);
      }
      animId = requestAnimationFrame(tick);
    };
    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [isOpen, applyCardStyles]);

  /* ════════════════════════════════════════════════════════════════════════
     NAVIGATION
     ════════════════════════════════════════════════════════════════════════ */
  const tryAdvance = useCallback((dir: number) => {
    const now = performance.now();
    if (now - lastSwitchTimeRef.current < 65) return false;

    const cur = targetIndexRef.current;
    if (dir > 0 && cur < cards.length - 1) {
      lastSwitchTimeRef.current = now;
      macAudio.playHover();
      targetIndexRef.current = cur + 1;
      setActiveIndex(cur + 1);
      return true;
    }
    if (dir < 0 && cur > 0) {
      lastSwitchTimeRef.current = now;
      macAudio.playHover();
      targetIndexRef.current = cur - 1;
      setActiveIndex(cur - 1);
      return true;
    }
    return false;
  }, [cards.length]);

  // Wheel handler
  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    if (Math.abs(e.deltaY) < 3) return;
    tryAdvance(e.deltaY > 0 ? 1 : -1);
  }, [tryAdvance]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        tryAdvance(1);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        tryAdvance(-1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, tryAdvance, onClose]);

  // Touch handlers
  const touchState = useRef({ startY: 0, active: false });
  const onTouchStart = (e: React.TouchEvent) => {
    touchState.current = { startY: e.touches[0].clientY, active: true };
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (!touchState.current.active) return;
    const dy = touchState.current.startY - e.touches[0].clientY;
    if (Math.abs(dy) >= 30) {
      if (tryAdvance(dy > 0 ? 1 : -1)) {
        touchState.current.active = false;
      }
    }
  };
  const onTouchEnd = () => {
    touchState.current.active = false;
  };

  if (!isOpen || !party) return null;

  const initials = (party.name || 'P')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('');

  return (
    <div className="party-stack-overlay" onClick={onClose}>
      <div className="party-stack-modal" onClick={e => e.stopPropagation()}>
        {/* TOP STATUS BAR */}
        <div className="party-stack-topbar">
          <Tooltip title="Close (Esc)" side="bottom">
            <button type="button" className="ios-circle-btn" onClick={onClose}>
              <X size={16} />
            </button>
          </Tooltip>
          <div className="party-stack-title">PARTY DETAIL • iOS STACK</div>
          <div style={{ display: 'flex', gap: '4px' }}>
            <Tooltip title="Previous Card (ArrowUp)" side="bottom">
              <button
                type="button"
                className="ios-circle-btn"
                onClick={() => tryAdvance(-1)}
                disabled={activeIndex <= 0}
              >
                <ChevronUp size={16} />
              </button>
            </Tooltip>
            <Tooltip title="Next Card (ArrowDown)" side="bottom">
              <button
                type="button"
                className="ios-circle-btn"
                onClick={() => tryAdvance(1)}
                disabled={activeIndex >= cards.length - 1}
              >
                <ChevronDown size={16} />
              </button>
            </Tooltip>
          </div>
        </div>

        {/* HERO SECTION */}
        <div className="party-hero-section">
          <div className="party-hero-avatar">
            {initials}
          </div>
          <div className="party-hero-name">{party.name}</div>
          <div className="party-hero-sub">
            {party.station || party.city || 'Station N/A'} • {party.phone || 'No phone'}
          </div>
        </div>

        {/* 3D STACK VIEWPORT */}
        <div
          ref={containerRef}
          className="party-stack-viewport"
          onWheel={onWheel}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <div className="party-stack-inner">
            {cards.map((c, i) => (
              <div
                key={c.id}
                ref={el => { cardRefs.current[i] = el; }}
                className={`party-stack-card ${i === activeIndex ? 'active' : ''}`}
                onClick={() => {
                  macAudio.playClick();
                  targetIndexRef.current = i;
                  setActiveIndex(i);
                }}
              >
                {/* CARD HEAD */}
                <div className="card-header-row">
                  <div className="card-icon-box" style={{ background: c.color }}>
                    {c.icon}
                  </div>
                  <div className="card-tag">{c.label}</div>
                  <div className="card-idx-badge">{i + 1} / {cards.length}</div>
                </div>

                {/* CARD CONTENT ACCORDING TO TYPE */}
                {c.type === 'balance' ? (
                  <div className="card-balance-block">
                    <div className="balance-big-text" style={{ color: c.color }}>
                      {c.title}
                    </div>
                    <div className="card-desc-text">{c.sub}</div>
                  </div>
                ) : c.type === 'invoices' ? (
                  <div className="card-invoices-block">
                    <div className="card-heading-title">{c.title}</div>
                    <div className="invoice-preview-list">
                      {partyBills.length === 0 ? (
                        <div style={{ fontSize: '12px', color: '#94a3b8', padding: '12px 0', textAlign: 'center' }}>
                          No invoice records found for this party.
                        </div>
                      ) : (
                        partyBills.slice(0, 3).map((b, bIdx) => (
                          <div key={b.id || bIdx} className="invoice-compact-row">
                            <div className="inv-left-meta">
                              <span className="inv-num">#{b.token}</span>
                              <span className="inv-date">{b.date}</span>
                            </div>
                            <div className="inv-right-meta">
                              <span className="inv-amount">₹{Number(b.total || 0).toLocaleString('en-IN')}</span>
                              <span className="inv-doc-pill">{b.docType || 'BILL'}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ) : c.type === 'actions' ? (
                  <div className="card-actions-block">
                    <div className="card-heading-title">Quick Actions</div>
                    <div className="action-chips-grid">
                      {party.phone && (
                        <a
                          href={`tel:${party.phone}`}
                          className="action-chip"
                          onClick={() => macAudio.playClick()}
                        >
                          <Phone size={14} color="#38bdf8" />
                          <span>Call Phone</span>
                        </a>
                      )}
                      {party.phone && (
                        <a
                          href={`https://wa.me/${party.phone.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="action-chip"
                          onClick={() => macAudio.playClick()}
                        >
                          <MessageCircle size={14} color="#34d399" />
                          <span>WhatsApp</span>
                        </a>
                      )}
                      <button
                        type="button"
                        className="action-chip primary"
                        onClick={() => {
                          macAudio.playSuccess();
                          if (onSelectPartyForBill) {
                            onSelectPartyForBill(party.name);
                            onClose();
                          }
                        }}
                      >
                        <FileText size={14} color="#ffffff" />
                        <span>Create Sale Bill</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="card-standard-block">
                    <div className="card-heading-title">{c.title}</div>
                    {c.sub && <div className="card-desc-text">{c.sub}</div>}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* PROGRESS DOTS */}
        <div className="party-stack-dots">
          {cards.map((_, i) => (
            <div
              key={i}
              className={`party-dot ${i === activeIndex ? 'active' : ''}`}
              onClick={() => {
                macAudio.playHover();
                targetIndexRef.current = i;
                setActiveIndex(i);
              }}
            />
          ))}
        </div>

        {/* HINT */}
        <div className="party-stack-hint">
          <span>↑ Scroll wheel or press Arrow Up / Down to explore</span>
        </div>
      </div>
    </div>
  );
};

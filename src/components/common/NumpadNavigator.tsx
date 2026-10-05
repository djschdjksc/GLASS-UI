import React, { useState, useEffect, useCallback, useRef } from 'react';
import { macAudio } from '../../utils/macAudio';
import {
  Zap,
  X,
  ArrowLeft,
  CheckCircle2,
  Sliders,
  FileText,
  Package,
  Layers,
  Sparkles,
  Command
} from 'lucide-react';

export interface NavTarget {
  num: number;
  label: string;
  selector: string;
  type: 'input' | 'button' | 'select' | 'grid_cell';
}

export interface NavZone {
  id: number;
  name: string;
  subTitle: string;
  icon: string;
  color: string;
  selector: string;
  targets: NavTarget[];
}

export const NUMPAD_ZONES: NavZone[] = [
  {
    id: 1,
    name: 'BILL HEADER',
    subTitle: 'Document details, Party, Vehicle, Date, Token',
    icon: '📋',
    color: '#38bdf8',
    selector: '[data-np-zone="1"]',
    targets: [
      { num: 1, label: 'Doc Type', selector: '[data-np-target="1-1"]', type: 'select' },
      { num: 2, label: 'Party Name Input', selector: '[data-np-target="1-2"]', type: 'input' },
      { num: 3, label: 'Trade Type', selector: '[data-np-target="1-3"]', type: 'select' },
      { num: 4, label: 'Vehicle No', selector: '[data-np-target="1-4"]', type: 'input' },
      { num: 5, label: 'Bill Date', selector: '[data-np-target="1-5"]', type: 'input' },
      { num: 6, label: 'Token No', selector: '[data-np-target="1-6"]', type: 'input' }
    ]
  },
  {
    id: 2,
    name: 'ACTION RAIL',
    subTitle: 'Save, Print, Add Row, OCR, Notes, Records',
    icon: '⚡',
    color: '#34d399',
    selector: '[data-np-zone="2"]',
    targets: [
      { num: 1, label: 'Save Bill', selector: '[data-np-target="2-1"]', type: 'button' },
      { num: 2, label: 'Print Slip', selector: '[data-np-target="2-2"]', type: 'button' },
      { num: 3, label: 'Add Raw Row', selector: '[data-np-target="2-3"]', type: 'button' },
      { num: 4, label: 'AI OCR Scan', selector: '[data-np-target="2-4"]', type: 'button' },
      { num: 5, label: 'Bill Note', selector: '[data-np-target="2-5"]', type: 'button' },
      { num: 6, label: 'Party Code', selector: '[data-np-target="2-6"]', type: 'button' },
      { num: 7, label: 'Previous Bill', selector: '[data-np-target="2-7"]', type: 'button' },
      { num: 8, label: 'Next Bill', selector: '[data-np-target="2-8"]', type: 'button' },
      { num: 9, label: 'Reset Form', selector: '[data-np-target="2-9"]', type: 'button' }
    ]
  },
  {
    id: 3,
    name: 'RAW MATERIALS GRID',
    subTitle: 'Raw Items, Quantities, Capacities, Rows',
    icon: '📦',
    color: '#a78bfa',
    selector: '[data-np-zone="3"]',
    targets: [
      { num: 1, label: 'First Row Item', selector: '[data-np-target="3-1"]', type: 'grid_cell' },
      { num: 2, label: 'Last Row Item', selector: '[data-np-target="3-2"]', type: 'grid_cell' },
      { num: 3, label: 'Add Row (+)', selector: '[data-np-target="3-3"]', type: 'button' },
      { num: 4, label: 'Delete Row', selector: '[data-np-target="3-4"]', type: 'button' },
      { num: 5, label: 'Paste Items', selector: '[data-np-target="3-5"]', type: 'button' },
      { num: 6, label: 'Jump Right (→)', selector: '[data-np-target="3-6"]', type: 'button' }
    ]
  },
  {
    id: 4,
    name: 'FINISHED MOULDS GRID',
    subTitle: 'Finished Goods, Moulds, Rates, Grand Total',
    icon: '🏭',
    color: '#fbbf24',
    selector: '[data-np-zone="4"]',
    targets: [
      { num: 1, label: 'First Row Mould', selector: '[data-np-target="4-1"]', type: 'grid_cell' },
      { num: 2, label: 'Last Row Mould', selector: '[data-np-target="4-2"]', type: 'grid_cell' },
      { num: 3, label: 'Add Mould (+)', selector: '[data-np-target="4-3"]', type: 'button' },
      { num: 4, label: 'Delete Moulds', selector: '[data-np-target="4-4"]', type: 'button' },
      { num: 5, label: 'Paste Moulds', selector: '[data-np-target="4-5"]', type: 'button' },
      { num: 6, label: 'Jump Left (←)', selector: '[data-np-target="4-6"]', type: 'button' }
    ]
  },
  {
    id: 5,
    name: 'MODE & SLIP BAR',
    subTitle: 'Auto Convert, Sticky Mode, Instant Slip Search',
    icon: '⚙️',
    color: '#f472b6',
    selector: '[data-np-zone="5"]',
    targets: [
      { num: 1, label: 'Auto Convert', selector: '[data-np-target="5-1"]', type: 'button' },
      { num: 2, label: 'Auto Item Mode', selector: '[data-np-target="5-2"]', type: 'button' },
      { num: 3, label: 'Simple Mode', selector: '[data-np-target="5-3"]', type: 'button' },
      { num: 4, label: 'Search Slip Input', selector: '[data-np-target="5-4"]', type: 'input' }
    ]
  },
  {
    id: 6,
    name: 'MODULE NAVIGATION',
    subTitle: 'Navigation Rail Tab Switcher',
    icon: '📑',
    color: '#818cf8',
    selector: '[data-np-zone="6"]',
    targets: [
      { num: 1, label: 'Bill UI', selector: '[data-np-target="6-1"]', type: 'button' },
      { num: 2, label: 'Bill History', selector: '[data-np-target="6-2"]', type: 'button' },
      { num: 3, label: 'Equation', selector: '[data-np-target="6-3"]', type: 'button' },
      { num: 4, label: 'Party Panel', selector: '[data-np-target="6-4"]', type: 'button' },
      { num: 5, label: 'Control Panel', selector: '[data-np-target="6-5"]', type: 'button' },
      { num: 6, label: 'Stock Inventory', selector: '[data-np-target="6-6"]', type: 'button' },
      { num: 7, label: 'Ledger', selector: '[data-np-target="6-7"]', type: 'button' },
      { num: 8, label: 'Settings', selector: '[data-np-target="6-8"]', type: 'button' }
    ]
  }
];

interface ElementRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface TargetBadgeInfo {
  target: NavTarget;
  rect: ElementRect;
}

interface ZoneBadgeInfo {
  zone: NavZone;
  rect: ElementRect;
}

interface Props {
  isActiveTabBill: boolean;
  onToast?: (msg: string, type?: 'info' | 'success' | 'warning') => void;
}

export const NumpadNavigator: React.FC<Props> = ({ isActiveTabBill, onToast }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedZone, setSelectedZone] = useState<NavZone | null>(null);
  const [zoneBadges, setZoneBadges] = useState<ZoneBadgeInfo[]>([]);
  const [targetBadges, setTargetBadges] = useState<TargetBadgeInfo[]>([]);

  // Sound feedback helper
  const playBeep = () => macAudio.playClick();

  // Measure DOM zones & targets
  const updatePositions = useCallback(() => {
    if (!isOpen) return;

    if (!selectedZone) {
      // Step 1: Measure all Zones
      const zb: ZoneBadgeInfo[] = [];
      NUMPAD_ZONES.forEach(z => {
        const el = document.querySelector(z.selector) as HTMLElement | null;
        if (el) {
          const r = el.getBoundingClientRect();
          if (r.width > 0 && r.height > 0) {
            zb.push({
              zone: z,
              rect: {
                top: r.top,
                left: r.left,
                width: r.width,
                height: r.height
              }
            });
          }
        }
      });
      setZoneBadges(zb);
      setTargetBadges([]);
    } else {
      // Step 2: Measure targets inside selected zone
      const tb: TargetBadgeInfo[] = [];
      selectedZone.targets.forEach(t => {
        const el = document.querySelector(t.selector) as HTMLElement | null;
        if (el) {
          const r = el.getBoundingClientRect();
          if (r.width > 0 && r.height > 0) {
            tb.push({
              target: t,
              rect: {
                top: r.top,
                left: r.left,
                width: r.width,
                height: r.height
              }
            });
          }
        }
      });
      setTargetBadges(tb);
      setZoneBadges([]);
    }
  }, [isOpen, selectedZone]);

  // Recalculate on open/step change and resize/scroll
  useEffect(() => {
    updatePositions();
    window.addEventListener('resize', updatePositions);
    window.addEventListener('scroll', updatePositions, true);
    return () => {
      window.removeEventListener('resize', updatePositions);
      window.removeEventListener('scroll', updatePositions, true);
    };
  }, [updatePositions]);

  // Execute element action
  const executeTarget = useCallback((target: NavTarget) => {
    const el = document.querySelector(target.selector) as HTMLElement | null;
    playBeep();
    setIsOpen(false);
    setSelectedZone(null);

    if (!el) {
      onToast?.(`Element "${target.label}" not found in DOM`, 'warning');
      return;
    }

    if (target.type === 'input' || target.type === 'select') {
      el.focus();
      if ('select' in el && typeof (el as HTMLInputElement).select === 'function') {
        (el as HTMLInputElement).select();
      }
      onToast?.(`Focused: ${target.label}`, 'info');
    } else if (target.type === 'button') {
      el.click();
      onToast?.(`Triggered: ${target.label}`, 'success');
    } else if (target.type === 'grid_cell') {
      el.focus();
      el.click();
      onToast?.(`Selected: ${target.label}`, 'info');
    }
  }, [onToast]);

  // Global Keyboard listener for NumPad Del (".") and Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInput = document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA';
      // Only intercept the PHYSICAL NumPad Del key (NumpadDecimal), NOT the regular keyboard "." dot key
      // This allows users to type "." freely in any input field
      const isNumpadDel = e.code === 'NumpadDecimal';

      // TOGGLE OPEN / CLOSE VIA ".":
      if (isNumpadDel) {
        if (isOpen) {
          // If open, pressing "." ALWAYS closes immediately!
          e.preventDefault();
          e.stopPropagation();
          macAudio.playHover();
          setIsOpen(false);
          setSelectedZone(null);
          return;
        } else if (!isInput || e.altKey || e.ctrlKey) {
          // If closed and not typing text, open it!
          e.preventDefault();
          e.stopPropagation();
          playBeep();
          setIsOpen(true);
          setSelectedZone(null);
          return;
        }
      }

      // If Navigator is NOT OPEN, do nothing
      if (!isOpen) return;

      // Handle Escape to exit
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        macAudio.playHover();
        setIsOpen(false);
        setSelectedZone(null);
        return;
      }

      // Handle Backspace or "0" / "Numpad0" to go back from Step 2 to Step 1
      if (e.key === '0' || e.code === 'Numpad0' || e.key === 'Backspace') {
        if (selectedZone) {
          e.preventDefault();
          e.stopPropagation();
          macAudio.playHover();
          setSelectedZone(null);
          return;
        }
      }

      // Check numeric key (1 - 9)
      const numMatch = e.code.match(/Numpad([1-9])/) || e.key.match(/^([1-9])$/);
      if (numMatch) {
        const num = parseInt(numMatch[1], 10);
        e.preventDefault();
        e.stopPropagation();

        if (!selectedZone) {
          // STEP 1: Select Zone
          const foundZone = NUMPAD_ZONES.find(z => z.id === num);
          if (foundZone) {
            playBeep();
            setSelectedZone(foundZone);
          }
        } else {
          // STEP 2: Execute Target within Zone
          const foundTarget = selectedZone.targets.find(t => t.num === num);
          if (foundTarget) {
            executeTarget(foundTarget);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, selectedZone, executeTarget]);

  // Helper for arrow rendering
  const renderPointingArrow = (direction: 'up' | 'down' | 'left' | 'right') => {
    switch (direction) {
      case 'down':
        return (
          <span
            style={{
              position: 'absolute',
              bottom: '-5px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 0,
              height: 0,
              borderLeft: '5px solid transparent',
              borderRight: '5px solid transparent',
              borderTop: '5px solid #1c1c1e',
              filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.5))',
              pointerEvents: 'none',
            }}
          />
        );
      case 'up':
        return (
          <span
            style={{
              position: 'absolute',
              top: '-5px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 0,
              height: 0,
              borderLeft: '5px solid transparent',
              borderRight: '5px solid transparent',
              borderBottom: '5px solid #1c1c1e',
              filter: 'drop-shadow(0 -1px 1px rgba(0,0,0,0.5))',
              pointerEvents: 'none',
            }}
          />
        );
      case 'left':
        return (
          <span
            style={{
              position: 'absolute',
              left: '-5px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: 0,
              height: 0,
              borderTop: '5px solid transparent',
              borderBottom: '5px solid transparent',
              borderRight: '5px solid #1c1c1e',
              filter: 'drop-shadow(-1px 0 1px rgba(0,0,0,0.5))',
              pointerEvents: 'none',
            }}
          />
        );
      case 'right':
        return (
          <span
            style={{
              position: 'absolute',
              right: '-5px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: 0,
              height: 0,
              borderTop: '5px solid transparent',
              borderBottom: '5px solid transparent',
              borderLeft: '5px solid #1c1c1e',
              filter: 'drop-shadow(1px 0 1px rgba(0,0,0,0.5))',
              pointerEvents: 'none',
            }}
          />
        );
    }
  };

  // Helper: placement for Step 1 Zone tooltips
  const getZonePlacement = (zone: NavZone, rect: ElementRect): {
    style: React.CSSProperties;
    arrowDirection: 'up' | 'down' | 'left' | 'right';
  } => {
    // Action Rail (Zone 2, left side docked)
    if (zone.id === 2 || rect.left < 80) {
      return {
        style: {
          position: 'absolute',
          top: `${Math.max(rect.top + 16, 12)}px`,
          left: `${rect.left + rect.width + 12}px`,
        },
        arrowDirection: 'left'
      };
    }

    // Module Rail (Zone 6, right side docked)
    if (zone.id === 6 || rect.left > window.innerWidth - 120) {
      return {
        style: {
          position: 'absolute',
          top: `${Math.max(rect.top + 16, 12)}px`,
          left: `${rect.left - 12}px`,
          transform: 'translateX(-100%)',
        },
        arrowDirection: 'right'
      };
    }

    // Top header (Zone 1)
    if (rect.top < 65) {
      return {
        style: {
          position: 'absolute',
          top: `${rect.bottom + 10}px`,
          left: `${Math.max(rect.left + 24, 20)}px`,
        },
        arrowDirection: 'up'
      };
    }

    // Default: above zone pointing down
    return {
      style: {
        position: 'absolute',
        top: `${rect.top - 36}px`,
        left: `${Math.max(rect.left + 24, 20)}px`,
      },
      arrowDirection: 'down'
    };
  };

  // Helper: placement for Step 2 Target tooltips
  const getTargetPlacement = (rect: ElementRect, zoneId: number): {
    style: React.CSSProperties;
    arrowDirection: 'up' | 'down' | 'left' | 'right';
  } => {
    // Left docked rail (Zone 2 Action Rail)
    if (zoneId === 2 || rect.left < 90) {
      return {
        style: {
          position: 'absolute',
          top: `${rect.top + (rect.height - 28) / 2}px`,
          left: `${rect.left + rect.width + 10}px`,
        },
        arrowDirection: 'left'
      };
    }

    // Right docked rail (Zone 6 Module Nav)
    if (zoneId === 6 || rect.left > window.innerWidth - 130) {
      return {
        style: {
          position: 'absolute',
          top: `${rect.top + (rect.height - 28) / 2}px`,
          left: `${rect.left - 10}px`,
          transform: 'translateX(-100%)',
        },
        arrowDirection: 'right'
      };
    }

    // Top header row (Zone 1)
    if (zoneId === 1 || rect.top < 70) {
      return {
        style: {
          position: 'absolute',
          top: `${rect.bottom + 8}px`,
          left: `${rect.left + rect.width / 2}px`,
          transform: 'translateX(-50%)',
        },
        arrowDirection: 'up'
      };
    }

    // Bottom dock (Zone 5 mode bar)
    if (rect.top > window.innerHeight - 80) {
      return {
        style: {
          position: 'absolute',
          top: `${rect.top - 36}px`,
          left: `${rect.left + rect.width / 2}px`,
          transform: 'translateX(-50%)',
        },
        arrowDirection: 'down'
      };
    }

    // If enough room above
    if (rect.top >= 42) {
      return {
        style: {
          position: 'absolute',
          top: `${rect.top - 36}px`,
          left: `${rect.left + rect.width / 2}px`,
          transform: 'translateX(-50%)',
        },
        arrowDirection: 'down'
      };
    }

    // Fallback below
    return {
      style: {
        position: 'absolute',
        top: `${rect.bottom + 8}px`,
        left: `${rect.left + rect.width / 2}px`,
        transform: 'translateX(-50%)',
      },
      arrowDirection: 'up'
    };
  };

  return (
    <>
      <style>{`
        @keyframes numpadLightGlow {
          0%, 100% {
            opacity: 0.85;
            filter: drop-shadow(0 0 8px currentColor);
          }
          50% {
            opacity: 1;
            filter: drop-shadow(0 0 16px currentColor);
          }
        }
        @keyframes numpadTargetPulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.02);
          }
        }
      `}</style>

      {/* ----------------------------------------------------------------- */}
      {/* ACTIVE NUMPAD NAVIGATOR: GLOWING LIGHT BORDERS + POINTING TOOLTIPS */}
      {/* ----------------------------------------------------------------- */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999990,
            pointerEvents: 'none',
            background: 'transparent',
            backdropFilter: 'none',
            transition: 'all 0.15s ease'
          }}
        >
          {/* TOP HINT BAR */}
          <div
            style={{
              position: 'fixed',
              top: '12px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 9999999,
              background: 'rgba(28, 28, 30, 0.92)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.14)',
              borderRadius: '9999px',
              padding: '4px 14px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: 500,
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)',
              pointerEvents: 'auto',
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: selectedZone ? selectedZone.color : '#38bdf8',
                  boxShadow: `0 0 8px ${selectedZone ? selectedZone.color : '#38bdf8'}`
                }}
              />
              <span style={{ fontWeight: 600, letterSpacing: '-0.01em' }}>
                {selectedZone ? selectedZone.name : 'NUMPAD SHORTCUT GROUPS'}
              </span>
            </span>
            <span style={{ color: 'rgba(255, 255, 255, 0.3)' }}>|</span>
            {selectedZone ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#a1a1aa' }}>
                Press <kbd style={{ background: '#3f3f42', color: '#fff', padding: '1px 6px', borderRadius: '4px', fontWeight: 600 }}>1-{selectedZone.targets.length}</kbd> to act or <kbd style={{ background: '#3f3f42', color: '#fff', padding: '1px 6px', borderRadius: '4px', fontWeight: 600 }}>0</kbd> to go back
              </span>
            ) : (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#a1a1aa' }}>
                Press <kbd style={{ background: '#3f3f42', color: '#fff', padding: '1px 6px', borderRadius: '4px', fontWeight: 600 }}>1-6</kbd> to select group
              </span>
            )}
            <button
              onClick={() => {
                macAudio.playHover();
                setIsOpen(false);
                setSelectedZone(null);
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#9ca3af',
                cursor: 'pointer',
                padding: '2px',
                display: 'flex',
                alignItems: 'center',
                borderRadius: '50%',
              }}
              title="Close (Esc or .)"
            >
              <X size={13} />
            </button>
          </div>

          {/* STEP 1: ZONE OVERLAYS (Glowing Light Border + Floating Pointing Tooltip) */}
          {/* --------------------------------------------------------------------- */}
          {!selectedZone && zoneBadges.map(({ zone, rect }) => {
            const placement = getZonePlacement(zone, rect);

            return (
              <React.Fragment key={zone.id}>
                {/* Glowing Light Border around the Group */}
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    playBeep();
                    setSelectedZone(zone);
                  }}
                  style={{
                    position: 'absolute',
                    top: `${rect.top}px`,
                    left: `${rect.left}px`,
                    width: `${rect.width}px`,
                    height: `${rect.height}px`,
                    border: `1.5px solid ${zone.color}bb`,
                    borderRadius: '10px',
                    background: `${zone.color}06`,
                    boxShadow: `0 0 18px ${zone.color}45, 0 0 32px ${zone.color}20, inset 0 0 14px ${zone.color}15`,
                    color: zone.color,
                    animation: 'numpadLightGlow 2.5s ease-in-out infinite',
                    pointerEvents: 'auto',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                />

                {/* Floating Capsule Tooltip with Pointing Arrow & Number Badge */}
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    playBeep();
                    setSelectedZone(zone);
                  }}
                  style={{
                    ...placement.style,
                    zIndex: 999999,
                    background: '#1c1c1e',
                    color: '#ffffff',
                    border: '1px solid rgba(255, 255, 255, 0.16)',
                    borderRadius: '9999px',
                    height: '28px',
                    padding: '3px 4px 3px 12px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.75), 0 2px 6px rgba(0, 0, 0, 0.4)',
                    fontFamily: 'var(--font-sans, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Inter", sans-serif)',
                    whiteSpace: 'nowrap',
                    userSelect: 'none',
                    lineHeight: '1',
                    cursor: 'pointer',
                    pointerEvents: 'auto',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: 600,
                      color: '#ffffff',
                      letterSpacing: '-0.01em',
                      whiteSpace: 'nowrap',
                      lineHeight: '1',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <span style={{ fontSize: '13px', lineHeight: 1 }}>{zone.icon}</span>
                    <span>{zone.name}</span>
                  </span>
                  <kbd
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: '#3f3f42',
                      color: '#f4f4f5',
                      padding: '3px 8.5px',
                      borderRadius: '9999px',
                      fontSize: '11px',
                      fontWeight: 700,
                      fontFamily: 'var(--font-sans, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif)',
                      letterSpacing: '0.02em',
                      lineHeight: '1',
                      border: 'none',
                      boxShadow: 'none',
                      whiteSpace: 'nowrap',
                      userSelect: 'none',
                    }}
                  >
                    {zone.id}
                  </kbd>
                  {renderPointingArrow(placement.arrowDirection)}
                </div>
              </React.Fragment>
            );
          })}

          {/* --------------------------------------------------------------------- */}
          {/* STEP 2: SIMULTANEOUS OPEN TARGET TOOLTIPS WITH NUMBERING BADGES       */}
          {/* --------------------------------------------------------------------- */}
          {selectedZone && (
            <>
              {/* Highlight surrounding selected zone container with a gentle radiant glow */}
              {(() => {
                const zoneEl = document.querySelector(selectedZone.selector) as HTMLElement | null;
                if (!zoneEl) return null;
                const r = zoneEl.getBoundingClientRect();
                return (
                  <div
                    style={{
                      position: 'absolute',
                      top: `${r.top - 4}px`,
                      left: `${r.left - 4}px`,
                      width: `${r.width + 8}px`,
                      height: `${r.height + 8}px`,
                      border: `1.5px solid ${selectedZone.color}77`,
                      boxShadow: `0 0 20px ${selectedZone.color}30`,
                      borderRadius: '10px',
                      pointerEvents: 'none',
                    }}
                  />
                );
              })()}

              {/* Each Target Element: Glowing Light Border + Simultaneous Pointing Tooltip with Numbering */}
              {targetBadges.map(({ target, rect }) => {
                const placement = getTargetPlacement(rect, selectedZone.id);

                return (
                  <React.Fragment key={target.num}>
                    {/* Glowing Light Border around Target Button/Element */}
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        executeTarget(target);
                      }}
                      style={{
                        position: 'absolute',
                        top: `${rect.top - 2}px`,
                        left: `${rect.left - 2}px`,
                        width: `${rect.width + 4}px`,
                        height: `${rect.height + 4}px`,
                        border: `1.5px solid ${selectedZone.color}`,
                        borderRadius: '6px',
                        background: `${selectedZone.color}08`,
                        boxShadow: `0 0 14px ${selectedZone.color}55, inset 0 0 8px ${selectedZone.color}25`,
                        color: selectedZone.color,
                        animation: 'numpadLightGlow 2s ease-in-out infinite',
                        pointerEvents: 'auto',
                        cursor: 'pointer',
                        transition: 'all 0.12s ease',
                      }}
                    />

                    {/* Pointing Tooltip Open for All Buttons Simultaneously with Numbering Badge */}
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        executeTarget(target);
                      }}
                      style={{
                        ...placement.style,
                        zIndex: 999999,
                        background: '#1c1c1e',
                        color: '#ffffff',
                        border: '1px solid rgba(255, 255, 255, 0.16)',
                        borderRadius: '9999px',
                        height: '28px',
                        padding: '3px 4px 3px 12px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.75), 0 2px 6px rgba(0, 0, 0, 0.4)',
                        fontFamily: 'var(--font-sans, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Inter", sans-serif)',
                        whiteSpace: 'nowrap',
                        userSelect: 'none',
                        lineHeight: '1',
                        cursor: 'pointer',
                        pointerEvents: 'auto',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '12px',
                          fontWeight: 500,
                          color: '#ffffff',
                          letterSpacing: '-0.01em',
                          whiteSpace: 'nowrap',
                          lineHeight: '1',
                        }}
                      >
                        {target.label}
                      </span>
                      <kbd
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: '#3f3f42',
                          color: '#f4f4f5',
                          padding: '3px 8.5px',
                          borderRadius: '9999px',
                          fontSize: '11px',
                          fontWeight: 600,
                          fontFamily: 'var(--font-sans, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif)',
                          letterSpacing: '0.02em',
                          lineHeight: '1',
                          border: 'none',
                          boxShadow: 'none',
                          whiteSpace: 'nowrap',
                          userSelect: 'none',
                        }}
                      >
                        {target.num}
                      </kbd>
                      {renderPointingArrow(placement.arrowDirection)}
                    </div>
                  </React.Fragment>
                );
              })}
            </>
          )}
        </div>
      )}
    </>
  );
};


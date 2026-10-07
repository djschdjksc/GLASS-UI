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
  right: number;
  bottom: number;
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
                height: r.height,
                right: r.left + r.width,
                bottom: r.top + r.height
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
                height: r.height,
                right: r.left + r.width,
                bottom: r.top + r.height
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
    previousActiveElementRef.current = null;
    previousActiveElementIdRef.current = null;
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

  const previousActiveElementRef = useRef<HTMLElement | null>(null);
  const previousActiveElementIdRef = useRef<string | null>(null);
  const previousSelectionRef = useRef<{ start: number | null; end: number | null }>({ start: null, end: null });

  const restorePreviousFocus = useCallback(() => {
    setTimeout(() => {
      const prevEl = previousActiveElementRef.current;
      const prevId = previousActiveElementIdRef.current;
      const targetEl = (prevEl && document.contains(prevEl)) ? prevEl : (prevId ? document.getElementById(prevId) : null);
      if (targetEl) {
        targetEl.focus();
        if ('setSelectionRange' in targetEl && previousSelectionRef.current.start !== null && previousSelectionRef.current.end !== null) {
          try {
            (targetEl as HTMLInputElement).setSelectionRange(previousSelectionRef.current.start, previousSelectionRef.current.end);
          } catch {}
        }
      }
      previousActiveElementRef.current = null;
      previousActiveElementIdRef.current = null;
      previousSelectionRef.current = { start: null, end: null };
    }, 30);
  }, []);

  // Global Keyboard listener for NumPad Del (".") and Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Do not intercept if calculator modal is actively open
      const calcEl = document.getElementById('digital-calc-modal');
      if (calcEl && calcEl.offsetParent !== null) {
        return;
      }

      // Intercept the PHYSICAL NumPad Del/Decimal key (NumpadDecimal), NOT the regular keyboard "." dot key.
      // User rule: Pressing NumPad '.' must ALWAYS toggle / trigger this group-wise shortcut navigator,
      // EVEN WHEN ACTIVE INSIDE ANY INPUT CELL OR TEXTBOX!
      // (When users want to type '.' as a decimal point, they use the main keyboard '.' key next to '/').
      const isNumpadDel = e.code === 'NumpadDecimal' || (e.key === '.' && e.location === 3) || e.key === 'Decimal';

      // TOGGLE OPEN / CLOSE VIA NumPad ".":
      if (isNumpadDel) {
        e.preventDefault();
        e.stopPropagation();

        if (isOpen) {
          // If open, pressing "." closes immediately and RESTORES focus to previously active cell!
          macAudio.playHover();
          setIsOpen(false);
          setSelectedZone(null);
          restorePreviousFocus();
        } else {
          // Store previously active element/cell to restore focus when closed or canceled!
          const activeEl = document.activeElement as HTMLElement | null;
          previousActiveElementRef.current = activeEl;
          previousActiveElementIdRef.current = activeEl?.id || null;
          if (activeEl && 'selectionStart' in activeEl) {
            try {
              const inp = activeEl as HTMLInputElement;
              previousSelectionRef.current = { start: inp.selectionStart, end: inp.selectionEnd };
            } catch {
              previousSelectionRef.current = { start: null, end: null };
            }
          } else {
            previousSelectionRef.current = { start: null, end: null };
          }

          if (activeEl && typeof activeEl.blur === 'function') {
            activeEl.blur();
          }
          playBeep();
          setIsOpen(true);
          setSelectedZone(null);
        }
        return;
      }

      // If Navigator is NOT OPEN, do nothing
      if (!isOpen) return;

      // Handle Escape to exit and restore previous focus
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        macAudio.playHover();
        setIsOpen(false);
        setSelectedZone(null);
        restorePreviousFocus();
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
  const renderPointingArrow = (direction: 'up' | 'down' | 'left' | 'right', arrowOffset?: string) => {
    const horizontalOffset = arrowOffset || '50%';
    switch (direction) {
      case 'down':
        return (
          <span
            style={{
              position: 'absolute',
              bottom: '-5px',
              left: horizontalOffset,
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
              left: horizontalOffset,
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

  // Helper: placement for Step 1 Zone tooltips (strictly per zone.id)
  const getZonePlacement = (zone: NavZone, rect: ElementRect): {
    style: React.CSSProperties;
    arrowDirection: 'up' | 'down' | 'left' | 'right';
  } => {
    const screenW = window.innerWidth;
    const screenH = window.innerHeight;

    // 1. BILL HEADER (Zone 1) -> Placed nicely right below header on left side
    if (zone.id === 1) {
      return {
        style: {
          position: 'absolute',
          top: `${rect.bottom + 8}px`,
          left: `${rect.left + 24}px`,
        },
        arrowDirection: 'up'
      };
    }

    // 2. ACTION RAIL (Zone 2) -> To the right of the rail, arrow pointing left
    if (zone.id === 2) {
      return {
        style: {
          position: 'absolute',
          top: `${Math.max(16, Math.min(rect.top + 20, screenH - 45))}px`,
          left: `${rect.right + 12}px`,
        },
        arrowDirection: 'left'
      };
    }

    // 3. RAW MATERIALS GRID (Zone 3) -> Top-left of table
    if (zone.id === 3) {
      return {
        style: {
          position: 'absolute',
          top: `${rect.top + 8}px`,
          left: `${rect.left + 16}px`,
        },
        arrowDirection: 'up'
      };
    }

    // 4. FINISHED MOULDS GRID (Zone 4) -> Top-left of table (inner side, safe from right edge)
    if (zone.id === 4) {
      return {
        style: {
          position: 'absolute',
          top: `${rect.top + 8}px`,
          left: `${rect.left + 16}px`,
        },
        arrowDirection: 'up'
      };
    }

    // 5. MODE & SLIP BAR (Zone 5) -> Above the bottom bar
    if (zone.id === 5) {
      return {
        style: {
          position: 'absolute',
          bottom: `${Math.max(12, screenH - rect.top + 8)}px`,
          left: `${rect.left + 24}px`,
        },
        arrowDirection: 'down'
      };
    }

    // 6. MODULE NAVIGATION (Zone 6) -> To the left of the rail, arrow pointing right
    if (zone.id === 6) {
      return {
        style: {
          position: 'absolute',
          top: `${Math.max(16, Math.min(rect.top + 20, screenH - 45))}px`,
          right: `${Math.max(10, screenW - rect.left + 12)}px`,
        },
        arrowDirection: 'right'
      };
    }

    // Fallback
    return {
      style: {
        position: 'absolute',
        top: `${rect.top + 8}px`,
        left: `${rect.left + 16}px`,
      },
      arrowDirection: 'up'
    };
  };

  // Helper: placement for Step 2 Target tooltips
  const getTargetPlacement = (rect: ElementRect, zoneId: number): {
    style: React.CSSProperties;
    arrowDirection: 'up' | 'down' | 'left' | 'right';
  } => {
    const screenW = window.innerWidth;
    const screenH = window.innerHeight;

    // 1. Action Rail targets (Zone 2) -> to the right of each button
    if (zoneId === 2) {
      return {
        style: {
          position: 'absolute',
          top: `${Math.max(6, Math.min(rect.top + (rect.height - 28) / 2, screenH - 35))}px`,
          left: `${rect.right + 10}px`,
        },
        arrowDirection: 'left'
      };
    }

    // 2. Module Rail targets (Zone 6) -> to the left of each tab button
    if (zoneId === 6) {
      return {
        style: {
          position: 'absolute',
          top: `${Math.max(6, Math.min(rect.top + (rect.height - 28) / 2, screenH - 35))}px`,
          right: `${Math.max(8, screenW - rect.left + 10)}px`,
        },
        arrowDirection: 'right'
      };
    }

    // 3. Bill Header targets (Zone 1) -> below each input
    if (zoneId === 1) {
      const centerX = rect.left + rect.width / 2;
      const safeLeft = Math.max(12, Math.min(centerX - 60, screenW - 170));
      return {
        style: {
          position: 'absolute',
          top: `${rect.bottom + 8}px`,
          left: `${safeLeft}px`,
        },
        arrowDirection: 'up'
      };
    }

    // 4. Mode Bar targets (Zone 5) -> above each button, compact number badge
    if (zoneId === 5) {
      return {
        style: {
          position: 'absolute',
          top: `${Math.max(6, rect.top - 32)}px`,
          left: `${rect.left + rect.width / 2}px`,
          transform: 'translateX(-50%)',
        },
        arrowDirection: 'down'
      };
    }

    // 5. Grid targets (Zones 3 & 4) -> above each table button/cell, compact number badge
    if (zoneId === 3 || zoneId === 4) {
      return {
        style: {
          position: 'absolute',
          top: `${Math.max(6, rect.top - 32)}px`,
          left: `${rect.left + rect.width / 2}px`,
          transform: 'translateX(-50%)',
        },
        arrowDirection: 'down'
      };
    }

    // Default for any other buttons/cells
    const centerX = rect.left + rect.width / 2;
    const safeLeft = Math.max(12, Math.min(centerX - 60, screenW - 170));
    return {
      style: {
        position: 'absolute',
        top: `${Math.max(10, rect.top - 34)}px`,
        left: `${safeLeft}px`,
      },
      arrowDirection: 'down'
    };
  };

  return (
    <>
      <style>{`
        @keyframes numpadLightGlow {
          0%, 100% {
            opacity: 0.85;
            filter: drop-shadow(0 0 6px currentColor);
          }
          50% {
            opacity: 1;
            filter: drop-shadow(0 0 14px currentColor);
          }
        }
      `}</style>

      {/* ----------------------------------------------------------------- */}
      {/* ACTIVE NUMPAD NAVIGATOR: GLOWING GROUP BORDERS + POINTING TOOLTIPS */}
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
          {/* STEP 1: GLOWING BORDER AROUND GROUPS + FLOATING POINTING TOOLTIPS */}
          {/* ----------------------------------------------------------------- */}
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

          {/* ----------------------------------------------------------------- */}
          {/* STEP 2: SIMULTANEOUS TARGET POINTING TOOLTIPS ONLY (NO BUTTON BORDERS) */}
          {/* ----------------------------------------------------------------- */}
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

              {/* Each Target Element: ONLY Floating Capsule Pointing Tooltip (NO button borders) */}
              {targetBadges.map(({ target, rect }) => {
                const isNumberOnly = selectedZone.id === 3 || selectedZone.id === 4 || selectedZone.id === 5;
                const placement = getTargetPlacement(rect, selectedZone.id);

                // COMPACT NUMBER-ONLY BADGE (for clustered table buttons & mode buttons)
                if (isNumberOnly) {
                  return (
                    <div
                      key={target.num}
                      onClick={(e) => {
                        e.stopPropagation();
                        executeTarget(target);
                      }}
                      title={target.label}
                      style={{
                        ...placement.style,
                        zIndex: 999999,
                        background: '#1c1c1e',
                        color: '#ffffff',
                        border: '1px solid rgba(255, 255, 255, 0.18)',
                        borderRadius: '9999px',
                        height: '26px',
                        minWidth: '26px',
                        padding: '0 6px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 6px 20px rgba(0, 0, 0, 0.75), 0 2px 6px rgba(0, 0, 0, 0.4)',
                        fontFamily: 'var(--font-sans, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif)',
                        userSelect: 'none',
                        lineHeight: '1',
                        cursor: 'pointer',
                        pointerEvents: 'auto',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <kbd
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: '#3f3f42',
                          color: '#f4f4f5',
                          padding: '2px 6px',
                          borderRadius: '9999px',
                          fontSize: '12px',
                          fontWeight: 700,
                          fontFamily: 'var(--font-sans, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif)',
                          lineHeight: '1',
                          border: 'none',
                          boxShadow: 'none',
                          userSelect: 'none',
                        }}
                      >
                        {target.num}
                      </kbd>
                      {renderPointingArrow(placement.arrowDirection)}
                    </div>
                  );
                }

                // FULL NAME + NUMBER BADGE (for wide inputs & vertical rails)
                return (
                  <div
                    key={target.num}
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
                );
              })}
            </>
          )}
        </div>
      )}
    </>
  );
};


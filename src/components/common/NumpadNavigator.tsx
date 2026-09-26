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
      { num: 4, label: 'Data Panel', selector: '[data-np-target="6-4"]', type: 'button' },
      { num: 5, label: 'Party Panel', selector: '[data-np-target="6-5"]', type: 'button' },
      { num: 6, label: 'Control Panel', selector: '[data-np-target="6-6"]', type: 'button' },
      { num: 7, label: 'Stock Inventory', selector: '[data-np-target="6-7"]', type: 'button' },
      { num: 8, label: 'Ledger', selector: '[data-np-target="6-8"]', type: 'button' },
      { num: 9, label: 'Settings', selector: '[data-np-target="6-9"]', type: 'button' }
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
      const isNumpadDel = e.code === 'NumpadDecimal' || e.key === '.';

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

  return (
    <>
      {/* ----------------------------------------------------------------- */}
      {/* ACTIVE NUMPAD NAVIGATOR: ONLY CLEAN BORDERS + CORNER PIN-POINT #  */}
      {/* ZERO TEXT OVERLAYS, ZERO BANNERS, BACKGROUND 100% UNTOUCHED       */}
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
          {/* STEP 1: ZONE OVERLAYS (Clean Border Around Groups + Corner #) */}
          {/* ------------------------------------------------------------- */}
          {!selectedZone && zoneBadges.map(({ zone, rect }) => {
            const isNearLeft = rect.left < 15;
            const isNearTop = rect.top < 20;

            return (
              <div
                key={zone.id}
                style={{
                  position: 'absolute',
                  top: `${rect.top}px`,
                  left: `${rect.left}px`,
                  width: `${rect.width}px`,
                  height: `${rect.height}px`,
                  border: `2px solid ${zone.color}`,
                  borderRadius: '8px',
                  background: 'transparent',
                  boxShadow: `0 0 14px ${zone.color}35`,
                  pointerEvents: 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                {/* Pin-Point Corner Badge pointing to the Zone */}
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    playBeep();
                    setSelectedZone(zone);
                  }}
                  style={{
                    position: 'absolute',
                    top: isNearTop ? '6px' : '-13px',
                    left: isNearLeft ? '6px' : '10px',
                    zIndex: 999999,
                    pointerEvents: 'auto',
                    cursor: 'pointer',
                    background: '#090d16',
                    border: `2px solid ${zone.color}`,
                    borderRadius: '6px',
                    padding: '1px 8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: `0 4px 14px rgba(0,0,0,0.9), 0 0 12px ${zone.color}70`
                  }}
                >
                  <span
                    style={{
                      color: zone.color,
                      fontSize: '13px',
                      fontWeight: 900,
                      fontFamily: 'monospace'
                    }}
                  >
                    {zone.id}
                  </span>
                </div>
              </div>
            );
          })}

          {/* ------------------------------------------------------------- */}
          {/* STEP 2: TARGET BADGES (Clean Border Around Button + Corner #) */}
          {/* ------------------------------------------------------------- */}
          {selectedZone && (
            <>
              {/* Highlight surrounding selected zone container with a clean outline */}
              {(() => {
                const zoneEl = document.querySelector(selectedZone.selector) as HTMLElement | null;
                if (!zoneEl) return null;
                const r = zoneEl.getBoundingClientRect();
                return (
                  <div
                    style={{
                      position: 'absolute',
                      top: `${r.top - 3}px`,
                      left: `${r.left - 3}px`,
                      width: `${r.width + 6}px`,
                      height: `${r.height + 6}px`,
                      border: `1.5px dashed ${selectedZone.color}80`,
                      borderRadius: '8px',
                      pointerEvents: 'none'
                    }}
                  />
                );
              })()}

              {/* Each Target Element: Crisp Border + Corner Pin-Point Number */}
              {targetBadges.map(({ target, rect }) => {
                const isNearLeft = rect.left < 15;
                const isNearTop = rect.top < 22;

                return (
                  <div
                    key={target.num}
                    style={{
                      position: 'absolute',
                      top: `${rect.top - 2}px`,
                      left: `${rect.left - 2}px`,
                      width: `${rect.width + 4}px`,
                      height: `${rect.height + 4}px`,
                      border: `2px solid ${selectedZone.color}`,
                      borderRadius: '6px',
                      background: 'transparent',
                      boxShadow: `0 0 12px ${selectedZone.color}45`,
                      pointerEvents: 'none',
                      transition: 'all 0.12s ease'
                    }}
                  >
                    {/* Pin-Point Corner Badge */}
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        executeTarget(target);
                      }}
                      style={{
                        position: 'absolute',
                        top: isNearTop ? '2px' : '-11px',
                        left: isNearLeft ? '2px' : '-6px',
                        zIndex: 999998,
                        pointerEvents: 'auto',
                        cursor: 'pointer',
                        background: '#090d16',
                        border: `1.5px solid ${selectedZone.color}`,
                        borderRadius: '5px',
                        minWidth: '20px',
                        height: '20px',
                        padding: '0 4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: `0 3px 10px rgba(0,0,0,0.9), 0 0 10px ${selectedZone.color}80`
                      }}
                    >
                      <span
                        style={{
                          color: selectedZone.color,
                          fontSize: '12px',
                          fontWeight: 900,
                          fontFamily: 'monospace',
                          lineHeight: '1'
                        }}
                      >
                        {target.num}
                      </span>
                    </div>
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

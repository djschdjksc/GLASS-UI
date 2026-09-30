import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import NotificationCard from "./NotificationCard";
import useSound from "../utils/useSound";
import type { BillRecord } from "../services/db/schema";
import "./LockScreenStack.css";

interface Props {
  bills: BillRecord[];
  selectedBillId: string;
  onSelectBill: (bill: BillRecord) => void;
  onDoubleClickBill?: (bill: BillRecord) => void;
}

// ─── Physics constants (tuned to match Apple iOS spring feel) ────────────────
const SWITCH_COOLDOWN  = 75;   // ms between advances
const MIN_SWIPE        = 26;   // px drag threshold
const CARD_H           = 72;   // card height + gap
const MAX_STACK        = 4;    // how many cards peek below the active card

// Spring physics: position(t+1) = pos + vel; vel = vel*damping + (target-pos)*stiffness
const SPRING_STIFFNESS = 0.22;  // "pull" force toward target (lower = softer)
const SPRING_DAMPING   = 0.76;  // velocity decay (lower = more bounce, higher = overdamped)

// ─── Main Component ──────────────────────────────────────────────────────────
export const LockScreenStack: React.FC<Props> = ({
  bills,
  selectedBillId,
  onSelectBill,
  onDoubleClickBill,
}) => {
  const { initAudio, playIPhoneClick, playSoftWhoosh } = useSound();

  const [activeIndex, setActiveIndex]   = useState(0);
  const activeIndexRef                  = useRef(0);   // always mirrors state
  const isInternalRef                   = useRef(false);

  const containerRef  = useRef<HTMLDivElement | null>(null);
  const cardRefs      = useRef<(HTMLDivElement | null)[]>([]);
  const lastSwitchRef = useRef(0);

  // Spring state — one spring for position
  const springPos = useRef(0);   // current animated position (fractional index)
  const springVel = useRef(0);   // current velocity
  const targetPos = useRef(0);   // where we want to go (integer index)

  // For entrance animation
  const isEnteredRef = useRef(false);

  // ── Keep activeIndexRef in sync ──────────────────────────────────────────
  useEffect(() => {
    activeIndexRef.current = activeIndex;
    targetPos.current      = activeIndex;
  }, [activeIndex]);

  // ── Reset when bills change (category / search) ──────────────────────────
  useEffect(() => {
    isInternalRef.current = true;
    isEnteredRef.current  = false;  // trigger entrance animation again
    setActiveIndex(0);
    targetPos.current = 0;
    springPos.current = 0;
    springVel.current = 0;
    setTimeout(() => { isInternalRef.current = false; }, 80);
  }, [bills]);

  // ── Sync from parent (arrow keys, etc.) ─────────────────────────────────
  useEffect(() => {
    if (!selectedBillId || bills.length === 0) return;
    if (isInternalRef.current) return;
    const found = bills.findIndex(b => b.id === selectedBillId);
    if (found >= 0) {
      setActiveIndex(found);
      targetPos.current = found;
    }
  }, [selectedBillId, bills]);

  /* ══════════════════════════════════════════════════════════════════════════
     APPLY STYLES
     Key insight (Apple behavior):
       • z-index is driven by INTEGER targetPos (not fractional spring position).
         This ensures the card we're MOVING TO always appears on top during transition.
       • Cards BELOW active (stack peek) go lower by 13px each + scale down
       • Cards ABOVE active scroll upward in a plain list
     ══════════════════════════════════════════════════════════════════════════ */
  const applyStyles = useCallback((pos: number) => {
    const container = containerRef.current;
    if (!container) return;
    const H = container.clientHeight;
    if (H < 80) return;

    // Active card sits at 72% of container height from top
    const activeY = Math.round(H * 0.72);

    // Integer target — used for z-index so the card we're going TO is always on top
    const intTarget = targetPos.current;

    cardRefs.current.forEach((card, i) => {
      if (!card) return;

      // Fractional rel for smooth position/scale (smooth spring interpolation)
      const rel        = i - pos;
      // Integer rel for z-index (based on where we're GOING, not where we are)
      const relForZ    = i - intTarget;

      let translateY: number;
      let scale:      number;
      let opacity:    number;
      let zIndex:     number;

      if (relForZ === 0) {
        // ── ACTIVE (destination) card: always highest z ──
        zIndex = 1000;
      } else if (relForZ > 0) {
        // ── STACK cards below active: next highest z ──
        zIndex = 1000 - Math.min(relForZ, MAX_STACK) * 8;
      } else {
        // ── LIST cards above active: lower z, decreasing upward ──
        zIndex = 900 + relForZ; // relForZ is negative, so 899, 898, ...
      }

      if (rel >= 0) {
        // BELOW or AT active — stacked
        const step   = Math.min(rel, MAX_STACK + 1);
        translateY   = activeY + step * 13;
        scale        = Math.max(0.80, 1 - step * 0.05);
        opacity      = step === 0 ? 1 : Math.max(0.50, 1 - step * 0.14);
      } else {
        // ABOVE active — normal upward list
        const up     = Math.abs(rel);
        translateY   = activeY - up * CARD_H;
        scale        = 1;
        opacity      = up <= 1 ? 1 : Math.max(0.30, 1 - (up - 1) * 0.20);
      }

      card.style.transform = `translate(-50%, ${translateY}px) scale(${scale})`;
      card.style.opacity   = String(Math.max(0, Math.min(1, opacity)));
      card.style.zIndex    = String(zIndex);
      card.style.filter    = 'none';
    });
  }, []);

  /* ══════════════════════════════════════════════════════════════════════════
     SPRING PHYSICS rAF LOOP
     — simulates Apple UISpringTimingParameters (damped spring)
     — smoother, more natural than LERP (no abrupt stop, gentle settle)
     ══════════════════════════════════════════════════════════════════════════ */
  useEffect(() => {
    let animId: number;
    const tick = () => {
      const target = targetPos.current;
      const diff   = target - springPos.current;

      springVel.current = springVel.current * SPRING_DAMPING + diff * SPRING_STIFFNESS;
      springPos.current += springVel.current;

      // Snap when close enough
      if (Math.abs(diff) < 0.0015 && Math.abs(springVel.current) < 0.0015) {
        springPos.current = target;
        springVel.current = 0;
      }

      applyStyles(springPos.current);
      animId = requestAnimationFrame(tick);
    };
    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [applyStyles]);

  /* ══════════════════════════════════════════════════════════════════════════
     ENTRANCE ANIMATION — Crawl up from bottom, staggered (Apple style)
     Cards start below the viewport and crawl up one by one
     ══════════════════════════════════════════════════════════════════════════ */
  useEffect(() => {
    if (isEnteredRef.current || bills.length === 0) return;
    const container = containerRef.current;
    if (!container || container.clientHeight < 80) return;

    isEnteredRef.current = true;

    // Temporarily set all cards to start from below the container
    cardRefs.current.forEach((card) => {
      if (card) {
        card.style.transition = 'none';
        card.style.opacity    = '0';
        card.style.transform  = `translate(-50%, ${container.clientHeight + 80}px) scale(0.9)`;
      }
    });

    // Stagger each card crawling up from bottom using CSS transition
    cardRefs.current.forEach((card, i) => {
      if (!card) return;
      const delay = i * 38 + 40; // stagger: 40ms base + 38ms per card
      setTimeout(() => {
        if (!card) return;
        card.style.transition = `transform 0.52s cubic-bezier(0.34, 1.28, 0.64, 1), opacity 0.35s ease-out`;
        card.style.opacity    = '1';
        // Let the spring system take over once transition is done
        setTimeout(() => {
          if (card) card.style.transition = 'none';
        }, 560);
      }, delay);
    });

    // Apply final spring positions after all cards have entered
    const totalDelay = bills.length * 38 + 600;
    setTimeout(() => applyStyles(springPos.current), totalDelay);
  });

  /* ══════════════════════════════════════════════════════════════════════════
     ADVANCE — instant target update, spring does the smooth motion
     ══════════════════════════════════════════════════════════════════════════ */
  const tryAdvance = useCallback((dir: number) => {
    const now = performance.now();
    if (now - lastSwitchRef.current < SWITCH_COOLDOWN) return false;

    const current = activeIndexRef.current;

    if (dir > 0 && current < bills.length - 1) {
      lastSwitchRef.current = now;
      playIPhoneClick();
      playSoftWhoosh();
      const next = current + 1;
      isInternalRef.current    = true;
      activeIndexRef.current   = next;
      setActiveIndex(next);
      targetPos.current        = next;
      if (bills[next]) onSelectBill(bills[next]);
      setTimeout(() => { isInternalRef.current = false; }, 100);
      return true;
    }
    if (dir < 0 && current > 0) {
      lastSwitchRef.current = now;
      playIPhoneClick();
      const prev = current - 1;
      isInternalRef.current   = true;
      activeIndexRef.current  = prev;
      setActiveIndex(prev);
      targetPos.current       = prev;
      if (bills[prev]) onSelectBill(bills[prev]);
      setTimeout(() => { isInternalRef.current = false; }, 100);
      return true;
    }
    return false;
  }, [bills, onSelectBill, playIPhoneClick, playSoftWhoosh]);

  // ── Mouse Wheel ──────────────────────────────────────────────────────────
  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    initAudio();
    if (Math.abs(e.deltaY) < 3) return;
    tryAdvance(e.deltaY > 0 ? 1 : -1);
  }, [initAudio, tryAdvance]);

  // ── Touch Swipe ──────────────────────────────────────────────────────────
  const touchRef = useRef({ startY: 0, active: false, consumed: false });

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    initAudio();
    touchRef.current = { startY: e.touches[0].clientY, active: true, consumed: false };
  }, [initAudio]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    const t = touchRef.current;
    if (!t.active || t.consumed) return;
    const dy = t.startY - e.touches[0].clientY;
    if (Math.abs(dy) >= MIN_SWIPE) {
      if (tryAdvance(dy > 0 ? 1 : -1)) t.consumed = true;
    }
  }, [tryAdvance]);

  const onTouchEnd = useCallback(() => {
    touchRef.current.active   = false;
    touchRef.current.consumed = false;
  }, []);

  // ── Mouse Drag ───────────────────────────────────────────────────────────
  const mouseRef = useRef({ down: false, startY: 0, consumed: false });

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    initAudio();
    mouseRef.current = { down: true, startY: e.clientY, consumed: false };
  }, [initAudio]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const m = mouseRef.current;
      if (!m.down || m.consumed) return;
      const dy = m.startY - e.clientY;
      if (Math.abs(dy) >= MIN_SWIPE) {
        if (tryAdvance(dy > 0 ? 1 : -1)) m.consumed = true;
      }
    };
    const onUp = () => { mouseRef.current.down = false; mouseRef.current.consumed = false; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [tryAdvance]);

  // ── Empty state ──────────────────────────────────────────────────────────
  if (bills.length === 0) {
    return (
      <div style={{ padding: '36px 16px', textAlign: 'center', color: '#64748b', fontSize: '11px' }}>
        No invoice records found
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="lock-screen-container"
      onWheel={onWheel}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onMouseDown={onMouseDown}
    >
      <div className="stack-wrap">
        <div className="stack">
          {bills.map((b, i) => (
            <div
              key={b.id || i}
              ref={el => { cardRefs.current[i] = el; }}
              className="card-wrapper"
            >
              <NotificationCard
                bill={b}
                isActive={i === activeIndex}
                timeText={b.date}
                onClick={e => {
                  e?.stopPropagation();
                  initAudio();
                  playIPhoneClick();
                  isInternalRef.current  = true;
                  activeIndexRef.current = i;
                  setActiveIndex(i);
                  targetPos.current      = i;
                  onSelectBill(b);
                  setTimeout(() => { isInternalRef.current = false; }, 100);
                }}
                onDoubleClick={() => { if (onDoubleClickBill) onDoubleClickBill(b); }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LockScreenStack;

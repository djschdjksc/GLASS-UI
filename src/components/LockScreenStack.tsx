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

// ─── Tuning ──────────────────────────────────────────────────────────────────
const COOLDOWN     = 35;    // ms between advances — very snappy
const MIN_SWIPE    = 22;    // px drag threshold
const CARD_H       = 70;    // card height + gap
const MAX_PEEK     = 4;     // cards visible in bottom stack
// Spring: stiffness↑ = faster, damping↑ = less bounce
const STIFFNESS    = 0.48;
const DAMPING      = 0.72;

// ─── Component ───────────────────────────────────────────────────────────────
export const LockScreenStack: React.FC<Props> = ({
  bills,
  selectedBillId,
  onSelectBill,
  onDoubleClickBill,
}) => {
  const { initAudio, playIPhoneClick, playSoftWhoosh } = useSound();

  const [activeIndex, setActiveIndex]   = useState(0);
  const activeIndexRef = useRef(0);
  const isInternalRef  = useRef(false);

  const containerRef   = useRef<HTMLDivElement | null>(null);
  const cardRefs       = useRef<(HTMLDivElement | null)[]>([]);
  const lastAdvance    = useRef(0);

  // Spring state
  const springPos = useRef(0);
  const springVel = useRef(0);
  const targetPos = useRef(0);

  // Entrance flag — per bills identity (not a ref that persists forever)
  const enteredBillsRef = useRef<BillRecord[] | null>(null);

  // ── sync active ref with state ─────────────────────────────────────────
  useEffect(() => {
    activeIndexRef.current = activeIndex;
    targetPos.current      = activeIndex;
  }, [activeIndex]);

  // ── reset on bills change ──────────────────────────────────────────────
  useEffect(() => {
    isInternalRef.current = true;
    enteredBillsRef.current = null; // allow entrance again for new list
    setActiveIndex(0);
    targetPos.current = 0;
    springPos.current = 0;
    springVel.current = 0;
    setTimeout(() => { isInternalRef.current = false; }, 80);
  }, [bills]);

  // ── sync from parent (arrow keys) ─────────────────────────────────────
  useEffect(() => {
    if (!selectedBillId || bills.length === 0) return;
    if (isInternalRef.current) return;
    const found = bills.findIndex(b => b.id === selectedBillId);
    if (found >= 0) {
      setActiveIndex(found);
      targetPos.current = found;
    }
  }, [selectedBillId, bills]);

  /* ════════════════════════════════════════════════════════════════════════
     STYLE ENGINE — drum-wheel layout
     • Slot-machine / drum-scroll feel: active card in centre, others fan out
     • rel > 0 = below active (peek stack going DOWN visually)
     • rel < 0 = above active (list going UP visually)
     • z-index locked to INTEGER target so new card always stays on top
     ════════════════════════════════════════════════════════════════════════ */
  const applyStyles = useCallback((pos: number) => {
    const el = containerRef.current;
    if (!el) return;
    const H = el.clientHeight;
    if (H < 80) return;

    // Active card anchor: 70% from top
    const anchorY  = Math.round(H * 0.70);
    const intTgt   = targetPos.current; // INTEGER — drives z-index

    cardRefs.current.forEach((card, i) => {
      if (!card) return;

      const rel    = i - pos;       // fractional — drives position/scale
      const relZ   = i - intTgt;    // integer — drives z-index (no flicker)

      // ── Z-index: destination card always on top ──
      let zIndex: number;
      if      (relZ === 0) zIndex = 1000;
      else if (relZ  >  0) zIndex = 1000 - Math.min(relZ, MAX_PEEK) * 9;
      else                 zIndex = 900  + relZ; // negative → 899, 898 …

      // ── Position / Scale / Opacity ──
      let ty: number, scale: number, opacity: number;

      if (rel >= 0) {
        // BELOW or AT active — bottom peek stack
        const s  = Math.min(rel, MAX_PEEK + 1);
        ty       = anchorY + s * 12;
        scale    = Math.max(0.78, 1 - s * 0.055);
        opacity  = s === 0 ? 1 : Math.max(0.40, 1 - s * 0.18);
      } else {
        // ABOVE active — upward list
        const up = Math.abs(rel);
        ty       = anchorY - up * CARD_H;
        scale    = 1;
        opacity  = up <= 1 ? 1 : Math.max(0.25, 1 - (up - 1) * 0.22);
      }

      card.style.transform = `translate(-50%, ${ty}px) scale(${scale})`;
      card.style.opacity   = String(Math.max(0, Math.min(1, opacity)));
      card.style.zIndex    = String(zIndex);
    });
  }, []);

  /* ════════════════════════════════════════════════════════════════════════
     SPRING rAF LOOP — runs once, never restarts
     High stiffness + moderate damping = fast & slightly bouncy (Apple feel)
     ════════════════════════════════════════════════════════════════════════ */
  useEffect(() => {
    let id: number;
    const tick = () => {
      const diff = targetPos.current - springPos.current;
      springVel.current  = springVel.current * DAMPING + diff * STIFFNESS;
      springPos.current += springVel.current;
      if (Math.abs(diff) < 0.001 && Math.abs(springVel.current) < 0.001) {
        springPos.current = targetPos.current;
        springVel.current = 0;
      }
      applyStyles(springPos.current);
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [applyStyles]); // stable — never re-creates

  /* ════════════════════════════════════════════════════════════════════════
     ENTRANCE ANIMATION — staggered crawl-up, runs ONCE per bills array
     Cards crawl up from below with spring cascade (gol gol feel)
     ════════════════════════════════════════════════════════════════════════ */
  useEffect(() => {
    // Guard: only run once per bills identity
    if (enteredBillsRef.current === bills) return;
    if (bills.length === 0) return;
    const el = containerRef.current;
    if (!el) return;

    enteredBillsRef.current = bills;

    const H = el.clientHeight || 500;

    // 1. Snap all cards off-screen below (no transition)
    cardRefs.current.forEach(card => {
      if (!card) return;
      card.style.transition = 'none';
      card.style.transform  = `translate(-50%, ${H + 100}px) scale(0.88)`;
      card.style.opacity    = '0';
    });

    // 2. Stagger crawl-up with CSS spring transition (first appearance only)
    //    After transition completes the rAF loop takes over seamlessly
    const handles: ReturnType<typeof setTimeout>[] = [];
    cardRefs.current.forEach((card, i) => {
      if (!card) return;
      const h = setTimeout(() => {
        if (!card) return;
        card.style.transition = 'transform 0.46s cubic-bezier(0.34, 1.3, 0.64, 1), opacity 0.32s ease-out';
        card.style.opacity    = '1';
        // Hand off to spring loop after transition
        const h2 = setTimeout(() => {
          if (card) card.style.transition = 'none';
        }, 480);
        handles.push(h2);
      }, i * 32 + 30);
      handles.push(h);
    });

    return () => handles.forEach(clearTimeout);
  }, [bills]); // runs whenever bills identity changes

  /* ════════════════════════════════════════════════════════════════════════
     ADVANCE — instant target snap, spring does the visual work
     ════════════════════════════════════════════════════════════════════════ */
  const tryAdvance = useCallback((dir: number) => {
    const now = performance.now();
    if (now - lastAdvance.current < COOLDOWN) return false;
    const cur = activeIndexRef.current;

    if (dir > 0 && cur < bills.length - 1) {
      lastAdvance.current    = now;
      playIPhoneClick();
      playSoftWhoosh();
      const next = cur + 1;
      isInternalRef.current  = true;
      activeIndexRef.current = next;
      setActiveIndex(next);
      targetPos.current      = next;
      if (bills[next]) onSelectBill(bills[next]);
      setTimeout(() => { isInternalRef.current = false; }, 90);
      return true;
    }
    if (dir < 0 && cur > 0) {
      lastAdvance.current    = now;
      playIPhoneClick();
      const prev = cur - 1;
      isInternalRef.current  = true;
      activeIndexRef.current = prev;
      setActiveIndex(prev);
      targetPos.current      = prev;
      if (bills[prev]) onSelectBill(bills[prev]);
      setTimeout(() => { isInternalRef.current = false; }, 90);
      return true;
    }
    return false;
  }, [bills, onSelectBill, playIPhoneClick, playSoftWhoosh]);

  // ── Mouse Wheel ──────────────────────────────────────────────────────────
  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    initAudio();
    if (Math.abs(e.deltaY) < 2) return;
    tryAdvance(e.deltaY > 0 ? 1 : -1);
  }, [initAudio, tryAdvance]);

  // ── Touch ────────────────────────────────────────────────────────────────
  const touchRef = useRef({ startY: 0, active: false, consumed: false });

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    initAudio();
    touchRef.current = { startY: e.touches[0].clientY, active: true, consumed: false };
  }, [initAudio]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    const t = touchRef.current;
    if (!t.active || t.consumed) return;
    const dy = t.startY - e.touches[0].clientY;
    if (Math.abs(dy) >= MIN_SWIPE && tryAdvance(dy > 0 ? 1 : -1)) t.consumed = true;
  }, [tryAdvance]);

  const onTouchEnd = useCallback(() => {
    touchRef.current.active = false; touchRef.current.consumed = false;
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
      if (Math.abs(m.startY - e.clientY) >= MIN_SWIPE) {
        if (tryAdvance(m.startY - e.clientY > 0 ? 1 : -1)) m.consumed = true;
      }
    };
    const onUp = () => { mouseRef.current.down = false; mouseRef.current.consumed = false; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [tryAdvance]);

  // ── Empty ────────────────────────────────────────────────────────────────
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
                  setTimeout(() => { isInternalRef.current = false; }, 90);
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

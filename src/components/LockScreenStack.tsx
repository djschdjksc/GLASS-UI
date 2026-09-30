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

// ─── Ultra Fast & Smooth Configuration ────────────────────────────────────
const COOLDOWN        = 18;    // ms debounce — super fast response on wheel/keys
const MIN_SWIPE       = 18;    // px drag threshold
const CARD_HEIGHT     = 72;    // visible card height + gap
const VISIBLE_COUNT   = 8;     // Cards visible in view
const STACK_PEEK      = 12;    // px peek for folded stack edges
const LERP_FACTOR     = 0.35;  // Fast and responsive smooth glide (Apple feel)

export const LockScreenStack: React.FC<Props> = ({
  bills,
  selectedBillId,
  onSelectBill,
  onDoubleClickBill,
}) => {
  const { initAudio, playIPhoneClick, playSoftWhoosh } = useSound();

  const [activeIndex, setActiveIndex] = useState(0);
  const activeIndexRef = useRef(0);
  const isInternalRef  = useRef(false);

  const containerRef   = useRef<HTMLDivElement | null>(null);
  const cardRefs       = useRef<(HTMLDivElement | null)[]>([]);
  const lastAdvance    = useRef(0);

  // Position tracking (fractional for ultra-smooth 60fps crawl)
  const currentPos = useRef(0);
  const targetPos  = useRef(0);

  // Sync activeIndexRef with state
  useEffect(() => {
    activeIndexRef.current = activeIndex;
    targetPos.current      = activeIndex;
  }, [activeIndex]);

  // Apply immediately on mount & when bills change (prevents black empty state on initial tab open)
  useEffect(() => {
    isInternalRef.current = true;
    setActiveIndex(0);
    targetPos.current  = 0;
    currentPos.current = 0;

    // Run applyStyles on next frame so layout has dimensions immediately
    const frameId = requestAnimationFrame(() => {
      applyStyles(0);
    });
    const timer = setTimeout(() => { isInternalRef.current = false; }, 50);

    return () => {
      cancelAnimationFrame(frameId);
      clearTimeout(timer);
    };
  }, [bills]);

  // External sync (Arrow keys from parent, search auto-select)
  useEffect(() => {
    if (!selectedBillId || bills.length === 0 || isInternalRef.current) return;
    const found = bills.findIndex(b => b.id === selectedBillId);
    if (found >= 0) {
      setActiveIndex(found);
      targetPos.current = found;
    }
  }, [selectedBillId, bills]);

  /* ════════════════════════════════════════════════════════════════════════
     APPLY STYLES ENGINE — 8+ Cards Visible & Rol/Fold Drum Effect
     • Bottom fold cards gracefully fade & roll just like the top roll
     • Integer target drives Z-Index so cards never slip behind during scroll
     ════════════════════════════════════════════════════════════════════════ */
  const applyStyles = useCallback((pos: number) => {
    const el = containerRef.current;
    if (!el) return;
    const H = el.clientHeight || 520;
    if (H < 40) return;

    // Lift active card up so bottom fold roll stays inside container view
    const baseActiveY = Math.max(46, Math.round(H * 0.10));
    const intTarget = targetPos.current;

    // How many cards can fully fit vertically before folding at the bottom
    const availableHeight = H - baseActiveY - 110; 
    const dynamicVisible = Math.max(3, Math.min(VISIBLE_COUNT, Math.floor(availableHeight / CARD_HEIGHT)));

    cardRefs.current.forEach((card, i) => {
      if (!card) return;

      const rel = i - pos; // fractional offset from active position
      const relTarget = i - intTarget;

      // ── Z-INDEX: Active and nearby cards stay on top cleanly ──
      const zIndex = Math.max(1, 1000 - Math.abs(relTarget) * 10);

      let ty = 0;
      let scale = 1;
      let opacity = 1;

      if (rel >= 0 && rel < dynamicVisible) {
        // CARDS IN FORWARD VIEW (Active + next cards down)
        ty = baseActiveY + rel * CARD_HEIGHT;
        scale = Math.max(0.88, 1 - (rel * 0.016));
        opacity = rel === 0 ? 1 : Math.max(0.45, 1 - (rel * 0.08));
      } else if (rel >= dynamicVisible) {
        // BOTTOM OVERFLOW: Fold into a visible deck stack that fades into background (like top)
        const overflow = rel - dynamicVisible;
        const foldStep = Math.min(overflow, 4);
        const bottomBaseY = baseActiveY + (dynamicVisible * CARD_HEIGHT);
        ty = bottomBaseY + (foldStep * STACK_PEEK);
        scale = Math.max(0.78, 0.88 - (foldStep * 0.035));
        // Soft gradient fade matching top fold behavior
        opacity = Math.max(0, 0.55 - (overflow * 0.22));
      } else if (rel < 0 && rel >= -4) {
        // TOP OVERFLOW: Fold upwards gracefully with soft fade
        const upRel = Math.abs(rel);
        ty = baseActiveY - (upRel * STACK_PEEK * 1.8);
        scale = Math.max(0.82, 1 - (upRel * 0.04));
        opacity = Math.max(0.10, 0.80 - (upRel * 0.22));
      } else {
        // Deeply folded off-screen cards
        const deepUp = Math.abs(rel);
        ty = baseActiveY - (4 * STACK_PEEK * 1.8) - (deepUp * 4);
        scale = 0.78;
        opacity = 0;
      }

      card.style.transform = `translate3d(-50%, ${ty}px, 0) scale(${scale})`;
      card.style.opacity   = String(Math.max(0, Math.min(1, opacity)));
      card.style.zIndex    = String(zIndex);
    });
  }, []);

  /* ════════════════════════════════════════════════════════════════════════
     60FPS SMOOTH rAF LOOP (DAMPED LERP — Zero Oscillation / Zero Shake)
     ════════════════════════════════════════════════════════════════════════ */
  useEffect(() => {
    let animId: number;
    const tick = () => {
      const diff = targetPos.current - currentPos.current;

      if (Math.abs(diff) > 0.001) {
        currentPos.current += diff * LERP_FACTOR;
        applyStyles(currentPos.current);
      } else if (currentPos.current !== targetPos.current) {
        currentPos.current = targetPos.current;
        applyStyles(currentPos.current);
      }

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [applyStyles]);

  /* ════════════════════════════════════════════════════════════════════════
     ADVANCE CARD (Smooth Stepping with Audio Feedback)
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
      setTimeout(() => { isInternalRef.current = false; }, 80);
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
      setTimeout(() => { isInternalRef.current = false; }, 80);
      return true;
    }
    return false;
  }, [bills, onSelectBill, playIPhoneClick, playSoftWhoosh]);

  // ── MOUSE WHEEL CRAWL ──
  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    initAudio();
    if (Math.abs(e.deltaY) < 3) return;
    tryAdvance(e.deltaY > 0 ? 1 : -1);
  }, [initAudio, tryAdvance]);

  // ── TOUCH SWIPE GESTURE ──
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
    touchRef.current.active = false;
    touchRef.current.consumed = false;
  }, []);

  // ── MOUSE DRAG GESTURE ──
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
      if (Math.abs(dy) >= MIN_SWIPE && tryAdvance(dy > 0 ? 1 : -1)) m.consumed = true;
    };
    const onUp = () => {
      mouseRef.current.down = false;
      mouseRef.current.consumed = false;
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [tryAdvance]);

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
                  setTimeout(() => { isInternalRef.current = false; }, 80);
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

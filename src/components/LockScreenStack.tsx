import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import NotificationCard from "./NotificationCard";
import useSound from "../utils/useSound";
import { macAudio } from "../utils/macAudio";
import type { BillRecord } from "../services/db/schema";
import "./LockScreenStack.css";

interface Props {
  bills: BillRecord[];
  selectedBillId: string;
  onSelectBill: (bill: BillRecord) => void;
  onDoubleClickBill?: (bill: BillRecord) => void;
}

const SWITCH_COOLDOWN = 80;        // ms — fast response
const MAX_VISIBLE = 5;             // max cards in bottom stack
const MIN_SWIPE_DISTANCE = 28;     // px drag threshold
const LERP = 0.28;                 // smooth spring
const CARD_HEIGHT = 74;            // card height + gap in px

export const LockScreenStack: React.FC<Props> = ({
  bills,
  selectedBillId,
  onSelectBill,
  onDoubleClickBill,
}) => {
  const { initAudio, playIPhoneClick, playSoftWhoosh } = useSound();

  const [activeIndex, setActiveIndex] = useState(0);
  // Ref always mirrors activeIndex — FIXES STALE CLOSURE BUG in tryAdvance
  const activeIndexRef = useRef(0);
  // Flag: true when change originated inside this component (prevents sync loop)
  const isInternalChangeRef = useRef(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const targetRef = useRef(0);
  const animActiveRef = useRef(0);
  const lastSwitchRef = useRef(0);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Keep activeIndexRef always in sync with state
  useEffect(() => {
    activeIndexRef.current = activeIndex;
    targetRef.current = activeIndex;
  }, [activeIndex]);

  // Reset to top whenever bills list changes (category/search change)
  useEffect(() => {
    isInternalChangeRef.current = true;
    setActiveIndex(0);
    targetRef.current = 0;
    animActiveRef.current = 0;
    setTimeout(() => { isInternalChangeRef.current = false; }, 60);
  }, [bills]);

  // Sync with selectedBillId from OUTSIDE (e.g. parent arrow key navigation)
  // Skip if we caused the change ourselves (prevents animation fight/flicker)
  useEffect(() => {
    if (!selectedBillId || bills.length === 0) return;
    if (isInternalChangeRef.current) return;
    const found = bills.findIndex((b) => b.id === selectedBillId);
    if (found >= 0) {
      setActiveIndex(found);
      targetRef.current = found;
    }
  }, [selectedBillId, bills]);

  /* ============================================================
     APPLY STYLES — iPhone Bottom Stack Physics
     - Active card sits at baseBottom
     - Cards below: stacked & scaled down (bottom stack)
     - Cards above: flowing upward in normal list
     ============================================================ */
  const applyStyles = useCallback((aIndex: number) => {
    const container = containerRef.current;
    const containerH = container ? container.clientHeight : 0;
    // Don't apply if not yet laid out
    if (containerH < 80) return;
    const baseBottom = Math.max(80, containerH - 160);

    cardRefs.current.forEach((card, i) => {
      if (!card) return;
      const rel = i - aIndex;

      let translateY = 0;
      let scale = 1;
      let opacity = 1;
      let z = 100 - i;

      if (rel === 0) {
        // ACTIVE CARD — full size, at baseBottom
        translateY = baseBottom;
        scale = 1;
        opacity = 1;
        z = 1000;
      } else if (rel > 0) {
        // BELOW ACTIVE — bottom stack (scaled down, visible)
        const step = Math.min(rel, MAX_VISIBLE);
        translateY = baseBottom + step * 14;
        scale = Math.max(0.82, 1 - step * 0.048);
        opacity = Math.max(0.55, 1 - step * 0.15);
        z = 1000 - Math.round(step * 10);
      } else {
        // ABOVE ACTIVE — normal upward list
        const up = Math.abs(rel);
        translateY = baseBottom - up * CARD_HEIGHT;
        scale = 1;
        opacity = up <= 2 ? 1 : Math.max(0.35, 1 - (up - 2) * 0.22);
        z = 900 - up;
      }

      card.style.transform = `translate(-50%, ${translateY}px) scale(${scale})`;
      card.style.opacity = String(opacity);
      card.style.zIndex = String(z);
      card.style.filter = 'none'; // ZERO BLUR always
    });
  }, []);

  /* 60fps rAF Animation Loop — LERP interpolation */
  useEffect(() => {
    let animId: number;
    const tick = () => {
      const diff = targetRef.current - animActiveRef.current;
      if (Math.abs(diff) > 0.008) {
        animActiveRef.current += diff * LERP;
        applyStyles(animActiveRef.current);
      } else if (diff !== 0) {
        animActiveRef.current = targetRef.current;
        applyStyles(animActiveRef.current);
      }
      animId = requestAnimationFrame(tick);
    };
    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [applyStyles]); // NO bills.length dep — avoids rAF restart flicker

  /* Initial layout apply after first render */
  useEffect(() => {
    const timer = setTimeout(() => applyStyles(0), 60);
    return () => clearTimeout(timer);
  }, [applyStyles]);

  /* ============================================================
     ADVANCE — reads from REF (not state) — fixes stale closure bug
     ============================================================ */
  const tryAdvance = useCallback(
    (dir: number) => {
      const now = performance.now();
      if (now - lastSwitchRef.current < SWITCH_COOLDOWN) return false;
      const current = activeIndexRef.current; // REF — never stale!

      if (dir > 0 && current < bills.length - 1) {
        lastSwitchRef.current = now;
        playIPhoneClick();
        playSoftWhoosh();
        const nextIdx = current + 1;
        isInternalChangeRef.current = true;
        activeIndexRef.current = nextIdx; // Update ref immediately before setState
        setActiveIndex(nextIdx);
        targetRef.current = nextIdx;
        if (bills[nextIdx]) onSelectBill(bills[nextIdx]);
        setTimeout(() => { isInternalChangeRef.current = false; }, 80);
        return true;
      }
      if (dir < 0 && current > 0) {
        lastSwitchRef.current = now;
        playIPhoneClick();
        const prevIdx = current - 1;
        isInternalChangeRef.current = true;
        activeIndexRef.current = prevIdx;
        setActiveIndex(prevIdx);
        targetRef.current = prevIdx;
        if (bills[prevIdx]) onSelectBill(bills[prevIdx]);
        setTimeout(() => { isInternalChangeRef.current = false; }, 80);
        return true;
      }
      return false;
    },
    [bills, onSelectBill, playIPhoneClick, playSoftWhoosh]
    // NOTE: activeIndex NOT in deps — we use activeIndexRef instead
  );

  /* MOUSE WHEEL */
  const onWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      initAudio();
      if (Math.abs(e.deltaY) < 3) return;
      tryAdvance(e.deltaY > 0 ? 1 : -1);
    },
    [initAudio, tryAdvance]
  );

  /* TOUCH SWIPE */
  const touchState = useRef({ startY: 0, active: false, consumed: false });

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      initAudio();
      touchState.current.startY = e.touches[0].clientY;
      touchState.current.active = true;
      touchState.current.consumed = false;
    },
    [initAudio]
  );

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      const s = touchState.current;
      if (!s.active || s.consumed) return;
      const dy = s.startY - e.touches[0].clientY;
      if (Math.abs(dy) >= MIN_SWIPE_DISTANCE) {
        if (tryAdvance(dy > 0 ? 1 : -1)) s.consumed = true;
      }
    },
    [tryAdvance]
  );

  const onTouchEnd = useCallback(() => {
    touchState.current.active = false;
    touchState.current.consumed = false;
  }, []);

  /* MOUSE DRAG — only for drag gesture, does NOT interfere with card clicks */
  const mouseState = useRef({ down: false, startY: 0, consumed: false });

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      initAudio();
      mouseState.current.down = true;
      mouseState.current.startY = e.clientY;
      mouseState.current.consumed = false;
    },
    [initAudio]
  );

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const m = mouseState.current;
      if (!m.down || m.consumed) return;
      const dy = m.startY - e.clientY;
      if (Math.abs(dy) >= MIN_SWIPE_DISTANCE) {
        if (tryAdvance(dy > 0 ? 1 : -1)) m.consumed = true;
      }
    };
    const onUp = () => {
      mouseState.current.down = false;
      mouseState.current.consumed = false;
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
              ref={(el) => { cardRefs.current[i] = el; }}
              className="card-wrapper"
            >
              <NotificationCard
                bill={b}
                isActive={i === activeIndex}
                timeText={b.date}
                onClick={(e) => {
                  e?.stopPropagation(); // prevent drag conflict
                  initAudio();
                  playIPhoneClick();
                  isInternalChangeRef.current = true;
                  activeIndexRef.current = i;
                  setActiveIndex(i);
                  targetRef.current = i;
                  onSelectBill(b);
                  setTimeout(() => { isInternalChangeRef.current = false; }, 80);
                }}
                onDoubleClick={() => {
                  if (onDoubleClickBill) onDoubleClickBill(b);
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LockScreenStack;

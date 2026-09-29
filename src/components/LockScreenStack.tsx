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

const SWITCH_COOLDOWN = 85;       // ms — fast and snappy wheel response
const MAX_VISIBLE = 4;            // number of cards in bottom stack
const MIN_SWIPE_DISTANCE = 20;    // px drag threshold
const LERP = 0.35;                // smooth & fast spring interpolation
const CARD_HEIGHT = 74;           // card height + gap

export const LockScreenStack: React.FC<Props> = ({
  bills,
  selectedBillId,
  onSelectBill,
  onDoubleClickBill,
}) => {
  const { initAudio, playIPhoneClick, playSoftWhoosh } = useSound();

  const [activeIndex, setActiveIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const targetRef = useRef(0);
  const activeRef = useRef(0);
  const lastSwitchRef = useRef(0);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Reset to top whenever search results or category bills change
  useEffect(() => {
    setActiveIndex(0);
    targetRef.current = 0;
    activeRef.current = 0;
  }, [bills]);

  // Sync with selectedBillId from outside
  useEffect(() => {
    if (!selectedBillId || bills.length === 0) return;
    const found = bills.findIndex((b) => b.id === selectedBillId);
    if (found >= 0 && found !== activeIndex) {
      setActiveIndex(found);
      targetRef.current = found;
    }
  }, [selectedBillId, bills]);

  useEffect(() => {
    targetRef.current = activeIndex;
  }, [activeIndex]);

  /* ============================================================
     APPLY STYLES — Bottom Stack Physics
     - Bottom stack is lifted up with open space at bottom
     - Cards above stay in list (do not vanish)
     - Cards below stack right in view
     - 100% solid cards with zero transparency bleed
     ============================================================ */
  const applyStyles = useCallback((aIndex: number) => {
    const container = containerRef.current;
    const containerH = container ? container.clientHeight : 520;
    // Lift the bottom stack up so there is clear empty breathing space below it!
    const baseBottom = Math.max(90, containerH - 170);

    cardRefs.current.forEach((card, i) => {
      if (!card) return;
      const rel = i - aIndex;

      let translateY = 0;
      let scale = 1;
      let opacity = 1;
      let z = 100 - i;

      if (rel === 0) {
        // ACTIVE CARD
        translateY = baseBottom;
        scale = 1;
        opacity = 1;
        z = 1000;
      } else if (rel > 0) {
        // CARDS IN BOTTOM STACK — Lifted above bottom edge with clear space below!
        const step = Math.min(rel, MAX_VISIBLE);
        translateY = baseBottom + step * 16;
        scale = Math.max(0.85, 1 - step * 0.046);
        opacity = 1; // 100% solid opaque, no see-through!
        z = 1000 - Math.round(step * 10);
      } else {
        // CARDS ABOVE — Normal vertical flow upwards (DO NOT VANISH!)
        const up = Math.abs(rel);
        translateY = baseBottom - up * CARD_HEIGHT;
        scale = 1;
        opacity = Math.max(0.4, 1 - (up - 3) * 0.25);
        z = 1000 - up;
      }

      card.style.transform = `translate(-50%, ${translateY}px) scale(${scale})`;
      card.style.opacity = String(opacity);
      card.style.zIndex = String(z);
      card.style.filter = "none"; // ZERO BLUR
    });
  }, []);

  /* Fast 60fps Animation Loop */
  useEffect(() => {
    let animId: number;
    const tick = () => {
      const diff = targetRef.current - activeRef.current;
      if (Math.abs(diff) > 0.001) {
        activeRef.current += diff * LERP;
        applyStyles(activeRef.current);
      } else if (Math.abs(diff) > 0) {
        activeRef.current = targetRef.current;
        applyStyles(activeRef.current);
      }
      animId = requestAnimationFrame(tick);
    };
    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [bills.length, applyStyles]);

  /* Initial apply */
  useEffect(() => {
    applyStyles(0);
  }, [applyStyles]);

  /* ============================================================
     ADVANCE — Snappy response with iPhone Haptic Sound
     ============================================================ */
  const tryAdvance = useCallback(
    (dir: number) => {
      const now = performance.now();
      if (now - lastSwitchRef.current < SWITCH_COOLDOWN) return false;

      if (dir > 0 && activeIndex < bills.length - 1) {
        lastSwitchRef.current = now;
        playIPhoneClick();
        playSoftWhoosh();
        const nextIdx = activeIndex + 1;
        setActiveIndex(nextIdx);
        if (bills[nextIdx]) onSelectBill(bills[nextIdx]);
        return true;
      }
      if (dir < 0 && activeIndex > 0) {
        lastSwitchRef.current = now;
        playIPhoneClick();
        const prevIdx = activeIndex - 1;
        setActiveIndex(prevIdx);
        if (bills[prevIdx]) onSelectBill(bills[prevIdx]);
        return true;
      }
      return false;
    },
    [activeIndex, bills, onSelectBill, playIPhoneClick, playSoftWhoosh]
  );

  /* MOUSE WHEEL CRAWL */
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

  /* MOUSE DRAG */
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
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [tryAdvance]);

  if (bills.length === 0) {
    return (
      <div style={{ padding: "36px 16px", textAlign: "center", color: "#64748b", fontSize: "11px" }}>
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
              ref={(el) => {
                cardRefs.current[i] = el;
              }}
              className="card-wrapper"
              onMouseEnter={() => {
                // Immediately select and update right tables on hover!
                macAudio.playHover();
                onSelectBill(b);
              }}
            >
              <NotificationCard
                bill={b}
                isActive={i === activeIndex}
                timeText={i === 0 ? "now" : b.date}
                onClick={() => {
                  initAudio();
                  playIPhoneClick();
                  setActiveIndex(i);
                  onSelectBill(b);
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

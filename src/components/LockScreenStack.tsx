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

// ─── Physics & Layout ────────────────────────────────────────────────────────
const COOLDOWN   = 32;    // ms between advances
const MIN_SWIPE  = 20;    // px drag threshold
const STIFFNESS  = 0.52;  // spring pull force — higher = faster
const DAMPING    = 0.68;  // velocity decay — lower = more bounce (Apple-like)
const PEEK       = 18;    // px each card peeks out from behind the one in front
const MAX_SHOW   = 3;     // visible cards on each side of active
const CARD_H_EST = 70;    // estimated card height for off-screen calc

// ─── Component ───────────────────────────────────────────────────────────────
export const LockScreenStack: React.FC<Props> = ({
  bills,
  selectedBillId,
  onSelectBill,
  onDoubleClickBill,
}) => {
  const { initAudio, playIPhoneClick, playSoftWhoosh } = useSound();

  const [activeIndex, setActiveIndex] = useState(0);
  const activeIndexRef  = useRef(0);
  const isInternalRef   = useRef(false);
  const containerRef    = useRef<HTMLDivElement | null>(null);
  const cardRefs        = useRef<(HTMLDivElement | null)[]>([]);
  const lastAdvance     = useRef(0);

  // Spring state (single scroll axis)
  const springPos = useRef(0);
  const springVel = useRef(0);
  const targetPos = useRef(0);

  // Entrance tracking — one-shot per bills identity
  const enteredRef   = useRef<BillRecord[] | null>(null);
  const isEnteringRef = useRef(false); // true while CSS opacity is handling entrance

  // ── Sync active ref ────────────────────────────────────────────────────
  useEffect(() => {
    activeIndexRef.current = activeIndex;
    targetPos.current      = activeIndex;
  }, [activeIndex]);

  // ── Reset on bills change ──────────────────────────────────────────────
  useEffect(() => {
    isInternalRef.current = true;
    enteredRef.current    = null;
    setActiveIndex(0);
    targetPos.current = 0;
    springPos.current = 0;
    springVel.current = 0;
    setTimeout(() => { isInternalRef.current = false; }, 80);
  }, [bills]);

  // ── Sync from parent (arrow keys, external select) ─────────────────────
  useEffect(() => {
    if (!selectedBillId || bills.length === 0 || isInternalRef.current) return;
    const found = bills.findIndex(b => b.id === selectedBillId);
    if (found >= 0) {
      setActiveIndex(found);
      targetPos.current = found;
    }
  }, [selectedBillId, bills]);

  /* ════════════════════════════════════════════════════════════════════════
     STYLE ENGINE — Symmetric drum-wheel fan
     ─────────────────────────────────────────────────────────────────────
     Layout principle (like a physical card holder):
       • Active card is front-and-center
       • Each card above/below peeks PEEK px from behind the card in front
       • Same PEEK distance in BOTH directions → identical feel up and down
       • Z-index driven by INTEGER target (not lerp) so transitions never
         push new card behind old card
     ════════════════════════════════════════════════════════════════════════ */
  const applyStyles = useCallback((pos: number) => {
    const el = containerRef.current;
    if (!el) return;
    const H = el.clientHeight;
    if (H < 80) return;

    // Active card top-edge sits at 45% of container height
    const anchorY = Math.round(H * 0.45 - CARD_H_EST / 2);
    const intTgt  = targetPos.current; // integer — drives z-index

    cardRefs.current.forEach((card, i) => {
      if (!card) return;

      const rel    = i - pos;       // fractional (spring position) → visual placement
      const absRel = Math.abs(rel);
      const relZ   = i - intTgt;    // integer → z-index (never flickers during transition)
      const absRelZ = Math.abs(relZ);

      // ── Z-index: card closest to target index = frontmost ──
      // Destination card always gets z=1000, others fall back linearly
      const zIndex = Math.max(2, 1000 - Math.round(absRelZ * 12));

      // ── Position & Scale ──
      let ty: number, scale: number, opacity: number;

      if (absRel <= MAX_SHOW) {
        // VISIBLE RANGE — symmetric drum fan
        // rel is signed: negative = above active, positive = below active
        ty      = anchorY + rel * PEEK;
        scale   = Math.max(0.80, 1 - absRel * 0.055);
        opacity = Math.max(0.30, 1 - absRel * 0.23);
      } else {
        // BEYOND FAN — off-screen, invisible
        // Continue linearly so spring has a smooth path to animate through
        ty      = anchorY + rel * PEEK;
        scale   = Math.max(0.70, 0.80 - (absRel - MAX_SHOW) * 0.04);
        opacity = 0;
      }

      card.style.transform = `translate(-50%, ${ty}px) scale(${scale})`;
      card.style.zIndex    = String(zIndex);

      // Only overwrite opacity when NOT in the CSS entrance phase
      // (CSS handles opacity during entrance to avoid transition vs spring fight)
      if (!isEnteringRef.current) {
        card.style.opacity = String(Math.max(0, Math.min(1, opacity)));
      }
    });
  }, []);

  /* ════════════════════════════════════════════════════════════════════════
     SPRING rAF LOOP — single loop, never restarts
     Apple-tuned: STIFFNESS=0.52, DAMPING=0.68 → fast with slight bounce
     ════════════════════════════════════════════════════════════════════════ */
  useEffect(() => {
    let id: number;
    const tick = () => {
      const diff = targetPos.current - springPos.current;
      springVel.current  = springVel.current * DAMPING + diff * STIFFNESS;
      springPos.current += springVel.current;

      // Snap to rest when close
      if (Math.abs(diff) < 0.0008 && Math.abs(springVel.current) < 0.0008) {
        springPos.current = targetPos.current;
        springVel.current = 0;
      }

      applyStyles(springPos.current);
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [applyStyles]); // stable ref, never re-creates

  /* ════════════════════════════════════════════════════════════════════════
     ENTRANCE — staggered opacity-only crawl (no transform conflict)
     CSS transition handles opacity. Spring handles transform from frame 1.
     These are completely independent properties → ZERO shake/conflict.
     ════════════════════════════════════════════════════════════════════════ */
  useEffect(() => {
    if (enteredRef.current === bills || bills.length === 0) return;
    const el = containerRef.current;
    if (!el) return;

    enteredRef.current  = bills;
    isEnteringRef.current = true;

    // Start all cards invisible (spring immediately positions them via transform)
    cardRefs.current.forEach(card => {
      if (card) card.style.opacity = '0';
    });

    // Stagger opacity fade-in ONLY (spring handles transform throughout)
    const handles: ReturnType<typeof setTimeout>[] = [];
    cardRefs.current.forEach((card, i) => {
      if (!card) return;
      const h = setTimeout(() => {
        if (!card) return;
        // CSS transition on opacity ONLY — transform is NOT transitioned
        card.style.transition = 'opacity 0.32s ease-out';
        card.style.opacity    = '1';
        // Remove transition after fade so spring can write opacity unimpeded
        const h2 = setTimeout(() => {
          if (card) card.style.transition = '';
        }, 340);
        handles.push(h2);
      }, i * 30 + 25);
      handles.push(h);
    });

    // Hand opacity back to rAF loop after all cards have faded in
    const totalMs = bills.length * 30 + 380;
    const endH = setTimeout(() => {
      isEnteringRef.current = false;
    }, totalMs);
    handles.push(endH);

    return () => handles.forEach(clearTimeout);
  }, [bills]);

  /* ════════════════════════════════════════════════════════════════════════
     ADVANCE — instant target, spring does the motion
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
    touchRef.current.active = false;
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
      if (Math.abs(dy) >= MIN_SWIPE && tryAdvance(dy > 0 ? 1 : -1)) m.consumed = true;
    };
    const onUp = () => { mouseRef.current.down = false; mouseRef.current.consumed = false; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
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

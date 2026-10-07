import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { macAudio } from '../utils/macAudio';

export type ItemEntryMode = 'CONVERSION' | 'AUTO_ITEM' | 'SIMPLE';

interface HudState {
  visible: boolean;
  mode: ItemEntryMode;
  title: string;
  subtitle: string;
}

interface ItemModeContextType {
  mode: ItemEntryMode;
  autoConvert: boolean;
  autoItem: boolean;
  simpleMode: boolean;
  setMode: (mode: ItemEntryMode) => void;
  cycleMode: () => void;
  handleToggle: (key: 'autoConvert' | 'autoItem' | 'simpleMode' | 'rowMode') => void;
}

const ItemModeContext = createContext<ItemModeContextType | null>(null);

const STORAGE_KEY = 'global_item_entry_mode';

export const ItemModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setModeState] = useState<ItemEntryMode>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'AUTO_ITEM' || saved === 'SIMPLE' || saved === 'CONVERSION') {
      return saved;
    }
    return 'CONVERSION';
  });

  const [hud, setHud] = useState<HudState>({
    visible: false,
    mode: 'CONVERSION',
    title: '',
    subtitle: ''
  });

  const hudTimerRef = useRef<any>(null);

  const showHud = useCallback((newMode: ItemEntryMode) => {
    if (hudTimerRef.current) clearTimeout(hudTimerRef.current);

    let title = 'CONVERSION MODE';
    let subtitle = 'Shortcuts Auto-Expand to Full Item Names & Caps';

    if (newMode === 'AUTO_ITEM') {
      title = 'AUTO ITEM MODE';
      subtitle = 'Sticky Prefix for Numbers & Quick Suggestions Active';
    } else if (newMode === 'SIMPLE') {
      title = 'SIMPLE MODE';
      subtitle = 'Direct Manual Typing (Auto-Expansions Disabled)';
    }

    setHud({
      visible: true,
      mode: newMode,
      title,
      subtitle
    });

    hudTimerRef.current = setTimeout(() => {
      setHud((prev) => ({ ...prev, visible: false }));
    }, 1400);
  }, []);

  const setMode = useCallback(
    (newMode: ItemEntryMode) => {
      setModeState(newMode);
      localStorage.setItem(STORAGE_KEY, newMode);
      macAudio.playPop();
      showHud(newMode);
    },
    [showHud]
  );

  const cycleMode = useCallback(() => {
    setModeState((prev) => {
      let next: ItemEntryMode = 'CONVERSION';
      if (prev === 'CONVERSION') next = 'AUTO_ITEM';
      else if (prev === 'AUTO_ITEM') next = 'SIMPLE';
      else if (prev === 'SIMPLE') next = 'CONVERSION';

      localStorage.setItem(STORAGE_KEY, next);
      macAudio.playPop();
      showHud(next);
      return next;
    });
  }, [showHud]);

  const handleToggle = useCallback(
    (key: 'autoConvert' | 'autoItem' | 'simpleMode' | 'rowMode') => {
      if (key === 'autoConvert') {
        setMode(mode === 'CONVERSION' ? 'SIMPLE' : 'CONVERSION');
      } else if (key === 'autoItem') {
        setMode(mode === 'AUTO_ITEM' ? 'SIMPLE' : 'AUTO_ITEM');
      } else if (key === 'simpleMode') {
        setMode(mode === 'SIMPLE' ? 'CONVERSION' : 'SIMPLE');
      }
    },
    [mode, setMode]
  );

  // Global Right-Hand Numpad Shortcut Listener
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // If Digital Calculator modal is actively open, let its keypad logic handle arithmetic
      const calcEl = document.getElementById('digital-calc-modal');
      if (calcEl && calcEl.offsetParent !== null) {
        return;
      }

      // Check for Alt shortcuts matching Python reference app:
      // Alt+A: Auto Convert
      if (e.altKey && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault();
        e.stopPropagation();
        handleToggle('autoConvert');
        return;
      }
      // Alt+Z: Auto Item
      if (e.altKey && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault();
        e.stopPropagation();
        handleToggle('autoItem');
        return;
      }
      // Alt+X: Simple Mode
      if (e.altKey && (e.key === 'x' || e.key === 'X')) {
        e.preventDefault();
        e.stopPropagation();
        handleToggle('simpleMode');
        return;
      }

      // Check for Numpad Multiply (*) - Right hand natural rest position key
      const isNumpadMultiply = e.code === 'NumpadMultiply' || (e.key === '*' && (e.location === 3 || !e.shiftKey));
      const isF8 = e.key === 'F8';

      if (isNumpadMultiply || isF8) {
        const activeEl = document.activeElement as HTMLElement | null;
        const isInput = Boolean(activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA'));

        if (isInput && isNumpadMultiply) {
          const isItemNameInput = Boolean(
            activeEl?.classList?.contains('item-name-input') ||
            (activeEl?.id && /^left-cell-\d+-0$/.test(activeEl.id)) ||
            activeEl?.getAttribute('data-field') === 'name'
          );

          if (!isItemNameInput) {
            // User is in a numeric/formula cell or another column (Qty, U Cap, L Cap, size cols, price, etc.)
            // Allow typing '*' so auto-solve math expressions like '4*4' can be entered freely!
            return;
          }
        }

        e.preventDefault();
        e.stopPropagation();
        cycleMode();
        return;
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown, true);
    };
  }, [cycleMode, setMode, handleToggle]);

  const autoConvert = mode === 'CONVERSION';
  const autoItem = mode === 'AUTO_ITEM';
  const simpleMode = mode === 'SIMPLE';

  return (
    <ItemModeContext.Provider
      value={{
        mode,
        autoConvert,
        autoItem,
        simpleMode,
        setMode,
        cycleMode,
        handleToggle
      }}
    >
      {children}

      {/* Floating Apple-Style Glass HUD Pill when Mode Changes via Shortcut or Click */}
      {hud.visible && (
        <div
          style={{
            position: 'fixed',
            top: '28px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 999999,
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '8px 18px',
            background: 'rgba(15, 23, 42, 0.88)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(56, 189, 248, 0.4)',
            borderRadius: '9999px',
            boxShadow: '0 12px 30px rgba(0, 0, 0, 0.5), 0 0 20px rgba(56, 189, 248, 0.25)',
            animation: 'fadeInSlideDown 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            color: '#ffffff'
          }}
        >
          {/* Animated Indicator dot */}
          <div
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background:
                hud.mode === 'CONVERSION'
                  ? '#38bdf8'
                  : hud.mode === 'AUTO_ITEM'
                  ? '#34d399'
                  : '#f59e0b',
              boxShadow: `0 0 10px ${
                hud.mode === 'CONVERSION'
                  ? '#38bdf8'
                  : hud.mode === 'AUTO_ITEM'
                  ? '#34d399'
                  : '#f59e0b'
              }`
            }}
          />

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div
              style={{
                fontSize: '12px',
                fontWeight: 700,
                letterSpacing: '0.06em',
                color: '#f8fafc',
                textTransform: 'uppercase',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span>{hud.title}</span>
              <span
                style={{
                  fontSize: '10px',
                  padding: '1px 6px',
                  borderRadius: '4px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: '#94a3b8',
                  fontWeight: 500
                }}
              >
                Numpad [*]
              </span>
            </div>
            <div
              style={{
                fontSize: '10.5px',
                color: '#94a3b8',
                fontWeight: 400,
                marginTop: '1px'
              }}
            >
              {hud.subtitle}
            </div>
          </div>
        </div>
      )}
    </ItemModeContext.Provider>
  );
};

export const useItemMode = () => {
  const ctx = useContext(ItemModeContext);
  if (!ctx) {
    throw new Error('useItemMode must be used within an ItemModeProvider');
  }
  return ctx;
};

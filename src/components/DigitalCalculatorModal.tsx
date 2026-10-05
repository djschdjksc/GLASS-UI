import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  X, 
  Minus, 
  Copy, 
  Check, 
  RotateCcw, 
  History as HistoryIcon, 
  Sun, 
  Moon, 
  Percent, 
  ArrowLeft,
  Divide,
  X as MultiplyIcon,
  Plus as PlusIcon,
  Equal
} from 'lucide-react';
import { macAudio } from '../utils/macAudio';
import { Tooltip } from './ui/shadcn';

// Segment activation maps for digits 0-9, minus and error
const SEGMENT_MAP: Record<string, string[]> = {
  '0': ['a', 'b', 'c', 'd', 'e', 'f'],
  '1': ['b', 'c'],
  '2': ['a', 'b', 'g', 'e', 'd'],
  '3': ['a', 'b', 'g', 'c', 'd'],
  '4': ['f', 'g', 'b', 'c'],
  '5': ['a', 'f', 'g', 'c', 'd'],
  '6': ['a', 'f', 'g', 'e', 'c', 'd'],
  '7': ['a', 'b', 'c'],
  '8': ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
  '9': ['a', 'b', 'c', 'd', 'f', 'g'],
  '-': ['g'],
  'E': ['a', 'f', 'g', 'e', 'd']
};

interface SevenSegmentDigitProps {
  char?: string;
  hasDot?: boolean;
  activeColor?: string;
  inactiveColor?: string;
}

const SevenSegmentDigit: React.FC<SevenSegmentDigitProps> = ({
  char = '',
  hasDot = false,
  activeColor = '#ffffff',
  inactiveColor = 'rgba(255, 255, 255, 0.06)'
}) => {
  const activeSegments = SEGMENT_MAP[char] || [];

  const getFill = (seg: string) => (activeSegments.includes(seg) ? activeColor : inactiveColor);
  const getFilter = (seg: string) => 
    activeSegments.includes(seg) ? 'drop-shadow(0 0 4px rgba(255,255,255,0.7))' : 'none';

  return (
    <svg 
      viewBox="0 0 54 86" 
      style={{ 
        width: '32px', 
        height: '52px', 
        transform: 'skewX(-4deg)', 
        margin: '0 1.5px',
        overflow: 'visible' 
      }}
    >
      {/* a: Top */}
      <polygon 
        points="10,8 44,8 38,15 16,15" 
        fill={getFill('a')} 
        style={{ filter: getFilter('a'), transition: 'fill 0.05s' }} 
      />
      {/* b: Top-Right */}
      <polygon 
        points="46,10 52,16 48,40 42,36 40,16" 
        fill={getFill('b')} 
        style={{ filter: getFilter('b'), transition: 'fill 0.05s' }} 
      />
      {/* c: Bottom-Right */}
      <polygon 
        points="47,44 51,48 46,74 40,68 41,44" 
        fill={getFill('c')} 
        style={{ filter: getFilter('c'), transition: 'fill 0.05s' }} 
      />
      {/* d: Bottom */}
      <polygon 
        points="15,69 39,69 45,76 9,76" 
        fill={getFill('d')} 
        style={{ filter: getFilter('d'), transition: 'fill 0.05s' }} 
      />
      {/* e: Bottom-Left */}
      <polygon 
        points="8,44 14,41 15,68 9,74 4,68" 
        fill={getFill('e')} 
        style={{ filter: getFilter('e'), transition: 'fill 0.05s' }} 
      />
      {/* f: Top-Left */}
      <polygon 
        points="9,16 15,13 14,36 8,40 3,36" 
        fill={getFill('f')} 
        style={{ filter: getFilter('f'), transition: 'fill 0.05s' }} 
      />
      {/* g: Middle */}
      <polygon 
        points="13,38 41,38 44,41 41,44 13,44 10,41" 
        fill={getFill('g')} 
        style={{ filter: getFilter('g'), transition: 'fill 0.05s' }} 
      />
      {/* dp: Decimal Dot */}
      <circle 
        cx="50" 
        cy="75" 
        r="3.5" 
        fill={hasDot ? activeColor : inactiveColor} 
        style={{ filter: hasDot ? 'drop-shadow(0 0 4px rgba(255,255,255,0.7))' : 'none', transition: 'fill 0.05s' }} 
      />
    </svg>
  );
};

export interface CalculatorProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertValue?: (val: string) => void;
  onToast?: (msg: string, type: 'success' | 'info' | 'warning' | 'error') => void;
}

export const DigitalCalculatorModal: React.FC<CalculatorProps> = ({
  isOpen,
  onClose,
  onInsertValue,
  onToast
}) => {
  const [displayValue, setDisplayValue] = useState<string>('0');
  const [expression, setExpression] = useState<string>('');
  const [prevValue, setPrevValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState<boolean>(false);
  const [history, setHistory] = useState<{ expr: string; res: string; time: string }[]>(() => {
    try {
      const saved = localStorage.getItem('billapp_calc_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [showGstTools, setShowGstTools] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [activeKeyHighlight, setActiveKeyHighlight] = useState<string | null>(null);

  // Dragging state
  const [position, setPosition] = useState<{ x: number; y: number }>(() => {
    const w = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const h = typeof window !== 'undefined' ? window.innerHeight : 800;
    return { x: Math.max(50, w - 420), y: Math.max(60, h - 680) };
  });
  const isDragging = useRef<boolean>(false);
  const dragStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Play subtle mechanical key tap audio
  const playClickSound = useCallback(() => {
    try {
      macAudio.playPop();
    } catch {}
  }, []);

  const clearAll = useCallback(() => {
    playClickSound();
    setDisplayValue('0');
    setExpression('');
    setPrevValue(null);
    setOperation(null);
    setWaitingForOperand(false);
  }, [playClickSound]);

  const clearEntry = useCallback(() => {
    playClickSound();
    setDisplayValue('0');
  }, [playClickSound]);

  const inputDigit = useCallback((digit: string) => {
    playClickSound();
    setActiveKeyHighlight(digit);
    setTimeout(() => setActiveKeyHighlight(null), 120);

    if (waitingForOperand) {
      setDisplayValue(digit);
      setWaitingForOperand(false);
    } else {
      if (displayValue === '0' && digit !== '.') {
        setDisplayValue(digit);
      } else {
        if (displayValue.replace(/[^0-9]/g, '').length < 10) {
          setDisplayValue(displayValue + digit);
        }
      }
    }
  }, [displayValue, waitingForOperand, playClickSound]);

  const inputDecimal = useCallback(() => {
    playClickSound();
    setActiveKeyHighlight('.');
    setTimeout(() => setActiveKeyHighlight(null), 120);

    if (waitingForOperand) {
      setDisplayValue('0.');
      setWaitingForOperand(false);
      return;
    }

    if (!displayValue.includes('.')) {
      setDisplayValue(displayValue + '.');
    }
  }, [displayValue, waitingForOperand, playClickSound]);

  const toggleSign = useCallback(() => {
    playClickSound();
    const val = parseFloat(displayValue);
    if (!isNaN(val)) {
      setDisplayValue(String(-val));
    }
  }, [displayValue, playClickSound]);

  const inputPercent = useCallback(() => {
    playClickSound();
    const current = parseFloat(displayValue);
    if (isNaN(current)) return;

    if (prevValue !== null && operation) {
      // Percentage of previous value
      const pct = (prevValue * current) / 100;
      setDisplayValue(String(parseFloat(pct.toFixed(4))));
    } else {
      setDisplayValue(String(parseFloat((current / 100).toFixed(4))));
    }
  }, [displayValue, prevValue, operation, playClickSound]);

  const executeOperation = useCallback((nextOp: string) => {
    playClickSound();
    setActiveKeyHighlight(nextOp);
    setTimeout(() => setActiveKeyHighlight(null), 120);

    const inputValue = parseFloat(displayValue);

    if (prevValue === null) {
      setPrevValue(inputValue);
      setExpression(`${inputValue} ${nextOp}`);
    } else if (operation) {
      const currentValue = prevValue;
      let newValue = currentValue;

      if (operation === '+') newValue = currentValue + inputValue;
      else if (operation === '-') newValue = currentValue - inputValue;
      else if (operation === '×' || operation === '*') newValue = currentValue * inputValue;
      else if (operation === '÷' || operation === '/') {
        if (inputValue === 0) {
          setDisplayValue('Error');
          setPrevValue(null);
          setOperation(null);
          setWaitingForOperand(true);
          return;
        }
        newValue = currentValue / inputValue;
      }

      const formatted = parseFloat(newValue.toFixed(6));
      setPrevValue(formatted);
      setDisplayValue(String(formatted));
      setExpression(`${formatted} ${nextOp}`);
    }

    setWaitingForOperand(true);
    setOperation(nextOp);
  }, [displayValue, prevValue, operation, playClickSound]);

  const calculateResult = useCallback(() => {
    playClickSound();
    setActiveKeyHighlight('=');
    setTimeout(() => setActiveKeyHighlight(null), 120);

    if (prevValue === null || operation === null) return;

    const inputValue = parseFloat(displayValue);
    let result = prevValue;

    if (operation === '+') result = prevValue + inputValue;
    else if (operation === '-') result = prevValue - inputValue;
    else if (operation === '×' || operation === '*') result = prevValue * inputValue;
    else if (operation === '÷' || operation === '/') {
      if (inputValue === 0) {
        setDisplayValue('Error');
        setPrevValue(null);
        setOperation(null);
        setWaitingForOperand(true);
        return;
      }
      result = prevValue / inputValue;
    }

    const formatted = parseFloat(result.toFixed(6));
    const fullExpr = `${prevValue} ${operation} ${inputValue} =`;
    const resStr = String(formatted);

    setExpression(fullExpr);
    setDisplayValue(resStr);
    setPrevValue(null);
    setOperation(null);
    setWaitingForOperand(true);

    // Save to history
    const entry = {
      expr: fullExpr,
      res: resStr,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };
    setHistory(prev => {
      const next = [entry, ...prev].slice(0, 30);
      try {
        localStorage.setItem('billapp_calc_history', JSON.stringify(next));
      } catch {}
      return next;
    });
  }, [prevValue, operation, displayValue, playClickSound]);

  const applyGst = useCallback((rate: number, isAddition: boolean) => {
    playClickSound();
    const val = parseFloat(displayValue);
    if (isNaN(val) || val <= 0) return;

    let res = val;
    let desc = '';
    if (isAddition) {
      // Adding GST: e.g. 1000 + 18% = 1180
      res = val + (val * rate) / 100;
      desc = `${val} + ${rate}% GST =`;
    } else {
      // Extracting Base Price from Inclusive GST: e.g. 1180 / 1.18 = 1000
      res = val / (1 + rate / 100);
      desc = `${val} - ${rate}% Reverse GST =`;
    }

    const formatted = parseFloat(res.toFixed(2));
    const resStr = String(formatted);
    setExpression(desc);
    setDisplayValue(resStr);
    setWaitingForOperand(true);

    const entry = {
      expr: desc,
      res: resStr,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };
    setHistory(prev => {
      const next = [entry, ...prev].slice(0, 30);
      try { localStorage.setItem('billapp_calc_history', JSON.stringify(next)); } catch {}
      return next;
    });

    onToast?.(`GST (${rate}%): ${resStr}`, 'success');
  }, [displayValue, onToast, playClickSound]);

  const backspace = useCallback(() => {
    playClickSound();
    if (displayValue.length > 1 && displayValue !== 'Error') {
      setDisplayValue(displayValue.slice(0, -1));
    } else {
      setDisplayValue('0');
    }
  }, [displayValue, playClickSound]);

  // Copy result to clipboard
  const handleCopy = () => {
    navigator.clipboard.writeText(displayValue).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
      onToast?.(`Copied ${displayValue} to Clipboard!`, 'success');
    }).catch(() => {});
  };

  // Insert into active table cell if available
  const handleInsert = () => {
    if (onInsertValue && displayValue && displayValue !== 'Error') {
      onInsertValue(displayValue);
      onToast?.(`Inserted ${displayValue} into Bill!`, 'success');
    }
  };

  // FULL PHYSICAL NUMPAD KEYBOARD LISTENER ("WO PURA KA PURA NAM PAD SE CONTROL HO")
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key;
      const code = e.code;
      const isPhysicalNumpad = code.startsWith('Numpad');

      // Don't intercept normal typing if in an external input outside the calculator
      const activeEl = document.activeElement;
      if (!isPhysicalNumpad && activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
        if (!activeEl.closest('#digital-calc-modal')) return;
      }

      // If user presses physical Numpad key, blur external input so cell isn't accidentally modified
      if (isPhysicalNumpad && activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA') && !activeEl.closest('#digital-calc-modal')) {
        (activeEl as HTMLElement).blur();
      }

      // Numpad 0-9 & Standard 0-9
      if (/^[0-9]$/.test(key) || code.startsWith('Numpad') && /^[0-9]$/.test(key)) {
        e.preventDefault();
        inputDigit(key);
        return;
      }

      // Decimal point (NumpadDecimal or '.')
      if (key === '.' || code === 'NumpadDecimal') {
        e.preventDefault();
        inputDecimal();
        return;
      }

      // Add (+)
      if (key === '+' || code === 'NumpadAdd') {
        e.preventDefault();
        executeOperation('+');
        return;
      }

      // Subtract (-)
      if (key === '-' || code === 'NumpadSubtract') {
        e.preventDefault();
        executeOperation('-');
        return;
      }

      // Multiply (*)
      if (key === '*' || code === 'NumpadMultiply') {
        e.preventDefault();
        executeOperation('×');
        return;
      }

      // Divide (/)
      if (key === '/' || code === 'NumpadDivide') {
        e.preventDefault();
        executeOperation('÷');
        return;
      }

      // Calculate (Enter / NumpadEnter / =)
      if (key === 'Enter' || code === 'NumpadEnter' || key === '=') {
        e.preventDefault();
        calculateResult();
        return;
      }

      // Backspace
      if (key === 'Backspace') {
        e.preventDefault();
        backspace();
        return;
      }

      // Percentage (%)
      if (key === '%') {
        e.preventDefault();
        inputPercent();
        return;
      }

      // Clear / Close
      if (key === 'Delete') {
        e.preventDefault();
        clearAll();
        return;
      }

      if (key === 'Escape') {
        e.preventDefault();
        if (displayValue !== '0' || prevValue !== null) {
          clearAll();
        } else {
          onClose();
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, inputDigit, inputDecimal, executeOperation, calculateResult, backspace, clearAll, inputPercent, onClose, displayValue, prevValue]);

  // Window drag handler
  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      setPosition({
        x: Math.max(10, Math.min(window.innerWidth - 340, e.clientX - dragStart.current.x)),
        y: Math.max(10, Math.min(window.innerHeight - 560, e.clientY - dragStart.current.y))
      });
    };

    const handleMouseUp = () => {
      isDragging.current = false;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  if (!isOpen) return null;

  // Format 7-Segment display digits (matching user's uploaded image with ghost unlit segments)
  const renderSevenSegmentScreen = () => {
    const cleanDisplay = displayValue || '0';
    // Split into characters and track decimal dots attached to preceding digits
    const charsWithDots: { char: string; dot: boolean }[] = [];
    
    for (let i = 0; i < cleanDisplay.length; i++) {
      const c = cleanDisplay[i];
      if (c === '.') {
        if (charsWithDots.length > 0) {
          charsWithDots[charsWithDots.length - 1].dot = true;
        } else {
          charsWithDots.push({ char: '0', dot: true });
        }
      } else {
        charsWithDots.push({ char: c, dot: false });
      }
    }

    // Fixed total 8 LCD slots (like classic Casio / neumorphic screen in screenshot)
    const totalSlots = 8;
    const paddingCount = Math.max(0, totalSlots - charsWithDots.length);
    const paddedList: { char: string; dot: boolean; isGhost: boolean }[] = [];

    // Faint inactive ghost digits on left (e.g. 8888 in user's image)
    for (let i = 0; i < paddingCount; i++) {
      paddedList.push({ char: '8', dot: false, isGhost: true });
    }

    // Active illuminated digits on right
    charsWithDots.forEach(item => {
      paddedList.push({ ...item, isGhost: false });
    });

    return (
      <div 
        style={{ 
          display: 'flex', 
          justifyContent: 'flex-end', 
          alignItems: 'center', 
          width: '100%',
          overflow: 'hidden'
        }}
      >
        {paddedList.map((d, idx) => (
          <SevenSegmentDigit
            key={idx}
            char={d.isGhost ? '8' : d.char}
            hasDot={d.dot}
            activeColor={d.isGhost ? 'rgba(255, 255, 255, 0.04)' : '#ffffff'}
            inactiveColor="rgba(255, 255, 255, 0.03)"
          />
        ))}
      </div>
    );
  };

  return (
    <div
      id="digital-calc-modal"
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: 99999,
        width: '320px',
        background: 'linear-gradient(175deg, #181b20 0%, #111317 100%)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: '24px',
        boxShadow: '0 30px 80px -10px rgba(0, 0, 0, 0.85), 0 0 0 1px rgba(255, 255, 255, 0.05), inset 0 1px 1px rgba(255, 255, 255, 0.15)',
        userSelect: 'none',
        display: 'flex',
        flexDirection: 'column',
        backdropFilter: 'blur(20px)',
        overflow: 'hidden',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}
    >
      {/* ── Top Window Bar (Draggable) ── */}
      <div
        onMouseDown={handleMouseDown}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 14px 6px 14px',
          cursor: 'grab',
          borderBottom: '1px solid rgba(255, 255, 255, 0.04)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Tooltip title="Close (Esc)" side="bottom">
            <button
              onClick={onClose}
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: '#ff5f56',
                border: '1px solid rgba(0,0,0,0.2)',
                cursor: 'pointer',
                padding: 0
              }}
            />
          </Tooltip>
          <Tooltip title="Reset Position" side="bottom">
            <button
              onClick={() => setPosition({ x: 40, y: 80 })}
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: '#ffbd2e',
                border: '1px solid rgba(0,0,0,0.2)',
                cursor: 'pointer',
                padding: 0
              }}
            />
          </Tooltip>
          <Tooltip title="Toggle GST Billing Modes" side="bottom">
            <button
              onClick={() => setShowGstTools(v => !v)}
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: '#27c93f',
                border: '1px solid rgba(0,0,0,0.2)',
                cursor: 'pointer',
                padding: 0
              }}
            />
          </Tooltip>
          <span style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8', marginLeft: '6px', letterSpacing: '0.4px' }}>
            PRO CALC <span style={{ fontSize: '9px', color: '#0284c7', background: 'rgba(2,132,199,0.15)', padding: '1px 5px', borderRadius: '4px' }}>NUMPAD READY</span>
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* History Tape Toggle */}
          <Tooltip title="Calculation Tape History" side="bottom">
            <button
              onClick={() => setShowHistory(v => !v)}
              style={{
                background: showHistory ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
                border: 'none',
                color: showHistory ? '#38bdf8' : '#64748b',
                cursor: 'pointer',
                padding: '2px 4px',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <HistoryIcon size={14} />
            </button>
          </Tooltip>

          {/* Copy Result */}
          <Tooltip title="Copy Result (Ctrl+C)" side="bottom">
            <button
              onClick={handleCopy}
              style={{
                background: 'transparent',
                border: 'none',
                color: copied ? '#10b981' : '#64748b',
                cursor: 'pointer',
                padding: '2px 4px',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
            </button>
          </Tooltip>

          {/* Sun / Theme Deco Icon from Screenshot */}
          <Sun size={13} color="#38bdf8" style={{ opacity: 0.8 }} />
        </div>
      </div>

      {/* ── Main Body ── */}
      <div style={{ padding: '14px 16px 18px 16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        
        {/* ── 7-Segment LCD Display (Exact clone of user's image) ── */}
        <div
          style={{
            background: '#0d1015',
            borderRadius: '16px',
            padding: '10px 14px 8px 14px',
            border: '1.5px solid #0284c7', // Neon blue bezel glow from user's image
            boxShadow: 'inset 0 4px 10px rgba(0, 0, 0, 0.9), 0 0 16px -2px rgba(2, 132, 199, 0.35)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: '84px',
            position: 'relative'
          }}
        >
          {/* Expression line */}
          <div
            style={{
              fontSize: '11px',
              fontFamily: '"SF Mono", "Fira Code", monospace',
              color: '#38bdf8',
              minHeight: '14px',
              textAlign: 'right',
              opacity: 0.9,
              letterSpacing: '0.5px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {expression || ' '}
          </div>

          {/* 7-Segment Digit Line */}
          {renderSevenSegmentScreen()}
        </div>

        {/* ── Optional Quick GST Billing Bar ── */}
        {showGstTools && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '6px',
              background: 'rgba(0, 0, 0, 0.3)',
              padding: '6px',
              borderRadius: '10px',
              border: '1px solid rgba(255, 255, 255, 0.06)'
            }}
          >
            <button
              onClick={() => applyGst(18, true)}
              style={{
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#34d399',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '6px',
                padding: '4px 0',
                fontSize: '10px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
              title="Add 18% GST"
            >
              +18%
            </button>
            <button
              onClick={() => applyGst(18, false)}
              style={{
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#f87171',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '6px',
                padding: '4px 0',
                fontSize: '10px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
              title="Extract Base Price (Minus 18% GST)"
            >
              -18%
            </button>
            <button
              onClick={() => applyGst(12, true)}
              style={{
                background: 'rgba(56, 189, 248, 0.15)',
                color: '#38bdf8',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                borderRadius: '6px',
                padding: '4px 0',
                fontSize: '10px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
              title="Add 12% GST"
            >
              +12%
            </button>
            <button
              onClick={() => applyGst(5, true)}
              style={{
                background: 'rgba(245, 158, 11, 0.15)',
                color: '#fbbf24',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: '6px',
                padding: '4px 0',
                fontSize: '10px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
              title="Add 5% GST"
            >
              +5%
            </button>
          </div>
        )}

        {/* ── Keypad Grid (Exact layout from user's image) ── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '10px'
          }}
        >
          {/* Row 1: AC, ± (or $), %, ÷ */}
          <button 
            onClick={clearAll}
            className="calc-btn neumorphic-btn"
            style={{ color: '#f87171' }}
          >
            AC
          </button>
          <button 
            onClick={toggleSign}
            className="calc-btn neumorphic-btn"
            style={{ color: '#cbd5e1' }}
            title="Toggle Sign (+/-)"
          >
            ±
          </button>
          <button 
            onClick={inputPercent}
            className="calc-btn neumorphic-btn"
            style={{ color: '#cbd5e1' }}
            title="Percentage (%)"
          >
            %
          </button>
          <button 
            onClick={() => executeOperation('÷')}
            className={`calc-btn operator-btn ${activeKeyHighlight === '÷' || operation === '÷' ? 'active-op' : ''}`}
          >
            /
          </button>

          {/* Row 2: 7, 8, 9, × */}
          <button onClick={() => inputDigit('7')} className={`calc-btn number-btn ${activeKeyHighlight === '7' ? 'active-num' : ''}`}>7</button>
          <button onClick={() => inputDigit('8')} className={`calc-btn number-btn ${activeKeyHighlight === '8' ? 'active-num' : ''}`}>8</button>
          <button onClick={() => inputDigit('9')} className={`calc-btn number-btn ${activeKeyHighlight === '9' ? 'active-num' : ''}`}>9</button>
          <button 
            onClick={() => executeOperation('×')}
            className={`calc-btn operator-btn ${activeKeyHighlight === '×' || operation === '×' ? 'active-op' : ''}`}
          >
            ×
          </button>

          {/* Row 3: 4, 5, 6, - */}
          <button onClick={() => inputDigit('4')} className={`calc-btn number-btn ${activeKeyHighlight === '4' ? 'active-num' : ''}`}>4</button>
          <button onClick={() => inputDigit('5')} className={`calc-btn number-btn ${activeKeyHighlight === '5' ? 'active-num' : ''}`}>5</button>
          <button onClick={() => inputDigit('6')} className={`calc-btn number-btn ${activeKeyHighlight === '6' ? 'active-num' : ''}`}>6</button>
          <button 
            onClick={() => executeOperation('-')}
            className={`calc-btn operator-btn ${activeKeyHighlight === '-' || operation === '-' ? 'active-op' : ''}`}
          >
            -
          </button>

          {/* Row 4: 1, 2, 3, + */}
          <button onClick={() => inputDigit('1')} className={`calc-btn number-btn ${activeKeyHighlight === '1' ? 'active-num' : ''}`}>1</button>
          <button onClick={() => inputDigit('2')} className={`calc-btn number-btn ${activeKeyHighlight === '2' ? 'active-num' : ''}`}>2</button>
          <button onClick={() => inputDigit('3')} className={`calc-btn number-btn ${activeKeyHighlight === '3' ? 'active-num' : ''}`}>3</button>
          <button 
            onClick={() => executeOperation('+')}
            className={`calc-btn operator-btn ${activeKeyHighlight === '+' || operation === '+' ? 'active-op' : ''}`}
          >
            +
          </button>

          {/* Row 5: 0, ., Backspace, = (Solid Electric Blue as in screenshot) */}
          <button onClick={() => inputDigit('0')} className={`calc-btn number-btn ${activeKeyHighlight === '0' ? 'active-num' : ''}`}>0</button>
          <button onClick={inputDecimal} className={`calc-btn number-btn ${activeKeyHighlight === '.' ? 'active-num' : ''}`}>.</button>
          <button 
            onClick={backspace} 
            className="calc-btn neumorphic-btn" 
            style={{ color: '#94a3b8' }}
            title="Backspace (⌫)"
          >
            ⌫
          </button>
          <button 
            onClick={calculateResult}
            className="calc-btn equals-btn"
            title="Calculate (Enter / =)"
          >
            =
          </button>
        </div>

        {/* ── Bottom Numpad Status & Action Pill ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '2px' }}>
          <span style={{ fontSize: '10px', color: '#64748b' }}>
            Numpad Enabled • Press <b>Esc</b> to clear
          </span>
          {onInsertValue && (
            <button
              onClick={handleInsert}
              style={{
                background: 'rgba(2, 132, 199, 0.15)',
                color: '#38bdf8',
                border: '1px solid rgba(2, 132, 199, 0.3)',
                borderRadius: '6px',
                padding: '2px 8px',
                fontSize: '10px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
              title="Insert Result into active table cell"
            >
              Insert in Bill
            </button>
          )}
        </div>

        {/* ── Calculation Tape History Drawer ── */}
        {showHistory && (
          <div
            style={{
              maxHeight: '140px',
              overflowY: 'auto',
              background: '#0b0d11',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              padding: '8px 10px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '4px' }}>
              <span style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8' }}>CALCULATION TAPE</span>
              <button
                onClick={() => { setHistory([]); localStorage.removeItem('billapp_calc_history'); }}
                style={{ background: 'transparent', border: 'none', color: '#ef4444', fontSize: '9px', cursor: 'pointer' }}
              >
                Clear Tape
              </button>
            </div>
            {history.length === 0 ? (
              <span style={{ fontSize: '10px', color: '#475569', textAlign: 'center', padding: '10px 0' }}>No history yet</span>
            ) : (
              history.map((h, idx) => (
                <div 
                  key={idx}
                  onClick={() => { setDisplayValue(h.res); setWaitingForOperand(true); }}
                  style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    cursor: 'pointer',
                    padding: '2px 4px',
                    borderRadius: '4px',
                    background: 'rgba(255,255,255,0.02)'
                  }}
                  title="Click to load result"
                >
                  <span style={{ fontSize: '10px', color: '#64748b', fontFamily: 'monospace' }}>{h.expr}</span>
                  <span style={{ fontSize: '11px', color: '#f8fafc', fontWeight: 600 }}>{h.res}</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* ── Embedded CSS for Neumorphic Button Shadows & Press Effect ── */}
      <style>{`
        .calc-btn {
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 17px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.08s ease;
          outline: none;
        }

        /* Neumorphic Dark Key */
        .neumorphic-btn {
          background: linear-gradient(145deg, #1e2229, #14171c);
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 3px 3px 6px rgba(0, 0, 0, 0.5), -1px -1px 3px rgba(255, 255, 255, 0.05);
        }
        .neumorphic-btn:active {
          transform: scale(0.96);
          box-shadow: inset 2px 2px 5px rgba(0, 0, 0, 0.6), inset -1px -1px 2px rgba(255, 255, 255, 0.04);
        }

        /* Number Buttons */
        .number-btn {
          background: linear-gradient(145deg, #1b1e24, #121418);
          border: 1px solid rgba(255, 255, 255, 0.07);
          color: #f1f5f9;
          box-shadow: 3px 3px 6px rgba(0, 0, 0, 0.5), -1px -1px 3px rgba(255, 255, 255, 0.04);
        }
        .number-btn:hover {
          background: linear-gradient(145deg, #22262d, #16181d);
          border-color: rgba(255, 255, 255, 0.12);
        }
        .number-btn:active, .number-btn.active-num {
          transform: scale(0.95);
          background: #0f1115;
          box-shadow: inset 2px 2px 6px rgba(0, 0, 0, 0.7);
        }

        /* Operators (/ * - +) with subtle blue tint as in image */
        .operator-btn {
          background: linear-gradient(145deg, #182230, #101824);
          border: 1px solid rgba(2, 132, 199, 0.3);
          color: #38bdf8;
          box-shadow: 3px 3px 6px rgba(0, 0, 0, 0.5), -1px -1px 3px rgba(2, 132, 199, 0.1);
        }
        .operator-btn:hover {
          background: linear-gradient(145deg, #1d2c3f, #131e2d);
          border-color: rgba(2, 132, 199, 0.5);
        }
        .operator-btn:active, .operator-btn.active-op {
          transform: scale(0.95);
          background: #09101a;
          box-shadow: inset 2px 2px 6px rgba(0, 0, 0, 0.8), 0 0 10px rgba(2, 132, 199, 0.4);
        }

        /* Equals (=) Button: Solid Electric Apple Blue */
        .equals-btn {
          background: linear-gradient(135deg, #0284c7 0%, #2563eb 100%);
          border: 1px solid #38bdf8;
          color: #ffffff;
          box-shadow: 0 4px 14px rgba(37, 99, 235, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.35);
        }
        .equals-btn:hover {
          background: linear-gradient(135deg, #0369a1 0%, #1d4ed8 100%);
          box-shadow: 0 6px 18px rgba(37, 99, 235, 0.6);
        }
        .equals-btn:active {
          transform: scale(0.95);
          background: #1e40af;
          box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.5);
        }
      `}</style>
    </div>
  );
};

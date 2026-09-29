import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, X, Clock, Check } from 'lucide-react';
import { macAudio } from '../../utils/macAudio';

export interface ShadcnDatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (val: string) => void;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
  placeholder?: string;
  id?: string;
  onEnterNext?: () => void;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const SHORT_MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const DAYS_OF_WEEK = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return 'Select date';
  try {
    const [y, m, d] = dateStr.split('-').map(Number);
    if (!y || !m || !d) return dateStr;
    const dateObj = new Date(y, m - 1, d);
    if (isNaN(dateObj.getTime())) return dateStr;
    return `${d.toString().padStart(2, '0')} ${SHORT_MONTH_NAMES[m - 1]} ${y}`;
  } catch {
    return dateStr;
  }
}

function toIsoString(year: number, month: number, day: number): string {
  const m = String(month).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

export const ShadcnDatePicker: React.FC<ShadcnDatePickerProps> = ({
  value,
  onChange,
  disabled = false,
  className = '',
  style,
  placeholder = 'Select date',
  id,
  onEnterNext
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize view year and month based on value
  const initialDate = value ? new Date(value) : new Date();
  const validInitial = isNaN(initialDate.getTime()) ? new Date() : initialDate;

  const [viewYear, setViewYear] = useState(validInitial.getFullYear());
  const [viewMonth, setViewMonth] = useState(validInitial.getMonth() + 1); // 1-12

  // Update view when value changes externally
  useEffect(() => {
    if (value) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        setViewYear(d.getFullYear());
        setViewMonth(d.getMonth() + 1);
      }
    }
  }, [value]);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Calendar math
  const daysInMonth = new Date(viewYear, viewMonth, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth - 1, 1).getDay(); // 0 is Sunday
  const daysInPrevMonth = new Date(viewYear, viewMonth - 1, 0).getDate();

  const prevMonthDays: number[] = [];
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    prevMonthDays.push(daysInPrevMonth - i);
  }

  const currentMonthDays: number[] = [];
  for (let i = 1; i <= daysInMonth; i++) {
    currentMonthDays.push(i);
  }

  const totalCells = prevMonthDays.length + currentMonthDays.length;
  const nextMonthDaysCount = totalCells > 35 ? 42 - totalCells : 35 - totalCells;
  const nextMonthDays: number[] = [];
  for (let i = 1; i <= nextMonthDaysCount; i++) {
    nextMonthDays.push(i);
  }

  const handlePrevMonth = () => {
    macAudio.playClick();
    if (viewMonth === 1) {
      setViewMonth(12);
      setViewYear(prev => prev - 1);
    } else {
      setViewMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    macAudio.playClick();
    if (viewMonth === 12) {
      setViewMonth(1);
      setViewYear(prev => prev + 1);
    } else {
      setViewMonth(prev => prev + 1);
    }
  };

  const selectDate = (y: number, m: number, d: number) => {
    macAudio.playClick();
    const iso = toIsoString(y, m, d);
    onChange(iso);
    setIsOpen(false);
    onEnterNext?.();
  };

  // Quick preset actions
  const setPresetToday = () => {
    const now = new Date();
    selectDate(now.getFullYear(), now.getMonth() + 1, now.getDate());
  };

  const setPresetYesterday = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    selectDate(yesterday.getFullYear(), yesterday.getMonth() + 1, yesterday.getDate());
  };

  const setPresetTomorrow = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    selectDate(tomorrow.getFullYear(), tomorrow.getMonth() + 1, tomorrow.getDate());
  };

  const setRelativeDay = (offsetDays: number) => {
    const base = value ? new Date(value) : new Date();
    base.setDate(base.getDate() + offsetDays);
    selectDate(base.getFullYear(), base.getMonth() + 1, base.getDate());
  };

  const todayStr = (() => {
    const now = new Date();
    return toIsoString(now.getFullYear(), now.getMonth() + 1, now.getDate());
  })();

  const isToday = value === todayStr;

  return (
    <div
      ref={containerRef}
      className={`shadcn-datepicker-root ${className}`}
      style={{
        position: 'relative',
        display: 'inline-block',
        ...style
      }}
    >
      {/* Trigger Button - Shadcn Input/Button look */}
      <button
        id={id || 'header-date-picker'}
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!disabled) {
            macAudio.playClick();
            setIsOpen(prev => !prev);
          }
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            if (isOpen) setIsOpen(false);
            if (onEnterNext) {
              onEnterNext();
            }
          } else if (e.key === ' ' || e.key === 'ArrowDown') {
            e.preventDefault();
            setIsOpen(true);
          }
        }}
        data-np-target="1-5"
        className="shadcn-date-trigger"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 10px',
          background: 'var(--card, rgba(15, 23, 42, 0.6))',
          border: '1px solid var(--border, rgba(255, 255, 255, 0.12))',
          borderRadius: '7px',
          color: 'var(--foreground, #f8fafc)',
          fontSize: '12px',
          fontWeight: 600,
          cursor: disabled ? 'not-allowed' : 'pointer',
          outline: 'none',
          transition: 'all 0.18s ease',
          boxShadow: isOpen ? '0 0 0 2px var(--ring, #38bdf8)' : '0 1px 3px rgba(0, 0, 0, 0.2)',
          userSelect: 'none',
          minWidth: '135px',
          justifyContent: 'space-between'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
          <Calendar size={13} style={{ color: 'var(--primary, #38bdf8)', flexShrink: 0 }} />
          <span style={{ letterSpacing: '0.2px' }}>
            {value ? formatDisplayDate(value) : placeholder}
          </span>
        </div>

        {isToday && (
          <span
            style={{
              fontSize: '9px',
              fontWeight: 700,
              padding: '1px 5px',
              borderRadius: '4px',
              background: 'rgba(56, 189, 248, 0.15)',
              color: 'var(--primary, #38bdf8)'
            }}
          >
            Today
          </span>
        )}
      </button>

      {/* Calendar Popover */}
      {isOpen && (
        <div
          className="shadcn-date-popover"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            zIndex: 99999999,
            width: '280px',
            background: 'var(--popover, #11141d)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid var(--border, rgba(255, 255, 255, 0.14))',
            borderRadius: '10px',
            padding: '12px',
            boxShadow: '0 16px 40px rgba(0, 0, 0, 0.5), 0 0 1px rgba(255, 255, 255, 0.2)',
            animation: 'shadcnPopFade 0.15s ease-out'
          }}
        >
          {/* Quick Preset Buttons */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              marginBottom: '10px',
              paddingBottom: '8px',
              borderBottom: '1px solid var(--border, rgba(255, 255, 255, 0.08))',
              overflowX: 'auto'
            }}
          >
            <button
              type="button"
              onClick={setPresetToday}
              className="shadcn-date-chip"
              style={{
                background: isToday ? 'var(--primary, #38bdf8)' : 'var(--secondary, rgba(255, 255, 255, 0.06))',
                color: isToday ? '#090d16' : 'var(--foreground, #f8fafc)',
                border: 'none',
                borderRadius: '5px',
                padding: '3px 8px',
                fontSize: '10.5px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              Today
            </button>
            <button
              type="button"
              onClick={setPresetYesterday}
              className="shadcn-date-chip"
              style={{
                background: 'var(--secondary, rgba(255, 255, 255, 0.06))',
                color: 'var(--foreground, #f8fafc)',
                border: 'none',
                borderRadius: '5px',
                padding: '3px 8px',
                fontSize: '10.5px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Yesterday
            </button>
            <button
              type="button"
              onClick={() => setRelativeDay(-1)}
              className="shadcn-date-chip"
              style={{
                background: 'var(--secondary, rgba(255, 255, 255, 0.06))',
                color: 'var(--foreground, #f8fafc)',
                border: 'none',
                borderRadius: '5px',
                padding: '3px 8px',
                fontSize: '10.5px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
              title="Previous Day (-1)"
            >
              -1 Day
            </button>
            <button
              type="button"
              onClick={() => setRelativeDay(1)}
              className="shadcn-date-chip"
              style={{
                background: 'var(--secondary, rgba(255, 255, 255, 0.06))',
                color: 'var(--foreground, #f8fafc)',
                border: 'none',
                borderRadius: '5px',
                padding: '3px 8px',
                fontSize: '10.5px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
              title="Next Day (+1)"
            >
              +1 Day
            </button>
          </div>

          {/* Month & Year Navigation */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '10px'
            }}
          >
            <button
              type="button"
              onClick={handlePrevMonth}
              style={{
                background: 'transparent',
                border: '1px solid var(--border, rgba(255, 255, 255, 0.1))',
                borderRadius: '6px',
                width: '26px',
                height: '26px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'var(--foreground, #f8fafc)'
              }}
            >
              <ChevronLeft size={14} />
            </button>

            <span
              style={{
                fontSize: '12px',
                fontWeight: 700,
                color: 'var(--foreground, #f8fafc)',
                letterSpacing: '0.3px'
              }}
            >
              {MONTH_NAMES[viewMonth - 1]} {viewYear}
            </span>

            <button
              type="button"
              onClick={handleNextMonth}
              style={{
                background: 'transparent',
                border: '1px solid var(--border, rgba(255, 255, 255, 0.1))',
                borderRadius: '6px',
                width: '26px',
                height: '26px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'var(--foreground, #f8fafc)'
              }}
            >
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Weekday headers */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              textAlign: 'center',
              marginBottom: '6px'
            }}
          >
            {DAYS_OF_WEEK.map(d => (
              <span
                key={d}
                style={{
                  fontSize: '10px',
                  fontWeight: 600,
                  color: 'var(--muted-foreground, #94a3b8)',
                  padding: '2px 0'
                }}
              >
                {d}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: '2px'
            }}
          >
            {/* Trailing days from previous month */}
            {prevMonthDays.map(d => {
              const m = viewMonth === 1 ? 12 : viewMonth - 1;
              const y = viewMonth === 1 ? viewYear - 1 : viewYear;
              return (
                <button
                  key={`prev-${d}`}
                  type="button"
                  onClick={() => selectDate(y, m, d)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    borderRadius: '6px',
                    height: '28px',
                    fontSize: '11px',
                    color: 'var(--muted-foreground, rgba(255, 255, 255, 0.25))',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {d}
                </button>
              );
            })}

            {/* Current month days */}
            {currentMonthDays.map(d => {
              const iso = toIsoString(viewYear, viewMonth, d);
              const isSelected = value === iso;
              const isCurrToday = iso === todayStr;

              return (
                <button
                  key={`curr-${d}`}
                  type="button"
                  onClick={() => selectDate(viewYear, viewMonth, d)}
                  style={{
                    position: 'relative',
                    background: isSelected
                      ? 'var(--primary, #38bdf8)'
                      : isCurrToday
                      ? 'var(--accent, rgba(56, 189, 248, 0.15))'
                      : 'transparent',
                    color: isSelected
                      ? '#090d16'
                      : isCurrToday
                      ? 'var(--primary, #38bdf8)'
                      : 'var(--foreground, #f8fafc)',
                    border: isCurrToday && !isSelected ? '1px solid var(--primary, #38bdf8)' : 'none',
                    borderRadius: '6px',
                    height: '28px',
                    fontSize: '11px',
                    fontWeight: isSelected || isCurrToday ? 700 : 500,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.12s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = 'var(--secondary, rgba(255, 255, 255, 0.1))';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = isCurrToday ? 'var(--accent, rgba(56, 189, 248, 0.15))' : 'transparent';
                    }
                  }}
                >
                  {d}
                </button>
              );
            })}

            {/* Leading days from next month */}
            {nextMonthDays.map(d => {
              const m = viewMonth === 12 ? 1 : viewMonth + 1;
              const y = viewMonth === 12 ? viewYear + 1 : viewYear;
              return (
                <button
                  key={`next-${d}`}
                  type="button"
                  onClick={() => selectDate(y, m, d)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    borderRadius: '6px',
                    height: '28px',
                    fontSize: '11px',
                    color: 'var(--muted-foreground, rgba(255, 255, 255, 0.25))',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {d}
                </button>
              );
            })}
          </div>

          {/* Footer with selected date and close button */}
          <div
            style={{
              marginTop: '10px',
              paddingTop: '8px',
              borderTop: '1px solid var(--border, rgba(255, 255, 255, 0.08))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '10.5px'
            }}
          >
            <span style={{ color: 'var(--muted-foreground, #94a3b8)' }}>
              Selected: <strong style={{ color: 'var(--foreground, #f8fafc)' }}>{formatDisplayDate(value)}</strong>
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--primary, #38bdf8)',
                fontWeight: 700,
                cursor: 'pointer',
                padding: '2px 6px'
              }}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

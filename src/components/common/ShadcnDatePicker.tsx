import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
  Check
} from 'lucide-react';
import { macAudio } from '../../utils/macAudio';

// =========================================================================
// TYPES & CONSTANTS
// =========================================================================
export interface ShadcnDatePickerProps {
  value: string; // YYYY-MM-DD or empty
  onChange: (val: string) => void;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
  placeholder?: string;
  id?: string;
  size?: 'sm' | 'default' | 'lg';
  align?: 'start' | 'end' | 'center';
  clearable?: boolean;
  showPresets?: boolean;
  onEnterNext?: () => void;
}

export interface ShadcnDateRangePickerProps {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  onChange: (range: { startDate: string; endDate: string }) => void;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
  placeholder?: string;
  id?: string;
  size?: 'sm' | 'default' | 'lg';
  align?: 'start' | 'end' | 'center';
  showPresets?: boolean;
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
  if (!dateStr) return '';
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

function getTodayIso(): string {
  const now = new Date();
  return toIsoString(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

// =========================================================================
// 1. SINGLE DATE PICKER (ui.shadcn.com/docs/components/date-picker)
// =========================================================================
export const ShadcnDatePicker: React.FC<ShadcnDatePickerProps> = ({
  value,
  onChange,
  disabled = false,
  className = '',
  style,
  placeholder = 'Pick a date',
  id,
  size = 'default',
  align = 'start',
  clearable = true,
  showPresets = true,
  onEnterNext
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'days' | 'months' | 'years'>('days');
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Initial date parse
  const initialDate = useMemo(() => {
    if (value) {
      const [y, m, d] = value.split('-').map(Number);
      if (y && m && d) return new Date(y, m - 1, d);
    }
    return new Date();
  }, [value]);

  const [viewYear, setViewYear] = useState<number>(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(initialDate.getMonth() + 1); // 1-12

  // Sync internal view when value changes
  useEffect(() => {
    if (value) {
      const [y, m, d] = value.split('-').map(Number);
      if (y && m && d) {
        setViewYear(y);
        setViewMonth(m);
      }
    }
  }, [value]);

  // Viewport coordinates for fixed portal
  const [coords, setCoords] = useState<{ top: number; left: number; openUpward: boolean }>({
    top: 0,
    left: 0,
    openUpward: false
  });

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const popoverHeight = 350;
    const popoverWidth = 280;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUpward = spaceBelow < popoverHeight && rect.top > popoverHeight;

    let left = rect.left;
    if (align === 'end') {
      left = rect.right - popoverWidth;
    } else if (align === 'center') {
      left = rect.left + rect.width / 2 - popoverWidth / 2;
    }

    // Keep within window
    if (left + popoverWidth > window.innerWidth - 10) {
      left = window.innerWidth - popoverWidth - 10;
    }
    if (left < 10) left = 10;

    setCoords({
      top: openUpward ? rect.top - 6 : rect.bottom + 6,
      left,
      openUpward
    });
  }, [align]);

  useEffect(() => {
    if (isOpen) {
      updatePosition();
      const handleScroll = () => updatePosition();
      const handleResize = () => updatePosition();
      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', handleResize);
      return () => {
        window.removeEventListener('scroll', handleScroll, true);
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [isOpen, updatePosition]);

  // Click outside to close
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        popoverRef.current &&
        !popoverRef.current.contains(target)
      ) {
        setIsOpen(false);
        setViewMode('days');
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  // Escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        setViewMode('days');
        triggerRef.current?.focus();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Calendar calculations
  const daysInMonth = new Date(viewYear, viewMonth, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth - 1, 1).getDay();
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
      setViewYear((prev) => prev - 1);
    } else {
      setViewMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    macAudio.playClick();
    if (viewMonth === 12) {
      setViewMonth(1);
      setViewYear((prev) => prev + 1);
    } else {
      setViewMonth((prev) => prev + 1);
    }
  };

  const selectDate = (y: number, m: number, d: number) => {
    macAudio.playClick();
    const iso = toIsoString(y, m, d);
    onChange(iso);
    setIsOpen(false);
    setViewMode('days');
    onEnterNext?.();
  };

  const handleClear = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    macAudio.playClick();
    onChange('');
  };

  const todayIso = getTodayIso();
  const isToday = value === todayIso;

  // Preset handlers
  const setPresetToday = () => {
    const now = new Date();
    selectDate(now.getFullYear(), now.getMonth() + 1, now.getDate());
  };

  const setPresetYesterday = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    selectDate(d.getFullYear(), d.getMonth() + 1, d.getDate());
  };

  const setPresetTomorrow = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    selectDate(d.getFullYear(), d.getMonth() + 1, d.getDate());
  };

  // Dimensions based on size
  const heightStyle = size === 'sm' ? '32px' : size === 'lg' ? '40px' : '36px';
  const fontSizeStyle = size === 'sm' ? '12px' : size === 'lg' ? '14px' : '13px';
  const paddingStyle = size === 'sm' ? '0 9px' : size === 'lg' ? '0 14px' : '0 12px';

  return (
    <div
      className={`shadcn-datepicker-root ${className}`}
      style={{
        position: 'relative',
        display: 'inline-block',
        verticalAlign: 'middle',
        ...style
      }}
    >
      {/* Trigger Button - Shadcn UI variant="outline" */}
      <button
        ref={triggerRef}
        id={id}
        data-np-target={id === 'header-date-picker' ? '1-5' : undefined}
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!disabled) {
            macAudio.playClick();
            setIsOpen((prev) => !prev);
            setViewMode('days');
          }
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            if (isOpen) setIsOpen(false);
            onEnterNext?.();
          } else if (e.key === ' ' || e.key === 'ArrowDown') {
            e.preventDefault();
            setIsOpen(true);
          }
        }}
        className="shadcn-date-trigger group"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: heightStyle,
          padding: paddingStyle,
          background: 'var(--input, #09090b)',
          border: isOpen
            ? '1px solid var(--ring, #38bdf8)'
            : '1px solid var(--border, #27272a)',
          borderRadius: '6px',
          color: value ? 'var(--foreground, #f4f4f5)' : 'var(--muted-foreground, #71717a)',
          fontSize: fontSizeStyle,
          fontWeight: 400,
          cursor: disabled ? 'not-allowed' : 'pointer',
          outline: 'none',
          transition: 'all 0.15s ease',
          boxShadow: isOpen
            ? '0 0 0 2px rgba(56, 189, 248, 0.25)'
            : '0 1px 2px rgba(0, 0, 0, 0.1)',
          userSelect: 'none',
          gap: '8px',
          minWidth: size === 'sm' ? '130px' : '150px',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }}
        onMouseEnter={(e) => {
          if (!disabled && !isOpen) {
            e.currentTarget.style.borderColor = '#3f3f46';
            e.currentTarget.style.background = '#18181b';
          }
        }}
        onMouseLeave={(e) => {
          if (!disabled && !isOpen) {
            e.currentTarget.style.borderColor = 'var(--border, #27272a)';
            e.currentTarget.style.background = 'var(--input, #09090b)';
          }
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
          <CalendarIcon
            size={size === 'sm' ? 13 : 15}
            style={{
              color: value ? 'var(--primary, #38bdf8)' : '#a1a1aa',
              flexShrink: 0
            }}
          />
          <span
            style={{
              letterSpacing: '0.1px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {value ? formatDisplayDate(value) : placeholder}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {isToday && (
            <span
              style={{
                fontSize: '9.5px',
                fontWeight: 600,
                padding: '1px 5px',
                borderRadius: '4px',
                background: 'rgba(56, 189, 248, 0.12)',
                color: 'var(--primary, #38bdf8)',
                letterSpacing: '0.2px'
              }}
            >
              Today
            </span>
          )}

          {clearable && value && !disabled && (
            <span
              role="button"
              tabIndex={-1}
              onClick={handleClear}
              title="Clear date"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                color: '#71717a',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#f4f4f5';
                e.currentTarget.style.background = '#27272a';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#71717a';
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <X size={11} />
            </span>
          )}
        </div>
      </button>

      {/* Floating Popover mounted via Portal */}
      {isOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={popoverRef}
            className="shadcn-date-popover"
            style={{
              position: 'fixed',
              top: coords.openUpward ? 'auto' : `${coords.top}px`,
              bottom: coords.openUpward ? `${Math.max(8, window.innerHeight - coords.top)}px` : 'auto',
              left: `${coords.left}px`,
              zIndex: 99999999,
              width: '280px',
              background: '#09090b',
              border: '1px solid #27272a',
              borderRadius: '8px',
              padding: '12px',
              boxShadow: '0 12px 32px rgba(0, 0, 0, 0.85), 0 0 1px rgba(255, 255, 255, 0.15)',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              animation: 'shadcnSelectFadeIn 0.12s ease-out',
              boxSizing: 'border-box'
            }}
          >
            {/* Quick Presets Bar */}
            {showPresets && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  marginBottom: '10px',
                  paddingBottom: '8px',
                  borderBottom: '1px solid #27272a',
                  overflowX: 'auto'
                }}
              >
                <button
                  type="button"
                  onClick={setPresetToday}
                  style={{
                    background: isToday ? '#ffffff' : '#18181b',
                    color: isToday ? '#09090b' : '#f4f4f5',
                    border: '1px solid #27272a',
                    borderRadius: '5px',
                    padding: '3px 8px',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.12s ease'
                  }}
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={setPresetYesterday}
                  style={{
                    background: '#18181b',
                    color: '#f4f4f5',
                    border: '1px solid #27272a',
                    borderRadius: '5px',
                    padding: '3px 8px',
                    fontSize: '11px',
                    fontWeight: 500,
                    cursor: 'pointer'
                  }}
                >
                  Yesterday
                </button>
                <button
                  type="button"
                  onClick={setPresetTomorrow}
                  style={{
                    background: '#18181b',
                    color: '#f4f4f5',
                    border: '1px solid #27272a',
                    borderRadius: '5px',
                    padding: '3px 8px',
                    fontSize: '11px',
                    fontWeight: 500,
                    cursor: 'pointer'
                  }}
                >
                  Tomorrow
                </button>
                {value && (
                  <button
                    type="button"
                    onClick={() => handleClear()}
                    style={{
                      background: 'transparent',
                      color: '#ef4444',
                      border: '1px solid rgba(239, 68, 68, 0.2)',
                      borderRadius: '5px',
                      padding: '3px 8px',
                      fontSize: '11px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      marginLeft: 'auto'
                    }}
                  >
                    Clear
                  </button>
                )}
              </div>
            )}

            {/* Header: Month / Year / Chevrons */}
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
                title="Previous month"
                style={{
                  background: 'transparent',
                  border: '1px solid #27272a',
                  borderRadius: '6px',
                  width: '28px',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#f4f4f5',
                  transition: 'background 0.12s'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#27272a')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <ChevronLeft size={14} />
              </button>

              <button
                type="button"
                onClick={() => setViewMode(viewMode === 'days' ? 'years' : 'days')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#f4f4f5',
                  letterSpacing: '0.2px',
                  cursor: 'pointer',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#18181b')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                {MONTH_NAMES[viewMonth - 1]} {viewYear}
              </button>

              <button
                type="button"
                onClick={handleNextMonth}
                title="Next month"
                style={{
                  background: 'transparent',
                  border: '1px solid #27272a',
                  borderRadius: '6px',
                  width: '28px',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#f4f4f5',
                  transition: 'background 0.12s'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#27272a')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <ChevronRight size={14} />
              </button>
            </div>

            {/* Quick Year Selection Mode */}
            {viewMode === 'years' ? (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '6px',
                  padding: '6px 0',
                  maxHeight: '190px',
                  overflowY: 'auto'
                }}
              >
                {Array.from({ length: 16 }, (_, i) => viewYear - 7 + i).map((y) => (
                  <button
                    key={y}
                    type="button"
                    onClick={() => {
                      setViewYear(y);
                      setViewMode('days');
                    }}
                    style={{
                      background: y === viewYear ? '#ffffff' : '#18181b',
                      color: y === viewYear ? '#09090b' : '#f4f4f5',
                      border: '1px solid #27272a',
                      borderRadius: '6px',
                      padding: '8px 0',
                      fontSize: '12px',
                      fontWeight: y === viewYear ? 700 : 500,
                      cursor: 'pointer'
                    }}
                  >
                    {y}
                  </button>
                ))}
              </div>
            ) : (
              <>
                {/* Weekdays */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(7, 1fr)',
                    textAlign: 'center',
                    marginBottom: '4px'
                  }}
                >
                  {DAYS_OF_WEEK.map((d) => (
                    <span
                      key={d}
                      style={{
                        fontSize: '11px',
                        fontWeight: 500,
                        color: '#71717a',
                        padding: '4px 0',
                        textTransform: 'uppercase'
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
                  {/* Prev Month Days */}
                  {prevMonthDays.map((d) => {
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
                          height: '32px',
                          fontSize: '12px',
                          color: '#52525b',
                          opacity: 0.4,
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

                  {/* Current Month Days */}
                  {currentMonthDays.map((d) => {
                    const iso = toIsoString(viewYear, viewMonth, d);
                    const isSelected = value === iso;
                    const isCurrToday = iso === todayIso;

                    return (
                      <button
                        key={`curr-${d}`}
                        type="button"
                        onClick={() => selectDate(viewYear, viewMonth, d)}
                        style={{
                          position: 'relative',
                          background: isSelected
                            ? '#ffffff'
                            : 'transparent',
                          color: isSelected
                            ? '#09090b'
                            : isCurrToday
                            ? '#38bdf8'
                            : '#f4f4f5',
                          border: isCurrToday && !isSelected ? '1px solid #38bdf8' : 'none',
                          borderRadius: '6px',
                          height: '32px',
                          fontSize: '12px',
                          fontWeight: isSelected ? 700 : isCurrToday ? 600 : 400,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.12s ease'
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.background = '#27272a';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.background = 'transparent';
                          }
                        }}
                      >
                        {d}
                      </button>
                    );
                  })}

                  {/* Next Month Days */}
                  {nextMonthDays.map((d) => {
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
                          height: '32px',
                          fontSize: '12px',
                          color: '#52525b',
                          opacity: 0.4,
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
              </>
            )}

            {/* Footer */}
            <div
              style={{
                marginTop: '10px',
                paddingTop: '8px',
                borderTop: '1px solid #27272a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '11px'
              }}
            >
              <span style={{ color: '#71717a' }}>
                {value ? (
                  <>
                    Selected: <strong style={{ color: '#f4f4f5' }}>{formatDisplayDate(value)}</strong>
                  </>
                ) : (
                  'No date selected'
                )}
              </span>
              <button
                type="button"
                onClick={() => {
                  macAudio.playClick();
                  setIsOpen(false);
                }}
                style={{
                  background: '#27272a',
                  border: 'none',
                  borderRadius: '4px',
                  color: '#f4f4f5',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: '3px 8px'
                }}
              >
                Close
              </button>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

// =========================================================================
// 2. DATE RANGE PICKER (ui.shadcn.com/docs/components/date-range-picker)
// =========================================================================
export const ShadcnDateRangePicker: React.FC<ShadcnDateRangePickerProps> = ({
  startDate,
  endDate,
  onChange,
  disabled = false,
  className = '',
  style,
  placeholder = 'Select date range',
  id,
  size = 'default',
  align = 'start',
  showPresets = true
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hoverDate, setHoverDate] = useState<string | null>(null);
  const [pickingStart, setPickingStart] = useState<boolean>(true);
  const [tempStart, setTempStart] = useState<string>(startDate);
  const [tempEnd, setTempEnd] = useState<string>(endDate);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Month navigation
  const initialDate = useMemo(() => {
    if (startDate) {
      const [y, m, d] = startDate.split('-').map(Number);
      if (y && m && d) return new Date(y, m - 1, d);
    }
    return new Date();
  }, [startDate]);

  const [viewYear, setViewYear] = useState<number>(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(initialDate.getMonth() + 1);

  // Sync internal view when startDate/endDate change
  useEffect(() => {
    setTempStart(startDate);
    setTempEnd(endDate);
    if (startDate) {
      const [y, m, d] = startDate.split('-').map(Number);
      if (y && m && d) {
        setViewYear(y);
        setViewMonth(m);
      }
    }
  }, [startDate, endDate]);

  // Coordinates
  const [coords, setCoords] = useState<{ top: number; left: number; openUpward: boolean }>({
    top: 0,
    left: 0,
    openUpward: false
  });

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const popoverHeight = 360;
    const popoverWidth = 320;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUpward = spaceBelow < popoverHeight && rect.top > popoverHeight;

    let left = rect.left;
    if (align === 'end') {
      left = rect.right - popoverWidth;
    } else if (align === 'center') {
      left = rect.left + rect.width / 2 - popoverWidth / 2;
    }

    if (left + popoverWidth > window.innerWidth - 10) {
      left = window.innerWidth - popoverWidth - 10;
    }
    if (left < 10) left = 10;

    setCoords({
      top: openUpward ? rect.top - 6 : rect.bottom + 6,
      left,
      openUpward
    });
  }, [align]);

  useEffect(() => {
    if (isOpen) {
      updatePosition();
      const handleScroll = () => updatePosition();
      const handleResize = () => updatePosition();
      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', handleResize);
      return () => {
        window.removeEventListener('scroll', handleScroll, true);
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [isOpen, updatePosition]);

  // Outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        popoverRef.current &&
        !popoverRef.current.contains(target)
      ) {
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

  const daysInMonth = new Date(viewYear, viewMonth, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth - 1, 1).getDay();
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
      setViewYear((prev) => prev - 1);
    } else {
      setViewMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    macAudio.playClick();
    if (viewMonth === 12) {
      setViewMonth(1);
      setViewYear((prev) => prev + 1);
    } else {
      setViewMonth((prev) => prev + 1);
    }
  };

  const handleDayClick = (iso: string) => {
    macAudio.playClick();
    if (pickingStart || !tempStart || (tempStart && tempEnd)) {
      setTempStart(iso);
      setTempEnd('');
      setPickingStart(false);
    } else {
      let s = tempStart;
      let e = iso;
      if (e < s) {
        const swap = s;
        s = e;
        e = swap;
      }
      setTempStart(s);
      setTempEnd(e);
      setPickingStart(true);
      onChange({ startDate: s, endDate: e });
      setIsOpen(false);
    }
  };

  // Range Presets
  const applyPreset = (daysBack: number) => {
    macAudio.playClick();
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - daysBack);
    const sIso = toIsoString(start.getFullYear(), start.getMonth() + 1, start.getDate());
    const eIso = toIsoString(end.getFullYear(), end.getMonth() + 1, end.getDate());
    setTempStart(sIso);
    setTempEnd(eIso);
    onChange({ startDate: sIso, endDate: eIso });
    setIsOpen(false);
  };

  const applyThisMonth = () => {
    macAudio.playClick();
    const now = new Date();
    const sIso = toIsoString(now.getFullYear(), now.getMonth() + 1, 1);
    const eIso = toIsoString(now.getFullYear(), now.getMonth() + 1, now.getDate());
    setTempStart(sIso);
    setTempEnd(eIso);
    onChange({ startDate: sIso, endDate: eIso });
    setIsOpen(false);
  };

  const heightStyle = size === 'sm' ? '32px' : size === 'lg' ? '40px' : '36px';
  const fontSizeStyle = size === 'sm' ? '12px' : size === 'lg' ? '14px' : '13px';
  const paddingStyle = size === 'sm' ? '0 9px' : size === 'lg' ? '0 14px' : '0 12px';

  const displayRangeText = useMemo(() => {
    if (startDate && endDate) {
      return `${formatDisplayDate(startDate)} – ${formatDisplayDate(endDate)}`;
    }
    if (startDate) {
      return `${formatDisplayDate(startDate)} – ...`;
    }
    return placeholder;
  }, [startDate, endDate, placeholder]);

  return (
    <div
      className={`shadcn-daterangepicker-root ${className}`}
      style={{
        position: 'relative',
        display: 'inline-block',
        verticalAlign: 'middle',
        ...style
      }}
    >
      <button
        ref={triggerRef}
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!disabled) {
            macAudio.playClick();
            setIsOpen((prev) => !prev);
          }
        }}
        className="shadcn-date-trigger group"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: heightStyle,
          padding: paddingStyle,
          background: 'var(--input, #09090b)',
          border: isOpen ? '1px solid var(--ring, #38bdf8)' : '1px solid var(--border, #27272a)',
          borderRadius: '6px',
          color: startDate ? '#f4f4f5' : '#71717a',
          fontSize: fontSizeStyle,
          fontWeight: 400,
          cursor: disabled ? 'not-allowed' : 'pointer',
          outline: 'none',
          transition: 'all 0.15s ease',
          boxShadow: isOpen ? '0 0 0 2px rgba(56, 189, 248, 0.25)' : '0 1px 2px rgba(0, 0, 0, 0.1)',
          userSelect: 'none',
          gap: '8px',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }}
        onMouseEnter={(e) => {
          if (!disabled && !isOpen) {
            e.currentTarget.style.borderColor = '#3f3f46';
            e.currentTarget.style.background = '#18181b';
          }
        }}
        onMouseLeave={(e) => {
          if (!disabled && !isOpen) {
            e.currentTarget.style.borderColor = 'var(--border, #27272a)';
            e.currentTarget.style.background = 'var(--input, #09090b)';
          }
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CalendarIcon
            size={size === 'sm' ? 13 : 15}
            style={{ color: startDate ? 'var(--primary, #38bdf8)' : '#a1a1aa', flexShrink: 0 }}
          />
          <span style={{ letterSpacing: '0.1px', whiteSpace: 'nowrap' }}>{displayRangeText}</span>
        </div>
      </button>

      {/* Floating Popover */}
      {isOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={popoverRef}
            className="shadcn-date-popover"
            style={{
              position: 'fixed',
              top: coords.openUpward ? 'auto' : `${coords.top}px`,
              bottom: coords.openUpward ? `${Math.max(8, window.innerHeight - coords.top)}px` : 'auto',
              left: `${coords.left}px`,
              zIndex: 99999999,
              width: '320px',
              background: '#09090b',
              border: '1px solid #27272a',
              borderRadius: '8px',
              padding: '12px',
              boxShadow: '0 12px 32px rgba(0, 0, 0, 0.85), 0 0 1px rgba(255, 255, 255, 0.15)',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              animation: 'shadcnSelectFadeIn 0.12s ease-out',
              boxSizing: 'border-box'
            }}
          >
            {/* Presets */}
            {showPresets && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  marginBottom: '10px',
                  paddingBottom: '8px',
                  borderBottom: '1px solid #27272a',
                  flexWrap: 'wrap'
                }}
              >
                <button
                  type="button"
                  onClick={() => applyPreset(0)}
                  style={{
                    background: '#18181b',
                    color: '#f4f4f5',
                    border: '1px solid #27272a',
                    borderRadius: '5px',
                    padding: '3px 7px',
                    fontSize: '11px',
                    fontWeight: 500,
                    cursor: 'pointer'
                  }}
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset(7)}
                  style={{
                    background: '#18181b',
                    color: '#f4f4f5',
                    border: '1px solid #27272a',
                    borderRadius: '5px',
                    padding: '3px 7px',
                    fontSize: '11px',
                    fontWeight: 500,
                    cursor: 'pointer'
                  }}
                >
                  Last 7 Days
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset(30)}
                  style={{
                    background: '#18181b',
                    color: '#f4f4f5',
                    border: '1px solid #27272a',
                    borderRadius: '5px',
                    padding: '3px 7px',
                    fontSize: '11px',
                    fontWeight: 500,
                    cursor: 'pointer'
                  }}
                >
                  Last 30 Days
                </button>
                <button
                  type="button"
                  onClick={applyThisMonth}
                  style={{
                    background: '#18181b',
                    color: '#f4f4f5',
                    border: '1px solid #27272a',
                    borderRadius: '5px',
                    padding: '3px 7px',
                    fontSize: '11px',
                    fontWeight: 500,
                    cursor: 'pointer'
                  }}
                >
                  This Month
                </button>
              </div>
            )}

            {/* Navigation Header */}
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
                  border: '1px solid #27272a',
                  borderRadius: '6px',
                  width: '28px',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#f4f4f5'
                }}
              >
                <ChevronLeft size={14} />
              </button>

              <span style={{ fontSize: '13px', fontWeight: 600, color: '#f4f4f5' }}>
                {MONTH_NAMES[viewMonth - 1]} {viewYear}
              </span>

              <button
                type="button"
                onClick={handleNextMonth}
                style={{
                  background: 'transparent',
                  border: '1px solid #27272a',
                  borderRadius: '6px',
                  width: '28px',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#f4f4f5'
                }}
              >
                <ChevronRight size={14} />
              </button>
            </div>

            {/* Weekdays */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                textAlign: 'center',
                marginBottom: '4px'
              }}
            >
              {DAYS_OF_WEEK.map((d) => (
                <span
                  key={d}
                  style={{
                    fontSize: '11px',
                    fontWeight: 500,
                    color: '#71717a',
                    padding: '4px 0',
                    textTransform: 'uppercase'
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
              {prevMonthDays.map((d) => (
                <div
                  key={`prev-${d}`}
                  style={{
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#52525b',
                    opacity: 0.35,
                    fontSize: '12px'
                  }}
                >
                  {d}
                </div>
              ))}

              {currentMonthDays.map((d) => {
                const iso = toIsoString(viewYear, viewMonth, d);
                const isStart = tempStart === iso;
                const isEnd = tempEnd === iso;
                const isInRange =
                  tempStart &&
                  tempEnd &&
                  iso > tempStart &&
                  iso < tempEnd;
                const isHoverRange =
                  tempStart &&
                  !tempEnd &&
                  hoverDate &&
                  ((iso > tempStart && iso <= hoverDate) || (iso < tempStart && iso >= hoverDate));

                return (
                  <button
                    key={`curr-${d}`}
                    type="button"
                    onClick={() => handleDayClick(iso)}
                    onMouseEnter={() => setHoverDate(iso)}
                    style={{
                      position: 'relative',
                      background: isStart || isEnd
                        ? '#ffffff'
                        : isInRange || isHoverRange
                        ? 'rgba(56, 189, 248, 0.15)'
                        : 'transparent',
                      color: isStart || isEnd
                        ? '#09090b'
                        : isInRange || isHoverRange
                        ? '#38bdf8'
                        : '#f4f4f5',
                      border: 'none',
                      borderRadius: isStart ? '6px 0 0 6px' : isEnd ? '0 6px 6px 0' : isInRange ? '0' : '6px',
                      height: '32px',
                      fontSize: '12px',
                      fontWeight: isStart || isEnd ? 700 : 400,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'background 0.1s ease'
                    }}
                  >
                    {d}
                  </button>
                );
              })}

              {nextMonthDays.map((d) => (
                <div
                  key={`next-${d}`}
                  style={{
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#52525b',
                    opacity: 0.35,
                    fontSize: '12px'
                  }}
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Footer */}
            <div
              style={{
                marginTop: '10px',
                paddingTop: '8px',
                borderTop: '1px solid #27272a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '11px'
              }}
            >
              <span style={{ color: '#71717a' }}>
                {tempStart && !tempEnd ? 'Select end date' : displayRangeText}
              </span>
              <button
                type="button"
                onClick={() => {
                  macAudio.playClick();
                  setIsOpen(false);
                }}
                style={{
                  background: '#27272a',
                  border: 'none',
                  borderRadius: '4px',
                  color: '#f4f4f5',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: '3px 8px'
                }}
              >
                Done
              </button>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

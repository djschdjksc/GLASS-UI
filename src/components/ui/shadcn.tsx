import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';

// =========================================================================
// 1. BUTTON COMPONENT (ui.shadcn.com/docs/components/button)
// =========================================================================
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'default', size = 'default', className = '', style, children, ...props }, ref) => {
    const baseStyle: React.CSSProperties = {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '6px',
      fontSize: size === 'sm' ? '12px' : size === 'lg' ? '15px' : '13px',
      fontWeight: 500,
      cursor: props.disabled ? 'not-allowed' : 'pointer',
      opacity: props.disabled ? 0.5 : 1,
      transition: 'all 0.15s ease',
      outline: 'none',
      border: 'none',
      textDecoration: 'none',
      userSelect: 'none',
      gap: '8px',
      whiteSpace: 'nowrap',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    };

    const sizeStyles: Record<string, React.CSSProperties> = {
      default: { height: '36px', padding: '0 16px' },
      sm: { height: '32px', padding: '0 12px' },
      lg: { height: '42px', padding: '0 24px' },
      icon: { height: '36px', width: '36px', padding: 0 }
    };

    const variantStyles: Record<string, React.CSSProperties> = {
      default: {
        background: '#ffffff',
        color: '#09090b',
        boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
        fontWeight: 600
      },
      secondary: {
        background: '#27272a',
        color: '#f4f4f5'
      },
      outline: {
        background: 'transparent',
        border: '1px solid #27272a',
        color: '#f4f4f5'
      },
      ghost: {
        background: 'transparent',
        color: '#a1a1aa'
      },
      destructive: {
        background: '#ef4444',
        color: '#ffffff',
        boxShadow: '0 1px 2px rgba(239, 68, 68, 0.3)'
      },
      link: {
        background: 'transparent',
        color: '#38bdf8',
        textDecoration: 'underline'
      }
    };

    return (
      <button
        ref={ref}
        style={{
          ...baseStyle,
          ...sizeStyles[size],
          ...variantStyles[variant],
          ...style
        }}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';

// =========================================================================
// 2. INPUT COMPONENT (ui.shadcn.com/docs/components/input)
// =========================================================================
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ style, ...props }, ref) => {
    return (
      <input
        ref={ref}
        style={{
          display: 'flex',
          height: '36px',
          width: '100%',
          borderRadius: '6px',
          border: '1px solid #27272a',
          background: '#09090b',
          padding: '6px 12px',
          fontSize: '13px',
          color: '#f4f4f5',
          outline: 'none',
          boxSizing: 'border-box',
          transition: 'border-color 0.15s ease',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          ...style
        }}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

// =========================================================================
// 3. CARD COMPONENTS (ui.shadcn.com/docs/components/card)
// =========================================================================
export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ style, children, ...props }) => (
  <div
    style={{
      borderRadius: '12px',
      border: '1px solid #27272a',
      background: '#0c0a09',
      color: '#f4f4f5',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.25)',
      display: 'flex',
      flexDirection: 'column',
      boxSizing: 'border-box',
      ...style
    }}
    {...props}
  >
    {children}
  </div>
);

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ style, children, ...props }) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
      padding: '24px 24px 16px',
      ...style
    }}
    {...props}
  >
    {children}
  </div>
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ style, children, ...props }) => (
  <h3
    style={{
      fontSize: '16px',
      fontWeight: 600,
      letterSpacing: '-0.3px',
      color: '#f4f4f5',
      margin: 0,
      lineHeight: 1.2,
      ...style
    }}
    {...props}
  >
    {children}
  </h3>
);

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({ style, children, ...props }) => (
  <p
    style={{
      fontSize: '13px',
      color: '#a1a1aa',
      margin: 0,
      lineHeight: 1.4,
      ...style
    }}
    {...props}
  >
    {children}
  </p>
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ style, children, ...props }) => (
  <div
    style={{
      padding: '0 24px 24px',
      ...style
    }}
    {...props}
  >
    {children}
  </div>
);

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ style, children, ...props }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      padding: '0 24px 24px',
      ...style
    }}
    {...props}
  >
    {children}
  </div>
);

// =========================================================================
// 4. TABS COMPONENTS (ui.shadcn.com/docs/components/tabs)
// =========================================================================
interface TabsContextValue {
  value: string;
  onValueChange: (val: string) => void;
}

const TabsContext = React.createContext<TabsContextValue | null>(null);

export interface TabsProps {
  value: string;
  onValueChange: (val: string) => void;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export const Tabs: React.FC<TabsProps> = ({ value, onValueChange, children, style }) => (
  <TabsContext.Provider value={{ value, onValueChange }}>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', ...style }}>{children}</div>
  </TabsContext.Provider>
);

export const TabsList: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ style, children, ...props }) => (
  <div
    style={{
      display: 'inline-flex',
      height: '38px',
      alignItems: 'center',
      justifyContent: 'flex-start',
      borderRadius: '8px',
      background: '#18181b',
      padding: '3px',
      border: '1px solid #27272a',
      width: 'fit-content',
      ...style
    }}
    {...props}
  >
    {children}
  </div>
);

export interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
}

export const TabsTrigger: React.FC<TabsTriggerProps> = ({ value, style, children, ...props }) => {
  const ctx = React.useContext(TabsContext);
  const isActive = ctx?.value === value;

  return (
    <button
      type="button"
      onClick={() => ctx?.onValueChange(value)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        whiteSpace: 'nowrap',
        borderRadius: '6px',
        padding: '5px 14px',
        fontSize: '13px',
        fontWeight: isActive ? 600 : 500,
        color: isActive ? '#f4f4f5' : '#a1a1aa',
        background: isActive ? '#09090b' : 'transparent',
        boxShadow: isActive ? '0 1px 3px rgba(0, 0, 0, 0.4)' : 'none',
        border: isActive ? '1px solid #27272a' : '1px solid transparent',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        outline: 'none',
        ...style
      }}
      {...props}
    >
      {children}
    </button>
  );
};

export interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

export const TabsContent: React.FC<TabsContentProps> = ({ value, style, children, ...props }) => {
  const ctx = React.useContext(TabsContext);
  if (ctx?.value !== value) return null;

  return (
    <div style={{ outline: 'none', ...style }} {...props}>
      {children}
    </div>
  );
};

// =========================================================================
// 5. SWITCH COMPONENT (ui.shadcn.com/docs/components/switch)
// =========================================================================
export interface ShadcnSwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}

export const Switch: React.FC<ShadcnSwitchProps> = ({ checked, onCheckedChange, disabled }) => {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onCheckedChange(!checked)}
      style={{
        display: 'inline-flex',
        height: '22px',
        width: '40px',
        flexShrink: 0,
        cursor: disabled ? 'not-allowed' : 'pointer',
        alignItems: 'center',
        borderRadius: '100px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '2px',
        transition: 'background-color 0.2s ease',
        background: checked ? '#ffffff' : '#27272a',
        outline: 'none',
        opacity: disabled ? 0.5 : 1
      }}
    >
      <span
        style={{
          display: 'block',
          height: '16px',
          width: '16px',
          borderRadius: '50%',
          background: checked ? '#09090b' : '#a1a1aa',
          boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
          transition: 'transform 0.2s ease',
          transform: checked ? 'translateX(18px)' : 'translateX(0px)'
        }}
      />
    </button>
  );
};

// =========================================================================
// 6. BADGE COMPONENT (ui.shadcn.com/docs/components/badge)
// =========================================================================
export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'destructive' | 'success';
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'default', style, children, ...props }) => {
  const variantStyles: Record<string, React.CSSProperties> = {
    default: {
      background: '#ffffff',
      color: '#09090b',
      border: 'none'
    },
    secondary: {
      background: '#27272a',
      color: '#f4f4f5',
      border: '1px solid #3f3f46'
    },
    outline: {
      background: 'transparent',
      color: '#f4f4f5',
      border: '1px solid #27272a'
    },
    destructive: {
      background: 'rgba(239, 68, 68, 0.15)',
      color: '#ef4444',
      border: '1px solid rgba(239, 68, 68, 0.3)'
    },
    success: {
      background: 'rgba(16, 185, 129, 0.15)',
      color: '#10b981',
      border: '1px solid rgba(16, 185, 129, 0.3)'
    }
  };

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        borderRadius: '100px',
        padding: '2px 8px',
        fontSize: '11px',
        fontWeight: 600,
        gap: '4px',
        ...variantStyles[variant],
        ...style
      }}
      {...props}
    >
      {children}
    </div>
  );
};

// =========================================================================
// 7. SEPARATOR COMPONENT (ui.shadcn.com/docs/components/separator)
// =========================================================================
export const Separator: React.FC<{ orientation?: 'horizontal' | 'vertical'; style?: React.CSSProperties }> = ({
  orientation = 'horizontal',
  style
}) => (
  <div
    style={{
      background: '#27272a',
      width: orientation === 'horizontal' ? '100%' : '1px',
      height: orientation === 'horizontal' ? '1px' : '100%',
      flexShrink: 0,
      ...style
    }}
  />
);

// =========================================================================
// 8. LABEL COMPONENT (ui.shadcn.com/docs/components/label)
// =========================================================================
export const Label: React.FC<React.LabelHTMLAttributes<HTMLLabelElement>> = ({ style, children, ...props }) => (
  <label
    style={{
      fontSize: '13px',
      fontWeight: 500,
      color: '#f4f4f5',
      lineHeight: 1,
      userSelect: 'none',
      ...style
    }}
    {...props}
  >
    {children}
  </label>
);

// =========================================================================
// 9. SELECT COMPONENT (ui.shadcn.com/docs/components/select)
// =========================================================================
export interface SelectOption {
  value: string;
  label: React.ReactNode;
  disabled?: boolean;
}

export interface SelectProps {
  id?: string;
  name?: string;
  value?: any;
  defaultValue?: any;
  onChange?: (e: { target: { value: string; name?: string } }) => void;
  onValueChange?: (value: string) => void;
  options?: SelectOption[];
  children?: React.ReactNode;
  placeholder?: string;
  disabled?: boolean;
  style?: React.CSSProperties;
  className?: string;
  onKeyDown?: React.KeyboardEventHandler<HTMLButtonElement>;
  size?: 'sm' | 'default';
  dropdownStyle?: React.CSSProperties;
  'data-np-target'?: string;
  [key: string]: any;
}

export const Select = React.forwardRef<HTMLButtonElement, SelectProps>(
  (
    {
      id,
      name,
      value: controlledValue,
      defaultValue,
      onChange,
      onValueChange,
      options,
      children,
      placeholder,
      disabled = false,
      style,
      className = '',
      onKeyDown,
      size = 'default',
      dropdownStyle,
      'data-np-target': dataNpTarget,
      ...restProps
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const [internalValue, setInternalValue] = useState<string>(
      controlledValue !== undefined ? String(controlledValue) : defaultValue !== undefined ? String(defaultValue) : ''
    );
    const [highlightedIdx, setHighlightedIdx] = useState<number>(-1);
    const [coords, setCoords] = useState<{ top: number; left: number; width: number; openUpward: boolean }>({
      top: 0,
      left: 0,
      width: 0,
      openUpward: false
    });

    const triggerRef = useRef<HTMLButtonElement | null>(null);
    const menuRef = useRef<HTMLDivElement | null>(null);

    // Sync controlled value
    useEffect(() => {
      if (controlledValue !== undefined) {
        setInternalValue(String(controlledValue));
      }
    }, [controlledValue]);

    // Parse options from children (<option>) or props.options
    const parsedOptions: SelectOption[] = useMemo(() => {
      if (options && options.length > 0) return options;
      const list: SelectOption[] = [];
      React.Children.forEach(children, (child) => {
        if (React.isValidElement(child)) {
          const childProps = (child as React.ReactElement<any>).props;
          if (child.type === 'option') {
            const optVal = childProps.value !== undefined ? String(childProps.value) : String(childProps.children || '');
            list.push({
              value: optVal,
              label: childProps.children ?? optVal,
              disabled: Boolean(childProps.disabled)
            });
          }
        }
      });
      return list;
    }, [options, children]);

    const activeOption = useMemo(() => {
      return parsedOptions.find((o) => String(o.value) === String(internalValue));
    }, [parsedOptions, internalValue]);

    // Position calculation
    const updatePosition = useCallback(() => {
      if (!triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      const estimatedHeight = Math.min(260, parsedOptions.length * 34 + 10);
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUpward = spaceBelow < estimatedHeight && rect.top > estimatedHeight;

      setCoords({
        top: openUpward ? rect.top - 4 : rect.bottom + 4,
        left: rect.left,
        width: rect.width,
        openUpward
      });
    }, [parsedOptions.length]);

    // Open dropdown handler
    const handleToggle = () => {
      if (disabled) return;
      if (!isOpen) {
        updatePosition();
        const curIdx = parsedOptions.findIndex((o) => String(o.value) === String(internalValue));
        setHighlightedIdx(curIdx >= 0 ? curIdx : 0);
        setIsOpen(true);
      } else {
        setIsOpen(false);
      }
    };

    // Close on outside click
    useEffect(() => {
      if (!isOpen) return;

      const handleOutsideClick = (e: MouseEvent) => {
        if (
          triggerRef.current &&
          !triggerRef.current.contains(e.target as Node) &&
          menuRef.current &&
          !menuRef.current.contains(e.target as Node)
        ) {
          setIsOpen(false);
        }
      };

      const handleScroll = (e: Event) => {
        if (menuRef.current && menuRef.current.contains(e.target as Node)) {
          return; // Allow scrolling inside the menu itself
        }
        setIsOpen(false);
      };

      const handleWindowResize = () => setIsOpen(false);

      window.addEventListener('mousedown', handleOutsideClick);
      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', handleWindowResize);

      return () => {
        window.removeEventListener('mousedown', handleOutsideClick);
        window.removeEventListener('scroll', handleScroll, true);
        window.removeEventListener('resize', handleWindowResize);
      };
    }, [isOpen]);

    // Option selection handler
    const handleSelectOption = (opt: SelectOption) => {
      if (opt.disabled) return;
      setInternalValue(opt.value);
      setIsOpen(false);

      if (onChange) {
        onChange({ target: { value: opt.value, name } });
      }
      if (onValueChange) {
        onValueChange(opt.value);
      }
      if (triggerRef.current) {
        triggerRef.current.focus();
      }
    };

    // Keyboard navigation
    const handleTriggerKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
      if (disabled) return;

      if (!isOpen) {
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          updatePosition();
          const curIdx = parsedOptions.findIndex((o) => String(o.value) === String(internalValue));
          setHighlightedIdx(curIdx >= 0 ? curIdx : 0);
          setIsOpen(true);
          return;
        }
      } else {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setHighlightedIdx((prev) => (prev < parsedOptions.length - 1 ? prev + 1 : 0));
          return;
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          setHighlightedIdx((prev) => (prev > 0 ? prev - 1 : parsedOptions.length - 1));
          return;
        }
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (highlightedIdx >= 0 && highlightedIdx < parsedOptions.length) {
            handleSelectOption(parsedOptions[highlightedIdx]);
          }
          return;
        }
        if (e.key === 'Escape' || e.key === 'Tab') {
          setIsOpen(false);
          return;
        }
      }

      if (onKeyDown) {
        onKeyDown(e);
      }
    };

    const displayText = activeOption
      ? activeOption.label
      : internalValue
      ? internalValue
      : placeholder
      ? placeholder
      : parsedOptions[0]?.label || '';

    return (
      <>
        <button
          ref={(node) => {
            triggerRef.current = node;
            if (typeof ref === 'function') ref(node);
            else if (ref) (ref as any).current = node;
          }}
          type="button"
          id={id}
          data-np-target={dataNpTarget}
          disabled={disabled}
          onClick={handleToggle}
          onKeyDown={handleTriggerKeyDown}
          className={className}
          style={{
            height: size === 'sm' ? '28px' : '32px',
            minWidth: '120px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderRadius: '6px',
            border: isOpen ? '1px solid #52525b' : '1px solid #27272a',
            background: '#09090b',
            padding: '0 10px',
            fontSize: '12px',
            fontWeight: 500,
            color: activeOption || internalValue ? '#f4f4f5' : '#71717a',
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.5 : 1,
            outline: 'none',
            userSelect: 'none',
            boxSizing: 'border-box',
            transition: 'border-color 0.15s ease, background-color 0.15s ease',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Inter", sans-serif',
            gap: '8px',
            ...style
          }}
          {...restProps}
        >
          <span
            style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              flex: 1,
              textAlign: 'left'
            }}
          >
            {displayText}
          </span>
          <ChevronDown
            size={12}
            style={{
              color: '#71717a',
              transition: 'transform 0.15s ease',
              transform: isOpen ? 'rotate(180deg)' : 'none',
              flexShrink: 0
            }}
          />
        </button>

        {/* Floating Custom Shadcn Popover Menu */}
        {isOpen &&
          typeof document !== 'undefined' &&
          createPortal(
            <div
              ref={menuRef}
              style={{
                position: 'fixed',
                top: coords.openUpward ? 'auto' : `${coords.top}px`,
                bottom: coords.openUpward ? `${Math.max(4, window.innerHeight - coords.top)}px` : 'auto',
                left: `${coords.left}px`,
                minWidth: `${Math.max(coords.width, 140)}px`,
                maxWidth: '400px',
                maxHeight: '260px',
                overflowY: 'auto',
                background: '#09090b',
                border: '1px solid #27272a',
                borderRadius: '6px',
                padding: '4px',
                boxShadow: '0 12px 32px rgba(0, 0, 0, 0.85), 0 0 1px rgba(255, 255, 255, 0.15)',
                zIndex: 99999999,
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Inter", sans-serif',
                boxSizing: 'border-box',
                animation: 'shadcnSelectFadeIn 0.1s ease-out',
                ...dropdownStyle
              }}
            >
              {parsedOptions.map((opt, idx) => {
                const isSelected = String(opt.value) === String(internalValue);
                const isHighlighted = idx === highlightedIdx;

                return (
                  <div
                    key={String(opt.value) + idx}
                    onClick={() => handleSelectOption(opt)}
                    onMouseEnter={() => setHighlightedIdx(idx)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '6px 10px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: isSelected ? 600 : 500,
                      color: opt.disabled ? '#52525b' : isSelected ? '#ffffff' : '#f4f4f5',
                      background: isHighlighted ? '#27272a' : isSelected ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
                      cursor: opt.disabled ? 'not-allowed' : 'pointer',
                      userSelect: 'none',
                      transition: 'background-color 0.1s ease',
                      gap: '8px',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{opt.label}</span>
                    {isSelected && (
                      <Check size={13} style={{ color: '#f4f4f5', flexShrink: 0, marginLeft: '6px' }} />
                    )}
                  </div>
                );
              })}
            </div>,
            document.body
          )}
      </>
    );
  }
);
Select.displayName = 'Select';

// =========================================================================
// 10. PAGINATION COMPONENT (ui.shadcn.com/docs/components/data-table)
// =========================================================================
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export interface PaginationProps {
  totalCount: number;
  pageSize: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  selectedCount?: number;
  style?: React.CSSProperties;
}

export const Pagination: React.FC<PaginationProps> = ({
  totalCount,
  pageSize,
  currentPage,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
  selectedCount = 0,
  style
}) => {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const start = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalCount);

  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null);

  const navBtn = (key: string, disabled: boolean, onClick: () => void, title: string, icon: React.ReactNode) => (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={() => setHoveredBtn(key)}
      onMouseLeave={() => setHoveredBtn(null)}
      title={title}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '28px',
        width: '28px',
        borderRadius: '5px',
        border: `1px solid ${hoveredBtn === key && !disabled ? '#52525b' : '#27272a'}`,
        background: hoveredBtn === key && !disabled ? '#27272a' : 'transparent',
        color: disabled ? '#3f3f46' : hoveredBtn === key ? '#f4f4f5' : '#a1a1aa',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        outline: 'none',
        transition: 'all 0.12s ease',
        padding: 0,
        flexShrink: 0
      }}
    >
      {icon}
    </button>
  );

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '7px 12px',
        background: '#18181b',
        borderTop: '1px solid #27272a',
        borderRadius: '0 0 8px 8px',
        gap: '12px',
        flexShrink: 0,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Inter", sans-serif',
        ...style
      }}
    >
      {/* LEFT: Rows per page + row count info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {onPageSizeChange && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', whiteSpace: 'nowrap' }}>
            <span style={{ fontSize: '12px', color: '#71717a' }}>Rows per page</span>
            <Select
              value={String(pageSize)}
              onValueChange={(v: string) => {
                onPageSizeChange(Number(v));
                onPageChange(1);
              }}
              options={pageSizeOptions.map((n) => ({ value: String(n), label: String(n) }))}
              style={{ width: '64px', height: '26px', fontSize: '12px', minWidth: '64px' }}
            />
          </div>
        )}
        <span style={{ fontSize: '12px', color: '#52525b', whiteSpace: 'nowrap' }}>
          {selectedCount > 0
            ? `${selectedCount} of ${totalCount} selected`
            : totalCount === 0
            ? 'No rows'
            : `${start}–${end} of ${totalCount}`}
        </span>
      </div>

      {/* RIGHT: Page nav */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap' }}>
        <span style={{ fontSize: '12px', color: '#52525b', marginRight: '6px' }}>
          Page {currentPage} of {totalPages}
        </span>
        {navBtn('first', currentPage === 1, () => onPageChange(1), 'First page', <ChevronsLeft size={13} />)}
        {navBtn('prev', currentPage === 1, () => onPageChange(currentPage - 1), 'Previous page', <ChevronLeft size={13} />)}
        {navBtn('next', currentPage === totalPages, () => onPageChange(currentPage + 1), 'Next page', <ChevronRight size={13} />)}
        {navBtn('last', currentPage === totalPages, () => onPageChange(totalPages), 'Last page', <ChevronsRight size={13} />)}
      </div>
    </div>
  );
};
Pagination.displayName = 'Pagination';



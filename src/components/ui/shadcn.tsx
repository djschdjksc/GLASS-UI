import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  ChevronDown,
  Check,
  FileText,
  Wallet,
  BarChart3,
  Target,
  Calendar,
  HelpCircle,
  MessageSquare,
  User,
  Receipt,
  Bell,
  Shield,
  Palette,
  Truck,
  Package,
  Train,
  Printer,
  Settings,
  Download,
  Upload,
  Trash2,
  Tag,
  Activity,
  Clock,
  Store,
  Layers,
  Calculator,
  Landmark,
  ArrowLeftRight,
  TrendingUp,
  Coins,
  Building2,
  Globe,
  BookOpen,
  Car,
  Send,
  CreditCard,
  Boxes,
  ShoppingBag,
  Wrench,
  Bus,
  Sparkles,
  CircleDot,
  Undo2,
  RotateCcw,
  ShoppingCart,
  FileCheck,
  ArrowDownLeft,
  ArrowUpRight,
  Scale,
  QrCode,
  Filter,
  File,
  HardDrive,
  CheckCircle2
} from 'lucide-react';

export function getSmartOptionIcon(label: any, value?: any): React.ReactNode {
  const text = (
    typeof label === 'string'
      ? label
      : typeof value === 'string'
      ? value
      : ''
  ).toLowerCase().trim();

  if (!text) return <Sparkles size={14} style={{ color: '#ffffff', flexShrink: 0 }} />;

  // All / Everything / Filter
  if (text === 'all' || text.includes('all types') || text.includes('all categories') || text.includes('filter'))
    return <Filter size={14} style={{ color: '#ffffff', flexShrink: 0 }} />;

  // Planning / Documents / Reports
  if (text.includes('document') || text.includes('doc') || text.includes('file'))
    return <FileText size={14} style={{ color: '#ffffff', flexShrink: 0 }} />;
  if (text.includes('budget') || text.includes('wallet') || text.includes('finance'))
    return <Wallet size={14} style={{ color: '#ffffff', flexShrink: 0 }} />;
  if (text.includes('report') || text.includes('analytic') || text.includes('stat'))
    return <BarChart3 size={14} style={{ color: '#ffffff', flexShrink: 0 }} />;
  if (text.includes('goal') || text.includes('target'))
    return <Target size={14} style={{ color: '#ffffff', flexShrink: 0 }} />;
  if (text.includes('calendar') || text.includes('date') || text.includes('schedule'))
    return <Calendar size={14} style={{ color: '#ffffff', flexShrink: 0 }} />;

  // Support
  if (text.includes('help') || text.includes('support'))
    return <HelpCircle size={14} style={{ color: '#ffffff', flexShrink: 0 }} />;
  if (text.includes('contact') || text.includes('message') || text.includes('chat'))
    return <MessageSquare size={14} style={{ color: '#ffffff', flexShrink: 0 }} />;
  if (text.includes('status') || text.includes('active') || text.includes('activity'))
    return <Activity size={14} style={{ color: '#ffffff', flexShrink: 0 }} />;
  if (text.includes('community') || text.includes('globe') || text.includes('network'))
    return <Globe size={14} style={{ color: '#ffffff', flexShrink: 0 }} />;

  // Overview / Transactions / Accounts
  if (text.includes('transaction') || text.includes('transfer'))
    return <ArrowLeftRight size={14} style={{ color: '#ffffff', flexShrink: 0 }} />;
  if (text.includes('investment') || text.includes('growth'))
    return <TrendingUp size={14} style={{ color: '#ffffff', flexShrink: 0 }} />;
  if (text.includes('account') || text.includes('bank') || text.includes('ledger'))
    return <Landmark size={14} style={{ color: '#ffffff', flexShrink: 0 }} />;
  if (text.includes('spend') || text.includes('expense') || text.includes('coin'))
    return <Coins size={14} style={{ color: '#ffffff', flexShrink: 0 }} />;

  // Account
  if (text.includes('profile') || text.includes('user'))
    return <User size={14} style={{ color: '#ffffff', flexShrink: 0 }} />;
  if (text.includes('billing') || text.includes('invoice') || text.includes('tax invoice'))
    return <Receipt size={14} style={{ color: '#ffffff', flexShrink: 0 }} />;
  if (text.includes('notification') || text.includes('alert') || text.includes('bell'))
    return <Bell size={14} style={{ color: '#ffffff', flexShrink: 0 }} />;
  if (text.includes('security') || text.includes('lock') || text.includes('shield'))
    return <Shield size={14} style={{ color: '#ffffff', flexShrink: 0 }} />;
  if (text.includes('appearance') || text.includes('theme') || text.includes('palette') || text.includes('dark') || text.includes('glass'))
    return <Palette size={14} style={{ color: '#ffffff', flexShrink: 0 }} />;

  // Inventory Flow: Inward / Outward / Balance / Barcode
  if (text.includes('inward'))
    return <ArrowDownLeft size={14} style={{ color: '#ffffff', flexShrink: 0 }} />;
  if (text.includes('outward'))
    return <ArrowUpRight size={14} style={{ color: '#ffffff', flexShrink: 0 }} />;
  if (text.includes('balance'))
    return <Scale size={14} style={{ color: '#ffffff', flexShrink: 0 }} />;
  if (text.includes('barcode') || text.includes('qr'))
    return <QrCode size={14} style={{ color: '#ffffff', flexShrink: 0 }} />;

  // ERP Billing Document Types (Check Return BEFORE Sale to distinguish SALE vs SALE RETURN)
  if (text.includes('return') || text.includes('refund'))
    return <RotateCcw size={14} style={{ color: '#ffffff', flexShrink: 0 }} />;
  if (text.includes('retail'))
    return <ShoppingBag size={14} style={{ color: '#ffffff', flexShrink: 0 }} />;
  if (text.includes('wholesale'))
    return <Boxes size={14} style={{ color: '#ffffff', flexShrink: 0 }} />;
  if (text.includes('estimate') || text.includes('calc') || text.includes('equation'))
    return <Calculator size={14} style={{ color: '#ffffff', flexShrink: 0 }} />;
  if (text.includes('challan') || text.includes('delivery'))
    return <Truck size={14} style={{ color: '#ffffff', flexShrink: 0 }} />;
  if (text.includes('proforma'))
    return <FileText size={14} style={{ color: '#ffffff', flexShrink: 0 }} />;
  if (text.includes('quotation') || text.includes('quote'))
    return <FileText size={14} style={{ color: '#ffffff', flexShrink: 0 }} />;
  if (text.includes('voucher') || text.includes('stock voucher'))
    return <FileCheck size={14} style={{ color: '#ffffff', flexShrink: 0 }} />;
  if (text.includes('purchase'))
    return <ShoppingCart size={14} style={{ color: '#ffffff', flexShrink: 0 }} />;
  if (text.includes('sale') || text.includes('sale bill'))
    return <Receipt size={14} style={{ color: '#ffffff', flexShrink: 0 }} />;
  if (text.includes('credit note'))
    return <Coins size={14} style={{ color: '#ffffff', flexShrink: 0 }} />;
  if (text.includes('debit note'))
    return <CreditCard size={14} style={{ color: '#ffffff', flexShrink: 0 }} />;
  if (text.includes('job work'))
    return <Wrench size={14} style={{ color: '#ffffff', flexShrink: 0 }} />;

  // Transport & Vehicles
  if (text.includes('truck'))
    return <Truck size={14} style={{ color: '#ffffff', flexShrink: 0 }} />;
  if (text.includes('tempo'))
    return <Truck size={14} style={{ color: '#ffffff', flexShrink: 0 }} />;
  if (text.includes('auto') || text.includes('car') || text.includes('vehicle') || text.includes('own vehicle') || text.includes('self'))
    return <Car size={14} style={{ color: '#ffffff', flexShrink: 0 }} />;
  if (text.includes('courier') || text.includes('parcel') || text.includes('package') || text.includes('box'))
    return <Package size={14} style={{ color: '#ffffff', flexShrink: 0 }} />;
  if (text.includes('train'))
    return <Train size={14} style={{ color: '#ffffff', flexShrink: 0 }} />;
  if (text.includes('bus'))
    return <Bus size={14} style={{ color: '#ffffff', flexShrink: 0 }} />;
  if (text.includes('by hand') || text.includes('hand delivery'))
    return <Send size={14} style={{ color: '#ffffff', flexShrink: 0 }} />;

  // Paper Sizes & Formats
  if (text.includes('a4') || text.includes('a5') || text.includes('letter') || text.includes('sheet') || text.includes('legal'))
    return <FileText size={14} style={{ color: '#ffffff', flexShrink: 0 }} />;
  if (text.includes('roll') || text.includes('thermal') || text.includes('80mm') || text.includes('58mm') || text.includes('inch'))
    return <Printer size={14} style={{ color: '#ffffff', flexShrink: 0 }} />;

  // Printers & Hardware
  if (text.includes('printer') || text.includes('print') || text.includes('epson') || text.includes('pos') || text.includes('tvs') || text.includes('tsp') || text.includes('pdf'))
    return <Printer size={14} style={{ color: '#ffffff', flexShrink: 0 }} />;
  if (text.includes('default'))
    return <CheckCircle2 size={14} style={{ color: '#ffffff', flexShrink: 0 }} />;

  // Slip & Inventory
  if (text.includes('slip') || text.includes('pending') || text.includes('order'))
    return <Clock size={14} style={{ color: '#ffffff', flexShrink: 0 }} />;
  if (text.includes('glass') || text.includes('item') || text.includes('stock') || text.includes('mould'))
    return <Layers size={14} style={{ color: '#ffffff', flexShrink: 0 }} />;
  if (text.includes('store') || text.includes('warehouse'))
    return <Store size={14} style={{ color: '#ffffff', flexShrink: 0 }} />;
  if (text.includes('party') || text.includes('company') || text.includes('firm'))
    return <Building2 size={14} style={{ color: '#ffffff', flexShrink: 0 }} />;

  return <CircleDot size={13} style={{ color: '#ffffff', flexShrink: 0 }} />;
}

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
  onCheckedChange?: (checked: boolean) => void;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
}

export const Switch: React.FC<ShadcnSwitchProps> = ({ checked, onCheckedChange, onChange, disabled }) => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    const nextVal = !checked;
    if (typeof onCheckedChange === 'function') {
      onCheckedChange(nextVal);
    }
    if (typeof onChange === 'function') {
      onChange(nextVal);
    }
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={handleClick}
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

export interface ShadcnCheckboxProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  style?: React.CSSProperties;
}

export const Checkbox: React.FC<ShadcnCheckboxProps> = ({ checked = false, onCheckedChange, onChange, disabled = false, style }) => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    const nextVal = !checked;
    if (typeof onCheckedChange === 'function') onCheckedChange(nextVal);
    if (typeof onChange === 'function') onChange(nextVal);
  };

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      disabled={disabled}
      onClick={handleClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '16px',
        height: '16px',
        borderRadius: '4px',
        border: checked ? '1px solid #f4f4f5' : '1px solid #3f3f46',
        backgroundColor: checked ? '#f4f4f5' : 'transparent',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'all 0.15s ease',
        outline: 'none',
        ...style
      }}
    >
      {checked && (
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#09090b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      )}
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
  icon?: React.ReactNode;
  category?: string;
  description?: string;
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
    const [isFocused, setIsFocused] = useState(false);
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

    // Parse options from children (<option>) or props.options with smart icon deduction
    const parsedOptions: SelectOption[] = useMemo(() => {
      if (options && options.length > 0) {
        return options.map((opt) => ({
          ...opt,
          icon: opt.icon !== undefined ? opt.icon : getSmartOptionIcon(opt.label, opt.value)
        }));
      }
      const list: SelectOption[] = [];
      React.Children.forEach(children, (child) => {
        if (React.isValidElement(child)) {
          const childProps = (child as React.ReactElement<any>).props;
          if (child.type === 'option') {
            const optVal = childProps.value !== undefined ? String(childProps.value) : String(childProps.children || '');
            const optLabel = childProps.children ?? optVal;
            const optIcon = childProps['data-icon'] !== undefined ? childProps['data-icon'] : getSmartOptionIcon(optLabel, optVal);
            const optCategory = childProps['data-category'];
            list.push({
              value: optVal,
              label: optLabel,
              icon: optIcon,
              category: optCategory,
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
      const estimatedHeight = Math.min(280, parsedOptions.length * 36 + 10);
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
        if (e.key === 'Enter') {
          if (onKeyDown) {
            onKeyDown(e);
            return;
          }
        }
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === ' ') {
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
          e.stopPropagation();
          if (highlightedIdx >= 0 && highlightedIdx < parsedOptions.length) {
            const opt = parsedOptions[highlightedIdx];
            if (!opt.disabled) {
              setInternalValue(opt.value);
              setIsOpen(false);
              if (onChange) onChange({ target: { value: opt.value, name } });
              if (onValueChange) onValueChange(opt.value);
              if (onKeyDown) {
                onKeyDown(e);
                return;
              }
              // Move focus to next focusable element
              setTimeout(() => {
                if (!triggerRef.current) return;
                const focusableSelectors = [
                  'input:not([disabled]):not([type="hidden"])',
                  'textarea:not([disabled])',
                  'select:not([disabled])',
                  'button:not([disabled])',
                  '[tabindex]:not([tabindex="-1"]):not([disabled])'
                ].join(',');
                const allFocusable = Array.from(
                  document.querySelectorAll<HTMLElement>(focusableSelectors)
                ).filter((el) => el.offsetParent !== null);
                const currentIdx = allFocusable.indexOf(triggerRef.current);
                const nextEl = allFocusable[currentIdx + 1];
                if (nextEl) {
                  nextEl.focus();
                } else {
                  triggerRef.current.blur();
                }
              }, 0);
            }
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

    const currentIcon = activeOption?.icon || (activeOption ? getSmartOptionIcon(activeOption.label, activeOption.value) : null);

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
          onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
            if (e.detail === 0) return;
            handleToggle();
          }}
          onKeyDown={handleTriggerKeyDown}
          className={className}
          style={{
            height: size === 'sm' ? '28px' : '32px',
            minWidth: '120px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderRadius: '6px',
            border: isOpen
              ? '1px solid #52525b'
              : isFocused
              ? '1px solid #a1a1aa'
              : '1px solid #27272a',
            boxShadow: isFocused && !isOpen ? '0 0 0 2px rgba(161,161,170,0.15)' : 'none',
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
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...restProps}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
            {currentIcon && (
              <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0, color: '#94a3b8' }}>
                {currentIcon}
              </span>
            )}
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
          </div>
          <ChevronDown
            size={12}
            style={{
              color: '#71717a',
              transition: 'transform 0.15s ease',
              transform: isOpen ? 'rotate(180deg)' : 'none',
              flexShrink: 0,
              marginLeft: '4px'
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
                minWidth: `${Math.max(coords.width, 160)}px`,
                maxWidth: '420px',
                maxHeight: '280px',
                overflowY: 'auto',
                background: '#121215',
                border: '1px solid #27272a',
                borderRadius: '8px',
                padding: '4px',
                boxShadow: '0 16px 36px rgba(0, 0, 0, 0.9), 0 0 1px rgba(255, 255, 255, 0.15)',
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

                const prevCategory = idx > 0 ? parsedOptions[idx - 1].category : undefined;
                const showCategoryHeader = opt.category && opt.category !== prevCategory;

                return (
                  <React.Fragment key={String(opt.value) + idx}>
                    {showCategoryHeader && (
                      <div
                        style={{
                          padding: '6px 8px 3px',
                          fontSize: '10.5px',
                          fontWeight: 600,
                          color: '#71717a',
                          letterSpacing: '0.5px',
                          textTransform: 'uppercase',
                          userSelect: 'none'
                        }}
                      >
                        {opt.category}
                      </div>
                    )}
                    <div
                      onClick={() => handleSelectOption(opt)}
                      onMouseEnter={() => setHighlightedIdx(idx)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: isSelected ? 600 : 500,
                        color: opt.disabled ? '#52525b' : isSelected ? '#ffffff' : '#f4f4f5',
                        background: isHighlighted ? '#27272a' : isSelected ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                        cursor: opt.disabled ? 'not-allowed' : 'pointer',
                        userSelect: 'none',
                        transition: 'background-color 0.1s ease',
                        gap: '8px',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                        {opt.icon && (
                          <span
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              color: isHighlighted ? '#ffffff' : isSelected ? '#38bdf8' : '#94a3b8',
                              flexShrink: 0,
                              transition: 'color 0.1s ease'
                            }}
                          >
                            {opt.icon}
                          </span>
                        )}
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{opt.label}</span>
                      </div>
                      {isSelected && (
                        <Check size={13} style={{ color: '#38bdf8', flexShrink: 0, marginLeft: '6px' }} />
                      )}
                    </div>
                  </React.Fragment>
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
// 9.1 DROPDOWN MENU COMPONENTS (ui.shadcn.com/docs/components/dropdown-menu)
// =========================================================================
export interface DropdownMenuItemProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  shortcut?: string;
  disabled?: boolean;
  destructive?: boolean;
}

export const DropdownMenuItem: React.FC<DropdownMenuItemProps> = ({
  icon,
  shortcut,
  disabled = false,
  destructive = false,
  style,
  children,
  onClick,
  ...props
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onClick={(e) => {
        if (disabled) return;
        onClick?.(e);
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '6px 10px',
        borderRadius: '6px',
        fontSize: '12px',
        fontWeight: 500,
        color: disabled ? '#52525b' : destructive ? '#ef4444' : '#f4f4f5',
        background: isHovered && !disabled ? (destructive ? 'rgba(239, 68, 68, 0.15)' : '#27272a') : 'transparent',
        cursor: disabled ? 'not-allowed' : 'pointer',
        userSelect: 'none',
        transition: 'background-color 0.12s ease',
        gap: '8px',
        whiteSpace: 'nowrap',
        boxSizing: 'border-box',
        ...style
      }}
      {...props}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
        {icon && (
          <span style={{ display: 'flex', alignItems: 'center', color: destructive ? '#ef4444' : isHovered ? '#ffffff' : '#94a3b8', flexShrink: 0 }}>
            {icon}
          </span>
        )}
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{children}</span>
      </div>
      {shortcut && (
        <kbd style={{ fontSize: '10px', color: '#71717a', background: '#18181b', padding: '1px 4px', borderRadius: '4px', border: '1px solid #27272a', marginLeft: '8px', fontFamily: 'monospace' }}>
          {shortcut}
        </kbd>
      )}
    </div>
  );
};

export const DropdownMenuGroup: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ style, children, ...props }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', ...style }} {...props}>
    {children}
  </div>
);

export const DropdownMenuLabel: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ style, children, ...props }) => (
  <div
    style={{
      padding: '6px 10px 3px',
      fontSize: '10.5px',
      fontWeight: 600,
      color: '#71717a',
      letterSpacing: '0.4px',
      textTransform: 'uppercase',
      userSelect: 'none',
      ...style
    }}
    {...props}
  >
    {children}
  </div>
);

export const DropdownMenuSeparator: React.FC<{ style?: React.CSSProperties }> = ({ style }) => (
  <div style={{ height: '1px', background: '#27272a', margin: '4px 0', ...style }} />
);

// =========================================================================
// 10. PAGINATION COMPONENT (ui.shadcn.com/docs/components/data-table)
// =========================================================================
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export interface PaginationProps {
  totalCount: number;
  pageSize: number;
  currentPage: number;
  onPageChange: (page: number, targetRow?: 'first' | 'last') => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  selectedCount?: number;
  idPrefix?: string;
  onFocusTableLastRow?: () => void;
  onFocusTableFirstRow?: () => void;
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
  idPrefix = 'pagination',
  onFocusTableLastRow,
  onFocusTableFirstRow,
  style
}) => {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const start = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalCount);

  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null);

  const handleBtnKeyDown = (key: string, disabled: boolean, onClick: () => void, e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;

    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
      return;
    }

    if (key === 'next') {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        onFocusTableLastRow?.();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        const prevEl = document.getElementById(`${idPrefix}-prev`) as HTMLButtonElement | null;
        if (prevEl && !prevEl.disabled) prevEl.focus();
      }
    } else if (key === 'prev') {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        onFocusTableFirstRow?.();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        const nextEl = document.getElementById(`${idPrefix}-next`) as HTMLButtonElement | null;
        if (nextEl && !nextEl.disabled) nextEl.focus();
      }
    }
  };

  const navBtn = (key: string, disabled: boolean, onClick: () => void, title: string, icon: React.ReactNode) => (
    <button
      id={`${idPrefix}-${key}`}
      type="button"
      tabIndex={-1}
      disabled={disabled}
      onClick={onClick}
      onKeyDown={(e) => handleBtnKeyDown(key, disabled, onClick, e)}
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
      onFocus={(e) => {
        if (!disabled) {
          e.currentTarget.style.borderColor = '#38bdf8';
          e.currentTarget.style.boxShadow = '0 0 0 2px rgba(56, 189, 248, 0.35)';
        }
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = hoveredBtn === key && !disabled ? '#52525b' : '#27272a';
        e.currentTarget.style.boxShadow = 'none';
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
        {navBtn('first', currentPage === 1, () => onPageChange(1, 'first'), 'First page', <ChevronsLeft size={13} />)}
        {navBtn('prev', currentPage === 1, () => onPageChange(currentPage - 1, 'last'), 'Previous page', <ChevronLeft size={13} />)}
        {navBtn('next', currentPage === totalPages, () => onPageChange(currentPage + 1, 'first'), 'Next page', <ChevronRight size={13} />)}
        {navBtn('last', currentPage === totalPages, () => onPageChange(totalPages, 'last'), 'Last page', <ChevronsRight size={13} />)}
      </div>
    </div>
  );
};
Pagination.displayName = 'Pagination';

// =========================================================================
// 12. DATE PICKER COMPONENTS (ui.shadcn.com/docs/components/date-picker)
// =========================================================================
export {
  ShadcnDatePicker as DatePicker,
  ShadcnDateRangePicker as DateRangePicker
} from '../common/ShadcnDatePicker';
export type {
  ShadcnDatePickerProps as DatePickerProps,
  ShadcnDateRangePickerProps as DateRangePickerProps
} from '../common/ShadcnDatePicker';

// =========================================================================
// 13. AVATAR COMPONENTS (ui.shadcn.com/docs/components/avatar)
// =========================================================================
export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'default' | 'lg' | 'xl';
}

export const Avatar: React.FC<AvatarProps> = ({ size = 'default', style, children, ...props }) => {
  const dim = size === 'sm' ? 32 : size === 'lg' ? 48 : size === 'xl' ? 64 : 40;
  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        height: `${dim}px`,
        width: `${dim}px`,
        flexShrink: 0,
        overflow: 'hidden',
        borderRadius: '9999px',
        border: '1px solid #27272a',
        background: '#18181b',
        boxSizing: 'border-box',
        ...style
      }}
      {...props}
    >
      {children}
    </div>
  );
};

export const AvatarImage: React.FC<React.ImgHTMLAttributes<HTMLImageElement>> = ({ style, ...props }) => (
  <img
    style={{
      aspectRatio: '1 / 1',
      height: '100%',
      width: '100%',
      objectFit: 'cover',
      ...style
    }}
    {...props}
  />
);

export const AvatarFallback: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ style, children, ...props }) => (
  <div
    style={{
      display: 'flex',
      height: '100%',
      width: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '9999px',
      background: '#27272a',
      color: '#f4f4f5',
      fontSize: '14px',
      fontWeight: 600,
      ...style
    }}
    {...props}
  >
    {children}
  </div>
);

// =========================================================================
// 14. PROGRESS COMPONENT (ui.shadcn.com/docs/components/progress)
// =========================================================================
export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  max?: number;
  indicatorColor?: string;
}

export const Progress: React.FC<ProgressProps> = ({
  value = 0,
  max = 100,
  indicatorColor = '#f4f4f5',
  style,
  ...props
}) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div
      style={{
        position: 'relative',
        height: '6px',
        width: '100%',
        overflow: 'hidden',
        borderRadius: '9999px',
        background: '#27272a',
        ...style
      }}
      {...props}
    >
      <div
        style={{
          height: '100%',
          width: `${percentage}%`,
          background: indicatorColor,
          borderRadius: '9999px',
          transition: 'width 0.3s ease'
        }}
      />
    </div>
  );
};

// =========================================================================
// 16. TOOLTIP COMPONENT (ui.shadcn.com/docs/components/tooltip)
// =========================================================================
export {
  Tooltip,
  TooltipRoot,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider
} from './tooltip';
export type { TooltipProps, TooltipContentProps } from './tooltip';

// =========================================================================
// 17. SLIDER COMPONENT (ui.shadcn.com/docs/components/slider)
// =========================================================================
export interface SliderProps {
  min?: number;
  max?: number;
  step?: number;
  value?: number;
  defaultValue?: number;
  onChange?: (val: number) => void;
  tooltip?: { formatter?: (val: any) => string };
  disabled?: boolean;
  style?: React.CSSProperties;
  className?: string;
}

export const Slider: React.FC<SliderProps> = ({
  min = 0,
  max = 100,
  step = 1,
  value,
  defaultValue = 0,
  onChange,
  disabled = false,
  style,
  className = ''
}) => {
  const isControlled = value !== undefined;
  const [internalVal, setInternalVal] = useState<number>(isControlled ? value : defaultValue);

  const currentVal = isControlled ? value : internalVal;
  const percentage = Math.max(0, Math.min(100, ((currentVal - min) / (max - min)) * 100));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = parseFloat(e.target.value);
    if (!isControlled) setInternalVal(next);
    onChange?.(next);
  };

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        touchAction: 'none',
        userSelect: 'none',
        height: '20px',
        ...style
      }}
      className={className}
    >
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={currentVal}
        disabled={disabled}
        onChange={handleChange}
        style={{
          width: '100%',
          height: '6px',
          borderRadius: '9999px',
          appearance: 'none',
          WebkitAppearance: 'none',
          background: `linear-gradient(to right, #38bdf8 0%, #38bdf8 ${percentage}%, #27272a ${percentage}%, #27272a 100%)`,
          outline: 'none',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
          margin: 0
        }}
      />
    </div>
  );
};

// =========================================================================
// 18. INPUT NUMBER COMPONENT (shadcn/ui zinc numeric input)
// =========================================================================
export interface InputNumberProps {
  min?: number;
  max?: number;
  step?: number;
  value?: number | null;
  defaultValue?: number;
  onChange?: (val: number | null) => void;
  disabled?: boolean;
  placeholder?: string;
  style?: React.CSSProperties;
  className?: string;
}

export const InputNumber: React.FC<InputNumberProps> = ({
  min,
  max,
  step = 1,
  value,
  defaultValue,
  onChange,
  disabled = false,
  placeholder,
  style,
  className = ''
}) => {
  const isControlled = value !== undefined;
  const [internalVal, setInternalVal] = useState<string>(
    isControlled && value !== null && value !== undefined ? String(value) : defaultValue !== undefined ? String(defaultValue) : ''
  );

  const displayVal = isControlled ? (value !== null && value !== undefined ? String(value) : '') : internalVal;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (!isControlled) setInternalVal(raw);

    if (raw === '') {
      onChange?.(null);
      return;
    }

    const num = parseFloat(raw);
    if (!isNaN(num)) {
      onChange?.(num);
    }
  };

  return (
    <input
      type="number"
      min={min}
      max={max}
      step={step}
      value={displayVal}
      disabled={disabled}
      placeholder={placeholder}
      onChange={handleChange}
      className={className}
      style={{
        display: 'flex',
        height: '32px',
        width: '100%',
        borderRadius: '6px',
        border: '1px solid #27272a',
        background: '#09090b',
        padding: '4px 10px',
        fontSize: '12.5px',
        color: '#f4f4f5',
        outline: 'none',
        boxSizing: 'border-box',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Inter", sans-serif',
        transition: 'border-color 0.15s ease',
        ...style
      }}
    />
  );
};

// =========================================================================
// 18. ALERT COMPONENT (ui.shadcn.com/docs/components/alert)
// =========================================================================
export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'destructive' | 'success';
}

export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className = '', variant = 'default', style, children, ...props }, ref) => {
    const isDestructive = variant === 'destructive';
    const isSuccess = variant === 'success';
    return (
      <div
        ref={ref}
        role="alert"
        style={{
          position: 'relative',
          width: '100%',
          borderRadius: '8px',
          border: isDestructive
            ? '1px solid rgba(239, 68, 68, 0.3)'
            : isSuccess
            ? '1px solid rgba(16, 185, 129, 0.3)'
            : '1px solid #27272a',
          background: isDestructive
            ? 'rgba(239, 68, 68, 0.08)'
            : isSuccess
            ? 'rgba(16, 185, 129, 0.08)'
            : '#18181b',
          color: isDestructive ? '#f87171' : isSuccess ? '#34d399' : '#f4f4f5',
          padding: '12px 16px',
          fontSize: '13px',
          boxSizing: 'border-box',
          display: 'flex',
          gap: '12px',
          alignItems: 'flex-start',
          ...style
        }}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Alert.displayName = 'Alert';

export const AlertTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ style, children, ...props }) => (
  <h5 style={{ fontWeight: 600, fontSize: '13px', margin: '0 0 2px 0', lineHeight: 1.3, ...style }} {...props}>
    {children}
  </h5>
);

export const AlertDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({ style, children, ...props }) => (
  <div style={{ fontSize: '12px', opacity: 0.9, lineHeight: 1.4, margin: 0, ...style }} {...props}>
    {children}
  </div>
);

// =========================================================================
// 19. SEGMENTED COMPONENT (ui.shadcn.com style segmented control / tabs)
// =========================================================================
export interface SegmentedOption {
  label: React.ReactNode;
  value: any;
  disabled?: boolean;
}

export interface SegmentedProps {
  value?: any;
  defaultValue?: any;
  onChange?: (val: any) => void;
  options: (SegmentedOption | string | number)[];
  block?: boolean;
  disabled?: boolean;
  size?: 'sm' | 'default';
  style?: React.CSSProperties;
  className?: string;
}

export const Segmented: React.FC<SegmentedProps> = ({
  value: controlledValue,
  defaultValue,
  onChange,
  options,
  block = false,
  disabled = false,
  size = 'default',
  style,
  className = ''
}) => {
  const isControlled = controlledValue !== undefined;
  const [internalVal, setInternalVal] = useState<any>(
    isControlled ? controlledValue : defaultValue !== undefined ? defaultValue : (options[0] as any)?.value ?? options[0]
  );

  const activeVal = isControlled ? controlledValue : internalVal;

  const parsedOptions: SegmentedOption[] = options.map((opt) => {
    if (typeof opt === 'object' && opt !== null && 'value' in opt) {
      return opt as SegmentedOption;
    }
    return { label: String(opt), value: opt };
  });

  return (
    <div
      style={{
        display: block ? 'flex' : 'inline-flex',
        alignItems: 'center',
        padding: '2px',
        borderRadius: '7px',
        background: '#18181b',
        border: '1px solid #27272a',
        gap: '2px',
        boxSizing: 'border-box',
        userSelect: 'none',
        ...style
      }}
      className={className}
    >
      {parsedOptions.map((opt, i) => {
        const isSelected = opt.value === activeVal;
        return (
          <button
            key={i}
            type="button"
            disabled={disabled || opt.disabled}
            onClick={() => {
              if (disabled || opt.disabled) return;
              if (!isControlled) setInternalVal(opt.value);
              onChange?.(opt.value);
            }}
            style={{
              flex: block ? 1 : 'none',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: size === 'sm' ? '24px' : '28px',
              padding: size === 'sm' ? '0 8px' : '0 12px',
              fontSize: size === 'sm' ? '11px' : '12px',
              fontWeight: isSelected ? 600 : 500,
              borderRadius: '5px',
              border: isSelected ? '1px solid #3f3f46' : '1px solid transparent',
              background: isSelected ? '#09090b' : 'transparent',
              color: isSelected ? '#ffffff' : '#a1a1aa',
              boxShadow: isSelected ? '0 1px 3px rgba(0,0,0,0.4)' : 'none',
              cursor: disabled || opt.disabled ? 'not-allowed' : 'pointer',
              opacity: disabled || opt.disabled ? 0.4 : 1,
              outline: 'none',
              transition: 'all 0.12s ease',
              whiteSpace: 'nowrap'
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
};

// =========================================================================
// 15. SHADCN UI TABLE COMPONENTS (ui.shadcn.com/docs/components/table)
// =========================================================================

export const Table = React.forwardRef<
  HTMLTableElement,
  React.TableHTMLAttributes<HTMLTableElement> & { 
    containerStyle?: React.CSSProperties;
    containerClassName?: string;
  }
>(({ style, containerStyle, containerClassName = '', className = '', ...props }, ref) => (
  <div 
    className={`shadcn-table-wrapper ${containerClassName}`}
    style={{
      position: 'relative',
      width: '100%',
      overflow: 'auto',
      borderRadius: '8px',
      border: '1px solid var(--border, #27272a)',
      background: 'var(--card, #09090b)',
      ...containerStyle
    }}
  >
    <table
      ref={ref}
      className={`shadcn-table ${className}`}
      style={{
        width: '100%',
        captionSide: 'bottom',
        fontSize: '12.5px',
        borderCollapse: 'collapse',
        color: 'var(--text-primary, #f4f4f5)',
        fontFamily: 'var(--font-sans, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif)',
        ...style
      }}
      {...props}
    />
  </div>
));
Table.displayName = "Table";

export const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ style, className = '', ...props }, ref) => (
  <thead
    ref={ref}
    className={`shadcn-table-header ${className}`}
    style={{
      position: 'sticky',
      top: 0,
      zIndex: 10,
      background: 'var(--muted, #18181b)',
      borderBottom: '1px solid var(--border, #27272a)',
      ...style
    }}
    {...props}
  />
));
TableHeader.displayName = "TableHeader";

export const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ style, className = '', ...props }, ref) => (
  <tbody
    ref={ref}
    className={`shadcn-table-body ${className}`}
    style={{
      ...style
    }}
    {...props}
  />
));
TableBody.displayName = "TableBody";

export const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ style, className = '', ...props }, ref) => (
  <tfoot
    ref={ref}
    className={`shadcn-table-footer ${className}`}
    style={{
      borderTop: '1px solid var(--border, #27272a)',
      background: 'var(--muted, #18181b)',
      fontWeight: 600,
      color: 'var(--text-primary, #f4f4f5)',
      ...style
    }}
    {...props}
  />
));
TableFooter.displayName = "TableFooter";

export const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement> & { isSelected?: boolean }
>(({ style, isSelected, className = '', ...props }, ref) => (
  <tr
    ref={ref}
    className={`shadcn-table-row ${isSelected ? 'selected' : ''} ${className}`}
    style={{
      borderBottom: '1px solid var(--border, rgba(39, 39, 42, 0.7))',
      transition: 'background-color 0.12s ease',
      background: isSelected ? 'rgba(56, 189, 248, 0.12)' : 'transparent',
      outline: isSelected ? '1px solid rgba(56, 189, 248, 0.35)' : 'none',
      outlineOffset: '-1px',
      ...style
    }}
    {...props}
  />
));
TableRow.displayName = "TableRow";

export const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ style, className = '', ...props }, ref) => (
  <th
    ref={ref}
    className={`shadcn-table-head ${className}`}
    style={{
      height: '34px',
      padding: '6px 10px',
      textAlign: 'left',
      verticalAlign: 'middle',
      fontWeight: 700,
      fontSize: '11px',
      letterSpacing: '0.04em',
      textTransform: 'uppercase',
      color: 'var(--muted-foreground, #a1a1aa)',
      userSelect: 'none',
      ...style
    }}
    {...props}
  />
));
TableHead.displayName = "TableHead";

export const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ style, className = '', ...props }, ref) => (
  <td
    ref={ref}
    className={`shadcn-table-cell ${className}`}
    style={{
      padding: '4px 8px',
      verticalAlign: 'middle',
      fontSize: '12px',
      color: 'var(--text-primary, #f4f4f5)',
      ...style
    }}
    {...props}
  />
));
TableCell.displayName = "TableCell";

export const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ style, className = '', ...props }, ref) => (
  <caption
    ref={ref}
    className={`shadcn-table-caption ${className}`}
    style={{
      marginTop: '8px',
      fontSize: '11px',
      color: 'var(--muted-foreground, #71717a)',
      ...style
    }}
    {...props}
  />
));
TableCaption.displayName = "TableCaption";

// =========================================================================
// 16. TOAST COMPONENT (ui.shadcn.com/docs/components/sonner)
// =========================================================================
export {
  toast,
  useToast,
  Toaster,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
  ToastViewport,
  ToastProvider,
  dismissToast
} from './toast';
export type {
  ToastProps,
  ToastOptions,
  ToastVariant,
  ToastActionElement,
} from './toast';

// 17. MODERN UNIFIED DATA TABLE (ui.shadcn.com table standard)
export { ModernDataTable } from '../common/ModernDataTable';
export type { ModernDataTableProps, ModernTableColumn } from '../common/ModernDataTable';


import React from 'react';
import { macAudio } from '../../utils/macAudio';

export interface UnifiedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'ghost' | 'glass';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  icon?: React.ReactNode;
  shortcut?: string;
  glow?: boolean;
}

export const UnifiedButton: React.FC<UnifiedButtonProps> = ({
  children,
  variant = 'glass',
  size = 'md',
  icon,
  shortcut,
  glow = false,
  className = '',
  style,
  onClick,
  onMouseEnter,
  disabled,
  ...props
}) => {
  const getVariantStyles = (): React.CSSProperties => {
    switch (variant) {
      case 'primary':
        return {
          background: 'linear-gradient(135deg, rgba(0, 122, 255, 0.85) 0%, rgba(14, 165, 233, 0.85) 100%)',
          color: '#ffffff',
          border: '1px solid rgba(56, 189, 248, 0.5)',
          boxShadow: glow ? '0 0 14px rgba(0, 122, 255, 0.45)' : '0 2px 8px rgba(0, 0, 0, 0.3)'
        };
      case 'success':
        return {
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.85) 0%, rgba(5, 150, 105, 0.85) 100%)',
          color: '#ffffff',
          border: '1px solid rgba(52, 211, 153, 0.5)',
          boxShadow: glow ? '0 0 14px rgba(16, 185, 129, 0.4)' : '0 2px 8px rgba(0, 0, 0, 0.3)'
        };
      case 'danger':
        return {
          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.85) 0%, rgba(185, 28, 28, 0.85) 100%)',
          color: '#ffffff',
          border: '1px solid rgba(248, 113, 113, 0.5)',
          boxShadow: glow ? '0 0 14px rgba(239, 68, 68, 0.4)' : '0 2px 8px rgba(0, 0, 0, 0.3)'
        };
      case 'secondary':
        return {
          background: 'rgba(255, 255, 255, 0.08)',
          color: '#f8fafc',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.2)'
        };
      case 'ghost':
        return {
          background: 'transparent',
          color: '#cbd5e1',
          border: '1px solid transparent'
        };
      case 'glass':
      default:
        return {
          background: 'rgba(255, 255, 255, 0.04)',
          backdropFilter: 'blur(12px)',
          color: '#f1f5f9',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
        };
    }
  };

  const getSizeStyles = (): React.CSSProperties => {
    switch (size) {
      case 'sm':
        return { padding: '3px 8px', fontSize: '11px', borderRadius: '5px', gap: '4px' };
      case 'lg':
        return { padding: '8px 16px', fontSize: '13.5px', borderRadius: '8px', gap: '8px', fontWeight: 600 };
      case 'icon':
        return { width: '28px', height: '28px', padding: 0, borderRadius: '6px', justifyContent: 'center' };
      case 'md':
      default:
        return { padding: '5px 12px', fontSize: '12px', borderRadius: '6px', gap: '6px' };
    }
  };

  return (
    <button
      className={`unified-btn ${className}`}
      disabled={disabled}
      onClick={(e) => {
        if (!disabled) {
          macAudio.playClick();
          onClick?.(e);
        }
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          macAudio.playHover();
          onMouseEnter?.(e);
        }
      }}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: size === 'icon' ? 'center' : 'center',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
        userSelect: 'none',
        outline: 'none',
        whiteSpace: 'nowrap',
        ...getVariantStyles(),
        ...getSizeStyles(),
        ...style
      }}
      {...props}
    >
      {icon && <span style={{ display: 'inline-flex', alignItems: 'center' }}>{icon}</span>}
      {children}
      {shortcut && (
        <span style={{
          marginLeft: '4px',
          fontSize: '9px',
          padding: '1px 4px',
          borderRadius: '3px',
          background: 'rgba(0, 0, 0, 0.3)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          color: '#94a3b8',
          fontFamily: 'monospace'
        }}>
          {shortcut}
        </span>
      )}
    </button>
  );
};

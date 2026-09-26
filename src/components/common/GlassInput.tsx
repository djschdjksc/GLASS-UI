import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface GlassInputProps {
  label: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  icon?: LucideIcon;
  type?: string;
  required?: boolean;
  step?: string;
  style?: React.CSSProperties;
  inputStyle?: React.CSSProperties;
  autoFocus?: boolean;
  disabled?: boolean;
}

export const GlassInput: React.FC<GlassInputProps> = ({
  label, value, onChange, icon: Icon, type = 'text',
  required = false, step, style, inputStyle, autoFocus, disabled
}) => {
  const hasValue = value !== '' && value !== 0 && value !== undefined;

  return (
    <div className="glass-input-group" style={style}>
      {Icon && (
        <div className="glass-input-icon">
          <Icon size={14} />
        </div>
      )}
      <input
        type={type}
        required={required}
        step={step}
        autoComplete="off"
        autoFocus={autoFocus}
        disabled={disabled}
        className={`glass-input-field ${hasValue ? 'has-value' : ''}`}
        value={value}
        onChange={onChange}
        style={inputStyle}
      />
      <label className="glass-input-label">{label}</label>
    </div>
  );
};

interface GlassSelectProps {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  icon?: LucideIcon;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export const GlassSelect: React.FC<GlassSelectProps> = ({
  label, value, onChange, icon: Icon, children, style
}) => {
  return (
    <div className="glass-input-group" style={style}>
      {Icon && (
        <div className="glass-input-icon">
          <Icon size={14} />
        </div>
      )}
      <select
        className="glass-input-field glass-select has-value"
        value={value}
        onChange={onChange}
      >
        {children}
      </select>
      <label className="glass-input-label">{label}</label>
    </div>
  );
};

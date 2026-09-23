import React, { useRef } from 'react';
import { Search, X } from 'lucide-react';
import { macAudio } from '../../utils/macAudio';

export interface UnifiedSearchInputProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  shortcutBadge?: string;
  resultCount?: number;
  width?: string | number;
  autoFocus?: boolean;
}

export const UnifiedSearchInput: React.FC<UnifiedSearchInputProps> = ({
  value,
  onChange,
  placeholder = 'Search records...',
  shortcutBadge = 'Ctrl+F',
  resultCount,
  width = '100%',
  autoFocus = false
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        background: 'rgba(0, 0, 0, 0.4)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '6px',
        padding: '3px 8px',
        gap: '6px',
        width,
        transition: 'all 0.15s ease',
        boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.3)'
      }}
      className="unified-search-box"
    >
      <Search size={13} color="#94a3b8" />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => macAudio.playHover()}
        placeholder={placeholder}
        autoFocus={autoFocus}
        style={{
          flex: 1,
          background: 'transparent',
          border: 'none',
          outline: 'none',
          color: '#f8fafc',
          fontSize: '11.5px',
          padding: 0
        }}
      />
      {value && (
        <button
          type="button"
          onClick={() => {
            onChange('');
            inputRef.current?.focus();
          }}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            color: '#94a3b8'
          }}
        >
          <X size={12} />
        </button>
      )}
      {resultCount !== undefined && (
        <span style={{ fontSize: '10px', color: '#38bdf8', fontWeight: 600 }}>
          {resultCount}
        </span>
      )}
      {shortcutBadge && (
        <span
          style={{
            fontSize: '9px',
            padding: '1px 5px',
            borderRadius: '3px',
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            color: '#64748b',
            fontFamily: 'monospace'
          }}
        >
          {shortcutBadge}
        </span>
      )}
    </div>
  );
};

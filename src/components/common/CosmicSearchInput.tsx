import React from 'react';
// Cosmic animated galaxy search component
import './CosmicSearchInput.css';
import { macAudio } from '../../utils/macAudio';
import { X } from 'lucide-react';

export interface CosmicSearchInputProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  onClear?: () => void;
  width?: number | string;
  style?: React.CSSProperties;
  className?: string;
  autoFocus?: boolean;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export const CosmicSearchInput: React.FC<CosmicSearchInputProps> = ({
  value,
  onChange,
  placeholder = '',
  onClear,
  width = 280,
  style,
  className = '',
  autoFocus = false,
  onKeyDown
}) => {
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    macAudio.playPop();
    onChange('');
    if (onClear) onClear();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape' && value) {
      e.stopPropagation();
      macAudio.playPop();
      onChange('');
      if (onClear) onClear();
      return;
    }
    if (onKeyDown) onKeyDown(e);
  };

  const resolvedWidth = typeof width === 'number' ? `${width}px` : width;

  return (
    <div 
      className={`cosmic-search-root ${className}`}
      style={{ width: resolvedWidth, ...style }}
    >
      <div className="cosmic-search-container" style={{ width: '100%' }}>
        {/* Dynamic Conic Rotating Borders */}
        <div className="cosmic-starfield" />
        <div className="cosmic-stardust" />
        <div className="cosmic-ring" />

        {/* Main Input Container */}
        <div className="cosmic-main">
          {/* Left SVG Search Icon with Gradient */}
          <div className="cosmic-search-icon">
            <svg
              strokeLinejoin="round"
              strokeLinecap="round"
              strokeWidth={2}
              stroke="url(#cosmic-search-grad)"
              fill="none"
              height={14}
              width={14}
              viewBox="0 0 24 24"
            >
              <circle r={8} cy={11} cx={11} />
              <line y2="16.65" x2="16.65" y1="21" x1="21" />
              <defs>
                <linearGradient gradientTransform="rotate(45)" id="cosmic-search-grad">
                  <stop stopColor="#a9c7ff" offset="0%" />
                  <stop stopColor="#6e8cff" offset="100%" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          <input
            className="cosmic-input"
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            autoFocus={autoFocus}
            spellCheck={false}
          />

          {/* Right Filter / Clear Action Badge */}
          <div 
            className="cosmic-filter-container"
            onClick={value ? handleClear : undefined}
            title={value ? 'Clear search (Esc)' : 'Search Filter'}
          >
            <div className="cosmic-filter-border" />
            <div className="cosmic-filter-icon">
              {value ? (
                <X size={12} color="#d6d6e6" />
              ) : (
                <svg
                  preserveAspectRatio="none"
                  height={14}
                  width={14}
                  viewBox="4.8 4.56 14.832 15.408"
                  fill="none"
                >
                  <path
                    d="M8.16 6.65002H15.83C16.47 6.65002 16.99 7.17002 16.99 7.81002V9.09002C16.99 9.56002 16.7 10.14 16.41 10.43L13.91 12.64C13.56 12.93 13.33 13.51 13.33 13.98V16.48C13.33 16.83 13.1 17.29 12.81 17.47L12 17.98C11.24 18.45 10.2 17.92 10.2 16.99V13.91C10.2 13.5 9.97 12.98 9.73 12.69L7.52 10.36C7.23 10.08 7 9.55002 7 9.20002V7.87002C7 7.17002 7.52 6.65002 8.16 6.65002Z"
                    stroke="#d6d6e6"
                    strokeWidth={1.2}
                    strokeMiterlimit={10}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CosmicSearchInput;

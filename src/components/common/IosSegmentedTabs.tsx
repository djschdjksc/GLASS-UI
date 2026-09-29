import React from 'react';
import { macAudio } from '../../utils/macAudio';

export interface IosTabItem<T extends string = string> {
  key: T;
  label: React.ReactNode;
  icon?: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }> | React.ReactNode;
  count?: number | string;
  badge?: React.ReactNode;
  shortcut?: string;
  gradient?: string;
  shadowColor?: string;
  color?: string;
}

export interface IosSegmentedTabsProps<T extends string = string> {
  tabs: IosTabItem<T>[];
  activeKey: T;
  onChange: (key: T) => void;
  width?: string | number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  style?: React.CSSProperties;
}

export const IosSegmentedTabs = <T extends string = string>({
  tabs,
  activeKey,
  onChange,
  width = 600,
  size = 'md',
  className = '',
  style
}: IosSegmentedTabsProps<T>) => {
  const activeIndex = tabs.findIndex(tab => tab.key === activeKey);
  const activeTab = activeIndex >= 0 ? tabs[activeIndex] : null;

  // Determine thumb height & item height based on size
  const itemHeight = size === 'sm' ? 26 : size === 'lg' ? 38 : 32;
  const padding = size === 'sm' ? 3 : size === 'lg' ? 6 : 5;
  const fontSize = size === 'sm' ? 10.5 : size === 'lg' ? 12.5 : 11.5;
  const iconSize = size === 'sm' ? 12 : size === 'lg' ? 16 : 14;

  // Active thumb gradient & shadow
  const thumbGradient = activeTab?.gradient || (
    activeTab?.color
      ? `linear-gradient(135deg, ${activeTab.color} 0%, ${activeTab.color}dd 100%)`
      : 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)'
  );
  const shadowColor = activeTab?.shadowColor || (
    activeTab?.color
      ? `${activeTab.color}40`
      : 'rgba(14, 165, 233, 0.25)'
  );

  return (
    <div style={{ position: 'relative', display: 'inline-flex', maxWidth: '100%', ...style }} className={className}>
      <style>{`
        .cc-ios-tabs__control {
          position: relative;
          display: grid;
          align-items: center;
          border-radius: 999px;
          background: rgba(0, 0, 0, 0.4);
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.05), 0 2px 8px rgba(0, 0, 0, 0.2);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          user-select: none;
        }
        .cc-ios-tabs__thumb {
          position: absolute;
          border-radius: 999px;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2), 0 8px 20px var(--thumb-shadow, rgba(14, 165, 233, 0.2));
          transition: transform 420ms cubic-bezier(0.22, 1, 0.36, 1), background 300ms ease, box-shadow 300ms ease;
          will-change: transform;
        }
        .cc-ios-tabs__item {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          border-radius: 999px;
          color: #94a3b8;
          font-weight: 700;
          line-height: 1;
          cursor: pointer;
          user-select: none;
          transition: color 260ms ease;
          white-space: nowrap;
          padding: 0 8px;
        }
        .cc-ios-tabs__item:hover { color: #f8fafc; }
        .cc-ios-tabs__item.active { color: #ffffff; }
      `}</style>

      <div
        className="cc-ios-tabs__control"
        style={{
          gridTemplateColumns: `repeat(${tabs.length}, 1fr)`,
          width: typeof width === 'number' ? `${width}px` : width,
          padding: `${padding}px`,
        }}
      >
        {activeIndex >= 0 && (
          <div
            className="cc-ios-tabs__thumb"
            style={{
              top: `${padding}px`,
              left: `${padding}px`,
              width: `calc((100% - ${padding * 2}px) / ${tabs.length})`,
              height: `calc(100% - ${padding * 2}px)`,
              background: thumbGradient,
              boxShadow: `0 1px 2px rgba(0, 0, 0, 0.2), 0 8px 20px ${shadowColor}`,
              transform: `translateX(${activeIndex * 100}%)`,
            }}
          />
        )}

        {tabs.map((tab) => {
          const isActive = activeKey === tab.key;
          const Icon = tab.icon;

          return (
            <div
              key={tab.key}
              onClick={() => {
                macAudio.playClick();
                onChange(tab.key);
              }}
              onMouseEnter={() => macAudio.playHover()}
              className={`cc-ios-tabs__item ${isActive ? 'active' : ''}`}
              style={{
                height: `${itemHeight}px`,
                fontSize: `${fontSize}px`,
              }}
            >
              {Icon && (
                typeof Icon === 'function' ? (
                  <Icon size={iconSize} />
                ) : React.isValidElement(Icon) ? (
                  Icon
                ) : null
              )}

              <span>{tab.label}</span>

              {tab.count !== undefined && (
                <span
                  style={{
                    fontSize: `${fontSize - 2}px`,
                    padding: '1px 5px',
                    borderRadius: '999px',
                    background: isActive ? 'rgba(255, 255, 255, 0.22)' : 'rgba(255, 255, 255, 0.08)',
                    color: isActive ? '#ffffff' : '#94a3b8',
                    fontWeight: 700,
                    marginLeft: '2px',
                    transition: 'background 260ms ease, color 260ms ease',
                  }}
                >
                  {tab.count}
                </span>
              )}

              {tab.badge && (
                <span style={{ marginLeft: '2px' }}>{tab.badge}</span>
              )}

              {tab.shortcut && (
                <span
                  style={{
                    fontSize: `${fontSize - 2.5}px`,
                    opacity: isActive ? 0.9 : 0.5,
                    marginLeft: '2px',
                    color: isActive ? '#ffffff' : '#cbd5e1',
                    fontWeight: 500,
                    letterSpacing: '0.02em',
                    transition: 'opacity 260ms ease, color 260ms ease',
                  }}
                >
                  ({tab.shortcut})
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

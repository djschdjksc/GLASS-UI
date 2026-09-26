import React, { useState, useRef } from 'react';
import type { NavKey } from '../types';
import { macAudio } from '../utils/macAudio';
import { 
  X,
  Receipt, 
  History, 
  Calculator, 
  Database, 
  Users, 
  Sliders, 
  Package, 
  BookOpen, 
  Settings 
} from 'lucide-react';

interface Props {
  activeTab: NavKey;
  onSelectTab: (tab: NavKey) => void;
  onCloseApp: () => void;
}

export const RightNavRail: React.FC<Props> = ({
  activeTab,
  onSelectTab,
  onCloseApp
}) => {
  const TABS: { key: NavKey; name: string; icon: React.ReactNode; color: string }[] = [
    { key: 'F1', name: 'Bill UI', icon: <Receipt size={17} />, color: '#38bdf8' },
    { key: 'F2', name: 'Bill History', icon: <History size={17} />, color: '#818cf8' },
    { key: 'F3', name: 'Equation', icon: <Calculator size={17} />, color: '#fbbf24' },
    { key: 'F4', name: 'Data Panel', icon: <Database size={17} />, color: '#34d399' },
    { key: 'F5', name: 'Party Panel', icon: <Users size={17} />, color: '#f472b6' },
    { key: 'F6', name: 'Control Panel', icon: <Sliders size={17} />, color: '#a78bfa' },
    { key: 'F8', name: 'Stock Inventory', icon: <Package size={17} />, color: '#fb923c' },
    { key: 'F9', name: 'Ledger', icon: <BookOpen size={17} />, color: '#2dd4bf' },
    { key: 'F10', name: 'Settings', icon: <Settings size={17} />, color: '#a1a1aa' }
  ];

  const [mouseY, setMouseY] = useState<number | null>(null);
  const [lastHoveredIndex, setLastHoveredIndex] = useState<number | null>(null);
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    setMouseY(e.clientY);
  };

  const handleMouseLeave = () => {
    setMouseY(null);
    setLastHoveredIndex(null);
  };

  // True macOS Fish-Eye Dock Calculation
  const getScale = (index: number): number => {
    if (mouseY === null) return 1;
    const btn = btnRefs.current[index];
    if (!btn) return 1;
    const rect = btn.getBoundingClientRect();
    const btnCenterY = rect.top + rect.height / 2;
    const distance = Math.abs(mouseY - btnCenterY);
    const maxDist = 95;

    if (distance < maxDist) {
      const cosineFactor = Math.cos((distance / maxDist) * (Math.PI / 2));
      return 1 + 0.44 * cosineFactor;
    }
    return 1;
  };

  return (
    <div 
      data-np-zone="6"
      className="glass-panel"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '10px 6px',
        gap: '6px',
        height: '100%',
        width: '54px',
        overflow: 'visible',
        zIndex: 50,
        position: 'relative'
      }}
    >
      {/* Close App Button (Index 0) */}
      <button
        ref={(el) => { btnRefs.current[0] = el; }}
        type="button"
        onMouseEnter={() => {
          if (lastHoveredIndex !== 0) {
            macAudio.playHover();
            setLastHoveredIndex(0);
          }
        }}
        onClick={() => {
          macAudio.playClick();
          onCloseApp();
        }}
        className="mac-dock-btn"
        style={{
          transform: `scale(${getScale(0)}) translateX(${getScale(0) > 1.05 ? -(getScale(0) - 1) * 8 : 0}px)`,
          zIndex: getScale(0) > 1.25 ? 70 : 10,
          transition: mouseY === null 
            ? 'transform 0.32s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.2s, box-shadow 0.2s' 
            : 'transform 0.08s ease-out, background 0.2s, box-shadow 0.2s'
        }}
      >
        <span className="box-tooltip-left">Close App</span>
        <X size={17} color="#f87171" />
      </button>

      <div style={{ width: '28px', height: '1px', background: 'rgba(255, 255, 255, 0.12)', margin: '3px 0' }} />

      {/* Navigation Tabs (Index 1..N) */}
      {TABS.map((t, idx) => {
        const itemIdx = idx + 1;
        const isActive = activeTab === t.key;
        const scale = getScale(itemIdx);
        const isTarget = scale > 1.25;

        return (
          <button
            key={t.key}
            data-np-target={`6-${idx + 1}`}
            ref={(el) => { btnRefs.current[itemIdx] = el; }}
            type="button"
            onMouseEnter={() => {
              if (lastHoveredIndex !== itemIdx) {
                macAudio.playHover();
                setLastHoveredIndex(itemIdx);
              }
            }}
            onClick={() => {
              macAudio.playClick();
              onSelectTab(t.key);
            }}
            className={'mac-dock-btn ' + (isActive ? 'active' : '')}
            style={{
              color: isActive ? t.color : undefined,
              transform: `scale(${scale}) translateX(${scale > 1.05 ? -(scale - 1) * 8 : 0}px)`,
              zIndex: isTarget ? 70 : Math.round(scale * 10),
              transition: mouseY === null 
                ? 'transform 0.32s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.2s, box-shadow 0.2s' 
                : 'transform 0.08s ease-out, background 0.2s, box-shadow 0.2s'
            }}
          >
            <span className="box-tooltip-left">{t.name}</span>
            {t.icon}
          </button>
        );
      })}
    </div>
  );
};
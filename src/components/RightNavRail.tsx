import React, { useState, useRef } from 'react';
import type { NavKey } from '../types';
import { macAudio } from '../utils/macAudio';
import { 
  Receipt, 
  History, 
  Calculator, 
  Users, 
  Sliders, 
  Package, 
  BookOpen, 
  Settings,
  MessageCircle,
  LayoutDashboard
} from 'lucide-react';
import { Tooltip } from './ui/shadcn';

interface Props {
  activeTab: NavKey;
  onSelectTab: (tab: NavKey) => void;
  onCloseApp?: () => void;
  onToggleChat?: () => void;
  isChatOpen?: boolean;
  unreadChatCount?: number;
}

export const RightNavRail: React.FC<Props> = ({
  activeTab,
  onSelectTab,
  onCloseApp,
  onToggleChat,
  isChatOpen = false,
  unreadChatCount = 0
}) => {
  const TABS: { key: NavKey; name: string; icon: React.ReactNode; color: string }[] = [
    { key: 'F1', name: 'Bill UI (F1)', icon: <Receipt size={17} />, color: '#38bdf8' },
    { key: 'F2', name: 'Bill History (F2)', icon: <History size={17} />, color: '#818cf8' },
    { key: 'F3', name: 'Equation (F3)', icon: <Calculator size={17} />, color: '#fbbf24' },
    { key: 'F4', name: 'Dashboard (F4)', icon: <LayoutDashboard size={17} />, color: '#10b981' },
    { key: 'F5', name: 'Party Panel (F5)', icon: <Users size={17} />, color: '#f472b6' },
    { key: 'F6', name: 'Control Panel (F6)', icon: <Sliders size={17} />, color: '#a78bfa' },
    { key: 'F8', name: 'Stock Inventory (F8)', icon: <Package size={17} />, color: '#fb923c' },
    { key: 'F9', name: 'Ledger (F9)', icon: <BookOpen size={17} />, color: '#2dd4bf' },
    { key: 'F10', name: 'Settings (F10)', icon: <Settings size={17} />, color: '#a1a1aa' }
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

  const chatBtnIdx = TABS.length; // Index after all tabs
  const chatScale = getScale(chatBtnIdx);

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
      {/* Navigation Tabs (Index 0..N-1) */}
      {TABS.map((t, idx) => {
        const itemIdx = idx;
        const isActive = activeTab === t.key;
        const scale = getScale(itemIdx);
        const isTarget = scale > 1.25;

        return (
          <Tooltip key={t.key} title={t.name} side="left" delayDuration={60}>
            <button
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
              {t.icon}
            </button>
          </Tooltip>
        );
      })}

      {/* Spacer to push chat button to the bottom */}
      <div style={{ flex: 1 }} />

      {/* Bottom Separator */}
      <div style={{ width: '28px', height: '1px', background: 'rgba(255, 255, 255, 0.12)', margin: '2px 0' }} />

      {/* WhatsApp-Style Chatting & Assistant Button (SABSE NICHE) */}
      {onToggleChat && (
        <Tooltip title="WhatsApp Chat & AI Assistant (Ctrl+J)" side="left" delayDuration={60}>
          <button
            ref={(el) => { btnRefs.current[chatBtnIdx] = el; }}
            type="button"
            onMouseEnter={() => {
              if (lastHoveredIndex !== chatBtnIdx) {
                macAudio.playHover();
                setLastHoveredIndex(chatBtnIdx);
              }
            }}
            onClick={() => {
              macAudio.playClick();
              onToggleChat();
            }}
            className={'mac-dock-btn ' + (isChatOpen ? 'active' : '')}
            style={{
              transform: `scale(${chatScale}) translateX(${chatScale > 1.05 ? -(chatScale - 1) * 8 : 0}px)`,
              zIndex: chatScale > 1.25 ? 70 : 15,
              background: isChatOpen ? 'rgba(37, 211, 102, 0.22)' : 'rgba(37, 211, 102, 0.08)',
              borderColor: isChatOpen ? '#25D366' : 'rgba(37, 211, 102, 0.35)',
              boxShadow: isChatOpen ? '0 0 14px rgba(37, 211, 102, 0.55)' : 'none',
              transition: mouseY === null 
                ? 'transform 0.32s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.2s, box-shadow 0.2s' 
                : 'transform 0.08s ease-out, background 0.2s, box-shadow 0.2s'
            }}
          >
            <MessageCircle size={18} color="#25D366" />
            {unreadChatCount > 0 && !isChatOpen && (
              <span
                style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  minWidth: '16px',
                  height: '16px',
                  padding: '0 4px',
                  borderRadius: '8px',
                  background: '#ef4444',
                  color: '#ffffff',
                  fontSize: '9.5px',
                  fontWeight: 900,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 6px rgba(239, 68, 68, 0.7)',
                  zIndex: 10
                }}
              >
                {unreadChatCount > 9 ? '9+' : unreadChatCount}
              </span>
            )}
          </button>
        </Tooltip>
      )}
    </div>
  );
};
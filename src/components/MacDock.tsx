import React from 'react';
import type { NavKey } from '../types';
import { 
  Save, Printer, PlusCircle, Camera, CheckCircle2, Volume2, RotateCcw,
  Receipt, History, Calculator, Database, Users, Package, BookOpen, Settings
} from 'lucide-react';

interface Props {
  activeTab: NavKey;
  onSelectTab: (tab: NavKey) => void;
  onSave: () => void;
  onPrintSlip: () => void;
  onAddItem: () => void;
  onOpenOcr: () => void;
  onRecheck: () => void;
  onSpeakSelection: () => void;
  onReset: () => void;
}

export const MacDock: React.FC<Props> = ({
  activeTab,
  onSelectTab,
  onSave,
  onPrintSlip,
  onAddItem,
  onOpenOcr,
  onRecheck,
  onSpeakSelection,
  onReset
}) => {
  const EVENT_BUTTONS = [
    { id: 'save', label: 'Save Bill (Ctrl+S)', icon: <Save size={20} color="#34c759" />, action: onSave },
    { id: 'print', label: 'Print Slip (Ctrl+L)', icon: <Printer size={20} color="#38bdf8" />, action: onPrintSlip },
    { id: 'add', label: 'Add Raw Item', icon: <PlusCircle size={20} color="#0071e3" />, action: onAddItem },
    { id: 'ocr', label: 'Scan / Paste Slip OCR', icon: <Camera size={20} color="#ec4899" />, action: onOpenOcr },
    { id: 'recheck', label: 'Recheck Totals (Alt+K)', icon: <CheckCircle2 size={20} color="#a3e635" />, action: onRecheck },
    { id: 'speak', label: 'Speak Selection (Ctrl+K)', icon: <Volume2 size={20} color="#c084fc" />, action: onSpeakSelection },
    { id: 'reset', label: 'Reset Values', icon: <RotateCcw size={20} color="#f87171" />, action: onReset }
  ];

  const NAV_TABS: { key: NavKey; label: string; icon: React.ReactNode; color: string }[] = [
    { key: 'F1', label: 'F1: Bill UI', icon: <Receipt size={20} />, color: '#38bdf8' },
    { key: 'F2', label: 'F2: Bill History', icon: <History size={20} />, color: '#818cf8' },
    { key: 'F3', label: 'F3: Equation', icon: <Calculator size={20} />, color: '#fbbf24' },
    { key: 'F4', label: 'F4: Data Panel', icon: <Database size={20} />, color: '#34d399' },
    { key: 'F5', label: 'F5: Party Panel', icon: <Users size={20} />, color: '#f472b6' },
    { key: 'F8', label: 'F8: Stock', icon: <Package size={20} />, color: '#fb923c' },
    { key: 'F9', label: 'F9: Ledger', icon: <BookOpen size={20} />, color: '#2dd4bf' },
    { key: 'F10', label: 'F10: Settings', icon: <Settings size={20} />, color: '#a1a1aa' }
  ];

  return (
    <div className="mac-dock-container">
      {/* LEFT SECTION: EVENT BUTTONS */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {EVENT_BUTTONS.map((btn) => (
          <div
            key={btn.id}
            className="dock-item"
            onClick={btn.action}
          >
            <span className="dock-tooltip">{btn.label}</span>
            {btn.icon}
          </div>
        ))}
      </div>

      <div className="dock-divider" />

      {/* RIGHT SECTION: NAVIGATION TABS */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {NAV_TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <div
              key={tab.key}
              className={'dock-item ' + (isActive ? 'active' : '')}
              onClick={() => onSelectTab(tab.key)}
              style={{ color: isActive ? tab.color : '#e4e4e7' }}
            >
              <span className="dock-tooltip">{tab.label}</span>
              {tab.icon}
            </div>
          );
        })}
      </div>
    </div>
  );
};

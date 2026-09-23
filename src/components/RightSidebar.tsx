import React from 'react';
import type { NavKey } from '../types';
import { 
  X, Receipt, History, Calculator, Database, Users, Sliders, Package, BookOpen, Settings, 
  Save, Layers, FileEdit, Key, CheckCircle, FileText, Printer, Code, ClipboardPaste, 
  BarChart3, Volume2, ChevronLeft, ChevronRight 
} from 'lucide-react';

interface Props {
  activeTab: NavKey;
  onSelectTab: (tab: NavKey) => void;
  onCloseApp: () => void;
  onSave: () => void;
  onCombine: () => void;
  onOpenNote: () => void;
  onPartyCode: () => void;
  onRecheck: () => void;
  onPrintEstimate: () => void;
  onPrintSummary: () => void;
  onPrintSlip: () => void;
  onExportJson: () => void;
  onPasteJson: () => void;
  onSummaryTool: () => void;
  onLoadLatest: () => void;
  onSpeakSelection: () => void;
  onPrevRecord: () => void;
  onNextRecord: () => void;
}

export const RightSidebar: React.FC<Props> = ({
  activeTab,
  onSelectTab,
  onCloseApp,
  onSave,
  onCombine,
  onOpenNote,
  onPartyCode,
  onRecheck,
  onPrintEstimate,
  onPrintSummary,
  onPrintSlip,
  onExportJson,
  onPasteJson,
  onSummaryTool,
  onLoadLatest,
  onSpeakSelection,
  onPrevRecord,
  onNextRecord
}) => {
  const NAV_ITEMS: { key: NavKey; label: string; icon: React.ReactNode }[] = [
    { key: 'F1', label: 'F1 Bill UI', icon: <Receipt size={13} /> },
    { key: 'F2', label: 'F2 Bill History', icon: <History size={13} /> },
    { key: 'F3', label: 'F3 Equation', icon: <Calculator size={13} /> },
    { key: 'F4', label: 'F4 Data Panel', icon: <Database size={13} /> },
    { key: 'F5', label: 'F5 Party Panel', icon: <Users size={13} /> },
    { key: 'F6', label: 'F6 Control Panel', icon: <Sliders size={13} /> },
    { key: 'F8', label: 'F8 Stock', icon: <Package size={13} /> },
    { key: 'F9', label: 'F9 Ledger', icon: <BookOpen size={13} /> },
    { key: 'F10', label: 'F10 Settings', icon: <Settings size={13} /> }
  ];

  return (
    <div 
      className="glass-panel" 
      style={{ 
        width: '270px', 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column', 
        padding: '12px', 
        gap: '10px',
        overflowY: 'auto'
      }}
    >
      <div 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          paddingBottom: '8px', 
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)' 
        }}
      >
        <span style={{ fontSize: '11px', fontWeight: '700', color: '#a1a1aa', letterSpacing: '0.5px' }}>
          FUNCTION & CONTROLS
        </span>

        <button
          type="button"
          onClick={onCloseApp}
          className="apple-btn apple-btn-danger"
          style={{ padding: '3px 8px', fontSize: '11px', fontWeight: '700' }}
          title="Close Software Window"
        >
          <X size={12} strokeWidth={2.5} />
          <span>CLOSE</span>
        </button>
      </div>

      <div>
        <div style={{ fontSize: '10px', fontWeight: '700', color: '#71717a', marginBottom: '6px', letterSpacing: '0.5px' }}>
          NAVIGATION MODULES (F1–F10)
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px' }}>
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => onSelectTab(item.key)}
                className={'apple-btn ' + (isActive ? 'apple-btn-primary' : 'apple-btn-glass')}
                style={{ 
                  justifyContent: 'flex-start', 
                  padding: '5px 8px', 
                  fontSize: '11px',
                  borderLeft: isActive ? '3px solid #60a5fa' : undefined
                }}
              >
                {item.icon}
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <div style={{ fontSize: '10px', fontWeight: '700', color: '#71717a', marginBottom: '6px', letterSpacing: '0.5px' }}>
          ENTRY & DISPLAY OPTIONS
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <button
            type="button"
            onClick={onSave}
            className="apple-btn apple-btn-success"
            style={{ justifyContent: 'space-between', padding: '5px 10px', fontSize: '11px' }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Save size={12} />
              <strong>SAVE</strong>
            </span>
            <span style={{ fontSize: '10px', opacity: 0.8, fontFamily: 'monospace' }}>Ctrl+S</span>
          </button>

          <button
            type="button"
            onClick={onCombine}
            className="apple-btn apple-btn-glass"
            style={{ justifyContent: 'space-between', padding: '5px 10px', fontSize: '11px' }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Layers size={12} color="#38bdf8" />
              <span>COMBINE</span>
            </span>
            <span style={{ fontSize: '10px', opacity: 0.6, fontFamily: 'monospace' }}>Ctrl+Shift+D</span>
          </button>

          <button
            type="button"
            onClick={onOpenNote}
            className="apple-btn apple-btn-glass"
            style={{ justifyContent: 'space-between', padding: '5px 10px', fontSize: '11px' }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FileEdit size={12} color="#fbbf24" />
              <span>ADD/EDIT NOTE</span>
            </span>
            <span style={{ fontSize: '10px', opacity: 0.6, fontFamily: 'monospace' }}>Alt+N</span>
          </button>

          <button
            type="button"
            onClick={onPartyCode}
            className="apple-btn apple-btn-glass"
            style={{ justifyContent: 'space-between', padding: '5px 10px', fontSize: '11px' }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Key size={12} color="#a855f7" />
              <span>PARTY CODE</span>
            </span>
            <span style={{ fontSize: '10px', opacity: 0.6, fontFamily: 'monospace' }}>Ctrl+P</span>
          </button>

          <button
            type="button"
            onClick={onRecheck}
            className="apple-btn apple-btn-glass"
            style={{ justifyContent: 'space-between', padding: '5px 10px', fontSize: '11px' }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle size={12} color="#34c759" />
              <span>RECHECK</span>
            </span>
            <span style={{ fontSize: '10px', opacity: 0.6, fontFamily: 'monospace' }}>Alt+K</span>
          </button>
        </div>
      </div>

      <div>
        <div style={{ fontSize: '10px', fontWeight: '700', color: '#71717a', marginBottom: '6px', letterSpacing: '0.5px' }}>
          PRINT / EXPORT
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px' }}>
          <button
            type="button"
            onClick={onPrintEstimate}
            className="apple-btn apple-btn-glass"
            style={{ justifyContent: 'space-between', padding: '4px 8px', fontSize: '10.5px' }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <FileText size={11} color="#60a5fa" />
              <span>ESTIMATE</span>
            </span>
            <span style={{ fontSize: '9px', opacity: 0.5 }}>^E</span>
          </button>

          <button
            type="button"
            onClick={onPrintSummary}
            className="apple-btn apple-btn-glass"
            style={{ justifyContent: 'space-between', padding: '4px 8px', fontSize: '10.5px' }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <BarChart3 size={11} color="#f472b6" />
              <span>SUMMARY</span>
            </span>
            <span style={{ fontSize: '9px', opacity: 0.5 }}>Alt+S</span>
          </button>

          <button
            type="button"
            onClick={onPrintSlip}
            className="apple-btn apple-btn-glass"
            style={{ justifyContent: 'space-between', padding: '4px 8px', fontSize: '10.5px', gridColumn: 'span 2', background: 'rgba(0, 113, 227, 0.18)', borderColor: 'rgba(0, 113, 227, 0.4)' }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#38bdf8', fontWeight: 600 }}>
              <Printer size={12} />
              <span>PRINT SLIP</span>
            </span>
            <span style={{ fontSize: '9px', opacity: 0.7, fontFamily: 'monospace' }}>Ctrl+L</span>
          </button>

          <button
            type="button"
            onClick={onExportJson}
            className="apple-btn apple-btn-glass"
            style={{ justifyContent: 'flex-start', padding: '4px 8px', fontSize: '10px' }}
          >
            <Code size={11} color="#fb923c" />
            <span>JSON EXP/IMP</span>
          </button>

          <button
            type="button"
            onClick={onPasteJson}
            className="apple-btn apple-btn-glass"
            style={{ justifyContent: 'flex-start', padding: '4px 8px', fontSize: '10px' }}
          >
            <ClipboardPaste size={11} color="#a3e635" />
            <span>PASTE JSON</span>
          </button>
        </div>
      </div>

      <div>
        <div style={{ fontSize: '10px', fontWeight: '700', color: '#71717a', marginBottom: '6px', letterSpacing: '0.5px' }}>
          TOOLS & RECORD NAV
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px' }}>
            <button
              type="button"
              onClick={onSummaryTool}
              className="apple-btn apple-btn-glass"
              style={{ justifyContent: 'space-between', padding: '4px 8px', fontSize: '10.5px' }}
            >
              <span>SUMMARY</span>
              <span style={{ fontSize: '9px', opacity: 0.5 }}>Ctrl+G</span>
            </button>

            <button
              type="button"
              onClick={onLoadLatest}
              className="apple-btn apple-btn-glass"
              style={{ justifyContent: 'space-between', padding: '4px 8px', fontSize: '10.5px' }}
            >
              <span>LOAD LATEST</span>
              <span style={{ fontSize: '9px', opacity: 0.5 }}>Alt+P</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onSpeakSelection}
            className="apple-btn apple-btn-glass"
            style={{ 
              justifyContent: 'space-between', 
              padding: '5px 10px', 
              fontSize: '11px',
              background: 'rgba(168, 85, 247, 0.15)',
              borderColor: 'rgba(168, 85, 247, 0.35)',
              color: '#c084fc'
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Volume2 size={12} />
              <span>SPEAK SELECTION</span>
            </span>
            <span style={{ fontSize: '10px', opacity: 0.7, fontFamily: 'monospace' }}>Ctrl+K</span>
          </button>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px', marginTop: '2px' }}>
            <button
              type="button"
              onClick={onPrevRecord}
              className="apple-btn apple-btn-glass"
              style={{ justifyContent: 'center', padding: '4px 8px', fontSize: '10.5px' }}
            >
              <ChevronLeft size={12} />
              <span>PREVIOUS</span>
            </button>

            <button
              type="button"
              onClick={onNextRecord}
              className="apple-btn apple-btn-glass"
              style={{ justifyContent: 'center', padding: '4px 8px', fontSize: '10.5px' }}
            >
              <span>NEXT</span>
              <ChevronRight size={12} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

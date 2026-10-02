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
    { key: 'F1', label: 'Bill UI', icon: <Receipt size={13} /> },
    { key: 'F2', label: 'Bill History', icon: <History size={13} /> },
    { key: 'F3', label: 'Equation', icon: <Calculator size={13} /> },
    { key: 'F5', label: 'Party Panel', icon: <Users size={13} /> },
    { key: 'F6', label: 'Control Panel', icon: <Sliders size={13} /> },
    { key: 'F8', label: 'Stock', icon: <Package size={13} /> },
    { key: 'F9', label: 'Ledger', icon: <BookOpen size={13} /> },
    { key: 'F10', label: 'Settings', icon: <Settings size={13} /> }
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
            style={{ justifyContent: 'flex-start', padding: '6px 12px', fontSize: '11px' }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Save size={13} />
              <strong>SAVE</strong>
            </span>
          </button>

          <button
            type="button"
            onClick={onCombine}
            className="apple-btn apple-btn-glass"
            style={{ justifyContent: 'flex-start', padding: '6px 12px', fontSize: '11px' }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={13} color="#38bdf8" />
              <span>COMBINE</span>
            </span>
          </button>

          <button
            type="button"
            onClick={onOpenNote}
            className="apple-btn apple-btn-glass"
            style={{ justifyContent: 'flex-start', padding: '6px 12px', fontSize: '11px' }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileEdit size={13} color="#fbbf24" />
              <span>ADD/EDIT NOTE</span>
            </span>
          </button>

          <button
            type="button"
            onClick={onPartyCode}
            className="apple-btn apple-btn-glass"
            style={{ justifyContent: 'flex-start', padding: '6px 12px', fontSize: '11px' }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Key size={13} color="#a855f7" />
              <span>PARTY CODE</span>
            </span>
          </button>

          <button
            type="button"
            onClick={onRecheck}
            className="apple-btn apple-btn-glass"
            style={{ justifyContent: 'flex-start', padding: '6px 12px', fontSize: '11px' }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle size={13} color="#34c759" />
              <span>RECHECK</span>
            </span>
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
            style={{ justifyContent: 'flex-start', padding: '6px 8px', fontSize: '10.5px' }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FileText size={12} color="#60a5fa" />
              <span>ESTIMATE</span>
            </span>
          </button>

          <button
            type="button"
            onClick={onPrintSummary}
            className="apple-btn apple-btn-glass"
            style={{ justifyContent: 'flex-start', padding: '6px 8px', fontSize: '10.5px' }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <BarChart3 size={12} color="#f472b6" />
              <span>SUMMARY</span>
            </span>
          </button>

          <button
            type="button"
            onClick={onPrintSlip}
            className="apple-btn apple-btn-glass"
            style={{ justifyContent: 'center', padding: '6px 8px', fontSize: '10.5px', gridColumn: 'span 2', background: 'rgba(0, 113, 227, 0.18)', borderColor: 'rgba(0, 113, 227, 0.4)' }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#38bdf8', fontWeight: 600 }}>
              <Printer size={13} />
              <span>PRINT SLIP</span>
            </span>
          </button>

          <button
            type="button"
            onClick={onExportJson}
            className="apple-btn apple-btn-glass"
            style={{ justifyContent: 'flex-start', padding: '6px 8px', fontSize: '10px' }}
          >
            <Code size={12} color="#fb923c" />
            <span>JSON EXP/IMP</span>
          </button>

          <button
            type="button"
            onClick={onPasteJson}
            className="apple-btn apple-btn-glass"
            style={{ justifyContent: 'flex-start', padding: '6px 8px', fontSize: '10px' }}
          >
            <ClipboardPaste size={12} color="#a3e635" />
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
              style={{ justifyContent: 'flex-start', padding: '6px 8px', fontSize: '10.5px' }}
            >
              <span>SUMMARY</span>
            </button>

            <button
              type="button"
              onClick={onLoadLatest}
              className="apple-btn apple-btn-glass"
              style={{ justifyContent: 'flex-start', padding: '6px 8px', fontSize: '10.5px' }}
            >
              <span>LOAD LATEST</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onSpeakSelection}
            className="apple-btn apple-btn-glass"
            style={{ 
              justifyContent: 'flex-start', 
              padding: '6px 12px', 
              fontSize: '11px',
              background: 'rgba(168, 85, 247, 0.15)',
              borderColor: 'rgba(168, 85, 247, 0.35)',
              color: '#c084fc'
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Volume2 size={13} />
              <span>SPEAK SELECTION</span>
            </span>
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

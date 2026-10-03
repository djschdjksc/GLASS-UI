import React, { useState, useRef } from 'react';
import { macAudio } from '../utils/macAudio';
import { 
  Save, 
  Printer, 
  PlusCircle, 
  Camera, 
  FileEdit, 
  Key, 
  CheckCircle2, 
  Volume2, 
  Layers, 
  Code, 
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  History,
  Calculator,
  User,
  Clock
} from 'lucide-react';

interface Props {
  onSave: () => void;
  onPrintSlip: () => void;
  onAddRawRow: () => void;
  onOpenOcr?: () => void;
  onOpenNote: () => void;
  onPartyCode: () => void;
  onRecheck?: () => void;
  onSpeakSelection: () => void;
  onCombine: () => void;
  onExportJson: () => void;
  onReset: () => void;
  onPrevRecord: () => void;
  onNextRecord: () => void;
  onSummary: () => void;
  onLoadOldPrice: () => void;
  onOpenCalculator?: () => void;
  onOpenAuditHistory?: () => void;
  onOpenUserProfile?: () => void;
  noteText?: string;
  onOpenPendingSlip?: () => void;
}

export const LeftActionRail: React.FC<Props> = ({
  onSave,
  onPrintSlip,
  onAddRawRow,
  onOpenOcr,
  onOpenNote,
  onPartyCode,
  onRecheck,
  onSpeakSelection,
  onCombine,
  onExportJson,
  onReset,
  onPrevRecord,
  onNextRecord,
  onSummary,
  onLoadOldPrice,
  onOpenCalculator,
  onOpenAuditHistory,
  onOpenUserProfile,
  noteText,
  onOpenPendingSlip
}) => {
  const BUTTONS = [
    { id: 'summary', name: 'Calculate Summary', icon: <Layers size={17} color="#10b981" />, action: onSummary },
    { id: 'oldprice', name: 'Rate History (Alt+P)', icon: <History size={17} color="#f59e0b" />, action: onLoadOldPrice },
    { id: 'calc', name: 'Digital Calculator', icon: <Calculator size={17} color="#38bdf8" />, action: () => onOpenCalculator?.() },
    { id: 'audit', name: 'Audit History', icon: <History size={17} color="#c084fc" />, action: () => onOpenAuditHistory?.() },
    { id: 'operator', name: 'Operator Profile', icon: <User size={17} color="#34d399" />, action: () => onOpenUserProfile?.() },
    { id: 'save', name: 'Save Bill', icon: <Save size={17} color="currentColor" />, action: onSave },
    { id: 'slip', name: 'Print Center', icon: <Printer size={17} color="#38bdf8" />, action: onPrintSlip },
    { id: 'add', name: 'Add Raw Item', icon: <PlusCircle size={17} color="currentColor" />, action: onAddRawRow },
    { id: 'note', name: 'Bill Notes', icon: <FileEdit size={17} color="currentColor" />, action: onOpenNote },
    { id: 'pending', name: 'Pending Balance Slip', icon: <Clock size={17} color="#fbbf24" />, action: () => onOpenPendingSlip?.() },
    { id: 'partycode', name: 'Party Code', icon: <Key size={17} color="currentColor" />, action: onPartyCode },
    { id: 'combine', name: 'Combine Duplicates', icon: <Layers size={17} color="#38bdf8" />, action: onCombine },
    { id: 'speak', name: 'Voice Summary', icon: <Volume2 size={17} color="currentColor" />, action: onSpeakSelection },
    { id: 'json', name: 'JSON Export', icon: <Code size={17} color="currentColor" />, action: onExportJson },
    { id: 'prev', name: 'Previous Bill', icon: <ChevronLeft size={17} color="currentColor" />, action: onPrevRecord },
    { id: 'next', name: 'Next Bill', icon: <ChevronRight size={17} color="currentColor" />, action: onNextRecord },
    { id: 'reset', name: 'Reset All', icon: <RotateCcw size={17} color="currentColor" />, action: onReset }
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
    const maxDist = 95; // Range of parabolic wave

    if (distance < maxDist) {
      const cosineFactor = Math.cos((distance / maxDist) * (Math.PI / 2));
      return 1 + 0.44 * cosineFactor; // Max scale: ~1.44
    }
    return 1;
  };

  return (
    <div 
      data-np-zone="2"
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
      {BUTTONS.map((b, idx) => {
        const scale = getScale(idx);
        const isTarget = scale > 1.25;

        return (
          <button
            key={b.id}
            data-np-target={`2-${idx + 1}`}
            ref={(el) => { btnRefs.current[idx] = el; }}
            type="button"
            onMouseEnter={() => {
              if (lastHoveredIndex !== idx) {
                macAudio.playHover();
                setLastHoveredIndex(idx);
              }
            }}
            onClick={() => {
              macAudio.playClick();
              b.action();
            }}
            className="mac-dock-btn"
            style={{
              transform: `scale(${scale}) translateX(${scale > 1.05 ? (scale - 1) * 8 : 0}px)`,
              zIndex: isTarget ? 70 : Math.round(scale * 10),
              transition: mouseY === null 
                ? 'transform 0.32s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.2s, box-shadow 0.2s' 
                : 'transform 0.08s ease-out, background 0.2s, box-shadow 0.2s'
            }}
          >
            <span className="box-tooltip-right">{b.name}</span>
            {b.icon}
            {b.id === 'note' && Boolean(noteText && noteText.trim().length > 0) && (
              <span
                style={{
                  position: 'absolute',
                  top: '-3px',
                  right: '-3px',
                  minWidth: '17px',
                  height: '17px',
                  padding: '0 4px',
                  borderRadius: '10px',
                  background: noteText!.toUpperCase().includes('PENDING') ? '#ef4444' : '#22c55e',
                  color: '#ffffff',
                  fontSize: '9.5px',
                  fontWeight: 900,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1.5px solid #0f172a',
                  boxShadow: noteText!.toUpperCase().includes('PENDING')
                    ? '0 0 8px rgba(239, 68, 68, 0.9)'
                    : '0 0 8px rgba(34, 197, 94, 0.9)',
                  pointerEvents: 'none',
                  zIndex: 25
                }}
              >
                1
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
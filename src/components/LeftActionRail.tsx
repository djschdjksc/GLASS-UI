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
  ChevronRight
} from 'lucide-react';

interface Props {
  onSave: () => void;
  onPrintSlip: () => void;
  onAddRawRow: () => void;
  onOpenOcr: () => void;
  onOpenNote: () => void;
  onPartyCode: () => void;
  onRecheck: () => void;
  onSpeakSelection: () => void;
  onCombine: () => void;
  onExportJson: () => void;
  onReset: () => void;
  onPrevRecord: () => void;
  onNextRecord: () => void;
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
  onNextRecord
}) => {
  const BUTTONS = [
    { id: 'save', name: 'Save Bill', icon: <Save size={17} color="#ffffff" />, action: onSave },
    { id: 'slip', name: 'Print Slip', icon: <Printer size={17} color="#ffffff" />, action: onPrintSlip },
    { id: 'add', name: 'Add Raw Item', icon: <PlusCircle size={17} color="#ffffff" />, action: onAddRawRow },
    { id: 'ocr', name: 'AI Slip Scan', icon: <Camera size={17} color="#ffffff" />, action: onOpenOcr },
    { id: 'note', name: 'Bill Notes', icon: <FileEdit size={17} color="#ffffff" />, action: onOpenNote },
    { id: 'partycode', name: 'Party Code', icon: <Key size={17} color="#ffffff" />, action: onPartyCode },
    { id: 'recheck', name: 'Recheck Totals', icon: <CheckCircle2 size={17} color="#ffffff" />, action: onRecheck },
    { id: 'speak', name: 'Voice Summary', icon: <Volume2 size={17} color="#ffffff" />, action: onSpeakSelection },
    { id: 'combine', name: 'Combine Items', icon: <Layers size={17} color="#ffffff" />, action: onCombine },
    { id: 'json', name: 'JSON Export', icon: <Code size={17} color="#ffffff" />, action: onExportJson },
    { id: 'prev', name: 'Previous Bill', icon: <ChevronLeft size={17} color="#ffffff" />, action: onPrevRecord },
    { id: 'next', name: 'Next Bill', icon: <ChevronRight size={17} color="#ffffff" />, action: onNextRecord },
    { id: 'reset', name: 'Reset All', icon: <RotateCcw size={17} color="#ffffff" />, action: onReset }
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
          </button>
        );
      })}
    </div>
  );
};
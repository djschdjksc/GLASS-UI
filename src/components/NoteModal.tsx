import React, { useState, useEffect } from 'react';
import { X, FileEdit, Check, Trash2 } from 'lucide-react';
import { macAudio } from '../utils/macAudio';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  note: string;
  onSaveNote: (note: string) => void;
}

const PRESET_TAGS = [
  'PENDING',
  'PARTIAL DISPATCH',
  'BALANCE REMAINING',
  'DRIVER COD',
  'HOLD DELIVERY',
  'URGENT'
];

export const NoteModal: React.FC<Props> = ({ isOpen, onClose, note, onSaveNote }) => {
  const [text, setText] = useState(note || '');

  useEffect(() => {
    setText(note || '');
  }, [note, isOpen]);

  if (!isOpen) return null;

  const handleAddTag = (tagLabel: string) => {
    macAudio.playPop();
    setText(prev => {
      const clean = prev.trim();
      if (!clean) return tagLabel;
      if (clean.toUpperCase().includes(tagLabel)) return clean;
      return `${clean} | ${tagLabel}`;
    });
  };

  const handleClear = () => {
    macAudio.playPop();
    setText('');
  };

  const handleSave = () => {
    macAudio.playSuccess();
    onSaveNote(text.trim());
    onClose();
  };

  const isPending = text.toUpperCase().includes('PENDING');

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(2, 6, 23, 0.85)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        zIndex: 99999999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div 
        className="glass-panel"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '520px',
          maxWidth: '96vw',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          borderRadius: '12px',
          border: isPending ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8)',
          background: 'rgba(15, 23, 42, 0.88)'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
            <FileEdit size={16} color={isPending ? '#fbbf24' : '#38bdf8'} />
            <span style={{ fontSize: '13px', fontWeight: 800, color: '#f8fafc', letterSpacing: '0.03em' }}>
              BILL NOTES & REMARKS (Alt+N)
            </span>
            {isPending && (
              <span
                style={{
                  fontSize: '9.5px',
                  fontWeight: 800,
                  padding: '1px 6px',
                  borderRadius: '4px',
                  background: 'rgba(245, 158, 11, 0.2)',
                  color: '#fbbf24',
                  border: '1px solid rgba(245, 158, 11, 0.45)'
                }}
              >
                PENDING
              </span>
            )}
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="mac-btn" 
            style={{ width: '26px', height: '26px', padding: 0 }}
          >
            <X size={13} color="#94a3b8" />
          </button>
        </div>

        {/* Quick Presets */}
        <div>
          <div style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px', letterSpacing: '0.04em' }}>
            QUICK PRESETS (CLICK TO ADD):
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {PRESET_TAGS.map(tag => {
              const isTagPending = tag === 'PENDING';
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleAddTag(tag)}
                  className={`mac-btn ${isTagPending ? 'active' : ''}`}
                  style={{
                    fontSize: '10.5px',
                    padding: '3px 8px',
                    borderColor: isTagPending ? 'rgba(245, 158, 11, 0.5)' : undefined,
                    color: isTagPending ? '#fbbf24' : undefined,
                    background: isTagPending ? 'rgba(245, 158, 11, 0.15)' : undefined
                  }}
                >
                  + {tag}
                </button>
              );
            })}
          </div>
        </div>

        {/* Textarea */}
        <div style={{ position: 'relative' }}>
          <textarea
            className="apple-input"
            rows={5}
            placeholder="Delivery terms, driver instructions, pending balance remarks..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                handleSave();
              }
            }}
            autoFocus
            style={{
              width: '100%',
              resize: 'vertical',
              fontFamily: 'inherit',
              fontSize: '12.5px',
              lineHeight: '1.5',
              padding: '10px 12px',
              borderRadius: '7px',
              borderColor: isPending ? 'rgba(245, 158, 11, 0.35)' : undefined
            }}
          />

          <div
            style={{
              position: 'absolute',
              bottom: '8px',
              right: '10px',
              fontSize: '10px',
              color: '#64748b',
              pointerEvents: 'none'
            }}
          >
            {text.length} chars | Ctrl+Enter to save
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '2px' }}>
          {text ? (
            <button
              type="button"
              onClick={handleClear}
              className="mac-btn danger"
              style={{ fontSize: '11px', padding: '5px 10px' }}
            >
              <Trash2 size={12} />
              <span>Clear</span>
            </button>
          ) : <div />}

          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              type="button" 
              onClick={onClose} 
              className="mac-btn"
              style={{ fontSize: '11px', padding: '5px 12px' }}
            >
              Cancel
            </button>
            <button 
              type="button" 
              onClick={handleSave} 
              className="mac-btn primary"
              style={{ fontSize: '11px', padding: '5px 14px' }}
            >
              <Check size={13} />
              <span>Save Note</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

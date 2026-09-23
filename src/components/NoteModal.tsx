import React, { useState } from 'react';
import { X, FileEdit, Check } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  note: string;
  onSaveNote: (note: string) => void;
}

export const NoteModal: React.FC<Props> = ({ isOpen, onClose, note, onSaveNote }) => {
  const [text, setText] = useState(note);

  if (!isOpen) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(4, 6, 12, 0.92)',
        backdropFilter: 'blur(25px)',
        zIndex: 99999999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
    >
      <div 
        className="glass-panel"
        style={{
          width: '480px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileEdit size={16} color="#fbbf24" />
            <h3 style={{ fontSize: '14px', fontWeight: 700 }}>ADD / EDIT BILL NOTE (Alt+N)</h3>
          </div>
          <button type="button" onClick={onClose} className="apple-btn apple-btn-glass" style={{ padding: '4px 8px' }}>
            <X size={14} />
          </button>
        </div>

        <textarea
          className="apple-input"
          rows={5}
          placeholder="Type specific delivery terms, remarks, driver instructions..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          style={{ width: '100%', resize: 'vertical', fontFamily: 'inherit', fontSize: '12.5px' }}
        />

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button type="button" onClick={onClose} className="apple-btn apple-btn-glass">
            Cancel
          </button>
          <button 
            type="button" 
            onClick={() => {
              onSaveNote(text);
              onClose();
            }} 
            className="apple-btn apple-btn-primary"
          >
            <Check size={13} />
            <span>Save Note</span>
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { X, Code, Copy, Check, Upload } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  data: any;
  onImport: (importedData: any) => void;
}

export const JsonModal: React.FC<Props> = ({ isOpen, onClose, data, onImport }) => {
  const [jsonString, setJsonString] = useState(JSON.stringify(data, null, 2));
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApply = () => {
    try {
      const parsed = JSON.parse(jsonString);
      onImport(parsed);
      onClose();
    } catch (err: any) {
      setError('Invalid JSON format: ' + err.message);
    }
  };

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
          width: '560px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Code size={16} color="#fb923c" />
            <h3 style={{ fontSize: '14px', fontWeight: 700 }}>JSON EXPORT / IMPORT ENGINE</h3>
          </div>
          <button type="button" onClick={onClose} className="apple-btn apple-btn-glass" style={{ padding: '4px 8px' }}>
            <X size={14} />
          </button>
        </div>

        <textarea
          className="apple-input"
          rows={12}
          value={jsonString}
          onChange={(e) => {
            setJsonString(e.target.value);
            setError(null);
          }}
          style={{ width: '100%', fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', lineHeight: '1.4' }}
        />

        {error && (
          <div style={{ fontSize: '11px', color: '#ef4444' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button type="button" onClick={handleCopy} className="apple-btn apple-btn-glass">
            {copied ? <Check size={12} color="#34c759" /> : <Copy size={12} />}
            <span>{copied ? 'Copied!' : 'Copy JSON'}</span>
          </button>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" onClick={onClose} className="apple-btn apple-btn-glass">
              Cancel
            </button>
            <button type="button" onClick={handleApply} className="apple-btn apple-btn-primary">
              <Upload size={12} />
              <span>Import & Replace</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

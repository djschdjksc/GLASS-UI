import React, { useState, useEffect } from 'react';
import { X, Camera, Upload, CheckCircle2, Sparkles } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onApplyOcrData: (rawItems: any[], moulds: any[]) => void;
}

export const OcrModal: React.FC<Props> = ({ isOpen, onClose, onApplyOcrData }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [slipImage, setSlipImage] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<any | null>(null);

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (!isOpen) return;
      const items = e.clipboardData?.items;
      if (items) {
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf('image') !== -1) {
            const blob = items[i].getAsFile();
            if (blob) {
              const reader = new FileReader();
              reader.onload = (event) => {
                setSlipImage(event.target?.result as string);
                simulateOcr();
              };
              reader.readAsDataURL(blob);
            }
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen]);

  if (!isOpen) return null;

  const simulateOcr = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      setExtractedData({
        party: 'Supertech Electro India Ltd',
        date: '18-09-2026',
        rawItems: [
          { name: 'Alloy Core Sleeve A1', qty: 50, uCap: 45, lCap: 40 },
          { name: 'Copper Bush Bushing 12mm', qty: 80, uCap: 75, lCap: 70 },
          { name: 'Teflon Sealing Ring', qty: 120, uCap: 100, lCap: 95 }
        ],
        finishedItems: [
          { mould: 'Mould A-102 (Standard Rotor)', qty: 50, price: 420, total: 21000 },
          { mould: 'Precision Die X-90', qty: 25, price: 680, total: 17000 }
        ]
      });
    }, 1200);
  };

  const handleApply = () => {
    if (extractedData) {
      onApplyOcrData(extractedData.rawItems, extractedData.finishedItems);
      onClose();
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
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div 
              style={{ 
                width: '32px', 
                height: '32px', 
                borderRadius: '8px', 
                background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 16px rgba(236, 72, 153, 0.4)'
              }}
            >
              <Camera size={18} color="#ffffff" />
            </div>
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: 700 }}>PASTE SLIP IMAGE (AI OCR)</h3>
              <p style={{ fontSize: '11px', color: '#a1a1aa' }}>Press Ctrl+V to paste slip screenshot or upload image</p>
            </div>
          </div>

          <button 
            type="button" 
            onClick={onClose} 
            className="apple-btn apple-btn-glass"
            style={{ padding: '4px 8px' }}
          >
            <X size={14} />
          </button>
        </div>

        <div 
          onClick={simulateOcr}
          style={{
            border: '2px dashed rgba(255, 255, 255, 0.2)',
            borderRadius: '12px',
            padding: '30px 20px',
            textAlign: 'center',
            cursor: 'pointer',
            background: 'rgba(255, 255, 255, 0.02)',
            position: 'relative'
          }}
        >
          {slipImage ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <img 
                src={slipImage} 
                alt="Slip Preview" 
                style={{ maxHeight: '160px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)' }} 
              />
              <span style={{ fontSize: '11px', color: '#34c759', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle2 size={12} /> Image Loaded Successfully
              </span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <Upload size={32} color="#ec4899" style={{ opacity: 0.8 }} />
              <div style={{ fontSize: '13px', fontWeight: 600 }}>
                Click to Load Sample Bill Slip or Press Ctrl+V
              </div>
              <div style={{ fontSize: '11px', color: '#a1a1aa' }}>
                Supports JPG, PNG, WEBP, Invoice slips, hand-written slips
              </div>
            </div>
          )}
        </div>

        {extractedData && (
          <div 
            className="glass-card" 
            style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: '#34c759' }}>
              <Sparkles size={14} />
              <span>AI RECOGNIZED SLIP DATA</span>
            </div>

            <div style={{ fontSize: '11px', color: '#d4d4d8', display: 'flex', justifyContent: 'space-between' }}>
              <span>Detected Party: <strong>{extractedData.party}</strong></span>
              <span>Date: <strong>{extractedData.date}</strong></span>
            </div>

            <div style={{ fontSize: '11px', color: '#94a3b8' }}>
              • Found {extractedData.rawItems.length} raw sub-items breakdown
              <br />
              • Found {extractedData.finishedItems.length} finished moulds (Est Total: ₹38,000)
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button type="button" onClick={onClose} className="apple-btn apple-btn-glass">
            Cancel
          </button>

          <button 
            type="button" 
            disabled={!extractedData}
            onClick={handleApply} 
            className="apple-btn apple-btn-primary"
            style={{ opacity: extractedData ? 1 : 0.5 }}
          >
            <CheckCircle2 size={13} />
            <span>Apply To Current Bill</span>
          </button>
        </div>
      </div>
    </div>
  );
};

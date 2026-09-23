import React from 'react';
import type { BillHeader, RawItem, FinishedItem } from '../types';
import { X, Printer, QrCode } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  header: BillHeader;
  rawItems: RawItem[];
  finishedItems: FinishedItem[];
}

export const SlipModal: React.FC<Props> = ({
  isOpen,
  onClose,
  header,
  rawItems,
  finishedItems
}) => {
  if (!isOpen) return null;

  const grandTotal = finishedItems.reduce((acc, it) => acc + (Number(it.total) || 0), 0);
  const totalRawQty = rawItems.reduce((acc, it) => acc + (Number(it.qty) || 0), 0);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const handlePrint = () => {
    window.print();
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
          width: '650px',
          maxHeight: '92vh',
          overflowY: 'auto',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
          background: '#ffffff',
          color: '#1f2937',
          borderRadius: '16px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e5e7eb', paddingBottom: '12px' }}>
          <div>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#4b5563', letterSpacing: '1px' }}>
              OFFICIAL BILL SLIP / ESTIMATE SUMMARY
            </span>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#111827', margin: '2px 0 0 0' }}>
              {header.docType}
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button 
              type="button" 
              onClick={handlePrint} 
              className="apple-btn apple-btn-primary"
              style={{ padding: '6px 12px', fontSize: '12px' }}
            >
              <Printer size={13} />
              <span>PRINT SLIP</span>
            </button>
            <button 
              type="button" 
              onClick={onClose} 
              style={{ background: '#f3f4f6', border: 'none', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              <X size={14} color="#374151" />
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', background: '#f9fafb', padding: '12px', borderRadius: '10px' }}>
          <div>
            <div style={{ fontSize: '11px', color: '#6b7280' }}>BILLED TO PARTY:</div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#111827' }}>{header.partyName || 'CASH SALE'}</div>
            <div style={{ fontSize: '12px', color: '#4b5563' }}>Type: {header.typeSelection}</div>
            <div style={{ fontSize: '12px', color: '#4b5563' }}>Vehicle No: {header.vehicleNo || 'N/A'}</div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '11px', color: '#6b7280' }}>TOKEN / BILL NO:</div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#dc2626' }}>#{header.tokenNo}</div>
            <div style={{ fontSize: '12px', color: '#4b5563', marginTop: '4px' }}>Date: {header.date}</div>
            <div style={{ fontSize: '11px', color: '#059669', fontWeight: 600 }}>Status: AUTHENTICATED</div>
          </div>
        </div>

        <div>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: '6px' }}>
            FINISHED MOULD BILLING SUMMARY
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ background: '#f3f4f6', borderBottom: '1px solid #d1d5db' }}>
                <th style={{ textAlign: 'left', padding: '6px 8px' }}>MOULD</th>
                <th style={{ textAlign: 'right', padding: '6px 8px' }}>QTY</th>
                <th style={{ textAlign: 'right', padding: '6px 8px' }}>PRICE</th>
                <th style={{ textAlign: 'right', padding: '6px 8px' }}>TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {finishedItems.map((item, idx) => (
                <tr key={item.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '6px 8px', fontWeight: 500 }}>{item.mould || ('Item #' + (idx + 1))}</td>
                  <td style={{ textAlign: 'right', padding: '6px 8px' }}>{item.qty}</td>
                  <td style={{ textAlign: 'right', padding: '6px 8px' }}>₹{item.price}</td>
                  <td style={{ textAlign: 'right', padding: '6px 8px', fontWeight: 700 }}>{formatCurrency(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: '6px' }}>
            RAW / SUB-ITEM SPECIFICATIONS ({rawItems.length} ITEMS, TOTAL QTY: {totalRawQty})
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {rawItems.map((item) => (
              <span 
                key={item.id} 
                style={{ 
                  background: '#f3f4f6', 
                  padding: '4px 8px', 
                  borderRadius: '6px', 
                  fontSize: '11px', 
                  color: '#4b5563',
                  border: '1px solid #e5e7eb'
                }}
              >
                {item.name}: <strong>Qty {item.qty}</strong> (U:{item.uCap} / L:{item.lCap})
              </span>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '2px solid #111827', paddingTop: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <QrCode size={40} color="#111827" />
            <div style={{ fontSize: '10px', color: '#6b7280' }}>
              Verified Digital Record
              <br />
              HWID: A8F9-2026-X99B-8831
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '12px', color: '#4b5563' }}>NET PAYABLE AMOUNT:</div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#059669' }}>
              {formatCurrency(grandTotal)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

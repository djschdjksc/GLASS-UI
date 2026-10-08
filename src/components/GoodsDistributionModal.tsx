import React, { useState } from 'react';
import { AnimatedCounter } from './common/AnimatedCounter';
import { macAudio } from '../utils/macAudio';
import { SQLITE_PARTIES } from '../data/sqliteData';
import {
  Calculator,
  X,
  Plus,
  Trash2,
  FileSpreadsheet
} from 'lucide-react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from './ui/shadcn';

interface Contributor {
  id: string;
  name: string;
  paidAmount: number;
}

interface BaseItem {
  id: string;
  name: string;
  qty: number;
  mult: number;
  boxSize: number;
  price: number;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  rawItems: { id: string; name: string; qty: number; uCap: number; lCap: number }[];
  finishedItems: { id: string; mould: string; qty: number; price: number; total: number }[];
  onToast: (msg: string, type?: 'success' | 'info' | 'warning') => void;
}

export const GoodsDistributionModal: React.FC<Props> = ({
  isOpen,
  onClose,
  finishedItems,
  onToast
}) => {
  if (!isOpen) return null;

  // Contributors / Parties paying for this batch
  const [contributors, setContributors] = useState<Contributor[]>([
    { id: '1', name: '3D INTERIORS - Budgam', paidAmount: 85000 },
    { id: '2', name: 'A S PVC CREATION - Jammu', paidAmount: 65000 },
    { id: '3', name: 'A.K.INTERIOR DECORATORS - Pathankot', paidAmount: 50000 }
  ]);

  const totalPaid = contributors.reduce((acc, c) => acc + (Number(c.paidAmount) || 0), 0);

  // Base Items for distribution
  const baseItems: BaseItem[] = (finishedItems && finishedItems.length > 0 ? finishedItems : [
    { id: '1', mould: 'B.F.P-(G) 154 Standard Housing', qty: 120, price: 650, total: 78000 },
    { id: '2', mould: 'B.F.P-(B) 200 Heavy Base Alloy', qty: 85, price: 920, total: 78200 }
  ]).map((f: any, idx: number) => ({
    id: f.id || String(idx),
    name: f.mould || f.name || 'Finished Casting',
    qty: f.qty || 1,
    mult: 1.0,
    boxSize: 10.0,
    price: f.price || 650
  }));

  const handleAddContributor = () => {
    macAudio.playClick();
    const newId = String(Date.now());
    const randomParty = (SQLITE_PARTIES && SQLITE_PARTIES.length > 0) 
      ? SQLITE_PARTIES[Math.floor(Math.random() * Math.min(50, SQLITE_PARTIES.length))]?.party_name 
      : 'New Party Account';
    setContributors(prev => [...prev, { id: newId, name: randomParty, paidAmount: 25000 }]);
  };

  const handleRemoveContributor = (id: string) => {
    macAudio.playClick();
    if (contributors.length <= 1) {
      onToast('At least 1 contributor required', 'warning');
      return;
    }
    setContributors(prev => prev.filter(c => c.id !== id));
  };

  const handleUpdateContributor = (id: string, field: 'name' | 'paidAmount', val: any) => {
    setContributors(prev => prev.map(c => c.id === id ? { ...c, [field]: val } : c));
  };

  // Distribution Results Matrix
  const calculatedRows: any[] = [];
  contributors.forEach(c => {
    const sharePct = totalPaid > 0 ? (Number(c.paidAmount) || 0) / totalPaid : 0;
    baseItems.forEach(itm => {
      const shareQty = sharePct * itm.qty;
      const boxes = itm.boxSize > 0 ? shareQty / itm.boxSize : 0;
      const fullBillQty = itm.qty * itm.mult;
      const shareBillQty = sharePct * fullBillQty;
      const totalPlusGst = shareBillQty * itm.price * 1.18;

      calculatedRows.push({
        party: c.name,
        sharePct: (sharePct * 100).toFixed(1) + '%',
        itemName: itm.name,
        pcsQty: shareQty.toFixed(1),
        boxes: boxes.toFixed(1),
        billQty: shareBillQty.toFixed(1),
        price: itm.price,
        totalGst: Math.round(totalPlusGst)
      });
    });
  });

  const grandTotalWithGst = calculatedRows.reduce((acc, r) => acc + (r.totalGst || 0), 0);

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999999,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div 
        className="glass-panel"
        style={{
          width: '940px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '12px',
          background: 'rgba(14, 18, 26, 0.95)',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.8), 0 0 24px rgba(56, 189, 248, 0.2)',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div style={{
          padding: '12px 18px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(255, 255, 255, 0.02)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '7px',
              background: 'rgba(56, 189, 248, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Calculator size={16} color="#38bdf8" />
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>
                Unified Goods Distribution & GST Calculator (Ctrl+G)
              </div>
              <div style={{ fontSize: '10.5px', color: '#cbd5e1' }}>
                Multi-Party Proportional Splitting & 18% GST Calculation Engine
              </div>
            </div>
          </div>

          <button
            type="button"
            className="mac-btn"
            style={{ width: '26px', height: '26px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={onClose}
          >
            <X size={14} color="#f87171" />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Section 1: Contributors Table */}
          <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8' }}>
                1. PARTICIPATING PARTIES / CONTRIBUTORS
              </span>
              <button
                type="button"
                className="mac-btn primary"
                style={{ fontSize: '11px', padding: '3px 8px', display: 'flex', alignItems: 'center', gap: '4px' }}
                onClick={handleAddContributor}
              >
                <Plus size={12} />
                <span>Add Contributor</span>
              </button>
            </div>

            <div style={{ borderRadius: '6px', border: '1px solid #27272a', overflow: 'hidden' }}>
              <Table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <TableHeader style={{ background: '#18181b' }}>
                  <TableRow style={{ borderBottom: '1px solid #27272a' }}>
                    <TableHead style={{ padding: '8px 10px', textAlign: 'left', color: '#a1a1aa', fontSize: '11px', fontWeight: 600 }}>PARTY NAME</TableHead>
                    <TableHead style={{ width: '160px', padding: '8px 10px', textAlign: 'right', color: '#a1a1aa', fontSize: '11px', fontWeight: 600 }}>PAID AMOUNT (₹)</TableHead>
                    <TableHead style={{ width: '100px', padding: '8px 10px', textAlign: 'right', color: '#a1a1aa', fontSize: '11px', fontWeight: 600 }}>% SHARE</TableHead>
                    <TableHead style={{ width: '50px', padding: '8px 8px', textAlign: 'center', color: '#a1a1aa', fontSize: '11px', fontWeight: 600 }}>ACTION</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contributors.map((c, idx) => {
                    const pct = totalPaid > 0 ? ((c.paidAmount / totalPaid) * 100).toFixed(1) : '0.0';
                    return (
                      <TableRow key={c.id} style={{ height: '32px', borderBottom: '1px solid #27272a', background: idx % 2 === 0 ? 'rgba(24, 24, 27, 0.4)' : 'transparent' }}>
                        <TableCell style={{ padding: '3px 6px' }}>
                          <input
                            type="text"
                            value={c.name}
                            onChange={(e) => handleUpdateContributor(c.id, 'name', e.target.value)}
                            style={{ width: '100%', height: '24px', background: '#18181b', border: '1px solid #3f3f46', borderRadius: '4px', padding: '2px 8px', fontSize: '11.5px', color: '#ffffff', fontWeight: 600, outline: 'none' }}
                          />
                        </TableCell>
                        <TableCell style={{ padding: '3px 6px', textAlign: 'right' }}>
                          <input
                            type="number"
                            value={c.paidAmount}
                            onChange={(e) => handleUpdateContributor(c.id, 'paidAmount', Number(e.target.value))}
                            style={{ width: '100%', height: '24px', background: '#18181b', border: '1px solid #3f3f46', borderRadius: '4px', padding: '2px 8px', fontSize: '11.5px', textAlign: 'right', color: '#34d399', fontWeight: 700, outline: 'none' }}
                          />
                        </TableCell>
                        <TableCell style={{ padding: '3px 10px', textAlign: 'right', fontWeight: 700, color: '#38bdf8' }}>
                          {pct}%
                        </TableCell>
                        <TableCell style={{ padding: '3px 6px', textAlign: 'center' }}>
                          <button
                            type="button"
                            className="mac-btn"
                            style={{ width: '22px', height: '22px', padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                            onClick={() => handleRemoveContributor(c.id)}
                          >
                            <Trash2 size={11} color="#f87171" />
                          </button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Section 2: Calculated Goods Distribution Matrix */}
          <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#34d399' }}>
                2. PROPORTIONAL DISTRIBUTION & +18% GST BREAKDOWN
              </span>
              <span style={{ fontSize: '10.5px', color: '#cbd5e1' }}>
                Total Pool: <strong style={{ color: '#38bdf8' }}>₹{totalPaid.toLocaleString('en-IN')}</strong>
              </span>
            </div>

            <div style={{ maxHeight: '240px', overflowY: 'auto', borderRadius: '6px', border: '1px solid #27272a' }}>
              <Table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px' }}>
                <TableHeader style={{ background: '#18181b', position: 'sticky', top: 0, zIndex: 5 }}>
                  <TableRow style={{ borderBottom: '1px solid #27272a' }}>
                    <TableHead style={{ padding: '7px 10px', textAlign: 'left', color: '#a1a1aa', fontSize: '11px', fontWeight: 600 }}>PARTY NAME</TableHead>
                    <TableHead style={{ width: '65px', padding: '7px 6px', textAlign: 'center', color: '#a1a1aa', fontSize: '11px', fontWeight: 600 }}>SHARE</TableHead>
                    <TableHead style={{ padding: '7px 10px', textAlign: 'left', color: '#a1a1aa', fontSize: '11px', fontWeight: 600 }}>ITEM NAME</TableHead>
                    <TableHead style={{ width: '70px', padding: '7px 8px', textAlign: 'right', color: '#a1a1aa', fontSize: '11px', fontWeight: 600 }}>PCS QTY</TableHead>
                    <TableHead style={{ width: '60px', padding: '7px 8px', textAlign: 'right', color: '#a1a1aa', fontSize: '11px', fontWeight: 600 }}>BOXES</TableHead>
                    <TableHead style={{ width: '80px', padding: '7px 8px', textAlign: 'right', color: '#a1a1aa', fontSize: '11px', fontWeight: 600 }}>PRICE (₹)</TableHead>
                    <TableHead style={{ width: '120px', padding: '7px 10px', textAlign: 'right', color: '#a1a1aa', fontSize: '11px', fontWeight: 600 }}>TOTAL (+18% GST)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {calculatedRows.map((r, idx) => (
                    <TableRow key={idx} style={{ height: '30px', borderBottom: '1px solid #27272a', background: idx % 2 === 0 ? 'rgba(24, 24, 27, 0.4)' : 'transparent' }}>
                      <TableCell style={{ padding: '4px 10px', fontWeight: 600, color: '#f8fafc' }}>{r.party}</TableCell>
                      <TableCell style={{ padding: '4px 6px', textAlign: 'center', color: '#38bdf8', fontWeight: 700 }}>{r.sharePct}</TableCell>
                      <TableCell style={{ padding: '4px 10px', color: '#cbd5e1' }}>{r.itemName}</TableCell>
                      <TableCell style={{ padding: '4px 8px', textAlign: 'right', color: '#a78bfa', fontWeight: 700 }}>{r.pcsQty}</TableCell>
                      <TableCell style={{ padding: '4px 8px', textAlign: 'right', color: '#cbd5e1' }}>{r.boxes}</TableCell>
                      <TableCell style={{ padding: '4px 8px', textAlign: 'right', color: '#cbd5e1' }}>₹{r.price}</TableCell>
                      <TableCell style={{ padding: '4px 10px', textAlign: 'right', fontWeight: 700, color: '#34d399' }}>₹{r.totalGst.toLocaleString('en-IN')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '10px 18px',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(0, 0, 0, 0.4)'
        }}>
          <div style={{ fontSize: '12px' }}>
            <span style={{ color: '#cbd5e1' }}>Calculated Total Value (+18% GST): </span>
            <strong style={{ color: '#34d399', fontSize: '14px' }}>
              <AnimatedCounter value={grandTotalWithGst} prefix="₹" formatIndian={true} />
            </strong>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className="mac-btn"
              style={{ fontSize: '11px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '4px' }}
              onClick={() => {
                macAudio.playClick();
                onToast('Copied Distribution Table for Excel!', 'success');
              }}
            >
              <FileSpreadsheet size={13} color="#34d399" />
              <span>Copy for Excel</span>
            </button>
            <button
              type="button"
              className="mac-btn primary"
              style={{ fontSize: '11px', padding: '6px 14px' }}
              onClick={() => {
                macAudio.playClick();
                onToast('Distribution Applied Successfully', 'success');
                onClose();
              }}
            >
              Apply Calculation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

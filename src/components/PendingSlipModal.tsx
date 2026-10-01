import React, { useState, useMemo } from 'react';
import { X, Clock, Check, Printer, FileDiff, CheckCircle2 } from 'lucide-react';
import { Select } from 'antd';
import { localDb } from '../services/db/localDb';
import type { BillRecord } from '../services/db/schema';
import type { RawItem, BillHeader } from '../types';
import { macAudio } from '../utils/macAudio';
import { AnimatedCounter } from './common/AnimatedCounter';
import { getUserProfile, getNextUserToken } from '../services/supabaseClient';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentHeader: BillHeader;
  currentRawItems: RawItem[];
  dynamicCols: { field: string; label: string }[];
  onApplyPendingSlip: (pendingHeader: BillHeader, pendingRawItems: RawItem[], noteText: string) => void;
  onDirectPrintPending?: (header: BillHeader, rawItems: RawItem[]) => void;
  onToast: (msg: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

export const PendingSlipModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentHeader,
  currentRawItems,
  dynamicCols,
  onApplyPendingSlip,
  onDirectPrintPending,
  onToast
}) => {
  // Slip 1: Main Order Slip (jisme se maal nikalna hai)
  const [mainSlipToken, setMainSlipToken] = useState<string>('');

  // Slip 2: Dispatched Slip (jo maal chala gaya)
  const [dispSlipToken, setDispSlipToken] = useState<string>('');

  const allSavedBills = useMemo(() => {
    return localDb.getBills().sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  }, [isOpen]);

  // Find Main Bill
  const mainBill: BillRecord | undefined = useMemo(() => {
    if (!mainSlipToken) return undefined;
    const clean = mainSlipToken.trim();
    return allSavedBills.find(b => String(b.token) === clean || b.id === clean || b.id === `B-${clean}`);
  }, [mainSlipToken, allSavedBills]);

  // Find Dispatched Bill
  const dispatchedBill: BillRecord | undefined = useMemo(() => {
    if (!dispSlipToken) return undefined;
    const clean = dispSlipToken.trim();
    return allSavedBills.find(b => String(b.token) === clean || b.id === clean || b.id === `B-${clean}`);
  }, [dispSlipToken, allSavedBills]);

  const dispatchedItems: RawItem[] = useMemo(() => {
    return dispatchedBill?.rawItems || [];
  }, [dispatchedBill]);

  // Calculate Pending Balance: Main - Dispatched
  const pendingCalculation = useMemo(() => {
    if (!mainBill || !mainBill.rawItems || mainBill.rawItems.length === 0) {
      return { pendingRows: [], totalMain: 0, totalDisp: 0, totalPending: 0, omittedCount: 0 };
    }

    const sizeKeys = ['qty', ...dynamicCols.map(c => c.field), 'uCap', 'lCap'];

    // Map dispatched items by lower-case trimmed name
    const dispItemMap = new Map<string, RawItem>();
    dispatchedItems.forEach(r => {
      const nameKey = (r.name || '').trim().toLowerCase();
      if (nameKey) {
        dispItemMap.set(nameKey, r);
      }
    });

    let totalMain = 0;
    let totalDisp = 0;
    let totalPending = 0;
    let omittedCount = 0;

    const pendingRows: Array<{
      item: RawItem;
      mainRowTotal: number;
      dispRowTotal: number;
      pendingRowTotal: number;
    }> = [];

    mainBill.rawItems.forEach((mItem, idx) => {
      const nameKey = (mItem.name || '').trim().toLowerCase();
      if (!nameKey && Number(mItem.qty) === 0) return;

      const dItem = dispItemMap.get(nameKey) || dispatchedItems[idx];

      let mainRowSum = 0;
      let dispRowSum = 0;
      let pendingRowSum = 0;

      const pendingItem: RawItem = {
        id: String(Date.now() + idx),
        name: mItem.name,
        partyCode: mItem.partyCode || '',
        qty: 0,
        uCap: 0,
        lCap: 0
      };

      sizeKeys.forEach(colKey => {
        const mVal = Math.max(0, Number((mItem as any)[colKey]) || 0);
        const dVal = dItem ? Math.max(0, Number((dItem as any)[colKey]) || 0) : 0;

        mainRowSum += mVal;
        dispRowSum += dVal;

        // Pending formula: Main - Dispatched (<= 0 becomes 0)
        const diff = mVal - dVal;
        const pendingVal = diff > 0 ? diff : 0;

        (pendingItem as any)[colKey] = pendingVal;
        pendingRowSum += pendingVal;
      });

      totalMain += mainRowSum;
      totalDisp += dispRowSum;

      // Omit row if all columns have 0 pending
      if (pendingRowSum > 0) {
        pendingRows.push({
          item: pendingItem,
          mainRowTotal: mainRowSum,
          dispRowTotal: dispRowSum,
          pendingRowTotal: pendingRowSum
        });
        totalPending += pendingRowSum;
      } else {
        omittedCount++;
      }
    });

    return {
      pendingRows,
      totalMain,
      totalDisp,
      totalPending,
      omittedCount
    };
  }, [mainBill, dispatchedItems, dynamicCols]);

  if (!isOpen) return null;

  // Build options for Ant Design Select
  const billSelectOptions = allSavedBills.map(b => {
    const rawSum = (b.rawItems || []).reduce((acc, r) => acc + (Number(r.qty) || 0), 0);
    const displayPcs = b.total || rawSum;
    return {
      value: String(b.token),
      searchStr: `${b.token} ${b.party || ''} ${b.date || ''}`.toLowerCase(),
      label: (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '3px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                background: 'rgba(56, 189, 248, 0.15)',
                color: '#38bdf8',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                padding: '1px 6px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 800,
                fontFamily: "'JetBrains Mono', monospace"
              }}
            >
              #{b.token}
            </span>
            <span style={{ fontWeight: 600, color: '#f8fafc', fontSize: '12px' }}>
              {b.party || 'CASH SALE'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '11px' }}>
            <span style={{ color: '#94a3b8' }}>{b.date}</span>
            <span style={{ color: '#34d399', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>
              {displayPcs} pcs
            </span>
          </div>
        </div>
      )
    };
  });

  const handleApply = () => {
    if (!mainBill) {
      onToast('Pehle Main / Original Slip select karein!', 'warning');
      return;
    }

    if (!dispatchedBill) {
      onToast('Kripya Dispatched Slip (jo maal gaya) bhi select karein!', 'warning');
      return;
    }

    if (pendingCalculation.pendingRows.length === 0) {
      onToast('⚠️ Dono slips compare karne par koi maal pending nahi bacha!', 'info');
      return;
    }

    macAudio.playSuccess();

    // Fresh token for new pending slip
    const profile = getUserProfile();
    const nextToken = getNextUserToken(localDb.getBills(), profile.prefix);

    const noteString = `PENDING BALANCE (MAIN SLIP #${mainBill.token} - DISPATCHED SLIP #${dispatchedBill.token}) | PENDING`;

    const pendingHeader: BillHeader = {
      ...currentHeader,
      partyName: mainBill.party || currentHeader.partyName,
      docType: mainBill.docType || 'CHALLAN',
      tokenNo: nextToken,
      date: new Date().toISOString().split('T')[0]
    };

    const finalRawItems = pendingCalculation.pendingRows.map(r => r.item);
    const pad = Math.max(0, 10 - finalRawItems.length);
    for (let i = 0; i < pad; i++) {
      finalRawItems.push({
        id: String(Date.now() + 200 + i),
        name: '',
        qty: 0,
        uCap: 0,
        lCap: 0
      });
    }

    onApplyPendingSlip(pendingHeader, finalRawItems, noteString);
    onToast(`New Pending Slip #${nextToken} ready for Main Slip #${mainBill.token}! (${pendingCalculation.pendingRows.length} items)`, 'success');
    onClose();
  };

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
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div
        className="glass-panel"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '780px',
          maxWidth: '96vw',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.85)',
          background: 'rgba(15, 23, 42, 0.92)',
          overflow: 'hidden'
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '12px 18px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(30, 41, 59, 0.4)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
            <div
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '7px',
                background: 'rgba(56, 189, 248, 0.15)',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#38bdf8'
              }}
            >
              <FileDiff size={16} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#f8fafc', letterSpacing: '0.03em' }}>
                  2-SLIP PENDING BALANCE CALCULATOR
                </span>
                <span
                  style={{
                    fontSize: '9.5px',
                    fontWeight: 800,
                    padding: '1px 6px',
                    borderRadius: '4px',
                    background: 'rgba(56, 189, 248, 0.18)',
                    color: '#38bdf8',
                    border: '1px solid rgba(56, 189, 248, 0.4)'
                  }}
                >
                  BALANCE SLIP
                </span>
              </div>
              <p style={{ fontSize: '11px', color: '#94a3b8', margin: '2px 0 0 0' }}>
                Main Slip se Dispatched Slip minus karke bacha hua pending maal nayi slip me load karein
              </p>
            </div>
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

        {/* Modal Body */}
        <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto' }}>
          
          {/* Dual Dropdowns Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            
            {/* Box 1: Main Order Slip */}
            <div
              style={{
                padding: '10px 12px',
                borderRadius: '8px',
                background: 'rgba(0, 0, 0, 0.25)',
                border: '1px solid rgba(56, 189, 248, 0.2)',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#38bdf8' }}>
                  1. MAIN ORDER SLIP
                </span>
                {mainBill && (
                  <span style={{ fontSize: '10px', color: '#34d399', fontWeight: 700 }}>
                    #{mainBill.token} ({pendingCalculation.totalMain} pcs)
                  </span>
                )}
              </div>
              <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                Pura master order (jisme se ghataana hai)
              </div>

              <Select
                showSearch
                allowClear
                placeholder="Slip number ya party search karein..."
                value={mainSlipToken || undefined}
                onChange={(val: string | null) => setMainSlipToken(val || '')}
                filterOption={(input: string, option: any) =>
                  Boolean((option?.searchStr as string || '').includes(input.toLowerCase()))
                }
                style={{ width: '100%' }}
                options={billSelectOptions}
                dropdownStyle={{ zIndex: 1000000005, background: '#0f172a' }}
                getPopupContainer={() => document.body}
              />
            </div>

            {/* Box 2: Dispatched Slip */}
            <div
              style={{
                padding: '10px 12px',
                borderRadius: '8px',
                background: 'rgba(0, 0, 0, 0.25)',
                border: '1px solid rgba(251, 146, 60, 0.2)',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#fb923c' }}>
                  2. DISPATCHED SLIP
                </span>
                {dispatchedBill && (
                  <span style={{ fontSize: '10px', color: '#34d399', fontWeight: 700 }}>
                    #{dispatchedBill.token} ({pendingCalculation.totalDisp} pcs)
                  </span>
                )}
              </div>
              <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                Jo maal chala gaya (gaya hua maal)
              </div>

              <Select
                showSearch
                allowClear
                placeholder="Slip number ya party search karein..."
                value={dispSlipToken || undefined}
                onChange={(val: string | null) => setDispSlipToken(val || '')}
                filterOption={(input: string, option: any) =>
                  Boolean((option?.searchStr as string || '').includes(input.toLowerCase()))
                }
                style={{ width: '100%' }}
                options={billSelectOptions.filter(o => o.value !== mainSlipToken)}
                dropdownStyle={{ zIndex: 1000000005, background: '#0f172a' }}
                getPopupContainer={() => document.body}
              />
            </div>
          </div>

          {/* Quick Stat Pill Bar */}
          {mainBill && dispatchedBill && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '10px',
                background: 'rgba(0, 0, 0, 0.3)',
                padding: '8px 12px',
                borderRadius: '7px',
                border: '1px solid rgba(255, 255, 255, 0.06)'
              }}
            >
              <div>
                <div style={{ fontSize: '10px', color: '#94a3b8' }}>1. Main Slip Order:</div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#38bdf8', fontFamily: "'JetBrains Mono', monospace" }}>
                  <AnimatedCounter value={pendingCalculation.totalMain} suffix=" pcs" />
                </div>
              </div>
              <div>
                <div style={{ fontSize: '10px', color: '#94a3b8' }}>2. Dispatched:</div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#fb923c', fontFamily: "'JetBrains Mono', monospace" }}>
                  <AnimatedCounter value={pendingCalculation.totalDisp} suffix=" pcs" />
                </div>
              </div>
              <div>
                <div style={{ fontSize: '10px', color: '#fef08a' }}>3. Pending Remaining:</div>
                <div style={{ fontSize: '15px', fontWeight: 900, color: '#fbbf24', fontFamily: "'JetBrains Mono', monospace" }}>
                  <AnimatedCounter value={pendingCalculation.totalPending} suffix=" pcs" />
                </div>
              </div>
            </div>
          )}

          {/* Table Breakdown */}
          {mainBill && dispatchedBill ? (
            <div
              style={{
                borderRadius: '8px',
                background: 'rgba(0, 0, 0, 0.25)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                padding: '10px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#e2e8f0' }}>
                  PENDING ITEMS BREAKDOWN:
                </span>
                <span style={{ fontSize: '10.5px', color: '#94a3b8' }}>
                  {pendingCalculation.pendingRows.length} item(s) pending
                </span>
              </div>

              {pendingCalculation.pendingRows.length > 0 ? (
                <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  <table className="apple-table" style={{ width: '100%', fontSize: '11px' }}>
                    <thead>
                      <tr>
                        <th style={{ width: '32px', textAlign: 'center' }}>#</th>
                        <th>ITEM NAME</th>
                        <th style={{ width: '100px', textAlign: 'right', color: '#38bdf8' }}>MAIN SLIP</th>
                        <th style={{ width: '100px', textAlign: 'right', color: '#fb923c' }}>DISPATCHED</th>
                        <th style={{ width: '110px', textAlign: 'right', color: '#fbbf24' }}>PENDING</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingCalculation.pendingRows.map((p, idx) => (
                        <tr key={p.item.id || idx} className="mac-table-row">
                          <td style={{ textAlign: 'center', color: '#64748b' }}>{idx + 1}</td>
                          <td style={{ fontWeight: 600, color: '#f8fafc' }}>{p.item.name}</td>
                          <td style={{ textAlign: 'right', color: '#94a3b8', fontFamily: "'JetBrains Mono', monospace" }}>{p.mainRowTotal}</td>
                          <td style={{ textAlign: 'right', color: '#cbd5e1', fontFamily: "'JetBrains Mono', monospace" }}>{p.dispRowTotal}</td>
                          <td style={{ textAlign: 'right', fontWeight: 800, color: '#fbbf24', fontFamily: "'JetBrains Mono', monospace" }}>
                            {p.pendingRowTotal}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '16px', color: '#34d399', fontSize: '11.5px', fontWeight: 600 }}>
                  <CheckCircle2 size={18} style={{ margin: '0 auto 6px auto', display: 'block' }} />
                  Main Slip #{mainBill.token} ka pura maal Dispatched Slip #{dispatchedBill.token} me chala gaya hai! Koi pending nahi hai.
                </div>
              )}

              {pendingCalculation.omittedCount > 0 && (
                <div style={{ fontSize: '10px', color: '#64748b', fontStyle: 'italic', paddingTop: '2px' }}>
                  ℹ️ {pendingCalculation.omittedCount} full row(s) automatically omitted (jinme 0 bacha tha).
                </div>
              )}
            </div>
          ) : (
            <div
              style={{
                padding: '24px',
                textAlign: 'center',
                color: '#64748b',
                background: 'rgba(0, 0, 0, 0.2)',
                borderRadius: '8px',
                border: '1px dashed rgba(255, 255, 255, 0.08)',
                fontSize: '11.5px'
              }}
            >
              Upar se <strong>Main Slip</strong> aur <strong>Dispatched Slip</strong> chunein taaki pending hisab nikal sake.
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '10px 18px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(30, 41, 59, 0.3)'
          }}
        >
          <button
            type="button"
            onClick={onClose}
            className="mac-btn"
            style={{ fontSize: '11px', padding: '5px 12px' }}
          >
            Cancel
          </button>

          <div style={{ display: 'flex', gap: '8px' }}>
            {onDirectPrintPending && mainBill && pendingCalculation.pendingRows.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  if (mainBill) {
                    onDirectPrintPending(
                      {
                        ...currentHeader,
                        partyName: mainBill.party,
                        tokenNo: `${mainBill.token}-PENDING`
                      },
                      pendingCalculation.pendingRows.map(r => r.item)
                    );
                  }
                }}
                className="mac-btn"
                style={{ fontSize: '11px', padding: '5px 12px' }}
              >
                <Printer size={13} color="#38bdf8" />
                <span>Direct Print</span>
              </button>
            )}

            <button
              type="button"
              disabled={!mainBill || !dispatchedBill || pendingCalculation.pendingRows.length === 0}
              onClick={handleApply}
              className="mac-btn primary"
              style={{
                fontSize: '11px',
                padding: '5px 14px',
                opacity: (!mainBill || !dispatchedBill || pendingCalculation.pendingRows.length === 0) ? 0.45 : 1
              }}
            >
              <Check size={13} />
              <span>Create Pending Slip ({pendingCalculation.totalPending} pcs)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PendingSlipModal;

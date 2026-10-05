import React, { useEffect, useState } from 'react';
import { History, X, User, Clock, ArrowRight, ShieldCheck, RefreshCw } from 'lucide-react';
import { supabaseSyncService, type BillChangeLog } from '../services/supabaseSync';
import { macAudio } from '../utils/macAudio';
import { Tooltip } from './ui/shadcn';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  billId: string;
  billToken: string;
  partyName?: string;
}

export const BillAuditHistoryModal: React.FC<Props> = ({
  isOpen,
  onClose,
  billId,
  billToken,
  partyName
}) => {
  const [logs, setLogs] = useState<BillChangeLog[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLogs = async () => {
    if (!billId) return;
    setLoading(true);
    try {
      const data = await supabaseSyncService.getBillAuditHistory(billId);
      setLogs(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && billId) {
      fetchLogs();
    }
  }, [isOpen, billId]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)'
      }}
    >
      <div
        style={{
          width: 'min(640px, 100%)',
          maxHeight: '85vh',
          background: 'linear-gradient(145deg, rgba(28, 33, 44, 0.96), rgba(13, 16, 23, 0.98))',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '24px',
          boxShadow: '0 30px 80px rgba(0, 0, 0, 0.75), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          color: '#ffffff',
          fontFamily: 'inherit'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'rgba(255, 255, 255, 0.03)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'rgba(192, 132, 252, 0.15)',
                border: '1px solid rgba(192, 132, 252, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#c084fc',
                flexShrink: 0
              }}
            >
              <History size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>
                  Audit History & Cell Changes
                </h3>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    background: 'rgba(192, 132, 252, 0.2)',
                    color: '#e9d5ff',
                    border: '1px solid rgba(192, 132, 252, 0.35)',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontFamily: 'monospace'
                  }}
                >
                  Token #{billToken}
                </span>
              </div>
              <p style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)', margin: '3px 0 0 0' }}>
                {partyName ? `Party: ${partyName} • ` : ''}Kis user ne kab kya badla
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Tooltip title="Refresh Logs" side="bottom">
              <button
                type="button"
                onClick={fetchLogs}
                style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  padding: '6px',
                  color: 'rgba(255, 255, 255, 0.6)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <RefreshCw size={15} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
              </button>
            </Tooltip>
            <Tooltip title="Close (Esc)" side="bottom">
              <button
                type="button"
                onClick={onClose}
                style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  padding: '6px',
                  color: 'rgba(255, 255, 255, 0.6)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <X size={16} />
              </button>
            </Tooltip>
          </div>
        </div>

        {/* Timeline Log Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {loading ? (
            <div style={{ padding: '40px 0', textAlign: 'center', color: 'rgba(255, 255, 255, 0.5)', fontSize: '12px' }}>
              Cloud se changes load ho rahe hain...
            </div>
          ) : logs.length === 0 ? (
            <div
              style={{
                padding: '40px 20px',
                textAlign: 'center',
                border: '1px dashed rgba(255, 255, 255, 0.15)',
                borderRadius: '16px',
                background: 'rgba(255, 255, 255, 0.02)'
              }}
            >
              <ShieldCheck size={32} color="#34d399" style={{ margin: '0 auto 10px auto', display: 'block', opacity: 0.8 }} />
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.8)' }}>
                No Modifications Logged Yet
              </div>
              <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.45)', marginTop: '4px' }}>
                Jab bhi koi user rate, quantity, party ya koi cell badlega, yahan exact history banegi.
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {logs.map((log) => {
                const dateObj = new Date(log.changed_at);
                const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
                const dateStr = dateObj.toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' });

                return (
                  <div
                    key={log.id}
                    style={{
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '14px',
                      padding: '12px 16px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '11.5px',
                            fontWeight: 700,
                            color: '#c084fc',
                            background: 'rgba(192, 132, 252, 0.15)',
                            padding: '2px 8px',
                            borderRadius: '6px'
                          }}
                        >
                          <User size={11} /> {log.user_name || 'User'}
                        </span>
                        <span
                          style={{
                            fontSize: '11.5px',
                            fontWeight: 600,
                            color: 'rgba(255, 255, 255, 0.8)',
                            background: 'rgba(255, 255, 255, 0.08)',
                            padding: '2px 8px',
                            borderRadius: '6px'
                          }}
                        >
                          {log.field_name}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10.5px', color: 'rgba(255, 255, 255, 0.45)' }}>
                        <Clock size={11} />
                        <span>{dateStr} at {timeStr}</span>
                      </div>
                    </div>

                    {/* Diff Values */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '12px',
                        fontFamily: 'monospace',
                        background: 'rgba(0, 0, 0, 0.35)',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '1px solid rgba(255, 255, 255, 0.05)'
                      }}
                    >
                      <span style={{ color: '#fda4af', textDecoration: 'line-through', maxWidth: '45%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {log.old_value || '(empty)'}
                      </span>
                      <ArrowRight size={13} color="rgba(255, 255, 255, 0.3)" style={{ flexShrink: 0 }} />
                      <span style={{ color: '#86efac', fontWeight: 700, maxWidth: '45%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {log.new_value || '(empty)'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 24px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'rgba(255, 255, 255, 0.03)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '11px',
            color: 'rgba(255, 255, 255, 0.5)'
          }}
        >
          <span>Total Changes Logged: {logs.length}</span>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '6px 16px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#ffffff',
              fontSize: '11.5px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

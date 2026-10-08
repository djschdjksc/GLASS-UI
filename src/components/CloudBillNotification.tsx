import React, { useEffect } from 'react';
import { FileText, X, ExternalLink, ArrowRight } from 'lucide-react';
import { macAudio } from '../utils/macAudio';

export interface CloudNotificationData {
  id: string;
  token: string;
  party: string;
  total: number;
  fromUser: string;
  docType?: string;
  billData?: any;
}

interface Props {
  notification: CloudNotificationData | null;
  onClose: () => void;
  onViewBill?: (bill: any) => void;
}

export const CloudBillNotification: React.FC<Props> = ({
  notification,
  onClose,
  onViewBill
}) => {
  useEffect(() => {
    if (notification) {
      try {
        macAudio.playSuccess();
      } catch {}

      const timer = setTimeout(() => {
        onClose();
      }, 7000);

      return () => clearTimeout(timer);
    }
  }, [notification, onClose]);

  if (!notification) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        bottom: '24px',
        left: '24px',
        zIndex: 99999999,
        maxWidth: '390px',
        width: 'calc(100% - 48px)',
        background: '#09090b',
        border: '1px solid rgba(16, 185, 129, 0.45)',
        borderRadius: '8px',
        boxShadow: '0 10px 30px -4px rgba(0, 0, 0, 0.8), 0 0 1px 1px rgba(255, 255, 255, 0.08)',
        padding: '12px 14px',
        color: '#f4f4f5',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Inter", sans-serif',
        boxSizing: 'border-box',
        animation: 'shadcnToastEnter 0.22s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      {/* Accent Indicator Bar */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: '3.5px',
          background: '#10b981',
          borderRadius: '8px 0 0 8px'
        }}
      />

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', paddingLeft: '4px' }}>
        {/* Emerald Icon */}
        <div
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '6px',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#10b981',
            flexShrink: 0,
            marginTop: '1px'
          }}
        >
          <FileText size={15} />
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#10b981', letterSpacing: '0.4px', textTransform: 'uppercase' }}>
              Incoming Cloud Bill
            </span>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '20px',
                width: '20px',
                borderRadius: '4px',
                border: 'none',
                background: 'transparent',
                color: '#71717a',
                cursor: 'pointer',
                padding: 0,
                transition: 'color 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#f4f4f5';
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#71717a';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <X size={13} />
            </button>
          </div>

          <div style={{ fontSize: '13px', fontWeight: 600, color: '#f4f4f5', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            Token #{notification.token} • {notification.party}
          </div>

          <div style={{ fontSize: '12px', color: '#a1a1aa', marginTop: '3px' }}>
            Total: <strong style={{ color: '#38bdf8', fontWeight: 600 }}>₹{Number(notification.total || 0).toLocaleString('en-IN')}</strong> • By <span style={{ color: '#c084fc', fontWeight: 500 }}>{notification.fromUser || 'Counter'}</span>
          </div>

          {/* Action Button */}
          {onViewBill && notification.billData && (
            <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => {
                  macAudio.playClick();
                  onViewBill(notification.billData);
                  onClose();
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  height: '26px',
                  padding: '0 10px',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  borderRadius: '6px',
                  border: '1px solid #27272a',
                  background: '#18181b',
                  color: '#10b981',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(16, 185, 129, 0.15)';
                  e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#18181b';
                  e.currentTarget.style.borderColor = '#27272a';
                }}
              >
                <span>View Bill</span>
                <ArrowRight size={12} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

};

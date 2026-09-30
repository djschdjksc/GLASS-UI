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
      style={{
        position: 'fixed',
        top: '20px',
        right: '24px',
        zIndex: 9999999,
        maxWidth: '380px',
        width: 'calc(100% - 48px)',
        background: 'linear-gradient(135deg, rgba(20, 24, 33, 0.95), rgba(10, 14, 20, 0.98))',
        border: '1px solid rgba(37, 211, 102, 0.45)',
        borderRadius: '16px',
        boxShadow: '0 16px 40px rgba(0, 0, 0, 0.65), 0 0 25px rgba(37, 211, 102, 0.25)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        padding: '14px 16px',
        color: '#ffffff',
        animation: 'slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        {/* Animated Green Bill Icon */}
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: 'rgba(37, 211, 102, 0.15)',
            border: '1px solid rgba(37, 211, 102, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#25D366',
            flexShrink: 0
          }}
        >
          <FileText size={20} />
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#25D366', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
              ⚡ Naya Bill Recieved!
            </span>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'rgba(255, 255, 255, 0.4)',
                cursor: 'pointer',
                padding: '2px',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <X size={14} />
            </button>
          </div>

          <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            Token #{notification.token} • {notification.party}
          </div>

          <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.65)', marginTop: '2px' }}>
            Total: <strong style={{ color: '#38bdf8' }}>₹{Number(notification.total || 0).toLocaleString('en-IN')}</strong> • By <span style={{ color: '#c084fc', fontWeight: 600 }}>{notification.fromUser || 'Counter'}</span>
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
                  background: 'rgba(37, 211, 102, 0.2)',
                  border: '1px solid rgba(37, 211, 102, 0.4)',
                  color: '#25D366',
                  borderRadius: '8px',
                  padding: '4px 10px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'all 0.15s'
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

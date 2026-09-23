import React from 'react';
import { RefreshCw, CheckCircle2, AlertCircle, WifiOff, Cloud } from 'lucide-react';
import { useDatabase } from '../../context/DatabaseContext';

export const SyncStatusBadge: React.FC = () => {
  const { syncStats, triggerSync } = useDatabase();

  const getStatusDisplay = () => {
    switch (syncStats.status) {
      case 'syncing':
        return {
          icon: <RefreshCw size={11} className="spin-animation" color="#38bdf8" />,
          label: syncStats.pendingCount > 0 ? `Syncing (${syncStats.pendingCount})` : 'Syncing...',
          color: '#38bdf8',
          bg: 'rgba(56, 189, 248, 0.12)',
          border: 'rgba(56, 189, 248, 0.3)'
        };
      case 'offline':
        return {
          icon: <WifiOff size={11} color="#f59e0b" />,
          label: 'Offline (Local Ready)',
          color: '#f59e0b',
          bg: 'rgba(245, 158, 11, 0.12)',
          border: 'rgba(245, 158, 11, 0.3)'
        };
      case 'error':
        return {
          icon: <AlertCircle size={11} color="#ef4444" />,
          label: 'Sync Error',
          color: '#ef4444',
          bg: 'rgba(239, 68, 68, 0.12)',
          border: 'rgba(239, 68, 68, 0.3)'
        };
      case 'synced':
      case 'idle':
      default:
        return {
          icon: <CheckCircle2 size={11} color="#34d399" />,
          label: syncStats.pendingCount > 0 ? `${syncStats.pendingCount} Pending` : 'DB Synced',
          color: '#34d399',
          bg: 'rgba(52, 211, 153, 0.12)',
          border: 'rgba(52, 211, 153, 0.3)'
        };
    }
  };

  const statusInfo = getStatusDisplay();

  return (
    <button
      type="button"
      onClick={() => triggerSync()}
      title="Local & Server Sync Status (Click to force sync)"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding: '2px 8px',
        borderRadius: '12px',
        background: statusInfo.bg,
        border: `1px solid ${statusInfo.border}`,
        color: statusInfo.color,
        fontSize: '10.5px',
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        userSelect: 'none'
      }}
    >
      {statusInfo.icon}
      <span>{statusInfo.label}</span>
      <span style={{
        width: '5px',
        height: '5px',
        borderRadius: '50%',
        background: statusInfo.color,
        boxShadow: `0 0 6px ${statusInfo.color}`
      }} />
    </button>
  );
};

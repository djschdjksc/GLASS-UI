export type SyncStatus = 'idle' | 'syncing' | 'offline' | 'error' | 'synced';

export interface SyncStats {
  lastSyncTime: number | null;
  pendingCount: number;
  syncedCount: number;
  failedCount: number;
  status: SyncStatus;
  errorMessage?: string;
}

export interface SyncEventPayload {
  type: 'SYNC_STARTED' | 'SYNC_COMPLETED' | 'SYNC_FAILED' | 'PEER_DELTA_RECEIVED';
  stats: SyncStats;
  timestamp: number;
}

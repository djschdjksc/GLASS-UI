import { localDb } from '../db/localDb';
import type { SyncStatus, SyncStats, SyncEventPayload } from './syncTypes';

type SyncListener = (stats: SyncStats) => void;

class SyncEngine {
  private status: SyncStatus = 'idle';
  private lastSyncTime: number | null = null;
  private syncedCount = 0;
  private failedCount = 0;
  private errorMessage?: string;
  private intervalId: any = null;
  private listeners: Set<SyncListener> = new Set();
  private broadcastChannel: BroadcastChannel | null = null;
  private isProcessingQueue = false;

  constructor() {
    this.initBroadcastChannel();
  }

  // Inter-instance and inter-tab communication channel
  private initBroadcastChannel() {
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        this.broadcastChannel = new BroadcastChannel('modern_accounting_sync_channel');
        this.broadcastChannel.onmessage = async (event) => {
          const { type, payload } = event.data;
          if (type === 'DELTA_UPDATE' && payload) {
            await localDb.applyRemoteDelta(payload);
            this.notifyListeners();
          }
        };
      }
    } catch (e) {
      console.warn('BroadcastChannel not supported in environment');
    }
  }

  public start(intervalMs = 8000) {
    if (this.intervalId) return;

    // Listen to localDb sync_queue changes
    localDb.subscribe('sync_queue', () => {
      this.processQueue();
    });

    // Start background sync interval
    this.intervalId = setInterval(() => {
      this.syncAll();
    }, intervalMs);

    // Initial trigger
    this.syncAll();
  }

  public stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  public subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    listener(this.getStats());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners() {
    const stats = this.getStats();
    this.listeners.forEach(l => {
      try { l(stats); } catch (e) { console.error('Sync listener error:', e); }
    });
  }

  public getStats(): SyncStats {
    const pendingQueue = localDb.getSyncQueue();
    return {
      lastSyncTime: this.lastSyncTime,
      pendingCount: pendingQueue.length,
      syncedCount: this.syncedCount,
      failedCount: this.failedCount,
      status: this.status,
      errorMessage: this.errorMessage
    };
  }

  // Trigger manual or background sync cycle
  public async syncAll(): Promise<void> {
    if (this.isProcessingQueue) return;

    if (!navigator.onLine) {
      this.status = 'offline';
      this.notifyListeners();
      return;
    }

    this.status = 'syncing';
    this.notifyListeners();

    try {
      await this.processQueue();
      await this.fetchRemoteDelta();

      this.status = 'synced';
      this.lastSyncTime = Date.now();
      this.errorMessage = undefined;
    } catch (err: any) {
      this.status = 'error';
      this.errorMessage = err.message || 'Background sync error';
    } finally {
      this.notifyListeners();
    }
  }

  // Flush outbound local changes queue
  private async processQueue() {
    if (this.isProcessingQueue) return;
    this.isProcessingQueue = true;

    try {
      const queue = localDb.getSyncQueue();
      for (const item of queue) {
        // Broadcast to other tabs/instances immediately
        if (this.broadcastChannel) {
          this.broadcastChannel.postMessage({
            type: 'DELTA_UPDATE',
            payload: {
              [item.entityType]: item.action === 'DELETE' ? [] : [item.payload]
            }
          });
        }

        // Simulate ultra-fast server commit or live API dispatch
        await new Promise(r => setTimeout(r, 40));
        await localDb.removeSyncQueueItem(item.id);
        this.syncedCount++;
      }
    } catch (e: any) {
      this.failedCount++;
      this.errorMessage = e.message;
    } finally {
      this.isProcessingQueue = false;
      this.notifyListeners();
    }
  }

  // Background fetch remote delta updates
  private async fetchRemoteDelta() {
    // In full deployment, this queries GET /api/v1/sync/delta?since=lastSyncTime
    // Pre-fetches in background so local db is always fast and warm.
    return Promise.resolve();
  }
}

export const syncEngine = new SyncEngine();

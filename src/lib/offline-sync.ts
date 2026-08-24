import { set as idbSet, get as idbGet } from 'idb-keyval';

const PENDING_OPS_KEY = 'metalpedia-pending-ops';

export interface PendingOperation {
  id: string;
  type: 'favorite_add' | 'favorite_remove' | 'review_submit';
  payload: any;
  timestamp: number;
  retryCount: number;
}

class OfflineSyncManager {
  private isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private listeners: Set<(online: boolean) => void> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.setOnline(true));
      window.addEventListener('offline', () => this.setOnline(false));
    }
  }

  private setOnline(online: boolean) {
    this.isOnline = online;
    this.listeners.forEach((cb) => cb(online));
    if (online) this.syncPendingOperations();
  }

  onStatusChange(callback: (online: boolean) => void) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  isCurrentlyOnline() {
    return this.isOnline;
  }

  async addPendingOperation(op: Omit<PendingOperation, 'id' | 'timestamp' | 'retryCount'>) {
    const fullOp: PendingOperation = {
      ...op,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      retryCount: 0,
    };

    const ops = await this.getPendingOperations();
    ops.push(fullOp);
    await idbSet(PENDING_OPS_KEY, ops);

    if (this.isOnline) this.syncPendingOperations();
  }

  async getPendingOperations(): Promise<PendingOperation[]> {
    return (await idbGet(PENDING_OPS_KEY)) || [];
  }

  async syncPendingOperations() {
    if (!this.isOnline) return;
    const ops = await this.getPendingOperations();
    console.log(`🔄 Syncing ${ops.length} pending operations...`);
    // Logique de sync vers backend
  }
}

export const offlineSync = new OfflineSyncManager();

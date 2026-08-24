import {
  set as idbSet,
  get as idbGet,
  del as idbDel,
  createStore,
} from 'idb-keyval';

// ═══════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════

const idbStore = createStore('metalpedia', 'offline-sync');
const PENDING_OPS_KEY = 'metalpedia-pending-ops';
const MAX_RETRY_COUNT = 5;
const RETRY_DELAY_MS = 5000; // 5 secondes entre les tentatives

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

export type OperationType =
  | 'favorite_add'
  | 'favorite_remove'
  | 'review_submit'
  | 'profile_update'
  | 'gamification_sync';

export interface PendingOperation {
  id: string;
  type: OperationType;
  payload: any;
  timestamp: number;
  retryCount: number;
}

type StatusCallback = (online: boolean) => void;
type SyncCallback = (operations: PendingOperation[]) => Promise<void>;

// ═══════════════════════════════════════════
// MANAGER DE SYNCHRONISATION OFFLINE
// ═══════════════════════════════════════════

class OfflineSyncManager {
  private isOnline: boolean;
  private statusListeners: Set<StatusCallback> = new Set();
  private syncListeners: Set<SyncCallback> = new Set();
  private isSyncing: boolean = false;

  constructor() {
    // Détection initiale du statut réseau
    this.isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

    // Écouteurs d'événements navigateur (SSR-safe)
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleOnline());
      window.addEventListener('offline', () => this.handleOffline());
    }
  }

  // ─────────────────────────────────────────
  // GESTION DU STATUT RÉSEAU
  // ─────────────────────────────────────────

  private handleOnline() {
    console.log('🌐 Connexion rétablie, synchronisation...');
    this.isOnline = true;
    this.notifyStatusListeners();
    this.syncPendingOperations();
  }

  private handleOffline() {
    console.log('📡 Mode hors ligne activé');
    this.isOnline = false;
    this.notifyStatusListeners();
  }

  private notifyStatusListeners() {
    this.statusListeners.forEach((cb) => cb(this.isOnline));
  }

  /**
   * Vérifie si l'app est actuellement en ligne
   */
  isCurrentlyOnline(): boolean {
    return this.isOnline;
  }

  /**
   * S'abonne aux changements de statut réseau
   * Retourne une fonction de cleanup
   */
  onStatusChange(callback: StatusCallback): () => void {
    this.statusListeners.add(callback);
    return () => {
      this.statusListeners.delete(callback);
    };
  }

  /**
   * Enregistre un handler de sync personnalisé
   */
  onSync(callback: SyncCallback): () => void {
    this.syncListeners.add(callback);
    return () => {
      this.syncListeners.delete(callback);
    };
  }

  // ─────────────────────────────────────────
  // GESTION DES OPÉRATIONS PENDING
  // ─────────────────────────────────────────

  /**
   * Ajoute une opération à la file d'attente
   */
  async addPendingOperation(
    op: Omit<PendingOperation, 'id' | 'timestamp' | 'retryCount'>
  ): Promise<void> {
    try {
      const fullOp: PendingOperation = {
        ...op,
        id: this.generateId(),
        timestamp: Date.now(),
        retryCount: 0,
      };

      const ops = await this.getPendingOperations();
      ops.push(fullOp);
      await idbSet(PENDING_OPS_KEY, ops, idbStore);

      console.log(`📝 Opération ajoutée: ${op.type}`, fullOp.id);

      // Tentative de sync immédiate si en ligne
      if (this.isOnline) {
        this.syncPendingOperations();
      }
    } catch (error) {
      console.error('Erreur addPendingOperation:', error);
    }
  }

  /**
   * Récupère toutes les opérations en attente
   */
  async getPendingOperations(): Promise<PendingOperation[]> {
    try {
      return (await idbGet(PENDING_OPS_KEY, idbStore)) || [];
    } catch {
      return [];
    }
  }

  /**
   * Supprime une opération spécifique
   */
  async removePendingOperation(opId: string): Promise<void> {
    try {
      const ops = await this.getPendingOperations();
      const filtered = ops.filter((op) => op.id !== opId);
      await idbSet(PENDING_OPS_KEY, filtered, idbStore);
    } catch (error) {
      console.error('Erreur removePendingOperation:', error);
    }
  }

  /**
   * Compte les opérations en attente
   */
  async getPendingCount(): Promise<number> {
    const ops = await this.getPendingOperations();
    return ops.length;
  }

  /**
   * Vide toutes les opérations
   */
  async clearAll(): Promise<void> {
    try {
      await idbSet(PENDING_OPS_KEY, [], idbStore);
      console.log('🗑️ File d\'attente hors ligne vidée');
    } catch (error) {
      console.error('Erreur clearAll:', error);
    }
  }

  // ─────────────────────────────────────────
  // SYNCHRONISATION
  // ─────────────────────────────────────────

  /**
   * Synchronise toutes les opérations en attente
   */
  async syncPendingOperations(): Promise<void> {
    // Éviter les syncs concurrentes
    if (this.isSyncing) {
      console.log('⏳ Sync déjà en cours, ignorée');
      return;
    }

    if (!this.isOnline) {
      console.log('📡 Hors ligne, sync reportée');
      return;
    }

    const ops = await this.getPendingOperations();

    if (ops.length === 0) {
      return;
    }

    this.isSyncing = true;
    console.log(`🔄 Synchronisation de ${ops.length} opération(s)...`);

    for (const op of ops) {
      try {
        await this.executeOperation(op);
        await this.removePendingOperation(op.id);
        console.log(`✅ Opération sync: ${op.type}`);
      } catch (error) {
        console.error(`❌ Échec sync ${op.id}:`, error);
        await this.handleFailedOperation(op);
      }
    }

    this.isSyncing = false;
    console.log('✅ Synchronisation terminée');
  }

  /**
   * Exécute une opération individuellement
   */
  private async executeOperation(op: PendingOperation): Promise<void> {
    // Notifier les listeners personnalisés
    for (const callback of this.syncListeners) {
      await callback([op]);
    }

    // Logique par défaut (à personnaliser selon vos endpoints)
    switch (op.type) {
      case 'favorite_add':
        console.log('⭐ Sync favoris (add):', op.payload);
        // await fetch('/api/favorites', { method: 'POST', body: JSON.stringify(op.payload) })
        break;

      case 'favorite_remove':
        console.log('💔 Sync favoris (remove):', op.payload);
        break;

      case 'review_submit':
        console.log('✍️ Sync review:', op.payload);
        break;

      case 'profile_update':
        console.log('👤 Sync profil:', op.payload);
        break;

      case 'gamification_sync':
        console.log('🎮 Sync gamification:', op.payload);
        break;

      default:
        console.warn(`Type d'opération inconnu: ${(op as any).type}`);
    }
  }

  /**
   * Gère une opération échouée (retry ou abandon)
   */
  private async handleFailedOperation(op: PendingOperation): Promise<void> {
    const ops = await this.getPendingOperations();
    const index = ops.findIndex((o) => o.id === op.id);

    if (index === -1) return;

    ops[index].retryCount++;

    // Abandonner après trop de tentatives
    if (ops[index].retryCount > MAX_RETRY_COUNT) {
      console.warn(`⚠️ Opération ${op.id} abandonnée après ${MAX_RETRY_COUNT} tentatives`);
      ops.splice(index, 1);
    }

    await idbSet(PENDING_OPS_KEY, ops, idbStore);
  }

  // ─────────────────────────────────────────
  // UTILITAIRES
  // ─────────────────────────────────────────

  /**
   * Génère un ID unique
   */
  private generateId(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Force une vérification du statut réseau
   */
  refreshStatus(): boolean {
    if (typeof navigator !== 'undefined') {
      this.isOnline = navigator.onLine;
      this.notifyStatusListeners();
    }
    return this.isOnline;
  }
}

// ═══════════════════════════════════════════
// EXPORT DE L'INSTANCE SINGLETON
// ═══════════════════════════════════════════

export const offlineSync = new OfflineSyncManager();

// ═══════════════════════════════════════════
// HOOK REACT (optionnel)
// ═══════════════════════════════════════════

export function useOfflineStatus() {
  const { useEffect, useState } = require('react');

  const [isOnline, setIsOnline] = useState(offlineSync.isCurrentlyOnline());
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    // Statut initial
    setIsOnline(offlineSync.isCurrentlyOnline());

    // Subscribe aux changements
    const unsubscribe = offlineSync.onStatusChange((online) => {
      setIsOnline(online);
    });

    // Polling du compteur d'opérations
    const updateCount = async () => {
      const count = await offlineSync.getPendingCount();
      setPendingCount(count);
    };

    updateCount();
    const interval = setInterval(updateCount, 5000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  return { isOnline, pendingCount };
}

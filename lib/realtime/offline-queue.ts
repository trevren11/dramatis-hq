"use client";

// Offline queue for queueing actions when disconnected
// and syncing them when back online

export interface QueuedAction<T = unknown> {
  id: string;
  type: string;
  payload: T;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
}

interface OfflineQueueOptions {
  maxRetries?: number;
  storageKey?: string;
  onSync?: (action: QueuedAction) => Promise<void>;
  onSyncError?: (action: QueuedAction, error: Error) => void;
  onSyncComplete?: () => void;
}

type QueueListener = (queue: QueuedAction[]) => void;

class OfflineQueueManager {
  private queue: QueuedAction[] = [];
  private listeners = new Set<QueueListener>();
  private isOnline = true;
  private isSyncing = false;
  private options: OfflineQueueOptions;
  private storageKey: string;

  constructor(options: OfflineQueueOptions = {}) {
    this.options = {
      maxRetries: 3,
      storageKey: "dramatis-offline-queue",
      ...options,
    };
    this.storageKey = this.options.storageKey!;

    // Initialize online status and listeners
    if (typeof window !== "undefined") {
      this.isOnline = navigator.onLine;
      this.loadFromStorage();

      window.addEventListener("online", this.handleOnline);
      window.addEventListener("offline", this.handleOffline);
    }
  }

  private handleOnline = (): void => {
    this.isOnline = true;
    this.syncQueue();
  };

  private handleOffline = (): void => {
    this.isOnline = false;
  };

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        this.queue = JSON.parse(stored);
      }
    } catch {
      this.queue = [];
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.queue));
    } catch {
      // Storage might be full or disabled
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => { listener([...this.queue]); });
  }

  /**
   * Add an action to the queue
   */
  enqueue<T>(type: string, payload: T): string {
    const id = `${type}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const action: QueuedAction<T> = {
      id,
      type,
      payload,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: this.options.maxRetries!,
    };

    this.queue.push(action);
    this.saveToStorage();
    this.notifyListeners();

    // If online, try to sync immediately
    if (this.isOnline && !this.isSyncing) {
      this.syncQueue();
    }

    return id;
  }

  /**
   * Remove an action from the queue
   */
  dequeue(id: string): void {
    this.queue = this.queue.filter((action) => action.id !== id);
    this.saveToStorage();
    this.notifyListeners();
  }

  /**
   * Sync all queued actions
   */
  async syncQueue(): Promise<void> {
    if (!this.isOnline || this.isSyncing || this.queue.length === 0) {
      return;
    }

    this.isSyncing = true;

    // Process queue in order
    const actionsToProcess = [...this.queue];

    for (const action of actionsToProcess) {
      try {
        await this.options.onSync?.(action);
        this.dequeue(action.id);
      } catch (error) {
        action.retryCount++;

        if (action.retryCount >= action.maxRetries) {
          // Max retries reached, remove from queue
          this.options.onSyncError?.(
            action,
            new Error(`Max retries (${action.maxRetries}) reached`)
          );
          this.dequeue(action.id);
        } else {
          // Update retry count in storage
          this.saveToStorage();
          this.options.onSyncError?.(
            action,
            error instanceof Error ? error : new Error("Unknown error")
          );

          // Exponential backoff before next retry
          const delay = Math.min(
            1000 * Math.pow(2, action.retryCount),
            30000
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    this.isSyncing = false;
    this.notifyListeners();

    if (this.queue.length === 0) {
      this.options.onSyncComplete?.();
    }
  }

  /**
   * Subscribe to queue changes
   */
  subscribe(listener: QueueListener): () => void {
    this.listeners.add(listener);
    // Immediately notify with current state
    listener([...this.queue]);

    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Get current queue state
   */
  getQueue(): QueuedAction[] {
    return [...this.queue];
  }

  /**
   * Get pending count
   */
  getPendingCount(): number {
    return this.queue.length;
  }

  /**
   * Check if currently online
   */
  getIsOnline(): boolean {
    return this.isOnline;
  }

  /**
   * Clear the entire queue
   */
  clear(): void {
    this.queue = [];
    this.saveToStorage();
    this.notifyListeners();
  }

  /**
   * Cleanup listeners
   */
  destroy(): void {
    if (typeof window !== "undefined") {
      window.removeEventListener("online", this.handleOnline);
      window.removeEventListener("offline", this.handleOffline);
    }
    this.listeners.clear();
  }
}

// Singleton instance
let queueInstance: OfflineQueueManager | null = null;

export function getOfflineQueue(
  options?: OfflineQueueOptions
): OfflineQueueManager {
  if (!queueInstance) {
    queueInstance = new OfflineQueueManager(options);
  }
  return queueInstance;
}

export function resetOfflineQueue(): void {
  if (queueInstance) {
    queueInstance.destroy();
    queueInstance = null;
  }
}

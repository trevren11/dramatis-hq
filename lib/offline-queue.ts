"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Types for queued operations
export interface QueuedOperation<T = unknown> {
  id: string;
  type: string;
  payload: T;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
}

interface OfflineQueueState<T = unknown> {
  queue: QueuedOperation<T>[];
  isOnline: boolean;
  isSyncing: boolean;
}

// Generate unique ID
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

// Storage key
const STORAGE_KEY = "dramatis-offline-queue";

// Load queue from localStorage
function loadQueue<T>(): QueuedOperation<T>[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? (JSON.parse(stored) as QueuedOperation<T>[]) : [];
  } catch {
    return [];
  }
}

// Save queue to localStorage
function saveQueue<T>(queue: QueuedOperation<T>[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  } catch {
    console.error("Failed to save offline queue");
  }
}

// Exponential backoff delay calculation
function getBackoffDelay(retryCount: number, baseDelay = 1000, maxDelay = 30000): number {
  const delay = Math.min(baseDelay * Math.pow(2, retryCount), maxDelay);
  // Add jitter (10-20% variance)
  return delay + Math.random() * delay * 0.2;
}

// Hook for offline queue management
interface UseOfflineQueueOptions<T> {
  onSync: (operation: QueuedOperation<T>) => Promise<boolean>;
  onStatusChange?: (isOnline: boolean) => void;
  maxRetries?: number;
  enabled?: boolean;
}

interface UseOfflineQueueReturn<T> {
  queue: QueuedOperation<T>[];
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  addToQueue: (type: string, payload: T) => string;
  removeFromQueue: (id: string) => void;
  clearQueue: () => void;
  retryAll: () => Promise<void>;
}

export function useOfflineQueue<T = unknown>(
  options: UseOfflineQueueOptions<T>
): UseOfflineQueueReturn<T> {
  const { onSync, onStatusChange, maxRetries = 3, enabled = true } = options;

  const [state, setState] = useState<OfflineQueueState<T>>(() => ({
    queue: [],
    isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
    isSyncing: false,
  }));

  const syncingRef = useRef(false);
  const onSyncRef = useRef(onSync);

  // Keep onSync ref updated
  useEffect(() => {
    onSyncRef.current = onSync;
  }, [onSync]);

  // Load queue from storage on mount
  useEffect(() => {
    const stored = loadQueue<T>();
    if (stored.length > 0) {
      setState((prev) => ({ ...prev, queue: stored }));
    }
  }, []);

  // Save queue to storage when it changes
  useEffect(() => {
    saveQueue(state.queue);
  }, [state.queue]);

  // Listen for online/offline events
  useEffect(() => {
    if (!enabled) return;

    const handleOnline = () => {
      setState((prev) => ({ ...prev, isOnline: true }));
      onStatusChange?.(true);
    };

    const handleOffline = () => {
      setState((prev) => ({ ...prev, isOnline: false }));
      onStatusChange?.(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [enabled, onStatusChange]);

  // Sync queue when coming back online
  const syncQueue = useCallback(async () => {
    if (syncingRef.current || !state.isOnline || state.queue.length === 0) {
      return;
    }

    syncingRef.current = true;
    setState((prev) => ({ ...prev, isSyncing: true }));

    const failedOperations: QueuedOperation<T>[] = [];

    for (const operation of state.queue) {
      try {
        const success = await onSyncRef.current(operation);

        if (!success) {
          if (operation.retryCount < operation.maxRetries) {
            // Schedule retry with backoff
            const delay = getBackoffDelay(operation.retryCount);
            await new Promise((resolve) => setTimeout(resolve, delay));
            failedOperations.push({
              ...operation,
              retryCount: operation.retryCount + 1,
            });
          } else {
            console.error(`Operation ${operation.id} failed after max retries`);
          }
        }
      } catch (error) {
        console.error(`Failed to sync operation ${operation.id}:`, error);
        if (operation.retryCount < operation.maxRetries) {
          failedOperations.push({
            ...operation,
            retryCount: operation.retryCount + 1,
          });
        }
      }
    }

    setState((prev) => ({
      ...prev,
      queue: failedOperations,
      isSyncing: false,
    }));
    syncingRef.current = false;
  }, [state.isOnline, state.queue]);

  // Trigger sync when coming online
  useEffect(() => {
    if (state.isOnline && state.queue.length > 0 && !state.isSyncing) {
      syncQueue();
    }
  }, [state.isOnline, state.queue.length, state.isSyncing, syncQueue]);

  const addToQueue = useCallback(
    (type: string, payload: T): string => {
      const id = generateId();
      const operation: QueuedOperation<T> = {
        id,
        type,
        payload,
        timestamp: Date.now(),
        retryCount: 0,
        maxRetries,
      };

      setState((prev) => ({
        ...prev,
        queue: [...prev.queue, operation],
      }));

      return id;
    },
    [maxRetries]
  );

  const removeFromQueue = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      queue: prev.queue.filter((op) => op.id !== id),
    }));
  }, []);

  const clearQueue = useCallback(() => {
    setState((prev) => ({ ...prev, queue: [] }));
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const retryAll = useCallback(async () => {
    // Reset retry counts and trigger sync
    setState((prev) => ({
      ...prev,
      queue: prev.queue.map((op) => ({ ...op, retryCount: 0 })),
    }));
    await syncQueue();
  }, [syncQueue]);

  return {
    queue: state.queue,
    isOnline: state.isOnline,
    isSyncing: state.isSyncing,
    pendingCount: state.queue.length,
    addToQueue,
    removeFromQueue,
    clearQueue,
    retryAll,
  };
}

// Provider component for global offline queue
export function createOfflineQueueStore<T>() {
  let queue: QueuedOperation<T>[] = [];
  const listeners = new Set<() => void>();

  return {
    getQueue: () => queue,
    add: (type: string, payload: T, maxRetries = 3): string => {
      const id = generateId();
      queue = [
        ...queue,
        { id, type, payload, timestamp: Date.now(), retryCount: 0, maxRetries },
      ];
      saveQueue(queue);
      listeners.forEach((l) => { l(); });
      return id;
    },
    remove: (id: string) => {
      queue = queue.filter((op) => op.id !== id);
      saveQueue(queue);
      listeners.forEach((l) => { l(); });
    },
    clear: () => {
      queue = [];
      if (typeof window !== "undefined") {
        localStorage.removeItem(STORAGE_KEY);
      }
      listeners.forEach((l) => { l(); });
    },
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getOfflineQueue,
  type QueuedAction,
} from "@/lib/realtime/offline-queue";

interface UseOfflineQueueOptions {
  onSync?: (action: QueuedAction) => Promise<void>;
  onSyncError?: (action: QueuedAction, error: Error) => void;
  onSyncComplete?: () => void;
}

interface UseOfflineQueueReturn {
  queue: QueuedAction[];
  pendingCount: number;
  isOnline: boolean;
  enqueue: <T>(type: string, payload: T) => string;
  dequeue: (id: string) => void;
  syncNow: () => Promise<void>;
  clear: () => void;
}

export function useOfflineQueue(
  options: UseOfflineQueueOptions = {}
): UseOfflineQueueReturn {
  const [queue, setQueue] = useState<QueuedAction[]>([]);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const offlineQueue = getOfflineQueue({
      onSync: options.onSync,
      onSyncError: options.onSyncError,
      onSyncComplete: options.onSyncComplete,
    });

    // Subscribe to queue changes
    const unsubscribe = offlineQueue.subscribe((newQueue) => {
      setQueue(newQueue);
    });

    // Track online status
    const handleOnline = () => { setIsOnline(true); };
    const handleOffline = () => { setIsOnline(false); };

    if (typeof window !== "undefined") {
      setIsOnline(navigator.onLine);
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
    }

    return () => {
      unsubscribe();
      if (typeof window !== "undefined") {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      }
    };
  }, [options.onSync, options.onSyncError, options.onSyncComplete]);

  const enqueue = useCallback(<T>(type: string, payload: T): string => {
    const offlineQueue = getOfflineQueue();
    return offlineQueue.enqueue(type, payload);
  }, []);

  const dequeue = useCallback((id: string): void => {
    const offlineQueue = getOfflineQueue();
    offlineQueue.dequeue(id);
  }, []);

  const syncNow = useCallback(async (): Promise<void> => {
    const offlineQueue = getOfflineQueue();
    await offlineQueue.syncQueue();
  }, []);

  const clear = useCallback((): void => {
    const offlineQueue = getOfflineQueue();
    offlineQueue.clear();
  }, []);

  return {
    queue,
    pendingCount: queue.length,
    isOnline,
    enqueue,
    dequeue,
    syncNow,
    clear,
  };
}

// Simpler hook just for online status
export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;

    setIsOnline(navigator.onLine);

    const handleOnline = () => { setIsOnline(true); };
    const handleOffline = () => { setIsOnline(false); };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOnline;
}

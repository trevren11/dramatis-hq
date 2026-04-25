"use client";

import { useCallback, useState } from "react";

// Conflict resolution strategies
export type ConflictStrategy = "last-write-wins" | "first-write-wins" | "merge" | "manual";

// Version tracking for optimistic updates
export interface VersionedData<T> {
  data: T;
  version: number;
  lastModified: Date;
  modifiedBy: string;
}

// Conflict information
export interface Conflict<T> {
  id: string;
  resourceId: string;
  resourceType: string;
  localVersion: VersionedData<T>;
  serverVersion: VersionedData<T>;
  timestamp: Date;
  resolved: boolean;
}

// Conflict resolution result
export interface ResolutionResult<T> {
  resolved: boolean;
  data: T;
  strategy: ConflictStrategy;
}

// Detect if there's a conflict between local and server versions
export function detectConflict<T>(
  localVersion: VersionedData<T>,
  serverVersion: VersionedData<T>
): boolean {
  // Conflict exists if server version is newer and data differs
  if (serverVersion.version > localVersion.version) {
    return !deepEqual(localVersion.data, serverVersion.data);
  }
  return false;
}

// Deep equality check
function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (a === null || b === null) return a === b;
  if (typeof a !== "object") return a === b;

  const aObj = a as Record<string, unknown>;
  const bObj = b as Record<string, unknown>;

  const aKeys = Object.keys(aObj);
  const bKeys = Object.keys(bObj);

  if (aKeys.length !== bKeys.length) return false;

  for (const key of aKeys) {
    if (!deepEqual(aObj[key], bObj[key])) return false;
  }

  return true;
}

// Merge two objects, preferring server values for conflicting keys
export function mergeData<T extends Record<string, unknown>>(
  local: T,
  server: T,
  preferServer = true
): T {
  const result: Record<string, unknown> = { ...local };

  for (const key of Object.keys(server)) {
    const localValue = local[key];
    const serverValue = server[key];

    // If both have the key and values differ
    if (key in local && !deepEqual(localValue, serverValue)) {
      // Use the preferred source
      result[key] = preferServer ? serverValue : localValue;
    } else if (!(key in local)) {
      // Server has a key local doesn't
      result[key] = serverValue;
    }
  }

  return result as T;
}

// Resolve conflict using specified strategy
export function resolveConflict<T extends Record<string, unknown>>(
  conflict: Conflict<T>,
  strategy: ConflictStrategy
): ResolutionResult<T> {
  switch (strategy) {
    case "last-write-wins": {
      // Use whichever was modified more recently
      const useServer =
        conflict.serverVersion.lastModified > conflict.localVersion.lastModified;
      return {
        resolved: true,
        data: useServer ? conflict.serverVersion.data : conflict.localVersion.data,
        strategy,
      };
    }

    case "first-write-wins": {
      // Use whichever was modified first
      const useLocal =
        conflict.localVersion.lastModified < conflict.serverVersion.lastModified;
      return {
        resolved: true,
        data: useLocal ? conflict.localVersion.data : conflict.serverVersion.data,
        strategy,
      };
    }

    case "merge": {
      // Try to merge, preferring server values for conflicts
      return {
        resolved: true,
        data: mergeData(conflict.localVersion.data, conflict.serverVersion.data, true),
        strategy,
      };
    }

    case "manual":
    default:
      // Return local data but mark as unresolved
      return {
        resolved: false,
        data: conflict.localVersion.data,
        strategy,
      };
  }
}

// Hook for managing conflicts
interface UseConflictResolverOptions<T> {
  defaultStrategy?: ConflictStrategy;
  onConflictDetected?: (conflict: Conflict<T>) => void;
  onConflictResolved?: (conflict: Conflict<T>, result: ResolutionResult<T>) => void;
}

interface UseConflictResolverReturn<T extends Record<string, unknown>> {
  conflicts: Conflict<T>[];
  hasConflicts: boolean;
  checkForConflict: (
    resourceId: string,
    resourceType: string,
    local: VersionedData<T>,
    server: VersionedData<T>
  ) => Conflict<T> | null;
  resolveConflict: (conflictId: string, strategy?: ConflictStrategy) => ResolutionResult<T> | null;
  resolveAll: (strategy?: ConflictStrategy) => void;
  dismissConflict: (conflictId: string) => void;
  clearConflicts: () => void;
}

export function useConflictResolver<T extends Record<string, unknown>>(
  options: UseConflictResolverOptions<T> = {}
): UseConflictResolverReturn<T> {
  const { defaultStrategy = "last-write-wins", onConflictDetected, onConflictResolved } = options;

  const [conflicts, setConflicts] = useState<Conflict<T>[]>([]);

  const checkForConflict = useCallback(
    (
      resourceId: string,
      resourceType: string,
      local: VersionedData<T>,
      server: VersionedData<T>
    ): Conflict<T> | null => {
      if (!detectConflict(local, server)) {
        return null;
      }

      const conflict: Conflict<T> = {
        id: `${resourceType}-${resourceId}-${Date.now()}`,
        resourceId,
        resourceType,
        localVersion: local,
        serverVersion: server,
        timestamp: new Date(),
        resolved: false,
      };

      setConflicts((prev) => [...prev, conflict]);
      onConflictDetected?.(conflict);

      return conflict;
    },
    [onConflictDetected]
  );

  const resolveConflictById = useCallback(
    (conflictId: string, strategy?: ConflictStrategy): ResolutionResult<T> | null => {
      const conflict = conflicts.find((c) => c.id === conflictId);
      if (!conflict) return null;

      const result = resolveConflict(conflict, strategy ?? defaultStrategy);

      if (result.resolved) {
        setConflicts((prev) =>
          prev.map((c) => (c.id === conflictId ? { ...c, resolved: true } : c))
        );
        onConflictResolved?.(conflict, result);
      }

      return result;
    },
    [conflicts, defaultStrategy, onConflictResolved]
  );

  const resolveAll = useCallback(
    (strategy?: ConflictStrategy) => {
      const unresolvedConflicts = conflicts.filter((c) => !c.resolved);
      for (const conflict of unresolvedConflicts) {
        resolveConflictById(conflict.id, strategy);
      }
    },
    [conflicts, resolveConflictById]
  );

  const dismissConflict = useCallback((conflictId: string) => {
    setConflicts((prev) => prev.filter((c) => c.id !== conflictId));
  }, []);

  const clearConflicts = useCallback(() => {
    setConflicts([]);
  }, []);

  return {
    conflicts,
    hasConflicts: conflicts.some((c) => !c.resolved),
    checkForConflict,
    resolveConflict: resolveConflictById,
    resolveAll,
    dismissConflict,
    clearConflicts,
  };
}

// Optimistic update helper
export function createOptimisticUpdate<T>(
  currentData: T,
  userId: string,
  currentVersion = 0
): VersionedData<T> {
  return {
    data: currentData,
    version: currentVersion + 1,
    lastModified: new Date(),
    modifiedBy: userId,
  };
}

// Check if server update should be applied
export function shouldApplyServerUpdate<T>(
  local: VersionedData<T> | null,
  server: VersionedData<T>,
  currentUserId: string
): boolean {
  // Always apply if no local version
  if (!local) return true;

  // Don't apply our own updates that come back from server
  if (server.modifiedBy === currentUserId && server.version <= local.version) {
    return false;
  }

  // Apply if server version is newer
  return server.version > local.version;
}

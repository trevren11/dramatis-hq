"use client";

// Conflict detection and resolution for concurrent edits

export interface VersionedData<T> {
  data: T;
  version: number;
  timestamp: number;
  updatedBy: string;
}

export interface Conflict<T> {
  id: string;
  field: string;
  localValue: T;
  remoteValue: T;
  localTimestamp: number;
  remoteTimestamp: number;
  localUpdatedBy: string;
  remoteUpdatedBy: string;
}

export type ConflictResolution = "local" | "remote" | "merge";

export interface ConflictResolverOptions {
  strategy?: "last-write-wins" | "first-write-wins" | "manual";
  onConflict?: <T>(conflict: Conflict<T>) => ConflictResolution;
}

/**
 * Detect conflicts between local and remote data
 */
export function detectConflicts<T extends Record<string, unknown>>(
  local: VersionedData<T>,
  remote: VersionedData<T>,
  fields?: (keyof T)[]
): Conflict<unknown>[] {
  const conflicts: Conflict<unknown>[] = [];
  const fieldsToCheck = fields ?? (Object.keys(local.data));

  for (const field of fieldsToCheck) {
    const localValue = local.data[field];
    const remoteValue = remote.data[field];

    // Skip if values are the same
    if (JSON.stringify(localValue) === JSON.stringify(remoteValue)) {
      continue;
    }

    // Conflict if both have been modified
    if (local.version !== remote.version) {
      conflicts.push({
        id: `${String(field)}-${Date.now()}`,
        field: String(field),
        localValue,
        remoteValue,
        localTimestamp: local.timestamp,
        remoteTimestamp: remote.timestamp,
        localUpdatedBy: local.updatedBy,
        remoteUpdatedBy: remote.updatedBy,
      });
    }
  }

  return conflicts;
}

/**
 * Resolve conflicts using the specified strategy
 */
export function resolveConflicts<T extends Record<string, unknown>>(
  local: VersionedData<T>,
  _remote: VersionedData<T>,
  conflicts: Conflict<unknown>[],
  options: ConflictResolverOptions = {}
): T {
  const { strategy = "last-write-wins", onConflict } = options;
  const resolved = { ...local.data };

  for (const conflict of conflicts) {
    let resolution: ConflictResolution;

    if (strategy === "manual" && onConflict) {
      resolution = onConflict(conflict);
    } else if (strategy === "last-write-wins") {
      resolution =
        conflict.remoteTimestamp > conflict.localTimestamp ? "remote" : "local";
    } else {
      // first-write-wins
      resolution =
        conflict.remoteTimestamp < conflict.localTimestamp ? "remote" : "local";
    }

    if (resolution === "remote") {
      (resolved as Record<string, unknown>)[conflict.field] =
        conflict.remoteValue;
    }
    // "local" keeps the existing value, "merge" would need custom logic
  }

  return resolved;
}

/**
 * Create a versioned wrapper around data
 */
export function createVersionedData<T>(
  data: T,
  updatedBy: string,
  version = 1
): VersionedData<T> {
  return {
    data,
    version,
    timestamp: Date.now(),
    updatedBy,
  };
}

/**
 * Increment version for an update
 */
export function incrementVersion<T>(
  current: VersionedData<T>,
  newData: T,
  updatedBy: string
): VersionedData<T> {
  return {
    data: newData,
    version: current.version + 1,
    timestamp: Date.now(),
    updatedBy,
  };
}

/**
 * Optimistic update helper with conflict handling
 */
export interface OptimisticUpdateResult<T> {
  data: T;
  isOptimistic: boolean;
  revert: () => T;
  confirm: (serverData: T) => T;
}

export function createOptimisticUpdate<T>(
  current: T,
  optimisticData: T
): OptimisticUpdateResult<T> {
  const originalData = current;
  let confirmedData: T | null = null;

  return {
    data: optimisticData,
    isOptimistic: true,
    revert: () => originalData,
    confirm: (serverData: T) => {
      confirmedData = serverData;
      return confirmedData;
    },
  };
}

/**
 * Hook-friendly conflict state manager
 */
export class ConflictManager<T extends Record<string, unknown>> {
  private localVersion: VersionedData<T> | null = null;
  private pendingConflicts: Conflict<unknown>[] = [];
  private listeners = new Set<() => void>();

  setLocalVersion(data: T, updatedBy: string, version?: number): void {
    this.localVersion = createVersionedData(data, updatedBy, version);
    this.notifyListeners();
  }

  checkForConflicts(remoteVersion: VersionedData<T>): Conflict<unknown>[] {
    if (!this.localVersion) return [];

    const conflicts = detectConflicts(this.localVersion, remoteVersion);
    this.pendingConflicts = conflicts;
    this.notifyListeners();
    return conflicts;
  }

  resolveAll(
    remoteVersion: VersionedData<T>,
    options?: ConflictResolverOptions
  ): T {
    if (!this.localVersion) return remoteVersion.data;

    const resolved = resolveConflicts(
      this.localVersion,
      remoteVersion,
      this.pendingConflicts,
      options
    );
    this.pendingConflicts = [];
    this.notifyListeners();
    return resolved;
  }

  getPendingConflicts(): Conflict<unknown>[] {
    return [...this.pendingConflicts];
  }

  hasConflicts(): boolean {
    return this.pendingConflicts.length > 0;
  }

  clearConflicts(): void {
    this.pendingConflicts = [];
    this.notifyListeners();
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach((l) => { l(); });
  }
}

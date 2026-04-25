import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  detectConflicts,
  resolveConflicts,
  createVersionedData,
  incrementVersion,
  ConflictManager,
  type VersionedData,
} from "@/lib/realtime/conflict-resolver";

interface TestData extends Record<string, unknown> {
  name: string;
  status: string;
  count: number;
}

describe("conflict-resolver", () => {
  describe("detectConflicts", () => {
    it("detects no conflicts when data is identical", () => {
      const local: VersionedData<TestData> = {
        data: { name: "Test", status: "active", count: 5 },
        version: 1,
        timestamp: Date.now(),
        updatedBy: "user1",
      };

      const remote: VersionedData<TestData> = {
        data: { name: "Test", status: "active", count: 5 },
        version: 1,
        timestamp: Date.now(),
        updatedBy: "user2",
      };

      const conflicts = detectConflicts(local, remote);
      expect(conflicts).toHaveLength(0);
    });

    it("detects conflicts when versions differ and values differ", () => {
      const local: VersionedData<TestData> = {
        data: { name: "Local Name", status: "active", count: 5 },
        version: 2,
        timestamp: Date.now() - 1000,
        updatedBy: "user1",
      };

      const remote: VersionedData<TestData> = {
        data: { name: "Remote Name", status: "active", count: 5 },
        version: 3,
        timestamp: Date.now(),
        updatedBy: "user2",
      };

      const conflicts = detectConflicts(local, remote);
      expect(conflicts).toHaveLength(1);
      expect(conflicts[0]!.field).toBe("name");
      expect(conflicts[0]!.localValue).toBe("Local Name");
      expect(conflicts[0]!.remoteValue).toBe("Remote Name");
    });

    it("detects multiple conflicts", () => {
      const local: VersionedData<TestData> = {
        data: { name: "Local", status: "inactive", count: 10 },
        version: 1,
        timestamp: Date.now() - 1000,
        updatedBy: "user1",
      };

      const remote: VersionedData<TestData> = {
        data: { name: "Remote", status: "active", count: 5 },
        version: 2,
        timestamp: Date.now(),
        updatedBy: "user2",
      };

      const conflicts = detectConflicts(local, remote);
      expect(conflicts).toHaveLength(3);
    });

    it("only checks specified fields", () => {
      const local: VersionedData<TestData> = {
        data: { name: "Local", status: "inactive", count: 10 },
        version: 1,
        timestamp: Date.now() - 1000,
        updatedBy: "user1",
      };

      const remote: VersionedData<TestData> = {
        data: { name: "Remote", status: "active", count: 5 },
        version: 2,
        timestamp: Date.now(),
        updatedBy: "user2",
      };

      const conflicts = detectConflicts(local, remote, ["name"]);
      expect(conflicts).toHaveLength(1);
      expect(conflicts[0]!.field).toBe("name");
    });
  });

  describe("resolveConflicts", () => {
    it("resolves with last-write-wins strategy", () => {
      const olderTimestamp = Date.now() - 1000;
      const newerTimestamp = Date.now();

      const local: VersionedData<TestData> = {
        data: { name: "Local", status: "active", count: 5 },
        version: 1,
        timestamp: olderTimestamp,
        updatedBy: "user1",
      };

      const remote: VersionedData<TestData> = {
        data: { name: "Remote", status: "inactive", count: 10 },
        version: 2,
        timestamp: newerTimestamp,
        updatedBy: "user2",
      };

      const conflicts = detectConflicts(local, remote);
      const resolved = resolveConflicts(local, remote, conflicts, {
        strategy: "last-write-wins",
      });

      // Remote is newer, so remote values should win
      expect(resolved.name).toBe("Remote");
      expect(resolved.status).toBe("inactive");
      expect(resolved.count).toBe(10);
    });

    it("resolves with first-write-wins strategy", () => {
      const olderTimestamp = Date.now() - 1000;
      const newerTimestamp = Date.now();

      const local: VersionedData<TestData> = {
        data: { name: "Local", status: "active", count: 5 },
        version: 1,
        timestamp: newerTimestamp,
        updatedBy: "user1",
      };

      const remote: VersionedData<TestData> = {
        data: { name: "Remote", status: "inactive", count: 10 },
        version: 2,
        timestamp: olderTimestamp,
        updatedBy: "user2",
      };

      const conflicts = detectConflicts(local, remote);
      const resolved = resolveConflicts(local, remote, conflicts, {
        strategy: "first-write-wins",
      });

      // Remote is older (first), so remote values should win
      expect(resolved.name).toBe("Remote");
      expect(resolved.status).toBe("inactive");
      expect(resolved.count).toBe(10);
    });

    it("resolves with manual strategy using callback", () => {
      const local: VersionedData<TestData> = {
        data: { name: "Local", status: "active", count: 5 },
        version: 1,
        timestamp: Date.now() - 1000,
        updatedBy: "user1",
      };

      const remote: VersionedData<TestData> = {
        data: { name: "Remote", status: "inactive", count: 10 },
        version: 2,
        timestamp: Date.now(),
        updatedBy: "user2",
      };

      const conflicts = detectConflicts(local, remote);
      const resolved = resolveConflicts(local, remote, conflicts, {
        strategy: "manual",
        onConflict: (conflict) => {
          // Keep local for name, use remote for everything else
          return conflict.field === "name" ? "local" : "remote";
        },
      });

      expect(resolved.name).toBe("Local");
      expect(resolved.status).toBe("inactive");
      expect(resolved.count).toBe(10);
    });
  });

  describe("createVersionedData", () => {
    it("creates versioned data with defaults", () => {
      const data = { name: "Test" };
      const versioned = createVersionedData(data, "user1");

      expect(versioned.data).toEqual(data);
      expect(versioned.version).toBe(1);
      expect(versioned.updatedBy).toBe("user1");
      expect(versioned.timestamp).toBeDefined();
    });

    it("allows custom version", () => {
      const data = { name: "Test" };
      const versioned = createVersionedData(data, "user1", 5);

      expect(versioned.version).toBe(5);
    });
  });

  describe("incrementVersion", () => {
    it("increments version number", () => {
      const current: VersionedData<TestData> = {
        data: { name: "Old", status: "active", count: 1 },
        version: 3,
        timestamp: Date.now() - 1000,
        updatedBy: "user1",
      };

      const newData: TestData = { name: "New", status: "active", count: 2 };
      const updated = incrementVersion(current, newData, "user2");

      expect(updated.version).toBe(4);
      expect(updated.data).toEqual(newData);
      expect(updated.updatedBy).toBe("user2");
    });
  });

  describe("ConflictManager", () => {
    let manager: ConflictManager<TestData>;

    beforeEach(() => {
      manager = new ConflictManager<TestData>();
    });

    it("starts with no conflicts", () => {
      expect(manager.hasConflicts()).toBe(false);
      expect(manager.getPendingConflicts()).toHaveLength(0);
    });

    it("detects conflicts when checking remote version", () => {
      manager.setLocalVersion({ name: "Local", status: "active", count: 1 }, "user1", 1);

      const remote: VersionedData<TestData> = {
        data: { name: "Remote", status: "active", count: 1 },
        version: 2,
        timestamp: Date.now(),
        updatedBy: "user2",
      };

      const conflicts = manager.checkForConflicts(remote);
      expect(conflicts).toHaveLength(1);
      expect(manager.hasConflicts()).toBe(true);
    });

    it("resolves all conflicts", () => {
      manager.setLocalVersion({ name: "Local", status: "active", count: 1 }, "user1", 1);

      const remote: VersionedData<TestData> = {
        data: { name: "Remote", status: "inactive", count: 5 },
        version: 2,
        timestamp: Date.now(),
        updatedBy: "user2",
      };

      manager.checkForConflicts(remote);
      const resolved = manager.resolveAll(remote);

      expect(manager.hasConflicts()).toBe(false);
      expect(resolved).toBeDefined();
    });

    it("clears conflicts", () => {
      manager.setLocalVersion({ name: "Local", status: "active", count: 1 }, "user1", 1);

      const remote: VersionedData<TestData> = {
        data: { name: "Remote", status: "active", count: 1 },
        version: 2,
        timestamp: Date.now(),
        updatedBy: "user2",
      };

      manager.checkForConflicts(remote);
      expect(manager.hasConflicts()).toBe(true);

      manager.clearConflicts();
      expect(manager.hasConflicts()).toBe(false);
    });

    it("notifies subscribers on changes", () => {
      const listener = vi.fn();
      manager.subscribe(listener);

      manager.setLocalVersion({ name: "Test", status: "active", count: 1 }, "user1");
      expect(listener).toHaveBeenCalled();
    });
  });
});

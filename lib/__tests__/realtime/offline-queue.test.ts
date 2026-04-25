import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { getOfflineQueue, resetOfflineQueue } from "@/lib/realtime/offline-queue";

describe("offline-queue", () => {
  beforeEach(() => {
    // Reset the queue before each test
    resetOfflineQueue();

    // Mock localStorage
    const storage: Record<string, string> = {};
    vi.spyOn(Storage.prototype, "getItem").mockImplementation((key) => storage[key] ?? null);
    vi.spyOn(Storage.prototype, "setItem").mockImplementation((key, value) => {
      storage[key] = value;
    });
    vi.spyOn(Storage.prototype, "removeItem").mockImplementation((key) => {
      Reflect.deleteProperty(storage, key);
    });

    // Mock navigator.onLine
    Object.defineProperty(navigator, "onLine", {
      value: true,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    resetOfflineQueue();
    vi.restoreAllMocks();
  });

  describe("enqueue", () => {
    it("adds an action to the queue", () => {
      const queue = getOfflineQueue();
      const id = queue.enqueue("test-action", { data: "test" });

      expect(id).toBeDefined();
      expect(queue.getPendingCount()).toBe(1);
    });

    it("generates unique IDs for each action", () => {
      const queue = getOfflineQueue();
      const id1 = queue.enqueue("action", { data: 1 });
      const id2 = queue.enqueue("action", { data: 2 });

      expect(id1).not.toBe(id2);
    });

    it("stores action with correct metadata", () => {
      const queue = getOfflineQueue();
      queue.enqueue("test-type", { value: 123 });

      const actions = queue.getQueue();
      expect(actions).toHaveLength(1);
      const action = actions[0];
      expect(action?.type).toBe("test-type");
      expect(action?.payload).toEqual({ value: 123 });
      expect(action?.retryCount).toBe(0);
      expect(action?.timestamp).toBeDefined();
    });
  });

  describe("dequeue", () => {
    it("removes an action from the queue", () => {
      const queue = getOfflineQueue();
      const id = queue.enqueue("action", { data: "test" });

      expect(queue.getPendingCount()).toBe(1);

      queue.dequeue(id);

      expect(queue.getPendingCount()).toBe(0);
    });

    it("handles non-existent IDs gracefully", () => {
      const queue = getOfflineQueue();
      queue.enqueue("action", { data: "test" });

      expect(() => {
        queue.dequeue("non-existent-id");
      }).not.toThrow();
      expect(queue.getPendingCount()).toBe(1);
    });
  });

  describe("getQueue", () => {
    it("returns a copy of the queue", () => {
      const queue = getOfflineQueue();
      queue.enqueue("action1", { data: 1 });
      queue.enqueue("action2", { data: 2 });

      const actions = queue.getQueue();
      expect(actions).toHaveLength(2);

      // Modifying returned array shouldn't affect internal queue
      actions.pop();
      expect(queue.getPendingCount()).toBe(2);
    });
  });

  describe("clear", () => {
    it("clears all actions from the queue", () => {
      const queue = getOfflineQueue();
      queue.enqueue("action1", { data: 1 });
      queue.enqueue("action2", { data: 2 });
      queue.enqueue("action3", { data: 3 });

      expect(queue.getPendingCount()).toBe(3);

      queue.clear();

      expect(queue.getPendingCount()).toBe(0);
    });
  });

  describe("subscribe", () => {
    it("notifies subscribers when queue changes", () => {
      const queue = getOfflineQueue();
      const listener = vi.fn();

      queue.subscribe(listener);

      // Should be called immediately with initial state
      expect(listener).toHaveBeenCalledTimes(1);

      queue.enqueue("action", { data: "test" });

      // Should be called again after enqueue
      expect(listener).toHaveBeenCalledTimes(2);
    });

    it("returns unsubscribe function", () => {
      const queue = getOfflineQueue();
      const listener = vi.fn();

      const unsubscribe = queue.subscribe(listener);
      expect(listener).toHaveBeenCalledTimes(1);

      unsubscribe();

      queue.enqueue("action", { data: "test" });

      // Should not be called after unsubscribe
      expect(listener).toHaveBeenCalledTimes(1);
    });
  });

  describe("getIsOnline", () => {
    it("returns current online status", () => {
      const queue = getOfflineQueue();
      expect(queue.getIsOnline()).toBe(true);
    });
  });

  describe("singleton behavior", () => {
    it("returns same instance on multiple calls", () => {
      const queue1 = getOfflineQueue();
      const queue2 = getOfflineQueue();

      queue1.enqueue("action", { data: "test" });

      expect(queue2.getPendingCount()).toBe(1);
    });

    it("creates new instance after reset", () => {
      const queue1 = getOfflineQueue();
      queue1.enqueue("action", { data: "test" });

      // Clear the queue before resetting to test fresh instance
      queue1.clear();
      resetOfflineQueue();

      const queue2 = getOfflineQueue();
      expect(queue2.getPendingCount()).toBe(0);
    });
  });
});

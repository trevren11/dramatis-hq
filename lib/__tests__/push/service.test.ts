import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock data
const mockUserId = "user-123";
const mockSubscription = {
  id: "sub-123",
  userId: mockUserId,
  endpoint: "https://push.example.com/endpoint",
  keys: { p256dh: "test-key", auth: "test-auth" },
  userAgent: "Mozilla/5.0",
  deviceName: "Test Device",
  isActive: true,
  lastUsedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockNotification = {
  id: "notif-123",
  userId: mockUserId,
  type: "new_message" as const,
  title: "New Message",
  body: "You have a new message",
  data: { url: "/messages/123" },
  readAt: null,
  clickedAt: null,
  pushSentAt: null,
  pushError: null,
  createdAt: new Date(),
};

const mockPreferences = {
  id: "pref-123",
  userId: mockUserId,
  pushEnabled: true,
  newMessage: true,
  scheduleChange: true,
  rehearsalReminder: true,
  callbackNotification: true,
  castDecision: true,
  documentShared: true,
  commentMention: true,
  auditionSubmission: true,
  systemAnnouncement: true,
  dndEnabled: false,
  dndStart: null,
  dndEnd: null,
  timezone: "UTC",
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Mock database functions
const mockFindFirst = vi.fn();
const mockFindMany = vi.fn();

// Create comprehensive mock for database operations
const mockReturning = vi.fn();
const mockWhere = vi.fn();
const mockSet = vi.fn();
const mockValues = vi.fn();

// Set up chainable mocks that return returning for all paths
const whereWithReturning = { returning: mockReturning };
mockWhere.mockReturnValue(whereWithReturning);
mockSet.mockReturnValue({ where: mockWhere });
mockValues.mockReturnValue({ returning: mockReturning });

// Mock the db module
vi.mock("@/lib/db", () => ({
  db: {
    query: {
      pushSubscriptions: {
        findFirst: (...args: unknown[]): unknown => mockFindFirst(...args),
        findMany: (...args: unknown[]): unknown => mockFindMany(...args),
      },
      inAppNotifications: {
        findFirst: (...args: unknown[]): unknown => mockFindFirst(...args),
        findMany: (...args: unknown[]): unknown => mockFindMany(...args),
      },
      notificationPreferences: {
        findFirst: (...args: unknown[]): unknown => mockFindFirst(...args),
      },
    },
    insert: () => ({ values: mockValues }),
    update: () => ({ set: mockSet }),
    delete: () => ({ where: () => ({ returning: mockReturning }) }),
  },
}));

// Mock web-push
vi.mock("web-push", () => ({
  default: {
    setVapidDetails: vi.fn(),
    sendNotification: vi.fn().mockResolvedValue({}),
  },
}));

// Mock config
vi.mock("@/lib/push/config", () => ({
  webPush: {
    sendNotification: vi.fn().mockResolvedValue({}),
  },
  isPushConfigured: () => true,
  vapidConfig: {
    publicKey: "test-public-key",
    privateKey: "test-private-key",
    subject: "mailto:test@test.com",
  },
}));

// Now import the service (after mocks are set up)
import { PushNotificationService } from "../../push/service";

describe("PushNotificationService", () => {
  let service: PushNotificationService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new PushNotificationService();

    // Reset mock return values
    mockReturning.mockResolvedValue([mockNotification]);
  });

  describe("registerSubscription", () => {
    it("creates new subscription when none exists", async () => {
      mockFindFirst.mockResolvedValueOnce(undefined);
      mockReturning.mockResolvedValueOnce([mockSubscription]);

      const result = await service.registerSubscription(mockUserId, {
        endpoint: mockSubscription.endpoint,
        keys: mockSubscription.keys,
        userAgent: mockSubscription.userAgent,
        deviceName: mockSubscription.deviceName,
      });

      expect(result.success).toBe(true);
      expect(result.subscriptionId).toBe(mockSubscription.id);
    });

    it("updates existing subscription when found", async () => {
      mockFindFirst.mockResolvedValueOnce(mockSubscription);

      const result = await service.registerSubscription(mockUserId, {
        endpoint: mockSubscription.endpoint,
        keys: mockSubscription.keys,
      });

      expect(result.success).toBe(true);
      expect(result.subscriptionId).toBe(mockSubscription.id);
    });
  });

  describe("removeSubscription", () => {
    it("removes subscription successfully", async () => {
      mockReturning.mockResolvedValueOnce([{ id: "sub-123" }]);

      const result = await service.removeSubscription(mockUserId, mockSubscription.endpoint);

      expect(result.success).toBe(true);
    });

    it("returns false when subscription not found", async () => {
      mockReturning.mockResolvedValueOnce([]);

      const result = await service.removeSubscription(mockUserId, "non-existent");

      expect(result.success).toBe(false);
    });
  });

  describe("getUserSubscriptions", () => {
    it("returns all active subscriptions for user", async () => {
      mockFindMany.mockResolvedValueOnce([mockSubscription]);

      const result = await service.getUserSubscriptions(mockUserId);

      expect(result).toHaveLength(1);
      expect(result[0]?.id).toBe(mockSubscription.id);
    });

    it("returns empty array when no subscriptions", async () => {
      mockFindMany.mockResolvedValueOnce([]);

      const result = await service.getUserSubscriptions(mockUserId);

      expect(result).toHaveLength(0);
    });
  });

  describe("checkPreferences", () => {
    it("returns canSend true when no preferences exist", async () => {
      mockFindFirst.mockResolvedValueOnce(undefined);

      const result = await service.checkPreferences(mockUserId, "new_message");

      expect(result.canSend).toBe(true);
    });

    it("returns canSend false when push disabled", async () => {
      mockFindFirst.mockResolvedValueOnce({ ...mockPreferences, pushEnabled: false });

      const result = await service.checkPreferences(mockUserId, "new_message");

      expect(result.canSend).toBe(false);
      expect(result.reason).toContain("disabled");
    });

    it("returns canSend true when preferences allow", async () => {
      mockFindFirst.mockResolvedValueOnce(mockPreferences);

      const result = await service.checkPreferences(mockUserId, "new_message");

      expect(result.canSend).toBe(true);
    });

    it("returns canSend false when type is disabled", async () => {
      mockFindFirst.mockResolvedValueOnce({ ...mockPreferences, newMessage: false });

      const result = await service.checkPreferences(mockUserId, "new_message");

      expect(result.canSend).toBe(false);
    });
  });

  describe("markAsRead", () => {
    it("marks notification as read successfully", async () => {
      mockReturning.mockResolvedValueOnce([{ id: "notif-123" }]);

      const result = await service.markAsRead("notif-123", mockUserId);

      expect(result).toBe(true);
    });

    it("returns false when notification not found", async () => {
      mockReturning.mockResolvedValueOnce([]);

      const result = await service.markAsRead("non-existent", mockUserId);

      expect(result).toBe(false);
    });
  });

  describe("markAllAsRead", () => {
    it("marks all notifications as read and returns count", async () => {
      mockReturning.mockResolvedValueOnce([{ id: "1" }, { id: "2" }, { id: "3" }]);

      const result = await service.markAllAsRead(mockUserId);

      expect(result).toBe(3);
    });

    it("returns 0 when no notifications to mark", async () => {
      mockReturning.mockResolvedValueOnce([]);

      const result = await service.markAllAsRead(mockUserId);

      expect(result).toBe(0);
    });
  });

  describe("getUnreadCount", () => {
    it("returns correct unread count", async () => {
      mockFindMany.mockResolvedValueOnce([{ id: "1" }, { id: "2" }, { id: "3" }]);

      const result = await service.getUnreadCount(mockUserId);

      expect(result).toBe(3);
    });

    it("returns 0 when no unread notifications", async () => {
      mockFindMany.mockResolvedValueOnce([]);

      const result = await service.getUnreadCount(mockUserId);

      expect(result).toBe(0);
    });
  });

  describe("getNotifications", () => {
    it("returns paginated notifications", async () => {
      mockFindMany.mockResolvedValueOnce([mockNotification]);

      const result = await service.getNotifications(mockUserId, {
        limit: 10,
        offset: 0,
      });

      expect(result).toHaveLength(1);
      expect(result[0]?.id).toBe(mockNotification.id);
    });

    it("filters by type when specified", async () => {
      mockFindMany.mockResolvedValueOnce([
        mockNotification,
        { ...mockNotification, id: "notif-456", type: "schedule_change" },
      ]);

      const result = await service.getNotifications(mockUserId, {
        types: ["new_message"],
      });

      expect(result).toHaveLength(1);
      expect(result[0]?.type).toBe("new_message");
    });

    it("returns empty array when no notifications", async () => {
      mockFindMany.mockResolvedValueOnce([]);

      const result = await service.getNotifications(mockUserId);

      expect(result).toHaveLength(0);
    });
  });

  describe("recordClick", () => {
    it("records click successfully", async () => {
      mockReturning.mockResolvedValueOnce([{ id: "notif-123" }]);

      const result = await service.recordClick("notif-123", mockUserId);

      expect(result).toBe(true);
    });

    it("returns false when notification not found", async () => {
      mockReturning.mockResolvedValueOnce([]);

      const result = await service.recordClick("non-existent", mockUserId);

      expect(result).toBe(false);
    });
  });
});

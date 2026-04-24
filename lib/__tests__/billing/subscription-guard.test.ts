import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFindFirstProfile = vi.fn();
const mockFindFirstSubscription = vi.fn();

// Mock the db module
vi.mock("@/lib/db", () => ({
  db: {
    query: {
      producerProfiles: {
        findFirst: (...args: unknown[]): unknown => mockFindFirstProfile(...args),
      },
      subscriptions: {
        findFirst: (...args: unknown[]): unknown => mockFindFirstSubscription(...args),
      },
    },
  },
}));

import {
  checkSubscription,
  SubscriptionRequiredError,
  requireSubscription,
} from "../../subscription-guard";

const mockProducerProfile = {
  id: "profile-123",
  userId: "user-123",
  companyName: "Test Company",
  slug: "test-company",
  logoUrl: null,
  description: null,
  location: null,
  website: null,
  unionStatus: "both" as const,
  socialLinks: null,
  isPublic: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const createMockSubscription = (
  overrides: Record<string, unknown> = {}
): Record<string, unknown> => ({
  id: "sub-123",
  organizationId: "profile-123",
  stripeCustomerId: "cus_123",
  stripeSubscriptionId: "sub_123",
  plan: "monthly" as const,
  status: "active" as const,
  currentPeriodStart: new Date(),
  currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  canceledAt: null,
  cancelAtPeriodEnd: null,
  trialEnd: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe("checkSubscription", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns no_subscription when profile not found", async () => {
    mockFindFirstProfile.mockResolvedValue(undefined);

    const result = await checkSubscription("user-123");

    expect(result.status).toBe("no_subscription");
    expect(result.hasAccess).toBe(false);
    expect(result.message).toBe("Producer profile not found");
  });

  it("returns no_subscription when subscription not found", async () => {
    mockFindFirstProfile.mockResolvedValue(mockProducerProfile);
    mockFindFirstSubscription.mockResolvedValue(undefined);

    const result = await checkSubscription("user-123");

    expect(result.status).toBe("no_subscription");
    expect(result.hasAccess).toBe(false);
  });

  it("returns active status with access for active subscription", async () => {
    mockFindFirstProfile.mockResolvedValue(mockProducerProfile);
    mockFindFirstSubscription.mockResolvedValue(createMockSubscription());

    const result = await checkSubscription("user-123");

    expect(result.status).toBe("active");
    expect(result.hasAccess).toBe(true);
  });

  it("returns trialing status with access and days remaining", async () => {
    const trialEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

    mockFindFirstProfile.mockResolvedValue(mockProducerProfile);
    mockFindFirstSubscription.mockResolvedValue(
      createMockSubscription({
        status: "trialing",
        trialEnd,
      })
    );

    const result = await checkSubscription("user-123");

    expect(result.status).toBe("trialing");
    expect(result.hasAccess).toBe(true);
    expect(result.daysRemaining).toBe(7);
    expect(result.trialEndsAt).toEqual(trialEnd);
  });

  it("returns expired status when trial has ended", async () => {
    const trialEnd = new Date(Date.now() - 24 * 60 * 60 * 1000); // 1 day ago

    mockFindFirstProfile.mockResolvedValue(mockProducerProfile);
    mockFindFirstSubscription.mockResolvedValue(
      createMockSubscription({
        status: "trialing",
        trialEnd,
      })
    );

    const result = await checkSubscription("user-123");

    expect(result.status).toBe("expired");
    expect(result.hasAccess).toBe(false);
  });

  it("allows access during grace period for past_due", async () => {
    const periodEnd = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000); // 2 days ago (within 7-day grace)

    mockFindFirstProfile.mockResolvedValue(mockProducerProfile);
    mockFindFirstSubscription.mockResolvedValue(
      createMockSubscription({
        status: "past_due",
        currentPeriodEnd: periodEnd,
      })
    );

    const result = await checkSubscription("user-123");

    expect(result.status).toBe("past_due");
    expect(result.hasAccess).toBe(true);
    expect(result.daysRemaining).toBeGreaterThan(0);
  });

  it("denies access when canceled and period has ended", async () => {
    const periodEnd = new Date(Date.now() - 24 * 60 * 60 * 1000); // 1 day ago

    mockFindFirstProfile.mockResolvedValue(mockProducerProfile);
    mockFindFirstSubscription.mockResolvedValue(
      createMockSubscription({
        status: "canceled",
        currentPeriodEnd: periodEnd,
        canceledAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      })
    );

    const result = await checkSubscription("user-123");

    expect(result.status).toBe("canceled");
    expect(result.hasAccess).toBe(false);
  });
});

describe("requireSubscription", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws SubscriptionRequiredError when no access", async () => {
    mockFindFirstProfile.mockResolvedValue(undefined);

    await expect(requireSubscription("user-123")).rejects.toThrow(SubscriptionRequiredError);
  });

  it("does not throw when subscription is active", async () => {
    mockFindFirstProfile.mockResolvedValue(mockProducerProfile);
    mockFindFirstSubscription.mockResolvedValue(createMockSubscription());

    await expect(requireSubscription("user-123")).resolves.toBeUndefined();
  });
});

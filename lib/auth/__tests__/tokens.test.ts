import { describe, it, expect } from "vitest";
import { generateSecureToken, getPasswordResetExpiry } from "../tokens";

describe("generateSecureToken", () => {
  it("should generate a 64-character hex token", () => {
    const token = generateSecureToken();

    expect(token).toBeDefined();
    expect(token).toHaveLength(64);
    expect(/^[a-f0-9]+$/.test(token)).toBe(true);
  });

  it("should generate unique tokens", () => {
    const token1 = generateSecureToken();
    const token2 = generateSecureToken();

    expect(token1).not.toBe(token2);
  });
});

describe("getPasswordResetExpiry", () => {
  it("should return a date 1 hour in the future", () => {
    const before = Date.now();
    const expiry = getPasswordResetExpiry();
    const after = Date.now();

    const oneHourInMs = 60 * 60 * 1000;

    expect(expiry.getTime()).toBeGreaterThanOrEqual(before + oneHourInMs - 100);
    expect(expiry.getTime()).toBeLessThanOrEqual(after + oneHourInMs + 100);
  });

  it("should return a Date object", () => {
    const expiry = getPasswordResetExpiry();

    expect(expiry).toBeInstanceOf(Date);
  });
});

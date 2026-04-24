import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword, validatePasswordStrength } from "../password";

describe("hashPassword", () => {
  it("should hash a password", async () => {
    const password = "TestPassword123";
    const hash = await hashPassword(password);

    expect(hash).toBeDefined();
    expect(hash).not.toBe(password);
    expect(hash.length).toBeGreaterThan(0);
  });

  it("should produce different hashes for the same password", async () => {
    const password = "TestPassword123";
    const hash1 = await hashPassword(password);
    const hash2 = await hashPassword(password);

    expect(hash1).not.toBe(hash2);
  });
});

describe("verifyPassword", () => {
  it("should verify a correct password", async () => {
    const password = "TestPassword123";
    const hash = await hashPassword(password);
    const isValid = await verifyPassword(password, hash);

    expect(isValid).toBe(true);
  });

  it("should reject an incorrect password", async () => {
    const password = "TestPassword123";
    const wrongPassword = "WrongPassword456";
    const hash = await hashPassword(password);
    const isValid = await verifyPassword(wrongPassword, hash);

    expect(isValid).toBe(false);
  });
});

describe("validatePasswordStrength", () => {
  it("should accept a strong password", () => {
    const result = validatePasswordStrength("StrongPass123");

    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("should reject a password shorter than 8 characters", () => {
    const result = validatePasswordStrength("Short1A");

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Password must be at least 8 characters long");
  });

  it("should reject a password without lowercase letters", () => {
    const result = validatePasswordStrength("UPPERCASE123");

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Password must contain at least one lowercase letter");
  });

  it("should reject a password without uppercase letters", () => {
    const result = validatePasswordStrength("lowercase123");

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Password must contain at least one uppercase letter");
  });

  it("should reject a password without numbers", () => {
    const result = validatePasswordStrength("NoNumbersHere");

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Password must contain at least one number");
  });

  it("should return multiple errors for a very weak password", () => {
    const result = validatePasswordStrength("weak");

    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(1);
  });
});

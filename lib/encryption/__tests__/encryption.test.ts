import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock server-only before importing the module
vi.mock("server-only", () => ({}));

describe("Encryption Service", () => {
  const MOCK_KEY = "0".repeat(64); // 32-byte hex key

  beforeEach(() => {
    vi.stubEnv("DOCUMENT_ENCRYPTION_KEY", MOCK_KEY);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  describe("generateSalt", () => {
    it("should generate a 64-character hex salt", async () => {
      const { generateSalt } = await import("../index");
      const salt = generateSalt();
      expect(salt).toHaveLength(64);
      expect(/^[0-9a-f]+$/i.test(salt)).toBe(true);
    });

    it("should generate unique salts", async () => {
      const { generateSalt } = await import("../index");
      const salt1 = generateSalt();
      const salt2 = generateSalt();
      expect(salt1).not.toBe(salt2);
    });
  });

  describe("generateIv", () => {
    it("should generate a 24-character hex IV (12 bytes)", async () => {
      const { generateIv } = await import("../index");
      const iv = generateIv();
      expect(iv).toHaveLength(24);
      expect(/^[0-9a-f]+$/i.test(iv)).toBe(true);
    });
  });

  describe("encryptDocument and decryptDocument", () => {
    it("should encrypt and decrypt data correctly", async () => {
      const { encryptDocument, decryptDocument } = await import("../index");
      const originalData = Buffer.from("Hello, World! This is sensitive document data.");

      const { encryptedData, iv, authTag, salt } = encryptDocument(originalData);

      // Encrypted data should be different from original
      expect(encryptedData.toString()).not.toBe(originalData.toString());

      // Decrypt should return original data
      const decrypted = decryptDocument(encryptedData, iv, authTag, salt);
      expect(decrypted.toString()).toBe(originalData.toString());
    });

    it("should produce different ciphertext for same plaintext with different salts", async () => {
      const { encryptDocument } = await import("../index");
      const originalData = Buffer.from("Same data for both");

      const result1 = encryptDocument(originalData);
      const result2 = encryptDocument(originalData);

      // Salts should be different
      expect(result1.salt).not.toBe(result2.salt);

      // Encrypted data should be different
      expect(result1.encryptedData.toString("hex")).not.toBe(
        result2.encryptedData.toString("hex")
      );
    });

    it("should use provided salt when specified", async () => {
      const { encryptDocument, generateSalt } = await import("../index");
      const originalData = Buffer.from("Test data");
      const customSalt = generateSalt();

      const result = encryptDocument(originalData, customSalt);
      expect(result.salt).toBe(customSalt);
    });

    it("should fail decryption with wrong auth tag", async () => {
      const { encryptDocument, decryptDocument } = await import("../index");
      const originalData = Buffer.from("Sensitive data");

      const { encryptedData, iv, salt } = encryptDocument(originalData);
      const wrongAuthTag = "0".repeat(32);

      expect(() => {
        decryptDocument(encryptedData, iv, wrongAuthTag, salt);
      }).toThrow();
    });

    it("should fail decryption with wrong salt", async () => {
      const { encryptDocument, decryptDocument, generateSalt } = await import("../index");
      const originalData = Buffer.from("Sensitive data");

      const { encryptedData, iv, authTag } = encryptDocument(originalData);
      const wrongSalt = generateSalt();

      expect(() => {
        decryptDocument(encryptedData, iv, authTag, wrongSalt);
      }).toThrow();
    });

    it("should fail decryption with wrong IV", async () => {
      const { encryptDocument, decryptDocument, generateIv } = await import("../index");
      const originalData = Buffer.from("Sensitive data");

      const { encryptedData, authTag, salt } = encryptDocument(originalData);
      const wrongIv = generateIv();

      expect(() => {
        decryptDocument(encryptedData, wrongIv, authTag, salt);
      }).toThrow();
    });

    it("should handle large files", async () => {
      const { encryptDocument, decryptDocument } = await import("../index");
      // 5MB of random data
      const largeData = Buffer.alloc(5 * 1024 * 1024);
      for (let i = 0; i < largeData.length; i++) {
        largeData[i] = Math.floor(Math.random() * 256);
      }

      const { encryptedData, iv, authTag, salt } = encryptDocument(largeData);
      const decrypted = decryptDocument(encryptedData, iv, authTag, salt);

      expect(decrypted.equals(largeData)).toBe(true);
    });

    it("should handle binary data (PDF-like)", async () => {
      const { encryptDocument, decryptDocument } = await import("../index");
      // PDF magic number followed by random binary data
      const pdfHeader = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d]); // %PDF-
      const binaryContent = Buffer.from([0x00, 0xff, 0xfe, 0x01, 0x02]);
      const pdfData = Buffer.concat([pdfHeader, binaryContent]);

      const { encryptedData, iv, authTag, salt } = encryptDocument(pdfData);
      const decrypted = decryptDocument(encryptedData, iv, authTag, salt);

      expect(decrypted.equals(pdfData)).toBe(true);
    });
  });

  describe("verifyEncryptionConfig", () => {
    it("should return true when key is configured", async () => {
      const { verifyEncryptionConfig } = await import("../index");
      expect(verifyEncryptionConfig()).toBe(true);
    });

    it("should return false when key is not configured", async () => {
      vi.unstubAllEnvs();
      vi.resetModules();

      const { verifyEncryptionConfig } = await import("../index");
      expect(verifyEncryptionConfig()).toBe(false);
    });
  });
});

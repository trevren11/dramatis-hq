import "server-only";

import { createCipheriv, createDecipheriv, randomBytes, pbkdf2Sync } from "crypto";

const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 12; // 96 bits - NIST recommended for GCM
const AUTH_TAG_LENGTH = 16; // 128 bits
const SALT_LENGTH = 32; // 256 bits
const PBKDF2_ITERATIONS = 100000;

/**
 * Get the master encryption key from environment
 */
function getMasterKey(): Buffer {
  const key = process.env.DOCUMENT_ENCRYPTION_KEY;
  if (!key) {
    throw new Error("DOCUMENT_ENCRYPTION_KEY environment variable is not set");
  }
  // If key is hex-encoded (64 chars = 32 bytes)
  if (key.length === 64 && /^[0-9a-fA-F]+$/.test(key)) {
    return Buffer.from(key, "hex");
  }
  // Otherwise treat as UTF-8 and derive a key
  return pbkdf2Sync(key, "dramatis-master-salt", PBKDF2_ITERATIONS, KEY_LENGTH, "sha256");
}

/**
 * Derive a document-specific key from the master key and a salt
 */
function deriveKey(salt: Buffer): Buffer {
  const masterKey = getMasterKey();
  return pbkdf2Sync(masterKey, salt, PBKDF2_ITERATIONS, KEY_LENGTH, "sha256");
}

/**
 * Generate a random salt for key derivation
 */
export function generateSalt(): string {
  return randomBytes(SALT_LENGTH).toString("hex");
}

/**
 * Generate a random IV for encryption
 */
export function generateIv(): string {
  return randomBytes(IV_LENGTH).toString("hex");
}

export interface EncryptionResult {
  encryptedData: Buffer;
  iv: string;
  authTag: string;
  salt: string;
}

/**
 * Encrypt data using AES-256-GCM with a unique document key
 */
export function encryptDocument(data: Buffer, salt?: string): EncryptionResult {
  const documentSalt = salt ?? generateSalt();
  const saltBuffer = Buffer.from(documentSalt, "hex");
  const key = deriveKey(saltBuffer);

  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    encryptedData: encrypted,
    iv: iv.toString("hex"),
    authTag: authTag.toString("hex"),
    salt: documentSalt,
  };
}

/**
 * Decrypt data using AES-256-GCM
 */
export function decryptDocument(
  encryptedData: Buffer,
  iv: string,
  authTag: string,
  salt: string
): Buffer {
  const saltBuffer = Buffer.from(salt, "hex");
  const key = deriveKey(saltBuffer);
  const ivBuffer = Buffer.from(iv, "hex");
  const authTagBuffer = Buffer.from(authTag, "hex");

  const decipher = createDecipheriv(ALGORITHM, key, ivBuffer, {
    authTagLength: AUTH_TAG_LENGTH,
  });
  decipher.setAuthTag(authTagBuffer);

  const decrypted = Buffer.concat([decipher.update(encryptedData), decipher.final()]);

  return decrypted;
}

/**
 * Verify that encryption is properly configured
 */
export function verifyEncryptionConfig(): boolean {
  try {
    getMasterKey();
    return true;
  } catch {
    return false;
  }
}

import { describe, it, expect } from "vitest";
import {
  validateFileSize,
  validateMimeType,
  validateFile,
  getExtensionFromMimeType,
  getMimeTypeFromExtension,
  detectMimeType,
  SIZE_LIMITS,
} from "../validation";

describe("validateFileSize", () => {
  it("accepts files under the limit", () => {
    const result = validateFileSize(1024, "headshot");
    expect(result.valid).toBe(true);
  });

  it("rejects files over the limit", () => {
    const result = validateFileSize(SIZE_LIMITS.headshot + 1, "headshot");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("10MB");
  });

  it("accepts files exactly at the limit", () => {
    const result = validateFileSize(SIZE_LIMITS.headshot, "headshot");
    expect(result.valid).toBe(true);
  });

  it("applies correct limits per media type", () => {
    expect(validateFileSize(11 * 1024 * 1024, "headshot").valid).toBe(false);
    expect(validateFileSize(11 * 1024 * 1024, "document").valid).toBe(true);
    expect(validateFileSize(501 * 1024 * 1024, "video").valid).toBe(false);
  });
});

describe("validateMimeType", () => {
  it("accepts valid image MIME types for headshots", () => {
    expect(validateMimeType("image/jpeg", "headshot").valid).toBe(true);
    expect(validateMimeType("image/png", "headshot").valid).toBe(true);
    expect(validateMimeType("image/webp", "headshot").valid).toBe(true);
  });

  it("rejects invalid MIME types for headshots", () => {
    const result = validateMimeType("video/mp4", "headshot");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("Invalid file type");
  });

  it("accepts valid video MIME types", () => {
    expect(validateMimeType("video/mp4", "video").valid).toBe(true);
    expect(validateMimeType("video/quicktime", "video").valid).toBe(true);
    expect(validateMimeType("video/webm", "video").valid).toBe(true);
  });

  it("accepts valid document MIME types", () => {
    expect(validateMimeType("application/pdf", "document").valid).toBe(true);
    expect(validateMimeType("application/msword", "document").valid).toBe(true);
    expect(
      validateMimeType(
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "document"
      ).valid
    ).toBe(true);
  });
});

describe("validateFile", () => {
  it("validates both size and type", () => {
    const validResult = validateFile(1024, "image/jpeg", "headshot");
    expect(validResult.valid).toBe(true);

    const invalidSizeResult = validateFile(SIZE_LIMITS.headshot + 1, "image/jpeg", "headshot");
    expect(invalidSizeResult.valid).toBe(false);

    const invalidTypeResult = validateFile(1024, "video/mp4", "headshot");
    expect(invalidTypeResult.valid).toBe(false);
  });
});

describe("getExtensionFromMimeType", () => {
  it("returns correct extension for known MIME types", () => {
    expect(getExtensionFromMimeType("image/jpeg")).toBe("jpg");
    expect(getExtensionFromMimeType("image/png")).toBe("png");
    expect(getExtensionFromMimeType("video/mp4")).toBe("mp4");
    expect(getExtensionFromMimeType("application/pdf")).toBe("pdf");
  });

  it("returns empty string for unknown MIME types", () => {
    expect(getExtensionFromMimeType("application/unknown")).toBe("");
  });
});

describe("getMimeTypeFromExtension", () => {
  it("returns correct MIME type for known extensions", () => {
    expect(getMimeTypeFromExtension("jpg")).toBe("image/jpeg");
    expect(getMimeTypeFromExtension("jpeg")).toBe("image/jpeg");
    expect(getMimeTypeFromExtension("png")).toBe("image/png");
    expect(getMimeTypeFromExtension("mp4")).toBe("video/mp4");
    expect(getMimeTypeFromExtension("pdf")).toBe("application/pdf");
  });

  it("handles extensions with leading dot", () => {
    expect(getMimeTypeFromExtension(".jpg")).toBe("image/jpeg");
    expect(getMimeTypeFromExtension(".PDF")).toBe("application/pdf");
  });

  it("returns undefined for unknown extensions", () => {
    expect(getMimeTypeFromExtension("unknown")).toBeUndefined();
  });
});

describe("detectMimeType", () => {
  it("detects JPEG files", () => {
    const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00]);
    expect(detectMimeType(jpegBuffer)).toBe("image/jpeg");
  });

  it("detects PNG files", () => {
    const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    expect(detectMimeType(pngBuffer)).toBe("image/png");
  });

  it("detects PDF files", () => {
    const pdfBuffer = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d]);
    expect(detectMimeType(pdfBuffer)).toBe("application/pdf");
  });

  it("returns null for unknown file types", () => {
    const unknownBuffer = Buffer.from([0x00, 0x01, 0x02, 0x03]);
    expect(detectMimeType(unknownBuffer)).toBeNull();
  });
});

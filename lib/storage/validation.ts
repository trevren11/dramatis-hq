import type { MediaType } from "./index";

// File size limits in bytes
export const SIZE_LIMITS: Record<MediaType, number> = {
  headshot: 10 * 1024 * 1024, // 10MB
  video: 500 * 1024 * 1024, // 500MB
  document: 25 * 1024 * 1024, // 25MB
  temp: 100 * 1024 * 1024, // 100MB
};

// Allowed MIME types per media type
export const ALLOWED_MIME_TYPES: Record<MediaType, string[]> = {
  headshot: ["image/jpeg", "image/png", "image/webp"],
  video: ["video/mp4", "video/quicktime", "video/webm"],
  document: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
  temp: [
    "image/jpeg",
    "image/png",
    "image/webp",
    "video/mp4",
    "video/quicktime",
    "video/webm",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
};

// File extension to MIME type mapping
export const EXTENSION_MIME_MAP: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  mp4: "video/mp4",
  mov: "video/quicktime",
  webm: "video/webm",
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export function validateFileSize(size: number, type: MediaType): FileValidationResult {
  const limit = SIZE_LIMITS[type];
  if (size > limit) {
    const limitMB = String(Math.round(limit / (1024 * 1024)));
    return {
      valid: false,
      error: `File size exceeds ${limitMB}MB limit`,
    };
  }
  return { valid: true };
}

export function validateMimeType(mimeType: string, type: MediaType): FileValidationResult {
  const allowed = ALLOWED_MIME_TYPES[type];
  if (!allowed.includes(mimeType)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed: ${allowed.join(", ")}`,
    };
  }
  return { valid: true };
}

export function validateFile(
  size: number,
  mimeType: string,
  type: MediaType
): FileValidationResult {
  const sizeResult = validateFileSize(size, type);
  if (!sizeResult.valid) {
    return sizeResult;
  }

  const mimeResult = validateMimeType(mimeType, type);
  if (!mimeResult.valid) {
    return mimeResult;
  }

  return { valid: true };
}

export function getExtensionFromMimeType(mimeType: string): string {
  const entry = Object.entries(EXTENSION_MIME_MAP).find(([, mime]) => mime === mimeType);
  return entry ? entry[0] : "";
}

export function getMimeTypeFromExtension(extension: string): string | undefined {
  const ext = extension.toLowerCase().replace(/^\./, "");
  return EXTENSION_MIME_MAP[ext];
}

// Magic byte detection for common file types
const MAGIC_BYTES: { type: string; bytes: number[]; offset?: number }[] = [
  { type: "image/jpeg", bytes: [0xff, 0xd8, 0xff] },
  { type: "image/png", bytes: [0x89, 0x50, 0x4e, 0x47] },
  { type: "image/webp", bytes: [0x52, 0x49, 0x46, 0x46], offset: 0 }, // RIFF
  { type: "video/mp4", bytes: [0x66, 0x74, 0x79, 0x70], offset: 4 }, // ftyp (also matches MOV)
  { type: "video/webm", bytes: [0x1a, 0x45, 0xdf, 0xa3] }, // EBML header
  { type: "application/pdf", bytes: [0x25, 0x50, 0x44, 0x46] }, // %PDF
];

export function detectMimeType(buffer: Buffer): string | null {
  for (const { type, bytes, offset = 0 } of MAGIC_BYTES) {
    const match = bytes.every((byte, i) => buffer[offset + i] === byte);
    if (match) {
      return type;
    }
  }
  return null;
}

export function validateFileContent(
  buffer: Buffer,
  declaredMimeType: string,
  type: MediaType
): FileValidationResult {
  const detectedMime = detectMimeType(buffer);

  // For documents like PDF, we can verify the content
  if (detectedMime) {
    // Check if detected type matches declared type (allow some flexibility)
    const mimeBase = declaredMimeType.split("/")[0];
    const detectedBase = detectedMime.split("/")[0];

    // Allow video/mp4 and video/quicktime to be interchangeable (MOV uses same ftyp signature)
    const isCompatibleVideo =
      mimeBase === "video" &&
      detectedBase === "video" &&
      ["video/mp4", "video/quicktime"].includes(declaredMimeType) &&
      detectedMime === "video/mp4";

    if (mimeBase !== detectedBase && !isCompatibleVideo) {
      return {
        valid: false,
        error: "File content does not match declared type",
      };
    }
  }

  return validateMimeType(declaredMimeType, type);
}

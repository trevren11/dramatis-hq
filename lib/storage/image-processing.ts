import "server-only";

import sharp, { type Sharp, type Metadata } from "sharp";

export interface ImageProcessingOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: "webp" | "jpeg" | "png";
}

export interface ProcessedImage {
  buffer: Buffer;
  width?: number;
  height?: number;
  format: string;
  contentType: string;
}

const HEADSHOT_OPTIONS: ImageProcessingOptions = {
  maxWidth: 800,
  maxHeight: 1000,
  quality: 85,
  format: "webp",
};

const THUMBNAIL_OPTIONS: ImageProcessingOptions = {
  maxWidth: 200,
  maxHeight: 200,
  quality: 80,
  format: "webp",
};

export async function processImage(
  buffer: Buffer,
  options: ImageProcessingOptions = {}
): Promise<ProcessedImage> {
  const { maxWidth = 1920, maxHeight = 1920, quality = 85, format = "webp" } = options;

  let pipeline: Sharp = sharp(buffer);

  // Get original metadata
  const metadata: Metadata = await pipeline.metadata();

  // Resize if needed, maintaining aspect ratio
  if (
    (metadata.width && metadata.width > maxWidth) ||
    (metadata.height && metadata.height > maxHeight)
  ) {
    pipeline = pipeline.resize(maxWidth, maxHeight, {
      fit: "inside",
      withoutEnlargement: true,
    });
  }

  // Convert to target format
  switch (format) {
    case "webp":
      pipeline = pipeline.webp({ quality });
      break;
    case "jpeg":
      pipeline = pipeline.jpeg({ quality });
      break;
    case "png":
      pipeline = pipeline.png({ quality });
      break;
  }

  const outputBuffer: Buffer = await pipeline.toBuffer();
  const outputMetadata: Metadata = await sharp(outputBuffer).metadata();

  const contentTypeMap: Record<"webp" | "jpeg" | "png", string> = {
    webp: "image/webp",
    jpeg: "image/jpeg",
    png: "image/png",
  };

  return {
    buffer: outputBuffer,
    width: outputMetadata.width,
    height: outputMetadata.height,
    format,
    contentType: contentTypeMap[format],
  };
}

export async function processHeadshot(buffer: Buffer): Promise<ProcessedImage> {
  return processImage(buffer, HEADSHOT_OPTIONS);
}

export async function generateThumbnail(buffer: Buffer): Promise<ProcessedImage> {
  return processImage(buffer, THUMBNAIL_OPTIONS);
}

export async function validateImageBuffer(buffer: Buffer): Promise<{
  valid: boolean;
  format?: string;
  width?: number;
  height?: number;
  error?: string;
}> {
  try {
    const metadata: Metadata = await sharp(buffer).metadata();
    const validFormats = ["jpeg", "png", "webp", "gif"];
    const format: string | undefined = metadata.format;

    if (!format || !validFormats.includes(format)) {
      return {
        valid: false,
        error: `Invalid image format. Supported formats: ${validFormats.join(", ")}`,
      };
    }

    return {
      valid: true,
      format,
      width: metadata.width,
      height: metadata.height,
    };
  } catch {
    return {
      valid: false,
      error: "Unable to process image. The file may be corrupted.",
    };
  }
}

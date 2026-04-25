import { z } from "zod";
import {
  VIDEO_CATEGORIES,
  VIDEO_VISIBILITIES,
  VIDEO_SOURCE_TYPES,
  ALLOWED_VIDEO_TYPES,
  MAX_VIDEO_FILE_SIZE,
} from "@/lib/db/schema/video-samples";

// YouTube URL patterns
const YOUTUBE_REGEX =
  /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})(?:\S*)?$/;

// Vimeo URL patterns
const VIMEO_REGEX = /^(?:https?:\/\/)?(?:www\.)?vimeo\.com\/(\d+)(?:\S*)?$/;

export const videoSampleCreateSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title must be 200 characters or less"),
  description: z
    .string()
    .max(2000, "Description must be 2000 characters or less")
    .optional()
    .nullable(),
  category: z.enum(VIDEO_CATEGORIES, {
    errorMap: () => ({ message: "Please select a valid category" }),
  }),
  tags: z.string().max(500, "Tags must be 500 characters or less").optional().nullable(),
  visibility: z.enum(VIDEO_VISIBILITIES).default("public"),
  sourceType: z.enum(VIDEO_SOURCE_TYPES).default("upload"),
  sourceUrl: z.string().max(1024).optional().nullable(),
});

export const videoSampleUploadSchema = videoSampleCreateSchema.extend({
  // For uploaded videos
  url: z.string().url().max(1024),
  thumbnailUrl: z.string().url().max(1024).optional().nullable(),
  originalFilename: z.string().max(255).optional().nullable(),
  mimeType: z.string().max(50).optional().nullable(),
  fileSize: z.number().int().optional().nullable(),
  duration: z.number().int().optional().nullable(),
  width: z.number().int().optional().nullable(),
  height: z.number().int().optional().nullable(),
});

export const videoSampleExternalSchema = videoSampleCreateSchema
  .extend({
    // For external videos (YouTube/Vimeo)
    sourceUrl: z.string().min(1, "URL is required").max(1024),
  })
  .refine(
    (data) => {
      if (data.sourceType === "youtube") {
        return YOUTUBE_REGEX.test(data.sourceUrl);
      }
      if (data.sourceType === "vimeo") {
        return VIMEO_REGEX.test(data.sourceUrl);
      }
      return true;
    },
    {
      message: "Please enter a valid YouTube or Vimeo URL",
      path: ["sourceUrl"],
    }
  );

export const videoSampleUpdateSchema = z.object({
  title: z.string().min(1, "Title is required").max(200).optional(),
  description: z.string().max(2000).optional().nullable(),
  category: z.enum(VIDEO_CATEGORIES).optional(),
  tags: z.string().max(500).optional().nullable(),
  visibility: z.enum(VIDEO_VISIBILITIES).optional(),
  sortOrder: z.number().int().optional(),
  isFeatured: z.boolean().optional(),
  thumbnailUrl: z.string().url().max(1024).optional().nullable(),
});

export const videoSampleReorderSchema = z.object({
  videoIds: z.array(z.string().uuid()),
});

// Helper functions
export function validateVideoFileType(mimeType: string): boolean {
  return ALLOWED_VIDEO_TYPES.includes(mimeType);
}

export function validateVideoFileSize(size: number): boolean {
  return size <= MAX_VIDEO_FILE_SIZE;
}

export function getVideoFileSizeError(): string {
  const maxSizeMB = MAX_VIDEO_FILE_SIZE / (1024 * 1024);
  return `File size must be less than ${String(maxSizeMB)}MB`;
}

export function extractYouTubeId(url: string): string | null {
  const match = YOUTUBE_REGEX.exec(url);
  return match?.[1] ?? null;
}

export function extractVimeoId(url: string): string | null {
  const match = VIMEO_REGEX.exec(url);
  return match?.[1] ?? null;
}

export function getYouTubeThumbnailUrl(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
}

export function getYouTubeEmbedUrl(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}`;
}

export function getVimeoEmbedUrl(videoId: string): string {
  return `https://player.vimeo.com/video/${videoId}`;
}

export type VideoSampleCreate = z.infer<typeof videoSampleCreateSchema>;
export type VideoSampleUpload = z.infer<typeof videoSampleUploadSchema>;
export type VideoSampleExternal = z.infer<typeof videoSampleExternalSchema>;
export type VideoSampleUpdate = z.infer<typeof videoSampleUpdateSchema>;
export type VideoSampleReorder = z.infer<typeof videoSampleReorderSchema>;

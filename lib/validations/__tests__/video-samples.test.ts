import { describe, it, expect } from "vitest";
import {
  videoSampleCreateSchema,
  videoSampleUploadSchema,
  videoSampleExternalSchema,
  videoSampleUpdateSchema,
  videoSampleReorderSchema,
  validateVideoFileType,
  validateVideoFileSize,
  getVideoFileSizeError,
  extractYouTubeId,
  extractVimeoId,
  getYouTubeThumbnailUrl,
  getYouTubeEmbedUrl,
  getVimeoEmbedUrl,
} from "../video-samples";
import { MAX_VIDEO_FILE_SIZE, ALLOWED_VIDEO_TYPES } from "@/lib/db/schema/video-samples";

describe("Video Sample Validation Schemas", () => {
  describe("videoSampleCreateSchema", () => {
    it("accepts valid video sample data", () => {
      const data = {
        title: "My Performance Reel",
        category: "acting",
      };

      const result = videoSampleCreateSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("accepts video sample with all fields", () => {
      const data = {
        title: "Musical Theatre Reel",
        description: "Compilation of my best musical theatre performances",
        category: "singing",
        tags: "musical, broadway, vocals",
        visibility: "public",
        sourceType: "upload",
        sourceUrl: null,
      };

      const result = videoSampleCreateSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("rejects empty title", () => {
      const data = {
        title: "",
        category: "acting",
      };

      const result = videoSampleCreateSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("rejects title over 200 characters", () => {
      const data = {
        title: "a".repeat(201),
        category: "acting",
      };

      const result = videoSampleCreateSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("rejects description over 2000 characters", () => {
      const data = {
        title: "Test Video",
        description: "a".repeat(2001),
        category: "acting",
      };

      const result = videoSampleCreateSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("rejects invalid category", () => {
      const data = {
        title: "Test Video",
        category: "invalid_category",
      };

      const result = videoSampleCreateSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("rejects invalid visibility", () => {
      const data = {
        title: "Test Video",
        category: "acting",
        visibility: "invalid_visibility",
      };

      const result = videoSampleCreateSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("defaults visibility to public", () => {
      const data = {
        title: "Test Video",
        category: "acting",
      };

      const result = videoSampleCreateSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.visibility).toBe("public");
      }
    });

    it("defaults sourceType to upload", () => {
      const data = {
        title: "Test Video",
        category: "acting",
      };

      const result = videoSampleCreateSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sourceType).toBe("upload");
      }
    });

    it("accepts all valid categories", () => {
      const categories = [
        "acting",
        "singing",
        "dance",
        "instrument",
        "monologue",
        "scene",
        "other",
      ];

      for (const category of categories) {
        const data = { title: "Test", category };
        const result = videoSampleCreateSchema.safeParse(data);
        expect(result.success).toBe(true);
      }
    });

    it("accepts all valid visibilities", () => {
      const visibilities = ["public", "producers_only", "private"];

      for (const visibility of visibilities) {
        const data = { title: "Test", category: "acting", visibility };
        const result = videoSampleCreateSchema.safeParse(data);
        expect(result.success).toBe(true);
      }
    });
  });

  describe("videoSampleUploadSchema", () => {
    it("accepts valid uploaded video data", () => {
      const data = {
        title: "My Reel",
        category: "acting",
        url: "https://example.com/videos/my-reel.mp4",
      };

      const result = videoSampleUploadSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("accepts full upload data", () => {
      const data = {
        title: "Dance Video",
        description: "Contemporary dance solo",
        category: "dance",
        tags: "contemporary, solo",
        visibility: "public",
        sourceType: "upload",
        url: "https://cdn.example.com/videos/dance.mp4",
        thumbnailUrl: "https://cdn.example.com/thumbnails/dance.jpg",
        originalFilename: "dance-video.mp4",
        mimeType: "video/mp4",
        fileSize: 50000000,
        duration: 180,
        width: 1920,
        height: 1080,
      };

      const result = videoSampleUploadSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("rejects invalid URL", () => {
      const data = {
        title: "Test",
        category: "acting",
        url: "not-a-url",
      };

      const result = videoSampleUploadSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe("videoSampleExternalSchema", () => {
    it("accepts valid YouTube URL", () => {
      const data = {
        title: "My YouTube Video",
        category: "acting",
        sourceType: "youtube",
        sourceUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      };

      const result = videoSampleExternalSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("accepts valid YouTube short URL", () => {
      const data = {
        title: "My YouTube Video",
        category: "acting",
        sourceType: "youtube",
        sourceUrl: "https://youtu.be/dQw4w9WgXcQ",
      };

      const result = videoSampleExternalSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("accepts valid Vimeo URL", () => {
      const data = {
        title: "My Vimeo Video",
        category: "acting",
        sourceType: "vimeo",
        sourceUrl: "https://vimeo.com/123456789",
      };

      const result = videoSampleExternalSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("rejects invalid YouTube URL", () => {
      const data = {
        title: "My Video",
        category: "acting",
        sourceType: "youtube",
        sourceUrl: "https://example.com/video",
      };

      const result = videoSampleExternalSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("rejects invalid Vimeo URL", () => {
      const data = {
        title: "My Video",
        category: "acting",
        sourceType: "vimeo",
        sourceUrl: "https://example.com/video",
      };

      const result = videoSampleExternalSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("rejects empty sourceUrl", () => {
      const data = {
        title: "My Video",
        category: "acting",
        sourceType: "youtube",
        sourceUrl: "",
      };

      const result = videoSampleExternalSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe("videoSampleUpdateSchema", () => {
    it("accepts valid update data", () => {
      const data = {
        title: "Updated Title",
        isFeatured: true,
      };

      const result = videoSampleUpdateSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("accepts partial update", () => {
      const data = {
        visibility: "private",
      };

      const result = videoSampleUpdateSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("accepts empty object", () => {
      const result = videoSampleUpdateSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it("rejects invalid sortOrder", () => {
      const data = {
        sortOrder: "not-a-number",
      };

      const result = videoSampleUpdateSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe("videoSampleReorderSchema", () => {
    it("accepts valid video IDs", () => {
      const data = {
        videoIds: ["123e4567-e89b-12d3-a456-426614174000", "123e4567-e89b-12d3-a456-426614174001"],
      };

      const result = videoSampleReorderSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("accepts empty array", () => {
      const data = {
        videoIds: [],
      };

      const result = videoSampleReorderSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("rejects invalid UUIDs", () => {
      const data = {
        videoIds: ["not-a-uuid"],
      };

      const result = videoSampleReorderSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });
});

describe("Video Validation Helper Functions", () => {
  describe("validateVideoFileType", () => {
    it("accepts valid video MIME types", () => {
      expect(validateVideoFileType("video/mp4")).toBe(true);
      expect(validateVideoFileType("video/quicktime")).toBe(true);
      expect(validateVideoFileType("video/webm")).toBe(true);
    });

    it("rejects invalid MIME types", () => {
      expect(validateVideoFileType("video/avi")).toBe(false);
      expect(validateVideoFileType("image/jpeg")).toBe(false);
      expect(validateVideoFileType("application/pdf")).toBe(false);
    });

    it("validates against ALLOWED_VIDEO_TYPES constant", () => {
      for (const type of ALLOWED_VIDEO_TYPES) {
        expect(validateVideoFileType(type)).toBe(true);
      }
    });
  });

  describe("validateVideoFileSize", () => {
    it("accepts file size within limit", () => {
      expect(validateVideoFileSize(100 * 1024 * 1024)).toBe(true); // 100MB
      expect(validateVideoFileSize(MAX_VIDEO_FILE_SIZE)).toBe(true);
    });

    it("rejects file size over limit", () => {
      expect(validateVideoFileSize(MAX_VIDEO_FILE_SIZE + 1)).toBe(false);
      expect(validateVideoFileSize(600 * 1024 * 1024)).toBe(false); // 600MB
    });

    it("accepts small file sizes", () => {
      expect(validateVideoFileSize(1)).toBe(true);
      expect(validateVideoFileSize(1024)).toBe(true);
    });
  });

  describe("getVideoFileSizeError", () => {
    it("returns error message with correct size", () => {
      const error = getVideoFileSizeError();
      expect(error).toContain("500");
      expect(error).toContain("MB");
    });
  });
});

describe("YouTube Helper Functions", () => {
  describe("extractYouTubeId", () => {
    it("extracts ID from standard URL", () => {
      expect(extractYouTubeId("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    });

    it("extracts ID from short URL", () => {
      expect(extractYouTubeId("https://youtu.be/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    });

    it("extracts ID from embed URL", () => {
      expect(extractYouTubeId("https://www.youtube.com/embed/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    });

    it("extracts ID from URL with extra parameters", () => {
      expect(extractYouTubeId("https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=120")).toBe(
        "dQw4w9WgXcQ"
      );
    });

    it("returns null for invalid URLs", () => {
      expect(extractYouTubeId("https://vimeo.com/123456")).toBe(null);
      expect(extractYouTubeId("https://example.com/video")).toBe(null);
      expect(extractYouTubeId("invalid")).toBe(null);
    });

    it("handles URLs without protocol", () => {
      expect(extractYouTubeId("youtube.com/watch?v=dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    });
  });

  describe("getYouTubeThumbnailUrl", () => {
    it("returns correct thumbnail URL", () => {
      const url = getYouTubeThumbnailUrl("dQw4w9WgXcQ");
      expect(url).toBe("https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg");
    });
  });

  describe("getYouTubeEmbedUrl", () => {
    it("returns correct embed URL", () => {
      const url = getYouTubeEmbedUrl("dQw4w9WgXcQ");
      expect(url).toBe("https://www.youtube.com/embed/dQw4w9WgXcQ");
    });
  });
});

describe("Vimeo Helper Functions", () => {
  describe("extractVimeoId", () => {
    it("extracts ID from standard URL", () => {
      expect(extractVimeoId("https://vimeo.com/123456789")).toBe("123456789");
    });

    it("extracts ID from URL with extra path", () => {
      expect(extractVimeoId("https://vimeo.com/123456789/abc123")).toBe("123456789");
    });

    it("extracts ID from URL without www", () => {
      expect(extractVimeoId("vimeo.com/123456789")).toBe("123456789");
    });

    it("returns null for invalid URLs", () => {
      expect(extractVimeoId("https://youtube.com/watch?v=abc")).toBe(null);
      expect(extractVimeoId("https://example.com/video")).toBe(null);
      expect(extractVimeoId("invalid")).toBe(null);
    });
  });

  describe("getVimeoEmbedUrl", () => {
    it("returns correct embed URL", () => {
      const url = getVimeoEmbedUrl("123456789");
      expect(url).toBe("https://player.vimeo.com/video/123456789");
    });
  });
});

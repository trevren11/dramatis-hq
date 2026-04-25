"use client";

import * as React from "react";
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  RadixSelect as Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UploadProgress } from "@/components/upload/upload-progress";
import { Video, Link, Loader2 } from "lucide-react";
import type { VideoSample } from "@/lib/db/schema/video-samples";
import {
  VIDEO_CATEGORIES,
  VIDEO_CATEGORY_LABELS,
  VIDEO_VISIBILITIES,
  VIDEO_VISIBILITY_LABELS,
  ALLOWED_VIDEO_TYPES,
  MAX_VIDEO_FILE_SIZE,
} from "@/lib/db/schema/video-samples";
import {
  videoSampleCreateSchema,
  extractYouTubeId,
  extractVimeoId,
  getYouTubeThumbnailUrl,
} from "@/lib/validations/video-samples";

export interface VideoFormData {
  title: string;
  description: string;
  category: VideoSample["category"];
  tags: string;
  visibility: VideoSample["visibility"];
  sourceType: VideoSample["sourceType"];
  sourceUrl: string;
}

export const defaultVideoFormData: VideoFormData = {
  title: "",
  description: "",
  category: "acting",
  tags: "",
  visibility: "public",
  sourceType: "upload",
  sourceUrl: "",
};

interface VideoFormProps {
  isEditMode: boolean;
  initialData?: VideoFormData;
  onSubmit: (
    data: VideoFormData,
    uploadedUrl: string | null,
    thumbnailUrl: string | null
  ) => Promise<void>;
  onCancel: () => void;
  showToast: (options: { variant?: "destructive"; title: string; description: string }) => void;
}

export function VideoForm({
  isEditMode,
  initialData,
  onSubmit,
  onCancel,
  showToast,
}: VideoFormProps): React.ReactElement {
  const [formData, setFormData] = useState<VideoFormData>(initialData ?? defaultVideoFormData);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"upload" | "external">(
    initialData?.sourceType !== "upload" ? "external" : "upload"
  );
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
      showToast({
        variant: "destructive",
        title: "Invalid file type",
        description: "Please upload MP4, MOV, or WebM files only",
      });
      return;
    }

    if (file.size > MAX_VIDEO_FILE_SIZE) {
      showToast({
        variant: "destructive",
        title: "File too large",
        description: "Maximum file size is 500MB",
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formDataUpload = new FormData();
      formDataUpload.append("file", file);

      const result = await uploadWithProgress(formDataUpload, setUploadProgress);
      setUploadedUrl(result.url);

      if (!formData.title) {
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
        setFormData((prev) => ({ ...prev, title: nameWithoutExt }));
      }

      showToast({ title: "Video uploaded", description: "Now add details and save" });
    } catch (error) {
      showToast({
        variant: "destructive",
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload video",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (): Promise<void> => {
    const validation = videoSampleCreateSchema.safeParse(formData);
    if (!validation.success) {
      showToast({
        variant: "destructive",
        title: "Validation error",
        description: validation.error.errors[0]?.message ?? "Please check your input",
      });
      return;
    }

    if (activeTab === "upload" && !uploadedUrl && !isEditMode) {
      showToast({
        variant: "destructive",
        title: "No video",
        description: "Please upload a video file first",
      });
      return;
    }

    if (activeTab === "external" && !formData.sourceUrl) {
      showToast({
        variant: "destructive",
        title: "No URL",
        description: "Please enter a YouTube or Vimeo URL",
      });
      return;
    }

    let thumbnailUrl: string | null = null;
    if (activeTab === "external" && formData.sourceUrl) {
      const youtubeId = extractYouTubeId(formData.sourceUrl);
      const vimeoId = extractVimeoId(formData.sourceUrl);

      if (youtubeId) {
        thumbnailUrl = getYouTubeThumbnailUrl(youtubeId);
      } else if (!vimeoId) {
        showToast({
          variant: "destructive",
          title: "Invalid URL",
          description: "Please enter a valid YouTube or Vimeo URL",
        });
        return;
      }
    }

    setIsSaving(true);
    try {
      await onSubmit(formData, uploadedUrl, thumbnailUrl);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {!isEditMode && (
        <Tabs
          value={activeTab}
          onValueChange={(v) => {
            setActiveTab(v as "upload" | "external");
          }}
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">
              <Video className="mr-2 h-4 w-4" />
              Upload Video
            </TabsTrigger>
            <TabsTrigger value="external">
              <Link className="mr-2 h-4 w-4" />
              YouTube/Vimeo
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="mt-4">
            <UploadArea
              fileInputRef={fileInputRef}
              isUploading={isUploading}
              uploadProgress={uploadProgress}
              uploadedUrl={uploadedUrl}
              onFileSelect={handleFileSelect}
              onClear={() => {
                setUploadedUrl(null);
                if (fileInputRef.current) {
                  fileInputRef.current.value = "";
                }
              }}
            />
          </TabsContent>

          <TabsContent value="external" className="mt-4">
            <div className="space-y-2">
              <Label htmlFor="sourceUrl">YouTube or Vimeo URL</Label>
              <div className="flex gap-2">
                <Video className="text-muted-foreground mt-2 h-5 w-5" />
                <Input
                  id="sourceUrl"
                  value={formData.sourceUrl}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, sourceUrl: e.target.value }));
                  }}
                  placeholder="https://www.youtube.com/watch?v=... or https://vimeo.com/..."
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      )}

      <VideoDetailsForm formData={formData} setFormData={setFormData} />

      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          onClick={() => {
            void handleSubmit();
          }}
          disabled={isSaving || isUploading}
        >
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditMode ? "Save Changes" : "Add Video"}
        </Button>
      </div>
    </div>
  );
}

interface UploadAreaProps {
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  isUploading: boolean;
  uploadProgress: number;
  uploadedUrl: string | null;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  onClear: () => void;
}

function UploadArea({
  fileInputRef,
  isUploading,
  uploadProgress,
  uploadedUrl,
  onFileSelect,
  onClear,
}: UploadAreaProps): React.ReactElement {
  return (
    <div
      onClick={() => fileInputRef.current?.click()}
      onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
      role="button"
      tabIndex={0}
      className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors ${
        isUploading || uploadedUrl
          ? "cursor-not-allowed opacity-50"
          : "hover:border-primary hover:bg-muted/50"
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_VIDEO_TYPES.join(",")}
        onChange={(e) => {
          void onFileSelect(e);
        }}
        className="hidden"
        disabled={isUploading || !!uploadedUrl}
      />
      {isUploading ? (
        <UploadProgress progress={uploadProgress} status="uploading" />
      ) : uploadedUrl ? (
        <div className="text-center">
          <Video className="text-success mx-auto mb-2 h-10 w-10" />
          <p className="text-sm font-medium">Video uploaded</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onClear();
            }}
            className="mt-2"
          >
            Upload different video
          </Button>
        </div>
      ) : (
        <>
          <Video className="text-muted-foreground mb-2 h-10 w-10" />
          <p className="text-sm">Click to upload or drag and drop</p>
          <p className="text-muted-foreground text-xs">MP4, MOV, or WebM up to 500MB</p>
        </>
      )}
    </div>
  );
}

interface VideoDetailsFormProps {
  formData: VideoFormData;
  setFormData: React.Dispatch<React.SetStateAction<VideoFormData>>;
}

function VideoDetailsForm({ formData, setFormData }: VideoDetailsFormProps): React.ReactElement {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => {
            setFormData((prev) => ({ ...prev, title: e.target.value }));
          }}
          placeholder="My Performance Reel"
          maxLength={200}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => {
            setFormData((prev) => ({ ...prev, description: e.target.value }));
          }}
          placeholder="Describe this video..."
          maxLength={2000}
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="category">Category *</Label>
          <Select
            value={formData.category}
            onValueChange={(v) => {
              setFormData((prev) => ({ ...prev, category: v as VideoSample["category"] }));
            }}
          >
            <SelectTrigger id="category">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {VIDEO_CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {VIDEO_CATEGORY_LABELS[cat]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="visibility">Visibility</Label>
          <Select
            value={formData.visibility}
            onValueChange={(v) => {
              setFormData((prev) => ({ ...prev, visibility: v as VideoSample["visibility"] }));
            }}
          >
            <SelectTrigger id="visibility">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {VIDEO_VISIBILITIES.map((vis) => (
                <SelectItem key={vis} value={vis}>
                  {VIDEO_VISIBILITY_LABELS[vis]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="tags">Tags</Label>
        <Input
          id="tags"
          value={formData.tags}
          onChange={(e) => {
            setFormData((prev) => ({ ...prev, tags: e.target.value }));
          }}
          placeholder="musical, comedy, drama (comma separated)"
          maxLength={500}
        />
      </div>
    </div>
  );
}

async function uploadWithProgress(
  formData: FormData,
  onProgress: (progress: number) => void
): Promise<{ id: string; url: string; key: string }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) {
        const progress = Math.round((event.loaded / event.total) * 100);
        onProgress(progress);
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText) as { id: string; url: string; key: string };
          resolve(response);
        } catch {
          reject(new Error("Invalid response"));
        }
      } else {
        try {
          const error = JSON.parse(xhr.responseText) as { error?: string };
          reject(new Error(error.error ?? "Upload failed"));
        } catch {
          reject(new Error("Upload failed"));
        }
      }
    });

    xhr.addEventListener("error", () => {
      reject(new Error("Network error"));
    });

    xhr.open("POST", "/api/upload/video");
    xhr.send(formData);
  });
}

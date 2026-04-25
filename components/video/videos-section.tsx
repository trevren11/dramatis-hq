"use client";

import * as React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Modal, ModalContent, ModalHeader, ModalTitle } from "@/components/ui/modal";
import { useToast } from "@/components/ui/use-toast";
import { VideoGallery } from "./video-gallery";
import { VideoForm, defaultVideoFormData } from "./video-form";
import type { VideoFormData } from "./video-form";
import { Video } from "lucide-react";
import type { VideoSample } from "@/lib/db/schema/video-samples";
import { MAX_VIDEO_SAMPLES } from "@/lib/db/schema/video-samples";
import {
  extractYouTubeId,
  extractVimeoId,
  getYouTubeThumbnailUrl,
} from "@/lib/validations/video-samples";

export interface VideosSectionProps {
  initialData: VideoSample[];
}

interface ResolvedSource {
  sourceType: VideoSample["sourceType"];
  thumbnailUrl: string | null;
}

function resolveSourceType(formData: VideoFormData, thumbnailUrl: string | null): ResolvedSource {
  if (formData.sourceType === "upload" || !formData.sourceUrl) {
    return { sourceType: formData.sourceType, thumbnailUrl };
  }

  const youtubeId = extractYouTubeId(formData.sourceUrl);
  if (youtubeId) {
    return { sourceType: "youtube", thumbnailUrl: getYouTubeThumbnailUrl(youtubeId) };
  }

  const vimeoId = extractVimeoId(formData.sourceUrl);
  if (vimeoId) {
    return { sourceType: "vimeo", thumbnailUrl };
  }

  return { sourceType: formData.sourceType, thumbnailUrl };
}

function buildCreateRequestBody(
  formData: VideoFormData,
  uploadedUrl: string | null,
  resolved: ResolvedSource
): Record<string, unknown> {
  const body: Record<string, unknown> = {
    title: formData.title,
    description: formData.description || null,
    category: formData.category,
    tags: formData.tags || null,
    visibility: formData.visibility,
    sourceType: uploadedUrl ? "upload" : resolved.sourceType,
  };

  if (uploadedUrl) {
    body.url = uploadedUrl;
  } else {
    body.sourceUrl = formData.sourceUrl;
    if (resolved.thumbnailUrl) {
      body.thumbnailUrl = resolved.thumbnailUrl;
    }
  }

  return body;
}

export function VideosSection({ initialData }: VideosSectionProps): React.ReactElement {
  const { toast } = useToast();
  const [videos, setVideos] = useState<VideoSample[]>(initialData);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingVideoId, setEditingVideoId] = useState<string | null>(null);
  const [initialFormData, setInitialFormData] = useState<VideoFormData>(defaultVideoFormData);

  const resetForm = (): void => {
    setInitialFormData(defaultVideoFormData);
    setIsEditMode(false);
    setEditingVideoId(null);
  };

  const openAddModal = (): void => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleEdit = (video: VideoSample): void => {
    setInitialFormData({
      title: video.title,
      description: video.description ?? "",
      category: video.category,
      tags: video.tags ?? "",
      visibility: video.visibility,
      sourceType: video.sourceType,
      sourceUrl: video.sourceUrl ?? "",
    });
    setEditingVideoId(video.id);
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (
    formData: VideoFormData,
    uploadedUrl: string | null,
    thumbnailUrl: string | null
  ): Promise<void> => {
    const resolved = resolveSourceType(formData, thumbnailUrl);

    if (isEditMode && editingVideoId) {
      await updateVideo(formData, editingVideoId);
    } else {
      await createVideo(formData, uploadedUrl, resolved);
    }

    setIsModalOpen(false);
    resetForm();
  };

  const updateVideo = async (formData: VideoFormData, videoId: string): Promise<void> => {
    const response = await fetch(`/api/talent/videos/${videoId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: formData.title,
        description: formData.description || null,
        category: formData.category,
        tags: formData.tags || null,
        visibility: formData.visibility,
      }),
    });

    if (!response.ok) {
      const errorData = (await response.json()) as { error?: string };
      throw new Error(errorData.error ?? "Failed to update video");
    }

    const data = (await response.json()) as { video: VideoSample };
    setVideos(videos.map((v) => (v.id === videoId ? data.video : v)));
    toast({ title: "Success", description: "Video updated" });
  };

  const createVideo = async (
    formData: VideoFormData,
    uploadedUrl: string | null,
    resolved: ResolvedSource
  ): Promise<void> => {
    const requestBody = buildCreateRequestBody(formData, uploadedUrl, resolved);

    const response = await fetch("/api/talent/videos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = (await response.json()) as { error?: string };
      throw new Error(errorData.error ?? "Failed to add video");
    }

    const data = (await response.json()) as { video: VideoSample };
    setVideos([...videos, data.video]);
    toast({ title: "Success", description: "Video added to your profile" });
  };

  const handleReorder = async (videoIds: string[]): Promise<void> => {
    try {
      const response = await fetch("/api/talent/videos", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoIds }),
      });

      if (!response.ok) {
        throw new Error("Failed to reorder videos");
      }

      const data = (await response.json()) as { videos: VideoSample[] };
      setVideos(data.videos);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to reorder videos",
      });
    }
  };

  const handleSetFeatured = async (videoId: string): Promise<void> => {
    try {
      const response = await fetch(`/api/talent/videos/${videoId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFeatured: true }),
      });

      if (!response.ok) {
        throw new Error("Failed to set featured video");
      }

      setVideos(
        videos.map((v) => ({
          ...v,
          isFeatured: v.id === videoId,
        }))
      );
      toast({ title: "Success", description: "Featured video updated" });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update",
      });
    }
  };

  const handleDelete = async (videoId: string): Promise<void> => {
    if (!confirm("Are you sure you want to delete this video?")) return;

    try {
      const response = await fetch(`/api/talent/videos/${videoId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete video");
      }

      setVideos(videos.filter((v) => v.id !== videoId));
      toast({ title: "Success", description: "Video deleted" });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete",
      });
    }
  };

  const canAddMore = videos.length < MAX_VIDEO_SAMPLES;

  return (
    <>
      <Card id="videos">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Video Samples</CardTitle>
              <CardDescription>
                Showcase your performance reels, singing clips, dance videos, and more.{" "}
                {videos.length}/{MAX_VIDEO_SAMPLES} videos
              </CardDescription>
            </div>
            <Button onClick={openAddModal} disabled={!canAddMore}>
              <Video className="mr-2 h-4 w-4" />
              Add Video
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <VideoGallery
            videos={videos}
            editable
            onReorder={handleReorder}
            onSetFeatured={handleSetFeatured}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />

          {videos.length === 0 && (
            <p className="text-muted-foreground py-4 text-center text-sm">
              No videos yet. Add performance reels, singing clips, or dance videos to showcase your
              talent.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Video Modal */}
      <Modal
        open={isModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsModalOpen(false);
            resetForm();
          }
        }}
      >
        <ModalContent className="max-w-2xl">
          <ModalHeader>
            <ModalTitle>{isEditMode ? "Edit Video" : "Add Video"}</ModalTitle>
          </ModalHeader>
          <VideoForm
            isEditMode={isEditMode}
            initialData={initialFormData}
            onSubmit={handleFormSubmit}
            onCancel={() => {
              setIsModalOpen(false);
              resetForm();
            }}
            showToast={toast}
          />
        </ModalContent>
      </Modal>
    </>
  );
}

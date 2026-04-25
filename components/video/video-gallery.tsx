"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Play,
  Star,
  Trash2,
  Edit,
  GripVertical,
  Video,
  ExternalLink,
  Eye,
  EyeOff,
  Lock,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { VideoSample } from "@/lib/db/schema/video-samples";
import { VIDEO_CATEGORY_LABELS, VIDEO_VISIBILITY_LABELS } from "@/lib/db/schema/video-samples";
import { Modal, ModalContent, ModalHeader, ModalTitle } from "@/components/ui/modal";
import { VideoPlayer } from "./video-player";
import {
  extractYouTubeId,
  extractVimeoId,
  getYouTubeEmbedUrl,
  getVimeoEmbedUrl,
} from "@/lib/validations/video-samples";

export interface VideoGalleryProps {
  videos: VideoSample[];
  onReorder?: (videoIds: string[]) => Promise<void>;
  onSetFeatured?: (videoId: string) => Promise<void>;
  onEdit?: (video: VideoSample) => void;
  onDelete?: (videoId: string) => Promise<void>;
  editable?: boolean;
  className?: string;
}

interface SortableVideoCardProps {
  video: VideoSample;
  onPlay: (video: VideoSample) => void;
  onSetFeatured?: (videoId: string) => Promise<void>;
  onEdit?: (video: VideoSample) => void;
  onDelete?: (videoId: string) => Promise<void>;
  editable?: boolean;
}

function getVisibilityIcon(visibility: VideoSample["visibility"]): React.ReactElement {
  switch (visibility) {
    case "private":
      return <Lock className="h-3 w-3" />;
    case "producers_only":
      return <EyeOff className="h-3 w-3" />;
    default:
      return <Eye className="h-3 w-3" />;
  }
}

function getSourceIcon(sourceType: VideoSample["sourceType"]): React.ReactElement | null {
  switch (sourceType) {
    case "youtube":
      return <Video className="h-3 w-3 text-red-500" />;
    case "vimeo":
      return <ExternalLink className="h-3 w-3 text-cyan-500" />;
    default:
      return null;
  }
}

interface VideoStatusOverlayProps {
  status: VideoSample["status"];
  error?: string | null;
}

function VideoStatusOverlay({ status, error }: VideoStatusOverlayProps): React.ReactElement | null {
  if (status === "processing") {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black/70">
        <div className="text-center text-white">
          <div className="border-primary mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" />
          <p className="text-sm">Processing...</p>
        </div>
      </div>
    );
  }
  if (status === "failed") {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black/70">
        <div className="text-center text-white">
          <p className="text-sm text-red-400">Processing failed</p>
          <p className="text-xs text-gray-400">{error}</p>
        </div>
      </div>
    );
  }
  return null;
}

function SortableVideoCard({
  video,
  onPlay,
  onSetFeatured,
  onEdit,
  onDelete,
  editable = false,
}: SortableVideoCardProps): React.ReactElement {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: video.id,
    disabled: !editable,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative aspect-video overflow-hidden rounded-lg bg-black",
        isDragging && "z-50 shadow-lg"
      )}
    >
      {/* Thumbnail */}
      {video.thumbnailUrl ? (
        <Image
          src={video.thumbnailUrl}
          alt={video.title}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
      ) : (
        <div className="bg-base-300 flex h-full w-full items-center justify-center">
          <Play className="text-base-content/50 h-12 w-12" />
        </div>
      )}

      {/* Badges overlay */}
      <div className="absolute top-2 left-2 flex flex-wrap gap-1">
        {video.isFeatured && (
          <Badge variant="default" className="bg-yellow-500 text-black">
            <Star className="mr-1 h-3 w-3" fill="currentColor" />
            Featured
          </Badge>
        )}
        <Badge variant="secondary" className="text-xs">
          {VIDEO_CATEGORY_LABELS[video.category]}
        </Badge>
        {video.sourceType !== "upload" && (
          <Badge variant="outline" className="bg-black/50 text-white">
            {getSourceIcon(video.sourceType)}
          </Badge>
        )}
      </div>

      {/* Visibility indicator */}
      <div className="absolute top-2 right-2">
        <Badge variant="outline" className="bg-black/50 text-white">
          {getVisibilityIcon(video.visibility)}
          <span className="ml-1 text-xs">{VIDEO_VISIBILITY_LABELS[video.visibility]}</span>
        </Badge>
      </div>

      {/* Status overlay */}
      <VideoStatusOverlay status={video.status} error={video.processingError} />

      {/* Hover overlay with controls */}
      <div
        className={cn(
          "absolute inset-0 flex flex-col justify-between bg-black/50 p-3 opacity-0 transition-opacity",
          "group-hover:opacity-100",
          video.status !== "ready" && "pointer-events-none"
        )}
      >
        {/* Top area - drag handle (if editable) */}
        {editable && (
          <div className="flex justify-start">
            <button
              {...attributes}
              {...listeners}
              className="cursor-grab touch-none rounded bg-white/20 p-1 hover:bg-white/30 active:cursor-grabbing"
            >
              <GripVertical className="h-4 w-4 text-white" />
            </button>
          </div>
        )}

        {/* Center - play button */}
        <div className="flex items-center justify-center">
          <button
            onClick={() => {
              onPlay(video);
            }}
            className="rounded-full bg-white/90 p-4 transition-transform hover:scale-110"
          >
            <Play className="h-8 w-8 text-black" fill="currentColor" />
          </button>
        </div>

        {/* Bottom area - title and actions */}
        <div className="space-y-2">
          <h4 className="truncate text-sm font-medium text-white">{video.title}</h4>
          {video.duration && (
            <p className="text-xs text-gray-300">
              {Math.floor(video.duration / 60)}:{String(video.duration % 60).padStart(2, "0")}
            </p>
          )}
          {editable && (
            <div className="flex gap-1">
              {!video.isFeatured && onSetFeatured && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    void onSetFeatured(video.id);
                  }}
                  className="h-7 px-2 text-xs"
                >
                  <Star className="mr-1 h-3 w-3" />
                  Feature
                </Button>
              )}
              {onEdit && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    onEdit(video);
                  }}
                  className="h-7 px-2 text-xs"
                >
                  <Edit className="mr-1 h-3 w-3" />
                  Edit
                </Button>
              )}
              {onDelete && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    void onDelete(video.id);
                  }}
                  className="h-7 px-2 text-xs"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function VideoGallery({
  videos,
  onReorder,
  onSetFeatured,
  onEdit,
  onDelete,
  editable = false,
  className,
}: VideoGalleryProps): React.ReactElement {
  const [items, setItems] = React.useState(videos);
  const [selectedVideo, setSelectedVideo] = React.useState<VideoSample | null>(null);
  const [isPlayerOpen, setIsPlayerOpen] = React.useState(false);

  // Update items when videos prop changes
  React.useEffect(() => {
    setItems(videos);
  }, [videos]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent): Promise<void> => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);
      const newItems = arrayMove(items, oldIndex, newIndex);
      setItems(newItems);

      if (onReorder) {
        await onReorder(newItems.map((item) => item.id));
      }
    }
  };

  const handlePlayVideo = (video: VideoSample): void => {
    setSelectedVideo(video);
    setIsPlayerOpen(true);
  };

  const getVideoSrc = (video: VideoSample): string => {
    if (video.sourceType === "youtube" && video.sourceUrl) {
      const videoId = extractYouTubeId(video.sourceUrl);
      return videoId ? getYouTubeEmbedUrl(videoId) : video.sourceUrl;
    }
    if (video.sourceType === "vimeo" && video.sourceUrl) {
      const videoId = extractVimeoId(video.sourceUrl);
      return videoId ? getVimeoEmbedUrl(videoId) : video.sourceUrl;
    }
    return video.processedUrl ?? video.sourceUrl ?? "";
  };

  if (items.length === 0) {
    return (
      <div className={cn("py-8 text-center", className)}>
        <Play className="text-base-content/30 mx-auto mb-3 h-12 w-12" />
        <p className="text-base-content/50 text-sm">No videos yet</p>
      </div>
    );
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={(event) => {
          void handleDragEnd(event);
        }}
      >
        <SortableContext items={items.map((v) => v.id)} strategy={rectSortingStrategy}>
          <div className={cn("grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3", className)}>
            {items.map((video) => (
              <SortableVideoCard
                key={video.id}
                video={video}
                onPlay={handlePlayVideo}
                onSetFeatured={onSetFeatured}
                onEdit={onEdit}
                onDelete={onDelete}
                editable={editable}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Video Player Modal */}
      <Modal open={isPlayerOpen} onOpenChange={setIsPlayerOpen}>
        <ModalContent className="max-w-4xl">
          <ModalHeader>
            <ModalTitle>{selectedVideo?.title ?? "Video"}</ModalTitle>
          </ModalHeader>
          {selectedVideo && (
            <div className="space-y-4">
              {selectedVideo.sourceType === "upload" ? (
                <VideoPlayer
                  src={getVideoSrc(selectedVideo)}
                  poster={selectedVideo.thumbnailUrl ?? undefined}
                  title={selectedVideo.title}
                  className="aspect-video w-full"
                />
              ) : (
                <div className="aspect-video w-full overflow-hidden rounded-lg">
                  <iframe
                    src={getVideoSrc(selectedVideo)}
                    title={selectedVideo.title}
                    className="h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              )}
              {selectedVideo.description && (
                <p className="text-base-content/70 text-sm">{selectedVideo.description}</p>
              )}
              {selectedVideo.tags && (
                <div className="flex flex-wrap gap-1">
                  {selectedVideo.tags.split(",").map((tag, i) => (
                    <Badge key={i} variant="outline">
                      {tag.trim()}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}

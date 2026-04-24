"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Upload, X, Star, StarOff, Trash2, ImagePlus, Loader2 } from "lucide-react";
import { MAX_PRODUCTION_PHOTOS } from "@/lib/db/schema/production-photos";
import type { ProductionPhoto } from "@/lib/db/schema/production-photos";

interface PhotoGalleryProps {
  photos: ProductionPhoto[];
  onRefresh: () => Promise<void>;
  isLoading?: boolean;
}

interface EditingPhoto {
  id: string;
  title: string;
  description: string;
  productionName: string;
}

interface PresignedUrlResponse {
  uploadUrl: string;
  fileUrl: string;
}

interface ErrorResponse {
  error?: string;
}

export function PhotoGallery({
  photos,
  onRefresh,
  isLoading = false,
}: PhotoGalleryProps): React.ReactElement {
  const [uploading, setUploading] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState<EditingPhoto | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      if (photos.length + files.length > MAX_PRODUCTION_PHOTOS) {
        setError(
          `Maximum ${String(MAX_PRODUCTION_PHOTOS)} photos allowed. You have ${String(photos.length)}.`
        );
        return;
      }

      setUploading(true);
      setError(null);

      try {
        const uploadedPhotos: {
          url: string;
          originalFilename: string;
          mimeType: string;
          fileSize: number;
        }[] = [];

        for (const file of Array.from(files)) {
          const presignRes = await fetch("/api/upload/presigned", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              filename: file.name,
              contentType: file.type,
              folder: "production-photos",
            }),
          });

          if (!presignRes.ok) {
            throw new Error("Failed to get upload URL");
          }

          const presignData = (await presignRes.json()) as PresignedUrlResponse;

          const uploadRes = await fetch(presignData.uploadUrl, {
            method: "PUT",
            headers: { "Content-Type": file.type },
            body: file,
          });

          if (!uploadRes.ok) {
            throw new Error("Failed to upload file");
          }

          uploadedPhotos.push({
            url: presignData.fileUrl,
            originalFilename: file.name,
            mimeType: file.type,
            fileSize: file.size,
          });
        }

        const saveRes = await fetch("/api/company/photos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            uploadedPhotos.length === 1 ? uploadedPhotos[0] : { photos: uploadedPhotos }
          ),
        });

        if (!saveRes.ok) {
          const errorData = (await saveRes.json()) as ErrorResponse;
          throw new Error(errorData.error ?? "Failed to save photos");
        }

        await onRefresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to upload photos");
      } finally {
        setUploading(false);
        e.target.value = "";
      }
    },
    [photos.length, onRefresh]
  );

  const handleSetFeatured = useCallback(
    async (photoId: string): Promise<void> => {
      try {
        const res = await fetch(`/api/company/photos/${photoId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isFeatured: true }),
        });

        if (!res.ok) {
          throw new Error("Failed to set featured photo");
        }

        await onRefresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update photo");
      }
    },
    [onRefresh]
  );

  const handleDelete = useCallback(
    async (photoId: string): Promise<void> => {
      if (!confirm("Are you sure you want to delete this photo?")) return;

      try {
        const res = await fetch(`/api/company/photos/${photoId}`, {
          method: "DELETE",
        });

        if (!res.ok) {
          throw new Error("Failed to delete photo");
        }

        await onRefresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete photo");
      }
    },
    [onRefresh]
  );

  const handleEditSave = useCallback(async (): Promise<void> => {
    if (!editingPhoto) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/company/photos/${editingPhoto.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editingPhoto.title || null,
          description: editingPhoto.description || null,
          productionName: editingPhoto.productionName || null,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to update photo");
      }

      setEditingPhoto(null);
      await onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update photo");
    } finally {
      setSaving(false);
    }
  }, [editingPhoto, onRefresh]);

  const onFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>): void => {
      void handleFileChange(e);
    },
    [handleFileChange]
  );

  const onSetFeaturedClick = useCallback(
    (photoId: string) => (): void => {
      void handleSetFeatured(photoId);
    },
    [handleSetFeatured]
  );

  const onDeleteClick = useCallback(
    (photoId: string) => (): void => {
      void handleDelete(photoId);
    },
    [handleDelete]
  );

  const onEditSaveClick = useCallback((): void => {
    void handleEditSave();
  }, [handleEditSave]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <ImagePlus className="h-5 w-5" />
          Production Photos
        </CardTitle>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-sm">
            {photos.length}/{MAX_PRODUCTION_PHOTOS}
          </span>
          <label
            className={`cursor-pointer ${
              photos.length >= MAX_PRODUCTION_PHOTOS || uploading
                ? "pointer-events-none opacity-50"
                : ""
            }`}
          >
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={onFileInputChange}
              className="sr-only"
              disabled={photos.length >= MAX_PRODUCTION_PHOTOS || uploading}
            />
            <Button variant="outline" size="sm" asChild disabled={uploading}>
              <span>
                {uploading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="mr-2 h-4 w-4" />
                )}
                Upload Photos
              </span>
            </Button>
          </label>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="bg-destructive/10 text-destructive mb-4 rounded-lg p-3 text-sm">
            {error}
            <button
              onClick={() => {
                setError(null);
              }}
              className="float-right"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
          </div>
        ) : photos.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed py-12 text-center">
            <ImagePlus className="text-muted-foreground mx-auto h-12 w-12" />
            <p className="text-muted-foreground mt-4">No photos yet</p>
            <p className="text-muted-foreground text-sm">
              Upload photos from your productions to showcase your work
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="bg-muted group relative aspect-[4/3] overflow-hidden rounded-lg border"
              >
                <Image
                  src={photo.thumbnailUrl ?? photo.url}
                  alt={photo.title ?? "Production photo"}
                  fill
                  className="object-cover transition-transform group-hover:scale-105"
                />

                {photo.isFeatured && (
                  <div className="absolute top-2 left-2">
                    <Badge className="bg-yellow-500 text-yellow-950">
                      <Star className="mr-1 h-3 w-3" />
                      Featured
                    </Badge>
                  </div>
                )}

                <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setEditingPhoto({
                        id: photo.id,
                        title: photo.title ?? "",
                        description: photo.description ?? "",
                        productionName: photo.productionName ?? "",
                      });
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    size="icon"
                    variant="secondary"
                    onClick={onSetFeaturedClick(photo.id)}
                    title={photo.isFeatured ? "Featured" : "Set as featured"}
                    disabled={photo.isFeatured}
                  >
                    {photo.isFeatured ? (
                      <Star className="h-4 w-4 fill-current" />
                    ) : (
                      <StarOff className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    size="icon"
                    variant="destructive"
                    onClick={onDeleteClick(photo.id)}
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {(photo.title ?? photo.productionName) && (
                  <div className="absolute right-0 bottom-0 left-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                    {photo.title && (
                      <p className="truncate text-sm font-medium text-white">{photo.title}</p>
                    )}
                    {photo.productionName && (
                      <p className="truncate text-xs text-white/70">{photo.productionName}</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {editingPhoto && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-background w-full max-w-md rounded-lg p-6">
              <h3 className="mb-4 text-lg font-semibold">Edit Photo Details</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="photoTitle">Title</Label>
                  <Input
                    id="photoTitle"
                    value={editingPhoto.title}
                    onChange={(e) => {
                      setEditingPhoto({ ...editingPhoto, title: e.target.value });
                    }}
                    placeholder="Photo title"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="productionName">Production Name</Label>
                  <Input
                    id="productionName"
                    value={editingPhoto.productionName}
                    onChange={(e) => {
                      setEditingPhoto({
                        ...editingPhoto,
                        productionName: e.target.value,
                      });
                    }}
                    placeholder="e.g., Romeo & Juliet (2024)"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="photoDescription">Description</Label>
                  <textarea
                    id="photoDescription"
                    value={editingPhoto.description}
                    onChange={(e) => {
                      setEditingPhoto({
                        ...editingPhoto,
                        description: e.target.value,
                      });
                    }}
                    placeholder="Brief description of the photo"
                    className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                    maxLength={1000}
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditingPhoto(null);
                  }}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button onClick={onEditSaveClick} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save"
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

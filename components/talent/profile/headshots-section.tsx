"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Star, Trash2, Loader2, ImagePlus, CheckCircle2 } from "lucide-react";
import Image from "next/image";
import { MAX_HEADSHOTS, ALLOWED_IMAGE_TYPES, MAX_FILE_SIZE } from "@/lib/db/schema/headshots";
import type { Headshot } from "@/lib/db/schema/headshots";

interface HeadshotsSectionProps {
  initialData: Headshot[];
}

export function HeadshotsSection({ initialData }: HeadshotsSectionProps): React.ReactElement {
  const { toast } = useToast();
  const [headshots, setHeadshots] = useState<Headshot[]>(initialData);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = MAX_HEADSHOTS - headshots.length;
    if (remainingSlots <= 0) {
      toast({
        variant: "destructive",
        title: "Limit reached",
        description: `Maximum of ${String(MAX_HEADSHOTS)} headshots allowed`,
      });
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remainingSlots);

    for (const file of filesToUpload) {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        toast({
          variant: "destructive",
          title: "Invalid file type",
          description: `${file.name} is not a supported image type`,
        });
        continue;
      }

      if (file.size > MAX_FILE_SIZE) {
        toast({
          variant: "destructive",
          title: "File too large",
          description: `${file.name} exceeds the 10MB limit`,
        });
        continue;
      }

      await uploadFile(file);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const uploadFile = async (file: File): Promise<void> => {
    setIsUploading(true);
    try {
      // First, upload the file to storage
      const formData = new FormData();
      formData.append("file", file);

      const uploadResponse = await fetch("/api/upload/image", {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorData = (await uploadResponse.json()) as { error?: string };
        throw new Error(errorData.error ?? "Failed to upload image");
      }

      const uploadData = (await uploadResponse.json()) as {
        url: string;
        thumbnailUrl?: string;
        width?: number;
        height?: number;
      };

      // Then create the headshot record with the real URL
      const response = await fetch("/api/talent/headshots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: uploadData.url,
          thumbnailUrl: uploadData.thumbnailUrl,
          originalFilename: file.name,
          mimeType: "image/webp", // Processed images are converted to WebP
          fileSize: file.size,
          width: uploadData.width,
          height: uploadData.height,
        }),
      });

      if (!response.ok) {
        const errorData = (await response.json()) as { error?: string };
        throw new Error(errorData.error ?? "Failed to save headshot");
      }

      const data = (await response.json()) as { headshot: Headshot };
      setHeadshots([...headshots, data.headshot]);
      toast({ title: "Success", description: "Headshot uploaded" });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload headshot",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const setPrimary = async (id: string): Promise<void> => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/talent/headshots/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPrimary: true }),
      });

      if (!response.ok) {
        const errorData = (await response.json()) as { error?: string };
        throw new Error(errorData.error ?? "Failed to update");
      }

      setHeadshots(
        headshots.map((h) => ({
          ...h,
          isPrimary: h.id === id,
        }))
      );
      toast({ title: "Success", description: "Primary headshot updated" });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteHeadshot = async (id: string): Promise<void> => {
    if (!confirm("Are you sure you want to delete this headshot?")) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/talent/headshots/${id}`, { method: "DELETE" });

      if (!response.ok) {
        const errorData = (await response.json()) as { error?: string };
        throw new Error(errorData.error ?? "Failed to delete");
      }

      setHeadshots(headshots.filter((h) => h.id !== id));
      toast({ title: "Success", description: "Headshot deleted" });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card id="headshots">
      <CardHeader>
        <CardTitle>Headshots</CardTitle>
        <CardDescription>
          Upload up to {MAX_HEADSHOTS} headshots. Your primary headshot will be shown first in
          search results.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Area */}
        <div
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors ${
            headshots.length >= MAX_HEADSHOTS
              ? "cursor-not-allowed opacity-50"
              : "hover:border-primary hover:bg-muted/50"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={ALLOWED_IMAGE_TYPES.join(",")}
            multiple
            onChange={(e) => {
              void handleFileSelect(e);
            }}
            className="hidden"
            disabled={headshots.length >= MAX_HEADSHOTS || isUploading}
          />
          {isUploading ? (
            <Loader2 className="text-muted-foreground h-10 w-10 animate-spin" />
          ) : (
            <ImagePlus className="text-muted-foreground h-10 w-10" />
          )}
          <p className="text-muted-foreground mt-2 text-sm">
            {headshots.length >= MAX_HEADSHOTS
              ? "Maximum headshots reached"
              : "Click to upload or drag and drop"}
          </p>
          <p className="text-muted-foreground text-xs">
            {headshots.length}/{MAX_HEADSHOTS} • JPG, PNG, or WebP up to 10MB
          </p>
        </div>

        {/* Headshots Grid */}
        {headshots.length > 0 && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {headshots.map((headshot) => (
              <div
                key={headshot.id}
                className="group bg-muted relative aspect-[3/4] overflow-hidden rounded-lg"
              >
                <Image
                  src={headshot.thumbnailUrl ?? headshot.url}
                  alt="Headshot"
                  fill
                  className="object-cover"
                  unoptimized
                />
                {headshot.isPrimary && (
                  <div className="bg-primary text-primary-foreground absolute top-2 left-2 flex items-center gap-1 rounded-full px-2 py-1 text-xs">
                    <CheckCircle2 className="h-3 w-3" />
                    Primary
                  </div>
                )}
                <div className="absolute inset-0 flex items-end justify-center gap-2 bg-black/50 p-2 opacity-0 transition-opacity group-hover:opacity-100">
                  {!headshot.isPrimary && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        void setPrimary(headshot.id);
                      }}
                      disabled={isLoading}
                    >
                      <Star className="mr-1 h-3 w-3" />
                      Set Primary
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      void deleteHeadshot(headshot.id);
                    }}
                    disabled={isLoading}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {headshots.length === 0 && (
          <p className="text-muted-foreground py-4 text-center text-sm">
            No headshots uploaded yet. Your headshots are essential for getting noticed by
            producers.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

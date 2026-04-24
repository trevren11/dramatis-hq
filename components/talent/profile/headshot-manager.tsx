"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
} from "@/components/ui/modal";
import { Loader2, Plus, Trash2, Star, Upload, Image as ImageIcon } from "lucide-react";
import type { Headshot } from "@/lib/db/schema";
import { MAX_HEADSHOTS, ALLOWED_IMAGE_TYPES, MAX_FILE_SIZE } from "@/lib/db/schema/headshots";

interface HeadshotManagerProps {
  initialHeadshots: Headshot[];
}

export function HeadshotManager({ initialHeadshots }: HeadshotManagerProps): React.ReactElement {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [headshots, setHeadshots] = useState(initialHeadshots);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      toast({
        variant: "destructive",
        title: "Invalid file type",
        description: "Please upload a JPEG, PNG, or WebP image.",
      });
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: "Please upload an image smaller than 10MB.",
      });
      return;
    }

    if (headshots.length >= MAX_HEADSHOTS) {
      toast({
        variant: "destructive",
        title: "Maximum headshots reached",
        description: `You can only have up to ${MAX_HEADSHOTS} headshots.`,
      });
      return;
    }

    setIsUploading(true);

    try {
      const imageUrl = URL.createObjectURL(file);

      const response = await fetch("/api/talent/headshots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: imageUrl,
          originalFilename: file.name,
          mimeType: file.type,
          fileSize: file.size,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error ?? "Failed to upload headshot");
      }

      const data = await response.json();
      setHeadshots((prev) => [...prev, data.headshot]);
      toast({ title: "Headshot uploaded" });
      router.refresh();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload headshot",
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const setPrimary = (id: string): void => {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/talent/headshots/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isPrimary: true }),
        });

        if (!response.ok) {
          throw new Error("Failed to set primary headshot");
        }

        setHeadshots((prev) =>
          prev.map((h) => ({
            ...h,
            isPrimary: h.id === id,
          }))
        );
        toast({ title: "Primary headshot updated" });
        router.refresh();
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to update",
        });
      }
    });
  };

  const handleDelete = (): void => {
    if (!deleteId) return;

    startTransition(async () => {
      try {
        const response = await fetch(`/api/talent/headshots/${deleteId}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          throw new Error("Failed to delete headshot");
        }

        setHeadshots((prev) => prev.filter((h) => h.id !== deleteId));
        setDeleteId(null);
        toast({ title: "Headshot deleted" });
        router.refresh();
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to delete",
        });
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Headshots</h1>
          <p className="text-muted-foreground text-sm">
            {headshots.length} / {MAX_HEADSHOTS} photos uploaded
          </p>
        </div>
        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading || headshots.length >= MAX_HEADSHOTS}
        >
          {isUploading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Upload className="mr-2 h-4 w-4" />
          )}
          Upload Photo
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept={ALLOWED_IMAGE_TYPES.join(",")}
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {headshots.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ImageIcon className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
            <p className="text-muted-foreground mb-4">No headshots uploaded yet</p>
            <Button onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
              <Plus className="mr-2 h-4 w-4" />
              Upload Your First Headshot
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {headshots.map((headshot) => (
            <Card key={headshot.id} className="overflow-hidden">
              <div className="relative aspect-[3/4]">
                <img
                  src={headshot.thumbnailUrl ?? headshot.url}
                  alt="Headshot"
                  className="h-full w-full object-cover"
                />
                {headshot.isPrimary && (
                  <div className="bg-primary text-primary-foreground absolute top-2 left-2 flex items-center gap-1 rounded-full px-2 py-1 text-xs">
                    <Star className="h-3 w-3" />
                    Primary
                  </div>
                )}
              </div>
              <CardContent className="flex justify-between p-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setPrimary(headshot.id); }}
                  disabled={headshot.isPrimary || isPending}
                >
                  <Star className="mr-1 h-4 w-4" />
                  {headshot.isPrimary ? "Primary" : "Set Primary"}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => { setDeleteId(headshot.id); }}
                  disabled={isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Modal open={!!deleteId} onOpenChange={() => { setDeleteId(null); }}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Delete Headshot</ModalTitle>
            <ModalDescription>
              Are you sure you want to delete this headshot? This action cannot be undone.
            </ModalDescription>
          </ModalHeader>
          <ModalFooter>
            <Button variant="outline" onClick={() => { setDeleteId(null); }}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}

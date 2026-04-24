"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { Loader2, Copy, Trash2 } from "lucide-react";
import type { Show } from "@/lib/db/schema/shows";
import { SHOW_TYPE_OPTIONS, SHOW_STATUS_OPTIONS } from "@/lib/db/schema/shows";
import { UNION_STATUS_OPTIONS } from "@/lib/db/schema/producer-profiles";
import type { ShowUpdate } from "@/lib/validations/shows";

interface ShowSettingsProps {
  show: Show;
}

function formatDateForInput(date: Date | null): string {
  if (!date) return "";
  const d = new Date(date);
  return d.toISOString().split("T")[0] ?? "";
}

export function ShowSettings({ show }: ShowSettingsProps): React.ReactElement {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);

  const [formData, setFormData] = useState<ShowUpdate>({
    title: show.title,
    type: show.type ?? "play",
    description: show.description,
    venue: show.venue,
    rehearsalStart: show.rehearsalStart,
    performanceStart: show.performanceStart,
    performanceEnd: show.performanceEnd,
    unionStatus: show.unionStatus ?? "both",
    status: show.status ?? "planning",
    isPublic: show.isPublic ?? true,
  });

  const handleSave = (): void => {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/shows/${show.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        if (!response.ok) {
          throw new Error("Failed to save");
        }

        toast({
          title: "Saved",
          description: "Show settings have been updated",
        });
        router.refresh();
      } catch {
        toast({
          title: "Error",
          description: "Failed to save changes",
          variant: "destructive",
        });
      }
    });
  };

  const handleDuplicate = async (): Promise<void> => {
    setIsDuplicating(true);
    try {
      const response = await fetch(`/api/shows/${show.id}/duplicate`, { method: "POST" });
      if (!response.ok) throw new Error("Failed to duplicate");

      const data = (await response.json()) as { show: Show };
      toast({
        title: "Show duplicated",
        description: `Created "${data.show.title}"`,
      });
      router.push(`/producer/shows/${data.show.id}`);
    } catch {
      toast({
        title: "Error",
        description: "Failed to duplicate show",
        variant: "destructive",
      });
    } finally {
      setIsDuplicating(false);
    }
  };

  const handleDelete = async (): Promise<void> => {
    if (!confirm("Are you sure you want to delete this show? This action cannot be undone.")) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/shows/${show.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete");

      toast({
        title: "Show deleted",
        description: "The show has been deleted",
      });
      router.push("/producer/shows");
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete show",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>Update the core details of your production</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title ?? ""}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <select
                id="type"
                value={formData.type ?? "play"}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value as ShowUpdate["type"] })
                }
                className="border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm"
              >
                {SHOW_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                value={formData.status ?? "planning"}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value as ShowUpdate["status"] })
                }
                className="border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm"
              >
                {SHOW_STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              value={formData.description ?? ""}
              onChange={(e) => setFormData({ ...formData, description: e.target.value || null })}
              className="border-input bg-background flex min-h-[100px] w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dates & Venue</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="venue">Venue</Label>
            <Input
              id="venue"
              value={formData.venue ?? ""}
              onChange={(e) => setFormData({ ...formData, venue: e.target.value || null })}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="rehearsalStart">Rehearsal Start</Label>
              <Input
                id="rehearsalStart"
                type="date"
                value={formatDateForInput(formData.rehearsalStart ?? null)}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    rehearsalStart: e.target.value ? new Date(e.target.value) : null,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="performanceStart">Performance Start</Label>
              <Input
                id="performanceStart"
                type="date"
                value={formatDateForInput(formData.performanceStart ?? null)}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    performanceStart: e.target.value ? new Date(e.target.value) : null,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="performanceEnd">Performance End</Label>
              <Input
                id="performanceEnd"
                type="date"
                value={formatDateForInput(formData.performanceEnd ?? null)}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    performanceEnd: e.target.value ? new Date(e.target.value) : null,
                  })
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="unionStatus">Union Status</Label>
            <select
              id="unionStatus"
              value={formData.unionStatus ?? "both"}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  unionStatus: e.target.value as ShowUpdate["unionStatus"],
                })
              }
              className="border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm"
            >
              {UNION_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isPublic"
              checked={formData.isPublic ?? true}
              onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="isPublic">Public production (visible in search)</Label>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button onClick={handleSave} disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
      </div>

      <Card className="border-destructive/20">
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Duplicate Production</p>
              <p className="text-muted-foreground text-sm">Create a copy with all roles</p>
            </div>
            <Button variant="outline" onClick={handleDuplicate} disabled={isDuplicating}>
              {isDuplicating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Copy className="mr-2 h-4 w-4" />
              )}
              Duplicate
            </Button>
          </div>

          <div className="border-t pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-destructive">Delete Production</p>
                <p className="text-muted-foreground text-sm">
                  Permanently delete this production and all its roles
                </p>
              </div>
              <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-4 w-4" />
                )}
                Delete
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

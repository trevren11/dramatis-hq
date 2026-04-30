"use client";

import { useState, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Copy, Trash2 } from "lucide-react";
import type { Show } from "@/lib/db/schema/shows";
import { SHOW_TYPE_OPTIONS, SHOW_STATUS_OPTIONS } from "@/lib/db/schema/shows";
import { UNION_STATUS_OPTIONS } from "@/lib/db/schema/producer-profiles";

interface ShowSettingsProps {
  show: Show;
}

interface FormData {
  title: string;
  type: string;
  description: string | null;
  venue: string | null;
  rehearsalStart: Date | null;
  rehearsalEnd: Date | null;
  performanceStart: Date | null;
  performanceEnd: Date | null;
  unionStatus: string;
  status: string;
  isPublic: boolean;
}

function formatDateForInput(date: Date | null | undefined): string {
  if (!date) return "";
  const d = new Date(date);
  return d.toISOString().split("T")[0] ?? "";
}

function BasicInfoCard({
  formData,
  onFormChange,
}: {
  formData: FormData;
  onFormChange: (updates: Partial<FormData>) => void;
}): React.ReactElement {
  return (
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
            value={formData.title}
            onChange={(e) => {
              onFormChange({ title: e.target.value });
            }}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <select
              id="type"
              value={formData.type}
              onChange={(e) => {
                onFormChange({ type: e.target.value });
              }}
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
              value={formData.status}
              onChange={(e) => {
                onFormChange({ status: e.target.value });
              }}
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
            onChange={(e) => {
              onFormChange({ description: e.target.value || null });
            }}
            className="border-input bg-background flex min-h-[100px] w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>
      </CardContent>
    </Card>
  );
}

function DatesVenueCard({
  formData,
  onFormChange,
}: {
  formData: FormData;
  onFormChange: (updates: Partial<FormData>) => void;
}): React.ReactElement {
  return (
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
            onChange={(e) => {
              onFormChange({ venue: e.target.value || null });
            }}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="rehearsalStart">Rehearsal Start</Label>
            <Input
              id="rehearsalStart"
              type="date"
              value={formatDateForInput(formData.rehearsalStart)}
              onChange={(e) => {
                onFormChange({
                  rehearsalStart: e.target.value ? new Date(e.target.value) : null,
                });
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rehearsalEnd">Rehearsal End</Label>
            <Input
              id="rehearsalEnd"
              type="date"
              value={formatDateForInput(formData.rehearsalEnd)}
              onChange={(e) => {
                onFormChange({
                  rehearsalEnd: e.target.value ? new Date(e.target.value) : null,
                });
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="performanceStart">Performance Start</Label>
            <Input
              id="performanceStart"
              type="date"
              value={formatDateForInput(formData.performanceStart)}
              onChange={(e) => {
                onFormChange({
                  performanceStart: e.target.value ? new Date(e.target.value) : null,
                });
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="performanceEnd">Performance End</Label>
            <Input
              id="performanceEnd"
              type="date"
              value={formatDateForInput(formData.performanceEnd)}
              onChange={(e) => {
                onFormChange({
                  performanceEnd: e.target.value ? new Date(e.target.value) : null,
                });
              }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SettingsCard({
  formData,
  onFormChange,
}: {
  formData: FormData;
  onFormChange: (updates: Partial<FormData>) => void;
}): React.ReactElement {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="unionStatus">Union Status</Label>
          <select
            id="unionStatus"
            value={formData.unionStatus}
            onChange={(e) => {
              onFormChange({ unionStatus: e.target.value });
            }}
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
            checked={formData.isPublic}
            onChange={(e) => {
              onFormChange({ isPublic: e.target.checked });
            }}
            className="h-4 w-4 rounded border-gray-300"
          />
          <Label htmlFor="isPublic">Public production (visible in search)</Label>
        </div>
      </CardContent>
    </Card>
  );
}

function ActionsCard({
  isDuplicating,
  isDeleting,
  onDuplicate,
  onDelete,
}: {
  isDuplicating: boolean;
  isDeleting: boolean;
  onDuplicate: () => void;
  onDelete: () => void;
}): React.ReactElement {
  return (
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
          <Button variant="outline" onClick={onDuplicate} disabled={isDuplicating}>
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
              <p className="text-destructive font-medium">Delete Production</p>
              <p className="text-muted-foreground text-sm">
                Permanently delete this production and all its roles
              </p>
            </div>
            <Button variant="destructive" onClick={onDelete} disabled={isDeleting}>
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
  );
}

export function ShowSettings({ show }: ShowSettingsProps): React.ReactElement {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    title: show.title,
    type: show.type ?? "play",
    description: show.description,
    venue: show.venue,
    rehearsalStart: show.rehearsalStart,
    rehearsalEnd: show.rehearsalEnd,
    performanceStart: show.performanceStart,
    performanceEnd: show.performanceEnd,
    unionStatus: show.unionStatus ?? "both",
    status: show.status ?? "planning",
    isPublic: show.isPublic ?? true,
  });

  const handleFormChange = useCallback((updates: Partial<FormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  }, []);

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

  const handleDuplicate = useCallback((): void => {
    setIsDuplicating(true);
    void (async () => {
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
    })();
  }, [show.id, toast, router]);

  const handleDelete = useCallback((): void => {
    if (!confirm("Are you sure you want to delete this show? This action cannot be undone.")) {
      return;
    }

    setIsDeleting(true);
    void (async () => {
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
    })();
  }, [show.id, toast, router]);

  return (
    <div className="space-y-6">
      <BasicInfoCard formData={formData} onFormChange={handleFormChange} />
      <DatesVenueCard formData={formData} onFormChange={handleFormChange} />
      <SettingsCard formData={formData} onFormChange={handleFormChange} />

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

      <ActionsCard
        isDuplicating={isDuplicating}
        isDeleting={isDeleting}
        onDuplicate={handleDuplicate}
        onDelete={handleDelete}
      />
    </div>
  );
}

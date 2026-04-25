"use client";

import { useState, useId } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalFooter } from "@/components/ui/modal";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Trash2 } from "lucide-react";
import {
  AVAILABILITY_STATUSES,
  AVAILABILITY_STATUS_LABELS,
  AVAILABILITY_STATUS_COLORS,
  RECURRENCE_PATTERNS,
  RECURRENCE_PATTERN_LABELS,
} from "@/lib/db/schema/calendar";

interface CalendarEventFormProps {
  mode: "create" | "edit";
  initialData?: {
    id?: string;
    title?: string;
    startDate: Date;
    endDate: Date;
    status: "available" | "unavailable" | "tentative";
    notes?: string;
    isAllDay?: boolean;
    recurrencePattern?: string;
    recurrenceEndDate?: Date;
  };
  onClose: () => void;
  onSaved: () => void;
  onDeleted?: () => void;
}

interface FormData {
  title: string;
  startDate: string;
  endDate: string;
  status: "available" | "unavailable" | "tentative";
  notes: string;
  isAllDay: boolean;
  recurrencePattern: string;
  recurrenceEndDate: string;
}

function formatDateForInput(date: Date): string {
  const parts = date.toISOString().split("T");
  return parts[0] ?? "";
}

// eslint-disable-next-line complexity
export function CalendarEventForm({
  mode,
  initialData,
  onClose,
  onSaved,
  onDeleted,
}: CalendarEventFormProps): React.ReactElement {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    title: initialData?.title ?? "",
    startDate: initialData?.startDate ? formatDateForInput(initialData.startDate) : "",
    endDate: initialData?.endDate ? formatDateForInput(initialData.endDate) : "",
    status: initialData?.status ?? "available",
    notes: initialData?.notes ?? "",
    isAllDay: initialData?.isAllDay ?? true,
    recurrencePattern: initialData?.recurrencePattern ?? "none",
    recurrenceEndDate: initialData?.recurrenceEndDate
      ? formatDateForInput(initialData.recurrenceEndDate)
      : "",
  });

  // Form field IDs for accessibility
  const statusId = useId();
  const titleId = useId();
  const startDateId = useId();
  const endDateId = useId();
  const recurrenceId = useId();
  const recurrenceEndId = useId();
  const notesId = useId();

  // eslint-disable-next-line complexity
  const handleSubmit = async (): Promise<void> => {
    if (!formData.startDate || !formData.endDate) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Start and end dates are required",
      });
      return;
    }

    setIsLoading(true);
    try {
      const url =
        mode === "edit" && initialData?.id
          ? `/api/calendar/availability/${initialData.id}`
          : "/api/calendar/availability";

      const response = await fetch(url, {
        method: mode === "edit" ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title || null,
          startDate: new Date(formData.startDate),
          endDate: new Date(formData.endDate),
          status: formData.status,
          notes: formData.notes || null,
          isAllDay: formData.isAllDay,
          recurrencePattern: formData.recurrencePattern,
          recurrenceEndDate:
            formData.recurrencePattern !== "none" && formData.recurrenceEndDate
              ? new Date(formData.recurrenceEndDate)
              : null,
        }),
      });

      if (!response.ok) {
        const errorData = (await response.json()) as { error?: string };
        throw new Error(errorData.error ?? "Failed to save");
      }

      const data = (await response.json()) as { hasConflict?: boolean };

      if (data.hasConflict) {
        toast({
          title: "Saved with Warning",
          description: "This availability overlaps with an existing entry",
        });
      } else {
        toast({
          title: "Success",
          description: mode === "edit" ? "Availability updated" : "Availability added",
        });
      }

      onSaved();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (): Promise<void> => {
    if (!initialData?.id) return;
    if (!confirm("Are you sure you want to delete this availability entry?")) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/calendar/availability/${initialData.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = (await response.json()) as { error?: string };
        throw new Error(errorData.error ?? "Failed to delete");
      }

      toast({ title: "Success", description: "Availability deleted" });
      onDeleted?.();
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
    <Modal
      open={true}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <ModalContent>
        <ModalHeader>
          <ModalTitle>{mode === "edit" ? "Edit Availability" : "Add Availability"}</ModalTitle>
        </ModalHeader>

        <div className="space-y-4 py-4">
          {/* Status Selection */}
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Status</legend>
            <div className="flex gap-2" role="radiogroup" aria-labelledby={statusId}>
              {AVAILABILITY_STATUSES.map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => {
                    setFormData({ ...formData, status });
                  }}
                  className={`flex-1 rounded-lg border-2 px-3 py-2 text-sm font-medium transition-colors ${
                    formData.status === status
                      ? "border-current"
                      : "border-transparent opacity-60 hover:opacity-100"
                  }`}
                  style={{
                    backgroundColor: `${AVAILABILITY_STATUS_COLORS[status]}20`,
                    color: AVAILABILITY_STATUS_COLORS[status],
                    borderColor:
                      formData.status === status
                        ? AVAILABILITY_STATUS_COLORS[status]
                        : "transparent",
                  }}
                >
                  {AVAILABILITY_STATUS_LABELS[status]}
                </button>
              ))}
            </div>
          </fieldset>

          {/* Title */}
          <div className="space-y-2">
            <label htmlFor={titleId} className="text-sm font-medium">
              Title (optional)
            </label>
            <Input
              id={titleId}
              value={formData.title}
              onChange={(e) => {
                setFormData({ ...formData, title: e.target.value });
              }}
              placeholder="e.g., Vacation, Rehearsal conflict..."
            />
          </div>

          {/* Date Range */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor={startDateId} className="text-sm font-medium">
                Start Date
              </label>
              <Input
                id={startDateId}
                type="date"
                value={formData.startDate}
                onChange={(e) => {
                  setFormData({ ...formData, startDate: e.target.value });
                }}
                aria-required="true"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor={endDateId} className="text-sm font-medium">
                End Date
              </label>
              <Input
                id={endDateId}
                type="date"
                value={formData.endDate}
                onChange={(e) => {
                  setFormData({ ...formData, endDate: e.target.value });
                }}
                aria-required="true"
              />
            </div>
          </div>

          {/* Recurrence */}
          <div className="space-y-2">
            <label htmlFor={recurrenceId} className="text-sm font-medium">
              Repeat
            </label>
            <select
              id={recurrenceId}
              value={formData.recurrencePattern}
              onChange={(e) => {
                setFormData({ ...formData, recurrencePattern: e.target.value });
              }}
              className="border-input bg-background flex h-10 w-full rounded-lg border px-3 py-2 text-sm"
            >
              {RECURRENCE_PATTERNS.map((pattern) => (
                <option key={pattern} value={pattern}>
                  {RECURRENCE_PATTERN_LABELS[pattern]}
                </option>
              ))}
            </select>
          </div>

          {formData.recurrencePattern !== "none" && (
            <div className="space-y-2">
              <label htmlFor={recurrenceEndId} className="text-sm font-medium">
                Repeat Until
              </label>
              <Input
                id={recurrenceEndId}
                type="date"
                value={formData.recurrenceEndDate}
                onChange={(e) => {
                  setFormData({ ...formData, recurrenceEndDate: e.target.value });
                }}
              />
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <label htmlFor={notesId} className="text-sm font-medium">
              Notes
            </label>
            <textarea
              id={notesId}
              value={formData.notes}
              onChange={(e) => {
                setFormData({ ...formData, notes: e.target.value });
              }}
              placeholder="Additional details..."
              className="border-input bg-background focus-visible:ring-ring flex min-h-[80px] w-full rounded-lg border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
            />
          </div>
        </div>

        <ModalFooter className="flex justify-between">
          <div>
            {mode === "edit" && initialData?.id && (
              <Button
                variant="outline"
                onClick={() => void handleDelete()}
                disabled={isLoading}
                className="text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={() => void handleSubmit()} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === "edit" ? "Update" : "Add"}
            </Button>
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

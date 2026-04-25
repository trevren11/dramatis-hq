/* eslint-disable @typescript-eslint/no-misused-promises */
"use client";

import { useState, useEffect } from "react";
import { X, AlertTriangle, Users, User } from "lucide-react";
import { format } from "date-fns";
import type { SCHEDULE_EVENT_TYPE_VALUES } from "@/lib/db/schema/schedule";
import { SCHEDULE_EVENT_TYPE_OPTIONS } from "@/lib/db/schema/schedule";

interface CastMember {
  id: string;
  firstName: string;
  lastName: string;
  stageName: string | null;
  roleName: string | null;
  headshotUrl: string | null;
}

interface Role {
  id: string;
  name: string;
}

interface ConflictInfo {
  id: string;
  firstName: string;
  lastName: string;
  stageName: string | null;
  roleName: string | null;
  conflictType: "unavailable" | "event";
  conflictDetails: string;
}

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    description?: string;
    eventType: string;
    location?: string;
    startTime: Date;
    endTime: Date;
    isAllCast: boolean;
    castMemberIds?: string[];
    roleIds?: string[];
    notes?: string;
  }) => Promise<void>;
  showId: string;
  cast: CastMember[];
  roles: Role[];
  initialDateRange: { start: Date; end: Date } | null;
}

type CastSelectionMode = "all" | "roles" | "individual";

export function EventModal({
  isOpen,
  onClose,
  onSubmit,
  showId,
  cast,
  roles,
  initialDateRange,
}: EventModalProps): React.ReactElement | null {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [conflicts, setConflicts] = useState<ConflictInfo[]>([]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventType, setEventType] =
    useState<(typeof SCHEDULE_EVENT_TYPE_VALUES)[number]>("rehearsal");
  const [location, setLocation] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [notes, setNotes] = useState("");

  const [castSelectionMode, setCastSelectionMode] = useState<CastSelectionMode>("all");
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [selectedCastIds, setSelectedCastIds] = useState<string[]>([]);

  useEffect(() => {
    if (initialDateRange) {
      setStartTime(format(initialDateRange.start, "yyyy-MM-dd'T'HH:mm"));
      setEndTime(format(initialDateRange.end, "yyyy-MM-dd'T'HH:mm"));
    }
  }, [initialDateRange]);

  useEffect(() => {
    if (!isOpen) {
      setTitle("");
      setDescription("");
      setEventType("rehearsal");
      setLocation("");
      setStartTime("");
      setEndTime("");
      setNotes("");
      setCastSelectionMode("all");
      setSelectedRoleIds([]);
      setSelectedCastIds([]);
      setConflicts([]);
    }
  }, [isOpen]);

  useEffect(() => {
    const checkConflicts = async (): Promise<void> => {
      if (!startTime || !endTime) return;

      let talentIds: string[] = [];
      if (castSelectionMode === "all") {
        talentIds = cast.map((c) => c.id);
      } else if (castSelectionMode === "roles" && selectedRoleIds.length > 0) {
        talentIds = cast
          .filter(
            (c) =>
              c.roleName &&
              selectedRoleIds.some((rid) => {
                const role = roles.find((r) => r.id === rid);
                return role?.name === c.roleName;
              })
          )
          .map((c) => c.id);
      } else if (castSelectionMode === "individual" && selectedCastIds.length > 0) {
        talentIds = selectedCastIds;
      }

      if (talentIds.length === 0) {
        setConflicts([]);
        return;
      }

      try {
        const response = await fetch(`/api/shows/${showId}/schedule/conflicts`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            startTime: new Date(startTime),
            endTime: new Date(endTime),
            talentProfileIds: talentIds,
          }),
        });

        if (response.ok) {
          const data = (await response.json()) as { conflicts: ConflictInfo[] };
          setConflicts(data.conflicts);
        }
      } catch (error) {
        console.error("Failed to check conflicts:", error);
      }
    };

    const timeoutId = setTimeout(() => void checkConflicts(), 500);
    return () => {
      clearTimeout(timeoutId);
    };
  }, [
    showId,
    startTime,
    endTime,
    castSelectionMode,
    selectedRoleIds,
    selectedCastIds,
    cast,
    roles,
  ]);

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await onSubmit({
        title,
        description: description || undefined,
        eventType,
        location: location || undefined,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        isAllCast: castSelectionMode === "all",
        castMemberIds: castSelectionMode === "individual" ? selectedCastIds : undefined,
        roleIds: castSelectionMode === "roles" ? selectedRoleIds : undefined,
        notes: notes || undefined,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleRoleSelection = (roleId: string): void => {
    setSelectedRoleIds((prev) =>
      prev.includes(roleId) ? prev.filter((id) => id !== roleId) : [...prev, roleId]
    );
  };

  const toggleCastSelection = (castId: string): void => {
    setSelectedCastIds((prev) =>
      prev.includes(castId) ? prev.filter((id) => id !== castId) : [...prev, castId]
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-base-100 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg shadow-xl">
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="text-lg font-semibold">Create Event</h2>
          <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Title *</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
              }}
              placeholder="e.g., Full Cast Rehearsal"
              className="input input-bordered w-full"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Event Type *</span>
              </label>
              <select
                value={eventType}
                onChange={(e) => {
                  setEventType(e.target.value as typeof eventType);
                }}
                className="select select-bordered w-full"
              >
                {SCHEDULE_EVENT_TYPE_OPTIONS.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Location</span>
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => {
                  setLocation(e.target.value);
                }}
                placeholder="e.g., Main Stage"
                className="input input-bordered w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Start Time *</span>
              </label>
              <input
                type="datetime-local"
                value={startTime}
                onChange={(e) => {
                  setStartTime(e.target.value);
                }}
                className="input input-bordered w-full"
                required
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">End Time *</span>
              </label>
              <input
                type="datetime-local"
                value={endTime}
                onChange={(e) => {
                  setEndTime(e.target.value);
                }}
                className="input input-bordered w-full"
                required
              />
            </div>
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Description</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
              }}
              placeholder="Event description..."
              className="textarea textarea-bordered w-full"
              rows={2}
            />
          </div>

          <div className="space-y-3">
            <label className="label">
              <span className="label-text font-medium">Who&apos;s Called</span>
            </label>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setCastSelectionMode("all");
                }}
                className={`btn btn-sm ${castSelectionMode === "all" ? "btn-primary" : "btn-outline"}`}
              >
                <Users className="h-4 w-4" />
                All Cast
              </button>
              <button
                type="button"
                onClick={() => {
                  setCastSelectionMode("roles");
                }}
                className={`btn btn-sm ${castSelectionMode === "roles" ? "btn-primary" : "btn-outline"}`}
              >
                By Role
              </button>
              <button
                type="button"
                onClick={() => {
                  setCastSelectionMode("individual");
                }}
                className={`btn btn-sm ${castSelectionMode === "individual" ? "btn-primary" : "btn-outline"}`}
              >
                <User className="h-4 w-4" />
                Individual
              </button>
            </div>

            {castSelectionMode === "roles" && (
              <div className="max-h-40 space-y-1 overflow-y-auto rounded border p-2">
                {roles.map((role) => (
                  <label key={role.id} className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedRoleIds.includes(role.id)}
                      onChange={() => {
                        toggleRoleSelection(role.id);
                      }}
                      className="checkbox checkbox-sm"
                    />
                    <span className="text-sm">{role.name}</span>
                  </label>
                ))}
                {roles.length === 0 && (
                  <p className="text-muted-foreground text-sm">No roles defined</p>
                )}
              </div>
            )}

            {castSelectionMode === "individual" && (
              <div className="max-h-40 space-y-1 overflow-y-auto rounded border p-2">
                {cast.map((member) => (
                  <label key={member.id} className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedCastIds.includes(member.id)}
                      onChange={() => {
                        toggleCastSelection(member.id);
                      }}
                      className="checkbox checkbox-sm"
                    />
                    <span className="text-sm">
                      {member.stageName ?? `${member.firstName} ${member.lastName}`}
                      {member.roleName && (
                        <span className="text-muted-foreground ml-1">({member.roleName})</span>
                      )}
                    </span>
                  </label>
                ))}
                {cast.length === 0 && (
                  <p className="text-muted-foreground text-sm">No cast members assigned</p>
                )}
              </div>
            )}
          </div>

          {conflicts.length > 0 && (
            <div className="alert alert-warning">
              <AlertTriangle className="h-5 w-5" />
              <div>
                <h3 className="font-medium">Scheduling Conflicts</h3>
                <ul className="mt-1 list-inside list-disc text-sm">
                  {conflicts.map((conflict) => (
                    <li key={conflict.id}>
                      {conflict.stageName ?? `${conflict.firstName} ${conflict.lastName}`}:{" "}
                      {conflict.conflictDetails}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Notes</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value);
              }}
              placeholder="Additional notes for cast..."
              className="textarea textarea-bordered w-full"
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <button type="button" onClick={onClose} className="btn btn-ghost">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title || !startTime || !endTime}
              className="btn btn-primary"
            >
              {isSubmitting ? "Creating..." : "Create Event"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

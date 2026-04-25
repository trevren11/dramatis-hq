/* eslint-disable @typescript-eslint/no-misused-promises, complexity */
"use client";

import { useState, useEffect } from "react";
import { X, Edit2, Trash2, MapPin, Clock, Users } from "lucide-react";
import { format } from "date-fns";
import type {
  ScheduleEvent,
  SCHEDULE_EVENT_TYPE_VALUES,
  SCHEDULE_EVENT_STATUS_VALUES,
} from "@/lib/db/schema/schedule";
import {
  SCHEDULE_EVENT_TYPE_OPTIONS,
  SCHEDULE_EVENT_STATUS_OPTIONS,
} from "@/lib/db/schema/schedule";

interface CastMember {
  id: string;
  firstName: string;
  lastName: string;
  stageName: string | null;
  roleName: string | null;
  headshotUrl: string | null;
}

interface EventCastMember {
  id: string;
  talentProfileId: string;
  roleId: string | null;
  firstName: string;
  lastName: string;
  stageName: string | null;
  roleName: string | null;
  headshotUrl: string | null;
}

interface CalendarEvent extends ScheduleEvent {
  cast: EventCastMember[];
  color: string;
}

interface EventDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: CalendarEvent;
  cast: CastMember[];
  onUpdate: (
    eventId: string,
    data: Partial<{
      title: string;
      description?: string;
      eventType: string;
      status: string;
      location?: string;
      startTime: Date;
      endTime: Date;
      isAllCast: boolean;
      castMemberIds?: string[];
      roleIds?: string[];
      notes?: string;
    }>
  ) => Promise<void>;
  onDelete: (eventId: string) => Promise<void>;
}

export function EventDetailModal({
  isOpen,
  onClose,
  event,
  cast,
  onUpdate,
  onDelete,
}: EventDetailModalProps): React.ReactElement | null {
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [title, setTitle] = useState(event.title);
  const [description, setDescription] = useState(event.description ?? "");
  const [eventType, setEventType] = useState<(typeof SCHEDULE_EVENT_TYPE_VALUES)[number]>(
    event.eventType
  );
  const [status, setStatus] = useState<(typeof SCHEDULE_EVENT_STATUS_VALUES)[number]>(event.status);
  const [location, setLocation] = useState(event.location ?? "");
  const [startTime, setStartTime] = useState(format(event.startTime, "yyyy-MM-dd'T'HH:mm"));
  const [endTime, setEndTime] = useState(format(event.endTime, "yyyy-MM-dd'T'HH:mm"));
  const [notes, setNotes] = useState(event.notes ?? "");
  const [isAllCast, setIsAllCast] = useState(event.isAllCast);
  const [selectedCastIds, setSelectedCastIds] = useState<string[]>(
    event.cast.map((c) => c.talentProfileId)
  );

  useEffect(() => {
    setTitle(event.title);
    setDescription(event.description ?? "");
    setEventType(event.eventType);
    setStatus(event.status);
    setLocation(event.location ?? "");
    setStartTime(format(event.startTime, "yyyy-MM-dd'T'HH:mm"));
    setEndTime(format(event.endTime, "yyyy-MM-dd'T'HH:mm"));
    setNotes(event.notes ?? "");
    setIsAllCast(event.isAllCast);
    setSelectedCastIds(event.cast.map((c) => c.talentProfileId));
    setIsEditing(false);
  }, [event]);

  const handleSave = async (): Promise<void> => {
    setIsSubmitting(true);
    try {
      await onUpdate(event.id, {
        title,
        description: description || undefined,
        eventType,
        status,
        location: location || undefined,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        isAllCast,
        castMemberIds: isAllCast ? undefined : selectedCastIds,
        notes: notes || undefined,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (): Promise<void> => {
    setIsSubmitting(true);
    try {
      await onDelete(event.id);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleCastSelection = (castId: string): void => {
    setSelectedCastIds((prev) =>
      prev.includes(castId) ? prev.filter((id) => id !== castId) : [...prev, castId]
    );
  };

  const eventTypeOption = SCHEDULE_EVENT_TYPE_OPTIONS.find((t) => t.value === event.eventType);
  const statusOption = SCHEDULE_EVENT_STATUS_OPTIONS.find((s) => s.value === event.status);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-base-100 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg shadow-xl">
        <div
          className="flex items-center justify-between p-4"
          style={{ borderBottom: `3px solid ${event.color}` }}
        >
          <div className="flex items-center gap-2">
            <span
              className="inline-block h-4 w-4 rounded"
              style={{ backgroundColor: event.color }}
            />
            <h2 className="text-lg font-semibold">{isEditing ? "Edit Event" : event.title}</h2>
          </div>
          <div className="flex items-center gap-2">
            {!isEditing && (
              <>
                <button
                  onClick={() => {
                    setIsEditing(true);
                  }}
                  className="btn btn-ghost btn-sm"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => {
                    setShowDeleteConfirm(true);
                  }}
                  className="btn btn-ghost btn-sm text-error"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </>
            )}
            <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {showDeleteConfirm && (
          <div className="bg-error/10 border-b p-4">
            <p className="text-sm">Are you sure you want to delete this event?</p>
            <div className="mt-2 flex gap-2">
              <button
                onClick={handleDelete}
                disabled={isSubmitting}
                className="btn btn-error btn-sm"
              >
                {isSubmitting ? "Deleting..." : "Delete"}
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                }}
                className="btn btn-ghost btn-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="p-4">
          {isEditing ? (
            <div className="space-y-4">
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
                  className="input input-bordered w-full"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Event Type</span>
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
                    <span className="label-text font-medium">Status</span>
                  </label>
                  <select
                    value={status}
                    onChange={(e) => {
                      setStatus(e.target.value as typeof status);
                    }}
                    className="select select-bordered w-full"
                  >
                    {SCHEDULE_EVENT_STATUS_OPTIONS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
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
                  className="input input-bordered w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Start Time</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={startTime}
                    onChange={(e) => {
                      setStartTime(e.target.value);
                    }}
                    className="input input-bordered w-full"
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">End Time</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={endTime}
                    onChange={(e) => {
                      setEndTime(e.target.value);
                    }}
                    className="input input-bordered w-full"
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
                  className="textarea textarea-bordered w-full"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <label className="label">
                  <span className="label-text font-medium">Cast</span>
                </label>
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isAllCast}
                    onChange={(e) => {
                      setIsAllCast(e.target.checked);
                    }}
                    className="checkbox checkbox-sm"
                  />
                  <span className="text-sm">All Cast</span>
                </label>

                {!isAllCast && (
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
                  </div>
                )}
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Notes</span>
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => {
                    setNotes(e.target.value);
                  }}
                  className="textarea textarea-bordered w-full"
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  onClick={() => {
                    setIsEditing(false);
                  }}
                  className="btn btn-ghost"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSubmitting || !title}
                  className="btn btn-primary"
                >
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <span className="badge badge-outline">{eventTypeOption?.label}</span>
                <span
                  className={`badge ${
                    status === "confirmed"
                      ? "badge-success"
                      : status === "cancelled"
                        ? "badge-error"
                        : "badge-warning"
                  }`}
                >
                  {statusOption?.label}
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="text-muted-foreground h-4 w-4" />
                  <span>
                    {format(event.startTime, "EEEE, MMMM d, yyyy")}
                    <br />
                    {format(event.startTime, "h:mm a")} - {format(event.endTime, "h:mm a")}
                  </span>
                </div>

                {event.location && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="text-muted-foreground h-4 w-4" />
                    <span>{event.location}</span>
                  </div>
                )}
              </div>

              {event.description && (
                <div>
                  <h4 className="text-muted-foreground text-sm font-medium">Description</h4>
                  <p className="mt-1 text-sm">{event.description}</p>
                </div>
              )}

              <div>
                <h4 className="text-muted-foreground mb-2 flex items-center gap-2 text-sm font-medium">
                  <Users className="h-4 w-4" />
                  Cast Called ({event.cast.length})
                </h4>
                {event.isAllCast ? (
                  <p className="text-sm italic">All cast members</p>
                ) : event.cast.length > 0 ? (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {event.cast.map((member) => (
                      <div key={member.id} className="flex items-center gap-2 rounded border p-2">
                        {member.headshotUrl ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={member.headshotUrl}
                            alt=""
                            className="h-8 w-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="bg-muted flex h-8 w-8 items-center justify-center rounded-full">
                            <Users className="h-4 w-4" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {member.stageName ?? `${member.firstName} ${member.lastName}`}
                          </p>
                          {member.roleName && (
                            <p className="text-muted-foreground truncate text-xs">
                              {member.roleName}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">No cast members assigned</p>
                )}
              </div>

              {event.notes && (
                <div>
                  <h4 className="text-muted-foreground text-sm font-medium">Notes</h4>
                  <p className="mt-1 text-sm">{event.notes}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

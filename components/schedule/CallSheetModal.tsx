/* eslint-disable @typescript-eslint/no-misused-promises */
"use client";

import { useState } from "react";
import { X, FileText, Printer } from "lucide-react";
import { format } from "date-fns";
import type { ScheduleEvent } from "@/lib/db/schema/schedule";
import { SCHEDULE_EVENT_TYPE_OPTIONS } from "@/lib/db/schema/schedule";

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

interface CallSheetData {
  show: {
    title: string;
    venue: string | null;
  };
  generatedAt: string;
  generatedBy: string;
  events: {
    id: string;
    title: string;
    eventType: string;
    date: string;
    startTime: string;
    endTime: string;
    location: string | null;
    notes: string | null;
    cast: {
      id: string;
      name: string;
      role: string | null;
      phone: string | null;
      email: string | null;
    }[];
  }[];
}

interface CallSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  showId: string;
  events: CalendarEvent[];
  initialSelectedIds: string[];
}

export function CallSheetModal({
  isOpen,
  onClose,
  showId,
  events,
  initialSelectedIds,
}: CallSheetModalProps): React.ReactElement | null {
  const [selectedEventIds, setSelectedEventIds] = useState<string[]>(initialSelectedIds);
  const [includeNotes, setIncludeNotes] = useState(true);
  const [includeLocation, setIncludeLocation] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [callSheet, setCallSheet] = useState<CallSheetData | null>(null);

  const toggleEventSelection = (eventId: string): void => {
    setSelectedEventIds((prev) =>
      prev.includes(eventId) ? prev.filter((id) => id !== eventId) : [...prev, eventId]
    );
  };

  const handleGenerate = async (): Promise<void> => {
    if (selectedEventIds.length === 0) return;

    setIsGenerating(true);
    try {
      const response = await fetch(`/api/shows/${showId}/schedule/call-sheet`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventIds: selectedEventIds,
          includeNotes,
          includeLocation,
        }),
      });

      if (response.ok) {
        const data = (await response.json()) as { callSheet: CallSheetData };
        setCallSheet(data.callSheet);
      }
    } catch (error) {
      console.error("Failed to generate call sheet:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = (): void => {
    window.print();
  };

  const sortedEvents = [...events].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-base-100 max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg shadow-xl">
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <FileText className="h-5 w-5" />
            Generate Call Sheet
          </h2>
          <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle">
            <X className="h-5 w-5" />
          </button>
        </div>

        {!callSheet ? (
          <div className="space-y-4 p-4">
            <div>
              <h3 className="mb-2 font-medium">Select Events</h3>
              <div className="max-h-60 space-y-1 overflow-y-auto rounded border p-2">
                {sortedEvents.map((event) => (
                  <label
                    key={event.id}
                    className="hover:bg-base-200 flex cursor-pointer items-center gap-3 rounded p-2"
                  >
                    <input
                      type="checkbox"
                      checked={selectedEventIds.includes(event.id)}
                      onChange={() => {
                        toggleEventSelection(event.id);
                      }}
                      className="checkbox checkbox-sm"
                    />
                    <span
                      className="inline-block h-3 w-3 rounded"
                      style={{ backgroundColor: event.color }}
                    />
                    <div className="flex-1">
                      <span className="text-sm font-medium">{event.title}</span>
                      <span className="text-muted-foreground ml-2 text-xs">
                        {format(event.startTime, "EEE, MMM d")} at{" "}
                        {format(event.startTime, "h:mm a")}
                      </span>
                    </div>
                    <span className="text-muted-foreground text-xs">
                      {event.cast.length} called
                    </span>
                  </label>
                ))}
                {events.length === 0 && (
                  <p className="text-muted-foreground p-4 text-center text-sm">
                    No events scheduled
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-4">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={includeLocation}
                  onChange={(e) => {
                    setIncludeLocation(e.target.checked);
                  }}
                  className="checkbox checkbox-sm"
                />
                <span className="text-sm">Include Location</span>
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={includeNotes}
                  onChange={(e) => {
                    setIncludeNotes(e.target.checked);
                  }}
                  className="checkbox checkbox-sm"
                />
                <span className="text-sm">Include Notes</span>
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <button onClick={onClose} className="btn btn-ghost">
                Cancel
              </button>
              <button
                onClick={handleGenerate}
                disabled={isGenerating || selectedEventIds.length === 0}
                className="btn btn-primary"
              >
                {isGenerating ? "Generating..." : "Generate Call Sheet"}
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4">
            <div className="mb-4 flex items-center justify-between">
              <button
                onClick={() => {
                  setCallSheet(null);
                }}
                className="btn btn-ghost btn-sm"
              >
                Back to Selection
              </button>
              <button onClick={handlePrint} className="btn btn-outline btn-sm">
                <Printer className="h-4 w-4" />
                Print
              </button>
            </div>

            <div className="rounded border bg-white p-6 text-black print:border-0 print:p-0">
              <div className="mb-6 text-center">
                <h1 className="text-2xl font-bold">{callSheet.show.title}</h1>
                <p className="text-lg">Call Sheet</p>
                {callSheet.show.venue && (
                  <p className="text-muted-foreground">{callSheet.show.venue}</p>
                )}
                <p className="text-muted-foreground mt-2 text-sm">
                  Generated: {format(new Date(callSheet.generatedAt), "MMMM d, yyyy h:mm a")}
                </p>
              </div>

              {callSheet.events.map((event, index) => {
                const eventType = SCHEDULE_EVENT_TYPE_OPTIONS.find(
                  (t) => t.value === event.eventType
                );
                return (
                  <div key={event.id} className={index > 0 ? "mt-6 border-t pt-6" : ""}>
                    <div className="mb-4">
                      <h2 className="text-xl font-semibold">{event.title}</h2>
                      <p className="text-muted-foreground">{eventType?.label}</p>
                      <p className="font-medium">
                        {event.date} | {event.startTime} - {event.endTime}
                      </p>
                      {event.location && (
                        <p className="text-muted-foreground">Location: {event.location}</p>
                      )}
                    </div>

                    <table className="w-full border-collapse border">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border p-2 text-left">Name</th>
                          <th className="border p-2 text-left">Role</th>
                        </tr>
                      </thead>
                      <tbody>
                        {event.cast.length > 0 ? (
                          event.cast.map((member) => (
                            <tr key={member.id}>
                              <td className="border p-2">{member.name}</td>
                              <td className="border p-2">{member.role ?? "-"}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td
                              colSpan={2}
                              className="text-muted-foreground border p-2 text-center"
                            >
                              No cast members assigned
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>

                    {event.notes && (
                      <div className="mt-4">
                        <h4 className="font-medium">Notes:</h4>
                        <p className="text-sm">{event.notes}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

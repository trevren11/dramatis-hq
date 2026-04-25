/* eslint-disable @typescript-eslint/no-misused-promises */
"use client";

import { useState, useCallback, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { DateSelectArg, EventClickArg, EventDropArg } from "@fullcalendar/core";
import type { EventResizeDoneArg } from "@fullcalendar/interaction";
import { Plus, Download, FileText } from "lucide-react";
import { EventModal } from "./EventModal";
import { EventDetailModal } from "./EventDetailModal";
import { CallSheetModal } from "./CallSheetModal";
import type { ScheduleEvent } from "@/lib/db/schema/schedule";
import { SCHEDULE_EVENT_TYPE_OPTIONS } from "@/lib/db/schema/schedule";

interface CalendarEvent extends ScheduleEvent {
  cast: {
    id: string;
    talentProfileId: string;
    roleId: string | null;
    firstName: string;
    lastName: string;
    stageName: string | null;
    roleName: string | null;
    headshotUrl: string | null;
  }[];
  color: string;
}

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

interface RehearsalCalendarProps {
  showId: string;
  initialEvents: CalendarEvent[];
  cast: CastMember[];
  roles: Role[];
}

export function RehearsalCalendar({
  showId,
  initialEvents,
  cast,
  roles,
}: RehearsalCalendarProps): React.ReactElement {
  const calendarRef = useRef<FullCalendar | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isCallSheetModalOpen, setIsCallSheetModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [selectedDateRange, setSelectedDateRange] = useState<{
    start: Date;
    end: Date;
  } | null>(null);
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [currentView, setCurrentView] = useState<"dayGridMonth" | "timeGridWeek" | "timeGridDay">(
    "timeGridWeek"
  );
  const [filterEventType, setFilterEventType] = useState<string | null>(null);

  const fetchEvents = useCallback(async (): Promise<void> => {
    try {
      const response = await fetch(`/api/shows/${showId}/schedule`);
      if (response.ok) {
        const data = (await response.json()) as { events: CalendarEvent[] };
        setEvents(data.events);
      }
    } catch (error) {
      console.error("Failed to fetch events:", error);
    }
  }, [showId]);

  const handleDateSelect = useCallback((selectInfo: DateSelectArg) => {
    setSelectedDateRange({
      start: selectInfo.start,
      end: selectInfo.end,
    });
    setSelectedEvent(null);
    setIsCreateModalOpen(true);
  }, []);

  const handleEventClick = useCallback(
    (clickInfo: EventClickArg) => {
      const event = events.find((e) => e.id === clickInfo.event.id);
      if (event) {
        setSelectedEvent(event);
        setIsDetailModalOpen(true);
      }
    },
    [events]
  );

  const handleEventDrop = useCallback(
    async (dropInfo: EventDropArg) => {
      const event = events.find((e) => e.id === dropInfo.event.id);
      if (!event) return;

      try {
        const response = await fetch(`/api/shows/${showId}/schedule/${event.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            startTime: dropInfo.event.start,
            endTime: dropInfo.event.end,
          }),
        });

        if (response.ok) {
          await fetchEvents();
        } else {
          dropInfo.revert();
        }
      } catch (error) {
        console.error("Failed to update event:", error);
        dropInfo.revert();
      }
    },
    [showId, events, fetchEvents]
  );

  const handleEventResize = useCallback(
    async (resizeInfo: EventResizeDoneArg) => {
      const event = events.find((e) => e.id === resizeInfo.event.id);
      if (!event) return;

      try {
        const response = await fetch(`/api/shows/${showId}/schedule/${event.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            startTime: resizeInfo.event.start,
            endTime: resizeInfo.event.end,
          }),
        });

        if (response.ok) {
          await fetchEvents();
        } else {
          resizeInfo.revert();
        }
      } catch (error) {
        console.error("Failed to update event:", error);
        resizeInfo.revert();
      }
    },
    [showId, events, fetchEvents]
  );

  const handleCreateEvent = async (eventData: {
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
  }): Promise<void> => {
    try {
      const response = await fetch(`/api/shows/${showId}/schedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventData),
      });

      if (response.ok) {
        await fetchEvents();
        setIsCreateModalOpen(false);
        setSelectedDateRange(null);
      }
    } catch (error) {
      console.error("Failed to create event:", error);
    }
  };

  const handleUpdateEvent = async (
    eventId: string,
    eventData: Partial<{
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
  ): Promise<void> => {
    try {
      const response = await fetch(`/api/shows/${showId}/schedule/${eventId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventData),
      });

      if (response.ok) {
        await fetchEvents();
        setIsDetailModalOpen(false);
        setSelectedEvent(null);
      }
    } catch (error) {
      console.error("Failed to update event:", error);
    }
  };

  const handleDeleteEvent = async (eventId: string): Promise<void> => {
    try {
      const response = await fetch(`/api/shows/${showId}/schedule/${eventId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchEvents();
        setIsDetailModalOpen(false);
        setSelectedEvent(null);
      }
    } catch (error) {
      console.error("Failed to delete event:", error);
    }
  };

  const handleExportIcal = (): void => {
    window.open(`/api/shows/${showId}/schedule/ical`, "_blank");
  };

  const handleGenerateCallSheet = (): void => {
    setSelectedEvents(events.map((e) => e.id));
    setIsCallSheetModalOpen(true);
  };

  const filteredEvents = filterEventType
    ? events.filter((e) => e.eventType === filterEventType)
    : events;

  const calendarEvents = filteredEvents.map((event) => ({
    id: event.id,
    title: event.title,
    start: event.startTime,
    end: event.endTime,
    backgroundColor: event.color,
    borderColor: event.color,
    extendedProps: {
      eventType: event.eventType,
      location: event.location,
      castCount: event.cast.length,
    },
  }));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <select
            value={currentView}
            onChange={(e) => {
              const view = e.target.value as typeof currentView;
              setCurrentView(view);
              calendarRef.current?.getApi().changeView(view);
            }}
            className="select select-bordered select-sm"
          >
            <option value="dayGridMonth">Month</option>
            <option value="timeGridWeek">Week</option>
            <option value="timeGridDay">Day</option>
          </select>

          <select
            value={filterEventType ?? ""}
            onChange={(e) => {
              setFilterEventType(e.target.value || null);
            }}
            className="select select-bordered select-sm"
          >
            <option value="">All Event Types</option>
            {SCHEDULE_EVENT_TYPE_OPTIONS.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setSelectedDateRange({
                start: new Date(),
                end: new Date(Date.now() + 2 * 60 * 60 * 1000),
              });
              setSelectedEvent(null);
              setIsCreateModalOpen(true);
            }}
            className="btn btn-primary btn-sm"
          >
            <Plus className="h-4 w-4" />
            Add Event
          </button>

          <button onClick={handleGenerateCallSheet} className="btn btn-outline btn-sm">
            <FileText className="h-4 w-4" />
            Call Sheet
          </button>

          <button onClick={handleExportIcal} className="btn btn-outline btn-sm">
            <Download className="h-4 w-4" />
            Export iCal
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {SCHEDULE_EVENT_TYPE_OPTIONS.map((type) => (
          <div key={type.value} className="flex items-center gap-1 text-xs">
            <span
              className="inline-block h-3 w-3 rounded"
              style={{ backgroundColor: type.color }}
            />
            <span>{type.label}</span>
          </div>
        ))}
      </div>

      <div className="bg-base-100 rounded-lg border p-4">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView={currentView}
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "",
          }}
          events={calendarEvents}
          editable={true}
          selectable={true}
          selectMirror={true}
          dayMaxEvents={true}
          weekends={true}
          select={handleDateSelect}
          eventClick={handleEventClick}
          eventDrop={handleEventDrop}
          eventResize={handleEventResize}
          height="auto"
          slotMinTime="06:00:00"
          slotMaxTime="24:00:00"
          allDaySlot={false}
          eventContent={(eventInfo) => (
            <div className="overflow-hidden p-1">
              <div className="truncate text-xs font-medium">{eventInfo.event.title}</div>
              {eventInfo.view.type !== "dayGridMonth" && (
                <>
                  {eventInfo.event.extendedProps.location && (
                    <div className="truncate text-xs opacity-80">
                      {eventInfo.event.extendedProps.location}
                    </div>
                  )}
                  <div className="text-xs opacity-80">
                    {eventInfo.event.extendedProps.castCount} called
                  </div>
                </>
              )}
            </div>
          )}
        />
      </div>

      <EventModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setSelectedDateRange(null);
        }}
        onSubmit={handleCreateEvent}
        showId={showId}
        cast={cast}
        roles={roles}
        initialDateRange={selectedDateRange}
      />

      {selectedEvent && (
        <EventDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedEvent(null);
          }}
          event={selectedEvent}
          cast={cast}
          onUpdate={handleUpdateEvent}
          onDelete={handleDeleteEvent}
        />
      )}

      <CallSheetModal
        isOpen={isCallSheetModalOpen}
        onClose={() => {
          setIsCallSheetModalOpen(false);
        }}
        showId={showId}
        events={events}
        initialSelectedIds={selectedEvents}
      />
    </div>
  );
}

"use client";

import { useCallback, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { DateSelectArg, EventClickArg, EventInput } from "@fullcalendar/core";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { CalendarEventForm } from "./CalendarEventForm";
import type { CalendarEvent } from "@/app/api/calendar/events/route";
import { Calendar, Link2, Loader2 } from "lucide-react";
import {
  AVAILABILITY_STATUSES,
  AVAILABILITY_STATUS_COLORS,
  AVAILABILITY_STATUS_LABELS,
} from "@/lib/db/schema/calendar";

interface TalentCalendarProps {
  icalToken?: string;
}

interface FormState {
  isOpen: boolean;
  mode: "create" | "edit";
  selectedDates: { start: Date; end: Date } | null;
  editingEvent: CalendarEvent | null;
}

export function TalentCalendar({ icalToken }: TalentCalendarProps): React.ReactElement {
  const { toast } = useToast();
  const [events, setEvents] = useState<EventInput[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [formState, setFormState] = useState<FormState>({
    isOpen: false,
    mode: "create",
    selectedDates: null,
    editingEvent: null,
  });

  const fetchEvents = useCallback(
    async (start: Date, end: Date) => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/calendar/events?start=${start.toISOString()}&end=${end.toISOString()}`
        );
        if (!response.ok) throw new Error("Failed to fetch events");
        const data = (await response.json()) as { events: CalendarEvent[] };
        setEvents(
          data.events.map((e) => ({
            id: e.id,
            title: e.title,
            start: e.start,
            end: e.end,
            allDay: e.allDay,
            backgroundColor: e.color,
            borderColor: e.color,
            editable: e.editable,
            extendedProps: e.extendedProps,
          }))
        );
      } catch {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load calendar events",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [toast]
  );

  const handleDateSelect = useCallback((selectInfo: DateSelectArg) => {
    setFormState({
      isOpen: true,
      mode: "create",
      selectedDates: { start: selectInfo.start, end: selectInfo.end },
      editingEvent: null,
    });
  }, []);

  const handleEventClick = useCallback((clickInfo: EventClickArg) => {
    const eventProps = clickInfo.event.extendedProps as CalendarEvent["extendedProps"] & {
      type?: string;
    };

    // Don't allow editing show events
    if (eventProps.type === "show") {
      return;
    }

    setFormState({
      isOpen: true,
      mode: "edit",
      selectedDates: null,
      editingEvent: {
        id: clickInfo.event.id,
        title: clickInfo.event.title,
        start: clickInfo.event.startStr,
        end: clickInfo.event.endStr,
        allDay: clickInfo.event.allDay,
        color: clickInfo.event.backgroundColor || "#22c55e",
        type: "availability",
        editable: true,
        extendedProps: {
          status: eventProps.status,
          notes: eventProps.notes,
        },
      },
    });
  }, []);

  const handleFormClose = useCallback(() => {
    setFormState({
      isOpen: false,
      mode: "create",
      selectedDates: null,
      editingEvent: null,
    });
  }, []);

  const handleEventSaved = useCallback(() => {
    handleFormClose();
    // Refresh events by triggering FullCalendar to refetch
    const calendarEl = document.querySelector(".fc");
    if (calendarEl) {
      const currentStart = new Date();
      currentStart.setDate(1);
      const currentEnd = new Date(currentStart);
      currentEnd.setMonth(currentEnd.getMonth() + 1);
      void fetchEvents(currentStart, currentEnd);
    }
  }, [handleFormClose, fetchEvents]);

  const handleEventDeleted = useCallback(() => {
    handleFormClose();
    const currentStart = new Date();
    currentStart.setDate(1);
    const currentEnd = new Date(currentStart);
    currentEnd.setMonth(currentEnd.getMonth() + 1);
    void fetchEvents(currentStart, currentEnd);
  }, [handleFormClose, fetchEvents]);

  const copyIcalLink = useCallback(async () => {
    if (!icalToken) return;
    const url = `${window.location.origin}/api/calendar/ical?token=${icalToken}`;
    await navigator.clipboard.writeText(url);
    toast({ title: "Copied!", description: "Calendar subscription link copied to clipboard" });
  }, [icalToken, toast]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          My Availability
        </CardTitle>
        <div className="flex items-center gap-2">
          {icalToken && (
            <Button variant="outline" size="sm" onClick={() => void copyIcalLink()}>
              <Link2 className="mr-2 h-4 w-4" />
              Copy Subscribe Link
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Legend */}
        <div className="mb-4 flex flex-wrap gap-4">
          {AVAILABILITY_STATUSES.map((status) => (
            <div key={status} className="flex items-center gap-2">
              <div
                className="h-4 w-4 rounded"
                style={{ backgroundColor: AVAILABILITY_STATUS_COLORS[status] }}
              />
              <span className="text-sm">{AVAILABILITY_STATUS_LABELS[status]}</span>
            </div>
          ))}
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded" style={{ backgroundColor: "#8b5cf6" }} />
            <span className="text-sm">Booked (Show)</span>
          </div>
        </div>

        {isLoading && (
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        )}

        <div className="calendar-wrapper">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,timeGridWeek",
            }}
            selectable={true}
            selectMirror={true}
            dayMaxEvents={true}
            events={events}
            select={handleDateSelect}
            eventClick={handleEventClick}
            datesSet={(dateInfo) => {
              void fetchEvents(dateInfo.start, dateInfo.end);
            }}
            height="auto"
            eventDisplay="block"
          />
        </div>

        {/* Event Form Modal */}
        {formState.isOpen && (
          <CalendarEventForm
            mode={formState.mode}
            initialData={
              formState.mode === "edit" && formState.editingEvent
                ? {
                    id: formState.editingEvent.id,
                    title: formState.editingEvent.title,
                    startDate: new Date(formState.editingEvent.start),
                    endDate: new Date(formState.editingEvent.end),
                    status:
                      (formState.editingEvent.extendedProps.status as
                        | "available"
                        | "unavailable"
                        | "tentative"
                        | undefined) ?? "available",
                    notes: formState.editingEvent.extendedProps.notes ?? "",
                    isAllDay: formState.editingEvent.allDay,
                  }
                : formState.selectedDates
                  ? {
                      startDate: formState.selectedDates.start,
                      endDate: formState.selectedDates.end,
                      status: "available" as const,
                      isAllDay: true,
                    }
                  : undefined
            }
            onClose={handleFormClose}
            onSaved={handleEventSaved}
            onDeleted={handleEventDeleted}
          />
        )}
      </CardContent>
    </Card>
  );
}

"use client";

import { useCallback, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import type { EventInput } from "@fullcalendar/core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Calendar, Loader2, CheckCircle, XCircle, HelpCircle } from "lucide-react";
import {
  AVAILABILITY_STATUSES,
  AVAILABILITY_STATUS_COLORS,
  AVAILABILITY_STATUS_LABELS,
} from "@/lib/db/schema/calendar";

interface AvailabilityViewerProps {
  talentProfileId: string;
  talentName: string;
}

interface AvailabilityEntry {
  id: string;
  title: string | null;
  startDate: string;
  endDate: string;
  status: "available" | "unavailable" | "tentative";
  isAllDay: boolean;
}

interface ShowEntry {
  id: string;
  showName: string;
  startDate: string;
  endDate: string;
  isPublic: boolean;
}

export function AvailabilityViewer({
  talentProfileId,
  talentName,
}: AvailabilityViewerProps): React.ReactElement {
  const { toast } = useToast();
  const [events, setEvents] = useState<EventInput[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [summary, setSummary] = useState<{
    available: number;
    unavailable: number;
    tentative: number;
    booked: number;
  }>({ available: 0, unavailable: 0, tentative: 0, booked: 0 });

  const fetchAvailability = useCallback(
    async (start: Date, end: Date) => {
      setIsLoading(true);
      try {
        // Fetch availability for the talent
        const availabilityResponse = await fetch(
          `/api/producer/calendar/availability?talentProfileId=${talentProfileId}&startDate=${start.toISOString()}&endDate=${end.toISOString()}`
        );

        if (!availabilityResponse.ok) {
          throw new Error("Failed to fetch availability");
        }

        const availabilityData = (await availabilityResponse.json()) as {
          availability: AvailabilityEntry[];
          showSchedules: ShowEntry[];
        };

        // Calculate summary
        const newSummary = { available: 0, unavailable: 0, tentative: 0, booked: 0 };
        for (const entry of availabilityData.availability) {
          switch (entry.status) {
            case "available":
              newSummary.available++;
              break;
            case "unavailable":
              newSummary.unavailable++;
              break;
            case "tentative":
              newSummary.tentative++;
              break;
          }
        }
        newSummary.booked = availabilityData.showSchedules.length;
        setSummary(newSummary);

        // Convert to events
        const calendarEvents: EventInput[] = [
          ...availabilityData.availability.map((entry) => ({
            id: entry.id,
            title: entry.title ?? getStatusLabel(entry.status),
            start: entry.startDate,
            end: entry.endDate,
            allDay: entry.isAllDay,
            backgroundColor: AVAILABILITY_STATUS_COLORS[entry.status],
            borderColor: AVAILABILITY_STATUS_COLORS[entry.status],
          })),
          ...availabilityData.showSchedules.map((entry) => ({
            id: entry.id,
            title: entry.isPublic ? `Booked: ${entry.showName}` : "Booked",
            start: entry.startDate,
            end: entry.endDate,
            allDay: true,
            backgroundColor: "#8b5cf6",
            borderColor: "#8b5cf6",
          })),
        ];

        setEvents(calendarEvents);
      } catch {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load talent availability",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [talentProfileId, toast]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          {talentName}&apos;s Availability
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Summary Stats */}
        <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="flex items-center gap-2 rounded-lg border p-3">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <div>
              <p className="text-sm font-medium">{summary.available}</p>
              <p className="text-muted-foreground text-xs">Available</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg border p-3">
            <XCircle className="h-5 w-5 text-red-500" />
            <div>
              <p className="text-sm font-medium">{summary.unavailable}</p>
              <p className="text-muted-foreground text-xs">Unavailable</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg border p-3">
            <HelpCircle className="h-5 w-5 text-blue-500" />
            <div>
              <p className="text-sm font-medium">{summary.tentative}</p>
              <p className="text-muted-foreground text-xs">Tentative</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg border p-3">
            <Calendar className="h-5 w-5 text-purple-500" />
            <div>
              <p className="text-sm font-medium">{summary.booked}</p>
              <p className="text-muted-foreground text-xs">Booked Shows</p>
            </div>
          </div>
        </div>

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
            plugins={[dayGridPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth",
            }}
            events={events}
            datesSet={(dateInfo) => {
              void fetchAvailability(dateInfo.start, dateInfo.end);
            }}
            height="auto"
            eventDisplay="block"
            selectable={false}
            editable={false}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    available: "Available",
    unavailable: "Unavailable",
    tentative: "Tentative",
  };
  return labels[status] ?? status;
}

"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { Calendar, Clock, Plus, Trash2, Wand2 } from "lucide-react";

interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  talentProfileId?: string;
  notes?: string;
}

interface ScheduleDate {
  date: string;
  slots: TimeSlot[];
}

interface TimeSlotSchedulerProps {
  scheduleDates: ScheduleDate[];
  slotDurationMinutes: number;
  onScheduleChange: (dates: ScheduleDate[]) => void;
  className?: string;
}

function generateUUID(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // Fallback for non-secure contexts (HTTP)
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function addMinutes(time: string, minutes: number): string {
  const parts = time.split(":").map(Number);
  const hours = parts[0] ?? 0;
  const mins = parts[1] ?? 0;
  const totalMins = hours * 60 + mins + minutes;
  const newHours = Math.floor(totalMins / 60) % 24;
  const newMins = totalMins % 60;
  return `${newHours.toString().padStart(2, "0")}:${newMins.toString().padStart(2, "0")}`;
}

function timeToMinutes(time: string): number {
  const parts = time.split(":").map(Number);
  const hours = parts[0] ?? 0;
  const mins = parts[1] ?? 0;
  return hours * 60 + mins;
}

export function TimeSlotScheduler({
  scheduleDates,
  slotDurationMinutes,
  onScheduleChange,
  className,
}: TimeSlotSchedulerProps): React.ReactElement {
  const { toast } = useToast();
  const [newDate, setNewDate] = useState("");
  const [bulkStart, setBulkStart] = useState("09:00");
  const [bulkEnd, setBulkEnd] = useState("17:00");
  const [breakMinutes, setBreakMinutes] = useState(0);

  const addDate = (): void => {
    if (!newDate) {
      toast({
        title: "Date Required",
        description: "Please select a date to add",
        variant: "destructive",
      });
      return;
    }

    if (scheduleDates.some((d) => d.date === newDate)) {
      toast({
        title: "Date Exists",
        description: "This date is already added",
        variant: "destructive",
      });
      return;
    }

    onScheduleChange([...scheduleDates, { date: newDate, slots: [] }]);
    setNewDate("");
  };

  const removeDate = (dateStr: string): void => {
    onScheduleChange(scheduleDates.filter((d) => d.date !== dateStr));
  };

  const generateSlots = (dateStr: string): void => {
    const startMins = timeToMinutes(bulkStart);
    const endMins = timeToMinutes(bulkEnd);

    if (startMins >= endMins) {
      toast({
        title: "Invalid Time Range",
        description: "Start time must be before end time",
        variant: "destructive",
      });
      return;
    }

    const slots: TimeSlot[] = [];
    let currentTime = bulkStart;

    while (timeToMinutes(currentTime) + slotDurationMinutes <= endMins) {
      const slotEnd = addMinutes(currentTime, slotDurationMinutes);
      slots.push({
        id: generateUUID(),
        startTime: currentTime,
        endTime: slotEnd,
      });
      currentTime = addMinutes(slotEnd, breakMinutes);
    }

    onScheduleChange(scheduleDates.map((d) => (d.date === dateStr ? { ...d, slots } : d)));

    toast({
      title: "Slots Generated",
      description: `Created ${String(slots.length)} time slots`,
    });
  };

  const addSlot = (dateStr: string): void => {
    const dateData = scheduleDates.find((d) => d.date === dateStr);
    if (!dateData) return;

    const lastSlot = dateData.slots[dateData.slots.length - 1];
    const startTime = lastSlot ? lastSlot.endTime : "09:00";
    const endTime = addMinutes(startTime, slotDurationMinutes);

    const newSlot: TimeSlot = {
      id: generateUUID(),
      startTime,
      endTime,
    };

    onScheduleChange(
      scheduleDates.map((d) => (d.date === dateStr ? { ...d, slots: [...d.slots, newSlot] } : d))
    );
  };

  const removeSlot = (dateStr: string, slotId: string): void => {
    onScheduleChange(
      scheduleDates.map((d) =>
        d.date === dateStr ? { ...d, slots: d.slots.filter((s) => s.id !== slotId) } : d
      )
    );
  };

  const updateSlot = (dateStr: string, slotId: string, updates: Partial<TimeSlot>): void => {
    onScheduleChange(
      scheduleDates.map((d) =>
        d.date === dateStr
          ? {
              ...d,
              slots: d.slots.map((s) => (s.id === slotId ? { ...s, ...updates } : s)),
            }
          : d
      )
    );
  };

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Schedule
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              type="date"
              value={newDate}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setNewDate(e.target.value);
              }}
              min={new Date().toISOString().split("T")[0]}
            />
          </div>
          <Button onClick={addDate}>
            <Plus className="mr-2 h-4 w-4" />
            Add Date
          </Button>
        </div>

        <div className="rounded-lg border p-4">
          <Label className="mb-2 block text-sm font-medium">Bulk Slot Generator</Label>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label className="text-muted-foreground text-xs">Start Time</Label>
              <Input
                type="time"
                value={bulkStart}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setBulkStart(e.target.value);
                }}
              />
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">End Time</Label>
              <Input
                type="time"
                value={bulkEnd}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setBulkEnd(e.target.value);
                }}
              />
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">Break (min)</Label>
              <Input
                type="number"
                min={0}
                max={60}
                value={breakMinutes}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setBreakMinutes(parseInt(e.target.value, 10) || 0);
                }}
              />
            </div>
          </div>
        </div>

        {scheduleDates.length === 0 ? (
          <div className="text-muted-foreground py-8 text-center text-sm">
            No dates added. Add a date to start scheduling time slots.
          </div>
        ) : (
          <div className="space-y-4">
            {scheduleDates.map((dateData) => (
              <div key={dateData.date} className="rounded-lg border p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="font-medium">{formatDate(dateData.date)}</h4>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        generateSlots(dateData.date);
                      }}
                    >
                      <Wand2 className="mr-2 h-4 w-4" />
                      Generate
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        removeDate(dateData.date);
                      }}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  {dateData.slots.map((slot) => (
                    <div key={slot.id} className="flex items-center gap-2 rounded border p-2">
                      <Clock className="text-muted-foreground h-4 w-4" />
                      <Input
                        type="time"
                        value={slot.startTime}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          updateSlot(dateData.date, slot.id, { startTime: e.target.value });
                        }}
                        className="w-24"
                      />
                      <span className="text-muted-foreground">-</span>
                      <Input
                        type="time"
                        value={slot.endTime}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          updateSlot(dateData.date, slot.id, { endTime: e.target.value });
                        }}
                        className="w-24"
                      />
                      {slot.talentProfileId && (
                        <Badge variant="secondary" className="ml-2">
                          Assigned
                        </Badge>
                      )}
                      <div className="flex-1" />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          removeSlot(dateData.date, slot.id);
                        }}
                        className="text-destructive h-8 w-8"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      addSlot(dateData.date);
                    }}
                    className="w-full"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Slot
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

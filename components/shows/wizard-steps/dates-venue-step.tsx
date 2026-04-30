"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ShowCreate } from "@/lib/validations/shows";

interface Props {
  data: Partial<ShowCreate>;
  onUpdate: (data: Partial<ShowCreate>) => void;
}

function formatDateForInput(date: Date | null | undefined): string {
  if (!date) return "";
  const d = new Date(date);
  return d.toISOString().split("T")[0] ?? "";
}

export function DatesVenueStep({ data, onUpdate }: Props): React.ReactElement {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="venue">Venue</Label>
        <Input
          id="venue"
          value={data.venue ?? ""}
          onChange={(e) => {
            onUpdate({ venue: e.target.value || null });
          }}
          placeholder="e.g., Broadway Theatre, Community Center Stage"
        />
        <p className="text-muted-foreground text-xs">Where will the production take place?</p>
      </div>

      <div className="border-t pt-6">
        <h3 className="mb-4 text-sm font-medium">Key Dates</h3>

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="rehearsalStart">Rehearsal Start Date</Label>
              <Input
                id="rehearsalStart"
                type="date"
                value={formatDateForInput(data.rehearsalStart)}
                onChange={(e) => {
                  onUpdate({
                    rehearsalStart: e.target.value ? new Date(e.target.value) : null,
                  });
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rehearsalEnd">Rehearsal End Date</Label>
              <Input
                id="rehearsalEnd"
                type="date"
                value={formatDateForInput(data.rehearsalEnd)}
                onChange={(e) => {
                  onUpdate({
                    rehearsalEnd: e.target.value ? new Date(e.target.value) : null,
                  });
                }}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="performanceStart">Performance Start Date</Label>
              <Input
                id="performanceStart"
                type="date"
                value={formatDateForInput(data.performanceStart)}
                onChange={(e) => {
                  onUpdate({
                    performanceStart: e.target.value ? new Date(e.target.value) : null,
                  });
                }}
              />
              <p className="text-muted-foreground text-xs">Opening night</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="performanceEnd">Performance End Date</Label>
              <Input
                id="performanceEnd"
                type="date"
                value={formatDateForInput(data.performanceEnd)}
                onChange={(e) => {
                  onUpdate({
                    performanceEnd: e.target.value ? new Date(e.target.value) : null,
                  });
                }}
              />
              <p className="text-muted-foreground text-xs">Closing night</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

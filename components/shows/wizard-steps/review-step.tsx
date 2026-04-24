"use client";

import { Badge } from "@/components/ui/badge";
import { SHOW_TYPE_OPTIONS, SHOW_STATUS_OPTIONS } from "@/lib/db/schema/shows";
import { UNION_STATUS_OPTIONS } from "@/lib/db/schema/producer-profiles";
import type { ShowCreate } from "@/lib/validations/shows";

interface Props {
  data: Partial<ShowCreate>;
}

function formatDate(date: Date | null | undefined): string {
  if (!date) return "Not set";
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));
}

export function ReviewStep({ data }: Props): React.ReactElement {
  const showType = SHOW_TYPE_OPTIONS.find((t) => t.value === data.type);
  const showStatus = SHOW_STATUS_OPTIONS.find((s) => s.value === data.status);
  const unionStatus = UNION_STATUS_OPTIONS.find((u) => u.value === data.unionStatus);

  return (
    <div className="space-y-6">
      <p className="text-muted-foreground text-sm">
        Review your production details before creating.
      </p>

      <div className="divide-y rounded-lg border">
        <div className="p-4">
          <h3 className="mb-3 text-sm font-medium text-gray-500">Basic Info</h3>
          <dl className="space-y-2">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Title</dt>
              <dd className="font-medium">{data.title ?? "Untitled"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Type</dt>
              <dd>
                <Badge variant="secondary">{showType?.label ?? "Play"}</Badge>
              </dd>
            </div>
            {data.description && (
              <div className="pt-2">
                <dt className="text-muted-foreground text-sm">Description</dt>
                <dd className="mt-1 text-sm">{data.description}</dd>
              </div>
            )}
          </dl>
        </div>

        <div className="p-4">
          <h3 className="mb-3 text-sm font-medium text-gray-500">Dates & Venue</h3>
          <dl className="space-y-2">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Venue</dt>
              <dd className="font-medium">{data.venue ?? "Not set"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Rehearsal Start</dt>
              <dd>{formatDate(data.rehearsalStart)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Performance Start</dt>
              <dd>{formatDate(data.performanceStart)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Performance End</dt>
              <dd>{formatDate(data.performanceEnd)}</dd>
            </div>
          </dl>
        </div>

        <div className="p-4">
          <h3 className="mb-3 text-sm font-medium text-gray-500">Settings</h3>
          <dl className="space-y-2">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Union Status</dt>
              <dd>{unionStatus?.label ?? "Both"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Status</dt>
              <dd>
                <Badge variant="secondary">{showStatus?.label ?? "Planning"}</Badge>
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Visibility</dt>
              <dd>{data.isPublic !== false ? "Public" : "Private"}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}

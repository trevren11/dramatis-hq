"use client";

import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Video, FileText, Image, Film, Music } from "lucide-react";
import type { AuditionCreate } from "@/lib/validations/auditions";
import type { Role } from "@/lib/db/schema/roles";
import { AUDITION_VISIBILITY_OPTIONS, AUDITION_STATUS_OPTIONS } from "@/lib/db/schema/auditions";

interface ReviewStepProps {
  data: Partial<AuditionCreate>;
  show: { id: string; title: string } | null;
  roles: Role[];
}

function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(dateStr));
}

function formatTime(time: string): string {
  const [hours, minutes] = time.split(":");
  const h = parseInt(hours ?? "0");
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${String(hour)}:${minutes ?? ""} ${ampm}`;
}

// eslint-disable-next-line complexity
export function ReviewStep({ data, show, roles }: ReviewStepProps): React.ReactElement {
  const auditionDates = data.auditionDates ?? [];
  const materials = data.materials ?? {};
  const selectedRoles = roles.filter((r) => data.roleIds?.includes(r.id));
  const visibility = AUDITION_VISIBILITY_OPTIONS.find((v) => v.value === data.visibility);
  const status = AUDITION_STATUS_OPTIONS.find((s) => s.value === data.status);

  return (
    <div className="space-y-6">
      <div className="border-border rounded-lg border p-4">
        <h3 className="mb-3 font-semibold">Basic Information</h3>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Production</dt>
            <dd>{show?.title ?? "Not selected"}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Title</dt>
            <dd>{data.title ?? "Not set"}</dd>
          </div>
          {data.description && (
            <div>
              <dt className="text-muted-foreground mb-1">Description</dt>
              <dd className="text-muted-foreground line-clamp-3">{data.description}</dd>
            </div>
          )}
        </dl>
      </div>

      <div className="border-border rounded-lg border p-4">
        <h3 className="mb-3 font-semibold">Location & Dates</h3>
        <dl className="space-y-3 text-sm">
          <div className="flex items-center gap-2">
            {data.isVirtual ? (
              <>
                <Video className="text-muted-foreground h-4 w-4" />
                <span>Virtual Audition</span>
              </>
            ) : (
              <>
                <MapPin className="text-muted-foreground h-4 w-4" />
                <span>{data.location ?? "Location TBD"}</span>
              </>
            )}
          </div>

          {data.submissionDeadline && (
            <div className="flex items-center gap-2">
              <Calendar className="text-muted-foreground h-4 w-4" />
              <span>
                Deadline:{" "}
                {new Intl.DateTimeFormat("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                }).format(new Date(data.submissionDeadline))}
              </span>
            </div>
          )}

          {auditionDates.length > 0 && (
            <div>
              <dt className="text-muted-foreground mb-2">Audition Dates</dt>
              <dd className="space-y-1">
                {auditionDates.map((date, i) => (
                  <div key={i} className="text-sm">
                    {date.date && formatDate(date.date)}
                    {date.startTime && ` at ${formatTime(date.startTime)}`}
                    {date.endTime && ` - ${formatTime(date.endTime)}`}
                  </div>
                ))}
              </dd>
            </div>
          )}
        </dl>
      </div>

      {selectedRoles.length > 0 && (
        <div className="border-border rounded-lg border p-4">
          <h3 className="mb-3 font-semibold">Roles Being Cast</h3>
          <div className="flex flex-wrap gap-2">
            {selectedRoles.map((role) => (
              <Badge key={role.id} variant="secondary">
                {role.name}
              </Badge>
            ))}
          </div>
        </div>
      )}

      <div className="border-border rounded-lg border p-4">
        <h3 className="mb-3 font-semibold">Required Materials</h3>
        <div className="flex flex-wrap gap-3">
          {materials.requireHeadshot && (
            <div className="flex items-center gap-1.5 text-sm">
              <Image className="text-muted-foreground h-4 w-4" />
              <span>Headshot</span>
            </div>
          )}
          {materials.requireResume && (
            <div className="flex items-center gap-1.5 text-sm">
              <FileText className="text-muted-foreground h-4 w-4" />
              <span>Resume</span>
            </div>
          )}
          {materials.requireVideo && (
            <div className="flex items-center gap-1.5 text-sm">
              <Film className="text-muted-foreground h-4 w-4" />
              <span>Video</span>
            </div>
          )}
          {materials.requireAudio && (
            <div className="flex items-center gap-1.5 text-sm">
              <Music className="text-muted-foreground h-4 w-4" />
              <span>Audio</span>
            </div>
          )}
          {!materials.requireHeadshot &&
            !materials.requireResume &&
            !materials.requireVideo &&
            !materials.requireAudio && (
              <span className="text-muted-foreground text-sm">None required</span>
            )}
        </div>
      </div>

      <div className="border-border rounded-lg border p-4">
        <h3 className="mb-3 font-semibold">Settings</h3>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Visibility</dt>
            <dd>{visibility?.label ?? "Public"}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Status</dt>
            <dd>
              <Badge variant={data.status === "open" ? "success" : "secondary"}>
                {status?.label ?? "Draft"}
              </Badge>
            </dd>
          </div>
          {data.publishAt && (
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Scheduled Publish</dt>
              <dd>
                {new Intl.DateTimeFormat("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                }).format(new Date(data.publishAt))}
              </dd>
            </div>
          )}
        </dl>
      </div>
    </div>
  );
}

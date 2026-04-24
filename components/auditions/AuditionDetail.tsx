"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Calendar,
  MapPin,
  Video,
  Building2,
  Clock,
  Users,
  FileText,
  Image,
  Film,
  Music,
  ExternalLink,
  Share2,
} from "lucide-react";
import Link from "next/link";
import type { Audition } from "@/lib/db/schema/auditions";
import type { Role } from "@/lib/db/schema/roles";
import { ROLE_TYPE_OPTIONS } from "@/lib/db/schema/roles";

interface AuditionDetailProps {
  audition: Audition & { isDeadlinePassed: boolean; applicationCount: number };
  show: {
    id: string;
    title: string;
    type?: string | null;
    venue?: string | null;
    description?: string | null;
    performanceStart?: Date | null;
    performanceEnd?: Date | null;
  } | null;
  organization: {
    id: string;
    companyName: string;
    slug: string;
    logoUrl?: string | null;
    description?: string | null;
    location?: string | null;
    website?: string | null;
  } | null;
  roles: Role[];
  isLoggedIn: boolean;
  hasTalentProfile: boolean;
  hasApplied: boolean;
}

function formatDate(date: Date | string | null): string {
  if (!date) return "";
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

function formatTime(time: string): string {
  const [hours, minutes] = time.split(":");
  const h = parseInt(hours ?? "0");
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${String(hour)}:${minutes ?? ""} ${ampm}`;
}

// eslint-disable-next-line complexity
export function AuditionDetail({
  audition,
  show,
  organization,
  roles,
  isLoggedIn,
  hasTalentProfile,
  hasApplied,
}: AuditionDetailProps): React.ReactElement {
  const auditionDates = audition.auditionDates;
  const materials = audition.materials ?? {};

  const handleShare = async (): Promise<void> => {
    if (typeof navigator.share === "function") {
      await navigator.share({
        title: audition.title,
        text: `Check out this audition: ${audition.title}`,
        url: window.location.href,
      });
    } else {
      await navigator.clipboard.writeText(window.location.href);
    }
  };

  const canApply = !audition.isDeadlinePassed && audition.status === "open";

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Main Content */}
      <div className="space-y-6 lg:col-span-2">
        {/* Header */}
        <div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">{audition.title}</h1>
              {show && <p className="text-muted-foreground mt-1 text-lg">for {show.title}</p>}
            </div>
            <div className="flex items-center gap-2">
              {audition.isVirtual && (
                <Badge variant="secondary">
                  <Video className="mr-1 h-3 w-3" />
                  Virtual
                </Badge>
              )}
              {audition.isDeadlinePassed && <Badge variant="destructive">Deadline Passed</Badge>}
              {audition.status === "closed" && <Badge variant="secondary">Closed</Badge>}
            </div>
          </div>

          {/* Quick info */}
          <div className="text-muted-foreground mt-4 flex flex-wrap gap-4 text-sm">
            {audition.submissionDeadline && (
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                <span>Deadline: {formatDate(audition.submissionDeadline)}</span>
              </div>
            )}
            {!audition.isVirtual && audition.location && (
              <div className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                <span>{audition.location}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              <span>{audition.applicationCount} applied</span>
            </div>
          </div>
        </div>

        {/* Description */}
        {audition.description && (
          <Card>
            <CardHeader>
              <CardTitle>About This Audition</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{audition.description}</p>
            </CardContent>
          </Card>
        )}

        {/* Audition Dates */}
        {auditionDates && auditionDates.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Audition Dates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {auditionDates.map((date, index) => (
                  <div
                    key={index}
                    className="border-border flex items-center gap-3 border-b pb-3 last:border-0 last:pb-0"
                  >
                    <Calendar className="text-muted-foreground h-5 w-5" />
                    <div>
                      <p className="font-medium">{formatDate(date.date)}</p>
                      <p className="text-muted-foreground text-sm">
                        {formatTime(date.startTime)}
                        {date.endTime && ` - ${formatTime(date.endTime)}`}
                      </p>
                      {date.notes && (
                        <p className="text-muted-foreground mt-1 text-sm">{date.notes}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Roles */}
        {roles.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Roles Being Cast</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {roles.map((role) => {
                  const roleType = ROLE_TYPE_OPTIONS.find((t) => t.value === role.type);
                  return (
                    <div
                      key={role.id}
                      className="border-border border-b pb-4 last:border-0 last:pb-0"
                    >
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{role.name}</h4>
                        <Badge variant="outline">{roleType?.label ?? "Supporting"}</Badge>
                        {role.positionCount && role.positionCount > 1 && (
                          <span className="text-muted-foreground text-sm">
                            ({role.positionCount} positions)
                          </span>
                        )}
                      </div>
                      {role.description && (
                        <p className="text-muted-foreground mt-1 text-sm">{role.description}</p>
                      )}
                      <div className="text-muted-foreground mt-2 flex flex-wrap gap-3 text-xs">
                        {(role.ageRangeMin ?? role.ageRangeMax) && (
                          <span>
                            Age: {role.ageRangeMin ?? "?"}-{role.ageRangeMax ?? "?"}
                          </span>
                        )}
                        {role.vocalRange && <span>Vocal: {role.vocalRange}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Materials Required */}
        <Card>
          <CardHeader>
            <CardTitle>Required Materials</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {materials.requireHeadshot && (
                <div className="flex items-start gap-3">
                  <Image className="text-muted-foreground mt-0.5 h-5 w-5" />
                  <div>
                    <p className="font-medium">Headshot</p>
                    <p className="text-muted-foreground text-sm">Professional headshot required</p>
                  </div>
                </div>
              )}
              {materials.requireResume && (
                <div className="flex items-start gap-3">
                  <FileText className="text-muted-foreground mt-0.5 h-5 w-5" />
                  <div>
                    <p className="font-medium">Resume</p>
                    <p className="text-muted-foreground text-sm">
                      Acting/performance resume required
                    </p>
                  </div>
                </div>
              )}
              {materials.requireVideo && (
                <div className="flex items-start gap-3">
                  <Film className="text-muted-foreground mt-0.5 h-5 w-5" />
                  <div>
                    <p className="font-medium">Video Submission</p>
                    {materials.videoInstructions && (
                      <p className="text-muted-foreground text-sm">{materials.videoInstructions}</p>
                    )}
                  </div>
                </div>
              )}
              {materials.requireAudio && (
                <div className="flex items-start gap-3">
                  <Music className="text-muted-foreground mt-0.5 h-5 w-5" />
                  <div>
                    <p className="font-medium">Audio Submission</p>
                    {materials.audioInstructions && (
                      <p className="text-muted-foreground text-sm">{materials.audioInstructions}</p>
                    )}
                  </div>
                </div>
              )}
              {!materials.requireHeadshot &&
                !materials.requireResume &&
                !materials.requireVideo &&
                !materials.requireAudio && (
                  <p className="text-muted-foreground text-sm">No specific materials required</p>
                )}
            </div>
            {materials.additionalInstructions && (
              <div className="border-border mt-4 border-t pt-4">
                <p className="mb-1 font-medium">Additional Instructions</p>
                <p className="text-muted-foreground text-sm whitespace-pre-wrap">
                  {materials.additionalInstructions}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Apply Card */}
        <Card>
          <CardContent className="pt-6">
            {hasApplied ? (
              <div className="text-center">
                <Badge variant="success" className="mb-2">
                  Applied
                </Badge>
                <p className="text-muted-foreground text-sm">
                  You have already applied to this audition
                </p>
                <Button asChild variant="outline" className="mt-4 w-full">
                  <Link href="/talent/applications">View My Applications</Link>
                </Button>
              </div>
            ) : canApply ? (
              <>
                {isLoggedIn ? (
                  hasTalentProfile ? (
                    <Button asChild className="w-full">
                      <Link href={`/auditions/${audition.slug}/apply`}>Apply Now</Link>
                    </Button>
                  ) : (
                    <div className="text-center">
                      <p className="text-muted-foreground mb-4 text-sm">
                        Complete your talent profile to apply
                      </p>
                      <Button asChild className="w-full">
                        <Link href="/talent/profile/wizard">Complete Profile</Link>
                      </Button>
                    </div>
                  )
                ) : (
                  <div className="text-center">
                    <p className="text-muted-foreground mb-4 text-sm">
                      Sign in or create an account to apply
                    </p>
                    <Button asChild className="w-full">
                      <Link href="/login">Sign In to Apply</Link>
                    </Button>
                    <Button asChild variant="outline" className="mt-2 w-full">
                      <Link href="/signup/talent">Create Account</Link>
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center">
                <p className="text-muted-foreground text-sm">
                  {audition.isDeadlinePassed
                    ? "The deadline for this audition has passed"
                    : "This audition is no longer accepting applications"}
                </p>
              </div>
            )}

            <Button variant="outline" className="mt-4 w-full" onClick={() => void handleShare()}>
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </Button>
          </CardContent>
        </Card>

        {/* Organization Card */}
        {organization && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Presented by</CardTitle>
            </CardHeader>
            <CardContent>
              <Link
                href={`/company/${organization.slug}`}
                className="flex items-center gap-3 transition-opacity hover:opacity-80"
              >
                {organization.logoUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={organization.logoUrl}
                    alt={organization.companyName}
                    className="h-12 w-12 rounded object-cover"
                  />
                ) : (
                  <div className="bg-muted flex h-12 w-12 items-center justify-center rounded">
                    <Building2 className="text-muted-foreground h-6 w-6" />
                  </div>
                )}
                <div>
                  <p className="font-semibold">{organization.companyName}</p>
                  {organization.location && (
                    <p className="text-muted-foreground text-sm">{organization.location}</p>
                  )}
                </div>
              </Link>
              {organization.description && (
                <p className="text-muted-foreground mt-3 line-clamp-3 text-sm">
                  {organization.description}
                </p>
              )}
              {organization.website && (
                <a
                  href={organization.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary mt-3 inline-flex items-center gap-1 text-sm hover:underline"
                >
                  <ExternalLink className="h-3 w-3" />
                  Visit Website
                </a>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

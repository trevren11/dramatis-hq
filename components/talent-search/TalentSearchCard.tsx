"use client";

import React, { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  MapPin,
  Music,
  User,
  MessageSquare,
  Bookmark,
  MoreHorizontal,
  ExternalLink,
  Plus,
} from "lucide-react";
import { heightToFeetInches } from "@/lib/validations/physical-attributes";

export interface TalentSearchCardData {
  profile: {
    id: string;
    firstName: string;
    lastName: string;
    stageName: string | null;
    location: string | null;
    bio: string | null;
    heightInches: number | null;
    ageRangeLow: number | null;
    ageRangeHigh: number | null;
    hairColor: string | null;
    eyeColor: string | null;
    vocalRange: string | null;
    unionMemberships: string[];
  };
  primaryHeadshot: string | null;
  skills: { name: string; category: string }[];
  matchPercentage: number;
}

interface TalentSearchCardProps {
  talent: TalentSearchCardData;
  onViewProfile?: (id: string) => void;
  onMessage?: (id: string) => void;
  onSave?: (id: string) => void;
  onAddToList?: (id: string) => void;
  isSaved?: boolean;
  compact?: boolean;
}

function getInitials(firstName: string, lastName: string): string {
  return `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();
}

function formatHeight(inches: number): string {
  const { feet, inches: remainingInches } = heightToFeetInches(inches);
  return `${String(feet)}'${String(remainingInches)}"`;
}

function formatAgeRange(low: number | null, high: number | null): string | null {
  if (low == null && high == null) return null;
  if (low === high) return String(low);
  const lowStr = low != null ? String(low) : "?";
  const highStr = high != null ? String(high) : "?";
  return `${lowStr}-${highStr}`;
}

function formatVocalRange(range: string | null): string | null {
  if (!range || range === "not_applicable") return null;
  return range.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

const UNION_BADGE_COLORS: Record<string, "default" | "secondary" | "success"> = {
  AEA: "success",
  "SAG-AFTRA": "success",
  EMC: "secondary",
  "Non-Union": "default",
};

// eslint-disable-next-line complexity
export function TalentSearchCard({
  talent,
  onViewProfile,
  onMessage,
  onSave,
  onAddToList,
  isSaved = false,
  compact = false,
}: TalentSearchCardProps): React.ReactElement {
  const [isExpanded, setIsExpanded] = useState(false);
  const { profile, primaryHeadshot, skills, matchPercentage } = talent;
  const displayName = profile.stageName ?? `${profile.firstName} ${profile.lastName}`;
  const ageRange = formatAgeRange(profile.ageRangeLow, profile.ageRangeHigh);
  const vocalRange = formatVocalRange(profile.vocalRange);

  if (compact) {
    return (
      <Card className="group transition-shadow hover:shadow-md">
        <CardContent className="p-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 shrink-0">
              <AvatarImage src={primaryHeadshot ?? undefined} alt={displayName} />
              <AvatarFallback>{getInitials(profile.firstName, profile.lastName)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate font-medium">{displayName}</p>
                {matchPercentage === 100 && (
                  <Badge variant="success" className="text-xs">
                    100%
                  </Badge>
                )}
              </div>
              {profile.location && (
                <p className="text-muted-foreground flex items-center gap-1 truncate text-xs">
                  <MapPin className="h-3 w-3 shrink-0" />
                  {profile.location}
                </p>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {profile.unionMemberships.slice(0, 1).map((union) => (
                <Badge
                  key={union}
                  variant={UNION_BADGE_COLORS[union] ?? "default"}
                  className="text-xs"
                >
                  {union}
                </Badge>
              ))}
              <Button variant="ghost" size="sm" onClick={() => onViewProfile?.(profile.id)}>
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        "group cursor-pointer transition-shadow hover:shadow-md",
        isExpanded && "ring-primary ring-2"
      )}
      onClick={() => {
        setIsExpanded(!isExpanded);
      }}
    >
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* Headshot */}
          <div className="shrink-0">
            <Avatar className="h-24 w-24 rounded-lg">
              <AvatarImage
                src={primaryHeadshot ?? undefined}
                alt={displayName}
                className="object-cover"
              />
              <AvatarFallback className="rounded-lg text-lg">
                {getInitials(profile.firstName, profile.lastName)}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Info */}
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="truncate font-semibold">{displayName}</h3>
                  {matchPercentage > 0 && matchPercentage < 100 && (
                    <Badge variant="secondary" className="text-xs">
                      {matchPercentage}% match
                    </Badge>
                  )}
                  {matchPercentage === 100 && (
                    <Badge variant="success" className="text-xs">
                      Perfect match
                    </Badge>
                  )}
                </div>
                {profile.stageName && (
                  <p className="text-muted-foreground text-sm">
                    {profile.firstName} {profile.lastName}
                  </p>
                )}
              </div>

              {/* Actions dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger
                  asChild
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                >
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewProfile?.(profile.id);
                    }}
                  >
                    <User className="mr-2 h-4 w-4" />
                    View Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onMessage?.(profile.id);
                    }}
                  >
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Send Message
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onSave?.(profile.id);
                    }}
                  >
                    <Bookmark className={cn("mr-2 h-4 w-4", isSaved && "fill-current")} />
                    {isSaved ? "Saved" : "Save"}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddToList?.(profile.id);
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add to List
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Location */}
            {profile.location && (
              <p className="text-muted-foreground mt-1 flex items-center gap-1 text-sm">
                <MapPin className="h-3 w-3 shrink-0" />
                {profile.location}
              </p>
            )}

            {/* Physical attributes */}
            <div className="mt-2 flex flex-wrap gap-2 text-sm">
              {profile.heightInches && (
                <span className="text-muted-foreground">{formatHeight(profile.heightInches)}</span>
              )}
              {ageRange && <span className="text-muted-foreground">Age: {ageRange}</span>}
              {vocalRange && (
                <span className="text-muted-foreground flex items-center gap-1">
                  <Music className="h-3 w-3" />
                  {vocalRange}
                </span>
              )}
            </div>

            {/* Union badges */}
            {profile.unionMemberships.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {profile.unionMemberships.map((union) => (
                  <Badge
                    key={union}
                    variant={UNION_BADGE_COLORS[union] ?? "default"}
                    className="text-xs"
                  >
                    {union}
                  </Badge>
                ))}
              </div>
            )}

            {/* Skills */}
            {skills.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {skills.slice(0, 5).map((skill) => (
                  <Badge key={skill.name} variant="outline" className="text-xs">
                    {skill.name}
                  </Badge>
                ))}
                {skills.length > 5 && (
                  <Badge variant="outline" className="text-xs">
                    +{skills.length - 5}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Expanded content */}
        {isExpanded && profile.bio && (
          <div className="border-border mt-4 border-t pt-4">
            <p className="text-muted-foreground line-clamp-3 text-sm">{profile.bio}</p>
            <div className="mt-3 flex gap-2">
              <Button
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onViewProfile?.(profile.id);
                }}
              >
                View Full Profile
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onMessage?.(profile.id);
                }}
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                Message
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function TalentSearchCardSkeleton({
  compact = false,
}: {
  compact?: boolean;
}): React.ReactElement {
  if (compact) {
    return (
      <Card>
        <CardContent className="p-3">
          <div className="flex animate-pulse items-center gap-3">
            <div className="bg-muted h-12 w-12 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="bg-muted h-4 w-24 rounded" />
              <div className="bg-muted h-3 w-16 rounded" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex animate-pulse gap-4">
          <div className="bg-muted h-24 w-24 rounded-lg" />
          <div className="flex-1 space-y-3">
            <div className="bg-muted h-5 w-32 rounded" />
            <div className="bg-muted h-4 w-24 rounded" />
            <div className="flex gap-2">
              <div className="bg-muted h-4 w-12 rounded" />
              <div className="bg-muted h-4 w-16 rounded" />
            </div>
            <div className="flex gap-1">
              <div className="bg-muted h-5 w-12 rounded-full" />
              <div className="bg-muted h-5 w-16 rounded-full" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

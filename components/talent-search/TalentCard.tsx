"use client";

import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MapPin,
  MoreHorizontal,
  MessageSquare,
  Bookmark,
  ExternalLink,
  ListPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface TalentCardData {
  id: string;
  firstName: string;
  lastName: string;
  stageName?: string | null;
  location?: string | null;
  bio?: string | null;
  unionMemberships?: string[] | null;
  headshot?: {
    url: string;
    thumbnailUrl?: string | null;
  } | null;
  skills: string[];
  matchPercentage: number;
  publicProfileSlug?: string | null;
}

interface TalentCardProps {
  talent: TalentCardData;
  onPreview?: (talent: TalentCardData) => void;
  onMessage?: (talent: TalentCardData) => void;
  onAddToList?: (talent: TalentCardData) => void;
  onSave?: (talent: TalentCardData) => void;
  isSelected?: boolean;
  viewMode?: "grid" | "list";
}

// eslint-disable-next-line complexity
export function TalentCard({
  talent,
  onPreview,
  onMessage,
  onAddToList,
  onSave,
  isSelected = false,
  viewMode = "grid",
}: TalentCardProps): React.ReactElement {
  const displayName = talent.stageName ?? `${talent.firstName} ${talent.lastName}`;
  const initials = `${talent.firstName[0] ?? ""}${talent.lastName[0] ?? ""}`.toUpperCase();
  const headshotUrl = talent.headshot?.thumbnailUrl ?? talent.headshot?.url;

  if (viewMode === "list") {
    return (
      <Card
        className={cn(
          "cursor-pointer transition-all hover:shadow-md",
          isSelected && "ring-primary ring-2"
        )}
        onClick={() => onPreview?.(talent)}
      >
        <CardContent className="flex items-center gap-4 p-4">
          {/* Headshot */}
          <div className="bg-muted relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-full">
            {headshotUrl ? (
              <Image
                src={headshotUrl}
                alt={displayName}
                fill
                className="object-cover"
                sizes="64px"
              />
            ) : (
              <div className="text-muted-foreground flex h-full w-full items-center justify-center text-lg font-medium">
                {initials}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="truncate font-semibold">{displayName}</h3>
              {talent.matchPercentage >= 80 && (
                <Badge variant="success" className="flex-shrink-0">
                  {talent.matchPercentage}% Match
                </Badge>
              )}
            </div>

            {talent.location && (
              <div className="text-muted-foreground flex items-center gap-1 text-sm">
                <MapPin className="h-3 w-3" />
                <span className="truncate">{talent.location}</span>
              </div>
            )}

            <div className="mt-1 flex flex-wrap gap-1">
              {talent.unionMemberships?.slice(0, 2).map((union) => (
                <Badge key={union} variant="outline" className="text-xs">
                  {union}
                </Badge>
              ))}
              {talent.skills.slice(0, 3).map((skill) => (
                <Badge key={skill} variant="secondary" className="text-xs">
                  {skill}
                </Badge>
              ))}
              {talent.skills.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{talent.skills.length - 3}
                </Badge>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onMessage?.(talent);
              }}
            >
              <MessageSquare className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onAddToList?.(talent);
              }}
            >
              <ListPlus className="h-4 w-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger
                asChild
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onSave?.(talent)}>
                  <Bookmark className="mr-2 h-4 w-4" />
                  Save for later
                </DropdownMenuItem>
                {talent.publicProfileSlug && (
                  <DropdownMenuItem asChild>
                    <Link href={`/talent/${talent.publicProfileSlug}`} target="_blank">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      View full profile
                    </Link>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Grid view
  return (
    <Card
      className={cn(
        "group cursor-pointer overflow-hidden transition-all hover:shadow-md",
        isSelected && "ring-primary ring-2"
      )}
      onClick={() => onPreview?.(talent)}
    >
      {/* Headshot */}
      <div className="bg-muted relative aspect-[3/4]">
        {headshotUrl ? (
          <Image
            src={headshotUrl}
            alt={displayName}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="text-muted-foreground flex h-full w-full items-center justify-center text-4xl font-medium">
            {initials}
          </div>
        )}

        {/* Match percentage badge */}
        {talent.matchPercentage >= 50 && (
          <Badge
            variant={talent.matchPercentage >= 80 ? "success" : "secondary"}
            className="absolute top-2 right-2"
          >
            {talent.matchPercentage}%
          </Badge>
        )}

        {/* Quick actions overlay */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3 opacity-0 transition-opacity group-hover:opacity-100">
          <div className="flex justify-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={(e) => {
                e.stopPropagation();
                onMessage?.(talent);
              }}
            >
              <MessageSquare className="mr-1 h-3 w-3" />
              Message
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={(e) => {
                e.stopPropagation();
                onAddToList?.(talent);
              }}
            >
              <ListPlus className="mr-1 h-3 w-3" />
              Add
            </Button>
          </div>
        </div>
      </div>

      <CardContent className="p-3">
        {/* Name and location */}
        <h3 className="truncate font-semibold">{displayName}</h3>
        {talent.location && (
          <div className="text-muted-foreground flex items-center gap-1 text-sm">
            <MapPin className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{talent.location}</span>
          </div>
        )}

        {/* Union badges */}
        {talent.unionMemberships && talent.unionMemberships.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {talent.unionMemberships.slice(0, 2).map((union) => (
              <Badge key={union} variant="outline" className="text-xs">
                {union}
              </Badge>
            ))}
          </div>
        )}

        {/* Skills */}
        <div className="mt-2 flex flex-wrap gap-1">
          {talent.skills.slice(0, 3).map((skill) => (
            <Badge key={skill} variant="secondary" className="text-xs">
              {skill}
            </Badge>
          ))}
          {talent.skills.length > 3 && (
            <Badge variant="secondary" className="text-xs">
              +{talent.skills.length - 3}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

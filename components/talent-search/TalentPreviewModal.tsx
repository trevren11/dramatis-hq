"use client";

import Image from "next/image";
import Link from "next/link";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { MapPin, MessageSquare, ListPlus, ExternalLink, User, Sparkles } from "lucide-react";
import type { TalentCardData } from "./TalentCard";

interface TalentPreviewModalProps {
  talent: TalentCardData | null;
  isOpen: boolean;
  onClose: () => void;
  onMessage?: (talent: TalentCardData) => void;
  onAddToList?: (talent: TalentCardData) => void;
}

// eslint-disable-next-line complexity
export function TalentPreviewModal({
  talent,
  isOpen,
  onClose,
  onMessage,
  onAddToList,
}: TalentPreviewModalProps): React.ReactElement | null {
  if (!talent) return null;

  const displayName = talent.stageName ?? `${talent.firstName} ${talent.lastName}`;
  const initials = `${talent.firstName[0] ?? ""}${talent.lastName[0] ?? ""}`.toUpperCase();
  const headshotUrl = talent.headshot?.url ?? talent.headshot?.thumbnailUrl;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="sr-only">Talent Preview: {displayName}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-6 sm:flex-row">
          {/* Headshot */}
          <div className="flex-shrink-0">
            <div className="bg-muted relative mx-auto h-48 w-36 overflow-hidden rounded-lg sm:h-64 sm:w-48">
              {headshotUrl ? (
                <Image
                  src={headshotUrl}
                  alt={displayName}
                  fill
                  className="object-cover"
                  sizes="192px"
                />
              ) : (
                <div className="text-muted-foreground flex h-full w-full items-center justify-center text-5xl font-medium">
                  {initials}
                </div>
              )}
            </div>

            {/* Match percentage */}
            {talent.matchPercentage > 0 && (
              <div className="mt-3 text-center">
                <Badge
                  variant={talent.matchPercentage >= 80 ? "success" : "secondary"}
                  className="text-sm"
                >
                  {talent.matchPercentage}% Match
                </Badge>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1">
            <ScrollArea className="h-[300px] pr-4 sm:h-[350px]">
              <div className="space-y-4">
                {/* Header */}
                <div>
                  <h2 className="text-2xl font-bold">{displayName}</h2>
                  {talent.stageName && (
                    <p className="text-muted-foreground text-sm">
                      {talent.firstName} {talent.lastName}
                    </p>
                  )}
                  {talent.location && (
                    <div className="text-muted-foreground mt-1 flex items-center gap-1 text-sm">
                      <MapPin className="h-4 w-4" />
                      {talent.location}
                    </div>
                  )}
                </div>

                <Separator />

                {/* Union memberships */}
                {talent.unionMemberships && talent.unionMemberships.length > 0 && (
                  <div>
                    <h3 className="mb-2 flex items-center gap-2 text-sm font-medium">
                      <User className="h-4 w-4" />
                      Union Memberships
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {talent.unionMemberships.map((union) => (
                        <Badge key={union} variant="outline">
                          {union}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Bio */}
                {talent.bio && (
                  <div>
                    <h3 className="mb-2 text-sm font-medium">About</h3>
                    <p className="text-muted-foreground text-sm whitespace-pre-wrap">
                      {talent.bio}
                    </p>
                  </div>
                )}

                {/* Skills */}
                {talent.skills.length > 0 && (
                  <div>
                    <h3 className="mb-2 flex items-center gap-2 text-sm font-medium">
                      <Sparkles className="h-4 w-4" />
                      Skills
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {talent.skills.map((skill) => (
                        <Badge key={skill} variant="secondary">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Actions */}
            <div className="mt-4 flex flex-wrap gap-2">
              <Button onClick={() => onMessage?.(talent)}>
                <MessageSquare className="mr-2 h-4 w-4" />
                Message
              </Button>
              <Button variant="outline" onClick={() => onAddToList?.(talent)}>
                <ListPlus className="mr-2 h-4 w-4" />
                Add to List
              </Button>
              {talent.publicProfileSlug && (
                <Button variant="outline" asChild>
                  <Link href={`/talent/${talent.publicProfileSlug}`} target="_blank">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Full Profile
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

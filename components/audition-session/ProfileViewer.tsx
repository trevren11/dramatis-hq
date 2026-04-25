"use client";

import React, { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { RotateCcw, User, FileText, ChevronLeft, ChevronRight } from "lucide-react";

interface TalentData {
  id: string;
  name: string;
  email: string;
  unionMemberships: string[] | null;
  heightInches: number | null;
  hairColor: string | null;
  eyeColor: string | null;
  gender: string | null;
  ageRangeLow: number | null;
  ageRangeHigh: number | null;
  bio: string | null;
  headshotUrl: string | null;
}

interface ProfileViewerProps {
  talent: TalentData | null;
  queueNumber: number | null;
  onPrevious?: () => void;
  onNext?: () => void;
  className?: string;
}

function formatHeight(inches: number | null): string {
  if (!inches) return "—";
  const feet = Math.floor(inches / 12);
  const remainingInches = inches % 12;
  return `${String(feet)}'${String(remainingInches)}"`;
}

function formatAgeRange(low: number | null, high: number | null): string {
  if (!low && !high) return "—";
  if (low && high) return `${String(low)}-${String(high)}`;
  if (low) return `${String(low)}+`;
  return `Up to ${String(high ?? 0)}`;
}

/**
 * Profile viewer with headshot/resume flip
 * Supports keyboard navigation and swipe gestures
 */
export function ProfileViewer({
  talent,
  queueNumber,
  onPrevious,
  onNext,
  className,
}: ProfileViewerProps): React.ReactElement {
  const [showResume, setShowResume] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  // Reset to headshot when talent changes
  useEffect(() => {
    setShowResume(false);
  }, [talent?.id]);

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent): void {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        setShowResume((prev) => !prev);
      }
      if (e.key === "ArrowLeft" && onPrevious) {
        onPrevious();
      }
      if (e.key === "ArrowRight" && onNext) {
        onNext();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onPrevious, onNext]);

  // Touch handlers for swipe
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchStart(e.touches[0]?.clientX ?? null);
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (touchStart === null) return;

      const touchEnd = e.changedTouches[0]?.clientX ?? 0;
      const diff = touchStart - touchEnd;

      if (Math.abs(diff) > 50) {
        if (diff > 0 && onNext) {
          onNext();
        } else if (diff < 0 && onPrevious) {
          onPrevious();
        }
      }

      setTouchStart(null);
    },
    [touchStart, onPrevious, onNext]
  );

  if (!talent) {
    return (
      <Card className={cn("flex items-center justify-center", className)}>
        <CardContent className="text-muted-foreground py-12 text-center">
          <User className="mx-auto mb-4 h-12 w-12 opacity-50" />
          <p>Select a talent from the queue</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={cn("relative overflow-hidden", className)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Queue number badge */}
      {queueNumber && (
        <Badge variant="secondary" className="absolute top-4 left-4 z-10 text-lg font-bold">
          #{queueNumber}
        </Badge>
      )}

      {/* Flip button */}
      <Button
        variant="secondary"
        size="sm"
        className="absolute top-4 right-4 z-10"
        onClick={() => {
          setShowResume((prev) => !prev);
        }}
      >
        {showResume ? (
          <>
            <User className="mr-2 h-4 w-4" />
            Headshot
          </>
        ) : (
          <>
            <FileText className="mr-2 h-4 w-4" />
            Resume
          </>
        )}
      </Button>

      {/* Content */}
      <CardContent className="p-0">
        <div
          role="button"
          tabIndex={0}
          aria-pressed={showResume}
          aria-label={showResume ? "Show headshot" : "Show resume"}
          className={cn(
            "relative cursor-pointer transition-all duration-300",
            showResume && "rotate-y-180"
          )}
          onClick={() => {
            setShowResume((prev) => !prev);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setShowResume((prev) => !prev);
            }
          }}
        >
          {!showResume ? (
            /* Headshot View */
            <div className="flex flex-col">
              <div className="bg-muted relative aspect-[3/4] w-full">
                {talent.headshotUrl ? (
                  <Image
                    src={talent.headshotUrl}
                    alt={talent.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <User className="text-muted-foreground h-24 w-24" />
                  </div>
                )}
              </div>
              <div className="p-4">
                <h2 className="text-2xl font-bold">{talent.name}</h2>
                <p className="text-muted-foreground text-sm">{talent.email}</p>
                <div className="text-muted-foreground mt-2 text-xs">
                  Click or press Space to flip to resume
                </div>
              </div>
            </div>
          ) : (
            /* Resume View */
            <div className="min-h-[500px] p-6">
              <div className="mb-6 border-b pb-4">
                <h2 className="text-2xl font-bold">{talent.name}</h2>
                {talent.unionMemberships && talent.unionMemberships.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {talent.unionMemberships.map((union) => (
                      <Badge key={union} variant="outline">
                        {union}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Physical Attributes */}
              <div className="mb-6">
                <h3 className="text-muted-foreground mb-2 text-sm font-semibold tracking-wide uppercase">
                  Physical Attributes
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Height:</span>{" "}
                    {formatHeight(talent.heightInches)}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Age Range:</span>{" "}
                    {formatAgeRange(talent.ageRangeLow, talent.ageRangeHigh)}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Hair:</span> {talent.hairColor ?? "—"}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Eyes:</span> {talent.eyeColor ?? "—"}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Gender:</span> {talent.gender ?? "—"}
                  </div>
                </div>
              </div>

              {/* Bio */}
              {talent.bio && (
                <div className="mb-6">
                  <h3 className="text-muted-foreground mb-2 text-sm font-semibold tracking-wide uppercase">
                    Bio
                  </h3>
                  <p className="text-sm leading-relaxed">{talent.bio}</p>
                </div>
              )}

              <div className="text-muted-foreground mt-4 text-xs">
                Click or press Space to flip back to headshot
              </div>
            </div>
          )}
        </div>
      </CardContent>

      {/* Navigation hints */}
      <div className="text-muted-foreground absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-4 text-xs">
        <span className="flex items-center gap-1">
          <ChevronLeft className="h-3 w-3" /> Previous
        </span>
        <span className="flex items-center gap-1">
          <RotateCcw className="h-3 w-3" /> Flip
        </span>
        <span className="flex items-center gap-1">
          Next <ChevronRight className="h-3 w-3" />
        </span>
      </div>
    </Card>
  );
}

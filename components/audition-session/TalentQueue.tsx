"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Users, ChevronLeft, ChevronRight, CheckCircle, XCircle, Clock } from "lucide-react";

type DecisionType = "callback" | "no_thanks" | "callback_role" | null;

interface QueueTalent {
  id: string;
  queueNumber: number | null;
  talent: {
    id: string;
    name: string;
    headshotUrl: string | null;
  };
  decision: {
    type: DecisionType;
  } | null;
  checkinStatus: "checked_in" | "in_room" | "completed";
}

interface TalentQueueProps {
  queue: QueueTalent[];
  currentIndex: number;
  onSelect: (index: number) => void;
  onPrevious: () => void;
  onNext: () => void;
  className?: string;
}

function getDecisionIcon(decision: DecisionType): React.ReactNode {
  if (!decision) return <Clock className="text-muted-foreground h-3 w-3" />;
  if (decision === "callback" || decision === "callback_role") {
    return <CheckCircle className="h-3 w-3 text-green-500" />;
  }
  return <XCircle className="h-3 w-3 text-red-500" />;
}

function getDecisionBadge(decision: DecisionType): React.ReactNode {
  if (!decision) return null;
  if (decision === "callback") {
    return (
      <Badge variant="default" className="bg-green-500 text-xs">
        CB
      </Badge>
    );
  }
  if (decision === "callback_role") {
    return (
      <Badge variant="default" className="bg-green-600 text-xs">
        CB+
      </Badge>
    );
  }
  return (
    <Badge variant="destructive" className="text-xs">
      No
    </Badge>
  );
}

/**
 * Talent queue sidebar for audition session
 * Shows checked-in talent with navigation
 */
export function TalentQueue({
  queue,
  currentIndex,
  onSelect,
  onPrevious,
  onNext,
  className,
}: TalentQueueProps): React.ReactElement {
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < queue.length - 1;

  return (
    <Card className={cn("flex h-full flex-col", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Queue
          </span>
          <Badge variant="secondary">{queue.length}</Badge>
        </CardTitle>
      </CardHeader>

      {/* Navigation controls */}
      <div className="flex items-center justify-between gap-2 border-b px-4 pb-3">
        <Button
          variant="outline"
          size="sm"
          onClick={onPrevious}
          disabled={!hasPrevious}
          className="flex-1"
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Prev
        </Button>
        <span className="text-muted-foreground text-sm">
          {queue.length > 0 ? `${String(currentIndex + 1)} / ${String(queue.length)}` : "0 / 0"}
        </span>
        <Button variant="outline" size="sm" onClick={onNext} disabled={!hasNext} className="flex-1">
          Next
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>

      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full">
          <div className="space-y-1 p-2">
            {queue.map((item, index) => (
              <button
                key={item.id}
                onClick={() => {
                  onSelect(index);
                }}
                className={cn(
                  "flex w-full items-center gap-3 rounded-md p-2 text-left transition-colors",
                  "hover:bg-accent",
                  index === currentIndex && "bg-accent ring-primary ring-2"
                )}
              >
                <div className="relative">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={item.talent.headshotUrl ?? undefined} />
                    <AvatarFallback className="text-xs">
                      {item.talent.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -right-1 -bottom-1">
                    {getDecisionIcon(item.decision?.type ?? null)}
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-xs font-medium">
                      #{item.queueNumber}
                    </span>
                    {getDecisionBadge(item.decision?.type ?? null)}
                  </div>
                  <p className="truncate text-sm font-medium">{item.talent.name}</p>
                </div>
              </button>
            ))}

            {queue.length === 0 && (
              <div className="text-muted-foreground py-8 text-center text-sm">
                No talent in queue
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

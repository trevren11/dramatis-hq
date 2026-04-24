/* eslint-disable @typescript-eslint/explicit-function-return-type, react/no-unescaped-entities */
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CheckCircle } from "lucide-react";

interface QueueNumberProps {
  queueNumber: number;
  auditionTitle?: string;
  message?: string;
  className?: string;
}

/**
 * Large queue number display for talent after check-in
 */
export function QueueNumber({
  queueNumber,
  auditionTitle,
  message = "You're checked in!",
  className,
}: QueueNumberProps) {
  return (
    <Card className={cn("text-center", className)}>
      <CardContent className="pt-8 pb-8">
        <div className="mb-4 flex items-center justify-center gap-2 text-green-600">
          <CheckCircle className="h-6 w-6" />
          <span className="font-semibold">{message}</span>
        </div>

        {auditionTitle && <p className="text-muted-foreground mb-6">{auditionTitle}</p>}

        <div className="mb-6 space-y-2">
          <p className="text-muted-foreground text-sm tracking-wide uppercase">Your Queue Number</p>
          <div className="flex items-center justify-center">
            <div className="bg-primary text-primary-foreground flex h-32 w-32 items-center justify-center rounded-full">
              <span className="text-6xl font-bold">{queueNumber}</span>
            </div>
          </div>
        </div>

        <div className="text-muted-foreground space-y-2 text-sm">
          <p>Please wait for your number to be called.</p>
          <p>You can close this page - we'll update your status when it's your turn.</p>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Compact queue number badge
 */
export function QueueNumberBadge({
  queueNumber,
  status,
  className,
}: {
  queueNumber: number;
  status?: "checked_in" | "in_room" | "completed";
  className?: string;
}) {
  const statusColors = {
    checked_in: "bg-yellow-500",
    in_room: "bg-blue-500",
    completed: "bg-green-500",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-3 py-1.5",
        "bg-primary text-primary-foreground font-medium",
        className
      )}
    >
      {status && <span className={cn("h-2 w-2 rounded-full", statusColors[status])} />}
      <span>#{queueNumber}</span>
    </div>
  );
}

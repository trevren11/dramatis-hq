"use client";

import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, XCircle, Star, Eye } from "lucide-react";
import { APPLICATION_STATUS_OPTIONS } from "@/lib/db/schema/auditions";

interface ApplicationStatusProps {
  status: "submitted" | "reviewed" | "callback" | "rejected" | "cast";
  className?: string;
}

const STATUS_CONFIG = {
  submitted: {
    icon: Clock,
    color: "info" as const,
    description: "Your application has been received and is awaiting review",
  },
  reviewed: {
    icon: Eye,
    color: "secondary" as const,
    description: "Your application has been reviewed by the casting team",
  },
  callback: {
    icon: Star,
    color: "warning" as const,
    description: "Congratulations! You have been selected for a callback",
  },
  rejected: {
    icon: XCircle,
    color: "destructive" as const,
    description: "Unfortunately, you were not selected for this role",
  },
  cast: {
    icon: CheckCircle,
    color: "success" as const,
    description: "Congratulations! You have been cast!",
  },
};

export function ApplicationStatus({
  status,
  className,
}: ApplicationStatusProps): React.ReactElement {
  const config = STATUS_CONFIG[status];
  const statusOption = APPLICATION_STATUS_OPTIONS.find((s) => s.value === status);
  const Icon = config.icon;

  return (
    <div className={className}>
      <Badge variant={config.color} className="gap-1.5">
        <Icon className="h-3 w-3" />
        {statusOption?.label ?? status}
      </Badge>
      <p className="text-muted-foreground mt-1 text-sm">{config.description}</p>
    </div>
  );
}

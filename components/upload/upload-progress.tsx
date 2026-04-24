"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface UploadProgressProps {
  progress: number;
  status: "idle" | "uploading" | "processing" | "complete" | "error";
  filename?: string;
  error?: string;
  className?: string;
}

export function UploadProgress({
  progress,
  status,
  filename,
  error,
  className,
}: UploadProgressProps): React.ReactElement {
  const progressText = String(Math.round(progress));

  const statusText: Record<UploadProgressProps["status"], string> = {
    idle: "Ready to upload",
    uploading: `Uploading... ${progressText}%`,
    processing: "Processing...",
    complete: "Upload complete",
    error: error ?? "Upload failed",
  };

  const statusColor: Record<UploadProgressProps["status"], string> = {
    idle: "bg-base-300",
    uploading: "bg-primary",
    processing: "bg-primary",
    complete: "bg-success",
    error: "bg-error",
  };

  const widthValue = status === "complete" ? "100%" : `${progressText}%`;

  return (
    <div className={cn("space-y-2", className)}>
      {filename && <p className="text-base-content/70 truncate text-sm">{filename}</p>}
      <div className="bg-base-200 h-2 w-full overflow-hidden rounded-full">
        <div
          className={cn("h-full transition-all duration-300", statusColor[status])}
          style={{ width: widthValue }}
        />
      </div>
      <p
        className={cn("text-xs", {
          "text-base-content/70": status === "idle" || status === "uploading",
          "text-primary": status === "processing",
          "text-success": status === "complete",
          "text-error": status === "error",
        })}
      >
        {statusText[status]}
      </p>
    </div>
  );
}

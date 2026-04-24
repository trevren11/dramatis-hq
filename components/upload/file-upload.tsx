"use client";

import * as React from "react";
import { X, File, Image, Video } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { UploadProgress } from "./upload-progress";

export type MediaType = "headshot" | "video" | "document";

export interface FileUploadProps {
  type: MediaType;
  onUpload?: (result: UploadResult) => void;
  onError?: (error: string) => void;
  accept?: string;
  maxSize?: number;
  className?: string;
  disabled?: boolean;
}

export interface UploadResult {
  id: string;
  url: string;
  key: string;
  width?: number;
  height?: number;
}

interface UploadState {
  status: "idle" | "uploading" | "processing" | "complete" | "error";
  progress: number;
  filename?: string;
  error?: string;
  result?: UploadResult;
}

const DEFAULT_ACCEPT: Record<MediaType, string> = {
  headshot: "image/jpeg,image/png,image/webp",
  video: "video/mp4,video/quicktime,video/webm",
  document:
    "application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

const DEFAULT_MAX_SIZE: Record<MediaType, number> = {
  headshot: 10 * 1024 * 1024, // 10MB
  video: 500 * 1024 * 1024, // 500MB
  document: 25 * 1024 * 1024, // 25MB
};

const TYPE_ICONS: Record<MediaType, React.ElementType> = {
  headshot: Image,
  video: Video,
  document: File,
};

async function uploadWithProgress(
  formData: FormData,
  type: MediaType,
  onProgress: (progress: number) => void
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) {
        const progress = Math.round((e.loaded / e.total) * 100);
        onProgress(progress);
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const result = JSON.parse(xhr.responseText) as UploadResult;
          resolve(result);
        } catch {
          reject(new Error("Invalid response"));
        }
      } else {
        try {
          const error = JSON.parse(xhr.responseText) as { error?: string };
          reject(new Error(error.error ?? "Upload failed"));
        } catch {
          reject(new Error("Upload failed"));
        }
      }
    });

    xhr.addEventListener("error", () => {
      reject(new Error("Network error"));
    });

    xhr.open("POST", `/api/upload/${type === "headshot" ? "image" : type}`);
    xhr.send(formData);
  });
}

function DropZone({
  type,
  isDragging,
  disabled,
  onClick,
  onDragOver,
  onDragLeave,
  onDrop,
}: {
  type: MediaType;
  isDragging: boolean;
  disabled: boolean;
  onClick: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
}): React.ReactElement {
  const Icon = TYPE_ICONS[type];

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === "Enter") {
      onClick();
    }
  };

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors",
        {
          "border-base-300 hover:border-primary hover:bg-base-200": !isDragging && !disabled,
          "border-primary bg-primary/5": isDragging,
          "cursor-not-allowed opacity-50": disabled,
        }
      )}
    >
      <Icon className="text-base-content/50 mb-3 h-10 w-10" />
      <p className="mb-1 text-sm font-medium">Drop your file here or click to browse</p>
      <p className="text-base-content/50 text-xs">
        {type === "headshot" && "JPG, PNG or WebP up to 10MB"}
        {type === "video" && "MP4, MOV or WebM up to 500MB"}
        {type === "document" && "PDF or DOC up to 25MB"}
      </p>
    </div>
  );
}

function UploadComplete({
  type,
  filename,
  onReset,
}: {
  type: MediaType;
  filename?: string;
  onReset: () => void;
}): React.ReactElement {
  const Icon = TYPE_ICONS[type];
  return (
    <div className="border-success/30 bg-success/5 flex items-center justify-between rounded-lg border p-4">
      <div className="flex items-center gap-3">
        <Icon className="text-success h-6 w-6" />
        <div>
          <p className="text-sm font-medium">{filename}</p>
          <p className="text-success text-xs">Upload complete</p>
        </div>
      </div>
      <Button variant="ghost" size="icon" onClick={onReset} aria-label="Remove file">
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}

function UploadError({
  type,
  filename,
  error,
  onReset,
}: {
  type: MediaType;
  filename?: string;
  error?: string;
  onReset: () => void;
}): React.ReactElement {
  const Icon = TYPE_ICONS[type];
  return (
    <div className="border-error/30 bg-error/5 flex items-center justify-between rounded-lg border p-4">
      <div className="flex items-center gap-3">
        <Icon className="text-error h-6 w-6" />
        <div>
          <p className="text-sm font-medium">{filename ?? "Upload"}</p>
          <p className="text-error text-xs">{error}</p>
        </div>
      </div>
      <Button variant="ghost" size="icon" onClick={onReset} aria-label="Try again">
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}

export function FileUpload({
  type,
  onUpload,
  onError,
  accept,
  maxSize,
  className,
  disabled = false,
}: FileUploadProps): React.ReactElement {
  const [isDragging, setIsDragging] = React.useState(false);
  const [state, setState] = React.useState<UploadState>({
    status: "idle",
    progress: 0,
  });
  const inputRef = React.useRef<HTMLInputElement>(null);

  const acceptTypes = accept ?? DEFAULT_ACCEPT[type];
  const maxFileSize = maxSize ?? DEFAULT_MAX_SIZE[type];

  const resetState = (): void => {
    setState({ status: "idle", progress: 0 });
  };

  const handleFile = async (file: File): Promise<void> => {
    // Validate file size
    if (file.size > maxFileSize) {
      const limitMB = String(Math.round(maxFileSize / (1024 * 1024)));
      const errorMsg = `File size exceeds ${limitMB}MB limit`;
      setState({ status: "error", progress: 0, error: errorMsg });
      onError?.(errorMsg);
      return;
    }

    // Validate file type
    const acceptedTypes = acceptTypes.split(",").map((t) => t.trim());
    if (!acceptedTypes.includes(file.type)) {
      const errorMsg = "Invalid file type";
      setState({ status: "error", progress: 0, error: errorMsg });
      onError?.(errorMsg);
      return;
    }

    setState({
      status: "uploading",
      progress: 0,
      filename: file.name,
    });

    try {
      const formData = new FormData();
      formData.append("file", file);

      // Use XMLHttpRequest for progress tracking
      const result = await uploadWithProgress(formData, type, (progress) => {
        setState((prev) => ({ ...prev, progress }));
      });

      setState({
        status: "processing",
        progress: 100,
        filename: file.name,
      });

      // Short delay to show processing state
      await new Promise((resolve) => setTimeout(resolve, 500));

      setState({
        status: "complete",
        progress: 100,
        filename: file.name,
        result,
      });

      onUpload?.(result);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Upload failed";
      setState({
        status: "error",
        progress: 0,
        filename: file.name,
        error: errorMsg,
      });
      onError?.(errorMsg);
    }
  };

  const handleDragOver = (e: React.DragEvent): void => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent): void => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent): void => {
    e.preventDefault();
    setIsDragging(false);

    if (disabled) return;

    const file = e.dataTransfer.files[0];
    if (file) {
      void handleFile(file);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (file) {
      void handleFile(file);
    }
    // Reset input value so same file can be selected again
    e.target.value = "";
  };

  const handleClick = (): void => {
    if (!disabled && state.status === "idle") {
      inputRef.current?.click();
    }
  };

  const isUploading = state.status === "uploading" || state.status === "processing";

  return (
    <div className={cn("w-full", className)}>
      <input
        ref={inputRef}
        type="file"
        accept={acceptTypes}
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled || isUploading}
      />

      {state.status === "idle" && (
        <DropZone
          type={type}
          isDragging={isDragging}
          disabled={disabled}
          onClick={handleClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        />
      )}

      {(state.status === "uploading" || state.status === "processing") && (
        <div className="border-base-300 rounded-lg border p-4">
          <UploadProgress
            progress={state.progress}
            status={state.status}
            filename={state.filename}
          />
        </div>
      )}

      {state.status === "complete" && state.result && (
        <UploadComplete type={type} filename={state.filename} onReset={resetState} />
      )}

      {state.status === "error" && (
        <UploadError
          type={type}
          filename={state.filename}
          error={state.error}
          onReset={resetState}
        />
      )}
    </div>
  );
}

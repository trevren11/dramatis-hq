"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TalentProfile } from "@/lib/resume/types";

interface ResumePreviewProps {
  profile: TalentProfile;
  selectedWorkHistory: string[];
  selectedEducation: string[];
  selectedSkills: string[];
  includeHeadshot: boolean;
  includeContact: boolean;
  className?: string;
}

export function ResumePreview({
  profile,
  selectedWorkHistory,
  selectedEducation,
  selectedSkills,
  includeHeadshot,
  includeContact,
  className,
}: ResumePreviewProps): React.ReactElement {
  const [pdfUrl, setPdfUrl] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const pdfUrlRef = React.useRef<string | null>(null);

  const generatePreview = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/resume/preview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          profile,
          selectedWorkHistory,
          selectedEducation,
          selectedSkills,
          includeHeadshot,
          includeContact,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate preview");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      if (pdfUrlRef.current) {
        URL.revokeObjectURL(pdfUrlRef.current);
      }

      pdfUrlRef.current = url;
      setPdfUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate preview");
    } finally {
      setIsLoading(false);
    }
  }, [
    profile,
    selectedWorkHistory,
    selectedEducation,
    selectedSkills,
    includeHeadshot,
    includeContact,
  ]);

  React.useEffect(() => {
    void generatePreview();

    return () => {
      if (pdfUrlRef.current) {
        URL.revokeObjectURL(pdfUrlRef.current);
      }
    };
  }, [generatePreview]);

  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      void generatePreview();
    }, 500);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [
    generatePreview,
    selectedWorkHistory,
    selectedEducation,
    selectedSkills,
    includeHeadshot,
    includeContact,
  ]);

  const handleRefresh = (): void => {
    void generatePreview();
  };

  const handleTryAgain = (): void => {
    void generatePreview();
  };

  return (
    <div className={cn("bg-card flex flex-col rounded-lg border", className)}>
      <div className="flex items-center justify-between border-b p-3">
        <h3 className="font-medium">Preview</h3>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={isLoading}
        >
          <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          <span className="ml-1">Refresh</span>
        </Button>
      </div>

      <div className="bg-muted/30 relative min-h-[600px] flex-1">
        {isLoading && (
          <div className="bg-background/80 absolute inset-0 z-10 flex items-center justify-center">
            <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <p className="text-destructive mb-2">{error}</p>
              <Button variant="outline" size="sm" onClick={handleTryAgain}>
                Try Again
              </Button>
            </div>
          </div>
        )}

        {pdfUrl && !error && (
          <iframe src={pdfUrl} className="h-full w-full" title="Resume Preview" />
        )}
      </div>
    </div>
  );
}

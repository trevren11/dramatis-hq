"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ZoomIn, ZoomOut, Download, Maximize2, Minimize2, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface ScriptViewerProps {
  src: string;
  title: string;
  version?: number;
  canDownload?: boolean;
  onDownload?: () => void;
  watermarkText?: string;
  className?: string;
}

export function ScriptViewer({
  src,
  title,
  version,
  canDownload = false,
  onDownload,
  watermarkText,
  className,
}: ScriptViewerProps): React.ReactElement {
  const [scale, setScale] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Prevent right-click
  const handleContextMenu = useCallback((e: React.MouseEvent): void => {
    e.preventDefault();
  }, []);

  // Prevent copy
  useEffect(() => {
    const handleCopy = (e: ClipboardEvent): void => {
      e.preventDefault();
    };

    document.addEventListener("copy", handleCopy);
    return () => {
      document.removeEventListener("copy", handleCopy);
    };
  }, []);

  // Handle zoom
  const zoomIn = (): void => {
    setScale((prev) => Math.min(prev + 0.25, 3));
  };

  const zoomOut = (): void => {
    setScale((prev) => Math.max(prev - 0.25, 0.5));
  };

  // Handle fullscreen
  const toggleFullscreen = (): void => {
    setIsFullscreen(!isFullscreen);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case "+":
        case "=":
          zoomIn();
          break;
        case "-":
          zoomOut();
          break;
        case "Escape":
          if (isFullscreen) setIsFullscreen(false);
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isFullscreen]);

  return (
    <Card
      className={cn(
        "relative overflow-hidden",
        isFullscreen && "fixed inset-0 z-50 rounded-none",
        className
      )}
      onContextMenu={handleContextMenu}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <FileText className="text-muted-foreground h-5 w-5" />
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            {version && <p className="text-muted-foreground text-sm">Version {version}</p>}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={zoomOut} title="Zoom out">
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-muted-foreground min-w-[3rem] text-center text-sm">
            {Math.round(scale * 100)}%
          </span>
          <Button variant="ghost" size="icon" onClick={zoomIn} title="Zoom in">
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={toggleFullscreen} title="Toggle fullscreen">
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
          {canDownload && onDownload && (
            <Button variant="ghost" size="icon" onClick={onDownload} title="Download">
              <Download className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div
          className={cn(
            "bg-muted/30 relative",
            isFullscreen ? "h-[calc(100vh-4rem)]" : "h-[600px]"
          )}
        >
          {/* Watermark Overlay */}
          {watermarkText && (
            <div
              className="pointer-events-none absolute inset-0 z-10 overflow-hidden select-none"
              style={{
                backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(
                  `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='200'>
                    <text transform='rotate(-30)' x='-50' y='150' font-family='Arial' font-size='24' fill='rgba(128,128,128,0.15)' font-weight='bold'>${watermarkText}</text>
                  </svg>`
                )}")`,
                backgroundRepeat: "repeat",
              }}
            />
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="bg-background/80 absolute inset-0 z-20 flex items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <div className="border-primary h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" />
                <p className="text-muted-foreground text-sm">Loading script...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-background/80 absolute inset-0 z-20 flex items-center justify-center">
              <div className="flex flex-col items-center gap-2 px-4 text-center">
                <p className="text-destructive font-medium">Failed to load script</p>
                <p className="text-muted-foreground text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* PDF Viewer */}
          <iframe
            src={`${src}#toolbar=0&navpanes=0&scrollbar=1&view=FitH`}
            className="h-full w-full"
            style={{
              transform: `scale(${String(scale)})`,
              transformOrigin: "top center",
            }}
            onLoad={() => {
              setIsLoading(false);
            }}
            onError={() => {
              setIsLoading(false);
              setError("Could not load the PDF. Please try again later.");
            }}
            title={title}
            sandbox="allow-same-origin"
          />
        </div>
      </CardContent>
    </Card>
  );
}

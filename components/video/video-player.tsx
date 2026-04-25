"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Settings,
  PictureInPicture2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Slider } from "@/components/ui/slider";

export interface VideoPlayerProps {
  src: string;
  poster?: string;
  title?: string;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  className?: string;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
}

const PLAYBACK_SPEEDS = ["0.5", "0.75", "1", "1.25", "1.5", "2"] as const;

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins)}:${String(secs).padStart(2, "0")}`;
}

// eslint-disable-next-line complexity -- video player state management requires this complexity
export function VideoPlayer({
  src,
  poster,
  title,
  autoPlay = false,
  muted = false,
  loop = false,
  className,
  onPlay,
  onPause,
  onEnded,
}: VideoPlayerProps): React.ReactElement {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [isMuted, setIsMuted] = React.useState(muted);
  const [volume, setVolume] = React.useState(muted ? 0 : 1);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [showControls, setShowControls] = React.useState(true);
  const [playbackSpeed, setPlaybackSpeed] = React.useState("1");
  const [lastTapTime, setLastTapTime] = React.useState(0);
  const [doubleTapSide, setDoubleTapSide] = React.useState<"left" | "right" | null>(null);
  const hideControlsTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const doubleTapTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Update playing state
  const handlePlay = (): void => {
    setIsPlaying(true);
    onPlay?.();
  };

  const handlePause = (): void => {
    setIsPlaying(false);
    onPause?.();
  };

  const handleEnded = (): void => {
    setIsPlaying(false);
    onEnded?.();
  };

  // Update time
  const handleTimeUpdate = (): void => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  // Update duration when metadata loads
  const handleLoadedMetadata = (): void => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  // Toggle play/pause
  const togglePlay = React.useCallback((): void => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      void videoRef.current.play();
    }
  }, [isPlaying]);

  // Toggle mute
  const toggleMute = React.useCallback((): void => {
    if (!videoRef.current) return;
    const newMuted = !isMuted;
    videoRef.current.muted = newMuted;
    setIsMuted(newMuted);
    if (newMuted) {
      setVolume(0);
    } else {
      setVolume(videoRef.current.volume || 1);
    }
  }, [isMuted]);

  // Handle volume change
  const handleVolumeChange = (value: number[]): void => {
    if (!videoRef.current || value[0] === undefined) return;
    const newVolume = value[0];
    videoRef.current.volume = newVolume;
    videoRef.current.muted = newVolume === 0;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  // Handle seek
  const handleSeek = (value: number[]): void => {
    if (!videoRef.current || value[0] === undefined) return;
    videoRef.current.currentTime = value[0];
    setCurrentTime(value[0]);
  };

  // Toggle fullscreen
  const toggleFullscreen = async (): Promise<void> => {
    if (!containerRef.current) return;
    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (error) {
      console.error("Fullscreen error:", error);
    }
  };

  // Toggle picture-in-picture
  const togglePictureInPicture = async (): Promise<void> => {
    if (!videoRef.current) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await videoRef.current.requestPictureInPicture();
      }
    } catch (error) {
      console.error("Picture-in-picture error:", error);
    }
  };

  // Change playback speed
  const handlePlaybackSpeedChange = (speed: string): void => {
    if (!videoRef.current) return;
    videoRef.current.playbackRate = parseFloat(speed);
    setPlaybackSpeed(speed);
  };

  // Handle double-tap to seek (mobile gesture)
  const handleDoubleTap = React.useCallback(
    (e: React.TouchEvent | React.MouseEvent): void => {
      if (!containerRef.current || !videoRef.current) return;

      const now = Date.now();
      const timeDiff = now - lastTapTime;

      if (timeDiff < 300 && timeDiff > 0) {
        // Double tap detected
        const rect = containerRef.current.getBoundingClientRect();
        const clientX = "touches" in e ? (e.touches[0]?.clientX ?? 0) : e.clientX;
        const tapPosition = (clientX - rect.left) / rect.width;

        if (tapPosition < 0.3) {
          // Left side - rewind 10 seconds
          videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10);
          setDoubleTapSide("left");
        } else if (tapPosition > 0.7) {
          // Right side - forward 10 seconds
          videoRef.current.currentTime = Math.min(
            videoRef.current.duration,
            videoRef.current.currentTime + 10
          );
          setDoubleTapSide("right");
        }

        // Clear indicator after animation
        if (doubleTapTimeoutRef.current) {
          clearTimeout(doubleTapTimeoutRef.current);
        }
        doubleTapTimeoutRef.current = setTimeout(() => {
          setDoubleTapSide(null);
        }, 500);
      }

      setLastTapTime(now);
    },
    [lastTapTime]
  );

  // Show/hide controls on mouse activity
  const handleMouseMove = (): void => {
    setShowControls(true);
    if (hideControlsTimerRef.current) {
      clearTimeout(hideControlsTimerRef.current);
    }
    if (isPlaying) {
      hideControlsTimerRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  };

  const handleMouseLeave = (): void => {
    if (isPlaying) {
      hideControlsTimerRef.current = setTimeout(() => {
        setShowControls(false);
      }, 1000);
    }
  };

  // Handle fullscreen change events
  React.useEffect(() => {
    const handleFullscreenChange = (): void => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  // Cleanup timers on unmount
  React.useEffect(() => {
    return () => {
      if (hideControlsTimerRef.current) {
        clearTimeout(hideControlsTimerRef.current);
      }
      if (doubleTapTimeoutRef.current) {
        clearTimeout(doubleTapTimeoutRef.current);
      }
    };
  }, []);

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (!containerRef.current?.contains(document.activeElement)) return;
      switch (e.key) {
        case " ":
        case "k":
          e.preventDefault();
          togglePlay();
          break;
        case "m":
          e.preventDefault();
          toggleMute();
          break;
        case "f":
          e.preventDefault();
          void toggleFullscreen();
          break;
        case "ArrowLeft":
          e.preventDefault();
          if (videoRef.current) {
            videoRef.current.currentTime -= 10;
          }
          break;
        case "ArrowRight":
          e.preventDefault();
          if (videoRef.current) {
            videoRef.current.currentTime += 10;
          }
          break;
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [togglePlay, toggleMute]);

  return (
    <div
      ref={containerRef}
      role="application"
      aria-label={title ? `Video player: ${title}` : "Video player"}
      className={cn(
        "group relative overflow-hidden rounded-lg bg-black",
        isFullscreen && "fixed inset-0 z-50 rounded-none",
        className
      )}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleDoubleTap}
      // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- role="application" makes this interactive for keyboard control
      tabIndex={0}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        autoPlay={autoPlay}
        muted={muted}
        loop={loop}
        playsInline
        className="h-full w-full"
        onPlay={handlePlay}
        onPause={handlePause}
        onEnded={handleEnded}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onClick={togglePlay}
      >
        <track kind="captions" />
      </video>

      {/* Video title overlay */}
      {title && showControls && (
        <div className="absolute top-0 right-0 left-0 bg-gradient-to-b from-black/70 to-transparent p-4">
          <h3 className="text-sm font-medium text-white">{title}</h3>
        </div>
      )}

      {/* Double-tap seek indicator */}
      {doubleTapSide && (
        <div
          className={cn(
            "pointer-events-none absolute top-1/2 flex -translate-y-1/2 items-center justify-center",
            doubleTapSide === "left" ? "left-8" : "right-8"
          )}
        >
          <div className="animate-ping rounded-full bg-white/30 p-4">
            <span className="text-lg font-bold text-white">
              {doubleTapSide === "left" ? "-10s" : "+10s"}
            </span>
          </div>
        </div>
      )}

      {/* Play overlay (when paused) */}
      {!isPlaying && (
        <div
          className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/30"
          onClick={togglePlay}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter") togglePlay();
          }}
        >
          <div className="rounded-full bg-white/90 p-4 transition-transform hover:scale-110">
            <Play className="h-8 w-8 text-black" fill="currentColor" />
          </div>
        </div>
      )}

      {/* Controls - touch-friendly on mobile */}
      <div
        className={cn(
          "absolute right-0 bottom-0 left-0 bg-gradient-to-t from-black/80 to-transparent px-3 py-2 transition-opacity md:px-4 md:py-3",
          showControls ? "opacity-100" : "opacity-0"
        )}
      >
        {/* Progress bar - larger touch target on mobile */}
        <div className="mb-2 py-2 md:mb-3 md:py-0">
          <Slider
            value={[currentTime]}
            max={duration || 100}
            step={0.1}
            onValueChange={handleSeek}
            className="h-1.5 cursor-pointer md:h-1"
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 md:gap-2">
            {/* Play/Pause - larger on mobile */}
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 text-white hover:bg-white/20 md:h-8 md:w-8"
              onClick={togglePlay}
            >
              {isPlaying ? (
                <Pause className="h-5 w-5 md:h-4 md:w-4" fill="currentColor" />
              ) : (
                <Play className="h-5 w-5 md:h-4 md:w-4" fill="currentColor" />
              )}
            </Button>

            {/* Volume - hidden on mobile (use device volume) */}
            <div className="hidden items-center gap-1 md:flex">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white hover:bg-white/20"
                onClick={toggleMute}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </Button>
              <Slider
                value={[volume]}
                max={1}
                step={0.1}
                onValueChange={handleVolumeChange}
                className="w-20"
              />
            </div>

            {/* Mute button only on mobile */}
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 text-white hover:bg-white/20 md:hidden"
              onClick={toggleMute}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="h-5 w-5" />
              ) : (
                <Volume2 className="h-5 w-5" />
              )}
            </Button>

            {/* Time */}
            <span className="text-xs text-white">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {/* Playback speed - larger touch target */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 text-white hover:bg-white/20 md:h-8 md:w-8"
                >
                  <Settings className="h-5 w-5 md:h-4 md:w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuRadioGroup
                  value={playbackSpeed}
                  onValueChange={handlePlaybackSpeedChange}
                >
                  {PLAYBACK_SPEEDS.map((speed) => (
                    <DropdownMenuRadioItem
                      key={speed}
                      value={speed}
                      className="min-h-[44px] md:min-h-0"
                    >
                      {speed}x
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Picture-in-picture - hidden on mobile (limited support) */}
            <Button
              variant="ghost"
              size="icon"
              className="hidden h-8 w-8 text-white hover:bg-white/20 md:inline-flex"
              onClick={() => {
                void togglePictureInPicture();
              }}
            >
              <PictureInPicture2 className="h-4 w-4" />
            </Button>

            {/* Fullscreen - larger on mobile */}
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 text-white hover:bg-white/20 md:h-8 md:w-8"
              onClick={() => {
                void toggleFullscreen();
              }}
            >
              {isFullscreen ? (
                <Minimize className="h-5 w-5 md:h-4 md:w-4" />
              ) : (
                <Maximize className="h-5 w-5 md:h-4 md:w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

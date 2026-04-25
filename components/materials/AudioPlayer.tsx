/* eslint-disable complexity */
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  RadixSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Download,
  Repeat,
  Music,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SPEED_OPTIONS, KEY_ADJUSTMENT_OPTIONS } from "@/lib/db/schema/materials";

interface AudioPlayerProps {
  src: string;
  title: string;
  act?: string | null;
  scene?: string | null;
  originalKey?: string | null;
  canDownload?: boolean;
  onDownload?: () => void;
  className?: string;
}

export function AudioPlayer({
  src,
  title,
  act,
  scene,
  originalKey,
  canDownload = false,
  onDownload,
  className,
}: AudioPlayerProps): React.ReactElement {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [keyAdjustment, setKeyAdjustment] = useState(0);
  const [isLooping, setIsLooping] = useState(false);
  const [loopStart, setLoopStart] = useState<number | null>(null);
  const [loopEnd, setLoopEnd] = useState<number | null>(null);

  // Format time as MM:SS
  const formatTime = (time: number): string => {
    if (!isFinite(time) || isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${String(minutes)}:${seconds.toString().padStart(2, "0")}`;
  };

  // Handle play/pause
  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      void audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  // Handle seeking
  const handleSeek = (value: number[]): void => {
    if (!audioRef.current || !value[0]) return;
    audioRef.current.currentTime = value[0];
    setCurrentTime(value[0]);
  };

  // Skip forward/backward
  const skip = useCallback(
    (seconds: number): void => {
      if (!audioRef.current) return;
      audioRef.current.currentTime = Math.max(
        0,
        Math.min(duration, audioRef.current.currentTime + seconds)
      );
    },
    [duration]
  );

  // Handle volume change
  const handleVolumeChange = (value: number[]): void => {
    if (!audioRef.current || !value[0]) return;
    const newVolume = value[0];
    audioRef.current.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  // Toggle mute
  const toggleMute = useCallback((): void => {
    if (!audioRef.current) return;
    if (isMuted) {
      audioRef.current.volume = volume || 0.5;
      setIsMuted(false);
    } else {
      audioRef.current.volume = 0;
      setIsMuted(true);
    }
  }, [isMuted, volume]);

  // Handle playback rate change
  const handlePlaybackRateChange = (rate: string): void => {
    if (!audioRef.current) return;
    const newRate = parseFloat(rate);
    audioRef.current.playbackRate = newRate;
    setPlaybackRate(newRate);
  };

  // Handle key adjustment
  // Note: Real pitch shifting requires Web Audio API with a pitch shifter node
  // This is a placeholder - in production, use a library like Tone.js or Soundtouch
  const handleKeyAdjustment = (adjustment: string): void => {
    setKeyAdjustment(parseInt(adjustment));
    // In a full implementation, you would apply pitch shifting here
    // using Web Audio API's AudioBufferSourceNode with playbackRate
    // or a dedicated pitch shifting library
  };

  // Set loop points
  const setLoopPoint = (type: "start" | "end"): void => {
    if (!audioRef.current) return;
    const time = audioRef.current.currentTime;
    if (type === "start") {
      setLoopStart(time);
      if (loopEnd !== null && time >= loopEnd) {
        setLoopEnd(null);
      }
    } else {
      setLoopEnd(time);
      if (loopStart !== null && time <= loopStart) {
        setLoopStart(null);
      }
    }
  };

  // Clear loop points
  const clearLoop = (): void => {
    setLoopStart(null);
    setLoopEnd(null);
    setIsLooping(false);
  };

  // Toggle looping
  const toggleLoop = (): void => {
    if (loopStart !== null && loopEnd !== null) {
      setIsLooping(!isLooping);
    }
  };

  // Update time display
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = (): void => {
      setCurrentTime(audio.currentTime);

      // Handle loop
      if (isLooping && loopStart !== null && loopEnd !== null) {
        if (audio.currentTime >= loopEnd) {
          audio.currentTime = loopStart;
        }
      }
    };

    const handleLoadedMetadata = (): void => {
      setDuration(audio.duration);
    };

    const handleEnded = (): void => {
      if (isLooping && loopStart !== null && loopEnd !== null) {
        audio.currentTime = loopStart;
        void audio.play();
      } else {
        setIsPlaying(false);
      }
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [isLooping, loopStart, loopEnd]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case " ":
          e.preventDefault();
          togglePlay();
          break;
        case "ArrowLeft":
          skip(-5);
          break;
        case "ArrowRight":
          skip(5);
          break;
        case "m":
          toggleMute();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [togglePlay, skip, toggleMute]);

  const subtitle = [act && `Act ${act}`, scene && `Scene ${scene}`].filter(Boolean).join(" • ");

  return (
    <Card className={cn("w-full", className)}>
      <CardContent className="p-4">
        <audio ref={audioRef} src={src} preload="metadata" />

        {/* Track Info */}
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">{title}</h3>
              {subtitle && <p className="text-muted-foreground text-sm">{subtitle}</p>}
            </div>
            {originalKey && (
              <div className="text-muted-foreground flex items-center gap-1 text-sm">
                <Music className="h-4 w-4" />
                <span>Key: {originalKey}</span>
              </div>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <Slider
            value={[currentTime]}
            max={duration || 100}
            step={0.1}
            onValueChange={handleSeek}
            className="cursor-pointer"
          />
          <div className="text-muted-foreground mt-1 flex justify-between text-xs">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
          {/* Loop markers */}
          {(loopStart !== null || loopEnd !== null) && (
            <div className="relative mt-1 h-1">
              {loopStart !== null && (
                <div
                  className="absolute h-full w-0.5 bg-blue-500"
                  style={{ left: `${String((loopStart / duration) * 100)}%` }}
                />
              )}
              {loopEnd !== null && (
                <div
                  className="absolute h-full w-0.5 bg-blue-500"
                  style={{ left: `${String((loopEnd / duration) * 100)}%` }}
                />
              )}
              {loopStart !== null && loopEnd !== null && (
                <div
                  className="absolute h-full bg-blue-500/20"
                  style={{
                    left: `${String((loopStart / duration) * 100)}%`,
                    width: `${String(((loopEnd - loopStart) / duration) * 100)}%`,
                  }}
                />
              )}
            </div>
          )}
        </div>

        {/* Main Controls */}
        <div className="mb-4 flex items-center justify-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              skip(-10);
            }}
            title="Skip back 10s"
          >
            <SkipBack className="h-4 w-4" />
          </Button>

          <Button
            variant="default"
            size="icon"
            onClick={togglePlay}
            className="h-12 w-12 rounded-full"
          >
            {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="ml-1 h-6 w-6" />}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              skip(10);
            }}
            title="Skip forward 10s"
          >
            <SkipForward className="h-4 w-4" />
          </Button>
        </div>

        {/* Secondary Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Volume */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggleMute}>
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>
            <Slider
              value={[isMuted ? 0 : volume]}
              max={1}
              step={0.1}
              onValueChange={handleVolumeChange}
              className="w-24"
            />
          </div>

          {/* Playback Speed */}
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-sm">Speed:</span>
            <RadixSelect value={playbackRate.toString()} onValueChange={handlePlaybackRateChange}>
              <SelectTrigger className="h-8 w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SPEED_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value.toString()}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </RadixSelect>
          </div>

          {/* Key Adjustment */}
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-sm">Key:</span>
            <RadixSelect value={keyAdjustment.toString()} onValueChange={handleKeyAdjustment}>
              <SelectTrigger className="h-8 w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {KEY_ADJUSTMENT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value.toString()}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </RadixSelect>
          </div>

          {/* Loop Controls */}
          <div className="flex items-center gap-1">
            <Button
              variant={loopStart !== null ? "secondary" : "ghost"}
              size="sm"
              onClick={() => {
                setLoopPoint("start");
              }}
              title="Set loop start"
            >
              A
            </Button>
            <Button
              variant={isLooping ? "default" : "ghost"}
              size="icon"
              onClick={toggleLoop}
              disabled={loopStart === null || loopEnd === null}
              title="Toggle loop"
            >
              <Repeat className="h-4 w-4" />
            </Button>
            <Button
              variant={loopEnd !== null ? "secondary" : "ghost"}
              size="sm"
              onClick={() => {
                setLoopPoint("end");
              }}
              title="Set loop end"
            >
              B
            </Button>
            {(loopStart !== null || loopEnd !== null) && (
              <Button variant="ghost" size="sm" onClick={clearLoop} title="Clear loop">
                ×
              </Button>
            )}
          </div>

          {/* Download */}
          {canDownload && onDownload && (
            <Button variant="ghost" size="icon" onClick={onDownload} title="Download">
              <Download className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

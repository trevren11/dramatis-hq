"use client";

import { useState, useEffect } from "react";
import { Sun, Moon, Monitor, Globe, Clock } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  RadixSelect as Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type ThemeMode = "light" | "dark" | "system";

interface AppearanceSettings {
  theme: ThemeMode;
  language: string;
  timezone: string;
}

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "es", label: "Espa\u00f1ol" },
  { value: "fr", label: "Fran\u00e7ais" },
  { value: "de", label: "Deutsch" },
  { value: "it", label: "Italiano" },
  { value: "pt", label: "Portugu\u00eas" },
  { value: "ja", label: "\u65e5\u672c\u8a9e" },
  { value: "ko", label: "\ud55c\uad6d\uc5b4" },
  { value: "zh", label: "\u4e2d\u6587" },
];

const TIMEZONES = [
  { value: "UTC", label: "UTC" },
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "America/Anchorage", label: "Alaska Time (AKT)" },
  { value: "Pacific/Honolulu", label: "Hawaii Time (HT)" },
  { value: "Europe/London", label: "London (GMT/BST)" },
  { value: "Europe/Paris", label: "Central European (CET)" },
  { value: "Europe/Berlin", label: "Berlin (CET)" },
  { value: "Asia/Tokyo", label: "Japan (JST)" },
  { value: "Asia/Shanghai", label: "China (CST)" },
  { value: "Asia/Seoul", label: "Korea (KST)" },
  { value: "Australia/Sydney", label: "Sydney (AEST)" },
  { value: "Australia/Melbourne", label: "Melbourne (AEST)" },
];

interface ThemeSelectorProps {
  theme: ThemeMode;
  onThemeChange: (theme: ThemeMode) => void;
  isPending: boolean;
}

export function ThemeSelector({
  theme,
  onThemeChange,
  isPending,
}: ThemeSelectorProps): React.ReactElement {
  const themes: { value: ThemeMode; label: string; icon: React.ReactNode }[] = [
    { value: "light", label: "Light", icon: <Sun className="h-5 w-5" /> },
    { value: "dark", label: "Dark", icon: <Moon className="h-5 w-5" /> },
    { value: "system", label: "System", icon: <Monitor className="h-5 w-5" /> },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Theme</CardTitle>
        <CardDescription>Choose how Dramatis-HQ looks to you.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          {themes.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => {
                onThemeChange(t.value);
              }}
              disabled={isPending}
              className={cn(
                "flex flex-col items-center gap-2 rounded-lg border p-4 transition-colors",
                theme === t.value
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50 hover:bg-muted"
              )}
            >
              <div
                className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-full",
                  theme === t.value ? "bg-primary text-primary-foreground" : "bg-muted"
                )}
              >
                {t.icon}
              </div>
              <span className="text-sm font-medium">{t.label}</span>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

interface LanguageSelectorProps {
  language: string;
  onLanguageChange: (language: string) => void;
  isPending: boolean;
}

export function LanguageSelector({
  language,
  onLanguageChange,
  isPending,
}: LanguageSelectorProps): React.ReactElement {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          <CardTitle>Language</CardTitle>
        </div>
        <CardDescription>Select your preferred language for the interface.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="max-w-xs">
          <Label htmlFor="language" className="sr-only">
            Language
          </Label>
          <Select value={language} onValueChange={onLanguageChange} disabled={isPending}>
            <SelectTrigger id="language">
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map((lang) => (
                <SelectItem key={lang.value} value={lang.value}>
                  {lang.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}

interface TimezoneSelectorProps {
  timezone: string;
  onTimezoneChange: (timezone: string) => void;
  isPending: boolean;
}

export function TimezoneSelector({
  timezone,
  onTimezoneChange,
  isPending,
}: TimezoneSelectorProps): React.ReactElement {
  const [currentTime, setCurrentTime] = useState<string>("");

  useEffect(() => {
    const updateTime = (): void => {
      try {
        const time = new Date().toLocaleTimeString("en-US", {
          timeZone: timezone,
          hour: "2-digit",
          minute: "2-digit",
        });
        setCurrentTime(time);
      } catch {
        setCurrentTime("");
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => {
      clearInterval(interval);
    };
  }, [timezone]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          <CardTitle>Timezone</CardTitle>
        </div>
        <CardDescription>
          Set your timezone for accurate scheduling and notifications.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="max-w-xs">
          <Label htmlFor="timezone" className="sr-only">
            Timezone
          </Label>
          <Select value={timezone} onValueChange={onTimezoneChange} disabled={isPending}>
            <SelectTrigger id="timezone">
              <SelectValue placeholder="Select timezone" />
            </SelectTrigger>
            <SelectContent>
              {TIMEZONES.map((tz) => (
                <SelectItem key={tz.value} value={tz.value}>
                  {tz.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {currentTime && (
          <p className="text-muted-foreground text-sm">
            Current time in selected timezone: <strong>{currentTime}</strong>
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export { LANGUAGES, TIMEZONES };
export type { AppearanceSettings, ThemeMode };

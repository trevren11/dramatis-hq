"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import {
  ThemeSelector,
  LanguageSelector,
  TimezoneSelector,
  type AppearanceSettings,
  type ThemeMode,
} from "@/components/settings/appearance-settings";

interface AppearanceResponse {
  appearance: AppearanceSettings;
}

export default function AppearanceSettingsPage(): React.ReactElement {
  const [appearance, setAppearance] = useState<AppearanceSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const fetchAppearance = useCallback(async (): Promise<void> => {
    try {
      const response = await fetch("/api/settings/appearance");
      if (response.ok) {
        const data = (await response.json()) as AppearanceResponse;
        setAppearance(data.appearance);
      } else {
        // Use defaults if no settings exist
        setAppearance({
          theme: "system",
          language: "en",
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
        });
      }
    } catch (error) {
      console.error("Failed to fetch appearance settings:", error);
      // Use defaults on error
      setAppearance({
        theme: "system",
        language: "en",
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchAppearance();
  }, [fetchAppearance]);

  const updateSetting = <K extends keyof AppearanceSettings>(
    key: K,
    value: AppearanceSettings[K]
  ): void => {
    // Optimistic update
    setAppearance((prev) => (prev ? { ...prev, [key]: value } : null));

    // Apply theme change immediately
    if (key === "theme") {
      applyTheme(value as ThemeMode);
    }

    startTransition(async () => {
      try {
        const response = await fetch("/api/settings/appearance", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ [key]: value }),
        });

        if (!response.ok) {
          throw new Error("Failed to update");
        }

        // Also save to localStorage for persistence
        localStorage.setItem(`dramatis-${key}`, value);

        toast({
          title: "Settings updated",
          description: "Your appearance preferences have been saved.",
        });
      } catch (error) {
        console.error(`Failed to update ${key}:`, error);
        // Revert on error
        void fetchAppearance();
        toast({
          title: "Error",
          description: "Failed to save setting",
          variant: "destructive",
        });
      }
    });
  };

  const applyTheme = (theme: ThemeMode): void => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  };

  // Apply theme on initial load
  useEffect(() => {
    if (appearance?.theme) {
      applyTheme(appearance.theme);
    }
  }, [appearance?.theme]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-48 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (!appearance) {
    return (
      <div className="rounded-lg border p-8 text-center">
        <p className="text-muted-foreground">Unable to load appearance settings.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Appearance</h2>
        <p className="text-muted-foreground">Customize how Dramatis-HQ looks and feels for you.</p>
      </div>

      <ThemeSelector
        theme={appearance.theme}
        onThemeChange={(theme) => {
          updateSetting("theme", theme);
        }}
        isPending={isPending}
      />
      <LanguageSelector
        language={appearance.language}
        onLanguageChange={(language) => {
          updateSetting("language", language);
        }}
        isPending={isPending}
      />
      <TimezoneSelector
        timezone={appearance.timezone}
        onTimezoneChange={(timezone) => {
          updateSetting("timezone", timezone);
        }}
        isPending={isPending}
      />
    </div>
  );
}

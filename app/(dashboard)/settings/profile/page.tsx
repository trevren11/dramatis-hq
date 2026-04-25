"use client";

import { useState, useEffect, useCallback } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import {
  TalentVisibilitySettings,
  ProducerSettingsForm,
  type ProfileSettings,
} from "@/components/settings/profile-settings";

interface ProfileResponse {
  profile: ProfileSettings;
}

export default function ProfileSettingsPage(): React.ReactElement {
  const [profile, setProfile] = useState<ProfileSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchProfile = useCallback(async (): Promise<void> => {
    try {
      const response = await fetch("/api/settings/profile");
      if (response.ok) {
        const data = (await response.json()) as ProfileResponse;
        setProfile(data.profile);
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error);
      toast({
        title: "Error",
        description: "Failed to load profile settings",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void fetchProfile();
  }, [fetchProfile]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-48 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="rounded-lg border p-8 text-center">
        <p className="text-muted-foreground">Unable to load profile settings.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Profile Settings</h2>
        <p className="text-muted-foreground">
          {profile.type === "talent"
            ? "Control your profile visibility and what information is shown."
            : "Manage your company profile visibility."}
        </p>
      </div>

      {profile.type === "talent" ? (
        <TalentVisibilitySettings
          settings={profile}
          onUpdate={() => {
            void fetchProfile();
          }}
        />
      ) : (
        <ProducerSettingsForm
          settings={profile}
          onUpdate={() => {
            void fetchProfile();
          }}
        />
      )}
    </div>
  );
}

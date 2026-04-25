"use client";

import { useState, useTransition } from "react";
import { Loader2, Eye, EyeOff, Search, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";

interface PublicSections {
  basicInfo: boolean;
  bio: boolean;
  headshots: boolean;
  videos: boolean;
  workHistory: boolean;
  education: boolean;
  skills: boolean;
  contact: boolean;
}

interface TalentProfileSettings {
  type: "talent";
  isPublic: boolean;
  hideFromSearch: boolean;
  publicProfileSlug: string | null;
  publicSections: PublicSections;
}

interface ProducerProfileSettings {
  type: "producer";
  isPublic: boolean;
  companyName: string;
  slug: string;
  logoUrl: string | null;
}

type ProfileSettings = TalentProfileSettings | ProducerProfileSettings;

interface ApiResponse {
  message?: string;
  error?: string;
  details?: Record<string, string[]>;
}

interface TalentVisibilitySettingsProps {
  settings: TalentProfileSettings;
  onUpdate: () => void;
}

export function TalentVisibilitySettings({
  settings,
  onUpdate,
}: TalentVisibilitySettingsProps): React.ReactElement {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const updateSetting = (key: string, value: boolean | string): void => {
    setError(null);
    startTransition(async () => {
      try {
        const response = await fetch("/api/settings/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ [key]: value }),
        });

        const data = (await response.json()) as ApiResponse;

        if (!response.ok) {
          setError(data.error ?? "Failed to update setting");
          return;
        }

        toast({
          title: "Settings updated",
          description: "Your profile settings have been saved.",
        });
        onUpdate();
      } catch {
        setError("Something went wrong. Please try again.");
      }
    });
  };

  const updateSection = (section: keyof PublicSections, value: boolean): void => {
    const newSections = { ...settings.publicSections, [section]: value };
    updateSetting("publicSections", JSON.stringify(newSections));
  };

  const sectionLabels: Record<keyof PublicSections, { label: string; description: string }> = {
    basicInfo: {
      label: "Basic Information",
      description: "Name, pronouns, and stage name",
    },
    bio: {
      label: "Biography",
      description: "Your personal bio and story",
    },
    headshots: {
      label: "Headshots",
      description: "Your professional photos",
    },
    videos: {
      label: "Performance Videos",
      description: "Video samples and reels",
    },
    workHistory: {
      label: "Work History",
      description: "Your performance credits",
    },
    education: {
      label: "Education & Training",
      description: "Schools and training programs",
    },
    skills: {
      label: "Skills",
      description: "Special skills and abilities",
    },
    contact: {
      label: "Contact Information",
      description: "Phone, email, and social links",
    },
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-destructive/10 text-destructive rounded-lg p-3 text-sm">{error}</div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            <CardTitle>Profile Visibility</CardTitle>
          </div>
          <CardDescription>Control whether your profile is visible to the public.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Public Profile</Label>
              <p className="text-muted-foreground text-sm">
                {settings.isPublic
                  ? "Your profile is visible to everyone"
                  : "Your profile is hidden from the public"}
              </p>
            </div>
            <Switch
              checked={settings.isPublic}
              onCheckedChange={(checked) => {
                updateSetting("isPublic", checked);
              }}
              disabled={isPending}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            <CardTitle>Search Visibility</CardTitle>
          </div>
          <CardDescription>
            Control whether producers can find you in talent searches.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Appear in Search Results</Label>
              <p className="text-muted-foreground text-sm">
                {settings.hideFromSearch
                  ? "You are hidden from talent searches"
                  : "Producers can find you when searching for talent"}
              </p>
            </div>
            <Switch
              checked={!settings.hideFromSearch}
              onCheckedChange={(checked) => {
                updateSetting("hideFromSearch", !checked);
              }}
              disabled={isPending}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Profile URL</CardTitle>
          <CardDescription>Choose a unique URL for your public profile.</CardDescription>
        </CardHeader>
        <CardContent>
          <UsernameForm
            currentUsername={settings.publicProfileSlug}
            isPending={isPending}
            onUpdate={onUpdate}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            {settings.isPublic ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
            <CardTitle>Section Visibility</CardTitle>
          </div>
          <CardDescription>
            Choose which sections are visible on your public profile.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {(Object.keys(sectionLabels) as (keyof PublicSections)[]).map((section) => (
            <div key={section} className="flex items-center justify-between py-2">
              <div className="space-y-0.5">
                <Label className="text-base">{sectionLabels[section].label}</Label>
                <p className="text-muted-foreground text-sm">
                  {sectionLabels[section].description}
                </p>
              </div>
              <Switch
                checked={settings.publicSections[section]}
                onCheckedChange={(checked) => {
                  updateSection(section, checked);
                }}
                disabled={isPending || !settings.isPublic}
              />
            </div>
          ))}
          {!settings.isPublic && (
            <p className="text-muted-foreground text-xs">
              Enable public profile to configure section visibility.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface UsernameFormProps {
  currentUsername: string | null;
  isPending: boolean;
  onUpdate: () => void;
}

function UsernameForm({
  currentUsername,
  isPending: parentPending,
  onUpdate,
}: UsernameFormProps): React.ReactElement {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { toast } = useToast();

  const handleSubmit = (formData: FormData): void => {
    setError(null);
    setSuccess(false);
    const username = formData.get("username") as string;

    startTransition(async () => {
      try {
        const response = await fetch("/api/profile/username", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username }),
        });

        const data = (await response.json()) as ApiResponse;

        if (!response.ok) {
          setError(data.error ?? "Failed to update username");
          return;
        }

        setSuccess(true);
        toast({
          title: "Username updated",
          description: "Your profile URL has been changed.",
        });
        onUpdate();
      } catch {
        setError("Something went wrong. Please try again.");
      }
    });
  };

  const isDisabled = isPending || parentPending;

  return (
    <form action={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-destructive/10 text-destructive rounded-lg p-3 text-sm">{error}</div>
      )}
      {success && (
        <div className="bg-primary/10 text-primary rounded-lg p-3 text-sm">
          Username updated successfully!
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <div className="flex gap-2">
          <div className="text-muted-foreground bg-muted flex items-center rounded-l-lg border border-r-0 px-3 text-sm">
            dramatis.hq/talent/
          </div>
          <Input
            id="username"
            name="username"
            defaultValue={currentUsername ?? ""}
            placeholder="your-username"
            className="rounded-l-none"
            disabled={isDisabled}
          />
        </div>
        <p className="text-muted-foreground text-xs">
          Only lowercase letters, numbers, and hyphens allowed.
        </p>
      </div>
      <Button type="submit" disabled={isDisabled}>
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          "Update Username"
        )}
      </Button>
    </form>
  );
}

interface ProducerSettingsFormProps {
  settings: ProducerProfileSettings;
  onUpdate: () => void;
}

export function ProducerSettingsForm({
  settings,
  onUpdate,
}: ProducerSettingsFormProps): React.ReactElement {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const updateSetting = (key: string, value: boolean | string): void => {
    setError(null);
    startTransition(async () => {
      try {
        const response = await fetch("/api/settings/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ [key]: value }),
        });

        const data = (await response.json()) as ApiResponse;

        if (!response.ok) {
          setError(data.error ?? "Failed to update setting");
          return;
        }

        toast({
          title: "Settings updated",
          description: "Your profile settings have been saved.",
        });
        onUpdate();
      } catch {
        setError("Something went wrong. Please try again.");
      }
    });
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-destructive/10 text-destructive rounded-lg p-3 text-sm">{error}</div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            <CardTitle>Company Visibility</CardTitle>
          </div>
          <CardDescription>
            Control whether your company profile is visible to talent.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Public Company Page</Label>
              <p className="text-muted-foreground text-sm">
                {settings.isPublic
                  ? "Your company page is visible to talent"
                  : "Your company page is hidden"}
              </p>
            </div>
            <Switch
              checked={settings.isPublic}
              onCheckedChange={(checked) => {
                updateSetting("isPublic", checked);
              }}
              disabled={isPending}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Company URL</CardTitle>
          <CardDescription>Your company page URL. Contact support to change this.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <div className="text-muted-foreground bg-muted flex items-center rounded-lg border px-3 py-2 text-sm">
              dramatis.hq/company/{settings.slug}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export type { ProfileSettings, TalentProfileSettings, ProducerProfileSettings };

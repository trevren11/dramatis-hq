"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Shield, Globe, Eye, EyeOff, Loader2, Check, AlertCircle } from "lucide-react";
import { QRCodeGenerator } from "./QRCodeGenerator";
import type { PublicSections } from "@/lib/db/schema/talent-profiles";

interface Props {
  initialUsername: string | null;
  initialIsPublic: boolean;
  initialSections: PublicSections;
  onSave: (data: {
    publicProfileSlug: string | null;
    isPublic: boolean;
    publicSections: PublicSections;
  }) => Promise<void>;
}

interface UsernameCheckResponse {
  available?: boolean;
  error?: string;
}

interface UsernameUpdateResponse {
  error?: string;
}

const SECTION_LABELS: Record<keyof PublicSections, { label: string; description: string }> = {
  basicInfo: { label: "Basic Info", description: "Name, location, pronouns, and unions" },
  bio: { label: "Bio", description: "Your profile bio/about section" },
  headshots: { label: "Headshots", description: "Your uploaded photos" },
  workHistory: { label: "Work History", description: "Your credits and work experience" },
  education: { label: "Education", description: "Training and education history" },
  skills: { label: "Skills", description: "Your listed skills and abilities" },
  contact: { label: "Contact Form", description: "Allow visitors to send you messages" },
};

// eslint-disable-next-line complexity
export function PrivacySettings({
  initialUsername,
  initialIsPublic,
  initialSections,
  onSave,
}: Props): React.ReactElement {
  const [username, setUsername] = useState(initialUsername ?? "");
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [sections, setSections] = useState<PublicSections>(initialSections);
  const [isSaving, setIsSaving] = useState(false);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (!username || username === initialUsername) {
      setUsernameAvailable(null);
      setUsernameError(null);
      return;
    }

    const checkUsername = async (): Promise<void> => {
      setIsCheckingUsername(true);
      try {
        const response = await fetch(
          `/api/profile/username?username=${encodeURIComponent(username)}`
        );
        const data = (await response.json()) as UsernameCheckResponse;
        setUsernameAvailable(data.available ?? null);
        setUsernameError(data.error ?? null);
      } catch {
        setUsernameError("Failed to check username");
      } finally {
        setIsCheckingUsername(false);
      }
    };

    const timeoutId = setTimeout((): void => {
      void checkUsername();
    }, 500);

    return (): void => {
      clearTimeout(timeoutId);
    };
  }, [username, initialUsername]);

  const handleSectionChange = (key: keyof PublicSections, checked: boolean): void => {
    setSections((prev) => ({ ...prev, [key]: checked }));
  };

  const handleSave = async (): Promise<void> => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      // First update the username if changed
      if (username && username !== initialUsername) {
        const response = await fetch("/api/profile/username", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username }),
        });
        if (!response.ok) {
          const data = (await response.json()) as UsernameUpdateResponse;
          throw new Error(data.error ?? "Failed to update username");
        }
      }

      // Then save all settings via the parent callback
      await onSave({
        publicProfileSlug: username || null,
        isPublic,
        publicSections: sections,
      });

      setSaveSuccess(true);
      setTimeout((): void => {
        setSaveSuccess(false);
      }, 3000);
    } catch (error) {
      console.error("Failed to save settings:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges =
    username !== (initialUsername ?? "") ||
    isPublic !== initialIsPublic ||
    JSON.stringify(sections) !== JSON.stringify(initialSections);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="mr-2 h-5 w-5" />
            Profile Visibility
          </CardTitle>
          <CardDescription>
            Control who can see your profile and what information is displayed
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Public Profile Toggle */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="flex items-center gap-3">
              {isPublic ? (
                <Globe className="text-success h-5 w-5" />
              ) : (
                <EyeOff className="text-muted-foreground h-5 w-5" />
              )}
              <div>
                <div className="font-medium">Public Profile</div>
                <div className="text-muted-foreground text-sm">
                  {isPublic
                    ? "Your profile is visible to anyone with the link"
                    : "Your profile is hidden from public view"}
                </div>
              </div>
            </div>
            <Checkbox
              checked={isPublic}
              onCheckedChange={(checked): void => {
                setIsPublic(checked);
              }}
            />
          </div>

          {/* Username */}
          <div className="space-y-2">
            <label className="font-medium">Profile URL</label>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-sm">/talent/</span>
              <div className="relative flex-1">
                <Input
                  value={username}
                  onChange={(e): void => {
                    setUsername(e.target.value.toLowerCase());
                  }}
                  placeholder="your-username"
                  disabled={!isPublic}
                />
                {isCheckingUsername && (
                  <Loader2 className="text-muted-foreground absolute top-3 right-3 h-4 w-4 animate-spin" />
                )}
                {!isCheckingUsername &&
                  usernameAvailable === true &&
                  username !== initialUsername && (
                    <Check className="text-success absolute top-3 right-3 h-4 w-4" />
                  )}
                {!isCheckingUsername && usernameAvailable === false && (
                  <AlertCircle className="text-error absolute top-3 right-3 h-4 w-4" />
                )}
              </div>
            </div>
            {usernameError && <p className="text-error text-sm">{usernameError}</p>}
            {usernameAvailable === false && !usernameError && (
              <p className="text-error text-sm">This username is already taken</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Section Visibility */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Eye className="mr-2 h-5 w-5" />
            Section Visibility
          </CardTitle>
          <CardDescription>
            Choose which sections are visible on your public profile
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {(Object.keys(SECTION_LABELS) as (keyof PublicSections)[]).map((key) => (
              <div key={key} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <div className="font-medium">{SECTION_LABELS[key].label}</div>
                  <div className="text-muted-foreground text-sm">
                    {SECTION_LABELS[key].description}
                  </div>
                </div>
                <Checkbox
                  checked={sections[key]}
                  onCheckedChange={(checked): void => {
                    handleSectionChange(key, checked);
                  }}
                  disabled={!isPublic}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* QR Code */}
      {isPublic && username && <QRCodeGenerator username={username} />}

      {/* Save Button */}
      <div className="flex items-center justify-end gap-4">
        {saveSuccess && (
          <span className="text-success flex items-center text-sm">
            <Check className="mr-1 h-4 w-4" />
            Settings saved
          </span>
        )}
        <Button
          onClick={(): void => {
            void handleSave();
          }}
          disabled={isSaving || !hasChanges}
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Settings"
          )}
        </Button>
      </div>
    </div>
  );
}

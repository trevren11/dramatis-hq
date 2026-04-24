"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Save, Check } from "lucide-react";
import { UNION_OPTIONS, type ProfileUpdate } from "@/lib/validations/profile";
import type { TalentProfile } from "@/lib/db/schema";

interface ProfileEditFormProps {
  initialProfile: TalentProfile;
}

interface ApiErrorResponse {
  error?: string;
}

// eslint-disable-next-line complexity
export function ProfileEditForm({ initialProfile }: ProfileEditFormProps): React.ReactElement {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [formData, setFormData] = useState<Partial<ProfileUpdate>>({
    firstName: initialProfile.firstName,
    lastName: initialProfile.lastName,
    stageName: initialProfile.stageName,
    pronouns: initialProfile.pronouns,
    bio: initialProfile.bio,
    location: initialProfile.location,
    phone: initialProfile.phone,
    website: initialProfile.website,
    socialLinks: initialProfile.socialLinks,
    unionMemberships: initialProfile.unionMemberships ?? [],
    isPublic: initialProfile.isPublic ?? true,
    hideFromSearch: initialProfile.hideFromSearch ?? false,
  });

  const saveProfile = useCallback(async () => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/talent/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data: ApiErrorResponse = (await response.json()) as ApiErrorResponse;
        throw new Error(data.error ?? "Failed to save profile");
      }

      setHasChanges(false);
      setLastSaved(new Date());
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save profile",
      });
    } finally {
      setIsSaving(false);
    }
  }, [formData, toast]);

  const updateFormData = useCallback((data: Partial<ProfileUpdate>): void => {
    setFormData((prev) => ({ ...prev, ...data }));
    setHasChanges(true);
  }, []);

  useEffect(() => {
    if (hasChanges) {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(() => {
        void saveProfile();
      }, 2000);
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [hasChanges, saveProfile]);

  const socialLinks = formData.socialLinks ?? {};

  const updateSocialLink = (key: string, value: string): void => {
    updateFormData({
      socialLinks: {
        ...socialLinks,
        [key]: value || undefined,
      },
    });
  };

  const toggleUnion = (value: string): void => {
    const currentUnions = formData.unionMemberships ?? [];
    const newUnions = currentUnions.includes(value)
      ? currentUnions.filter((u) => u !== value)
      : [...currentUnions, value];
    updateFormData({ unionMemberships: newUnions });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Edit Profile</h1>
          <p className="text-muted-foreground text-sm">
            {isSaving ? (
              <span className="flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                Saving...
              </span>
            ) : lastSaved ? (
              <span className="flex items-center gap-1">
                <Check className="h-3 w-3" />
                Saved
              </span>
            ) : hasChanges ? (
              "Unsaved changes"
            ) : (
              "All changes saved"
            )}
          </p>
        </div>
        <Button onClick={() => void saveProfile()} disabled={isSaving || !hasChanges}>
          {isSaving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save Changes
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="firstName" className="text-sm font-medium">
                First Name <span className="text-destructive">*</span>
              </label>
              <Input
                id="firstName"
                value={formData.firstName ?? ""}
                onChange={(e) => {
                  updateFormData({ firstName: e.target.value });
                }}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="lastName" className="text-sm font-medium">
                Last Name <span className="text-destructive">*</span>
              </label>
              <Input
                id="lastName"
                value={formData.lastName ?? ""}
                onChange={(e) => {
                  updateFormData({ lastName: e.target.value });
                }}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="stageName" className="text-sm font-medium">
                Stage Name
              </label>
              <Input
                id="stageName"
                value={formData.stageName ?? ""}
                onChange={(e) => {
                  updateFormData({ stageName: e.target.value || null });
                }}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="pronouns" className="text-sm font-medium">
                Pronouns
              </label>
              <Input
                id="pronouns"
                value={formData.pronouns ?? ""}
                onChange={(e) => {
                  updateFormData({ pronouns: e.target.value || null });
                }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="location" className="text-sm font-medium">
              Location
            </label>
            <Input
              id="location"
              value={formData.location ?? ""}
              onChange={(e) => {
                updateFormData({ location: e.target.value || null });
              }}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="bio" className="text-sm font-medium">
              Bio
            </label>
            <textarea
              id="bio"
              value={formData.bio ?? ""}
              onChange={(e) => {
                updateFormData({ bio: e.target.value || null });
              }}
              className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[120px] w-full rounded-lg border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              maxLength={2000}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="phone" className="text-sm font-medium">
                Phone Number
              </label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone ?? ""}
                onChange={(e) => {
                  updateFormData({ phone: e.target.value || null });
                }}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="website" className="text-sm font-medium">
                Website
              </label>
              <Input
                id="website"
                type="url"
                value={formData.website ?? ""}
                onChange={(e) => {
                  updateFormData({ website: e.target.value || null });
                }}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="edit-instagram" className="text-sm font-medium">
                Instagram
              </label>
              <Input
                id="edit-instagram"
                value={socialLinks.instagram ?? ""}
                onChange={(e) => {
                  updateSocialLink("instagram", e.target.value);
                }}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="edit-tiktok" className="text-sm font-medium">
                TikTok
              </label>
              <Input
                id="edit-tiktok"
                value={socialLinks.tiktok ?? ""}
                onChange={(e) => {
                  updateSocialLink("tiktok", e.target.value);
                }}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="edit-twitter" className="text-sm font-medium">
                X (Twitter)
              </label>
              <Input
                id="edit-twitter"
                value={socialLinks.twitter ?? ""}
                onChange={(e) => {
                  updateSocialLink("twitter", e.target.value);
                }}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="edit-imdb" className="text-sm font-medium">
                IMDb
              </label>
              <Input
                id="edit-imdb"
                value={socialLinks.imdb ?? ""}
                onChange={(e) => {
                  updateSocialLink("imdb", e.target.value);
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Union Memberships</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {UNION_OPTIONS.map((union) => (
              <label
                key={union.value}
                className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                  (formData.unionMemberships ?? []).includes(union.value)
                    ? "border-primary bg-primary/5"
                    : "border-input hover:bg-muted/50"
                }`}
              >
                <input
                  type="checkbox"
                  checked={(formData.unionMemberships ?? []).includes(union.value)}
                  onChange={() => {
                    toggleUnion(union.value);
                  }}
                  className="text-primary focus:ring-primary h-4 w-4 rounded border-gray-300"
                />
                <span className="text-sm font-medium">{union.label}</span>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Privacy Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex cursor-pointer items-center justify-between rounded-lg border p-4">
            <div>
              <p className="font-medium">Public Profile</p>
              <p className="text-muted-foreground text-sm">Allow anyone to view your profile</p>
            </div>
            <input
              type="checkbox"
              checked={formData.isPublic ?? true}
              onChange={(e) => {
                updateFormData({ isPublic: e.target.checked });
              }}
              className="text-primary focus:ring-primary h-5 w-5 rounded border-gray-300"
            />
          </label>

          <label className="flex cursor-pointer items-center justify-between rounded-lg border p-4">
            <div>
              <p className="font-medium">Hide from Search</p>
              <p className="text-muted-foreground text-sm">
                Don&apos;t show your profile in producer searches
              </p>
            </div>
            <input
              type="checkbox"
              checked={formData.hideFromSearch ?? false}
              onChange={(e) => {
                updateFormData({ hideFromSearch: e.target.checked });
              }}
              className="text-primary focus:ring-primary h-5 w-5 rounded border-gray-300"
            />
          </label>
        </CardContent>
      </Card>
    </div>
  );
}

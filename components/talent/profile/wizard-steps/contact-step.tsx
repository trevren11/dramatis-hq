"use client";

import { Input } from "@/components/ui/input";
import type { ProfileUpdate } from "@/lib/validations/profile";

interface ContactStepProps {
  data: Partial<ProfileUpdate>;
  onUpdate: (data: Partial<ProfileUpdate>) => void;
}

export function ContactStep({ data, onUpdate }: ContactStepProps): React.ReactElement {
  const socialLinks = data.socialLinks ?? {};

  const updateSocialLink = (key: string, value: string): void => {
    onUpdate({
      socialLinks: {
        ...socialLinks,
        [key]: value || undefined,
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-sm font-semibold">Contact Information</h3>

        <div className="space-y-2">
          <label htmlFor="phone" className="text-sm font-medium">
            Phone Number
          </label>
          <Input
            id="phone"
            type="tel"
            value={data.phone ?? ""}
            onChange={(e) => { onUpdate({ phone: e.target.value || null }); }}
            placeholder="(555) 123-4567"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="website" className="text-sm font-medium">
            Website
          </label>
          <Input
            id="website"
            type="url"
            value={data.website ?? ""}
            onChange={(e) => { onUpdate({ website: e.target.value || null }); }}
            placeholder="https://yourwebsite.com"
          />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-semibold">Social Media</h3>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="instagram" className="text-sm font-medium">
              Instagram
            </label>
            <Input
              id="instagram"
              value={socialLinks.instagram ?? ""}
              onChange={(e) => { updateSocialLink("instagram", e.target.value); }}
              placeholder="@username"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="tiktok" className="text-sm font-medium">
              TikTok
            </label>
            <Input
              id="tiktok"
              value={socialLinks.tiktok ?? ""}
              onChange={(e) => { updateSocialLink("tiktok", e.target.value); }}
              placeholder="@username"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="twitter" className="text-sm font-medium">
              X (Twitter)
            </label>
            <Input
              id="twitter"
              value={socialLinks.twitter ?? ""}
              onChange={(e) => { updateSocialLink("twitter", e.target.value); }}
              placeholder="@username"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="youtube" className="text-sm font-medium">
              YouTube
            </label>
            <Input
              id="youtube"
              value={socialLinks.youtube ?? ""}
              onChange={(e) => { updateSocialLink("youtube", e.target.value); }}
              placeholder="Channel URL"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="linkedin" className="text-sm font-medium">
              LinkedIn
            </label>
            <Input
              id="linkedin"
              value={socialLinks.linkedin ?? ""}
              onChange={(e) => { updateSocialLink("linkedin", e.target.value); }}
              placeholder="Profile URL"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="imdb" className="text-sm font-medium">
              IMDb
            </label>
            <Input
              id="imdb"
              value={socialLinks.imdb ?? ""}
              onChange={(e) => { updateSocialLink("imdb", e.target.value); }}
              placeholder="IMDb profile URL"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { Input } from "@/components/ui/input";
import { Globe, Link2 } from "lucide-react";
import type { CompanyProfile } from "@/lib/validations/company";

interface ContactStepProps {
  data: Partial<CompanyProfile>;
  onUpdate: (data: Partial<CompanyProfile>) => void;
}

export function ContactStep({ data, onUpdate }: ContactStepProps): React.ReactElement {
  const socialLinks = data.socialLinks ?? {};

  const updateSocialLink = (key: keyof typeof socialLinks, value: string): void => {
    onUpdate({
      socialLinks: {
        ...socialLinks,
        [key]: value || undefined,
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label htmlFor="website" className="flex items-center gap-2 text-sm font-medium">
          <Globe className="h-4 w-4" />
          Website
        </label>
        <Input
          id="website"
          type="url"
          value={data.website ?? ""}
          onChange={(e) => {
            onUpdate({ website: e.target.value || null });
          }}
          placeholder="https://yourcompany.com"
        />
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-medium">Social Media Links</h3>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label
              htmlFor="instagram"
              className="text-muted-foreground flex items-center gap-2 text-sm"
            >
              <Link2 className="h-4 w-4" />
              Instagram
            </label>
            <Input
              id="instagram"
              type="url"
              value={socialLinks.instagram ?? ""}
              onChange={(e) => {
                updateSocialLink("instagram", e.target.value);
              }}
              placeholder="https://instagram.com/yourcompany"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="twitter"
              className="text-muted-foreground flex items-center gap-2 text-sm"
            >
              <Link2 className="h-4 w-4" />X (Twitter)
            </label>
            <Input
              id="twitter"
              type="url"
              value={socialLinks.twitter ?? ""}
              onChange={(e) => {
                updateSocialLink("twitter", e.target.value);
              }}
              placeholder="https://twitter.com/yourcompany"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="facebook"
              className="text-muted-foreground flex items-center gap-2 text-sm"
            >
              <Link2 className="h-4 w-4" />
              Facebook
            </label>
            <Input
              id="facebook"
              type="url"
              value={socialLinks.facebook ?? ""}
              onChange={(e) => {
                updateSocialLink("facebook", e.target.value);
              }}
              placeholder="https://facebook.com/yourcompany"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="linkedin"
              className="text-muted-foreground flex items-center gap-2 text-sm"
            >
              <Link2 className="h-4 w-4" />
              LinkedIn
            </label>
            <Input
              id="linkedin"
              type="url"
              value={socialLinks.linkedin ?? ""}
              onChange={(e) => {
                updateSocialLink("linkedin", e.target.value);
              }}
              placeholder="https://linkedin.com/company/yourcompany"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="youtube"
              className="text-muted-foreground flex items-center gap-2 text-sm"
            >
              <Link2 className="h-4 w-4" />
              YouTube
            </label>
            <Input
              id="youtube"
              type="url"
              value={socialLinks.youtube ?? ""}
              onChange={(e) => {
                updateSocialLink("youtube", e.target.value);
              }}
              placeholder="https://youtube.com/@yourcompany"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="vimeo"
              className="text-muted-foreground flex items-center gap-2 text-sm"
            >
              <Link2 className="h-4 w-4" />
              Vimeo
            </label>
            <Input
              id="vimeo"
              type="url"
              value={socialLinks.vimeo ?? ""}
              onChange={(e) => {
                updateSocialLink("vimeo", e.target.value);
              }}
              placeholder="https://vimeo.com/yourcompany"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

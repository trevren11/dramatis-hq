"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link2 } from "lucide-react";
import type { CompanyProfile } from "@/lib/validations/company";

interface Props {
  data: Partial<CompanyProfile>;
  onUpdate: (data: Partial<CompanyProfile>) => void;
}

interface SocialLinks {
  instagram?: string;
  twitter?: string;
  linkedin?: string;
  facebook?: string;
  youtube?: string;
  vimeo?: string;
}

export function SocialStep({ data, onUpdate }: Props): React.ReactElement {
  const socialLinks = data.socialLinks ?? {};

  const updateSocialLink = (key: keyof SocialLinks, value: string): void => {
    onUpdate({
      socialLinks: {
        ...socialLinks,
        [key]: value || undefined,
      },
    });
  };

  return (
    <div className="space-y-6">
      <p className="text-muted-foreground text-sm">
        Add your social media links to help talent find and follow your company.
      </p>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="facebook" className="flex items-center gap-2">
            <Link2 className="h-4 w-4" /> Facebook
          </Label>
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
          <Label htmlFor="instagram" className="flex items-center gap-2">
            <Link2 className="h-4 w-4" /> Instagram
          </Label>
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
          <Label htmlFor="twitter" className="flex items-center gap-2">
            <Link2 className="h-4 w-4" /> X (Twitter)
          </Label>
          <Input
            id="twitter"
            type="url"
            value={socialLinks.twitter ?? ""}
            onChange={(e) => {
              updateSocialLink("twitter", e.target.value);
            }}
            placeholder="https://x.com/yourcompany"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="linkedin" className="flex items-center gap-2">
            <Link2 className="h-4 w-4" /> LinkedIn
          </Label>
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
          <Label htmlFor="youtube" className="flex items-center gap-2">
            <Link2 className="h-4 w-4" /> YouTube
          </Label>
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
          <Label htmlFor="vimeo" className="flex items-center gap-2">
            <Link2 className="h-4 w-4" /> Vimeo
          </Label>
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
  );
}

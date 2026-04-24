"use client";

import { Input } from "@/components/ui/input";
import type { ProfileUpdate } from "@/lib/validations/profile";

interface BasicInfoStepProps {
  data: Partial<ProfileUpdate>;
  onUpdate: (data: Partial<ProfileUpdate>) => void;
}

export function BasicInfoStep({ data, onUpdate }: BasicInfoStepProps): React.ReactElement {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="firstName" className="text-sm font-medium">
            First Name <span className="text-destructive">*</span>
          </label>
          <Input
            id="firstName"
            value={data.firstName ?? ""}
            onChange={(e) => {
              onUpdate({ firstName: e.target.value });
            }}
            placeholder="Your first name"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="lastName" className="text-sm font-medium">
            Last Name <span className="text-destructive">*</span>
          </label>
          <Input
            id="lastName"
            value={data.lastName ?? ""}
            onChange={(e) => {
              onUpdate({ lastName: e.target.value });
            }}
            placeholder="Your last name"
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
            value={data.stageName ?? ""}
            onChange={(e) => {
              onUpdate({ stageName: e.target.value || null });
            }}
            placeholder="Professional name (if different)"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="pronouns" className="text-sm font-medium">
            Pronouns
          </label>
          <Input
            id="pronouns"
            value={data.pronouns ?? ""}
            onChange={(e) => {
              onUpdate({ pronouns: e.target.value || null });
            }}
            placeholder="e.g., she/her, he/him, they/them"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="location" className="text-sm font-medium">
          Location
        </label>
        <Input
          id="location"
          value={data.location ?? ""}
          onChange={(e) => {
            onUpdate({ location: e.target.value || null });
          }}
          placeholder="City, State"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="bio" className="text-sm font-medium">
          Bio
        </label>
        <textarea
          id="bio"
          value={data.bio ?? ""}
          onChange={(e) => {
            onUpdate({ bio: e.target.value || null });
          }}
          placeholder="Tell producers about yourself, your training, and your experience..."
          className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[120px] w-full rounded-lg border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          maxLength={2000}
        />
        <p className="text-muted-foreground text-xs">{(data.bio ?? "").length}/2000 characters</p>
      </div>
    </div>
  );
}

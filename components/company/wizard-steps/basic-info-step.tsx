"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CompanyProfile } from "@/lib/validations/company";

interface Props {
  data: Partial<CompanyProfile>;
  onUpdate: (data: Partial<CompanyProfile>) => void;
}

export function BasicInfoStep({ data, onUpdate }: Props): React.ReactElement {
  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 100);
  };

  const handleNameChange = (name: string): void => {
    const updates: Partial<CompanyProfile> = { companyName: name };
    // Auto-generate slug if it hasn't been manually edited
    if (!data.slug || data.slug === generateSlug(data.companyName ?? "")) {
      updates.slug = generateSlug(name);
    }
    onUpdate(updates);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="companyName">Company Name *</Label>
        <Input
          id="companyName"
          value={data.companyName ?? ""}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder="Your Production Company"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="slug">Public URL</Label>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-sm">dramatis.com/company/</span>
          <Input
            id="slug"
            value={data.slug ?? ""}
            onChange={(e) => onUpdate({ slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })}
            placeholder="your-company"
            className="flex-1"
          />
        </div>
        <p className="text-muted-foreground text-xs">
          Only lowercase letters, numbers, and hyphens allowed
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">About Your Company</Label>
        <textarea
          id="description"
          value={data.description ?? ""}
          onChange={(e) => onUpdate({ description: e.target.value })}
          placeholder="Tell us about your production company, your mission, and the types of productions you create..."
          className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[120px] w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>
    </div>
  );
}

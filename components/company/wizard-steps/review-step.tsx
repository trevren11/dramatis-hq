"use client";

import { Badge } from "@/components/ui/badge";
import { UNION_STATUS_OPTIONS } from "@/lib/db/schema/producer-profiles";
import { MapPin, Globe, Building2, Link2 } from "lucide-react";
import type { CompanyProfile } from "@/lib/validations/company";

interface Props {
  data: Partial<CompanyProfile>;
}

function getUnionStatusLabel(value: string | undefined | null): string {
  if (!value) return "Not specified";
  return UNION_STATUS_OPTIONS.find((u) => u.value === value)?.label ?? value;
}

function getSocialLinkEntries(
  socialLinks: Record<string, string | undefined> | null | undefined
): [string, string][] {
  if (!socialLinks) return [];
  return Object.entries(socialLinks).filter(
    (entry): entry is [string, string] => typeof entry[1] === "string" && entry[1].length > 0
  );
}

export function ReviewStep({ data }: Props): React.ReactElement {
  const socialLinks = data.socialLinks ?? {};
  const socialLinkEntries = getSocialLinkEntries(socialLinks);

  return (
    <div className="space-y-6">
      <p className="text-muted-foreground text-sm">
        Review your company profile before creating it.
      </p>

      <div className="space-y-4 rounded-lg border p-4">
        <div className="flex items-start gap-4">
          <div className="bg-muted flex h-16 w-16 items-center justify-center rounded-lg">
            <Building2 className="text-muted-foreground h-8 w-8" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold">{data.companyName ?? "Company Name"}</h3>
            <p className="text-muted-foreground text-sm">
              dramatis.com/company/{data.slug ?? "your-company"}
            </p>
          </div>
        </div>

        {data.description && (
          <div className="border-t pt-4">
            <h4 className="mb-2 text-sm font-medium">About</h4>
            <p className="text-muted-foreground text-sm whitespace-pre-wrap">{data.description}</p>
          </div>
        )}

        <div className="border-t pt-4">
          <h4 className="mb-3 text-sm font-medium">Details</h4>
          <div className="grid gap-3 sm:grid-cols-2">
            {data.location && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="text-muted-foreground h-4 w-4" />
                <span>{data.location}</span>
              </div>
            )}
            {data.website && (
              <div className="flex items-center gap-2 text-sm">
                <Globe className="text-muted-foreground h-4 w-4" />
                <span className="truncate">{data.website.replace(/^https?:\/\//, "")}</span>
              </div>
            )}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge variant="outline">{getUnionStatusLabel(data.unionStatus)}</Badge>
            <Badge variant={data.isPublic ? "default" : "secondary"}>
              {data.isPublic ? "Public" : "Private"}
            </Badge>
          </div>
        </div>

        {socialLinkEntries.length > 0 && (
          <div className="border-t pt-4">
            <h4 className="mb-3 text-sm font-medium">Social Links</h4>
            <div className="flex flex-wrap gap-3">
              {socialLinkEntries.map(([platform]) => (
                <Badge key={platform} variant="outline" className="gap-1 capitalize">
                  <Link2 className="h-3 w-3" /> {platform}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

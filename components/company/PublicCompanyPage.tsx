"use client";

import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UNION_STATUS_OPTIONS } from "@/lib/db/schema/producer-profiles";
import { MapPin, Globe, Building2, ExternalLink, Link2 } from "lucide-react";
import type { ProducerProfile } from "@/lib/db/schema/producer-profiles";
import type { ProductionPhoto } from "@/lib/db/schema/production-photos";

interface Props {
  profile: ProducerProfile;
  photos: ProductionPhoto[];
}

interface SocialLinks {
  instagram?: string;
  twitter?: string;
  linkedin?: string;
  facebook?: string;
  youtube?: string;
  vimeo?: string;
}

function getUnionStatusLabel(value: string | null): string {
  if (!value) return "";
  return UNION_STATUS_OPTIONS.find((u) => u.value === value)?.label ?? value;
}

function getSocialLinkEntries(
  socialLinks: SocialLinks
): { platform: string; url: string; label: string }[] {
  const platforms: { key: keyof SocialLinks; label: string }[] = [
    { key: "instagram", label: "Instagram" },
    { key: "facebook", label: "Facebook" },
    { key: "twitter", label: "X" },
    { key: "linkedin", label: "LinkedIn" },
    { key: "youtube", label: "YouTube" },
    { key: "vimeo", label: "Vimeo" },
  ];

  return platforms
    .filter((p): p is { key: keyof SocialLinks; label: string } & { key: keyof SocialLinks } =>
      Boolean(socialLinks[p.key])
    )
    .map((p) => {
      const url = socialLinks[p.key];
      return {
        platform: p.key,
        url: url ?? "",
        label: p.label,
      };
    });
}

function SocialLinksSection({
  socialLinks,
}: {
  socialLinks: SocialLinks;
}): React.ReactElement | null {
  const entries = getSocialLinkEntries(socialLinks);
  if (entries.length === 0) return null;

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Connect</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-3">
          {entries.map(({ platform, url, label }) => (
            <a
              key={platform}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:bg-muted flex items-center gap-2 rounded-lg border px-4 py-2 transition-colors"
            >
              <Link2 className="h-5 w-5" />
              <span>{label}</span>
            </a>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function PhotoGallerySection({ photos }: { photos: ProductionPhoto[] }): React.ReactElement | null {
  if (photos.length === 0) return null;

  const featuredPhoto = photos.find((p) => p.isFeatured) ?? photos[0];
  const otherPhotos = photos.filter((p) => p.id !== featuredPhoto?.id);

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Productions</CardTitle>
      </CardHeader>
      <CardContent>
        {featuredPhoto && (
          <div className="mb-4">
            <div className="relative aspect-video overflow-hidden rounded-lg shadow-md">
              <Image
                src={featuredPhoto.url}
                alt={featuredPhoto.title ?? "Featured production"}
                fill
                className="object-cover"
              />
              {(featuredPhoto.title ?? featuredPhoto.productionName) && (
                <div className="absolute right-0 bottom-0 left-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                  {featuredPhoto.title && (
                    <p className="text-lg font-semibold text-white">{featuredPhoto.title}</p>
                  )}
                  {featuredPhoto.productionName && (
                    <p className="text-sm text-white/80">{featuredPhoto.productionName}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {otherPhotos.map((photo) => (
            <div
              key={photo.id}
              className="relative aspect-[4/3] overflow-hidden rounded-lg shadow-md transition-transform hover:scale-105"
            >
              <Image
                src={photo.thumbnailUrl ?? photo.url}
                alt={photo.title ?? "Production photo"}
                fill
                className="object-cover"
              />
              {photo.productionName && (
                <div className="absolute right-0 bottom-0 left-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                  <p className="truncate text-xs text-white">{photo.productionName}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function PublicCompanyPage({ profile, photos }: Props): React.ReactElement {
  const initials = profile.companyName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const socialLinks = profile.socialLinks ?? {};

  return (
    <>
      {/* Header Section */}
      <Card className="mb-6 overflow-hidden">
        <div className="from-primary/10 to-secondary/10 bg-gradient-to-r p-8">
          <div className="flex flex-col items-center text-center sm:flex-row sm:items-start sm:text-left">
            <Avatar className="ring-background h-32 w-32 shadow-xl ring-4">
              <AvatarImage src={profile.logoUrl ?? undefined} alt={profile.companyName} />
              <AvatarFallback className="text-3xl">
                {initials.length > 0 ? initials : <Building2 className="h-12 w-12" />}
              </AvatarFallback>
            </Avatar>
            <div className="mt-4 flex-1 sm:mt-0 sm:ml-6">
              <h1 className="text-3xl font-bold">{profile.companyName}</h1>
              {profile.location && (
                <div className="text-muted-foreground mt-2 flex items-center justify-center sm:justify-start">
                  <MapPin className="mr-1 h-4 w-4" />
                  {profile.location}
                </div>
              )}
              {profile.unionStatus && (
                <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
                  <Badge variant="secondary">{getUnionStatusLabel(profile.unionStatus)}</Badge>
                </div>
              )}
              {profile.website && (
                <div className="mt-4 flex items-center justify-center sm:justify-start">
                  <Globe className="text-muted-foreground mr-2 h-4 w-4" />
                  <a
                    href={profile.website}
                    className="text-primary flex items-center gap-1 hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {profile.website.replace(/^https?:\/\//, "")}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* About Section */}
      {profile.description && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>About</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground whitespace-pre-wrap">{profile.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Photo Gallery */}
      <PhotoGallerySection photos={photos} />

      {/* Social Links */}
      <SocialLinksSection socialLinks={socialLinks} />
    </>
  );
}

"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Edit,
  MapPin,
  Phone,
  Globe,
  Instagram,
  Twitter,
  Linkedin,
  Youtube,
  ExternalLink,
  Eye,
  EyeOff,
} from "lucide-react";
import { UNION_OPTIONS } from "@/lib/validations/profile";
import type { TalentProfile, WorkHistory, Education, Skill, Headshot } from "@/lib/db/schema";
import { WORK_CATEGORY_LABELS } from "@/lib/db/schema/work-history";

interface ProfileViewProps {
  profile: TalentProfile;
  workHistory: WorkHistory[];
  educationEntries: Education[];
  skills: Skill[];
  headshots: Headshot[];
  isOwnProfile?: boolean;
}

export function ProfileView({
  profile,
  workHistory,
  educationEntries,
  skills,
  headshots,
  isOwnProfile = false,
}: ProfileViewProps): React.ReactElement {
  const primaryHeadshot = headshots.find((h) => h.isPrimary) ?? headshots[0];
  const displayName = profile.stageName ?? `${profile.firstName} ${profile.lastName}`;
  const socialLinks = profile.socialLinks ?? {};

  const getUnionLabel = (value: string): string => {
    return UNION_OPTIONS.find((u) => u.value === value)?.label ?? value;
  };

  const completeness = calculateProfileCompleteness(profile, workHistory, headshots, skills);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Avatar className="h-24 w-24">
            <AvatarImage src={primaryHeadshot?.url} alt={displayName} />
            <AvatarFallback className="text-2xl">
              {profile.firstName[0]}
              {profile.lastName[0]}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold">{displayName}</h1>
            {profile.stageName && (
              <p className="text-muted-foreground">
                {profile.firstName} {profile.lastName}
              </p>
            )}
            {profile.pronouns && (
              <p className="text-muted-foreground text-sm">{profile.pronouns}</p>
            )}
            {profile.location && (
              <p className="text-muted-foreground flex items-center gap-1 text-sm">
                <MapPin className="h-3 w-3" />
                {profile.location}
              </p>
            )}
            <div className="mt-2 flex flex-wrap gap-2">
              {profile.isPublic ? (
                <Badge variant="secondary" className="text-xs">
                  <Eye className="mr-1 h-3 w-3" />
                  Public
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs">
                  <EyeOff className="mr-1 h-3 w-3" />
                  Private
                </Badge>
              )}
            </div>
          </div>
        </div>

        {isOwnProfile && (
          <div className="flex gap-2">
            <Button asChild>
              <Link href="/talent/profile/edit">
                <Edit className="mr-2 h-4 w-4" />
                Edit Profile
              </Link>
            </Button>
          </div>
        )}
      </div>

      {isOwnProfile && completeness < 100 && (
        <Card className="border-warning bg-warning/5">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Profile Completeness: {completeness}%</p>
                <p className="text-muted-foreground text-sm">
                  Complete your profile to be more discoverable to producers.
                </p>
              </div>
              <div className="bg-muted h-2 w-32 overflow-hidden rounded-full">
                <div
                  className="bg-primary h-full transition-all"
                  style={{ width: `${completeness}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {profile.bio && (
        <Card>
          <CardHeader>
            <CardTitle>About</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{profile.bio}</p>
          </CardContent>
        </Card>
      )}

      {(profile.unionMemberships ?? []).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Union Memberships</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {(profile.unionMemberships ?? []).map((union) => (
                <Badge key={union} variant="secondary">
                  {getUnionLabel(union)}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {workHistory.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Work History</CardTitle>
            {isOwnProfile && (
              <Button variant="outline" size="sm" asChild>
                <Link href="/talent/profile/work-history">Manage</Link>
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {workHistory.map((entry) => (
                <div key={entry.id} className="border-b pb-4 last:border-b-0 last:pb-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{entry.showName}</p>
                      <p className="text-muted-foreground text-sm">{entry.role}</p>
                      <div className="mt-1 flex flex-wrap gap-2">
                        <Badge variant="outline" className="text-xs">
                          {WORK_CATEGORY_LABELS[entry.category]}
                        </Badge>
                        {entry.isUnion && (
                          <Badge variant="secondary" className="text-xs">
                            Union
                          </Badge>
                        )}
                      </div>
                    </div>
                    {entry.location && (
                      <p className="text-muted-foreground text-sm">{entry.location}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {educationEntries.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Education & Training</CardTitle>
            {isOwnProfile && (
              <Button variant="outline" size="sm" asChild>
                <Link href="/talent/profile/education">Manage</Link>
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {educationEntries.map((entry) => (
                <div key={entry.id} className="border-b pb-4 last:border-b-0 last:pb-0">
                  <p className="font-medium">{entry.program}</p>
                  <p className="text-muted-foreground text-sm">{entry.institution}</p>
                  {entry.degree && (
                    <p className="text-muted-foreground text-sm">{entry.degree}</p>
                  )}
                  {(entry.startYear || entry.endYear) && (
                    <p className="text-muted-foreground text-sm">
                      {entry.startYear}
                      {entry.endYear && ` - ${entry.endYear}`}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {skills.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Special Skills</CardTitle>
            {isOwnProfile && (
              <Button variant="outline" size="sm" asChild>
                <Link href="/talent/profile/skills">Manage</Link>
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => (
                <Badge key={skill.id} variant="outline">
                  {skill.name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Contact & Social</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {profile.phone && (
              <div className="flex items-center gap-2">
                <Phone className="text-muted-foreground h-4 w-4" />
                <span>{profile.phone}</span>
              </div>
            )}
            {profile.website && (
              <a
                href={profile.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary flex items-center gap-2 hover:underline"
              >
                <Globe className="h-4 w-4" />
                <span>Website</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
            {socialLinks.instagram && (
              <div className="flex items-center gap-2">
                <Instagram className="text-muted-foreground h-4 w-4" />
                <span>{socialLinks.instagram}</span>
              </div>
            )}
            {socialLinks.twitter && (
              <div className="flex items-center gap-2">
                <Twitter className="text-muted-foreground h-4 w-4" />
                <span>{socialLinks.twitter}</span>
              </div>
            )}
            {socialLinks.linkedin && (
              <div className="flex items-center gap-2">
                <Linkedin className="text-muted-foreground h-4 w-4" />
                <span>{socialLinks.linkedin}</span>
              </div>
            )}
            {socialLinks.youtube && (
              <div className="flex items-center gap-2">
                <Youtube className="text-muted-foreground h-4 w-4" />
                <span>{socialLinks.youtube}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function calculateProfileCompleteness(
  profile: TalentProfile,
  workHistory: WorkHistory[],
  headshots: Headshot[],
  skills: Skill[]
): number {
  const checks = [
    Boolean(profile.firstName && profile.lastName),
    Boolean(profile.bio),
    Boolean(profile.location),
    headshots.length > 0,
    workHistory.length > 0,
    skills.length > 0,
    (profile.unionMemberships ?? []).length > 0,
    Boolean(profile.phone || profile.website),
  ];

  const completed = checks.filter(Boolean).length;
  return Math.round((completed / checks.length) * 100);
}

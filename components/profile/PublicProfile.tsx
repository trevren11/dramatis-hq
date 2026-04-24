import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UNION_OPTIONS } from "@/lib/validations/profile";
import { MapPin, Globe, Briefcase, GraduationCap, Sparkles } from "lucide-react";
import type { TalentProfile, PublicSections } from "@/lib/db/schema/talent-profiles";

interface Props {
  profile: TalentProfile;
  sections: PublicSections;
  workHistory: { id: string; showName: string; role: string; category: string }[];
  education: { id: string; program: string; institution: string }[];
  headshots: { id: string; url: string; thumbnailUrl: string | null; isPrimary: boolean }[];
  skills: { id: string; name: string; category: string }[];
}

function getUnionLabel(value: string): string {
  return UNION_OPTIONS.find((u) => u.value === value)?.label ?? value;
}

// eslint-disable-next-line complexity
export function PublicProfile({
  profile,
  sections,
  workHistory,
  education,
  headshots,
  skills,
}: Props): React.ReactElement {
  const primaryHeadshot = headshots.find((p) => p.isPrimary) ?? headshots[0];
  const initials = `${profile.firstName[0] ?? ""}${profile.lastName[0] ?? ""}`.toUpperCase();
  const displayName = profile.stageName ?? `${profile.firstName} ${profile.lastName}`;

  return (
    <>
      {/* Header Section */}
      {sections.basicInfo && (
        <Card className="mb-6 overflow-hidden">
          <div className="from-primary/10 to-secondary/10 bg-gradient-to-r p-8">
            <div className="flex flex-col items-center text-center sm:flex-row sm:items-start sm:text-left">
              <Avatar className="ring-background h-32 w-32 shadow-xl ring-4">
                <AvatarImage src={primaryHeadshot?.url} alt={displayName} />
                <AvatarFallback className="text-3xl">{initials}</AvatarFallback>
              </Avatar>
              <div className="mt-4 sm:mt-0 sm:ml-6">
                <h1 className="text-3xl font-bold">{displayName}</h1>
                {profile.pronouns && (
                  <p className="text-muted-foreground mt-1">{profile.pronouns}</p>
                )}
                {profile.location && (
                  <div className="text-muted-foreground mt-2 flex items-center justify-center sm:justify-start">
                    <MapPin className="mr-1 h-4 w-4" />
                    {profile.location}
                  </div>
                )}
                {profile.unionMemberships && profile.unionMemberships.length > 0 && (
                  <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
                    {profile.unionMemberships.map((u) => (
                      <Badge key={u} variant="secondary">
                        {getUnionLabel(u)}
                      </Badge>
                    ))}
                  </div>
                )}
                {profile.website && (
                  <div className="mt-4 flex items-center justify-center sm:justify-start">
                    <Globe className="text-muted-foreground mr-2 h-4 w-4" />
                    <a
                      href={profile.website}
                      className="text-primary hover:underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {profile.website.replace(/^https?:\/\//, "")}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Bio Section */}
      {sections.bio && profile.bio && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>About</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground whitespace-pre-wrap">{profile.bio}</p>
          </CardContent>
        </Card>
      )}

      {/* Headshots Gallery */}
      {sections.headshots && headshots.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Photos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {headshots.map((photo) => (
                <div
                  key={photo.id}
                  className="relative aspect-[3/4] overflow-hidden rounded-lg shadow-md transition-transform hover:scale-105"
                >
                  <Image
                    src={photo.thumbnailUrl ?? photo.url}
                    alt="Headshot"
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Work History */}
      {sections.workHistory && workHistory.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Briefcase className="mr-2 h-5 w-5" />
              Credits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {workHistory.map((work) => (
                <div key={work.id} className="border-b pb-4 last:border-0 last:pb-0">
                  <h4 className="font-semibold">{work.showName}</h4>
                  <p className="text-muted-foreground">{work.role}</p>
                  <Badge variant="outline" className="mt-1">
                    {work.category.replace(/_/g, " ")}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Education */}
      {sections.education && education.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <GraduationCap className="mr-2 h-5 w-5" />
              Training
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {education.map((edu) => (
                <div key={edu.id} className="border-b pb-4 last:border-0 last:pb-0">
                  <h4 className="font-semibold">{edu.program}</h4>
                  <p className="text-muted-foreground">{edu.institution}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Skills */}
      {sections.skills && skills.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Sparkles className="mr-2 h-5 w-5" />
              Skills
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => (
                <Badge key={skill.id} variant="secondary">
                  {skill.name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}

import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  talentProfiles,
  workHistory,
  education,
  headshots,
  talentSkills,
  skills,
  videoSamples,
} from "@/lib/db/schema";
import { eq, asc, inArray } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UNION_OPTIONS } from "@/lib/validations/profile";
import {
  Edit,
  MapPin,
  Phone,
  Globe,
  Briefcase,
  GraduationCap,
  Sparkles,
  Camera,
  Video,
  User,
} from "lucide-react";
import { heightToFeetInches } from "@/lib/validations/physical-attributes";

function getUnionLabel(value: string): string {
  return UNION_OPTIONS.find((u) => u.value === value)?.label ?? value;
}

function formatLabel(value: string): string {
  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatHeight(inches: number): string {
  const { feet, inches: inchesRemainder } = heightToFeetInches(inches);
  return `${String(feet)}'${String(inchesRemainder)}"`;
}

interface ProfileCounts {
  work: number;
  education: number;
  headshots: number;
  videos: number;
  skills: number;
}

function calculateCompleteness(
  profile: { bio?: string | null; location?: string | null; phone?: string | null },
  counts: ProfileCounts
): number {
  let score = 0;
  if (profile.bio) score++;
  if (profile.location) score++;
  if (profile.phone) score++;
  if (counts.work > 0) score++;
  if (counts.education > 0) score++;
  if (counts.headshots > 0) score++;
  if (counts.videos > 0) score++;
  if (counts.skills > 0) score++;
  return Math.round((score / 8) * 100);
}

// eslint-disable-next-line complexity
export default async function ProfilePage(): Promise<React.ReactElement> {
  const session = await auth();
  if (!session?.user.id) {
    redirect("/login");
  }

  const profile = await db.query.talentProfiles.findFirst({
    where: eq(talentProfiles.userId, session.user.id),
  });

  if (!profile) {
    redirect("/talent/profile/wizard");
  }

  const [work, edu, photos, videos, userSkills] = await Promise.all([
    db.query.workHistory.findMany({
      where: eq(workHistory.talentProfileId, profile.id),
      orderBy: [asc(workHistory.sortOrder)],
    }),
    db.query.education.findMany({
      where: eq(education.talentProfileId, profile.id),
      orderBy: [asc(education.sortOrder)],
    }),
    db.query.headshots.findMany({
      where: eq(headshots.talentProfileId, profile.id),
      orderBy: [asc(headshots.sortOrder)],
    }),
    db.query.videoSamples.findMany({
      where: eq(videoSamples.talentProfileId, profile.id),
      orderBy: [asc(videoSamples.sortOrder)],
    }),
    db.query.talentSkills.findMany({
      where: eq(talentSkills.talentProfileId, profile.id),
    }),
  ]);

  const skillIds = userSkills.map((s) => s.skillId);
  const skillDetails =
    skillIds.length > 0
      ? await db.query.skills.findMany({ where: inArray(skills.id, skillIds) })
      : [];

  const counts: ProfileCounts = {
    work: work.length,
    education: edu.length,
    headshots: photos.length,
    videos: videos.length,
    skills: skillDetails.length,
  };
  const completeness = calculateCompleteness(profile, counts);
  const primaryHeadshot = photos.find((p) => p.isPrimary);
  const initials = `${profile.firstName[0] ?? ""}${profile.lastName[0] ?? ""}`.toUpperCase();

  return (
    <div className="container py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">My Profile</h1>
        <Button asChild>
          <Link href="/talent/profile/edit">
            <Edit className="mr-2 h-4 w-4" />
            Edit Profile
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={primaryHeadshot?.url} alt={profile.firstName} />
                  <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
                </Avatar>
                <h2 className="mt-4 text-xl font-semibold">
                  {profile.stageName ?? `${profile.firstName} ${profile.lastName}`}
                </h2>
                {profile.pronouns && (
                  <p className="text-muted-foreground text-sm">{profile.pronouns}</p>
                )}
                {profile.location && (
                  <div className="text-muted-foreground mt-2 flex items-center text-sm">
                    <MapPin className="mr-1 h-4 w-4" />
                    {profile.location}
                  </div>
                )}
                {profile.unionMemberships && profile.unionMemberships.length > 0 && (
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    {profile.unionMemberships.map((u) => (
                      <Badge key={u} variant="secondary">
                        {getUnionLabel(u)}
                      </Badge>
                    ))}
                  </div>
                )}
                <div className="mt-6 w-full">
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span>Profile Completeness</span>
                    <span className={completeness === 100 ? "text-green-600" : "text-amber-600"}>
                      {String(completeness)}%
                    </span>
                  </div>
                  <div className="bg-muted h-2 rounded-full">
                    <div
                      className={`h-2 rounded-full ${completeness === 100 ? "bg-green-600" : "bg-amber-600"}`}
                      style={{ width: `${String(completeness)}%` }}
                    />
                  </div>
                </div>
                <div className="mt-6 w-full space-y-2 text-left text-sm">
                  {profile.phone && (
                    <div className="flex items-center">
                      <Phone className="text-muted-foreground mr-2 h-4 w-4" />
                      {profile.phone}
                    </div>
                  )}
                  {profile.website && (
                    <div className="flex items-center">
                      <Globe className="text-muted-foreground mr-2 h-4 w-4" />
                      <a
                        href={profile.website}
                        className="text-primary hover:underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {profile.website}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="mt-4">
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold">{photos.length}</div>
                  <div className="text-muted-foreground text-xs">Headshots</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{videos.length}</div>
                  <div className="text-muted-foreground text-xs">Videos</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{work.length}</div>
                  <div className="text-muted-foreground text-xs">Credits</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{edu.length}</div>
                  <div className="text-muted-foreground text-xs">Training</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{skillDetails.length}</div>
                  <div className="text-muted-foreground text-xs">Skills</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6 lg:col-span-2">
          {profile.bio && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">About</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap">{profile.bio}</p>
              </CardContent>
            </Card>
          )}
          {(() => {
            const visibility = profile.metricVisibility ?? {
              height: true,
              weight: false,
              eyeColor: true,
              hairColor: true,
              ethnicity: false,
              willingnessToChangeHair: false,
            };
            const visibleAttributes: { label: string; value: string }[] = [];
            if (visibility.height && profile.heightInches) {
              visibleAttributes.push({
                label: "Height",
                value: formatHeight(profile.heightInches),
              });
            }
            if (visibility.weight && profile.weightLbs) {
              visibleAttributes.push({
                label: "Weight",
                value: `${String(profile.weightLbs)} lbs`,
              });
            }
            if (visibility.eyeColor && profile.eyeColor) {
              visibleAttributes.push({ label: "Eye Color", value: formatLabel(profile.eyeColor) });
            }
            if (visibility.hairColor && profile.hairColor) {
              visibleAttributes.push({
                label: "Hair Color",
                value: formatLabel(profile.hairColor),
              });
            }
            if (visibility.ethnicity && profile.ethnicity) {
              visibleAttributes.push({ label: "Ethnicity", value: formatLabel(profile.ethnicity) });
            }
            if (visibility.willingnessToChangeHair && profile.willingnessToChangeHair) {
              visibleAttributes.push({
                label: "Willing to Change Hair",
                value: formatLabel(profile.willingnessToChangeHair),
              });
            }

            if (visibleAttributes.length === 0) return null;

            return (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center text-lg">
                    <User className="mr-2 h-5 w-5" />
                    Physical Attributes
                  </CardTitle>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/talent/profile/edit#physical-attributes">Manage</Link>
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                    {visibleAttributes.map((attr) => (
                      <div key={attr.label}>
                        <p className="text-muted-foreground text-sm">{attr.label}</p>
                        <p className="font-medium">{attr.value}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })()}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center text-lg">
                <Camera className="mr-2 h-5 w-5" />
                Headshots
              </CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link href="/talent/profile/edit#headshots">Manage</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {photos.length > 0 ? (
                <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-5">
                  {photos.map((p) => (
                    <div
                      key={p.id}
                      className="bg-muted relative aspect-[3/4] overflow-hidden rounded-lg"
                    >
                      <Image
                        src={p.thumbnailUrl ?? p.url}
                        alt="Headshot"
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground py-8 text-center">No headshots uploaded yet</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center text-lg">
                <Video className="mr-2 h-5 w-5" />
                Video Samples
              </CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link href="/talent/profile/edit#videos">Manage</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {videos.length > 0 ? (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {videos.slice(0, 6).map((v) => (
                    <div
                      key={v.id}
                      className="relative aspect-video overflow-hidden rounded-lg bg-black"
                    >
                      {v.thumbnailUrl ? (
                        <Image
                          src={v.thumbnailUrl}
                          alt={v.title}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <Video className="text-muted-foreground h-8 w-8" />
                        </div>
                      )}
                      <div className="absolute right-0 bottom-0 left-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                        <p className="truncate text-xs font-medium text-white">{v.title}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground py-8 text-center">
                  No video samples uploaded yet
                </p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center text-lg">
                <Briefcase className="mr-2 h-5 w-5" />
                Work History
              </CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link href="/talent/profile/edit#work-history">Manage</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {work.length > 0 ? (
                <div className="space-y-3">
                  {work.slice(0, 5).map((e) => (
                    <div key={e.id} className="border-b pb-3 last:border-0">
                      <h4 className="font-medium">{e.showName}</h4>
                      <p className="text-muted-foreground text-sm">{e.role}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground py-8 text-center">No work history added yet</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center text-lg">
                <GraduationCap className="mr-2 h-5 w-5" />
                Education
              </CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link href="/talent/profile/edit#education">Manage</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {edu.length > 0 ? (
                <div className="space-y-3">
                  {edu.slice(0, 5).map((e) => (
                    <div key={e.id} className="border-b pb-3 last:border-0">
                      <h4 className="font-medium">{e.program}</h4>
                      <p className="text-muted-foreground text-sm">{e.institution}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground py-8 text-center">No education added yet</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center text-lg">
                <Sparkles className="mr-2 h-5 w-5" />
                Skills
              </CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link href="/talent/profile/edit#skills">Manage</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {skillDetails.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {skillDetails.map((s) => (
                    <Badge key={s.id} variant="secondary">
                      {s.name}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground py-8 text-center">No skills added yet</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

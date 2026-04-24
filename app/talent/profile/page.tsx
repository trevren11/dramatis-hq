import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { talentProfiles, workHistory, education, headshots, talentSkills, skills } from "@/lib/db/schema";
import { eq, asc, inArray } from "drizzle-orm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UNION_OPTIONS } from "@/lib/validations/profile";
import { WORK_CATEGORY_LABELS } from "@/lib/db/schema/work-history";
import {
  Edit,
  MapPin,
  Phone,
  Globe,
  Briefcase,
  GraduationCap,
  Sparkles,
  Camera,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

function getUnionLabel(value: string): string {
  return UNION_OPTIONS.find((u) => u.value === value)?.label ?? value;
}

function calculateCompleteness(profile: {
  bio?: string | null;
  location?: string | null;
  phone?: string | null;
}, workCount: number, educationCount: number, headshotCount: number, skillCount: number): number {
  let score = 0;
  const total = 7;

  if (profile.bio) score++;
  if (profile.location) score++;
  if (profile.phone) score++;
  if (workCount > 0) score++;
  if (educationCount > 0) score++;
  if (headshotCount > 0) score++;
  if (skillCount > 0) score++;

  return Math.round((score / total) * 100);
}

export default async function ProfilePage(): Promise<React.ReactElement> {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const profile = await db.query.talentProfiles.findFirst({
    where: eq(talentProfiles.userId, session.user.id),
  });

  if (!profile) {
    redirect("/talent/profile/wizard");
  }

  const [work, edu, photos, userSkills] = await Promise.all([
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
    db.query.talentSkills.findMany({
      where: eq(talentSkills.talentProfileId, profile.id),
    }),
  ]);

  const skillIds = userSkills.map((s) => s.skillId);
  const skillDetails = skillIds.length > 0
    ? await db.query.skills.findMany({
        where: inArray(skills.id, skillIds),
      })
    : [];

  const completeness = calculateCompleteness(profile, work.length, edu.length, photos.length, skillDetails.length);
  const primaryHeadshot = photos.find((p) => p.isPrimary);
  const initials = `${profile.firstName[0]}${profile.lastName[0]}`.toUpperCase();

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
        {/* Profile Card */}
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
                {profile.stageName && (
                  <p className="text-muted-foreground text-sm">
                    {profile.firstName} {profile.lastName}
                  </p>
                )}
                {profile.pronouns && (
                  <p className="text-muted-foreground text-sm">{profile.pronouns}</p>
                )}

                {profile.location && (
                  <div className="text-muted-foreground mt-2 flex items-center text-sm">
                    <MapPin className="mr-1 h-4 w-4" />
                    {profile.location}
                  </div>
                )}

                {/* Union Badges */}
                {profile.unionMemberships && profile.unionMemberships.length > 0 && (
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    {profile.unionMemberships.map((union) => (
                      <Badge key={union} variant="secondary">
                        {getUnionLabel(union)}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Completeness */}
                <div className="mt-6 w-full">
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span>Profile Completeness</span>
                    <span className={completeness === 100 ? "text-green-600" : "text-amber-600"}>
                      {completeness}%
                    </span>
                  </div>
                  <div className="bg-muted h-2 rounded-full">
                    <div
                      className={`h-2 rounded-full ${completeness === 100 ? "bg-green-600" : "bg-amber-600"}`}
                      style={{ width: `${completeness}%` }}
                    />
                  </div>
                </div>

                {/* Contact Info */}
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
                      <a href={profile.website} className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                        {profile.website}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="mt-4">
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold">{photos.length}</div>
                  <div className="text-muted-foreground text-xs">Headshots</div>
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

        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Bio */}
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

          {/* Headshots */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center text-lg">
                  <Camera className="mr-2 h-5 w-5" />
                  Headshots
                </CardTitle>
                <CardDescription>{photos.length} / 10 photos</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/talent/profile/edit#headshots">Manage</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {photos.length > 0 ? (
                <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-5">
                  {photos.map((photo) => (
                    <div key={photo.id} className="relative aspect-[3/4] overflow-hidden rounded-lg">
                      <img
                        src={photo.thumbnailUrl ?? photo.url}
                        alt="Headshot"
                        className="h-full w-full object-cover"
                      />
                      {photo.isPrimary && (
                        <div className="bg-primary text-primary-foreground absolute top-1 right-1 rounded-full p-1">
                          <CheckCircle2 className="h-3 w-3" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-muted-foreground flex flex-col items-center py-8 text-center">
                  <AlertCircle className="mb-2 h-8 w-8" />
                  <p>No headshots uploaded yet</p>
                  <Button variant="link" asChild className="mt-2">
                    <Link href="/talent/profile/edit#headshots">Add headshots</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Work History */}
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
                <div className="space-y-4">
                  {work.map((entry) => (
                    <div key={entry.id} className="border-b pb-4 last:border-0 last:pb-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium">{entry.showName}</h4>
                          <p className="text-muted-foreground text-sm">{entry.role}</p>
                        </div>
                        <Badge variant="outline">
                          {WORK_CATEGORY_LABELS[entry.category]}
                        </Badge>
                      </div>
                      {(entry.location ?? entry.director ?? entry.productionCompany) && (
                        <p className="text-muted-foreground mt-1 text-sm">
                          {[entry.director, entry.productionCompany, entry.location].filter(Boolean).join(" • ")}
                        </p>
                      )}
                      {entry.isUnion && (
                        <Badge variant="secondary" className="mt-2">
                          Union
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-muted-foreground flex flex-col items-center py-8 text-center">
                  <Briefcase className="mb-2 h-8 w-8" />
                  <p>No work history added yet</p>
                  <Button variant="link" asChild className="mt-2">
                    <Link href="/talent/profile/edit#work-history">Add experience</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Education */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center text-lg">
                <GraduationCap className="mr-2 h-5 w-5" />
                Education & Training
              </CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link href="/talent/profile/edit#education">Manage</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {edu.length > 0 ? (
                <div className="space-y-4">
                  {edu.map((entry) => (
                    <div key={entry.id} className="border-b pb-4 last:border-0 last:pb-0">
                      <h4 className="font-medium">{entry.program}</h4>
                      <p className="text-muted-foreground text-sm">
                        {entry.institution}
                        {entry.degree && ` • ${entry.degree}`}
                      </p>
                      {(entry.startYear ?? entry.endYear) && (
                        <p className="text-muted-foreground text-sm">
                          {entry.startYear ?? ""} - {entry.endYear ?? "Present"}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-muted-foreground flex flex-col items-center py-8 text-center">
                  <GraduationCap className="mb-2 h-8 w-8" />
                  <p>No education or training added yet</p>
                  <Button variant="link" asChild className="mt-2">
                    <Link href="/talent/profile/edit#education">Add training</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Skills */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center text-lg">
                <Sparkles className="mr-2 h-5 w-5" />
                Special Skills
              </CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link href="/talent/profile/edit#skills">Manage</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {skillDetails.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {skillDetails.map((skill) => (
                    <Badge key={skill.id} variant="secondary">
                      {skill.name}
                    </Badge>
                  ))}
                </div>
              ) : (
                <div className="text-muted-foreground flex flex-col items-center py-8 text-center">
                  <Sparkles className="mb-2 h-8 w-8" />
                  <p>No skills added yet</p>
                  <Button variant="link" asChild className="mt-2">
                    <Link href="/talent/profile/edit#skills">Add skills</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

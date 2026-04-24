import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { talentProfiles, workHistory, education, headshots, talentSkills, skills } from "@/lib/db/schema";
import { eq, asc, inArray } from "drizzle-orm";
import { ProfileEditForm } from "@/components/talent/profile/profile-edit-form";
import { WorkHistorySection } from "@/components/talent/profile/work-history-section";
import { EducationSection } from "@/components/talent/profile/education-section";
import { SkillsSection } from "@/components/talent/profile/skills-section";
import { HeadshotsSection } from "@/components/talent/profile/headshots-section";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import type { WorkHistory } from "@/lib/db/schema/work-history";
import type { Education } from "@/lib/db/schema/education";
import type { Headshot } from "@/lib/db/schema/headshots";
import type { Skill } from "@/lib/db/schema/skills";

export default async function ProfileEditPage(): Promise<React.ReactElement> {
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

  return (
    <div className="container max-w-3xl py-8">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href="/talent/profile">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Profile
          </Link>
        </Button>
      </div>

      <div className="space-y-8">
        <ProfileEditForm initialProfile={profile} />
        <HeadshotsSection initialData={photos} />
        <WorkHistorySection initialData={work} />
        <EducationSection initialData={edu} />
        <SkillsSection initialData={skillDetails} />
      </div>
    </div>
  );
}

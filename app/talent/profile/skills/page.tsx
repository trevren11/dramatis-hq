import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { talentProfiles, talentSkills, skills } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";
import { SkillsManager } from "@/components/talent/profile/skills-manager";

export default async function SkillsPage(): Promise<React.ReactElement> {
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

  const userTalentSkills = await db.query.talentSkills.findMany({
    where: eq(talentSkills.talentProfileId, profile.id),
  });

  const skillIds = userTalentSkills.map((ts) => ts.skillId);
  const userSkills =
    skillIds.length > 0
      ? await db.query.skills.findMany({
          where: inArray(skills.id, skillIds),
        })
      : [];

  return (
    <div className="container max-w-3xl py-8">
      <SkillsManager initialSkills={userSkills} />
    </div>
  );
}

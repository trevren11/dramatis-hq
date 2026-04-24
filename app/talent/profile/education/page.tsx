import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { talentProfiles, education } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { EducationManager } from "@/components/talent/profile/education-manager";

export default async function EducationPage(): Promise<React.ReactElement> {
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

  const entries = await db.query.education.findMany({
    where: eq(education.talentProfileId, profile.id),
    orderBy: [asc(education.sortOrder)],
  });

  return (
    <div className="container max-w-3xl py-8">
      <EducationManager initialEntries={entries} />
    </div>
  );
}

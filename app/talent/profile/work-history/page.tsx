import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { talentProfiles, workHistory } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { WorkHistoryManager } from "@/components/talent/profile/work-history-manager";

export default async function WorkHistoryPage(): Promise<React.ReactElement> {
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

  const entries = await db.query.workHistory.findMany({
    where: eq(workHistory.talentProfileId, profile.id),
    orderBy: [asc(workHistory.sortOrder)],
  });

  return (
    <div className="container max-w-3xl py-8">
      <WorkHistoryManager initialEntries={entries} />
    </div>
  );
}

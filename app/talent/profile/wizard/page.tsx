import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { talentProfiles, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { ProfileWizard } from "@/components/talent/profile/profile-wizard";

export default async function ProfileWizardPage(): Promise<React.ReactElement> {
  const session = await auth();

  if (!session?.user.id) {
    redirect("/login");
  }

  const existingProfile = await db.query.talentProfiles.findFirst({
    where: eq(talentProfiles.userId, session.user.id),
  });

  if (existingProfile) {
    redirect("/talent/profile");
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
  });

  return (
    <div className="container py-8">
      <ProfileWizard
        initialData={{
          email: user?.email,
          name: user?.name ?? undefined,
        }}
      />
    </div>
  );
}

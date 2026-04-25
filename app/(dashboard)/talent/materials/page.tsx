import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { talentProfiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { CastMaterialsView } from "@/components/materials";

export const metadata = {
  title: "Production Materials | Dramatis HQ",
  description: "Access scripts and minus tracks shared with you",
};

export default async function MaterialsPage(): Promise<React.ReactElement> {
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

  const userName = `${profile.firstName} ${profile.lastName}`;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Production Materials</h1>
        <p className="text-muted-foreground mt-2">
          Access scripts and minus tracks that have been shared with you by production teams.
        </p>
      </div>

      <CastMaterialsView userName={userName} />
    </div>
  );
}

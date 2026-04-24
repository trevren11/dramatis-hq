export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import {
  talentProfiles,
  auditionApplications,
  auditions,
  shows,
  producerProfiles,
} from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { TalentApplicationsList } from "@/components/auditions/TalentApplicationsList";

export const metadata = {
  title: "My Applications | Dramatis",
  description: "Track your audition applications",
};

export default async function TalentApplicationsPage(): Promise<React.ReactElement> {
  const session = await auth();

  if (!session?.user.id) {
    redirect("/login?redirect=/talent/applications");
  }

  const talentProfile = await db.query.talentProfiles.findFirst({
    where: eq(talentProfiles.userId, session.user.id),
  });

  if (!talentProfile) {
    redirect("/talent/profile/wizard");
  }

  // Get applications with audition, show, and organization info
  const applications = await db
    .select({
      application: auditionApplications,
      audition: {
        id: auditions.id,
        title: auditions.title,
        slug: auditions.slug,
        location: auditions.location,
        isVirtual: auditions.isVirtual,
        auditionDates: auditions.auditionDates,
        submissionDeadline: auditions.submissionDeadline,
        status: auditions.status,
      },
      show: {
        id: shows.id,
        title: shows.title,
        type: shows.type,
        venue: shows.venue,
      },
      organization: {
        id: producerProfiles.id,
        companyName: producerProfiles.companyName,
        slug: producerProfiles.slug,
        logoUrl: producerProfiles.logoUrl,
      },
    })
    .from(auditionApplications)
    .innerJoin(auditions, eq(auditionApplications.auditionId, auditions.id))
    .innerJoin(shows, eq(auditions.showId, shows.id))
    .innerJoin(producerProfiles, eq(auditions.organizationId, producerProfiles.id))
    .where(eq(auditionApplications.talentProfileId, talentProfile.id))
    .orderBy(desc(auditionApplications.submittedAt));

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <TalentApplicationsList initialApplications={applications} />
    </div>
  );
}

import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import {
  auditions,
  shows,
  producerProfiles,
  auditionRoles,
  auditionApplications,
  roles,
  talentProfiles,
} from "@/lib/db/schema";
import { eq, and, asc, sql } from "drizzle-orm";
import { AuditionDetail } from "@/components/auditions/AuditionDetail";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: Props): Promise<{ title: string; description?: string }> {
  const { slug } = await params;

  const audition = await db.query.auditions.findFirst({
    where: eq(auditions.slug, slug),
    columns: { title: true, description: true },
  });

  if (!audition) {
    return { title: "Audition Not Found" };
  }

  return {
    title: `${audition.title} | Dramatis`,
    description: audition.description?.slice(0, 160) ?? `Apply to ${audition.title} on Dramatis`,
  };
}

// eslint-disable-next-line complexity
export default async function AuditionDetailPage({ params }: Props): Promise<React.ReactElement> {
  const { slug } = await params;

  // Get audition
  const audition = await db.query.auditions.findFirst({
    where: eq(auditions.slug, slug),
  });

  if (!audition) {
    notFound();
  }

  // Check visibility
  const now = new Date();
  const isPublished = !audition.publishAt || audition.publishAt <= now;

  if (audition.visibility === "private") {
    notFound();
  }

  if (audition.status === "draft" || audition.status === "cancelled") {
    notFound();
  }

  if (!isPublished) {
    notFound();
  }

  // Get show
  const show = await db.query.shows.findFirst({
    where: eq(shows.id, audition.showId),
  });

  // Get organization
  const organization = await db.query.producerProfiles.findFirst({
    where: eq(producerProfiles.id, audition.organizationId),
  });

  // Get linked roles
  const linkedRoles = await db
    .select({ role: roles })
    .from(auditionRoles)
    .innerJoin(roles, eq(auditionRoles.roleId, roles.id))
    .where(eq(auditionRoles.auditionId, audition.id))
    .orderBy(asc(roles.sortOrder));

  // Get application count
  const countResult = (await db.execute(sql`
    SELECT COUNT(*) as count FROM audition_applications WHERE audition_id = ${audition.id}
  `)) as { count: string }[];
  const applicationCount = parseInt(countResult[0]?.count ?? "0");

  // Check if deadline passed
  const isDeadlinePassed = audition.submissionDeadline ? audition.submissionDeadline < now : false;

  // Check auth and application status
  const session = await auth();
  let hasTalentProfile = false;
  let hasApplied = false;

  if (session?.user.id) {
    const talentProfile = await db.query.talentProfiles.findFirst({
      where: eq(talentProfiles.userId, session.user.id),
    });

    if (talentProfile) {
      hasTalentProfile = true;

      const existingApplication = await db.query.auditionApplications.findFirst({
        where: and(
          eq(auditionApplications.auditionId, audition.id),
          eq(auditionApplications.talentProfileId, talentProfile.id)
        ),
      });

      hasApplied = !!existingApplication;
    }
  }

  return (
    <div className="from-base-200 to-base-100 min-h-screen bg-gradient-to-b">
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <AuditionDetail
          audition={{ ...audition, isDeadlinePassed, applicationCount }}
          show={
            show
              ? {
                  id: show.id,
                  title: show.title,
                  type: show.type,
                  venue: show.venue,
                  description: show.description,
                  performanceStart: show.performanceStart,
                  performanceEnd: show.performanceEnd,
                }
              : null
          }
          organization={
            organization
              ? {
                  id: organization.id,
                  companyName: organization.companyName,
                  slug: organization.slug,
                  logoUrl: organization.logoUrl,
                  description: organization.description,
                  location: organization.location,
                  website: organization.website,
                }
              : null
          }
          roles={linkedRoles.map((lr) => lr.role)}
          isLoggedIn={!!session?.user.id}
          hasTalentProfile={hasTalentProfile}
          hasApplied={hasApplied}
        />
      </div>
    </div>
  );
}

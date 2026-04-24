import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  users,
  producerProfiles,
  auditions,
  auditionApplications,
  auditionRoles,
  roles,
  talentProfiles,
} from "@/lib/db/schema";
import { eq, and, desc, asc } from "drizzle-orm";
import { AuditionManagement } from "@/components/auditions/AuditionManagement";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<{ title: string }> {
  const { id } = await params;

  const audition = await db.query.auditions.findFirst({
    where: eq(auditions.id, id),
    columns: { title: true },
  });

  if (!audition) {
    return { title: "Audition Not Found" };
  }

  return {
    title: `${audition.title} | Manage Audition`,
  };
}

export default async function ManageAuditionPage({ params }: Props): Promise<React.ReactElement> {
  const { id } = await params;
  const session = await auth();

  if (!session?.user.id) {
    redirect("/login");
  }

  // Check if user is a producer
  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
  });

  if (user?.userType !== "producer") {
    redirect("/");
  }

  // Get producer profile
  const profile = await db.query.producerProfiles.findFirst({
    where: eq(producerProfiles.userId, session.user.id),
  });

  if (!profile) {
    redirect("/producer/setup");
  }

  // Get audition (verify ownership)
  const audition = await db.query.auditions.findFirst({
    where: and(eq(auditions.id, id), eq(auditions.organizationId, profile.id)),
  });

  if (!audition) {
    notFound();
  }

  // Get linked roles
  const linkedRoles = await db
    .select({ role: roles })
    .from(auditionRoles)
    .innerJoin(roles, eq(auditionRoles.roleId, roles.id))
    .where(eq(auditionRoles.auditionId, id))
    .orderBy(asc(roles.sortOrder));

  // Get applications with talent info
  const applications = await db
    .select({
      application: auditionApplications,
      talent: {
        id: talentProfiles.id,
        firstName: talentProfiles.firstName,
        lastName: talentProfiles.lastName,
        stageName: talentProfiles.stageName,
        location: talentProfiles.location,
        ageRangeLow: talentProfiles.ageRangeLow,
        ageRangeHigh: talentProfiles.ageRangeHigh,
        gender: talentProfiles.gender,
        ethnicity: talentProfiles.ethnicity,
        vocalRange: talentProfiles.vocalRange,
      },
    })
    .from(auditionApplications)
    .innerJoin(talentProfiles, eq(auditionApplications.talentProfileId, talentProfiles.id))
    .where(eq(auditionApplications.auditionId, id))
    .orderBy(desc(auditionApplications.submittedAt));

  return (
    <div className="container py-8">
      <AuditionManagement
        audition={audition}
        roles={linkedRoles.map((lr) => lr.role)}
        initialApplications={applications}
      />
    </div>
  );
}

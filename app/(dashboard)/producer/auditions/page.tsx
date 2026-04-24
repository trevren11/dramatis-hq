import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, producerProfiles, auditions, auditionApplications } from "@/lib/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { AuditionList } from "@/components/auditions/AuditionList";

export const metadata = {
  title: "Auditions",
  description: "Manage your audition announcements",
};

export default async function ProducerAuditionsPage(): Promise<React.ReactElement> {
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

  // Get auditions with application counts
  const auditionsWithCounts = await db
    .select({
      id: auditions.id,
      showId: auditions.showId,
      organizationId: auditions.organizationId,
      title: auditions.title,
      description: auditions.description,
      slug: auditions.slug,
      location: auditions.location,
      isVirtual: auditions.isVirtual,
      auditionDates: auditions.auditionDates,
      submissionDeadline: auditions.submissionDeadline,
      requirements: auditions.requirements,
      materials: auditions.materials,
      visibility: auditions.visibility,
      publishAt: auditions.publishAt,
      status: auditions.status,
      createdAt: auditions.createdAt,
      updatedAt: auditions.updatedAt,
      applicationCount: sql<number>`count(${auditionApplications.id})::int`.as("application_count"),
    })
    .from(auditions)
    .leftJoin(auditionApplications, eq(auditions.id, auditionApplications.auditionId))
    .where(eq(auditions.organizationId, profile.id))
    .groupBy(auditions.id)
    .orderBy(desc(auditions.updatedAt));

  return (
    <div className="container py-8">
      <AuditionList initialAuditions={auditionsWithCounts} />
    </div>
  );
}

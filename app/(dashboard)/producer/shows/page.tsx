import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, producerProfiles, shows, roles } from "@/lib/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { ShowList } from "@/components/shows/ShowList";

export const metadata = {
  title: "Productions",
  description: "Manage your theatrical productions",
};

export default async function ProducerShowsPage(): Promise<React.ReactElement> {
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

  // Get shows with role counts
  const showsWithRoleCounts = await db
    .select({
      id: shows.id,
      organizationId: shows.organizationId,
      title: shows.title,
      type: shows.type,
      description: shows.description,
      venue: shows.venue,
      rehearsalStart: shows.rehearsalStart,
      rehearsalEnd: shows.rehearsalEnd,
      performanceStart: shows.performanceStart,
      performanceEnd: shows.performanceEnd,
      unionStatus: shows.unionStatus,
      status: shows.status,
      isPublic: shows.isPublic,
      createdAt: shows.createdAt,
      updatedAt: shows.updatedAt,
      roleCount: sql<number>`count(${roles.id})::int`.as("role_count"),
    })
    .from(shows)
    .leftJoin(roles, eq(shows.id, roles.showId))
    .where(eq(shows.organizationId, profile.id))
    .groupBy(shows.id)
    .orderBy(desc(shows.updatedAt));

  return (
    <div className="container py-8">
      <ShowList initialShows={showsWithRoleCounts} />
    </div>
  );
}

import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, producerProfiles, shows, roles } from "@/lib/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { ShowDetailClient } from "@/components/shows/ShowDetailClient";

export const metadata = {
  title: "Production Details",
  description: "View and manage your production",
};

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}

export default async function ShowDetailPage({
  params,
  searchParams,
}: PageProps): Promise<React.ReactElement> {
  const session = await auth();
  const { id } = await params;
  const { tab } = await searchParams;

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

  // Get show with ownership check
  const show = await db.query.shows.findFirst({
    where: and(eq(shows.id, id), eq(shows.organizationId, profile.id)),
  });

  if (!show) {
    notFound();
  }

  // Get roles for this show
  const showRoles = await db.query.roles.findMany({
    where: eq(roles.showId, id),
    orderBy: [asc(roles.sortOrder)],
  });

  return (
    <div className="container py-8">
      <ShowDetailClient show={show} roles={showRoles} initialTab={tab ?? "overview"} />
    </div>
  );
}

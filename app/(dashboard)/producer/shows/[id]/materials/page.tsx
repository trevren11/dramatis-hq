export const dynamic = "force-dynamic";

import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  users,
  producerProfiles,
  shows,
  scripts,
  minusTracks,
  roles,
  castingAssignments,
  talentProfiles,
} from "@/lib/db/schema";
import { eq, and, asc, desc } from "drizzle-orm";
import { MaterialsManager } from "@/components/materials";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<{ title: string }> {
  const { id } = await params;

  const show = await db.query.shows.findFirst({
    where: eq(shows.id, id),
    columns: { title: true },
  });

  if (!show) {
    return { title: "Show Not Found" };
  }

  return {
    title: `Scripts & Tracks | ${show.title}`,
  };
}

export default async function MaterialsPage({ params }: Props): Promise<React.ReactElement> {
  const { id: showId } = await params;
  const session = await auth();

  if (!session?.user.id) {
    redirect("/login");
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
  });

  if (user?.userType !== "producer") {
    redirect("/");
  }

  const profile = await db.query.producerProfiles.findFirst({
    where: eq(producerProfiles.userId, session.user.id),
  });

  if (!profile) {
    redirect("/producer/setup");
  }

  const show = await db.query.shows.findFirst({
    where: and(eq(shows.id, showId), eq(shows.organizationId, profile.id)),
  });

  if (!show) {
    notFound();
  }

  // Fetch scripts
  const showScripts = await db.query.scripts.findMany({
    where: eq(scripts.showId, showId),
    orderBy: [desc(scripts.version)],
  });

  // Fetch tracks
  const showTracks = await db.query.minusTracks.findMany({
    where: eq(minusTracks.showId, showId),
    orderBy: [asc(minusTracks.sortOrder)],
  });

  // Fetch roles
  const showRoles = await db.query.roles.findMany({
    where: eq(roles.showId, showId),
    orderBy: [asc(roles.sortOrder)],
  });

  // Fetch cast members with their roles
  const assignments = await db
    .select({
      assignment: castingAssignments,
      talent: {
        id: talentProfiles.id,
        firstName: talentProfiles.firstName,
        lastName: talentProfiles.lastName,
      },
    })
    .from(castingAssignments)
    .innerJoin(talentProfiles, eq(castingAssignments.talentProfileId, talentProfiles.id))
    .where(eq(castingAssignments.showId, showId));

  // Group by talent
  const castMembersMap = new Map<string, { id: string; name: string; roleIds: string[] }>();
  for (const a of assignments) {
    const existing = castMembersMap.get(a.talent.id);
    if (existing) {
      existing.roleIds.push(a.assignment.roleId);
    } else {
      castMembersMap.set(a.talent.id, {
        id: a.talent.id,
        name: `${a.talent.firstName} ${a.talent.lastName}`,
        roleIds: [a.assignment.roleId],
      });
    }
  }
  const castMembers = Array.from(castMembersMap.values());

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Scripts & Minus Tracks</h1>
        <p className="text-muted-foreground">Manage production materials for {show.title}</p>
      </div>

      <MaterialsManager
        showId={showId}
        initialScripts={showScripts}
        initialTracks={showTracks}
        roles={showRoles}
        castMembers={castMembers}
      />
    </div>
  );
}

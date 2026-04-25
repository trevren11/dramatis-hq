import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar } from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  users,
  producerProfiles,
  shows,
  roles,
  scheduleEvents,
  eventCast,
  talentProfiles,
  castingAssignments,
  headshots,
} from "@/lib/db/schema";
import { eq, and, asc, inArray } from "drizzle-orm";
import { RehearsalCalendar } from "@/components/schedule";
import { getEventTypeColor } from "@/lib/db/schema/schedule";

export const metadata = {
  title: "Rehearsal Schedule",
  description: "Manage your production schedule",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SchedulePage({ params }: PageProps): Promise<React.ReactElement> {
  const session = await auth();
  const { id } = await params;

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
    where: and(eq(shows.id, id), eq(shows.organizationId, profile.id)),
  });

  if (!show) {
    notFound();
  }

  const showRoles = await db.query.roles.findMany({
    where: eq(roles.showId, id),
    orderBy: [asc(roles.sortOrder)],
  });

  const events = await db.query.scheduleEvents.findMany({
    where: eq(scheduleEvents.showId, id),
    orderBy: [asc(scheduleEvents.startTime)],
  });

  const eventIds = events.map((e) => e.id);

  let castByEvent: Record<
    string,
    {
      id: string;
      talentProfileId: string;
      roleId: string | null;
      firstName: string;
      lastName: string;
      stageName: string | null;
      roleName: string | null;
      headshotUrl: string | null;
    }[]
  > = {};

  if (eventIds.length > 0) {
    const castMembers = await db
      .select({
        eventCast: eventCast,
        talent: {
          id: talentProfiles.id,
          firstName: talentProfiles.firstName,
          lastName: talentProfiles.lastName,
          stageName: talentProfiles.stageName,
        },
        role: {
          id: roles.id,
          name: roles.name,
        },
      })
      .from(eventCast)
      .innerJoin(talentProfiles, eq(eventCast.talentProfileId, talentProfiles.id))
      .leftJoin(roles, eq(eventCast.roleId, roles.id))
      .where(inArray(eventCast.eventId, eventIds));

    const talentIds = castMembers.map((c) => c.talent.id);
    let headshotMap: Record<string, string> = {};

    if (talentIds.length > 0) {
      const talentHeadshots = await db.query.headshots.findMany({
        where: and(inArray(headshots.talentProfileId, talentIds), eq(headshots.isPrimary, true)),
      });
      headshotMap = Object.fromEntries(
        talentHeadshots.map((h) => [h.talentProfileId, h.thumbnailUrl ?? h.url])
      );
    }

    castByEvent = castMembers.reduce<typeof castByEvent>((acc, c) => {
      const eventId = c.eventCast.eventId;
      acc[eventId] ??= [];
      acc[eventId].push({
        id: c.eventCast.id,
        talentProfileId: c.talent.id,
        roleId: c.eventCast.roleId,
        firstName: c.talent.firstName,
        lastName: c.talent.lastName,
        stageName: c.talent.stageName,
        roleName: c.role?.name ?? null,
        headshotUrl: headshotMap[c.talent.id] ?? null,
      });
      return acc;
    }, {});
  }

  const eventsWithCast = events.map((event) => ({
    ...event,
    cast: castByEvent[event.id] ?? [],
    color: getEventTypeColor(event.eventType),
  }));

  const assignments = await db
    .select({
      talent: {
        id: talentProfiles.id,
        firstName: talentProfiles.firstName,
        lastName: talentProfiles.lastName,
        stageName: talentProfiles.stageName,
      },
      role: {
        id: roles.id,
        name: roles.name,
      },
    })
    .from(castingAssignments)
    .innerJoin(talentProfiles, eq(castingAssignments.talentProfileId, talentProfiles.id))
    .leftJoin(roles, eq(castingAssignments.roleId, roles.id))
    .where(and(eq(castingAssignments.showId, id), eq(castingAssignments.status, "confirmed")));

  const assignedTalentIds = assignments.map((a) => a.talent.id);
  let assignmentHeadshotMap: Record<string, string> = {};

  if (assignedTalentIds.length > 0) {
    const assignedHeadshots = await db.query.headshots.findMany({
      where: and(
        inArray(headshots.talentProfileId, assignedTalentIds),
        eq(headshots.isPrimary, true)
      ),
    });
    assignmentHeadshotMap = Object.fromEntries(
      assignedHeadshots.map((h) => [h.talentProfileId, h.thumbnailUrl ?? h.url])
    );
  }

  const cast = assignments.map((a) => ({
    id: a.talent.id,
    firstName: a.talent.firstName,
    lastName: a.talent.lastName,
    stageName: a.talent.stageName,
    roleName: a.role?.name ?? null,
    headshotUrl: assignmentHeadshotMap[a.talent.id] ?? null,
  }));

  return (
    <div className="container py-8">
      <div className="mb-6 space-y-4">
        <Link
          href={`/producer/shows/${id}`}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to {show.title}
        </Link>

        <div className="flex items-center gap-3">
          <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-lg">
            <Calendar className="text-primary h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{show.title}</h1>
            <p className="text-muted-foreground">Rehearsal Schedule</p>
          </div>
        </div>
      </div>

      <RehearsalCalendar showId={id} initialEvents={eventsWithCast} cast={cast} roles={showRoles} />
    </div>
  );
}

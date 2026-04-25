export const dynamic = "force-dynamic";

import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  users,
  producerProfiles,
  shows,
  roles,
  castingAssignments,
  castingDeck,
  talentProfiles,
  headshots,
  auditions,
  auditionApplications,
  emailTemplates,
} from "@/lib/db/schema";
import { eq, and, asc, inArray } from "drizzle-orm";
import { CastingBoard } from "@/components/casting";

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
    title: `Casting Board | ${show.title}`,
  };
}

export default async function CastingBoardPage({ params }: Props): Promise<React.ReactElement> {
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

  const showRoles = await db.query.roles.findMany({
    where: eq(roles.showId, showId),
    orderBy: [asc(roles.sortOrder)],
  });

  const assignments = await db
    .select({
      assignment: castingAssignments,
      talent: {
        id: talentProfiles.id,
        firstName: talentProfiles.firstName,
        lastName: talentProfiles.lastName,
        stageName: talentProfiles.stageName,
      },
    })
    .from(castingAssignments)
    .innerJoin(talentProfiles, eq(castingAssignments.talentProfileId, talentProfiles.id))
    .where(eq(castingAssignments.showId, showId));

  const deckItems = await db
    .select({
      deck: castingDeck,
      talent: {
        id: talentProfiles.id,
        firstName: talentProfiles.firstName,
        lastName: talentProfiles.lastName,
        stageName: talentProfiles.stageName,
      },
    })
    .from(castingDeck)
    .innerJoin(talentProfiles, eq(castingDeck.talentProfileId, talentProfiles.id))
    .where(eq(castingDeck.showId, showId))
    .orderBy(asc(castingDeck.sortOrder));

  const audition = await db.query.auditions.findFirst({
    where: eq(auditions.showId, showId),
  });

  const templates = await db.query.emailTemplates.findMany({
    where: eq(emailTemplates.organizationId, profile.id),
  });

  let poolTalent: { id: string; firstName: string; lastName: string; stageName: string | null }[] =
    [];
  if (audition) {
    const applications = await db
      .select({
        talent: {
          id: talentProfiles.id,
          firstName: talentProfiles.firstName,
          lastName: talentProfiles.lastName,
          stageName: talentProfiles.stageName,
        },
      })
      .from(auditionApplications)
      .innerJoin(talentProfiles, eq(auditionApplications.talentProfileId, talentProfiles.id))
      .where(eq(auditionApplications.auditionId, audition.id));

    const assignedTalentIds = new Set(assignments.map((a) => a.talent.id));
    const deckTalentIds = new Set(deckItems.map((d) => d.talent.id));

    poolTalent = applications
      .filter((a) => !assignedTalentIds.has(a.talent.id) && !deckTalentIds.has(a.talent.id))
      .map((a) => a.talent);
  }

  const allTalentIds = [
    ...assignments.map((a) => a.talent.id),
    ...deckItems.map((d) => d.talent.id),
    ...poolTalent.map((t) => t.id),
  ];

  let headshotMap: Record<string, string> = {};
  if (allTalentIds.length > 0) {
    const talentHeadshots = await db.query.headshots.findMany({
      where: and(inArray(headshots.talentProfileId, allTalentIds), eq(headshots.isPrimary, true)),
    });
    headshotMap = Object.fromEntries(
      talentHeadshots.map((h) => [h.talentProfileId, h.thumbnailUrl ?? h.url])
    );
  }

  const enrichedAssignments = assignments.map((a) => ({
    id: a.assignment.id,
    showId: a.assignment.showId,
    roleId: a.assignment.roleId,
    talentProfileId: a.assignment.talentProfileId,
    slotIndex: a.assignment.slotIndex,
    status: a.assignment.status,
    isLocked: a.assignment.isLocked,
    talent: {
      id: a.talent.id,
      firstName: a.talent.firstName,
      lastName: a.talent.lastName,
      stageName: a.talent.stageName,
      primaryHeadshotUrl: headshotMap[a.talent.id] ?? null,
    },
  }));

  const enrichedDeck = deckItems.map((d) => ({
    id: d.deck.id,
    showId: d.deck.showId,
    talentProfileId: d.deck.talentProfileId,
    sortOrder: d.deck.sortOrder,
    notes: d.deck.notes,
    talent: {
      id: d.talent.id,
      firstName: d.talent.firstName,
      lastName: d.talent.lastName,
      stageName: d.talent.stageName,
      primaryHeadshotUrl: headshotMap[d.talent.id] ?? null,
    },
  }));

  const enrichedPool = poolTalent.map((t) => ({
    id: t.id,
    firstName: t.firstName,
    lastName: t.lastName,
    stageName: t.stageName,
    primaryHeadshotUrl: headshotMap[t.id] ?? null,
  }));

  return (
    <div className="h-[calc(100vh-4rem)]">
      <CastingBoard
        showId={showId}
        showTitle={show.title}
        organizationName={profile.companyName}
        initialRoles={showRoles}
        initialAssignments={enrichedAssignments}
        initialDeck={enrichedDeck}
        initialPool={enrichedPool}
        initialTemplates={templates}
      />
    </div>
  );
}

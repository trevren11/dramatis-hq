export const dynamic = "force-dynamic";

import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  users,
  producerProfiles,
  auditions,
  auditionFormResponses,
  auditionDecisions,
  auditionNotes,
  auditionRoles,
  talentProfiles,
  roles,
  headshots,
} from "@/lib/db/schema";
import { eq, and, asc, desc } from "drizzle-orm";
import { AuditionSessionPage } from "./AuditionSessionPage";

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
    return { title: "Audition Session" };
  }

  return {
    title: `Session - ${audition.title} | Dramatis`,
  };
}

export default async function ProducerAuditionSessionPage({
  params,
}: Props): Promise<React.ReactElement> {
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

  // Get roles for this audition
  const auditionRolesList = await db
    .select({
      id: roles.id,
      name: roles.name,
      description: roles.description,
    })
    .from(auditionRoles)
    .innerJoin(roles, eq(auditionRoles.roleId, roles.id))
    .where(eq(auditionRoles.auditionId, id));

  // Get queue with full talent data
  const queue = await db
    .select({
      id: auditionFormResponses.id,
      queueNumber: auditionFormResponses.queueNumber,
      checkinStatus: auditionFormResponses.status,
      checkedInAt: auditionFormResponses.checkedInAt,
      responses: auditionFormResponses.responses,
      talentProfile: {
        id: talentProfiles.id,
        stageName: talentProfiles.stageName,
        unionMemberships: talentProfiles.unionMemberships,
        heightInches: talentProfiles.heightInches,
        hairColor: talentProfiles.hairColor,
        eyeColor: talentProfiles.eyeColor,
        gender: talentProfiles.gender,
        ageRangeLow: talentProfiles.ageRangeLow,
        ageRangeHigh: talentProfiles.ageRangeHigh,
        bio: talentProfiles.bio,
      },
      user: {
        id: users.id,
        name: users.name,
        email: users.email,
      },
    })
    .from(auditionFormResponses)
    .innerJoin(talentProfiles, eq(auditionFormResponses.talentProfileId, talentProfiles.id))
    .innerJoin(users, eq(talentProfiles.userId, users.id))
    .where(eq(auditionFormResponses.auditionId, id))
    .orderBy(asc(auditionFormResponses.queueNumber));

  // Get primary headshots for each talent
  const talentIds = queue.map((q) => q.talentProfile.id);
  const headshotData =
    talentIds.length > 0
      ? await db
          .select({
            talentProfileId: headshots.talentProfileId,
            url: headshots.url,
            isPrimary: headshots.isPrimary,
          })
          .from(headshots)
          .where(eq(headshots.isPrimary, true))
      : [];

  const headshotMap = new Map(headshotData.map((h) => [h.talentProfileId, h.url]));

  // Get all decisions
  const decisionsData = await db
    .select({
      id: auditionDecisions.id,
      talentProfileId: auditionDecisions.talentProfileId,
      decision: auditionDecisions.decision,
      roleId: auditionDecisions.roleId,
      notes: auditionDecisions.notes,
      decidedAt: auditionDecisions.decidedAt,
    })
    .from(auditionDecisions)
    .where(eq(auditionDecisions.auditionId, id));

  const decisionMap = new Map(decisionsData.map((d) => [d.talentProfileId, d]));

  // Get all notes grouped by talent
  const notesData = await db
    .select({
      id: auditionNotes.id,
      talentProfileId: auditionNotes.talentProfileId,
      note: auditionNotes.note,
      createdAt: auditionNotes.createdAt,
      createdBy: users.name,
    })
    .from(auditionNotes)
    .innerJoin(users, eq(auditionNotes.createdBy, users.id))
    .where(eq(auditionNotes.auditionId, id))
    .orderBy(desc(auditionNotes.createdAt));

  // Group notes by talent
  const notesMap = new Map<string, typeof notesData>();
  for (const note of notesData) {
    const existing = notesMap.get(note.talentProfileId) ?? [];
    existing.push(note);
    notesMap.set(note.talentProfileId, existing);
  }

  // Build full queue
  const fullQueue = queue.map((q) => {
    const decision = decisionMap.get(q.talentProfile.id);
    const talentNotes = notesMap.get(q.talentProfile.id) ?? [];

    return {
      id: q.id,
      queueNumber: q.queueNumber,
      checkinStatus: q.checkinStatus ?? "checked_in",
      checkedInAt: q.checkedInAt?.toISOString() ?? null,
      formResponses: q.responses,
      talent: {
        id: q.talentProfile.id,
        name: q.talentProfile.stageName ?? q.user.name ?? "Unknown",
        email: q.user.email,
        unionMemberships: q.talentProfile.unionMemberships,
        heightInches: q.talentProfile.heightInches,
        hairColor: q.talentProfile.hairColor,
        eyeColor: q.talentProfile.eyeColor,
        gender: q.talentProfile.gender,
        ageRangeLow: q.talentProfile.ageRangeLow,
        ageRangeHigh: q.talentProfile.ageRangeHigh,
        bio: q.talentProfile.bio,
        headshotUrl: headshotMap.get(q.talentProfile.id) ?? null,
      },
      decision: decision
        ? {
            id: decision.id,
            type: decision.decision,
            roleId: decision.roleId,
            notes: decision.notes,
            decidedAt: decision.decidedAt.toISOString(),
          }
        : null,
      notes: talentNotes.map((n) => ({
        id: n.id,
        note: n.note,
        createdAt: n.createdAt.toISOString(),
        createdBy: n.createdBy ?? "Unknown",
      })),
    };
  });

  // Calculate counts
  const counts = {
    total: fullQueue.length,
    checkedIn: fullQueue.filter((q) => q.checkinStatus === "checked_in").length,
    inRoom: fullQueue.filter((q) => q.checkinStatus === "in_room").length,
    completed: fullQueue.filter((q) => q.checkinStatus === "completed").length,
    callback: fullQueue.filter((q) => q.decision?.type === "callback").length,
    callbackRole: fullQueue.filter((q) => q.decision?.type === "callback_role").length,
    noThanks: fullQueue.filter((q) => q.decision?.type === "no_thanks").length,
    undecided: fullQueue.filter((q) => !q.decision).length,
  };

  const initialData = {
    audition: {
      id: audition.id,
      title: audition.title,
      slug: audition.slug,
      location: audition.location,
      isVirtual: audition.isVirtual,
      status: audition.status ?? "draft",
    },
    roles: auditionRolesList,
    queue: fullQueue,
    counts,
  };

  return <AuditionSessionPage auditionId={id} initialData={initialData} />;
}

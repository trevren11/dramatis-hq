import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  producerProfiles,
  auditions,
  auditionFormResponses,
  talentProfiles,
  users,
} from "@/lib/db/schema";
import { eq, and, asc } from "drizzle-orm";

/**
 * GET /api/auditions/[id]/checkin/queue
 * Get the check-in queue for an audition (producer only)
 * Returns all checked-in talent with their status
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: auditionId } = await params;

    // Verify producer owns this audition
    const profile = await db.query.producerProfiles.findFirst({
      where: eq(producerProfiles.userId, session.user.id),
    });

    if (!profile) {
      return NextResponse.json({ error: "Producer profile not found" }, { status: 404 });
    }

    const audition = await db.query.auditions.findFirst({
      where: and(eq(auditions.id, auditionId), eq(auditions.organizationId, profile.id)),
    });

    if (!audition) {
      return NextResponse.json({ error: "Audition not found" }, { status: 404 });
    }

    // Get all check-ins with talent info
    const checkins = await db
      .select({
        id: auditionFormResponses.id,
        queueNumber: auditionFormResponses.queueNumber,
        status: auditionFormResponses.status,
        checkedInAt: auditionFormResponses.checkedInAt,
        responses: auditionFormResponses.responses,
        talentProfile: {
          id: talentProfiles.id,
          stageName: talentProfiles.stageName,
        },
        user: {
          name: users.name,
          email: users.email,
        },
      })
      .from(auditionFormResponses)
      .innerJoin(talentProfiles, eq(auditionFormResponses.talentProfileId, talentProfiles.id))
      .innerJoin(users, eq(talentProfiles.userId, users.id))
      .where(eq(auditionFormResponses.auditionId, auditionId))
      .orderBy(asc(auditionFormResponses.queueNumber));

    // Count by status
    const statusCounts = {
      checked_in: 0,
      in_room: 0,
      completed: 0,
    };

    for (const checkin of checkins) {
      if (checkin.status && checkin.status in statusCounts) {
        statusCounts[checkin.status]++;
      }
    }

    return NextResponse.json({
      queue: checkins.map((c) => ({
        id: c.id,
        queueNumber: c.queueNumber,
        status: c.status,
        checkedInAt: c.checkedInAt,
        responses: c.responses,
        talent: {
          id: c.talentProfile.id,
          name: c.talentProfile.stageName ?? c.user.name,
          email: c.user.email,
        },
      })),
      counts: statusCounts,
      total: checkins.length,
    });
  } catch (error) {
    console.error("Error fetching check-in queue:", error);
    return NextResponse.json({ error: "Failed to fetch queue" }, { status: 500 });
  }
}

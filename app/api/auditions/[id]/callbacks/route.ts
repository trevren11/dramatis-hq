import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  auditions,
  callbackSessions,
  callbackInvitations,
  producerProfiles,
} from "@/lib/db/schema";
import { callbackSessionCreateSchema } from "@/lib/validations/callbacks";
import { eq, desc } from "drizzle-orm";

/**
 * GET /api/auditions/[id]/callbacks
 * List callback sessions for an audition
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

    const audition = await db.query.auditions.findFirst({
      where: eq(auditions.id, auditionId),
    });

    if (!audition) {
      return NextResponse.json({ error: "Audition not found" }, { status: 404 });
    }

    const producerProfile = await db.query.producerProfiles.findFirst({
      where: eq(producerProfiles.userId, session.user.id),
    });

    if (producerProfile?.id !== audition.organizationId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const sessions = await db.query.callbackSessions.findMany({
      where: eq(callbackSessions.auditionId, auditionId),
      orderBy: [desc(callbackSessions.round)],
    });

    const sessionsWithCounts = await Promise.all(
      sessions.map(async (s) => {
        const invitations = await db.query.callbackInvitations.findMany({
          where: eq(callbackInvitations.callbackSessionId, s.id),
        });

        return {
          ...s,
          invitationCount: invitations.length,
          checkedInCount: invitations.filter((i) => i.checkedInAt).length,
        };
      })
    );

    return NextResponse.json({ sessions: sessionsWithCounts });
  } catch (error) {
    console.error("Error fetching callback sessions:", error);
    return NextResponse.json({ error: "Failed to fetch callback sessions" }, { status: 500 });
  }
}

/**
 * POST /api/auditions/[id]/callbacks
 * Create a new callback session
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: auditionId } = await params;

    const audition = await db.query.auditions.findFirst({
      where: eq(auditions.id, auditionId),
    });

    if (!audition) {
      return NextResponse.json({ error: "Audition not found" }, { status: 404 });
    }

    const producerProfile = await db.query.producerProfiles.findFirst({
      where: eq(producerProfiles.userId, session.user.id),
    });

    if (producerProfile?.id !== audition.organizationId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = (await request.json()) as Record<string, unknown>;
    const parsed = callbackSessionCreateSchema.safeParse({ ...body, auditionId });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const [callbackSession] = await db
      .insert(callbackSessions)
      .values({
        auditionId,
        name: parsed.data.name,
        round: parsed.data.round,
        location: parsed.data.location,
        isVirtual: parsed.data.isVirtual,
        notes: parsed.data.notes,
        scheduleDates: parsed.data.scheduleDates,
        slotDurationMinutes: parsed.data.slotDurationMinutes,
        status: parsed.data.status,
      })
      .returning();

    if (!callbackSession) {
      return NextResponse.json({ error: "Failed to create callback session" }, { status: 500 });
    }

    return NextResponse.json({ session: callbackSession }, { status: 201 });
  } catch (error) {
    console.error("Error creating callback session:", error);
    return NextResponse.json({ error: "Failed to create callback session" }, { status: 500 });
  }
}

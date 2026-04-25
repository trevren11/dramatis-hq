import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  auditions,
  callbackSessions,
  callbackNotes,
  talentProfiles,
  roles,
  producerProfiles,
  auditionFormResponses,
} from "@/lib/db/schema";
import { callbackNoteSchema } from "@/lib/validations/callbacks";
import { eq, and, desc } from "drizzle-orm";

/**
 * GET /api/auditions/[id]/callbacks/[sessionId]/notes
 * Get notes for a callback session, optionally filtered by talent
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; sessionId: string }> }
): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: auditionId, sessionId } = await params;
    const url = new URL(request.url);
    const talentProfileId = url.searchParams.get("talentProfileId");
    const includeInitial = url.searchParams.get("includeInitial") === "true";

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

    let notesQuery;
    if (talentProfileId) {
      notesQuery = db.query.callbackNotes.findMany({
        where: and(
          eq(callbackNotes.callbackSessionId, sessionId),
          eq(callbackNotes.talentProfileId, talentProfileId)
        ),
        orderBy: [desc(callbackNotes.createdAt)],
      });
    } else {
      notesQuery = db.query.callbackNotes.findMany({
        where: eq(callbackNotes.callbackSessionId, sessionId),
        orderBy: [desc(callbackNotes.createdAt)],
      });
    }

    const notes = await notesQuery;

    const notesWithDetails = await Promise.all(
      notes.map(async (note) => {
        const talent = await db.query.talentProfiles.findFirst({
          where: eq(talentProfiles.id, note.talentProfileId),
        });

        const role = note.roleId
          ? await db.query.roles.findFirst({
              where: eq(roles.id, note.roleId),
            })
          : null;

        return {
          ...note,
          talent: talent
            ? {
                id: talent.id,
                name: `${talent.firstName} ${talent.lastName}`,
              }
            : null,
          role: role ? { id: role.id, name: role.name } : null,
        };
      })
    );

    let initialNotes: { talentProfileId: string; responses: unknown }[] = [];
    if (includeInitial && talentProfileId) {
      const initialResponse = await db.query.auditionFormResponses.findFirst({
        where: and(
          eq(auditionFormResponses.auditionId, auditionId),
          eq(auditionFormResponses.talentProfileId, talentProfileId)
        ),
      });

      if (initialResponse) {
        initialNotes = [
          {
            talentProfileId: initialResponse.talentProfileId,
            responses: initialResponse.responses,
          },
        ];
      }
    }

    return NextResponse.json({
      notes: notesWithDetails,
      initialNotes,
    });
  } catch (error) {
    console.error("Error fetching notes:", error);
    return NextResponse.json({ error: "Failed to fetch notes" }, { status: 500 });
  }
}

/**
 * POST /api/auditions/[id]/callbacks/[sessionId]/notes
 * Create or update a note for a talent
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; sessionId: string }> }
): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: auditionId, sessionId } = await params;

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

    const callbackSession = await db.query.callbackSessions.findFirst({
      where: and(eq(callbackSessions.id, sessionId), eq(callbackSessions.auditionId, auditionId)),
    });

    if (!callbackSession) {
      return NextResponse.json({ error: "Callback session not found" }, { status: 404 });
    }

    const body = (await request.json()) as Record<string, unknown>;
    const parsed = callbackNoteSchema.safeParse({
      ...body,
      callbackSessionId: sessionId,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const existingNote = await db.query.callbackNotes.findFirst({
      where: and(
        eq(callbackNotes.callbackSessionId, sessionId),
        eq(callbackNotes.talentProfileId, parsed.data.talentProfileId),
        parsed.data.roleId
          ? eq(callbackNotes.roleId, parsed.data.roleId)
          : eq(callbackNotes.roleId, parsed.data.roleId as unknown as string)
      ),
    });

    let note;
    if (existingNote) {
      [note] = await db
        .update(callbackNotes)
        .set({
          content: parsed.data.content,
          updatedAt: new Date(),
        })
        .where(eq(callbackNotes.id, existingNote.id))
        .returning();
    } else {
      [note] = await db
        .insert(callbackNotes)
        .values({
          callbackSessionId: sessionId,
          talentProfileId: parsed.data.talentProfileId,
          roleId: parsed.data.roleId,
          content: parsed.data.content,
          authorId: session.user.id,
        })
        .returning();
    }

    if (!note) {
      return NextResponse.json({ error: "Failed to save note" }, { status: 500 });
    }

    return NextResponse.json({ note }, { status: existingNote ? 200 : 201 });
  } catch (error) {
    console.error("Error saving note:", error);
    return NextResponse.json({ error: "Failed to save note" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { producerProfiles, auditions, auditionNotes, talentProfiles, users } from "@/lib/db/schema";
import { noteCreateSchema } from "@/lib/validations/audition-session";
import { eq, and, desc } from "drizzle-orm";

/**
 * GET /api/auditions/[id]/notes
 * Get all notes for an audition (producer only)
 * Optional query param: ?talentProfileId=xxx to filter by talent
 */
export async function GET(
  request: Request,
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

    // Check for talentProfileId filter
    const url = new URL(request.url);
    const talentProfileId = url.searchParams.get("talentProfileId");

    // Build query conditions
    const conditions = [eq(auditionNotes.auditionId, auditionId)];
    if (talentProfileId) {
      conditions.push(eq(auditionNotes.talentProfileId, talentProfileId));
    }

    // Get all notes with user info
    const notes = await db
      .select({
        id: auditionNotes.id,
        note: auditionNotes.note,
        createdAt: auditionNotes.createdAt,
        talentProfile: {
          id: talentProfiles.id,
          stageName: talentProfiles.stageName,
        },
        createdBy: {
          id: users.id,
          name: users.name,
        },
      })
      .from(auditionNotes)
      .innerJoin(talentProfiles, eq(auditionNotes.talentProfileId, talentProfiles.id))
      .innerJoin(users, eq(auditionNotes.createdBy, users.id))
      .where(and(...conditions))
      .orderBy(desc(auditionNotes.createdAt));

    return NextResponse.json({
      notes: notes.map((n) => ({
        id: n.id,
        note: n.note,
        createdAt: n.createdAt,
        talent: {
          id: n.talentProfile.id,
          name: n.talentProfile.stageName,
        },
        createdBy: {
          id: n.createdBy.id,
          name: n.createdBy.name,
        },
      })),
      total: notes.length,
    });
  } catch (error) {
    console.error("Error fetching notes:", error);
    return NextResponse.json({ error: "Failed to fetch notes" }, { status: 500 });
  }
}

/**
 * POST /api/auditions/[id]/notes
 * Create a new note for a talent (producer only)
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

    // Parse and validate request body
    const body: unknown = await request.json();
    const parsed = noteCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { talentProfileId, note } = parsed.data;

    // Verify talent exists
    const talent = await db.query.talentProfiles.findFirst({
      where: eq(talentProfiles.id, talentProfileId),
    });

    if (!talent) {
      return NextResponse.json({ error: "Talent profile not found" }, { status: 404 });
    }

    // Create the note
    const [newNote] = await db
      .insert(auditionNotes)
      .values({
        auditionId,
        talentProfileId,
        note,
        createdBy: session.user.id,
      })
      .returning();

    return NextResponse.json({ note: newNote }, { status: 201 });
  } catch (error) {
    console.error("Error creating note:", error);
    return NextResponse.json({ error: "Failed to create note" }, { status: 500 });
  }
}

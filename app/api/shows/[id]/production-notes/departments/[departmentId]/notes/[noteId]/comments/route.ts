import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  shows,
  producerProfiles,
  productionNotes,
  productionNoteComments,
  productionActivity,
} from "@/lib/db/schema";
import { commentCreateSchema } from "@/lib/validations/production-notes";
import { eq, and, desc } from "drizzle-orm";

interface RouteParams {
  params: Promise<{ id: string; departmentId: string; noteId: string }>;
}

export async function GET(_request: Request, { params }: RouteParams): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: showId, departmentId, noteId } = await params;

    const show = await db.query.shows.findFirst({
      where: eq(shows.id, showId),
    });

    if (!show) {
      return NextResponse.json({ error: "Show not found" }, { status: 404 });
    }

    const producerProfile = await db.query.producerProfiles.findFirst({
      where: eq(producerProfiles.userId, session.user.id),
    });

    if (producerProfile?.id !== show.organizationId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const note = await db.query.productionNotes.findFirst({
      where: and(eq(productionNotes.id, noteId), eq(productionNotes.departmentId, departmentId)),
    });

    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    const comments = await db.query.productionNoteComments.findMany({
      where: eq(productionNoteComments.noteId, noteId),
      orderBy: [desc(productionNoteComments.createdAt)],
    });

    return NextResponse.json({ comments });
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: RouteParams): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: showId, departmentId, noteId } = await params;

    const show = await db.query.shows.findFirst({
      where: eq(shows.id, showId),
    });

    if (!show) {
      return NextResponse.json({ error: "Show not found" }, { status: 404 });
    }

    const producerProfile = await db.query.producerProfiles.findFirst({
      where: eq(producerProfiles.userId, session.user.id),
    });

    if (producerProfile?.id !== show.organizationId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const note = await db.query.productionNotes.findFirst({
      where: and(eq(productionNotes.id, noteId), eq(productionNotes.departmentId, departmentId)),
    });

    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    const body = (await request.json()) as Record<string, unknown>;
    const parsed = commentCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const [comment] = await db
      .insert(productionNoteComments)
      .values({
        noteId,
        content: parsed.data.content,
        parentCommentId: parsed.data.parentCommentId,
        mentions: parsed.data.mentions,
        createdBy: session.user.id,
      })
      .returning();

    if (!comment) {
      return NextResponse.json({ error: "Failed to create comment" }, { status: 500 });
    }

    await db.insert(productionActivity).values({
      showId,
      departmentId,
      activityType: "comment_added",
      entityId: comment.id,
      entityType: "comment",
      description: `Added comment on "${note.title}"`,
      metadata: { noteId, noteTitle: note.title },
      userId: session.user.id,
    });

    if (parsed.data.mentions.length > 0) {
      await Promise.all(
        parsed.data.mentions.map(async (mentionedUserId) => {
          await db.insert(productionActivity).values({
            showId,
            departmentId,
            activityType: "mention",
            entityId: comment.id,
            entityType: "comment",
            description: `Mentioned in a comment on "${note.title}"`,
            metadata: { noteId, noteTitle: note.title, commentId: comment.id },
            userId: mentionedUserId,
          });
        })
      );
    }

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json({ error: "Failed to create comment" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  shows,
  producerProfiles,
  productionNotes,
  productionNoteVersions,
  productionNoteComments,
  productionActivity,
  users,
} from "@/lib/db/schema";
import { noteUpdateSchema } from "@/lib/validations/production-notes";
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

    const [comments, versions, lastEditor] = await Promise.all([
      db.query.productionNoteComments.findMany({
        where: eq(productionNoteComments.noteId, noteId),
        orderBy: [desc(productionNoteComments.createdAt)],
      }),
      db.query.productionNoteVersions.findMany({
        where: eq(productionNoteVersions.noteId, noteId),
        orderBy: [desc(productionNoteVersions.version)],
      }),
      note.lastEditedBy
        ? db.query.users.findFirst({
            where: eq(users.id, note.lastEditedBy),
          })
        : null,
    ]);

    return NextResponse.json({
      note,
      comments,
      versions,
      lastEditor: lastEditor
        ? { id: lastEditor.id, name: lastEditor.name, email: lastEditor.email }
        : null,
    });
  } catch (error) {
    console.error("Error fetching note:", error);
    return NextResponse.json({ error: "Failed to fetch note" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: RouteParams): Promise<NextResponse> {
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

    const existingNote = await db.query.productionNotes.findFirst({
      where: and(eq(productionNotes.id, noteId), eq(productionNotes.departmentId, departmentId)),
    });

    if (!existingNote) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    const body = (await request.json()) as Record<string, unknown>;
    const parsed = noteUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    if (parsed.data.saveVersion) {
      await db.insert(productionNoteVersions).values({
        noteId,
        version: existingNote.version,
        title: existingNote.title,
        content: existingNote.content,
        changesSummary: parsed.data.changesSummary,
        createdBy: session.user.id,
      });
    }

    const updateData: Record<string, unknown> = {
      ...parsed.data,
      lastEditedBy: session.user.id,
      lastEditedAt: new Date(),
      updatedAt: new Date(),
    };

    if (parsed.data.saveVersion) {
      updateData.version = existingNote.version + 1;
    }

    delete updateData.saveVersion;
    delete updateData.changesSummary;

    const [note] = await db
      .update(productionNotes)
      .set(updateData)
      .where(eq(productionNotes.id, noteId))
      .returning();

    if (!note) {
      return NextResponse.json({ error: "Failed to update note" }, { status: 500 });
    }

    await db.insert(productionActivity).values({
      showId,
      departmentId,
      activityType: "note_updated",
      entityId: noteId,
      entityType: "note",
      description: `Updated note "${note.title}"`,
      userId: session.user.id,
    });

    return NextResponse.json({ note });
  } catch (error) {
    console.error("Error updating note:", error);
    return NextResponse.json({ error: "Failed to update note" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: RouteParams): Promise<NextResponse> {
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

    await db.delete(productionNotes).where(eq(productionNotes.id, noteId));

    await db.insert(productionActivity).values({
      showId,
      departmentId,
      activityType: "note_deleted",
      entityId: noteId,
      entityType: "note",
      description: `Deleted note "${note.title}"`,
      userId: session.user.id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting note:", error);
    return NextResponse.json({ error: "Failed to delete note" }, { status: 500 });
  }
}

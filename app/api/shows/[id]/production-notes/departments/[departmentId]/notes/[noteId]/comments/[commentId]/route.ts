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
import { commentUpdateSchema, commentResolveSchema } from "@/lib/validations/production-notes";
import { eq, and } from "drizzle-orm";

interface RouteParams {
  params: Promise<{ id: string; departmentId: string; noteId: string; commentId: string }>;
}

export async function PATCH(request: Request, { params }: RouteParams): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: showId, noteId, commentId } = await params;

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

    const existingComment = await db.query.productionNoteComments.findFirst({
      where: and(
        eq(productionNoteComments.id, commentId),
        eq(productionNoteComments.noteId, noteId)
      ),
    });

    if (!existingComment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    const body = (await request.json()) as Record<string, unknown>;

    if ("isResolved" in body) {
      const parsed = commentResolveSchema.safeParse(body);

      if (!parsed.success) {
        return NextResponse.json(
          { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
          { status: 400 }
        );
      }

      const [comment] = await db
        .update(productionNoteComments)
        .set({
          isResolved: parsed.data.isResolved,
          resolvedBy: parsed.data.isResolved ? session.user.id : null,
          resolvedAt: parsed.data.isResolved ? new Date() : null,
          updatedAt: new Date(),
        })
        .where(eq(productionNoteComments.id, commentId))
        .returning();

      return NextResponse.json({ comment });
    }

    if (existingComment.createdBy !== session.user.id) {
      return NextResponse.json({ error: "You can only edit your own comments" }, { status: 403 });
    }

    const parsed = commentUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const [comment] = await db
      .update(productionNoteComments)
      .set({
        content: parsed.data.content,
        updatedAt: new Date(),
      })
      .where(eq(productionNoteComments.id, commentId))
      .returning();

    return NextResponse.json({ comment });
  } catch (error) {
    console.error("Error updating comment:", error);
    return NextResponse.json({ error: "Failed to update comment" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: RouteParams): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: showId, noteId, commentId, departmentId } = await params;

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

    const comment = await db.query.productionNoteComments.findFirst({
      where: and(
        eq(productionNoteComments.id, commentId),
        eq(productionNoteComments.noteId, noteId)
      ),
    });

    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    if (comment.createdBy !== session.user.id) {
      return NextResponse.json({ error: "You can only delete your own comments" }, { status: 403 });
    }

    await db.delete(productionNoteComments).where(eq(productionNoteComments.id, commentId));

    const note = await db.query.productionNotes.findFirst({
      where: eq(productionNotes.id, noteId),
    });

    await db.insert(productionActivity).values({
      showId,
      departmentId,
      activityType: "comment_deleted",
      entityId: commentId,
      entityType: "comment",
      description: `Deleted comment on "${note?.title ?? "note"}"`,
      userId: session.user.id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting comment:", error);
    return NextResponse.json({ error: "Failed to delete comment" }, { status: 500 });
  }
}

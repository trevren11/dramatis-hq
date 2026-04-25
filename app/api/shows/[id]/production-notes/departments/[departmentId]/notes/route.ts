import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  shows,
  producerProfiles,
  productionDepartments,
  productionNotes,
  productionActivity,
} from "@/lib/db/schema";
import { noteCreateSchema } from "@/lib/validations/production-notes";
import { eq, and, desc } from "drizzle-orm";

interface RouteParams {
  params: Promise<{ id: string; departmentId: string }>;
}

export async function GET(_request: Request, { params }: RouteParams): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: showId, departmentId } = await params;

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

    const department = await db.query.productionDepartments.findFirst({
      where: and(
        eq(productionDepartments.id, departmentId),
        eq(productionDepartments.showId, showId)
      ),
    });

    if (!department) {
      return NextResponse.json({ error: "Department not found" }, { status: 404 });
    }

    const notes = await db.query.productionNotes.findMany({
      where: eq(productionNotes.departmentId, departmentId),
      orderBy: [desc(productionNotes.isPinned), desc(productionNotes.updatedAt)],
    });

    return NextResponse.json({ notes });
  } catch (error) {
    console.error("Error fetching notes:", error);
    return NextResponse.json({ error: "Failed to fetch notes" }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: RouteParams): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: showId, departmentId } = await params;

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

    const department = await db.query.productionDepartments.findFirst({
      where: and(
        eq(productionDepartments.id, departmentId),
        eq(productionDepartments.showId, showId)
      ),
    });

    if (!department) {
      return NextResponse.json({ error: "Department not found" }, { status: 404 });
    }

    const body = (await request.json()) as Record<string, unknown>;
    const parsed = noteCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const [note] = await db
      .insert(productionNotes)
      .values({
        departmentId,
        title: parsed.data.title,
        content: parsed.data.content,
        folderId: parsed.data.folderId,
        templateType: parsed.data.templateType,
        isDraft: parsed.data.isDraft,
        isPinned: parsed.data.isPinned,
        accessLevel: parsed.data.accessLevel,
        createdBy: session.user.id,
        lastEditedBy: session.user.id,
        lastEditedAt: new Date(),
      })
      .returning();

    if (!note) {
      return NextResponse.json({ error: "Failed to create note" }, { status: 500 });
    }

    await db.insert(productionActivity).values({
      showId,
      departmentId,
      activityType: "note_created",
      entityId: note.id,
      entityType: "note",
      description: `Created note "${note.title}"`,
      userId: session.user.id,
    });

    return NextResponse.json({ note }, { status: 201 });
  } catch (error) {
    console.error("Error creating note:", error);
    return NextResponse.json({ error: "Failed to create note" }, { status: 500 });
  }
}

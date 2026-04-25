import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { savedSearches, producerProfiles } from "@/lib/db/schema";
import { savedSearchSchema } from "@/lib/validations/talent-lists";
import { eq, and } from "drizzle-orm";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteParams): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "producer") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const producerProfile = await db.query.producerProfiles.findFirst({
      where: eq(producerProfiles.userId, session.user.id),
    });

    if (!producerProfile) {
      return NextResponse.json({ error: "Producer profile not found" }, { status: 403 });
    }

    const { id } = await params;

    const search = await db.query.savedSearches.findFirst({
      where: and(eq(savedSearches.id, id), eq(savedSearches.organizationId, producerProfile.id)),
    });

    if (!search) {
      return NextResponse.json({ error: "Saved search not found" }, { status: 404 });
    }

    return NextResponse.json({ search });
  } catch (error) {
    console.error("Error fetching saved search:", error);
    return NextResponse.json({ error: "Failed to fetch saved search" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: RouteParams): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "producer") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const producerProfile = await db.query.producerProfiles.findFirst({
      where: eq(producerProfiles.userId, session.user.id),
    });

    if (!producerProfile) {
      return NextResponse.json({ error: "Producer profile not found" }, { status: 403 });
    }

    const { id } = await params;

    const existingSearch = await db.query.savedSearches.findFirst({
      where: and(eq(savedSearches.id, id), eq(savedSearches.organizationId, producerProfile.id)),
    });

    if (!existingSearch) {
      return NextResponse.json({ error: "Saved search not found" }, { status: 404 });
    }

    const body: unknown = await request.json();
    const parsed = savedSearchSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const [updated] = await db
      .update(savedSearches)
      .set({
        name: parsed.data.name,
        description: parsed.data.description,
        filters: parsed.data.filters,
        sortOrder: parsed.data.sortOrder,
        notifyOnMatch: parsed.data.notifyOnMatch,
        updatedAt: new Date(),
      })
      .where(eq(savedSearches.id, id))
      .returning();

    return NextResponse.json({ search: updated });
  } catch (error) {
    console.error("Error updating saved search:", error);
    return NextResponse.json({ error: "Failed to update saved search" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: RouteParams): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "producer") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const producerProfile = await db.query.producerProfiles.findFirst({
      where: eq(producerProfiles.userId, session.user.id),
    });

    if (!producerProfile) {
      return NextResponse.json({ error: "Producer profile not found" }, { status: 403 });
    }

    const { id } = await params;

    const existingSearch = await db.query.savedSearches.findFirst({
      where: and(eq(savedSearches.id, id), eq(savedSearches.organizationId, producerProfile.id)),
    });

    if (!existingSearch) {
      return NextResponse.json({ error: "Saved search not found" }, { status: 404 });
    }

    await db.delete(savedSearches).where(eq(savedSearches.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting saved search:", error);
    return NextResponse.json({ error: "Failed to delete saved search" }, { status: 500 });
  }
}

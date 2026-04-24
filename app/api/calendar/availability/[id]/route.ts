import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { talentProfiles, availability } from "@/lib/db/schema";
import { availabilityUpdateSchema } from "@/lib/validations/calendar";
import { eq, and } from "drizzle-orm";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const profile = await db.query.talentProfiles.findFirst({
      where: eq(talentProfiles.userId, session.user.id),
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const entry = await db.query.availability.findFirst({
      where: and(eq(availability.id, id), eq(availability.talentProfileId, profile.id)),
    });

    if (!entry) {
      return NextResponse.json({ error: "Availability entry not found" }, { status: 404 });
    }

    return NextResponse.json({ availability: entry });
  } catch (error) {
    console.error("Error fetching availability:", error);
    return NextResponse.json({ error: "Failed to fetch availability" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const profile = await db.query.talentProfiles.findFirst({
      where: eq(talentProfiles.userId, session.user.id),
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const existingEntry = await db.query.availability.findFirst({
      where: and(eq(availability.id, id), eq(availability.talentProfileId, profile.id)),
    });

    if (!existingEntry) {
      return NextResponse.json({ error: "Availability entry not found" }, { status: 404 });
    }

    const body: unknown = await request.json();
    const parsed = availabilityUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const [updated] = await db
      .update(availability)
      .set({
        ...parsed.data,
        updatedAt: new Date(),
      })
      .where(eq(availability.id, id))
      .returning();

    return NextResponse.json({ availability: updated });
  } catch (error) {
    console.error("Error updating availability:", error);
    return NextResponse.json({ error: "Failed to update availability" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const profile = await db.query.talentProfiles.findFirst({
      where: eq(talentProfiles.userId, session.user.id),
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const existingEntry = await db.query.availability.findFirst({
      where: and(eq(availability.id, id), eq(availability.talentProfileId, profile.id)),
    });

    if (!existingEntry) {
      return NextResponse.json({ error: "Availability entry not found" }, { status: 404 });
    }

    await db.delete(availability).where(eq(availability.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting availability:", error);
    return NextResponse.json({ error: "Failed to delete availability" }, { status: 500 });
  }
}

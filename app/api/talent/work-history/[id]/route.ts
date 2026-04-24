import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { talentProfiles, workHistory } from "@/lib/db/schema";
import { workHistorySchema } from "@/lib/validations/profile";
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

    const entry = await db.query.workHistory.findFirst({
      where: and(eq(workHistory.id, id), eq(workHistory.talentProfileId, profile.id)),
    });

    if (!entry) {
      return NextResponse.json({ error: "Work history entry not found" }, { status: 404 });
    }

    return NextResponse.json({ workHistory: entry });
  } catch (error) {
    console.error("Error fetching work history entry:", error);
    return NextResponse.json({ error: "Failed to fetch work history entry" }, { status: 500 });
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

    const existingEntry = await db.query.workHistory.findFirst({
      where: and(eq(workHistory.id, id), eq(workHistory.talentProfileId, profile.id)),
    });

    if (!existingEntry) {
      return NextResponse.json({ error: "Work history entry not found" }, { status: 404 });
    }

    const body: unknown = await request.json();
    const parsed = workHistorySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const [updated] = await db
      .update(workHistory)
      .set({
        ...parsed.data,
        updatedAt: new Date(),
      })
      .where(eq(workHistory.id, id))
      .returning();

    return NextResponse.json({ workHistory: updated });
  } catch (error) {
    console.error("Error updating work history:", error);
    return NextResponse.json({ error: "Failed to update work history" }, { status: 500 });
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

    const existingEntry = await db.query.workHistory.findFirst({
      where: and(eq(workHistory.id, id), eq(workHistory.talentProfileId, profile.id)),
    });

    if (!existingEntry) {
      return NextResponse.json({ error: "Work history entry not found" }, { status: 404 });
    }

    await db.delete(workHistory).where(eq(workHistory.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting work history:", error);
    return NextResponse.json({ error: "Failed to delete work history" }, { status: 500 });
  }
}

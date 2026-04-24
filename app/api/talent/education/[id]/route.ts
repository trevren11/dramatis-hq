import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { talentProfiles, education } from "@/lib/db/schema";
import { educationSchema } from "@/lib/validations/profile";
import { eq, and } from "drizzle-orm";

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

    const existingEntry = await db.query.education.findFirst({
      where: and(eq(education.id, id), eq(education.talentProfileId, profile.id)),
    });

    if (!existingEntry) {
      return NextResponse.json({ error: "Education entry not found" }, { status: 404 });
    }

    const body: unknown = await request.json();
    const parsed = educationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const [updated] = await db
      .update(education)
      .set({
        ...parsed.data,
        updatedAt: new Date(),
      })
      .where(eq(education.id, id))
      .returning();

    return NextResponse.json({ education: updated });
  } catch (error) {
    console.error("Error updating education:", error);
    return NextResponse.json({ error: "Failed to update education" }, { status: 500 });
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

    const existingEntry = await db.query.education.findFirst({
      where: and(eq(education.id, id), eq(education.talentProfileId, profile.id)),
    });

    if (!existingEntry) {
      return NextResponse.json({ error: "Education entry not found" }, { status: 404 });
    }

    await db.delete(education).where(eq(education.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting education:", error);
    return NextResponse.json({ error: "Failed to delete education" }, { status: 500 });
  }
}

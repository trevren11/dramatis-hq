import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { talentProfiles, talentSkills } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: skillId } = await params;

    const profile = await db.query.talentProfiles.findFirst({
      where: eq(talentProfiles.userId, session.user.id),
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    await db
      .delete(talentSkills)
      .where(and(eq(talentSkills.talentProfileId, profile.id), eq(talentSkills.skillId, skillId)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing skill:", error);
    return NextResponse.json({ error: "Failed to remove skill" }, { status: 500 });
  }
}

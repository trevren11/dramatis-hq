import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { talentProfiles, workHistory } from "@/lib/db/schema";
import { workHistorySchema } from "@/lib/validations/profile";
import { eq, asc } from "drizzle-orm";

export async function GET(): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await db.query.talentProfiles.findFirst({
      where: eq(talentProfiles.userId, session.user.id),
    });

    if (!profile) {
      return NextResponse.json({ workHistory: [] });
    }

    const entries = await db.query.workHistory.findMany({
      where: eq(workHistory.talentProfileId, profile.id),
      orderBy: [asc(workHistory.sortOrder)],
    });

    return NextResponse.json({ workHistory: entries });
  } catch (error) {
    console.error("Error fetching work history:", error);
    return NextResponse.json({ error: "Failed to fetch work history" }, { status: 500 });
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await db.query.talentProfiles.findFirst({
      where: eq(talentProfiles.userId, session.user.id),
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const body: unknown = await request.json();
    const parsed = workHistorySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const [entry] = await db
      .insert(workHistory)
      .values({
        ...parsed.data,
        talentProfileId: profile.id,
      })
      .returning();

    return NextResponse.json({ workHistory: entry }, { status: 201 });
  } catch (error) {
    console.error("Error creating work history:", error);
    return NextResponse.json({ error: "Failed to create work history" }, { status: 500 });
  }
}

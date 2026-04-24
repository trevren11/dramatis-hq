import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { talentProfiles, headshots, MAX_HEADSHOTS } from "@/lib/db/schema";
import { headshotCreateSchema } from "@/lib/validations/profile";
import { eq, asc, and, count } from "drizzle-orm";

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
      return NextResponse.json({ headshots: [] });
    }

    const entries = await db.query.headshots.findMany({
      where: eq(headshots.talentProfileId, profile.id),
      orderBy: [asc(headshots.sortOrder)],
    });

    return NextResponse.json({ headshots: entries });
  } catch (error) {
    console.error("Error fetching headshots:", error);
    return NextResponse.json({ error: "Failed to fetch headshots" }, { status: 500 });
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

    const [countResult] = await db
      .select({ count: count() })
      .from(headshots)
      .where(eq(headshots.talentProfileId, profile.id));

    const currentCount = countResult?.count ?? 0;
    if (currentCount >= MAX_HEADSHOTS) {
      return NextResponse.json(
        { error: `Maximum of ${String(MAX_HEADSHOTS)} headshots allowed` },
        { status: 400 }
      );
    }

    const body: unknown = await request.json();
    const parsed = headshotCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const existingPrimary = await db.query.headshots.findFirst({
      where: and(eq(headshots.talentProfileId, profile.id), eq(headshots.isPrimary, true)),
    });

    const [entry] = await db
      .insert(headshots)
      .values({
        talentProfileId: profile.id,
        url: parsed.data.url,
        thumbnailUrl: parsed.data.thumbnailUrl,
        originalFilename: parsed.data.originalFilename,
        mimeType: parsed.data.mimeType,
        fileSize: parsed.data.fileSize,
        width: parsed.data.width,
        height: parsed.data.height,
        isPrimary: !existingPrimary,
        sortOrder: currentCount,
      })
      .returning();

    return NextResponse.json({ headshot: entry }, { status: 201 });
  } catch (error) {
    console.error("Error creating headshot:", error);
    return NextResponse.json({ error: "Failed to create headshot" }, { status: 500 });
  }
}

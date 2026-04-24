import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { talentProfiles, education } from "@/lib/db/schema";
import { educationSchema } from "@/lib/validations/profile";
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
      return NextResponse.json({ education: [] });
    }

    const entries = await db.query.education.findMany({
      where: eq(education.talentProfileId, profile.id),
      orderBy: [asc(education.sortOrder)],
    });

    return NextResponse.json({ education: entries });
  } catch (error) {
    console.error("Error fetching education:", error);
    return NextResponse.json({ error: "Failed to fetch education" }, { status: 500 });
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
    const parsed = educationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const [entry] = await db
      .insert(education)
      .values({
        ...parsed.data,
        talentProfileId: profile.id,
      })
      .returning();

    return NextResponse.json({ education: entry }, { status: 201 });
  } catch (error) {
    console.error("Error creating education:", error);
    return NextResponse.json({ error: "Failed to create education" }, { status: 500 });
  }
}

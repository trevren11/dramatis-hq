import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { talentProfiles } from "@/lib/db/schema";
import {
  usernameCheckSchema,
  usernameSetSchema,
  normalizeUsername,
} from "@/lib/validations/username";
import { eq, and, ne } from "drizzle-orm";

// GET: Check if username is available
export async function GET(request: Request): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get("username");

    if (!username) {
      return NextResponse.json({ error: "Username is required" }, { status: 400 });
    }

    const parsed = usernameCheckSchema.safeParse({ username });
    if (!parsed.success) {
      return NextResponse.json(
        { available: false, error: parsed.error.flatten().fieldErrors.username?.[0] },
        { status: 200 }
      );
    }

    const normalized = normalizeUsername(parsed.data.username);
    const existing = await db.query.talentProfiles.findFirst({
      where: eq(talentProfiles.publicProfileSlug, normalized),
      columns: { id: true },
    });

    return NextResponse.json({ available: !existing });
  } catch (error) {
    console.error("Error checking username:", error);
    return NextResponse.json({ error: "Failed to check username" }, { status: 500 });
  }
}

// PUT: Set or update username
export async function PUT(request: Request): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: unknown = await request.json();
    const parsed = usernameSetSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const normalized = normalizeUsername(parsed.data.username);

    // Check if username is taken by another user
    const existingProfile = await db.query.talentProfiles.findFirst({
      where: eq(talentProfiles.userId, session.user.id),
    });

    if (!existingProfile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const takenBy = await db.query.talentProfiles.findFirst({
      where: and(
        eq(talentProfiles.publicProfileSlug, normalized),
        ne(talentProfiles.id, existingProfile.id)
      ),
      columns: { id: true },
    });

    if (takenBy) {
      return NextResponse.json({ error: "Username is already taken" }, { status: 409 });
    }

    // Update the username
    const [updated] = await db
      .update(talentProfiles)
      .set({
        publicProfileSlug: normalized,
        updatedAt: new Date(),
      })
      .where(eq(talentProfiles.id, existingProfile.id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Failed to update username" }, { status: 500 });
    }

    return NextResponse.json({
      username: updated.publicProfileSlug,
      profileUrl: `/talent/${updated.publicProfileSlug ?? ""}`,
    });
  } catch (error) {
    console.error("Error setting username:", error);
    return NextResponse.json({ error: "Failed to set username" }, { status: 500 });
  }
}

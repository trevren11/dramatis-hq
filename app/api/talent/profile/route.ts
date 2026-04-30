import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { talentProfiles, users } from "@/lib/db/schema";
import { profileUpdateSchema, profileFullSchema, isMinor } from "@/lib/validations/profile";
import { eq } from "drizzle-orm";

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
      const user = await db.query.users.findFirst({
        where: eq(users.id, session.user.id),
      });

      return NextResponse.json({
        profile: null,
        user: user
          ? {
              email: user.email,
              name: user.name,
            }
          : null,
      });
    }

    return NextResponse.json({ profile });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}

export async function PUT(request: Request): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: unknown = await request.json();
    const parsed = profileUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const existingProfile = await db.query.talentProfiles.findFirst({
      where: eq(talentProfiles.userId, session.user.id),
    });

    if (!existingProfile) {
      return NextResponse.json(
        { error: "Profile not found. Use POST to create a new profile." },
        { status: 404 }
      );
    }

    // Calculate isOver18 from birthday and enforce minor protection
    const userIsMinor = isMinor(parsed.data.birthday);
    const profileData = {
      ...parsed.data,
      // Compute isOver18 from birthday (only set if birthday is provided)
      ...(userIsMinor !== null && { isOver18: !userIsMinor }),
      // Minors must be hidden from search - enforce this regardless of user input
      hideFromSearch: userIsMinor === true ? true : parsed.data.hideFromSearch,
      updatedAt: new Date(),
    };

    const [profile] = await db
      .update(talentProfiles)
      .set(profileData)
      .where(eq(talentProfiles.id, existingProfile.id))
      .returning();

    return NextResponse.json({ profile });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existingProfile = await db.query.talentProfiles.findFirst({
      where: eq(talentProfiles.userId, session.user.id),
    });

    if (existingProfile) {
      return NextResponse.json({ error: "Profile already exists" }, { status: 409 });
    }

    const body: unknown = await request.json();
    // Use full schema for profile creation (requires firstName/lastName)
    const parsed = profileFullSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    // Calculate isOver18 from birthday and enforce minor protection for new profiles
    const userIsMinor = isMinor(parsed.data.birthday);
    const [profile] = await db
      .insert(talentProfiles)
      .values({
        ...parsed.data,
        userId: session.user.id,
        // Compute isOver18 from birthday (only set if birthday is provided)
        ...(userIsMinor !== null && { isOver18: !userIsMinor }),
        // Minors must be hidden from search
        hideFromSearch: userIsMinor === true ? true : parsed.data.hideFromSearch,
      })
      .returning();

    return NextResponse.json({ profile }, { status: 201 });
  } catch (error) {
    console.error("Error creating profile:", error);
    return NextResponse.json({ error: "Failed to create profile" }, { status: 500 });
  }
}

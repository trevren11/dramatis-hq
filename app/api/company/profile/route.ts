import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { producerProfiles, users } from "@/lib/db/schema";
import { companyProfileSchema, companyProfileUpdateSchema } from "@/lib/validations/company";
import { eq, and, ne } from "drizzle-orm";

export async function GET(): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await db.query.producerProfiles.findFirst({
      where: eq(producerProfiles.userId, session.user.id),
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
    console.error("Error fetching company profile:", error);
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check user type
    const user = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
    });

    if (!user || user.userType !== "producer") {
      return NextResponse.json({ error: "Only producers can create company profiles" }, { status: 403 });
    }

    const existingProfile = await db.query.producerProfiles.findFirst({
      where: eq(producerProfiles.userId, session.user.id),
    });

    if (existingProfile) {
      return NextResponse.json({ error: "Profile already exists" }, { status: 409 });
    }

    const body: unknown = await request.json();
    const parsed = companyProfileSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    // Check slug uniqueness
    const slugExists = await db.query.producerProfiles.findFirst({
      where: eq(producerProfiles.slug, parsed.data.slug),
    });

    if (slugExists) {
      return NextResponse.json(
        { error: "Slug already taken", details: { slug: ["This URL is already in use"] } },
        { status: 400 }
      );
    }

    const [profile] = await db
      .insert(producerProfiles)
      .values({
        ...parsed.data,
        userId: session.user.id,
      })
      .returning();

    return NextResponse.json({ profile }, { status: 201 });
  } catch (error) {
    console.error("Error creating company profile:", error);
    return NextResponse.json({ error: "Failed to create profile" }, { status: 500 });
  }
}

export async function PUT(request: Request): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existingProfile = await db.query.producerProfiles.findFirst({
      where: eq(producerProfiles.userId, session.user.id),
    });

    if (!existingProfile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const body: unknown = await request.json();
    const parsed = companyProfileUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    // Check slug uniqueness if being updated
    if (parsed.data.slug && parsed.data.slug !== existingProfile.slug) {
      const slugExists = await db.query.producerProfiles.findFirst({
        where: and(
          eq(producerProfiles.slug, parsed.data.slug),
          ne(producerProfiles.id, existingProfile.id)
        ),
      });

      if (slugExists) {
        return NextResponse.json(
          { error: "Slug already taken", details: { slug: ["This URL is already in use"] } },
          { status: 400 }
        );
      }
    }

    const [profile] = await db
      .update(producerProfiles)
      .set({
        ...parsed.data,
        updatedAt: new Date(),
      })
      .where(eq(producerProfiles.id, existingProfile.id))
      .returning();

    return NextResponse.json({ profile });
  } catch (error) {
    console.error("Error updating company profile:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}

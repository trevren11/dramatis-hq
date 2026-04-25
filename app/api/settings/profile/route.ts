export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, talentProfiles, producerProfiles } from "@/lib/db/schema";

const updateTalentProfileSchema = z.object({
  isPublic: z.boolean().optional(),
  hideFromSearch: z.boolean().optional(),
  publicSections: z.string().optional(), // JSON string
});

const updateProducerProfileSchema = z.object({
  isPublic: z.boolean().optional(),
});

export async function GET(): Promise<NextResponse> {
  try {
    const session = await auth();

    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.userType === "talent") {
      const talentProfile = await db.query.talentProfiles.findFirst({
        where: eq(talentProfiles.userId, session.user.id),
      });

      if (!talentProfile) {
        return NextResponse.json({ error: "Profile not found" }, { status: 404 });
      }

      return NextResponse.json({
        profile: {
          type: "talent",
          isPublic: talentProfile.isPublic ?? true,
          hideFromSearch: talentProfile.hideFromSearch ?? false,
          publicProfileSlug: talentProfile.publicProfileSlug,
          publicSections: talentProfile.publicSections ?? {
            basicInfo: true,
            bio: true,
            headshots: true,
            videos: true,
            workHistory: true,
            education: true,
            skills: true,
            contact: false,
          },
        },
      });
    } else if (user.userType === "producer") {
      const producerProfile = await db.query.producerProfiles.findFirst({
        where: eq(producerProfiles.userId, session.user.id),
      });

      if (!producerProfile) {
        return NextResponse.json({ error: "Profile not found" }, { status: 404 });
      }

      return NextResponse.json({
        profile: {
          type: "producer",
          isPublic: producerProfile.isPublic ?? true,
          companyName: producerProfile.companyName,
          slug: producerProfile.slug,
          logoUrl: producerProfile.logoUrl,
        },
      });
    }

    return NextResponse.json({ error: "Invalid user type" }, { status: 400 });
  } catch (error) {
    console.error("Get profile settings error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: Request): Promise<NextResponse> {
  try {
    const session = await auth();

    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body: unknown = await request.json();

    if (user.userType === "talent") {
      const parsed = updateTalentProfileSchema.safeParse(body);

      if (!parsed.success) {
        return NextResponse.json(
          { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
          { status: 400 }
        );
      }

      const updateData: Record<string, unknown> = {
        updatedAt: new Date(),
      };

      if (parsed.data.isPublic !== undefined) {
        updateData.isPublic = parsed.data.isPublic;
      }
      if (parsed.data.hideFromSearch !== undefined) {
        updateData.hideFromSearch = parsed.data.hideFromSearch;
      }
      if (parsed.data.publicSections !== undefined) {
        try {
          updateData.publicSections = JSON.parse(parsed.data.publicSections);
        } catch {
          return NextResponse.json({ error: "Invalid publicSections JSON" }, { status: 400 });
        }
      }

      await db
        .update(talentProfiles)
        .set(updateData)
        .where(eq(talentProfiles.userId, session.user.id));
    } else if (user.userType === "producer") {
      const parsed = updateProducerProfileSchema.safeParse(body);

      if (!parsed.success) {
        return NextResponse.json(
          { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
          { status: 400 }
        );
      }

      const updateData: Record<string, unknown> = {
        updatedAt: new Date(),
      };

      if (parsed.data.isPublic !== undefined) {
        updateData.isPublic = parsed.data.isPublic;
      }

      await db
        .update(producerProfiles)
        .set(updateData)
        .where(eq(producerProfiles.userId, session.user.id));
    } else {
      return NextResponse.json({ error: "Invalid user type" }, { status: 400 });
    }

    return NextResponse.json({ message: "Profile settings updated" });
  } catch (error) {
    console.error("Update profile settings error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

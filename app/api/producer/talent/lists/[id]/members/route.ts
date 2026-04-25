import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { talentLists, talentListMembers, talentProfiles, producerProfiles } from "@/lib/db/schema";
import { talentListMemberSchema, addMultipleMembersSchema } from "@/lib/validations/talent-lists";
import { eq, and, inArray } from "drizzle-orm";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: RouteParams): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "producer") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const producerProfile = await db.query.producerProfiles.findFirst({
      where: eq(producerProfiles.userId, session.user.id),
    });

    if (!producerProfile) {
      return NextResponse.json({ error: "Producer profile not found" }, { status: 403 });
    }

    const { id: listId } = await params;

    const list = await db.query.talentLists.findFirst({
      where: and(eq(talentLists.id, listId), eq(talentLists.organizationId, producerProfile.id)),
    });

    if (!list) {
      return NextResponse.json({ error: "Talent list not found" }, { status: 404 });
    }

    const body: unknown = await request.json();

    // Try to parse as single member first
    const singleParsed = talentListMemberSchema.safeParse(body);
    if (singleParsed.success) {
      // Single member add
      const talentProfile = await db.query.talentProfiles.findFirst({
        where: eq(talentProfiles.id, singleParsed.data.talentProfileId),
      });

      if (!talentProfile) {
        return NextResponse.json({ error: "Talent profile not found" }, { status: 404 });
      }

      // Check if already a member
      const existingMember = await db.query.talentListMembers.findFirst({
        where: and(
          eq(talentListMembers.listId, listId),
          eq(talentListMembers.talentProfileId, singleParsed.data.talentProfileId)
        ),
      });

      if (existingMember) {
        return NextResponse.json({ error: "Talent is already in this list" }, { status: 409 });
      }

      await db.insert(talentListMembers).values({
        listId,
        talentProfileId: singleParsed.data.talentProfileId,
        notes: singleParsed.data.notes,
        addedBy: session.user.id,
      });

      return NextResponse.json({ success: true }, { status: 201 });
    }

    // Try to parse as multiple members
    const multipleParsed = addMultipleMembersSchema.safeParse(body);
    if (multipleParsed.success) {
      const { talentProfileIds } = multipleParsed.data;

      // Verify all profiles exist
      const profiles = await db
        .select({ id: talentProfiles.id })
        .from(talentProfiles)
        .where(inArray(talentProfiles.id, talentProfileIds));

      const existingProfileIds = new Set(profiles.map((p) => p.id));
      const invalidIds = talentProfileIds.filter((id) => !existingProfileIds.has(id));

      if (invalidIds.length > 0) {
        return NextResponse.json(
          { error: "Some talent profiles not found", invalidIds },
          { status: 404 }
        );
      }

      // Get existing members to avoid duplicates
      const existingMembers = await db
        .select({ talentProfileId: talentListMembers.talentProfileId })
        .from(talentListMembers)
        .where(
          and(
            eq(talentListMembers.listId, listId),
            inArray(talentListMembers.talentProfileId, talentProfileIds)
          )
        );

      const existingMemberIds = new Set(existingMembers.map((m) => m.talentProfileId));
      const newMemberIds = talentProfileIds.filter((id) => !existingMemberIds.has(id));

      if (newMemberIds.length > 0) {
        await db.insert(talentListMembers).values(
          newMemberIds.map((talentProfileId) => ({
            listId,
            talentProfileId,
            addedBy: session.user.id,
          }))
        );
      }

      return NextResponse.json({
        success: true,
        added: newMemberIds.length,
        skipped: existingMemberIds.size,
      });
    }

    return NextResponse.json(
      {
        error: "Validation failed",
        details: "Invalid request body. Expected talentProfileId or talentProfileIds array.",
      },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error adding talent to list:", error);
    return NextResponse.json({ error: "Failed to add talent to list" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: RouteParams): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "producer") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const producerProfile = await db.query.producerProfiles.findFirst({
      where: eq(producerProfiles.userId, session.user.id),
    });

    if (!producerProfile) {
      return NextResponse.json({ error: "Producer profile not found" }, { status: 403 });
    }

    const { id: listId } = await params;

    const list = await db.query.talentLists.findFirst({
      where: and(eq(talentLists.id, listId), eq(talentLists.organizationId, producerProfile.id)),
    });

    if (!list) {
      return NextResponse.json({ error: "Talent list not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const talentProfileId = searchParams.get("talentProfileId");

    if (!talentProfileId) {
      return NextResponse.json({ error: "talentProfileId is required" }, { status: 400 });
    }

    await db
      .delete(talentListMembers)
      .where(
        and(
          eq(talentListMembers.listId, listId),
          eq(talentListMembers.talentProfileId, talentProfileId)
        )
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing talent from list:", error);
    return NextResponse.json({ error: "Failed to remove talent from list" }, { status: 500 });
  }
}

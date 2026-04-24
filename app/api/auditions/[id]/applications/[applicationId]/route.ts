import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { producerProfiles, auditions, auditionApplications, talentProfiles } from "@/lib/db/schema";
import { applicationUpdateSchema } from "@/lib/validations/auditions";
import { eq, and } from "drizzle-orm";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; applicationId: string }> }
): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, applicationId } = await params;

    const profile = await db.query.producerProfiles.findFirst({
      where: eq(producerProfiles.userId, session.user.id),
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Verify audition belongs to this organization
    const audition = await db.query.auditions.findFirst({
      where: and(eq(auditions.id, id), eq(auditions.organizationId, profile.id)),
    });

    if (!audition) {
      return NextResponse.json({ error: "Audition not found" }, { status: 404 });
    }

    // Get application with talent profile
    const result = await db
      .select({
        application: auditionApplications,
        talent: talentProfiles,
      })
      .from(auditionApplications)
      .innerJoin(talentProfiles, eq(auditionApplications.talentProfileId, talentProfiles.id))
      .where(
        and(eq(auditionApplications.id, applicationId), eq(auditionApplications.auditionId, id))
      )
      .limit(1);

    if (result.length === 0) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error("Error fetching application:", error);
    return NextResponse.json({ error: "Failed to fetch application" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; applicationId: string }> }
): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, applicationId } = await params;

    const profile = await db.query.producerProfiles.findFirst({
      where: eq(producerProfiles.userId, session.user.id),
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Verify audition belongs to this organization
    const audition = await db.query.auditions.findFirst({
      where: and(eq(auditions.id, id), eq(auditions.organizationId, profile.id)),
    });

    if (!audition) {
      return NextResponse.json({ error: "Audition not found" }, { status: 404 });
    }

    // Verify application exists
    const existingApplication = await db.query.auditionApplications.findFirst({
      where: and(
        eq(auditionApplications.id, applicationId),
        eq(auditionApplications.auditionId, id)
      ),
    });

    if (!existingApplication) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    const body: unknown = await request.json();
    const parsed = applicationUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const [updated] = await db
      .update(auditionApplications)
      .set({
        ...parsed.data,
        reviewedAt: new Date(),
      })
      .where(eq(auditionApplications.id, applicationId))
      .returning();

    return NextResponse.json({ application: updated });
  } catch (error) {
    console.error("Error updating application:", error);
    return NextResponse.json({ error: "Failed to update application" }, { status: 500 });
  }
}

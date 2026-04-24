import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { talentProfiles, auditions, auditionApplications } from "@/lib/db/schema";
import { applicationSubmitSchema } from "@/lib/validations/auditions";
import { eq, and } from "drizzle-orm";

// eslint-disable-next-line complexity
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Get talent profile
    const talentProfile = await db.query.talentProfiles.findFirst({
      where: eq(talentProfiles.userId, session.user.id),
    });

    if (!talentProfile) {
      return NextResponse.json(
        { error: "Talent profile not found. Please complete your profile first." },
        { status: 404 }
      );
    }

    // Get audition
    const audition = await db.query.auditions.findFirst({
      where: eq(auditions.id, id),
    });

    if (!audition) {
      return NextResponse.json({ error: "Audition not found" }, { status: 404 });
    }

    // Check if audition is open for applications
    if (audition.status !== "open") {
      return NextResponse.json(
        { error: "Audition is not accepting applications" },
        { status: 400 }
      );
    }

    // Check if audition is visible
    if (audition.visibility === "private") {
      return NextResponse.json({ error: "Audition not found" }, { status: 404 });
    }

    // Check if deadline has passed
    const now = new Date();
    if (audition.submissionDeadline && audition.submissionDeadline < now) {
      return NextResponse.json({ error: "Application deadline has passed" }, { status: 400 });
    }

    // Check for duplicate application
    const existingApplication = await db.query.auditionApplications.findFirst({
      where: and(
        eq(auditionApplications.auditionId, id),
        eq(auditionApplications.talentProfileId, talentProfile.id)
      ),
    });

    if (existingApplication) {
      return NextResponse.json(
        { error: "You have already applied to this audition" },
        { status: 400 }
      );
    }

    const body = (await request.json()) as Record<string, unknown>;
    const parsed = applicationSubmitSchema.safeParse({
      ...body,
      auditionId: id,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    // Validate required materials based on audition requirements
    const requiredMaterials = audition.materials;

    if (requiredMaterials) {
      const submittedMaterials = parsed.data.materials;

      if (requiredMaterials.requireHeadshot && !submittedMaterials.headshotId) {
        return NextResponse.json(
          { error: "A headshot is required for this audition" },
          { status: 400 }
        );
      }

      if (requiredMaterials.requireResume && !submittedMaterials.resumeId) {
        return NextResponse.json(
          { error: "A resume is required for this audition" },
          { status: 400 }
        );
      }

      if (requiredMaterials.requireVideo && !submittedMaterials.videoUrl) {
        return NextResponse.json(
          { error: "A video is required for this audition" },
          { status: 400 }
        );
      }

      if (requiredMaterials.requireAudio && !submittedMaterials.audioUrl) {
        return NextResponse.json(
          { error: "An audio file is required for this audition" },
          { status: 400 }
        );
      }
    }

    const [application] = await db
      .insert(auditionApplications)
      .values({
        auditionId: id,
        talentProfileId: talentProfile.id,
        materials: parsed.data.materials,
        status: "submitted",
      })
      .returning();

    if (!application) {
      return NextResponse.json({ error: "Failed to submit application" }, { status: 500 });
    }

    return NextResponse.json({ application }, { status: 201 });
  } catch (error) {
    console.error("Error submitting application:", error);
    return NextResponse.json({ error: "Failed to submit application" }, { status: 500 });
  }
}

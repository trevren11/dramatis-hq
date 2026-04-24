/* eslint-disable complexity */
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { auditions, auditionForms, auditionFormResponses, talentProfiles } from "@/lib/db/schema";
import { checkinSubmitSchema, validateResponsesAgainstForm } from "@/lib/validations/form-builder";
import { eq, and, sql } from "drizzle-orm";

/**
 * POST /api/auditions/[id]/checkin
 * Submit form responses and check in to an audition
 * Requires authentication (talent must be logged in)
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: auditionId } = await params;

    // Get the talent's profile
    const talentProfile = await db.query.talentProfiles.findFirst({
      where: eq(talentProfiles.userId, session.user.id),
    });

    if (!talentProfile) {
      return NextResponse.json({ error: "Talent profile not found" }, { status: 404 });
    }

    // Get the audition
    const audition = await db.query.auditions.findFirst({
      where: eq(auditions.id, auditionId),
    });

    if (!audition) {
      return NextResponse.json({ error: "Audition not found" }, { status: 404 });
    }

    // Check if audition is open
    if (audition.status !== "open") {
      return NextResponse.json({ error: "Audition is not open for check-in" }, { status: 400 });
    }

    // Check if already checked in
    const existingCheckin = await db.query.auditionFormResponses.findFirst({
      where: and(
        eq(auditionFormResponses.auditionId, auditionId),
        eq(auditionFormResponses.talentProfileId, talentProfile.id)
      ),
    });

    if (existingCheckin) {
      return NextResponse.json(
        {
          error: "Already checked in",
          checkin: {
            id: existingCheckin.id,
            queueNumber: existingCheckin.queueNumber,
            status: existingCheckin.status,
          },
        },
        { status: 400 }
      );
    }

    // Get the form for this audition
    const form = await db.query.auditionForms.findFirst({
      where: eq(auditionForms.auditionId, auditionId),
    });

    // Parse and validate request body
    const body: unknown = await request.json();
    const parsed = checkinSubmitSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { responses } = parsed.data;

    // Validate responses against form fields if form exists
    if (form?.fields && form.fields.length > 0) {
      const validation = validateResponsesAgainstForm(responses, form.fields);
      if (!validation.valid) {
        return NextResponse.json(
          { error: "Form validation failed", details: validation.errors },
          { status: 400 }
        );
      }
    }

    // Get next queue number atomically
    const maxQueueResult = (await db.execute(sql`
      SELECT COALESCE(MAX(queue_number), 0) + 1 as next_queue
      FROM audition_form_responses
      WHERE audition_id = ${auditionId}
    `)) as { next_queue: number }[];
    const queueNumber = maxQueueResult[0]?.next_queue ?? 1;

    // Create the check-in record
    const [checkin] = await db
      .insert(auditionFormResponses)
      .values({
        auditionId,
        talentProfileId: talentProfile.id,
        responses,
        checkedInAt: new Date(),
        queueNumber,
        status: "checked_in",
      })
      .returning();

    if (!checkin) {
      return NextResponse.json({ error: "Failed to create check-in" }, { status: 500 });
    }

    return NextResponse.json({
      checkin: {
        id: checkin.id,
        queueNumber: checkin.queueNumber,
        status: checkin.status,
        checkedInAt: checkin.checkedInAt,
      },
    });
  } catch (error) {
    console.error("Error checking in:", error);
    return NextResponse.json({ error: "Failed to check in" }, { status: 500 });
  }
}

/**
 * GET /api/auditions/[id]/checkin
 * Get the check-in form for an audition (public)
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id: auditionId } = await params;

    // Get the audition
    const audition = await db.query.auditions.findFirst({
      where: eq(auditions.id, auditionId),
    });

    if (!audition) {
      return NextResponse.json({ error: "Audition not found" }, { status: 404 });
    }

    // Get the form
    const form = await db.query.auditionForms.findFirst({
      where: eq(auditionForms.auditionId, auditionId),
    });

    // Check if user is already checked in (if authenticated)
    let existingCheckin = null;
    const session = await auth();
    if (session?.user.id) {
      const talentProfile = await db.query.talentProfiles.findFirst({
        where: eq(talentProfiles.userId, session.user.id),
      });

      if (talentProfile) {
        const checkin = await db.query.auditionFormResponses.findFirst({
          where: and(
            eq(auditionFormResponses.auditionId, auditionId),
            eq(auditionFormResponses.talentProfileId, talentProfile.id)
          ),
        });

        if (checkin) {
          existingCheckin = {
            id: checkin.id,
            queueNumber: checkin.queueNumber,
            status: checkin.status,
            checkedInAt: checkin.checkedInAt,
          };
        }
      }
    }

    return NextResponse.json({
      audition: {
        id: audition.id,
        title: audition.title,
        slug: audition.slug,
        location: audition.location,
        isVirtual: audition.isVirtual,
        status: audition.status,
      },
      fields: form?.fields ?? [],
      hasForm: !!form && Array.isArray(form.fields) && form.fields.length > 0,
      existingCheckin,
    });
  } catch (error) {
    console.error("Error fetching check-in form:", error);
    return NextResponse.json({ error: "Failed to fetch check-in form" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { producerProfiles, auditions, auditionForms } from "@/lib/db/schema";
import { formBuilderSchema } from "@/lib/validations/form-builder";
import { eq, and } from "drizzle-orm";

/**
 * GET /api/auditions/[id]/form
 * Get the form for an audition (producer only)
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Verify producer owns this audition
    const profile = await db.query.producerProfiles.findFirst({
      where: eq(producerProfiles.userId, session.user.id),
    });

    if (!profile) {
      return NextResponse.json({ error: "Producer profile not found" }, { status: 404 });
    }

    const audition = await db.query.auditions.findFirst({
      where: and(eq(auditions.id, id), eq(auditions.organizationId, profile.id)),
    });

    if (!audition) {
      return NextResponse.json({ error: "Audition not found" }, { status: 404 });
    }

    // Get or create form for this audition
    const form = await db.query.auditionForms.findFirst({
      where: eq(auditionForms.auditionId, id),
    });

    // If no form exists, return empty fields
    if (!form) {
      return NextResponse.json({
        form: {
          id: null,
          auditionId: id,
          fields: [],
          createdAt: null,
          updatedAt: null,
        },
      });
    }

    return NextResponse.json({ form });
  } catch (error) {
    console.error("Error fetching audition form:", error);
    return NextResponse.json({ error: "Failed to fetch form" }, { status: 500 });
  }
}

/**
 * PUT /api/auditions/[id]/form
 * Save/update form fields for an audition (producer only)
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Verify producer owns this audition
    const profile = await db.query.producerProfiles.findFirst({
      where: eq(producerProfiles.userId, session.user.id),
    });

    if (!profile) {
      return NextResponse.json({ error: "Producer profile not found" }, { status: 404 });
    }

    const audition = await db.query.auditions.findFirst({
      where: and(eq(auditions.id, id), eq(auditions.organizationId, profile.id)),
    });

    if (!audition) {
      return NextResponse.json({ error: "Audition not found" }, { status: 404 });
    }

    // Parse and validate request body
    const body: unknown = await request.json();
    const parsed = formBuilderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { fields } = parsed.data;

    // Check if form already exists
    const existingForm = await db.query.auditionForms.findFirst({
      where: eq(auditionForms.auditionId, id),
    });

    let form;
    if (existingForm) {
      // Update existing form
      [form] = await db
        .update(auditionForms)
        .set({
          fields,
          updatedAt: new Date(),
        })
        .where(eq(auditionForms.id, existingForm.id))
        .returning();
    } else {
      // Create new form
      [form] = await db
        .insert(auditionForms)
        .values({
          auditionId: id,
          fields,
        })
        .returning();
    }

    return NextResponse.json({ form });
  } catch (error) {
    console.error("Error saving audition form:", error);
    return NextResponse.json({ error: "Failed to save form" }, { status: 500 });
  }
}

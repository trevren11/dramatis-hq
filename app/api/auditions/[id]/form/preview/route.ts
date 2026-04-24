import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { producerProfiles, auditions, auditionForms } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

/**
 * GET /api/auditions/[id]/form/preview
 * Get form preview data (producer only)
 * Returns form fields along with audition info for preview
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

    // Get the form
    const form = await db.query.auditionForms.findFirst({
      where: eq(auditionForms.auditionId, id),
    });

    return NextResponse.json({
      preview: {
        audition: {
          id: audition.id,
          title: audition.title,
          slug: audition.slug,
          location: audition.location,
          isVirtual: audition.isVirtual,
        },
        fields: form?.fields ?? [],
        hasForm: !!form && Array.isArray(form.fields) && form.fields.length > 0,
      },
    });
  } catch (error) {
    console.error("Error fetching form preview:", error);
    return NextResponse.json({ error: "Failed to fetch preview" }, { status: 500 });
  }
}

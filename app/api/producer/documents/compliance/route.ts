import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import {
  complianceReportSchema,
  complianceDeadlineSchema,
} from "@/lib/validations/producer-documents";
import {
  getComplianceStatus,
  setComplianceDeadline,
  getUserOrganizationId,
  canUploadTaxDocuments,
} from "@/lib/services/producer-documents";
import { eq } from "drizzle-orm";

/**
 * GET /api/producer/documents/compliance
 * Get compliance status for all cast members
 */
export async function GET(request: Request): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user is a producer
    const user = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
    });

    if (user?.userType !== "producer") {
      return NextResponse.json(
        { error: "Only producers can access compliance data" },
        { status: 403 }
      );
    }

    // Get producer's organization
    const organizationId = await getUserOrganizationId(session.user.id);
    if (!organizationId) {
      return NextResponse.json(
        { error: "Producer profile not found" },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const parsed = complianceReportSchema.safeParse({
      showId: searchParams.get("showId") ?? undefined,
      documentType: searchParams.get("documentType") ?? undefined,
      year: searchParams.get("year") ?? undefined,
      status: searchParams.get("status") ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const statuses = await getComplianceStatus(organizationId, parsed.data);

    // Compute summary
    const summary = {
      total: statuses.length,
      missing: statuses.filter((s) => s.status === "missing").length,
      pending: statuses.filter((s) => s.status === "pending" || s.status === "delivered").length,
      viewed: statuses.filter((s) => s.status === "viewed").length,
      downloaded: statuses.filter((s) => s.status === "downloaded").length,
      overdue: statuses.filter((s) => s.status === "overdue").length,
    };

    return NextResponse.json({
      statuses,
      summary,
    });
  } catch (error) {
    console.error("Error getting compliance status:", error);
    return NextResponse.json({ error: "Failed to get compliance status" }, { status: 500 });
  }
}

/**
 * POST /api/producer/documents/compliance
 * Set a compliance deadline
 */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user is a producer
    const user = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
    });

    if (user?.userType !== "producer") {
      return NextResponse.json(
        { error: "Only producers can set compliance deadlines" },
        { status: 403 }
      );
    }

    // Get producer's organization
    const organizationId = await getUserOrganizationId(session.user.id);
    if (!organizationId) {
      return NextResponse.json(
        { error: "Producer profile not found" },
        { status: 400 }
      );
    }

    // Only owner/admin can set compliance deadlines
    const canManage = await canUploadTaxDocuments(session.user.id, organizationId);
    if (!canManage) {
      return NextResponse.json(
        { error: "Only organization owners and admins can set compliance deadlines" },
        { status: 403 }
      );
    }

    const body: unknown = await request.json();
    const parsed = complianceDeadlineSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const deadlineId = await setComplianceDeadline(
      organizationId,
      parsed.data,
      session.user.id
    );

    return NextResponse.json({ id: deadlineId }, { status: 201 });
  } catch (error) {
    console.error("Error setting compliance deadline:", error);
    return NextResponse.json({ error: "Failed to set compliance deadline" }, { status: 500 });
  }
}

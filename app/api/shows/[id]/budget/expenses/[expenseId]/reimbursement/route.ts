import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { shows, producerProfiles, expenses, reimbursementRequests, users } from "@/lib/db/schema";
import {
  reimbursementRequestCreateSchema,
  reimbursementRequestUpdateSchema,
} from "@/lib/validations/budget";
import { eq } from "drizzle-orm";

interface RouteParams {
  params: Promise<{ id: string; expenseId: string }>;
}

export async function GET(_request: Request, { params }: RouteParams): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: showId, expenseId } = await params;

    const show = await db.query.shows.findFirst({
      where: eq(shows.id, showId),
    });

    if (!show) {
      return NextResponse.json({ error: "Show not found" }, { status: 404 });
    }

    const producerProfile = await db.query.producerProfiles.findFirst({
      where: eq(producerProfiles.userId, session.user.id),
    });

    if (producerProfile?.id !== show.organizationId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const expense = await db.query.expenses.findFirst({
      where: eq(expenses.id, expenseId),
    });

    if (!expense) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    const reimbursement = await db.query.reimbursementRequests.findFirst({
      where: eq(reimbursementRequests.expenseId, expenseId),
    });

    if (!reimbursement) {
      return NextResponse.json({ reimbursement: null });
    }

    // Get user details
    const requestedByUser = await db.query.users.findFirst({
      where: eq(users.id, reimbursement.requestedBy),
      columns: { id: true, name: true, email: true },
    });

    let reviewedByUser = null;
    if (reimbursement.reviewedBy) {
      reviewedByUser = await db.query.users.findFirst({
        where: eq(users.id, reimbursement.reviewedBy),
        columns: { id: true, name: true, email: true },
      });
    }

    let paidByUser = null;
    if (reimbursement.paidBy) {
      paidByUser = await db.query.users.findFirst({
        where: eq(users.id, reimbursement.paidBy),
        columns: { id: true, name: true, email: true },
      });
    }

    return NextResponse.json({
      reimbursement: {
        ...reimbursement,
        requestedByUser,
        reviewedByUser,
        paidByUser,
      },
    });
  } catch (error) {
    console.error("Error fetching reimbursement:", error);
    return NextResponse.json({ error: "Failed to fetch reimbursement" }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: RouteParams): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: showId, expenseId } = await params;

    const show = await db.query.shows.findFirst({
      where: eq(shows.id, showId),
    });

    if (!show) {
      return NextResponse.json({ error: "Show not found" }, { status: 404 });
    }

    const producerProfile = await db.query.producerProfiles.findFirst({
      where: eq(producerProfiles.userId, session.user.id),
    });

    if (producerProfile?.id !== show.organizationId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const expense = await db.query.expenses.findFirst({
      where: eq(expenses.id, expenseId),
    });

    if (!expense) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    // Check if reimbursement request already exists
    const existingRequest = await db.query.reimbursementRequests.findFirst({
      where: eq(reimbursementRequests.expenseId, expenseId),
    });

    if (existingRequest) {
      return NextResponse.json(
        { error: "Reimbursement request already exists for this expense" },
        { status: 409 }
      );
    }

    const body = (await request.json()) as Record<string, unknown>;
    const parsed = reimbursementRequestCreateSchema.safeParse({ ...body, expenseId });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const [reimbursement] = await db
      .insert(reimbursementRequests)
      .values({
        expenseId,
        amountRequested: String(parsed.data.amountRequested),
        justification: parsed.data.justification,
        requestedBy: session.user.id,
      })
      .returning();

    if (!reimbursement) {
      return NextResponse.json(
        { error: "Failed to create reimbursement request" },
        { status: 500 }
      );
    }

    return NextResponse.json({ reimbursement }, { status: 201 });
  } catch (error) {
    console.error("Error creating reimbursement request:", error);
    return NextResponse.json({ error: "Failed to create reimbursement request" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: RouteParams): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: showId, expenseId } = await params;

    const show = await db.query.shows.findFirst({
      where: eq(shows.id, showId),
    });

    if (!show) {
      return NextResponse.json({ error: "Show not found" }, { status: 404 });
    }

    const producerProfile = await db.query.producerProfiles.findFirst({
      where: eq(producerProfiles.userId, session.user.id),
    });

    if (producerProfile?.id !== show.organizationId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const reimbursement = await db.query.reimbursementRequests.findFirst({
      where: eq(reimbursementRequests.expenseId, expenseId),
    });

    if (!reimbursement) {
      return NextResponse.json({ error: "Reimbursement request not found" }, { status: 404 });
    }

    // Can only update pending requests
    if (reimbursement.status !== "pending") {
      return NextResponse.json(
        { error: "Can only update pending reimbursement requests" },
        { status: 400 }
      );
    }

    const body = (await request.json()) as Record<string, unknown>;
    const parsed = reimbursementRequestUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const updateData: Partial<typeof reimbursementRequests.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (parsed.data.amountRequested !== undefined) {
      updateData.amountRequested = String(parsed.data.amountRequested);
    }
    if (parsed.data.justification !== undefined) {
      updateData.justification = parsed.data.justification;
    }

    const [updatedReimbursement] = await db
      .update(reimbursementRequests)
      .set(updateData)
      .where(eq(reimbursementRequests.id, reimbursement.id))
      .returning();

    return NextResponse.json({ reimbursement: updatedReimbursement });
  } catch (error) {
    console.error("Error updating reimbursement request:", error);
    return NextResponse.json({ error: "Failed to update reimbursement request" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: RouteParams): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: showId, expenseId } = await params;

    const show = await db.query.shows.findFirst({
      where: eq(shows.id, showId),
    });

    if (!show) {
      return NextResponse.json({ error: "Show not found" }, { status: 404 });
    }

    const producerProfile = await db.query.producerProfiles.findFirst({
      where: eq(producerProfiles.userId, session.user.id),
    });

    if (producerProfile?.id !== show.organizationId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const reimbursement = await db.query.reimbursementRequests.findFirst({
      where: eq(reimbursementRequests.expenseId, expenseId),
    });

    if (!reimbursement) {
      return NextResponse.json({ error: "Reimbursement request not found" }, { status: 404 });
    }

    // Can only delete pending requests
    if (reimbursement.status !== "pending") {
      return NextResponse.json(
        { error: "Can only delete pending reimbursement requests" },
        { status: 400 }
      );
    }

    await db.delete(reimbursementRequests).where(eq(reimbursementRequests.id, reimbursement.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting reimbursement request:", error);
    return NextResponse.json({ error: "Failed to delete reimbursement request" }, { status: 500 });
  }
}

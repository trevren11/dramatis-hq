import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  shows,
  producerProfiles,
  expenses,
  budgetLines,
  reimbursementRequests,
  users,
} from "@/lib/db/schema";
import { reimbursementReviewSchema, reimbursementPaySchema } from "@/lib/validations/budget";
import { eq } from "drizzle-orm";

interface RouteParams {
  params: Promise<{ id: string; reimbursementId: string }>;
}

export async function GET(_request: Request, { params }: RouteParams): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: showId, reimbursementId } = await params;

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
      where: eq(reimbursementRequests.id, reimbursementId),
    });

    if (!reimbursement) {
      return NextResponse.json({ error: "Reimbursement not found" }, { status: 404 });
    }

    // Get expense with budget line
    const expense = await db.query.expenses.findFirst({
      where: eq(expenses.id, reimbursement.expenseId),
    });

    if (!expense) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    let budgetLine = null;
    if (expense.budgetLineId) {
      budgetLine = await db.query.budgetLines.findFirst({
        where: eq(budgetLines.id, expense.budgetLineId),
      });
    }

    // Get user details
    const requestedByUser = await db.query.users.findFirst({
      where: eq(users.id, reimbursement.requestedBy),
      columns: { id: true, name: true, email: true },
    });

    const submitter = await db.query.users.findFirst({
      where: eq(users.id, expense.submittedBy),
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
        expense: {
          ...expense,
          budgetLine,
          submitter,
        },
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

    const { id: showId, reimbursementId } = await params;
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

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
      where: eq(reimbursementRequests.id, reimbursementId),
    });

    if (!reimbursement) {
      return NextResponse.json({ error: "Reimbursement not found" }, { status: 404 });
    }

    const body = (await request.json()) as Record<string, unknown>;

    if (action === "review") {
      // Review (approve/deny) action
      if (reimbursement.status !== "pending") {
        return NextResponse.json(
          { error: "Can only review pending reimbursement requests" },
          { status: 400 }
        );
      }

      const parsed = reimbursementReviewSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
          { status: 400 }
        );
      }

      const [updatedReimbursement] = await db
        .update(reimbursementRequests)
        .set({
          status: parsed.data.status,
          reviewedBy: session.user.id,
          reviewedAt: new Date(),
          reviewNote: parsed.data.reviewNote,
          updatedAt: new Date(),
        })
        .where(eq(reimbursementRequests.id, reimbursementId))
        .returning();

      return NextResponse.json({ reimbursement: updatedReimbursement });
    } else if (action === "pay") {
      // Mark as paid action
      if (reimbursement.status !== "approved") {
        return NextResponse.json(
          { error: "Can only mark approved reimbursements as paid" },
          { status: 400 }
        );
      }

      const parsed = reimbursementPaySchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
          { status: 400 }
        );
      }

      const [updatedReimbursement] = await db
        .update(reimbursementRequests)
        .set({
          status: "paid",
          paidAt: new Date(),
          paidBy: session.user.id,
          paymentReference: parsed.data.paymentReference,
          updatedAt: new Date(),
        })
        .where(eq(reimbursementRequests.id, reimbursementId))
        .returning();

      // Also update the expense as paid
      await db
        .update(expenses)
        .set({
          isPaid: true,
          paymentReference: parsed.data.paymentReference,
          updatedAt: new Date(),
        })
        .where(eq(expenses.id, reimbursement.expenseId));

      return NextResponse.json({ reimbursement: updatedReimbursement });
    } else {
      return NextResponse.json(
        { error: "Invalid action. Use ?action=review or ?action=pay" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error processing reimbursement action:", error);
    return NextResponse.json({ error: "Failed to process reimbursement action" }, { status: 500 });
  }
}

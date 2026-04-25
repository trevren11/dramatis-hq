import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  shows,
  producerProfiles,
  expenses,
  reimbursementRequests,
  budgetLines,
  users,
} from "@/lib/db/schema";
import { reimbursementReviewSchema, reimbursementPaySchema } from "@/lib/validations/budget";
import { eq } from "drizzle-orm";

interface RouteParams {
  params: Promise<{ id: string; requestId: string }>;
}

export async function GET(_request: Request, { params }: RouteParams): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: showId, requestId } = await params;

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
      where: eq(reimbursementRequests.id, requestId),
    });

    if (!reimbursement) {
      return NextResponse.json({ error: "Reimbursement request not found" }, { status: 404 });
    }

    const expense = await db.query.expenses.findFirst({
      where: eq(expenses.id, reimbursement.expenseId),
    });

    if (expense?.showId !== showId) {
      return NextResponse.json({ error: "Reimbursement request not found" }, { status: 404 });
    }

    let budgetLine = null;
    if (expense.budgetLineId) {
      budgetLine = await db.query.budgetLines.findFirst({
        where: eq(budgetLines.id, expense.budgetLineId),
      });
    }

    const [requester, reviewer, payer, submitter] = await Promise.all([
      db.query.users.findFirst({
        where: eq(users.id, reimbursement.requestedBy),
        columns: { id: true, name: true, email: true },
      }),
      reimbursement.reviewedBy
        ? db.query.users.findFirst({
            where: eq(users.id, reimbursement.reviewedBy),
            columns: { id: true, name: true, email: true },
          })
        : null,
      reimbursement.paidBy
        ? db.query.users.findFirst({
            where: eq(users.id, reimbursement.paidBy),
            columns: { id: true, name: true, email: true },
          })
        : null,
      db.query.users.findFirst({
        where: eq(users.id, expense.submittedBy),
        columns: { id: true, name: true, email: true },
      }),
    ]);

    return NextResponse.json({
      reimbursement: {
        ...reimbursement,
        requester,
        reviewer,
        payer,
      },
      expense: {
        ...expense,
        budgetLine,
        submitter,
      },
    });
  } catch (error) {
    console.error("Error fetching reimbursement:", error);
    return NextResponse.json({ error: "Failed to fetch reimbursement" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: RouteParams): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: showId, requestId } = await params;

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
      where: eq(reimbursementRequests.id, requestId),
    });

    if (!reimbursement) {
      return NextResponse.json({ error: "Reimbursement request not found" }, { status: 404 });
    }

    const expense = await db.query.expenses.findFirst({
      where: eq(expenses.id, reimbursement.expenseId),
    });

    if (expense?.showId !== showId) {
      return NextResponse.json({ error: "Reimbursement request not found" }, { status: 404 });
    }

    if (reimbursement.status !== "pending") {
      return NextResponse.json(
        { error: "Can only review pending reimbursement requests" },
        { status: 400 }
      );
    }

    const body = (await request.json()) as Record<string, unknown>;
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
        reviewNote: parsed.data.reviewNote,
        reviewedBy: session.user.id,
        reviewedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(reimbursementRequests.id, requestId))
      .returning();

    return NextResponse.json({ reimbursement: updatedReimbursement });
  } catch (error) {
    console.error("Error reviewing reimbursement:", error);
    return NextResponse.json({ error: "Failed to review reimbursement" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: RouteParams): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: showId, requestId } = await params;

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
      where: eq(reimbursementRequests.id, requestId),
    });

    if (!reimbursement) {
      return NextResponse.json({ error: "Reimbursement request not found" }, { status: 404 });
    }

    const expense = await db.query.expenses.findFirst({
      where: eq(expenses.id, reimbursement.expenseId),
    });

    if (expense?.showId !== showId) {
      return NextResponse.json({ error: "Reimbursement request not found" }, { status: 404 });
    }

    if (reimbursement.status !== "approved") {
      return NextResponse.json(
        { error: "Can only mark approved reimbursement requests as paid" },
        { status: 400 }
      );
    }

    const body = (await request.json()) as Record<string, unknown>;
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
        paymentReference: parsed.data.paymentReference,
        paidBy: session.user.id,
        paidAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(reimbursementRequests.id, requestId))
      .returning();

    await db
      .update(expenses)
      .set({
        isPaid: true,
        updatedAt: new Date(),
      })
      .where(eq(expenses.id, reimbursement.expenseId));

    return NextResponse.json({ reimbursement: updatedReimbursement });
  } catch (error) {
    console.error("Error marking reimbursement as paid:", error);
    return NextResponse.json({ error: "Failed to mark reimbursement as paid" }, { status: 500 });
  }
}

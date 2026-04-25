import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  shows,
  producerProfiles,
  budgetLines,
  expenses,
  reimbursementRequests,
  users,
} from "@/lib/db/schema";
import { expenseUpdateSchema } from "@/lib/validations/budget";
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

    // Get budget line if exists
    let budgetLine = null;
    if (expense.budgetLineId) {
      budgetLine = await db.query.budgetLines.findFirst({
        where: eq(budgetLines.id, expense.budgetLineId),
      });
    }

    // Get submitter info
    const submitter = await db.query.users.findFirst({
      where: eq(users.id, expense.submittedBy),
      columns: {
        id: true,
        name: true,
        email: true,
      },
    });

    // Get reimbursement request if exists
    const reimbursement = await db.query.reimbursementRequests.findFirst({
      where: eq(reimbursementRequests.expenseId, expenseId),
    });

    return NextResponse.json({
      expense: {
        ...expense,
        budgetLine,
        submitter,
        reimbursement,
      },
    });
  } catch (error) {
    console.error("Error fetching expense:", error);
    return NextResponse.json({ error: "Failed to fetch expense" }, { status: 500 });
  }
}

// eslint-disable-next-line complexity
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

    const expense = await db.query.expenses.findFirst({
      where: eq(expenses.id, expenseId),
    });

    if (!expense) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    const body = (await request.json()) as Record<string, unknown>;
    const parsed = expenseUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    // Verify budget line exists if being updated
    if (parsed.data.budgetLineId) {
      const budgetLine = await db.query.budgetLines.findFirst({
        where: eq(budgetLines.id, parsed.data.budgetLineId),
      });
      if (!budgetLine) {
        return NextResponse.json({ error: "Budget line not found" }, { status: 404 });
      }
    }

    const updateData: Partial<typeof expenses.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (parsed.data.budgetLineId !== undefined) updateData.budgetLineId = parsed.data.budgetLineId;
    if (parsed.data.amount !== undefined) updateData.amount = String(parsed.data.amount);
    if (parsed.data.date !== undefined) updateData.date = parsed.data.date;
    if (parsed.data.vendor !== undefined) updateData.vendor = parsed.data.vendor;
    if (parsed.data.description !== undefined) updateData.description = parsed.data.description;
    if (parsed.data.isPaid !== undefined) updateData.isPaid = parsed.data.isPaid;
    if (parsed.data.paymentMethod !== undefined)
      updateData.paymentMethod = parsed.data.paymentMethod;
    if (parsed.data.paymentReference !== undefined)
      updateData.paymentReference = parsed.data.paymentReference;

    const [updatedExpense] = await db
      .update(expenses)
      .set(updateData)
      .where(eq(expenses.id, expenseId))
      .returning();

    return NextResponse.json({ expense: updatedExpense });
  } catch (error) {
    console.error("Error updating expense:", error);
    return NextResponse.json({ error: "Failed to update expense" }, { status: 500 });
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

    const expense = await db.query.expenses.findFirst({
      where: eq(expenses.id, expenseId),
    });

    if (!expense) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    // Check if there's an approved/paid reimbursement
    const reimbursement = await db.query.reimbursementRequests.findFirst({
      where: eq(reimbursementRequests.expenseId, expenseId),
    });

    if (reimbursement && (reimbursement.status === "approved" || reimbursement.status === "paid")) {
      return NextResponse.json(
        { error: "Cannot delete expense with approved or paid reimbursement" },
        { status: 400 }
      );
    }

    // Delete reimbursement request if exists
    if (reimbursement) {
      await db.delete(reimbursementRequests).where(eq(reimbursementRequests.expenseId, expenseId));
    }

    await db.delete(expenses).where(eq(expenses.id, expenseId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting expense:", error);
    return NextResponse.json({ error: "Failed to delete expense" }, { status: 500 });
  }
}

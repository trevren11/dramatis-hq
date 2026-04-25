import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { shows, producerProfiles, budgets, budgetLines, expenses } from "@/lib/db/schema";
import { budgetUpdateSchema, initializeBudgetSchema } from "@/lib/validations/budget";
import { eq, sql } from "drizzle-orm";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteParams): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: showId } = await params;

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

    const budget = await db.query.budgets.findFirst({
      where: eq(budgets.showId, showId),
    });

    if (!budget) {
      return NextResponse.json({ budget: null, lines: [], summary: null });
    }

    const lines = await db.query.budgetLines.findMany({
      where: eq(budgetLines.budgetId, budget.id),
      orderBy: (budgetLines, { asc }) => [asc(budgetLines.sortOrder)],
    });

    // Calculate actual spending per line
    const expensesByLine = await db
      .select({
        budgetLineId: expenses.budgetLineId,
        totalSpent: sql<string>`COALESCE(SUM(${expenses.amount}), 0)`,
        expenseCount: sql<number>`COUNT(*)::int`,
      })
      .from(expenses)
      .where(eq(expenses.showId, showId))
      .groupBy(expenses.budgetLineId);

    const expenseMap = new Map(
      expensesByLine.map((e) => [e.budgetLineId, { spent: e.totalSpent, count: e.expenseCount }])
    );

    const linesWithSpending = lines.map((line) => ({
      ...line,
      actualSpent: expenseMap.get(line.id)?.spent ?? "0",
      expenseCount: expenseMap.get(line.id)?.count ?? 0,
      remaining: String(Number(line.budgetedAmount) - Number(expenseMap.get(line.id)?.spent ?? 0)),
    }));

    // Calculate overall summary
    const totalBudgeted = lines.reduce((sum, line) => sum + Number(line.budgetedAmount), 0);
    const totalSpent = expensesByLine.reduce((sum, e) => sum + Number(e.totalSpent), 0);

    const summary = {
      totalBudgeted: String(totalBudgeted),
      totalSpent: String(totalSpent),
      remaining: String(totalBudgeted - totalSpent),
      percentUsed: totalBudgeted > 0 ? Math.round((totalSpent / totalBudgeted) * 100) : 0,
    };

    return NextResponse.json({ budget, lines: linesWithSpending, summary });
  } catch (error) {
    console.error("Error fetching budget:", error);
    return NextResponse.json({ error: "Failed to fetch budget" }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: RouteParams): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: showId } = await params;

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

    // Check if budget already exists
    const existingBudget = await db.query.budgets.findFirst({
      where: eq(budgets.showId, showId),
    });

    if (existingBudget) {
      return NextResponse.json({ error: "Budget already exists for this show" }, { status: 409 });
    }

    const body = (await request.json()) as Record<string, unknown>;
    const parsed = initializeBudgetSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    // Create budget
    const [budget] = await db
      .insert(budgets)
      .values({
        showId,
        name: parsed.data.name,
        totalAmount: String(parsed.data.totalAmount),
        createdBy: session.user.id,
      })
      .returning();

    if (!budget) {
      return NextResponse.json({ error: "Failed to create budget" }, { status: 500 });
    }

    // Create default budget lines if categories provided
    const categories = parsed.data.categories ?? [
      "scenic",
      "costumes",
      "props",
      "lighting",
      "sound",
      "marketing",
      "venue",
      "royalties",
      "miscellaneous",
    ];

    const lineValues = categories.map((category, index) => ({
      budgetId: budget.id,
      category,
      budgetedAmount: "0",
      sortOrder: index,
      createdBy: session.user.id,
    }));

    const lines = await db.insert(budgetLines).values(lineValues).returning();

    return NextResponse.json({ budget, lines }, { status: 201 });
  } catch (error) {
    console.error("Error creating budget:", error);
    return NextResponse.json({ error: "Failed to create budget" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: RouteParams): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: showId } = await params;

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

    const budget = await db.query.budgets.findFirst({
      where: eq(budgets.showId, showId),
    });

    if (!budget) {
      return NextResponse.json({ error: "Budget not found" }, { status: 404 });
    }

    const body = (await request.json()) as Record<string, unknown>;
    const parsed = budgetUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const updateData: Partial<typeof budgets.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (parsed.data.name !== undefined) updateData.name = parsed.data.name;
    if (parsed.data.description !== undefined) updateData.description = parsed.data.description;
    if (parsed.data.totalAmount !== undefined)
      updateData.totalAmount = String(parsed.data.totalAmount);
    if (parsed.data.fiscalYearStart !== undefined)
      updateData.fiscalYearStart = parsed.data.fiscalYearStart;
    if (parsed.data.fiscalYearEnd !== undefined)
      updateData.fiscalYearEnd = parsed.data.fiscalYearEnd;

    const [updatedBudget] = await db
      .update(budgets)
      .set(updateData)
      .where(eq(budgets.id, budget.id))
      .returning();

    return NextResponse.json({ budget: updatedBudget });
  } catch (error) {
    console.error("Error updating budget:", error);
    return NextResponse.json({ error: "Failed to update budget" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: RouteParams): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: showId } = await params;

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

    const budget = await db.query.budgets.findFirst({
      where: eq(budgets.showId, showId),
    });

    if (!budget) {
      return NextResponse.json({ error: "Budget not found" }, { status: 404 });
    }

    await db.delete(budgets).where(eq(budgets.id, budget.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting budget:", error);
    return NextResponse.json({ error: "Failed to delete budget" }, { status: 500 });
  }
}

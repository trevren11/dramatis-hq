import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { shows, producerProfiles, budgets, budgetLines, expenses } from "@/lib/db/schema";
import {
  budgetLineCreateSchema,
  budgetLineBulkCreateSchema,
  budgetLineReorderSchema,
} from "@/lib/validations/budget";
import { eq, sql, asc } from "drizzle-orm";

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
      return NextResponse.json({ error: "Budget not found" }, { status: 404 });
    }

    const lines = await db.query.budgetLines.findMany({
      where: eq(budgetLines.budgetId, budget.id),
      orderBy: [asc(budgetLines.sortOrder)],
    });

    // Get spending per line
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

    return NextResponse.json({ lines: linesWithSpending });
  } catch (error) {
    console.error("Error fetching budget lines:", error);
    return NextResponse.json({ error: "Failed to fetch budget lines" }, { status: 500 });
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

    const budget = await db.query.budgets.findFirst({
      where: eq(budgets.showId, showId),
    });

    if (!budget) {
      return NextResponse.json(
        { error: "Budget not found. Create a budget first." },
        { status: 404 }
      );
    }

    const body = (await request.json()) as Record<string, unknown>;
    const parsed = budgetLineCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const existingLines = await db.query.budgetLines.findMany({
      where: eq(budgetLines.budgetId, budget.id),
    });

    const [line] = await db
      .insert(budgetLines)
      .values({
        budgetId: budget.id,
        category: parsed.data.category,
        customCategoryName: parsed.data.customCategoryName,
        description: parsed.data.description,
        budgetedAmount: String(parsed.data.budgetedAmount),
        sortOrder: parsed.data.sortOrder !== 0 ? parsed.data.sortOrder : existingLines.length,
        isActive: parsed.data.isActive,
        createdBy: session.user.id,
      })
      .returning();

    if (!line) {
      return NextResponse.json({ error: "Failed to create budget line" }, { status: 500 });
    }

    return NextResponse.json({ line }, { status: 201 });
  } catch (error) {
    console.error("Error creating budget line:", error);
    return NextResponse.json({ error: "Failed to create budget line" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: RouteParams): Promise<NextResponse> {
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
    const parsed = budgetLineBulkCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const existingLines = await db.query.budgetLines.findMany({
      where: eq(budgetLines.budgetId, budget.id),
    });

    const lineValues = parsed.data.lines.map((line, index) => ({
      budgetId: budget.id,
      category: line.category,
      customCategoryName: line.customCategoryName,
      description: line.description,
      budgetedAmount: String(line.budgetedAmount),
      sortOrder: line.sortOrder !== 0 ? line.sortOrder : existingLines.length + index,
      isActive: line.isActive,
      createdBy: session.user.id,
    }));

    const lines = await db.insert(budgetLines).values(lineValues).returning();

    return NextResponse.json({ lines }, { status: 201 });
  } catch (error) {
    console.error("Error bulk creating budget lines:", error);
    return NextResponse.json({ error: "Failed to create budget lines" }, { status: 500 });
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
    const parsed = budgetLineReorderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    await Promise.all(
      parsed.data.lines.map(async ({ id, sortOrder }) => {
        await db
          .update(budgetLines)
          .set({ sortOrder, updatedAt: new Date() })
          .where(eq(budgetLines.id, id));
      })
    );

    const lines = await db.query.budgetLines.findMany({
      where: eq(budgetLines.budgetId, budget.id),
      orderBy: [asc(budgetLines.sortOrder)],
    });

    return NextResponse.json({ lines });
  } catch (error) {
    console.error("Error reordering budget lines:", error);
    return NextResponse.json({ error: "Failed to reorder budget lines" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import type { SQL } from "drizzle-orm";
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
import { expenseCreateSchema, expenseQuerySchema } from "@/lib/validations/budget";
import { eq, and, gte, lte, desc, sql } from "drizzle-orm";

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface ParsedExpenseQuery {
  budgetLineId?: string;
  startDate?: Date;
  endDate?: Date;
  isPaid?: boolean;
  submittedBy?: string;
  category?: string;
  limit: number;
  offset: number;
}

function buildExpenseConditions(showId: string, data: ParsedExpenseQuery): SQL[] {
  const conditions: SQL[] = [eq(expenses.showId, showId)];
  if (data.budgetLineId) conditions.push(eq(expenses.budgetLineId, data.budgetLineId));
  if (data.startDate) conditions.push(gte(expenses.date, data.startDate));
  if (data.endDate) conditions.push(lte(expenses.date, data.endDate));
  if (data.isPaid !== undefined) conditions.push(eq(expenses.isPaid, data.isPaid));
  if (data.submittedBy) conditions.push(eq(expenses.submittedBy, data.submittedBy));
  return conditions;
}

async function enrichExpensesWithRelations(
  expenseResults: {
    expense: typeof expenses.$inferSelect;
    budgetLine: typeof budgetLines.$inferSelect | null;
  }[]
): Promise<
  {
    expense: typeof expenses.$inferSelect;
    budgetLine: typeof budgetLines.$inferSelect | null;
    submitter: { id: string; name: string | null; email: string } | undefined;
    reimbursement: typeof reimbursementRequests.$inferSelect | null;
  }[]
> {
  const submitterIds = [...new Set(expenseResults.map((r) => r.expense.submittedBy))];
  const submitters = await db.query.users.findMany({
    where: sql`${users.id} IN (${sql.join(
      submitterIds.map((id) => sql`${id}`),
      sql`, `
    )})`,
    columns: { id: true, name: true, email: true },
  });
  const submitterMap = new Map(submitters.map((u) => [u.id, u]));

  const expenseIds = expenseResults.map((r) => r.expense.id);
  const reimbursements =
    expenseIds.length > 0
      ? await db.query.reimbursementRequests.findMany({
          where: sql`${reimbursementRequests.expenseId} IN (${sql.join(
            expenseIds.map((id) => sql`${id}`),
            sql`, `
          )})`,
        })
      : [];
  const reimbursementMap = new Map(reimbursements.map((r) => [r.expenseId, r]));

  return expenseResults.map((r) => ({
    ...r,
    submitter: submitterMap.get(r.expense.submittedBy),
    reimbursement: reimbursementMap.get(r.expense.id) ?? null,
  }));
}

// eslint-disable-next-line complexity
export async function GET(request: Request, { params }: RouteParams): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: showId } = await params;
    const { searchParams } = new URL(request.url);

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

    const queryParams = {
      budgetLineId: searchParams.get("budgetLineId") ?? undefined,
      category: searchParams.get("category") ?? undefined,
      startDate: searchParams.get("startDate") ?? undefined,
      endDate: searchParams.get("endDate") ?? undefined,
      isPaid: searchParams.get("isPaid") ?? undefined,
      submittedBy: searchParams.get("submittedBy") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
      offset: searchParams.get("offset") ?? undefined,
    };

    const parsed = expenseQuerySchema.safeParse(queryParams);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const conditions = buildExpenseConditions(showId, parsed.data);
    const whereClause = parsed.data.category
      ? and(...conditions, eq(budgetLines.category, parsed.data.category))
      : and(...conditions);

    const expenseResults = await db
      .select({ expense: expenses, budgetLine: budgetLines })
      .from(expenses)
      .leftJoin(budgetLines, eq(expenses.budgetLineId, budgetLines.id))
      .where(whereClause)
      .orderBy(desc(expenses.date))
      .limit(parsed.data.limit)
      .offset(parsed.data.offset);

    const enrichedExpenses = await enrichExpensesWithRelations(expenseResults);
    const expensesWithDetails = enrichedExpenses.map((r) => ({
      ...r.expense,
      budgetLine: r.budgetLine,
      submitter: r.submitter,
      reimbursement: r.reimbursement,
    }));

    // Get total count for pagination
    const countResult = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(expenses)
      .where(and(...conditions));

    return NextResponse.json({
      expenses: expensesWithDetails,
      total: countResult[0]?.count ?? 0,
      limit: parsed.data.limit,
      offset: parsed.data.offset,
    });
  } catch (error) {
    console.error("Error fetching expenses:", error);
    return NextResponse.json({ error: "Failed to fetch expenses" }, { status: 500 });
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

    const body = (await request.json()) as Record<string, unknown>;
    const parsed = expenseCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    // Verify budget line exists if provided
    if (parsed.data.budgetLineId) {
      const budgetLine = await db.query.budgetLines.findFirst({
        where: eq(budgetLines.id, parsed.data.budgetLineId),
      });
      if (!budgetLine) {
        return NextResponse.json({ error: "Budget line not found" }, { status: 404 });
      }
    }

    const [expense] = await db
      .insert(expenses)
      .values({
        showId,
        budgetLineId: parsed.data.budgetLineId,
        amount: String(parsed.data.amount),
        date: parsed.data.date,
        vendor: parsed.data.vendor,
        description: parsed.data.description,
        isPaid: parsed.data.isPaid,
        paymentMethod: parsed.data.paymentMethod,
        paymentReference: parsed.data.paymentReference,
        submittedBy: session.user.id,
      })
      .returning();

    if (!expense) {
      return NextResponse.json({ error: "Failed to create expense" }, { status: 500 });
    }

    return NextResponse.json({ expense }, { status: 201 });
  } catch (error) {
    console.error("Error creating expense:", error);
    return NextResponse.json({ error: "Failed to create expense" }, { status: 500 });
  }
}

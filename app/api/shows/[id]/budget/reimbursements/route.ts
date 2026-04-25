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
import {
  reimbursementRequestCreateSchema,
  reimbursementQuerySchema,
} from "@/lib/validations/budget";
import { eq, and, gte, lte, desc, sql } from "drizzle-orm";

interface RouteParams {
  params: Promise<{ id: string }>;
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
      status: searchParams.get("status") ?? undefined,
      requestedBy: searchParams.get("requestedBy") ?? undefined,
      startDate: searchParams.get("startDate") ?? undefined,
      endDate: searchParams.get("endDate") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
      offset: searchParams.get("offset") ?? undefined,
    };

    const parsed = reimbursementQuerySchema.safeParse(queryParams);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    // Build query conditions
    const conditions = [eq(expenses.showId, showId)];

    if (parsed.data.requestedBy) {
      conditions.push(eq(reimbursementRequests.requestedBy, parsed.data.requestedBy));
    }
    if (parsed.data.startDate) {
      conditions.push(gte(reimbursementRequests.requestedAt, parsed.data.startDate));
    }
    if (parsed.data.endDate) {
      conditions.push(lte(reimbursementRequests.requestedAt, parsed.data.endDate));
    }

    let results;
    if (parsed.data.status) {
      results = await db
        .select({
          reimbursement: reimbursementRequests,
          expense: expenses,
          budgetLine: budgetLines,
        })
        .from(reimbursementRequests)
        .innerJoin(expenses, eq(reimbursementRequests.expenseId, expenses.id))
        .leftJoin(budgetLines, eq(expenses.budgetLineId, budgetLines.id))
        .where(and(...conditions, eq(reimbursementRequests.status, parsed.data.status)))
        .orderBy(desc(reimbursementRequests.requestedAt))
        .limit(parsed.data.limit)
        .offset(parsed.data.offset);
    } else {
      results = await db
        .select({
          reimbursement: reimbursementRequests,
          expense: expenses,
          budgetLine: budgetLines,
        })
        .from(reimbursementRequests)
        .innerJoin(expenses, eq(reimbursementRequests.expenseId, expenses.id))
        .leftJoin(budgetLines, eq(expenses.budgetLineId, budgetLines.id))
        .where(and(...conditions))
        .orderBy(desc(reimbursementRequests.requestedAt))
        .limit(parsed.data.limit)
        .offset(parsed.data.offset);
    }

    // Get user info for requesters and reviewers
    const userIds = new Set<string>();
    results.forEach((r) => {
      userIds.add(r.reimbursement.requestedBy);
      if (r.reimbursement.reviewedBy) userIds.add(r.reimbursement.reviewedBy);
    });

    const userList = await db.query.users.findMany({
      where: sql`${users.id} IN (${sql.join(
        [...userIds].map((id) => sql`${id}`),
        sql`, `
      )})`,
      columns: { id: true, name: true, email: true },
    });
    const userMap = new Map(userList.map((u) => [u.id, u]));

    const reimbursementsWithDetails = results.map((r) => ({
      ...r.reimbursement,
      expense: r.expense,
      budgetLine: r.budgetLine,
      requester: userMap.get(r.reimbursement.requestedBy),
      reviewer: r.reimbursement.reviewedBy ? userMap.get(r.reimbursement.reviewedBy) : null,
    }));

    // Get counts by status
    const statusCounts = await db
      .select({
        status: reimbursementRequests.status,
        count: sql<number>`COUNT(*)::int`,
      })
      .from(reimbursementRequests)
      .innerJoin(expenses, eq(reimbursementRequests.expenseId, expenses.id))
      .where(eq(expenses.showId, showId))
      .groupBy(reimbursementRequests.status);

    return NextResponse.json({
      reimbursements: reimbursementsWithDetails,
      statusCounts: Object.fromEntries(statusCounts.map((s) => [s.status, s.count])),
      limit: parsed.data.limit,
      offset: parsed.data.offset,
    });
  } catch (error) {
    console.error("Error fetching reimbursements:", error);
    return NextResponse.json({ error: "Failed to fetch reimbursements" }, { status: 500 });
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
    const parsed = reimbursementRequestCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    // Verify expense exists and belongs to this show
    const expense = await db.query.expenses.findFirst({
      where: and(eq(expenses.id, parsed.data.expenseId), eq(expenses.showId, showId)),
    });

    if (!expense) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    // Check if reimbursement already exists
    const existingReimbursement = await db.query.reimbursementRequests.findFirst({
      where: eq(reimbursementRequests.expenseId, parsed.data.expenseId),
    });

    if (existingReimbursement) {
      return NextResponse.json(
        { error: "Reimbursement request already exists for this expense" },
        { status: 409 }
      );
    }

    const [reimbursement] = await db
      .insert(reimbursementRequests)
      .values({
        expenseId: parsed.data.expenseId,
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
    console.error("Error creating reimbursement:", error);
    return NextResponse.json({ error: "Failed to create reimbursement request" }, { status: 500 });
  }
}

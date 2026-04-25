import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  shows,
  producerProfiles,
  budgets,
  budgetLines,
  expenses,
  reimbursementRequests,
  users,
  BUDGET_CATEGORY_OPTIONS,
} from "@/lib/db/schema";
import { budgetReportQuerySchema, exportFormatSchema } from "@/lib/validations/budget";
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
      startDate: searchParams.get("startDate") ?? undefined,
      endDate: searchParams.get("endDate") ?? undefined,
      category: searchParams.get("category") ?? undefined,
      groupBy: searchParams.get("groupBy") ?? undefined,
    };

    const parsed = budgetReportQuerySchema.safeParse(queryParams);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    // Get budget
    const budget = await db.query.budgets.findFirst({
      where: eq(budgets.showId, showId),
    });

    // Get budget lines with spending
    const lines = budget
      ? await db.query.budgetLines.findMany({
          where: eq(budgetLines.budgetId, budget.id),
          orderBy: (budgetLines, { asc }) => [asc(budgetLines.sortOrder)],
        })
      : [];

    // Build expense conditions
    const expenseConditions = [eq(expenses.showId, showId)];
    if (parsed.data.startDate) {
      expenseConditions.push(gte(expenses.date, parsed.data.startDate));
    }
    if (parsed.data.endDate) {
      expenseConditions.push(lte(expenses.date, parsed.data.endDate));
    }

    // Get all expenses
    const allExpenses = await db
      .select({
        expense: expenses,
        budgetLine: budgetLines,
      })
      .from(expenses)
      .leftJoin(budgetLines, eq(expenses.budgetLineId, budgetLines.id))
      .where(and(...expenseConditions))
      .orderBy(desc(expenses.date));

    // Filter by category if specified
    const filteredExpenses = parsed.data.category
      ? allExpenses.filter((e) => e.budgetLine?.category === parsed.data.category)
      : allExpenses;

    // Calculate summary by category
    const categoryMap = new Map<string, { budgeted: number; spent: number; count: number }>();

    lines.forEach((line) => {
      const existing = categoryMap.get(line.category) ?? { budgeted: 0, spent: 0, count: 0 };
      categoryMap.set(line.category, {
        ...existing,
        budgeted: existing.budgeted + Number(line.budgetedAmount),
      });
    });

    filteredExpenses.forEach((e) => {
      const category = e.budgetLine?.category ?? "miscellaneous";
      const existing = categoryMap.get(category) ?? { budgeted: 0, spent: 0, count: 0 };
      categoryMap.set(category, {
        ...existing,
        spent: existing.spent + Number(e.expense.amount),
        count: existing.count + 1,
      });
    });

    const byCategory = [...categoryMap.entries()].map(([category, data]) => {
      const config = BUDGET_CATEGORY_OPTIONS.find((c) => c.value === category);
      return {
        category,
        label: config?.label ?? category,
        color: config?.color ?? "#6b7280",
        budgeted: data.budgeted,
        spent: data.spent,
        remaining: data.budgeted - data.spent,
        percentUsed: data.budgeted > 0 ? Math.round((data.spent / data.budgeted) * 100) : 0,
        expenseCount: data.count,
      };
    });

    // Calculate summary by date (monthly)
    const monthlyMap = new Map<string, { spent: number; count: number }>();
    filteredExpenses.forEach((e) => {
      const monthKey = e.expense.date.toISOString().slice(0, 7); // YYYY-MM
      const existing = monthlyMap.get(monthKey) ?? { spent: 0, count: 0 };
      monthlyMap.set(monthKey, {
        spent: existing.spent + Number(e.expense.amount),
        count: existing.count + 1,
      });
    });

    const byMonth = [...monthlyMap.entries()]
      .map(([month, data]) => ({
        month,
        spent: data.spent,
        expenseCount: data.count,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // Calculate summary by vendor
    const vendorMap = new Map<string, { spent: number; count: number }>();
    filteredExpenses.forEach((e) => {
      const vendor = e.expense.vendor ?? "Unknown";
      const existing = vendorMap.get(vendor) ?? { spent: 0, count: 0 };
      vendorMap.set(vendor, {
        spent: existing.spent + Number(e.expense.amount),
        count: existing.count + 1,
      });
    });

    const byVendor = [...vendorMap.entries()]
      .map(([vendor, data]) => ({
        vendor,
        spent: data.spent,
        expenseCount: data.count,
      }))
      .sort((a, b) => b.spent - a.spent)
      .slice(0, 20); // Top 20 vendors

    // Overall totals
    const totalBudgeted = lines.reduce((sum, line) => sum + Number(line.budgetedAmount), 0);
    const totalSpent = filteredExpenses.reduce((sum, e) => sum + Number(e.expense.amount), 0);

    // Reimbursement summary
    const reimbursementCounts = await db
      .select({
        status: reimbursementRequests.status,
        count: sql<number>`COUNT(*)::int`,
        total: sql<string>`COALESCE(SUM(${reimbursementRequests.amountRequested}), 0)`,
      })
      .from(reimbursementRequests)
      .innerJoin(expenses, eq(reimbursementRequests.expenseId, expenses.id))
      .where(eq(expenses.showId, showId))
      .groupBy(reimbursementRequests.status);

    return NextResponse.json({
      summary: {
        totalBudgeted,
        totalSpent,
        remaining: totalBudgeted - totalSpent,
        percentUsed: totalBudgeted > 0 ? Math.round((totalSpent / totalBudgeted) * 100) : 0,
        expenseCount: filteredExpenses.length,
      },
      byCategory,
      byMonth,
      byVendor,
      reimbursements: Object.fromEntries(
        reimbursementCounts.map((r) => [r.status, { count: r.count, total: Number(r.total) }])
      ),
      dateRange: {
        start: parsed.data.startDate?.toISOString() ?? null,
        end: parsed.data.endDate?.toISOString() ?? null,
      },
    });
  } catch (error) {
    console.error("Error generating budget report:", error);
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
}

// eslint-disable-next-line complexity
export async function POST(request: Request, { params }: RouteParams): Promise<NextResponse> {
  // Export to CSV or PDF
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

    const body = (await request.json()) as Record<string, unknown>;
    const formatParsed = exportFormatSchema.safeParse(body);

    if (!formatParsed.success) {
      return NextResponse.json(
        { error: "Invalid format", details: formatParsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const queryParams = {
      startDate: searchParams.get("startDate") ?? undefined,
      endDate: searchParams.get("endDate") ?? undefined,
      category: searchParams.get("category") ?? undefined,
    };

    const parsed = budgetReportQuerySchema.safeParse(queryParams);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    // Build expense conditions
    const expenseConditions = [eq(expenses.showId, showId)];
    if (parsed.data.startDate) {
      expenseConditions.push(gte(expenses.date, parsed.data.startDate));
    }
    if (parsed.data.endDate) {
      expenseConditions.push(lte(expenses.date, parsed.data.endDate));
    }

    // Get all expenses with details
    const allExpenses = await db
      .select({
        expense: expenses,
        budgetLine: budgetLines,
      })
      .from(expenses)
      .leftJoin(budgetLines, eq(expenses.budgetLineId, budgetLines.id))
      .where(and(...expenseConditions))
      .orderBy(desc(expenses.date));

    // Filter by category if specified
    const filteredExpenses = parsed.data.category
      ? allExpenses.filter((e) => e.budgetLine?.category === parsed.data.category)
      : allExpenses;

    // Get submitter info
    const submitterIds = [...new Set(filteredExpenses.map((e) => e.expense.submittedBy))];
    const submitters =
      submitterIds.length > 0
        ? await db.query.users.findMany({
            where: sql`${users.id} IN (${sql.join(
              submitterIds.map((id) => sql`${id}`),
              sql`, `
            )})`,
            columns: { id: true, name: true, email: true },
          })
        : [];
    const submitterMap = new Map(submitters.map((u) => [u.id, u]));

    if (formatParsed.data.format === "csv") {
      // Generate CSV
      const headers = [
        "Date",
        "Amount",
        "Category",
        "Vendor",
        "Description",
        "Submitted By",
        "Paid",
      ];
      const rows = filteredExpenses.map((e) => {
        const submitter = submitterMap.get(e.expense.submittedBy);
        const categoryConfig = BUDGET_CATEGORY_OPTIONS.find(
          (c) => c.value === e.budgetLine?.category
        );
        return [
          e.expense.date.toISOString().split("T")[0],
          e.expense.amount,
          categoryConfig?.label ?? e.budgetLine?.category ?? "Uncategorized",
          e.expense.vendor ?? "",
          e.expense.description?.replace(/"/g, '""') ?? "",
          submitter?.name ?? submitter?.email ?? "",
          e.expense.isPaid ? "Yes" : "No",
        ];
      });

      const csv = [
        headers.join(","),
        ...rows.map((row) => row.map((cell) => `"${cell ?? ""}"`).join(",")),
      ].join("\n");

      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="${show.title}-expenses-${new Date().toISOString().split("T")[0] ?? ""}.csv"`,
        },
      });
    } else {
      // Generate PDF (basic HTML that can be printed to PDF)
      const totalSpent = filteredExpenses.reduce((sum, e) => sum + Number(e.expense.amount), 0);

      const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Expense Report - ${show.title}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; }
    h1 { color: #333; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f4f4f4; }
    .summary { background-color: #f9f9f9; padding: 15px; margin-bottom: 20px; }
    .total { font-weight: bold; font-size: 1.2em; }
  </style>
</head>
<body>
  <h1>Expense Report - ${show.title}</h1>
  <div class="summary">
    <p>Generated: ${new Date().toLocaleDateString()}</p>
    ${parsed.data.startDate ? `<p>From: ${parsed.data.startDate.toLocaleDateString()}</p>` : ""}
    ${parsed.data.endDate ? `<p>To: ${parsed.data.endDate.toLocaleDateString()}</p>` : ""}
    <p class="total">Total: $${totalSpent.toFixed(2)}</p>
  </div>
  <table>
    <thead>
      <tr>
        <th>Date</th>
        <th>Amount</th>
        <th>Category</th>
        <th>Vendor</th>
        <th>Description</th>
        <th>Submitted By</th>
      </tr>
    </thead>
    <tbody>
      ${filteredExpenses
        .map((e) => {
          const submitter = submitterMap.get(e.expense.submittedBy);
          const categoryConfig = BUDGET_CATEGORY_OPTIONS.find(
            (c) => c.value === e.budgetLine?.category
          );
          return `
        <tr>
          <td>${e.expense.date.toLocaleDateString()}</td>
          <td>$${Number(e.expense.amount).toFixed(2)}</td>
          <td>${categoryConfig?.label ?? e.budgetLine?.category ?? "Uncategorized"}</td>
          <td>${e.expense.vendor ?? "-"}</td>
          <td>${e.expense.description ?? "-"}</td>
          <td>${submitter?.name ?? submitter?.email ?? "-"}</td>
        </tr>
      `;
        })
        .join("")}
    </tbody>
  </table>
</body>
</html>
      `.trim();

      return new NextResponse(html, {
        headers: {
          "Content-Type": "text/html",
          "Content-Disposition": `attachment; filename="${show.title}-expenses-${new Date().toISOString().split("T")[0] ?? ""}.html"`,
        },
      });
    }
  } catch (error) {
    console.error("Error exporting budget report:", error);
    return NextResponse.json({ error: "Failed to export report" }, { status: 500 });
  }
}

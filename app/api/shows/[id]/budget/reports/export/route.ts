import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  shows,
  producerProfiles,
  budgets,
  budgetLines,
  expenses,
  BUDGET_CATEGORY_OPTIONS,
} from "@/lib/db/schema";
import { exportFormatSchema, budgetReportQuerySchema } from "@/lib/validations/budget";
import { eq, and, gte, lte, sql } from "drizzle-orm";

interface RouteParams {
  params: Promise<{ id: string }>;
}

function generateCSV(data: {
  show: { title: string };
  categoryReport: {
    categoryLabel: string;
    budgeted: string;
    spent: string;
    remaining: string;
    percentUsed: number;
  }[];
  totals: {
    totalBudgeted: number;
    totalSpent: number;
    totalRemaining: number;
    percentUsed: number;
  };
}): string {
  const lines: string[] = [];

  // Header
  lines.push(`Budget Report: ${data.show.title}`);
  lines.push(`Generated: ${new Date().toLocaleString()}`);
  lines.push("");

  // Category breakdown
  lines.push("Category,Budgeted,Spent,Remaining,% Used");
  data.categoryReport.forEach((cat) => {
    lines.push(
      `"${cat.categoryLabel}","$${Number(cat.budgeted).toFixed(2)}","$${Number(cat.spent).toFixed(2)}","$${Number(cat.remaining).toFixed(2)}","${String(cat.percentUsed)}%"`
    );
  });

  // Totals
  lines.push("");
  lines.push(
    `"TOTAL","$${data.totals.totalBudgeted.toFixed(2)}","$${data.totals.totalSpent.toFixed(2)}","$${data.totals.totalRemaining.toFixed(2)}","${String(data.totals.percentUsed)}%"`
  );

  return lines.join("\n");
}

function generatePDFHTML(data: {
  show: { title: string };
  categoryReport: {
    categoryLabel: string;
    budgeted: string;
    spent: string;
    remaining: string;
    percentUsed: number;
    isOverBudget: boolean;
  }[];
  totals: {
    totalBudgeted: number;
    totalSpent: number;
    totalRemaining: number;
    percentUsed: number;
  };
}): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Budget Report - ${data.show.title}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 40px; }
    h1 { color: #333; margin-bottom: 5px; }
    .subtitle { color: #666; margin-bottom: 30px; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background-color: #f5f5f5; font-weight: 600; }
    .number { text-align: right; }
    .over-budget { color: #dc2626; }
    .under-budget { color: #16a34a; }
    .total-row { font-weight: bold; background-color: #f9fafb; }
    .percent-bar { 
      height: 8px; 
      background: #e5e7eb; 
      border-radius: 4px;
      overflow: hidden;
    }
    .percent-fill {
      height: 100%;
      background: #3b82f6;
      border-radius: 4px;
    }
    .percent-fill.over { background: #dc2626; }
  </style>
</head>
<body>
  <h1>Budget Report</h1>
  <p class="subtitle">${data.show.title} - Generated ${new Date().toLocaleDateString()}</p>
  
  <table>
    <thead>
      <tr>
        <th>Category</th>
        <th class="number">Budgeted</th>
        <th class="number">Spent</th>
        <th class="number">Remaining</th>
        <th class="number">% Used</th>
        <th style="width: 100px;">Progress</th>
      </tr>
    </thead>
    <tbody>
      ${data.categoryReport
        .map(
          (cat) => `
        <tr>
          <td>${cat.categoryLabel}</td>
          <td class="number">$${Number(cat.budgeted).toFixed(2)}</td>
          <td class="number">$${Number(cat.spent).toFixed(2)}</td>
          <td class="number ${cat.isOverBudget ? "over-budget" : "under-budget"}">
            $${Number(cat.remaining).toFixed(2)}
          </td>
          <td class="number">${String(cat.percentUsed)}%</td>
          <td>
            <div class="percent-bar">
              <div class="percent-fill ${cat.percentUsed > 100 ? "over" : ""}"
                   style="width: ${String(Math.min(cat.percentUsed, 100))}%"></div>
            </div>
          </td>
        </tr>
      `
        )
        .join("")}
      <tr class="total-row">
        <td>TOTAL</td>
        <td class="number">$${data.totals.totalBudgeted.toFixed(2)}</td>
        <td class="number">$${data.totals.totalSpent.toFixed(2)}</td>
        <td class="number ${data.totals.totalRemaining < 0 ? "over-budget" : "under-budget"}">
          $${data.totals.totalRemaining.toFixed(2)}
        </td>
        <td class="number">${String(data.totals.percentUsed)}%</td>
        <td>
          <div class="percent-bar">
            <div class="percent-fill ${data.totals.percentUsed > 100 ? "over" : ""}"
                 style="width: ${String(Math.min(data.totals.percentUsed, 100))}%"></div>
          </div>
        </td>
      </tr>
    </tbody>
  </table>
</body>
</html>`;
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

    const format = searchParams.get("format") ?? "csv";
    const formatParsed = exportFormatSchema.safeParse({ format });

    if (!formatParsed.success) {
      return NextResponse.json({ error: "Invalid format" }, { status: 400 });
    }

    const budget = await db.query.budgets.findFirst({
      where: eq(budgets.showId, showId),
    });

    if (!budget) {
      return NextResponse.json({ error: "Budget not found" }, { status: 404 });
    }

    // Get lines
    const lines = await db.query.budgetLines.findMany({
      where: eq(budgetLines.budgetId, budget.id),
      orderBy: (budgetLines, { asc }) => [asc(budgetLines.sortOrder)],
    });

    // Parse date filters
    const queryParams = {
      startDate: searchParams.get("startDate") ?? undefined,
      endDate: searchParams.get("endDate") ?? undefined,
    };
    const dateParsed = budgetReportQuerySchema.safeParse(queryParams);

    const expenseConditions = [eq(expenses.showId, showId)];
    if (dateParsed.success && dateParsed.data.startDate) {
      expenseConditions.push(gte(expenses.date, dateParsed.data.startDate));
    }
    if (dateParsed.success && dateParsed.data.endDate) {
      expenseConditions.push(lte(expenses.date, dateParsed.data.endDate));
    }

    // Get spending per line
    const expensesByLine = await db
      .select({
        budgetLineId: expenses.budgetLineId,
        totalAmount: sql<string>`COALESCE(SUM(${expenses.amount}), 0)`,
      })
      .from(expenses)
      .where(and(...expenseConditions))
      .groupBy(expenses.budgetLineId);

    const expenseMap = new Map(expensesByLine.map((e) => [e.budgetLineId, e.totalAmount]));

    const categoryReport = lines.map((line) => {
      const spent = expenseMap.get(line.id) ?? "0";
      const budgeted = Number(line.budgetedAmount);
      const spentNum = Number(spent);
      const remaining = budgeted - spentNum;
      const percentUsed = budgeted > 0 ? Math.round((spentNum / budgeted) * 100) : 0;

      const categoryInfo = BUDGET_CATEGORY_OPTIONS.find((c) => c.value === line.category);

      return {
        categoryLabel: categoryInfo?.label ?? line.customCategoryName ?? line.category,
        budgeted: line.budgetedAmount,
        spent,
        remaining: String(remaining),
        percentUsed,
        isOverBudget: remaining < 0,
      };
    });

    const totals = {
      totalBudgeted: lines.reduce((sum, l) => sum + Number(l.budgetedAmount), 0),
      totalSpent: categoryReport.reduce((sum, c) => sum + Number(c.spent), 0),
      totalRemaining: 0,
      percentUsed: 0,
    };
    totals.totalRemaining = totals.totalBudgeted - totals.totalSpent;
    totals.percentUsed =
      totals.totalBudgeted > 0 ? Math.round((totals.totalSpent / totals.totalBudgeted) * 100) : 0;

    const reportData = {
      show: { title: show.title },
      categoryReport,
      totals,
    };

    if (formatParsed.data.format === "csv") {
      const csv = generateCSV(reportData);
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="budget-report-${show.title.replace(/\s+/g, "-").toLowerCase()}.csv"`,
        },
      });
    }

    // PDF (HTML for printing)
    const html = generatePDFHTML(reportData);
    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html",
      },
    });
  } catch (error) {
    console.error("Error exporting budget report:", error);
    return NextResponse.json({ error: "Failed to export report" }, { status: 500 });
  }
}

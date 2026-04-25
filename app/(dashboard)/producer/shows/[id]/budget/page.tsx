import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, DollarSign } from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, producerProfiles, shows, budgets, budgetLines, expenses } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { BudgetDashboard } from "@/components/budget/BudgetDashboard";

export const metadata = {
  title: "Budget & Expenses",
  description: "Manage your production budget and expenses",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function BudgetPage({ params }: PageProps): Promise<React.ReactElement> {
  const session = await auth();
  const { id } = await params;

  if (!session?.user.id) {
    redirect("/login");
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
  });

  if (user?.userType !== "producer") {
    redirect("/");
  }

  const profile = await db.query.producerProfiles.findFirst({
    where: eq(producerProfiles.userId, session.user.id),
  });

  if (!profile) {
    redirect("/producer/setup");
  }

  const show = await db.query.shows.findFirst({
    where: and(eq(shows.id, id), eq(shows.organizationId, profile.id)),
  });

  if (!show) {
    notFound();
  }

  const budget = await db.query.budgets.findFirst({
    where: eq(budgets.showId, id),
  });

  let lines: (typeof budgetLines.$inferSelect)[] = [];
  let linesWithSpending: (typeof budgetLines.$inferSelect & {
    actualSpent: string;
    expenseCount: number;
    remaining: string;
  })[] = [];

  if (budget) {
    lines = await db.query.budgetLines.findMany({
      where: eq(budgetLines.budgetId, budget.id),
      orderBy: (budgetLines, { asc }) => [asc(budgetLines.sortOrder)],
    });

    const expensesByLine = await db
      .select({
        budgetLineId: expenses.budgetLineId,
        totalSpent: sql<string>`COALESCE(SUM(${expenses.amount}), 0)`,
        expenseCount: sql<number>`COUNT(*)::int`,
      })
      .from(expenses)
      .where(eq(expenses.showId, id))
      .groupBy(expenses.budgetLineId);

    const expenseMap = new Map(
      expensesByLine.map((e) => [e.budgetLineId, { spent: e.totalSpent, count: e.expenseCount }])
    );

    linesWithSpending = lines.map((line) => ({
      ...line,
      actualSpent: expenseMap.get(line.id)?.spent ?? "0",
      expenseCount: expenseMap.get(line.id)?.count ?? 0,
      remaining: String(Number(line.budgetedAmount) - Number(expenseMap.get(line.id)?.spent ?? 0)),
    }));
  }

  const totalBudgeted = lines.reduce((sum, line) => sum + Number(line.budgetedAmount), 0);
  const totalSpent = linesWithSpending.reduce((sum, line) => sum + Number(line.actualSpent), 0);

  return (
    <div className="container py-8">
      <div className="mb-6 space-y-4">
        <Link
          href={`/producer/shows/${id}`}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to {show.title}
        </Link>

        <div className="flex items-center gap-3">
          <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-lg">
            <DollarSign className="text-primary h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{show.title}</h1>
            <p className="text-muted-foreground">Budget & Expenses</p>
          </div>
        </div>
      </div>

      <BudgetDashboard
        showId={id}
        initialBudget={budget ?? null}
        initialLines={linesWithSpending}
        summary={{
          totalBudgeted: String(totalBudgeted),
          totalSpent: String(totalSpent),
          remaining: String(totalBudgeted - totalSpent),
          percentUsed: totalBudgeted > 0 ? Math.round((totalSpent / totalBudgeted) * 100) : 0,
        }}
      />
    </div>
  );
}

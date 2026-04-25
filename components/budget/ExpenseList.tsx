"use client";

import { useState, useEffect, useCallback } from "react";
import { Receipt, FileText, Trash2, Loader2, FileCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { BudgetLine, Expense } from "@/lib/db/schema/budget";
import { BUDGET_CATEGORY_OPTIONS } from "@/lib/db/schema/budget";

interface BudgetLineWithSpending extends BudgetLine {
  actualSpent: string;
  expenseCount: number;
  remaining: string;
}

interface ExpenseWithDetails extends Expense {
  budgetLine?: BudgetLine | null;
  submitter?: { id: string; name: string | null; email: string } | null;
  reimbursement?: {
    id: string;
    status: string;
    amountRequested: string;
  } | null;
}

interface ExpenseListProps {
  showId: string;
  lines: BudgetLineWithSpending[];
  onExpenseChange: () => void;
}

export function ExpenseList({ showId, onExpenseChange }: ExpenseListProps): React.ReactElement {
  const [expenses, setExpenses] = useState<ExpenseWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchExpenses = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const response = await fetch(`/api/shows/${showId}/budget/expenses?limit=100`);
      if (!response.ok) throw new Error("Failed to fetch expenses");
      const data = (await response.json()) as { expenses: ExpenseWithDetails[] };
      setExpenses(data.expenses);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch expenses");
    } finally {
      setLoading(false);
    }
  }, [showId]);

  useEffect(() => {
    void fetchExpenses();
  }, [fetchExpenses]);

  const handleDelete = async (expenseId: string): Promise<void> => {
    if (!confirm("Are you sure you want to delete this expense?")) return;

    try {
      const response = await fetch(`/api/shows/${showId}/budget/expenses/${expenseId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Failed to delete expense");
      }

      setExpenses(expenses.filter((e) => e.id !== expenseId));
      onExpenseChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete expense");
    }
  };

  const handleRequestReimbursement = async (expense: ExpenseWithDetails): Promise<void> => {
    try {
      const response = await fetch(
        `/api/shows/${showId}/budget/expenses/${expense.id}/reimbursement`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amountRequested: Number(expense.amount),
          }),
        }
      );

      if (!response.ok) {
        const errorData = (await response.json()) as { error?: string };
        throw new Error(errorData.error ?? "Failed to request reimbursement");
      }

      const data = (await response.json()) as {
        reimbursement: ExpenseWithDetails["reimbursement"];
      };
      setExpenses(
        expenses.map((e) => (e.id === expense.id ? { ...e, reimbursement: data.reimbursement } : e))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to request reimbursement");
    }
  };

  const getCategoryLabel = (line?: BudgetLine | null): string => {
    if (!line) return "Uncategorized";
    if (line.category === "custom" && line.customCategoryName) return line.customCategoryName;
    const option = BUDGET_CATEGORY_OPTIONS.find((o) => o.value === line.category);
    return option?.label ?? line.category;
  };

  const getStatusVariant = (
    status: string
  ): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "pending":
        return "secondary";
      case "approved":
        return "default";
      case "denied":
        return "destructive";
      case "paid":
        return "outline";
      default:
        return "secondary";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Expenses</CardTitle>
      </CardHeader>
      <CardContent>
        {error && <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>}

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
          </div>
        ) : expenses.length === 0 ? (
          <div className="text-muted-foreground py-8 text-center">
            No expenses recorded yet. Click &quot;Add Expense&quot; to record your first expense.
          </div>
        ) : (
          <div className="space-y-3">
            {expenses.map((expense) => (
              <div key={expense.id} className="flex items-center gap-3 rounded-lg border p-3">
                <div className="bg-muted flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
                  <Receipt className="text-muted-foreground h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium">
                      {expense.vendor ?? expense.description ?? "Expense"}
                    </p>
                    {expense.reimbursement && (
                      <Badge variant={getStatusVariant(expense.reimbursement.status)}>
                        {expense.reimbursement.status}
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground text-sm">
                    {getCategoryLabel(expense.budgetLine)} &bull;{" "}
                    {new Date(expense.date).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">${Number(expense.amount).toLocaleString()}</p>
                  {expense.submitter && (
                    <p className="text-muted-foreground text-xs">
                      by {expense.submitter.name ?? expense.submitter.email}
                    </p>
                  )}
                </div>
                <div className="flex gap-1">
                  {expense.receiptUrl && (
                    <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                      <a href={expense.receiptUrl} target="_blank" rel="noopener noreferrer">
                        <FileText className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                  {!expense.reimbursement && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => {
                        void handleRequestReimbursement(expense);
                      }}
                      title="Request Reimbursement"
                    >
                      <FileCheck className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-500 hover:text-red-600"
                    onClick={() => {
                      void handleDelete(expense.id);
                    }}
                    disabled={
                      expense.reimbursement?.status === "approved" ||
                      expense.reimbursement?.status === "paid"
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

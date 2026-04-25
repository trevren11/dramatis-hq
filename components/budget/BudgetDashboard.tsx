"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  DollarSign,
  Plus,
  Download,
  FileText,
  Receipt,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BudgetLineList } from "./BudgetLineList";
import { ExpenseList } from "./ExpenseList";
import { ReimbursementList } from "./ReimbursementList";
import { CreateBudgetDialog } from "./CreateBudgetDialog";
import { AddExpenseDialog } from "./AddExpenseDialog";
import type { Budget, BudgetLine } from "@/lib/db/schema/budget";

interface BudgetDashboardProps {
  showId: string;
  initialBudget: Budget | null;
  initialLines: (BudgetLine & {
    actualSpent: string;
    expenseCount: number;
    remaining: string;
  })[];
  summary: {
    totalBudgeted: string;
    totalSpent: string;
    remaining: string;
    percentUsed: number;
  };
}

export function BudgetDashboard({
  showId,
  initialBudget,
  initialLines,
  summary: initialSummary,
}: BudgetDashboardProps): React.ReactElement {
  const router = useRouter();
  const [budget, setBudget] = useState(initialBudget);
  const [lines, setLines] = useState(initialLines);
  const [summary, setSummary] = useState(initialSummary);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showAddExpenseDialog, setShowAddExpenseDialog] = useState(false);

  const refreshData = async (): Promise<void> => {
    try {
      const response = await fetch(`/api/shows/${showId}/budget`);
      if (response.ok) {
        const data = (await response.json()) as {
          budget: Budget | null;
          lines: (BudgetLine & { actualSpent: string; expenseCount: number; remaining: string })[];
          summary?: typeof initialSummary;
        };
        setBudget(data.budget);
        setLines(data.lines);
        if (data.summary) {
          setSummary(data.summary);
        }
      }
    } catch (error) {
      console.error("Failed to refresh budget data:", error);
    }
  };

  const handleExportCSV = async (): Promise<void> => {
    try {
      const response = await fetch(`/api/shows/${showId}/budget/reports`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format: "csv" }),
      });
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `budget-report-${String(new Date().toISOString().split("T")[0])}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Failed to export CSV:", error);
    }
  };

  if (!budget) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="bg-muted mb-4 flex h-16 w-16 items-center justify-center rounded-full">
          <DollarSign className="text-muted-foreground h-8 w-8" />
        </div>
        <h3 className="mb-2 text-lg font-semibold">No Budget Set Up</h3>
        <p className="text-muted-foreground mb-4 text-center">
          Create a budget to start tracking your production expenses.
        </p>
        <Button
          onClick={() => {
            setShowCreateDialog(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Budget
        </Button>
        <CreateBudgetDialog
          showId={showId}
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          onSuccess={() => {
            setShowCreateDialog(false);
            void refreshData();
          }}
        />
      </div>
    );
  }

  const isOverBudget = Number(summary.remaining) < 0;
  const isNearBudget = summary.percentUsed >= 80 && summary.percentUsed < 100;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
            <DollarSign className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${Number(summary.totalBudgeted).toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Spent</CardTitle>
            <Receipt className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${Number(summary.totalSpent).toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-muted-foreground text-xs">{summary.percentUsed}% of budget</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Remaining</CardTitle>
            {isOverBudget ? (
              <AlertTriangle className="h-4 w-4 text-red-500" />
            ) : isNearBudget ? (
              <TrendingUp className="h-4 w-4 text-amber-500" />
            ) : (
              <CheckCircle className="h-4 w-4 text-green-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${isOverBudget ? "text-red-500" : ""}`}>
              $
              {Math.abs(Number(summary.remaining)).toLocaleString("en-US", {
                minimumFractionDigits: 2,
              })}
              {isOverBudget && " over"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progress</CardTitle>
            <Clock className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <Progress
              value={Math.min(summary.percentUsed, 100)}
              className={`h-2 ${isOverBudget ? "[&>div]:bg-red-500" : isNearBudget ? "[&>div]:bg-amber-500" : ""}`}
            />
            <p className="text-muted-foreground mt-2 text-xs">
              {lines.reduce((sum, l) => sum + l.expenseCount, 0)} expenses recorded
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <Button
          onClick={() => {
            setShowAddExpenseDialog(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Expense
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            void handleExportCSV();
          }}
        >
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            router.push(`/producer/shows/${showId}/budget/reports`);
          }}
        >
          <FileText className="mr-2 h-4 w-4" />
          View Reports
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="lines" className="space-y-4">
        <TabsList>
          <TabsTrigger value="lines">Budget Lines</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="reimbursements">Reimbursements</TabsTrigger>
        </TabsList>

        <TabsContent value="lines">
          <BudgetLineList
            showId={showId}
            budgetId={budget.id}
            lines={lines}
            onLinesChange={() => {
              void refreshData();
            }}
          />
        </TabsContent>

        <TabsContent value="expenses">
          <ExpenseList
            showId={showId}
            lines={lines}
            onExpenseChange={() => {
              void refreshData();
            }}
          />
        </TabsContent>

        <TabsContent value="reimbursements">
          <ReimbursementList showId={showId} />
        </TabsContent>
      </Tabs>

      <AddExpenseDialog
        showId={showId}
        lines={lines}
        open={showAddExpenseDialog}
        onOpenChange={setShowAddExpenseDialog}
        onSuccess={() => {
          setShowAddExpenseDialog(false);
          void refreshData();
        }}
      />
    </div>
  );
}

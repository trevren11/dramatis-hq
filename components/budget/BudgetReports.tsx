"use client";

import { useState, useEffect, useCallback } from "react";
import { Download, Loader2, BarChart3, PieChart, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface ReportData {
  show: { id: string; title: string };
  budget: { id: string; name: string; totalAmount: string } | null;
  summary: {
    totalBudgeted: string;
    totalSpent: string;
    remaining: string;
    percentUsed: number;
    expenseCount: number;
  };
  byCategory: {
    category: string;
    label: string;
    color: string;
    budgeted: string;
    spent: string;
    remaining: string;
    percentUsed: number;
    expenseCount: number;
  }[];
  byMonth: {
    month: string;
    spent: string;
    expenseCount: number;
  }[];
  byVendor: {
    vendor: string;
    spent: string;
    expenseCount: number;
  }[];
  reimbursements: {
    pending: { count: number; total: string };
    approved: { count: number; total: string };
    denied: { count: number; total: string };
    paid: { count: number; total: string };
  };
  generatedAt: string;
}

interface BudgetReportsProps {
  showId: string;
}

export function BudgetReports({ showId }: BudgetReportsProps): React.ReactElement {
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const fetchReport = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const response = await fetch(`/api/shows/${showId}/budget/reports`);
      if (!response.ok) throw new Error("Failed to fetch report");
      const data = (await response.json()) as { report: ReportData };
      setReport(data.report);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch report");
    } finally {
      setLoading(false);
    }
  }, [showId]);

  useEffect(() => {
    void fetchReport();
  }, [fetchReport]);

  const handleExport = async (format: "csv" | "pdf"): Promise<void> => {
    setExporting(true);
    try {
      const response = await fetch(`/api/shows/${showId}/budget/reports?format=${format}`, {
        method: "POST",
      });

      if (!response.ok) throw new Error("Failed to export");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `budget-report-${String(new Date().toISOString().split("T")[0])}.${format === "csv" ? "csv" : "html"}`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to export");
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return <div className="rounded-md bg-red-50 p-4 text-red-600">{error}</div>;
  }

  if (!report) {
    return <div className="text-muted-foreground py-12 text-center">No report data available.</div>;
  }

  const totalBudgeted = Number(report.summary.totalBudgeted);
  const totalSpent = Number(report.summary.totalSpent);

  return (
    <div className="space-y-6">
      {/* Export Actions */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={() => {
            void handleExport("csv");
          }}
          disabled={exporting}
        >
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            void handleExport("pdf");
          }}
          disabled={exporting}
        >
          <Download className="mr-2 h-4 w-4" />
          Export PDF
        </Button>
      </div>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Budget Summary
          </CardTitle>
          <CardDescription>Overall budget utilization and spending</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <p className="text-muted-foreground text-sm">Total Budget</p>
              <p className="text-2xl font-bold">${totalBudgeted.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Total Spent</p>
              <p className="text-2xl font-bold">${totalSpent.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Remaining</p>
              <p
                className={`text-2xl font-bold ${Number(report.summary.remaining) >= 0 ? "text-green-600" : "text-red-600"}`}
              >
                ${Math.abs(Number(report.summary.remaining)).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Expenses</p>
              <p className="text-2xl font-bold">{report.summary.expenseCount}</p>
            </div>
          </div>
          <div className="mt-4">
            <Progress
              value={Math.min(report.summary.percentUsed, 100)}
              className={`h-3 ${
                report.summary.percentUsed > 100
                  ? "[&>div]:bg-red-500"
                  : report.summary.percentUsed > 80
                    ? "[&>div]:bg-amber-500"
                    : ""
              }`}
            />
            <p className="text-muted-foreground mt-1 text-sm">
              {report.summary.percentUsed}% of budget used
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Spending by Category */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            Spending by Category
          </CardTitle>
        </CardHeader>
        <CardContent>
          {report.byCategory.length === 0 ? (
            <p className="text-muted-foreground text-center">No category data available</p>
          ) : (
            <div className="space-y-3">
              {report.byCategory.map((cat) => (
                <div key={cat.category} className="flex items-center gap-3">
                  <div
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: cat.color }}
                  />
                  <div className="min-w-[120px]">
                    <p className="font-medium">{cat.label}</p>
                    <p className="text-muted-foreground text-xs">{cat.expenseCount} expenses</p>
                  </div>
                  <div className="flex-1">
                    <Progress
                      value={Math.min(cat.percentUsed, 100)}
                      className={`h-2 ${
                        cat.percentUsed > 100
                          ? "[&>div]:bg-red-500"
                          : cat.percentUsed > 80
                            ? "[&>div]:bg-amber-500"
                            : ""
                      }`}
                    />
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${Number(cat.spent).toLocaleString()}</p>
                    <p className="text-muted-foreground text-xs">
                      of ${Number(cat.budgeted).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Spending by Month */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Spending Over Time
          </CardTitle>
        </CardHeader>
        <CardContent>
          {report.byMonth.length === 0 ? (
            <p className="text-muted-foreground text-center">No monthly data available</p>
          ) : (
            <div className="space-y-2">
              {report.byMonth.map((month) => {
                const percentOfTotal =
                  totalSpent > 0 ? (Number(month.spent) / totalSpent) * 100 : 0;

                return (
                  <div key={month.month} className="flex items-center gap-3">
                    <div className="w-20 text-sm font-medium">{month.month}</div>
                    <div className="flex-1">
                      <div className="bg-muted h-6 overflow-hidden rounded">
                        <div
                          className="bg-primary h-full transition-all"
                          style={{ width: `${String(percentOfTotal)}%` }}
                        />
                      </div>
                    </div>
                    <div className="w-24 text-right text-sm font-medium">
                      ${Number(month.spent).toLocaleString()}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Vendors */}
      <Card>
        <CardHeader>
          <CardTitle>Top Vendors</CardTitle>
          <CardDescription>Vendors with the highest spending</CardDescription>
        </CardHeader>
        <CardContent>
          {report.byVendor.length === 0 ? (
            <p className="text-muted-foreground text-center">No vendor data available</p>
          ) : (
            <div className="space-y-2">
              {report.byVendor.slice(0, 10).map((vendor, index) => (
                <div
                  key={vendor.vendor}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground w-6 text-sm">{index + 1}.</span>
                    <span className="font-medium">{vendor.vendor}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${Number(vendor.spent).toLocaleString()}</p>
                    <p className="text-muted-foreground text-xs">{vendor.expenseCount} expenses</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reimbursements Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Reimbursements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-lg border p-3">
              <p className="text-muted-foreground text-sm">Pending</p>
              <p className="text-xl font-bold text-amber-600">
                {report.reimbursements.pending.count}
              </p>
              <p className="text-muted-foreground text-xs">
                ${Number(report.reimbursements.pending.total).toLocaleString()}
              </p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-muted-foreground text-sm">Approved</p>
              <p className="text-xl font-bold text-green-600">
                {report.reimbursements.approved.count}
              </p>
              <p className="text-muted-foreground text-xs">
                ${Number(report.reimbursements.approved.total).toLocaleString()}
              </p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-muted-foreground text-sm">Denied</p>
              <p className="text-xl font-bold text-red-600">{report.reimbursements.denied.count}</p>
              <p className="text-muted-foreground text-xs">
                ${Number(report.reimbursements.denied.total).toLocaleString()}
              </p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-muted-foreground text-sm">Paid</p>
              <p className="text-xl font-bold text-blue-600">{report.reimbursements.paid.count}</p>
              <p className="text-muted-foreground text-xs">
                ${Number(report.reimbursements.paid.total).toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Generated timestamp */}
      <p className="text-muted-foreground text-center text-xs">
        Report generated: {new Date(report.generatedAt).toLocaleString()}
      </p>
    </div>
  );
}

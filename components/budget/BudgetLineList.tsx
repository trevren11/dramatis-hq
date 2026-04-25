"use client";

import { useState } from "react";
import { Plus, Edit2, Trash2, GripVertical, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { BudgetLine } from "@/lib/db/schema/budget";
import { BUDGET_CATEGORY_OPTIONS } from "@/lib/db/schema/budget";

interface BudgetLineWithSpending extends BudgetLine {
  actualSpent: string;
  expenseCount: number;
  remaining: string;
}

interface BudgetLineListProps {
  showId: string;
  budgetId: string;
  lines: BudgetLineWithSpending[];
  onLinesChange: () => void;
}

export function BudgetLineList({
  showId,
  lines,
  onLinesChange,
}: BudgetLineListProps): React.ReactElement {
  const [showDialog, setShowDialog] = useState(false);
  const [editingLine, setEditingLine] = useState<BudgetLineWithSpending | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [category, setCategory] = useState("miscellaneous");
  const [customCategoryName, setCustomCategoryName] = useState("");
  const [description, setDescription] = useState("");
  const [budgetedAmount, setBudgetedAmount] = useState("");

  const resetForm = (): void => {
    setCategory("miscellaneous");
    setCustomCategoryName("");
    setDescription("");
    setBudgetedAmount("");
    setEditingLine(null);
    setShowDialog(false);
  };

  const openAddDialog = (): void => {
    resetForm();
    setShowDialog(true);
  };

  const openEditDialog = (line: BudgetLineWithSpending): void => {
    setEditingLine(line);
    setCategory(line.category);
    setCustomCategoryName(line.customCategoryName ?? "");
    setDescription(line.description ?? "");
    setBudgetedAmount(line.budgetedAmount);
    setShowDialog(true);
  };

  const handleSubmit = async (): Promise<void> => {
    if (!budgetedAmount) {
      setError("Please enter a budget amount");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const url = editingLine
        ? `/api/shows/${showId}/budget/lines/${editingLine.id}`
        : `/api/shows/${showId}/budget/lines`;

      const response = await fetch(url, {
        method: editingLine ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          customCategoryName: category === "custom" ? customCategoryName : null,
          description: description || null,
          budgetedAmount: Number(budgetedAmount),
        }),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Failed to save budget line");
      }

      resetForm();
      onLinesChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save budget line");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (lineId: string): Promise<void> => {
    if (!confirm("Are you sure you want to delete this budget line?")) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/shows/${showId}/budget/lines/${lineId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Failed to delete budget line");
      }

      onLinesChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete budget line");
    } finally {
      setLoading(false);
    }
  };

  const getCategoryLabel = (cat: string, customName?: string | null): string => {
    if (cat === "custom" && customName) return customName;
    const option = BUDGET_CATEGORY_OPTIONS.find((o) => o.value === cat);
    return option?.label ?? cat;
  };

  const getCategoryColor = (cat: string): string => {
    const option = BUDGET_CATEGORY_OPTIONS.find((o) => o.value === cat);
    return option?.color ?? "#6b7280";
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Budget Lines</CardTitle>
          <Button size="sm" onClick={openAddDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Add Line
          </Button>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>
          )}

          {lines.length === 0 ? (
            <div className="text-muted-foreground py-8 text-center">
              No budget lines yet. Click &quot;Add Line&quot; to create your first budget category.
            </div>
          ) : (
            <div className="space-y-3">
              {lines.map((line) => {
                const percentSpent =
                  Number(line.budgetedAmount) > 0
                    ? (Number(line.actualSpent) / Number(line.budgetedAmount)) * 100
                    : 0;
                const isOverBudget = percentSpent > 100;
                const isNearBudget = percentSpent >= 80 && percentSpent < 100;

                return (
                  <div key={line.id} className="flex items-center gap-3 rounded-lg border p-3">
                    <GripVertical className="text-muted-foreground h-4 w-4 cursor-grab" />
                    <div
                      className="h-3 w-3 shrink-0 rounded-full"
                      style={{ backgroundColor: getCategoryColor(line.category) }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate font-medium">
                          {getCategoryLabel(line.category, line.customCategoryName)}
                        </p>
                        <p className="shrink-0 font-semibold">
                          ${Number(line.budgetedAmount).toLocaleString()}
                        </p>
                      </div>
                      <div className="mt-2">
                        <Progress
                          value={Math.min(percentSpent, 100)}
                          className={`h-1.5 ${
                            isOverBudget
                              ? "[&>div]:bg-red-500"
                              : isNearBudget
                                ? "[&>div]:bg-amber-500"
                                : ""
                          }`}
                        />
                      </div>
                      <div className="mt-1 flex justify-between text-xs">
                        <span className="text-muted-foreground">
                          ${Number(line.actualSpent).toLocaleString()} spent ({line.expenseCount}{" "}
                          expenses)
                        </span>
                        <span className={isOverBudget ? "text-red-500" : "text-muted-foreground"}>
                          {percentSpent.toFixed(0)}% used
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          openEditDialog(line);
                        }}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:text-red-600"
                        onClick={() => {
                          void handleDelete(line.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingLine ? "Edit" : "Add"} Budget Line</DialogTitle>
            <DialogDescription>
              {editingLine
                ? "Update the budget line details."
                : "Create a new budget category to track expenses."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                }}
                className="border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm"
              >
                {BUDGET_CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {category === "custom" && (
              <div className="space-y-2">
                <Label>Custom Category Name</Label>
                <Input
                  value={customCategoryName}
                  onChange={(e) => {
                    setCustomCategoryName(e.target.value);
                  }}
                  placeholder="e.g., Music Rights"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Budget Amount</Label>
              <div className="relative">
                <span className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2">
                  $
                </span>
                <Input
                  type="number"
                  value={budgetedAmount}
                  onChange={(e) => {
                    setBudgetedAmount(e.target.value);
                  }}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className="pl-7"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description (optional)</Label>
              <Input
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                }}
                placeholder="Brief description of this budget line"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={resetForm} disabled={loading}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                void handleSubmit();
              }}
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingLine ? "Update" : "Add"} Line
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

"use client";

import { useState, useId } from "react";
import { Plus, Edit2, Trash2, Loader2, GripVertical } from "lucide-react";
import type { BudgetLine } from "@/lib/db/schema/budget";
import { BUDGET_CATEGORY_OPTIONS } from "@/lib/db/schema/budget";

interface BudgetLineWithSpending extends BudgetLine {
  actualSpent: string;
  expenseCount: number;
}

interface BudgetLineManagerProps {
  showId: string;
  budgetId: string;
  lines: BudgetLineWithSpending[];
  onLinesUpdated: (lines: BudgetLineWithSpending[]) => void;
}

export function BudgetLineManager({
  showId,
  lines,
  onLinesUpdated,
}: BudgetLineManagerProps): React.ReactElement {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [category, setCategory] = useState<string>("miscellaneous");
  const [customCategoryName, setCustomCategoryName] = useState("");
  const [description, setDescription] = useState("");
  const [budgetedAmount, setBudgetedAmount] = useState("");

  // Form field IDs for accessibility
  const categoryId = useId();
  const customCategoryId = useId();
  const budgetAmountId = useId();
  const descriptionId = useId();

  const resetForm = (): void => {
    setCategory("miscellaneous");
    setCustomCategoryName("");
    setDescription("");
    setBudgetedAmount("");
    setIsAdding(false);
    setEditingId(null);
  };

  const handleAdd = async (): Promise<void> => {
    if (!budgetedAmount) {
      setError("Please enter a budget amount");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/shows/${showId}/budget/lines`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          customCategoryName: category === "custom" ? customCategoryName : null,
          description,
          budgetedAmount: Number(budgetedAmount),
        }),
      });

      if (!response.ok) {
        const errorData = (await response.json()) as { error?: string };
        throw new Error(errorData.error ?? "Failed to add budget line");
      }

      const data = (await response.json()) as { line: BudgetLine };
      const newLine = {
        ...data.line,
        actualSpent: "0",
        expenseCount: 0,
      };
      onLinesUpdated([...lines, newLine]);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add budget line");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (line: BudgetLineWithSpending): void => {
    setEditingId(line.id);
    setCategory(line.category);
    setCustomCategoryName(line.customCategoryName ?? "");
    setDescription(line.description ?? "");
    setBudgetedAmount(line.budgetedAmount);
  };

  const handleUpdate = async (): Promise<void> => {
    if (!editingId || !budgetedAmount) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/shows/${showId}/budget/lines/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          customCategoryName: category === "custom" ? customCategoryName : null,
          description,
          budgetedAmount: Number(budgetedAmount),
        }),
      });

      if (!response.ok) {
        const errorData = (await response.json()) as { error?: string };
        throw new Error(errorData.error ?? "Failed to update budget line");
      }

      const data = (await response.json()) as { line: BudgetLine };
      const updatedLines = lines.map((line) =>
        line.id === editingId
          ? { ...data.line, actualSpent: line.actualSpent, expenseCount: line.expenseCount }
          : line
      );
      onLinesUpdated(updatedLines);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update budget line");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (lineId: string): Promise<void> => {
    if (!confirm("Are you sure you want to delete this budget line?")) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/shows/${showId}/budget/lines/${lineId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Failed to delete budget line");
      }

      onLinesUpdated(lines.filter((line) => line.id !== lineId));
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
    <div className="rounded-lg border">
      <div className="flex items-center justify-between border-b p-4">
        <h3 className="font-semibold">Budget Lines</h3>
        {!isAdding && !editingId && (
          <button
            onClick={() => {
              setIsAdding(true);
            }}
            className="text-primary hover:text-primary/80 inline-flex items-center gap-1 text-sm font-medium"
          >
            <Plus className="h-4 w-4" />
            Add Line
          </button>
        )}
      </div>

      {error && <div className="border-b bg-red-50 p-3 text-sm text-red-600">{error}</div>}

      {/* Add/Edit Form */}
      {(isAdding || editingId) && (
        <div className="space-y-4 border-b bg-gray-50 p-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor={categoryId} className="mb-1 block text-sm font-medium">
                Category
              </label>
              <select
                id={categoryId}
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                }}
                className="w-full rounded-md border px-3 py-2"
              >
                {BUDGET_CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            {category === "custom" && (
              <div>
                <label htmlFor={customCategoryId} className="mb-1 block text-sm font-medium">
                  Custom Category Name
                </label>
                <input
                  id={customCategoryId}
                  type="text"
                  value={customCategoryName}
                  onChange={(e) => {
                    setCustomCategoryName(e.target.value);
                  }}
                  placeholder="e.g., Music Rights"
                  className="w-full rounded-md border px-3 py-2"
                />
              </div>
            )}
            <div>
              <label htmlFor={budgetAmountId} className="mb-1 block text-sm font-medium">
                Budget Amount
              </label>
              <div className="relative">
                <span className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2">
                  $
                </span>
                <input
                  id={budgetAmountId}
                  type="number"
                  value={budgetedAmount}
                  onChange={(e) => {
                    setBudgetedAmount(e.target.value);
                  }}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className="w-full rounded-md border py-2 pr-3 pl-7"
                />
              </div>
            </div>
            <div className="md:col-span-2">
              <label htmlFor={descriptionId} className="mb-1 block text-sm font-medium">
                Description (optional)
              </label>
              <input
                id={descriptionId}
                type="text"
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                }}
                placeholder="Brief description of this budget line"
                className="w-full rounded-md border px-3 py-2"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                void (editingId ? handleUpdate() : handleAdd());
              }}
              disabled={loading}
              className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {editingId ? "Update" : "Add"} Line
            </button>
            <button
              onClick={resetForm}
              disabled={loading}
              className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-gray-100"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Lines List */}
      <div className="divide-y">
        {lines.length === 0 ? (
          <div className="text-muted-foreground p-8 text-center">
            No budget lines yet. Add your first budget category above.
          </div>
        ) : (
          lines.map((line) => {
            const percentSpent =
              Number(line.budgetedAmount) > 0
                ? (Number(line.actualSpent) / Number(line.budgetedAmount)) * 100
                : 0;
            const remaining = Number(line.budgetedAmount) - Number(line.actualSpent);

            return (
              <div key={line.id} className="flex items-center gap-4 p-4">
                <GripVertical className="text-muted-foreground h-4 w-4 cursor-grab" />
                <div
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{ backgroundColor: getCategoryColor(line.category) }}
                />
                <div className="min-w-[140px]">
                  <p className="font-medium">
                    {getCategoryLabel(line.category, line.customCategoryName)}
                  </p>
                  {line.description && (
                    <p className="text-muted-foreground text-xs">{line.description}</p>
                  )}
                </div>
                <div className="flex-1">
                  <div className="bg-muted h-2 overflow-hidden rounded-full">
                    <div
                      className="h-full transition-all"
                      style={{
                        width: `${String(Math.min(percentSpent, 100))}%`,
                        backgroundColor:
                          percentSpent > 100 ? "#ef4444" : getCategoryColor(line.category),
                      }}
                    />
                  </div>
                  <div className="mt-1 flex justify-between text-xs">
                    <span className="text-muted-foreground">
                      ${Number(line.actualSpent).toLocaleString()} spent ({line.expenseCount}{" "}
                      expenses)
                    </span>
                    <span className={remaining >= 0 ? "text-green-600" : "text-red-600"}>
                      ${Math.abs(remaining).toLocaleString()} {remaining < 0 ? "over" : "left"}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">${Number(line.budgetedAmount).toLocaleString()}</p>
                  <p className="text-muted-foreground text-xs">{percentSpent.toFixed(0)}% used</p>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => {
                      handleEdit(line);
                    }}
                    className="text-muted-foreground hover:text-foreground rounded p-1"
                    title="Edit"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      void handleDelete(line.id);
                    }}
                    className="text-muted-foreground rounded p-1 hover:text-red-600"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

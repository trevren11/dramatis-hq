"use client";

import { useState } from "react";
import { Loader2, Upload, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

interface AddExpenseDialogProps {
  showId: string;
  lines: BudgetLineWithSpending[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AddExpenseDialog({
  showId,
  lines,
  open,
  onOpenChange,
  onSuccess,
}: AddExpenseDialogProps): React.ReactElement {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [budgetLineId, setBudgetLineId] = useState<string>("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [vendor, setVendor] = useState("");
  const [description, setDescription] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  const resetForm = (): void => {
    setBudgetLineId("");
    setAmount("");
    setDate(new Date().toISOString().split("T")[0]);
    setVendor("");
    setDescription("");
    setReceiptFile(null);
    setError(null);
  };

  const handleSubmit = async (): Promise<void> => {
    if (!amount || !date) {
      setError("Amount and date are required");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create expense
      const response = await fetch(`/api/shows/${showId}/budget/expenses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          budgetLineId: budgetLineId || null,
          amount: Number(amount),
          date: new Date(date),
          vendor: vendor || null,
          description: description || null,
        }),
      });

      if (!response.ok) {
        const errorData = (await response.json()) as { error?: string };
        throw new Error(errorData.error ?? "Failed to create expense");
      }

      const data = (await response.json()) as { expense: { id: string } };

      // Upload receipt if provided
      if (receiptFile) {
        const formData = new FormData();
        formData.append("file", receiptFile);

        await fetch(`/api/shows/${showId}/budget/expenses/${data.expense.id}/receipt`, {
          method: "POST",
          body: formData,
        });
      }

      resetForm();
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create expense");
    } finally {
      setLoading(false);
    }
  };

  const getCategoryLabel = (line: BudgetLineWithSpending): string => {
    if (line.category === "custom" && line.customCategoryName) return line.customCategoryName;
    const option = BUDGET_CATEGORY_OPTIONS.find((o) => o.value === line.category);
    return option?.label ?? line.category;
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        if (!newOpen) resetForm();
        onOpenChange(newOpen);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Expense</DialogTitle>
          <DialogDescription>Record a new expense for your production.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Amount *</Label>
              <div className="relative">
                <span className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2">
                  $
                </span>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                  }}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className="pl-7"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Date *</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Category</Label>
            <select
              value={budgetLineId}
              onChange={(e) => {
                setBudgetLineId(e.target.value);
              }}
              className="border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm"
            >
              <option value="">Uncategorized</option>
              {lines.map((line) => (
                <option key={line.id} value={line.id}>
                  {getCategoryLabel(line)}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label>Vendor</Label>
            <Input
              value={vendor}
              onChange={(e) => {
                setVendor(e.target.value);
              }}
              placeholder="e.g., Home Depot"
            />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
              }}
              placeholder="Brief description of the expense"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Receipt (optional)</Label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => {
                  document.getElementById("receipt-upload")?.click();
                }}
              >
                <Upload className="mr-2 h-4 w-4" />
                {receiptFile ? receiptFile.name : "Upload Receipt"}
              </Button>
              {receiptFile && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setReceiptFile(null);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
              <input
                id="receipt-upload"
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => {
                  setReceiptFile(e.target.files?.[0] ?? null);
                }}
                className="hidden"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              resetForm();
              onOpenChange(false);
            }}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              void handleSubmit();
            }}
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Add Expense
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

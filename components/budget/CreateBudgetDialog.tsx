"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BUDGET_CATEGORY_OPTIONS } from "@/lib/db/schema/budget";

interface CreateBudgetDialogProps {
  showId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateBudgetDialog({
  showId,
  open,
  onOpenChange,
  onSuccess,
}: CreateBudgetDialogProps): React.ReactElement {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("Production Budget");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([
    "scenic",
    "costumes",
    "props",
    "lighting",
    "sound",
    "marketing",
    "venue",
    "royalties",
    "miscellaneous",
  ]);

  const handleSubmit = async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/shows/${showId}/budget`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          categories: selectedCategories,
        }),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Failed to create budget");
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create budget");
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (category: string): void => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter((c) => c !== category));
    } else {
      setSelectedCategories([...selectedCategories, category]);
    }
  };

  const selectAll = (): void => {
    setSelectedCategories(
      BUDGET_CATEGORY_OPTIONS.filter((c) => c.value !== "custom").map((c) => c.value)
    );
  };

  const selectNone = (): void => {
    setSelectedCategories([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create Budget</DialogTitle>
          <DialogDescription>
            Set up your production budget with the categories you need.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>}

          <div className="space-y-2">
            <Label>Budget Name</Label>
            <Input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
              }}
              placeholder="Production Budget"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Categories</Label>
              <div className="space-x-2 text-sm">
                <button type="button" onClick={selectAll} className="text-primary hover:underline">
                  Select All
                </button>
                <span className="text-muted-foreground">/</span>
                <button type="button" onClick={selectNone} className="text-primary hover:underline">
                  None
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {BUDGET_CATEGORY_OPTIONS.filter((c) => c.value !== "custom").map((category) => (
                <div key={category.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={category.value}
                    checked={selectedCategories.includes(category.value)}
                    onCheckedChange={() => {
                      toggleCategory(category.value);
                    }}
                  />
                  <label
                    htmlFor={category.value}
                    className="flex cursor-pointer items-center gap-2 text-sm"
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    {category.label}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
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
            disabled={loading || selectedCategories.length === 0}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Budget
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

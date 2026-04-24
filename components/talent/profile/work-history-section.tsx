"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Pencil, Trash2, Loader2, X, GripVertical } from "lucide-react";
import { WORK_CATEGORIES, WORK_CATEGORY_LABELS } from "@/lib/db/schema/work-history";
import type { WorkHistory } from "@/lib/db/schema/work-history";

interface WorkHistorySectionProps {
  initialData: WorkHistory[];
}

interface ApiResponse {
  workHistory?: WorkHistory;
  error?: string;
}

const categoryOptions = WORK_CATEGORIES.map((cat) => ({
  value: cat,
  label: WORK_CATEGORY_LABELS[cat],
}));

interface WorkHistoryFormData {
  showName: string;
  role: string;
  category: string;
  location: string;
  director: string;
  productionCompany: string;
  isUnion: boolean;
  description: string;
}

const emptyForm: WorkHistoryFormData = {
  showName: "",
  role: "",
  category: "theater",
  location: "",
  director: "",
  productionCompany: "",
  isUnion: false,
  description: "",
};

export function WorkHistorySection({ initialData }: WorkHistorySectionProps): React.ReactElement {
  const { toast } = useToast();
  const [entries, setEntries] = useState<WorkHistory[]>(initialData);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<WorkHistoryFormData>(emptyForm);

  const resetForm = (): void => {
    setFormData(emptyForm);
    setIsAdding(false);
    setEditingId(null);
  };

  const startEditing = (entry: WorkHistory): void => {
    setEditingId(entry.id);
    setIsAdding(false);
    setFormData({
      showName: entry.showName,
      role: entry.role,
      category: entry.category,
      location: entry.location ?? "",
      director: entry.director ?? "",
      productionCompany: entry.productionCompany ?? "",
      isUnion: entry.isUnion ?? false,
      description: entry.description ?? "",
    });
  };

  // eslint-disable-next-line complexity
  const handleSave = async (): Promise<void> => {
    if (!formData.showName || !formData.role) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Show name and role are required",
      });
      return;
    }

    setIsLoading(true);
    try {
      const isEdit = !!editingId;
      const url = isEdit ? `/api/talent/work-history/${editingId}` : "/api/talent/work-history";
      const method = isEdit ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          location: formData.location || null,
          director: formData.director || null,
          productionCompany: formData.productionCompany || null,
          description: formData.description || null,
        }),
      });

      if (!response.ok) {
        const errorData: ApiResponse = (await response.json()) as ApiResponse;
        throw new Error(errorData.error ?? "Failed to save");
      }

      const data: ApiResponse = (await response.json()) as ApiResponse;
      const newEntry = data.workHistory;

      if (newEntry) {
        if (isEdit) {
          setEntries(entries.map((e) => (e.id === editingId ? newEntry : e)));
        } else {
          setEntries([...entries, newEntry]);
        }
      }

      resetForm();
      toast({
        title: "Success",
        description: isEdit ? "Work history updated" : "Work history added",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string): Promise<void> => {
    if (!confirm("Are you sure you want to delete this entry?")) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/talent/work-history/${id}`, { method: "DELETE" });

      if (!response.ok) {
        const errorData: ApiResponse = (await response.json()) as ApiResponse;
        throw new Error(errorData.error ?? "Failed to delete");
      }

      setEntries(entries.filter((e) => e.id !== id));
      toast({ title: "Success", description: "Work history deleted" });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card id="work-history">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Work History</CardTitle>
        {!isAdding && !editingId && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setIsAdding(true);
              setFormData(emptyForm);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Entry
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Form for adding/editing */}
        {(isAdding || editingId) && (
          <div className="bg-muted/50 space-y-4 rounded-lg border p-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Show/Production Name <span className="text-destructive">*</span>
                </label>
                <Input
                  value={formData.showName}
                  onChange={(e) => {
                    setFormData({ ...formData, showName: e.target.value });
                  }}
                  placeholder="e.g., Hamilton"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Role <span className="text-destructive">*</span>
                </label>
                <Input
                  value={formData.role}
                  onChange={(e) => {
                    setFormData({ ...formData, role: e.target.value });
                  }}
                  placeholder="e.g., Ensemble"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <Select
                  value={formData.category}
                  onChange={(e) => {
                    setFormData({ ...formData, category: e.target.value });
                  }}
                  options={categoryOptions}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Location</label>
                <Input
                  value={formData.location}
                  onChange={(e) => {
                    setFormData({ ...formData, location: e.target.value });
                  }}
                  placeholder="e.g., Broadway, NYC"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Director</label>
                <Input
                  value={formData.director}
                  onChange={(e) => {
                    setFormData({ ...formData, director: e.target.value });
                  }}
                  placeholder="Director name"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Production Company</label>
                <Input
                  value={formData.productionCompany}
                  onChange={(e) => {
                    setFormData({ ...formData, productionCompany: e.target.value });
                  }}
                  placeholder="Company name"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => {
                  setFormData({ ...formData, description: e.target.value });
                }}
                placeholder="Brief description of your work..."
                className="border-input bg-background focus-visible:ring-ring flex min-h-[80px] w-full rounded-lg border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
              />
            </div>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isUnion}
                onChange={(e) => {
                  setFormData({ ...formData, isUnion: e.target.checked });
                }}
                className="h-4 w-4 rounded"
              />
              <span className="text-sm">Union production</span>
            </label>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={resetForm} disabled={isLoading}>
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button onClick={() => void handleSave()} disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {editingId ? "Update" : "Add"} Entry
              </Button>
            </div>
          </div>
        )}

        {/* List of entries */}
        {entries.length === 0 && !isAdding ? (
          <p className="text-muted-foreground py-8 text-center">
            No work history added yet. Click &quot;Add Entry&quot; to get started.
          </p>
        ) : (
          <div className="space-y-2">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className={`flex items-start justify-between rounded-lg border p-4 ${editingId === entry.id ? "ring-primary ring-2" : ""}`}
              >
                <div className="flex items-start gap-3">
                  <GripVertical className="text-muted-foreground mt-1 h-5 w-5 cursor-grab" />
                  <div>
                    <h4 className="font-medium">{entry.showName}</h4>
                    <p className="text-muted-foreground text-sm">{entry.role}</p>
                    <div className="text-muted-foreground mt-1 flex flex-wrap gap-2 text-xs">
                      <span className="bg-muted rounded px-2 py-0.5">
                        {WORK_CATEGORY_LABELS[entry.category]}
                      </span>
                      {entry.location && <span>{entry.location}</span>}
                      {entry.isUnion && (
                        <span className="bg-primary/10 text-primary rounded px-2 py-0.5">
                          Union
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      startEditing(entry);
                    }}
                    disabled={isLoading}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => void handleDelete(entry.id)}
                    disabled={isLoading}
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

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Pencil, Trash2, Loader2, X, GripVertical } from "lucide-react";
import { DEGREE_TYPES } from "@/lib/db/schema/education";
import type { Education } from "@/lib/db/schema/education";

interface EducationSectionProps {
  initialData: Education[];
}

interface ApiResponse {
  education?: Education;
  error?: string;
}

interface EducationFormData {
  program: string;
  degree: string;
  institution: string;
  location: string;
  startYear: string;
  endYear: string;
  description: string;
}

const emptyForm: EducationFormData = {
  program: "",
  degree: "",
  institution: "",
  location: "",
  startYear: "",
  endYear: "",
  description: "",
};

export function EducationSection({ initialData }: EducationSectionProps): React.ReactElement {
  const { toast } = useToast();
  const [entries, setEntries] = useState<Education[]>(initialData);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<EducationFormData>(emptyForm);

  const resetForm = (): void => {
    setFormData(emptyForm);
    setIsAdding(false);
    setEditingId(null);
  };

  const startEditing = (entry: Education): void => {
    setEditingId(entry.id);
    setIsAdding(false);
    setFormData({
      program: entry.program,
      degree: entry.degree ?? "",
      institution: entry.institution,
      location: entry.location ?? "",
      startYear: entry.startYear?.toString() ?? "",
      endYear: entry.endYear?.toString() ?? "",
      description: entry.description ?? "",
    });
  };

  // eslint-disable-next-line complexity
  const handleSave = async (): Promise<void> => {
    if (!formData.program || !formData.institution) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Program and institution are required",
      });
      return;
    }

    setIsLoading(true);
    try {
      const isEdit = !!editingId;
      const url = isEdit ? `/api/talent/education/${editingId}` : "/api/talent/education";
      const method = isEdit ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          program: formData.program,
          degree: formData.degree || null,
          institution: formData.institution,
          location: formData.location || null,
          startYear: formData.startYear ? parseInt(formData.startYear) : null,
          endYear: formData.endYear ? parseInt(formData.endYear) : null,
          description: formData.description || null,
        }),
      });

      if (!response.ok) {
        const errorData: ApiResponse = (await response.json()) as ApiResponse;
        throw new Error(errorData.error ?? "Failed to save");
      }

      const data: ApiResponse = (await response.json()) as ApiResponse;
      const newEducation = data.education;

      if (newEducation) {
        if (isEdit) {
          setEntries(entries.map((e) => (e.id === editingId ? newEducation : e)));
        } else {
          setEntries([...entries, newEducation]);
        }
      }

      resetForm();
      toast({ title: "Success", description: isEdit ? "Education updated" : "Education added" });
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
      const response = await fetch(`/api/talent/education/${id}`, { method: "DELETE" });

      if (!response.ok) {
        const errorData: ApiResponse = (await response.json()) as ApiResponse;
        throw new Error(errorData.error ?? "Failed to delete");
      }

      setEntries(entries.filter((e) => e.id !== id));
      toast({ title: "Success", description: "Education deleted" });
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
    <Card id="education">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Education & Training</CardTitle>
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
                  Program/Course <span className="text-destructive">*</span>
                </label>
                <Input
                  value={formData.program}
                  onChange={(e) => {
                    setFormData({ ...formData, program: e.target.value });
                  }}
                  placeholder="e.g., BFA Acting"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Degree Type</label>
                <select
                  value={formData.degree}
                  onChange={(e) => {
                    setFormData({ ...formData, degree: e.target.value });
                  }}
                  className="border-input bg-background flex h-10 w-full rounded-lg border px-3 py-2 text-sm"
                >
                  <option value="">Select degree type</option>
                  {DEGREE_TYPES.map((degree) => (
                    <option key={degree} value={degree}>
                      {degree}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Institution <span className="text-destructive">*</span>
                </label>
                <Input
                  value={formData.institution}
                  onChange={(e) => {
                    setFormData({ ...formData, institution: e.target.value });
                  }}
                  placeholder="e.g., NYU Tisch"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Location</label>
                <Input
                  value={formData.location}
                  onChange={(e) => {
                    setFormData({ ...formData, location: e.target.value });
                  }}
                  placeholder="e.g., New York, NY"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Start Year</label>
                <Input
                  type="number"
                  min="1900"
                  max="2100"
                  value={formData.startYear}
                  onChange={(e) => {
                    setFormData({ ...formData, startYear: e.target.value });
                  }}
                  placeholder="e.g., 2018"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">End Year</label>
                <Input
                  type="number"
                  min="1900"
                  max="2100"
                  value={formData.endYear}
                  onChange={(e) => {
                    setFormData({ ...formData, endYear: e.target.value });
                  }}
                  placeholder="e.g., 2022"
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
                placeholder="Notable achievements, focus areas..."
                className="border-input bg-background focus-visible:ring-ring flex min-h-[80px] w-full rounded-lg border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
              />
            </div>

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
            No education or training added yet. Click &quot;Add Entry&quot; to get started.
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
                    <h4 className="font-medium">{entry.program}</h4>
                    <p className="text-muted-foreground text-sm">
                      {entry.institution}
                      {entry.degree && ` • ${entry.degree}`}
                    </p>
                    {(entry.startYear ?? entry.endYear) && (
                      <p className="text-muted-foreground text-xs">
                        {entry.startYear ?? ""} - {entry.endYear ?? "Present"}
                      </p>
                    )}
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

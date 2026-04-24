"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
} from "@/components/ui/modal";
import { Loader2, Plus, Edit, Trash2, GripVertical } from "lucide-react";
import { Select } from "@/components/ui/select";
import type { WorkHistory } from "@/lib/db/schema";
import { WORK_CATEGORIES, WORK_CATEGORY_LABELS } from "@/lib/db/schema/work-history";

interface WorkHistoryManagerProps {
  initialEntries: WorkHistory[];
}

interface FormData {
  showName: string;
  role: string;
  category: (typeof WORK_CATEGORIES)[number];
  location: string;
  director: string;
  productionCompany: string;
  isUnion: boolean;
  description: string;
}

const emptyForm: FormData = {
  showName: "",
  role: "",
  category: "theater",
  location: "",
  director: "",
  productionCompany: "",
  isUnion: false,
  description: "",
};

export function WorkHistoryManager({ initialEntries }: WorkHistoryManagerProps): React.ReactElement {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [entries, setEntries] = useState(initialEntries);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>(emptyForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const openAddModal = (): void => {
    setFormData(emptyForm);
    setEditingId(null);
    setIsModalOpen(true);
  };

  const openEditModal = (entry: WorkHistory): void => {
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
    setEditingId(entry.id);
    setIsModalOpen(true);
  };

  const handleSubmit = (): void => {
    startTransition(async () => {
      try {
        const url = editingId
          ? `/api/talent/work-history/${editingId}`
          : "/api/talent/work-history";
        const method = editingId ? "PUT" : "POST";

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
          const data = await response.json();
          throw new Error(data.error ?? "Failed to save entry");
        }

        const data = await response.json();

        if (editingId) {
          setEntries((prev) =>
            prev.map((e) => (e.id === editingId ? data.workHistory : e))
          );
        } else {
          setEntries((prev) => [...prev, data.workHistory]);
        }

        setIsModalOpen(false);
        toast({ title: editingId ? "Entry updated" : "Entry added" });
        router.refresh();
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to save",
        });
      }
    });
  };

  const handleDelete = (): void => {
    if (!deleteId) return;

    startTransition(async () => {
      try {
        const response = await fetch(`/api/talent/work-history/${deleteId}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          throw new Error("Failed to delete entry");
        }

        setEntries((prev) => prev.filter((e) => e.id !== deleteId));
        setDeleteId(null);
        toast({ title: "Entry deleted" });
        router.refresh();
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to delete",
        });
      }
    });
  };

  const categoryOptions = WORK_CATEGORIES.map((cat) => ({
    value: cat,
    label: WORK_CATEGORY_LABELS[cat],
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Work History</h1>
          <p className="text-muted-foreground text-sm">
            Manage your performance credits and experience
          </p>
        </div>
        <Button onClick={openAddModal}>
          <Plus className="mr-2 h-4 w-4" />
          Add Entry
        </Button>
      </div>

      {entries.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">No work history entries yet</p>
            <Button onClick={openAddModal}>
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Credit
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <Card key={entry.id}>
              <CardContent className="flex items-center gap-4 py-4">
                <div className="text-muted-foreground cursor-grab">
                  <GripVertical className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium">{entry.showName}</h3>
                      <p className="text-muted-foreground text-sm">{entry.role}</p>
                    </div>
                    <Badge variant="outline">
                      {WORK_CATEGORY_LABELS[entry.category]}
                    </Badge>
                  </div>
                  {(entry.director || entry.productionCompany || entry.location) && (
                    <p className="text-muted-foreground mt-1 text-sm">
                      {[entry.director, entry.productionCompany, entry.location]
                        .filter(Boolean)
                        .join(" • ")}
                    </p>
                  )}
                  {entry.isUnion && (
                    <Badge variant="secondary" className="mt-2">
                      Union
                    </Badge>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => { openEditModal(entry); }}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => { setDeleteId(entry.id); }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Modal open={isModalOpen} onOpenChange={setIsModalOpen}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>{editingId ? "Edit Entry" : "Add Work History"}</ModalTitle>
            <ModalDescription>
              Add a performance credit to your profile
            </ModalDescription>
          </ModalHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="showName" className="text-sm font-medium">
                Show/Production Name <span className="text-destructive">*</span>
              </label>
              <Input
                id="showName"
                value={formData.showName}
                onChange={(e) => { setFormData((p) => ({ ...p, showName: e.target.value })); }}
                placeholder="e.g., Hamilton, The Office"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="role" className="text-sm font-medium">
                Role <span className="text-destructive">*</span>
              </label>
              <Input
                id="role"
                value={formData.role}
                onChange={(e) => { setFormData((p) => ({ ...p, role: e.target.value })); }}
                placeholder="e.g., Lead, Supporting, Ensemble"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="category" className="text-sm font-medium">
                Category <span className="text-destructive">*</span>
              </label>
              <Select
                id="category"
                value={formData.category}
                onChange={(e) =>
                  { setFormData((p) => ({
                    ...p,
                    category: e.target.value as (typeof WORK_CATEGORIES)[number],
                  })); }
                }
                options={categoryOptions}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="director" className="text-sm font-medium">
                  Director
                </label>
                <Input
                  id="director"
                  value={formData.director}
                  onChange={(e) => { setFormData((p) => ({ ...p, director: e.target.value })); }}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="productionCompany" className="text-sm font-medium">
                  Production Company
                </label>
                <Input
                  id="productionCompany"
                  value={formData.productionCompany}
                  onChange={(e) =>
                    { setFormData((p) => ({ ...p, productionCompany: e.target.value })); }
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="workLocation" className="text-sm font-medium">
                Location
              </label>
              <Input
                id="workLocation"
                value={formData.location}
                onChange={(e) => { setFormData((p) => ({ ...p, location: e.target.value })); }}
                placeholder="e.g., Broadway, Los Angeles"
              />
            </div>

            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={formData.isUnion}
                onChange={(e) => { setFormData((p) => ({ ...p, isUnion: e.target.checked })); }}
                className="text-primary focus:ring-primary h-4 w-4 rounded border-gray-300"
              />
              <span className="text-sm font-medium">Union Production</span>
            </label>
          </div>
          <ModalFooter>
            <Button variant="outline" onClick={() => { setIsModalOpen(false); }}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isPending || !formData.showName || !formData.role}
            >
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {editingId ? "Update" : "Add"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal open={!!deleteId} onOpenChange={() => { setDeleteId(null); }}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Delete Entry</ModalTitle>
            <ModalDescription>
              Are you sure you want to delete this work history entry? This action cannot be
              undone.
            </ModalDescription>
          </ModalHeader>
          <ModalFooter>
            <Button variant="outline" onClick={() => { setDeleteId(null); }}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}

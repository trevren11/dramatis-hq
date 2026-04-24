"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
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
import type { Education } from "@/lib/db/schema";
import { DEGREE_TYPES } from "@/lib/db/schema/education";

interface EducationManagerProps {
  initialEntries: Education[];
}

interface FormData {
  program: string;
  degree: string;
  institution: string;
  location: string;
  startYear: string;
  endYear: string;
  description: string;
}

const emptyForm: FormData = {
  program: "",
  degree: "",
  institution: "",
  location: "",
  startYear: "",
  endYear: "",
  description: "",
};

export function EducationManager({ initialEntries }: EducationManagerProps): React.ReactElement {
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

  const openEditModal = (entry: Education): void => {
    setFormData({
      program: entry.program,
      degree: entry.degree ?? "",
      institution: entry.institution,
      location: entry.location ?? "",
      startYear: entry.startYear?.toString() ?? "",
      endYear: entry.endYear?.toString() ?? "",
      description: entry.description ?? "",
    });
    setEditingId(entry.id);
    setIsModalOpen(true);
  };

  const handleSubmit = (): void => {
    startTransition(async () => {
      try {
        const url = editingId
          ? `/api/talent/education/${editingId}`
          : "/api/talent/education";
        const method = editingId ? "PUT" : "POST";

        const response = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            program: formData.program,
            institution: formData.institution,
            degree: formData.degree || null,
            location: formData.location || null,
            startYear: formData.startYear ? parseInt(formData.startYear) : null,
            endYear: formData.endYear ? parseInt(formData.endYear) : null,
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
            prev.map((e) => (e.id === editingId ? data.education : e))
          );
        } else {
          setEntries((prev) => [...prev, data.education]);
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
        const response = await fetch(`/api/talent/education/${deleteId}`, {
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

  const degreeOptions = DEGREE_TYPES.map((deg) => ({
    value: deg,
    label: deg,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Education & Training</h1>
          <p className="text-muted-foreground text-sm">
            Manage your education and training history
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
            <p className="text-muted-foreground mb-4">No education entries yet</p>
            <Button onClick={openAddModal}>
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Entry
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
                  <h3 className="font-medium">{entry.program}</h3>
                  <p className="text-muted-foreground text-sm">
                    {entry.institution}
                    {entry.degree && ` • ${entry.degree}`}
                  </p>
                  {(entry.startYear || entry.endYear) && (
                    <p className="text-muted-foreground text-sm">
                      {entry.startYear ?? ""} - {entry.endYear ?? "Present"}
                    </p>
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
            <ModalTitle>{editingId ? "Edit Entry" : "Add Education"}</ModalTitle>
            <ModalDescription>
              Add education or training to your profile
            </ModalDescription>
          </ModalHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="program" className="text-sm font-medium">
                Program/Course <span className="text-destructive">*</span>
              </label>
              <Input
                id="program"
                value={formData.program}
                onChange={(e) => { setFormData((p) => ({ ...p, program: e.target.value })); }}
                placeholder="e.g., BFA in Acting, Shakespeare Workshop"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="institution" className="text-sm font-medium">
                Institution <span className="text-destructive">*</span>
              </label>
              <Input
                id="institution"
                value={formData.institution}
                onChange={(e) => { setFormData((p) => ({ ...p, institution: e.target.value })); }}
                placeholder="e.g., NYU Tisch, RADA"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="degree" className="text-sm font-medium">
                  Degree/Certificate
                </label>
                <Select
                  id="degree"
                  value={formData.degree}
                  onChange={(e) => { setFormData((p) => ({ ...p, degree: e.target.value })); }}
                  options={degreeOptions}
                  placeholder="Select type"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="eduLocation" className="text-sm font-medium">
                  Location
                </label>
                <Input
                  id="eduLocation"
                  value={formData.location}
                  onChange={(e) => { setFormData((p) => ({ ...p, location: e.target.value })); }}
                  placeholder="City, Country"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="startYear" className="text-sm font-medium">
                  Start Year
                </label>
                <Input
                  id="startYear"
                  type="number"
                  min="1950"
                  max="2100"
                  value={formData.startYear}
                  onChange={(e) => { setFormData((p) => ({ ...p, startYear: e.target.value })); }}
                  placeholder="2020"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="endYear" className="text-sm font-medium">
                  End Year
                </label>
                <Input
                  id="endYear"
                  type="number"
                  min="1950"
                  max="2100"
                  value={formData.endYear}
                  onChange={(e) => { setFormData((p) => ({ ...p, endYear: e.target.value })); }}
                  placeholder="2024 or leave blank if ongoing"
                />
              </div>
            </div>
          </div>
          <ModalFooter>
            <Button variant="outline" onClick={() => { setIsModalOpen(false); }}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isPending || !formData.program || !formData.institution}
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
              Are you sure you want to delete this education entry? This action cannot be
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

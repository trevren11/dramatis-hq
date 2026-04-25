"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";
import { DEPARTMENT_TYPE_OPTIONS, type DepartmentType } from "@/lib/db/schema/production-notes";

interface CreateDepartmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    type: DepartmentType;
    description?: string;
    color?: string;
  }) => Promise<void>;
  existingTypes: DepartmentType[];
  isLoading: boolean;
}

export function CreateDepartmentDialog({
  isOpen,
  onClose,
  onSubmit,
  existingTypes,
  isLoading,
}: CreateDepartmentDialogProps): React.ReactElement {
  const [name, setName] = useState("");
  const [type, setType] = useState<DepartmentType>("custom");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#6b7280");

  const availableTypes = DEPARTMENT_TYPE_OPTIONS.filter(
    (opt) => opt.value === "custom" || !existingTypes.includes(opt.value)
  );

  const handleTypeChange = (newType: DepartmentType): void => {
    setType(newType);
    const config = DEPARTMENT_TYPE_OPTIONS.find((opt) => opt.value === newType);
    if (config && newType !== "custom") {
      setName(config.label);
      setColor(config.color);
    }
  };

  const handleSubmit = async (e: React.SyntheticEvent): Promise<void> => {
    e.preventDefault();
    await onSubmit({ name, type, description: description || undefined, color });
    setName("");
    setType("custom");
    setDescription("");
    setColor("#6b7280");
  };

  const handleClose = (): void => {
    setName("");
    setType("custom");
    setDescription("");
    setColor("#6b7280");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Department</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            void handleSubmit(e);
          }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="type">Department Type</Label>
            <Select
              id="type"
              value={type}
              onChange={(e) => {
                handleTypeChange(e.target.value as DepartmentType);
              }}
              options={availableTypes.map((opt) => ({
                value: opt.value,
                label: opt.label,
              }))}
              placeholder="Select a type"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Department Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
              }}
              placeholder="Enter department name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
              }}
              placeholder="Brief description of this department"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="color">Color</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                id="color"
                value={color}
                onChange={(e) => {
                  setColor(e.target.value);
                }}
                className="h-10 w-14 cursor-pointer rounded border"
              />
              <Input
                value={color}
                onChange={(e) => {
                  setColor(e.target.value);
                }}
                className="w-28"
                placeholder="#000000"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || isLoading}>
              {isLoading ? "Creating..." : "Create Department"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import React, { useState } from "react";
import type { FormField } from "@/lib/db/schema/auditions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { PROFILE_MAPPING_OPTIONS } from "@/lib/form-builder/prebuilt-questions";
import { cn } from "@/lib/utils";
import { Plus, X, Trash2 } from "lucide-react";

interface FieldEditorProps {
  field: FormField | null;
  onChange: (field: FormField) => void;
  onDelete: () => void;
  className?: string;
}

/**
 * Editor panel for configuring a selected form field
 */
export function FieldEditor({
  field,
  onChange,
  onDelete,
  className,
}: FieldEditorProps): React.ReactElement {
  const [newOption, setNewOption] = useState("");

  if (!field) {
    return (
      <div className={cn("text-muted-foreground p-4 text-center", className)}>
        <p className="text-sm">Select a field to edit its properties</p>
      </div>
    );
  }

  const handleUpdate = (updates: Partial<FormField>): void => {
    onChange({ ...field, ...updates });
  };

  const handleAddOption = (): void => {
    if (!newOption.trim()) return;
    const options = [...(field.options ?? []), newOption.trim()];
    handleUpdate({ options });
    setNewOption("");
  };

  const handleRemoveOption = (index: number): void => {
    const options = field.options?.filter((_, i) => i !== index) ?? [];
    handleUpdate({ options });
  };

  const showOptionsEditor = field.type === "select" || field.type === "multiselect";

  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Field Properties</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="mr-1 h-4 w-4" />
          Delete
        </Button>
      </div>

      {/* Label */}
      <div className="space-y-2">
        <Label htmlFor="field-label">Label</Label>
        <Input
          id="field-label"
          value={field.label}
          onChange={(e) => {
            handleUpdate({ label: e.target.value });
          }}
          placeholder="Enter field label"
        />
      </div>

      {/* Placeholder */}
      {(field.type === "text" || field.type === "textarea" || field.type === "select") && (
        <div className="space-y-2">
          <Label htmlFor="field-placeholder">Placeholder</Label>
          <Input
            id="field-placeholder"
            value={field.placeholder ?? ""}
            onChange={(e) => {
              handleUpdate({ placeholder: e.target.value || undefined });
            }}
            placeholder="Enter placeholder text"
          />
        </div>
      )}

      {/* Required toggle */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label>Required</Label>
          <p className="text-muted-foreground text-xs">Must be answered to submit</p>
        </div>
        <Switch
          checked={field.required}
          onCheckedChange={(checked) => {
            handleUpdate({ required: checked });
          }}
        />
      </div>

      {/* Options editor for select/multiselect */}
      {showOptionsEditor && (
        <div className="space-y-3">
          <Label>Options</Label>
          <div className="space-y-2">
            {field.options?.map((option, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  value={option}
                  onChange={(e) => {
                    const options = [...(field.options ?? [])];
                    options[index] = e.target.value;
                    handleUpdate({ options });
                  }}
                  className="flex-1"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    handleRemoveOption(index);
                  }}
                  className="shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Input
              value={newOption}
              onChange={(e) => {
                setNewOption(e.target.value);
              }}
              placeholder="Add new option"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddOption();
                }
              }}
            />
            <Button variant="outline" size="icon" onClick={handleAddOption} className="shrink-0">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Profile mapping */}
      <div className="space-y-2">
        <Label>Auto-fill from Profile</Label>
        <Select
          value={field.profileMapping ?? "none"}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
            handleUpdate({
              profileMapping: e.target.value === "none" ? undefined : e.target.value,
            });
          }}
          options={[
            { value: "none", label: "No auto-fill" },
            ...PROFILE_MAPPING_OPTIONS.map((opt) => ({
              value: opt.value,
              label: opt.label,
            })),
          ]}
        />
        <p className="text-muted-foreground text-xs">
          Pre-fill this field with data from the talent&apos;s profile
        </p>
      </div>

      {/* Field ID (read-only) */}
      <div className="space-y-2">
        <Label className="text-muted-foreground">Field ID</Label>
        <Input value={field.id} disabled className="font-mono text-xs" />
      </div>
    </div>
  );
}

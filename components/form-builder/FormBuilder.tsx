"use client";

import React, { useState, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { FormField, FormFieldType } from "@/lib/db/schema/auditions";
import { createBlankField } from "@/lib/form-builder/prebuilt-questions";
import { FieldPalette, FIELD_TYPES } from "./FieldPalette";
import { FieldEditor } from "./FieldEditor";
import { PrebuiltQuestions } from "./PrebuiltQuestions";
import { FormPreview } from "./FormPreview";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { GripVertical, Save, X } from "lucide-react";

interface SortableFieldProps {
  field: FormField;
  isSelected: boolean;
  onSelect: () => void;
  onRemove: () => void;
}

function SortableField({
  field,
  isSelected,
  onSelect,
  onRemove,
}: SortableFieldProps): React.ReactElement {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: field.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const fieldTypeConfig = FIELD_TYPES.find((ft) => ft.type === field.type);
  const Icon = fieldTypeConfig?.icon;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group bg-card flex items-center gap-2 rounded-lg border p-3 transition-colors",
        isSelected && "border-primary ring-primary ring-1",
        isDragging && "opacity-50"
      )}
      onClick={onSelect}
    >
      <div
        {...attributes}
        {...listeners}
        className="text-muted-foreground hover:text-foreground cursor-grab touch-none"
      >
        <GripVertical className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="text-muted-foreground h-4 w-4" />}
          <span className="truncate text-sm font-medium">{field.label || "Untitled Field"}</span>
          {field.required && <span className="text-destructive text-xs">*</span>}
        </div>
        <p className="text-muted-foreground mt-0.5 text-xs">
          {fieldTypeConfig?.label ?? field.type}
        </p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="opacity-0 transition-opacity group-hover:opacity-100"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}

interface FormBuilderProps {
  fields: FormField[];
  onChange: (fields: FormField[]) => void;
  onSave: () => void;
  isSaving?: boolean;
  auditionTitle?: string;
  className?: string;
}

/**
 * Main form builder component with drag-and-drop functionality
 */
export function FormBuilder({
  fields,
  onChange,
  onSave,
  isSaving = false,
  auditionTitle,
  className,
}: FormBuilderProps): React.ReactElement {
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const selectedField = fields.find((f) => f.id === selectedFieldId) ?? null;

  const handleDragStart = useCallback((event: DragStartEvent): void => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent): void => {
      const { active, over } = event;
      setActiveId(null);

      if (!over) return;

      // Handle dropping from palette
      if (active.data.current?.type === "palette-item") {
        const fieldType = active.data.current.fieldType as FormFieldType;
        const newField = createBlankField(fieldType);

        // Find the index to insert at
        const overIndex = fields.findIndex((f) => f.id === over.id);
        const newFields = [...fields];

        if (overIndex >= 0) {
          newFields.splice(overIndex, 0, newField);
        } else {
          newFields.push(newField);
        }

        onChange(newFields);
        setSelectedFieldId(newField.id);
        return;
      }

      // Handle reordering existing fields
      if (active.id !== over.id) {
        const oldIndex = fields.findIndex((f) => f.id === active.id);
        const newIndex = fields.findIndex((f) => f.id === over.id);

        if (oldIndex !== -1 && newIndex !== -1) {
          onChange(arrayMove(fields, oldIndex, newIndex));
        }
      }
    },
    [fields, onChange]
  );

  const handleFieldUpdate = useCallback(
    (updatedField: FormField): void => {
      onChange(fields.map((f) => (f.id === updatedField.id ? updatedField : f)));
    },
    [fields, onChange]
  );

  const handleFieldDelete = useCallback((): void => {
    if (!selectedFieldId) return;
    onChange(fields.filter((f) => f.id !== selectedFieldId));
    setSelectedFieldId(null);
  }, [fields, onChange, selectedFieldId]);

  const handleAddPrebuilt = useCallback(
    (newFields: FormField[]): void => {
      onChange([...fields, ...newFields]);
      const firstField = newFields[0];
      if (firstField) {
        setSelectedFieldId(firstField.id);
      }
    },
    [fields, onChange]
  );

  const activeField = activeId ? fields.find((f) => f.id === activeId) : null;
  const activePaletteType = activeId?.startsWith("palette-")
    ? FIELD_TYPES.find((ft) => `palette-${ft.type}` === activeId)
    : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className={cn("grid grid-cols-12 gap-6", className)}>
        {/* Left Sidebar - Field Palette */}
        <div className="col-span-3 space-y-4">
          <Card>
            <CardContent className="p-4">
              <FieldPalette />
            </CardContent>
          </Card>
          <PrebuiltQuestions existingFieldIds={fields.map((f) => f.id)} onAdd={handleAddPrebuilt} />
        </div>

        {/* Center - Form Canvas */}
        <div className="col-span-6">
          <Card>
            <CardContent className="p-4">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold">Form Fields</h3>
                <div className="flex items-center gap-2">
                  <FormPreview fields={fields} auditionTitle={auditionTitle} />
                  <Button onClick={onSave} disabled={isSaving}>
                    <Save className="mr-2 h-4 w-4" />
                    {isSaving ? "Saving..." : "Save Form"}
                  </Button>
                </div>
              </div>

              <SortableContext
                items={fields.map((f) => f.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="min-h-[300px] space-y-2">
                  {fields.length === 0 ? (
                    <div className="text-muted-foreground flex h-[300px] flex-col items-center justify-center rounded-lg border-2 border-dashed">
                      <p className="text-sm">Drag fields here to build your form</p>
                      <p className="mt-1 text-xs">Or use the pre-built questions library</p>
                    </div>
                  ) : (
                    fields.map((field) => (
                      <SortableField
                        key={field.id}
                        field={field}
                        isSelected={field.id === selectedFieldId}
                        onSelect={() => {
                          setSelectedFieldId(field.id);
                        }}
                        onRemove={() => {
                          onChange(fields.filter((f) => f.id !== field.id));
                          if (selectedFieldId === field.id) {
                            setSelectedFieldId(null);
                          }
                        }}
                      />
                    ))
                  )}
                </div>
              </SortableContext>
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar - Field Editor */}
        <div className="col-span-3">
          <Card>
            <CardContent className="p-4">
              <FieldEditor
                field={selectedField}
                onChange={handleFieldUpdate}
                onDelete={handleFieldDelete}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeField && (
          <div className="bg-card rounded-lg border p-3 shadow-lg">
            <span className="text-sm font-medium">{activeField.label || "Untitled Field"}</span>
          </div>
        )}
        {activePaletteType && (
          <div className="bg-card flex items-center gap-3 rounded-lg border p-3 shadow-lg">
            <activePaletteType.icon className="h-4 w-4" />
            <span className="text-sm font-medium">{activePaletteType.label}</span>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}

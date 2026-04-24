"use client";

import React from "react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import type { FormFieldType } from "@/lib/db/schema/auditions";
import { cn } from "@/lib/utils";
import { Type, AlignLeft, List, ListChecks, ToggleLeft, Calendar, Upload } from "lucide-react";

interface FieldTypeConfig {
  type: FormFieldType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const FIELD_TYPES: FieldTypeConfig[] = [
  {
    type: "text",
    label: "Text",
    icon: Type,
    description: "Single line text input",
  },
  {
    type: "textarea",
    label: "Paragraph",
    icon: AlignLeft,
    description: "Multi-line text area",
  },
  {
    type: "select",
    label: "Dropdown",
    icon: List,
    description: "Single selection dropdown",
  },
  {
    type: "multiselect",
    label: "Checkboxes",
    icon: ListChecks,
    description: "Multiple selection checkboxes",
  },
  {
    type: "boolean",
    label: "Yes/No",
    icon: ToggleLeft,
    description: "Simple yes or no question",
  },
  {
    type: "date",
    label: "Date",
    icon: Calendar,
    description: "Date picker",
  },
  {
    type: "file",
    label: "File Upload",
    icon: Upload,
    description: "Upload a file",
  },
];

interface DraggableFieldTypeProps {
  config: FieldTypeConfig;
}

function DraggableFieldType({ config }: DraggableFieldTypeProps): React.ReactElement {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `palette-${config.type}`,
    data: {
      type: "palette-item",
      fieldType: config.type,
    },
  });

  const style = transform
    ? {
        transform: CSS.Translate.toString(transform),
      }
    : undefined;

  const Icon = config.icon;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        "bg-card hover:bg-accent flex cursor-grab items-center gap-3 rounded-lg border p-3 transition-colors",
        isDragging && "opacity-50"
      )}
    >
      <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-md">
        <Icon className="text-primary h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{config.label}</p>
        <p className="text-muted-foreground truncate text-xs">{config.description}</p>
      </div>
    </div>
  );
}

interface FieldPaletteProps {
  className?: string;
}

/**
 * Sidebar palette of draggable field types
 */
export function FieldPalette({ className }: FieldPaletteProps): React.ReactElement {
  return (
    <div className={cn("space-y-4", className)}>
      <div>
        <h3 className="mb-2 text-sm font-semibold">Field Types</h3>
        <p className="text-muted-foreground mb-4 text-xs">
          Drag and drop fields to add them to your form
        </p>
      </div>
      <div className="space-y-2">
        {FIELD_TYPES.map((config) => (
          <DraggableFieldType key={config.type} config={config} />
        ))}
      </div>
    </div>
  );
}

export { FIELD_TYPES };
export type { FieldTypeConfig };

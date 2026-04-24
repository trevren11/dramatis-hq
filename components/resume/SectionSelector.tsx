"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SelectableItem {
  id: string;
  label: string;
  sublabel?: string;
}

interface SectionSelectorProps {
  title: string;
  items: SelectableItem[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  className?: string;
}

export function SectionSelector({
  title,
  items,
  selectedIds,
  onSelectionChange,
  className,
}: SectionSelectorProps): React.ReactElement {
  const [isExpanded, setIsExpanded] = React.useState(true);

  const allSelected = items.length > 0 && items.every((item) => selectedIds.includes(item.id));

  const handleSelectAll = (): void => {
    if (allSelected) {
      onSelectionChange([]);
    } else {
      onSelectionChange(items.map((item) => item.id));
    }
  };

  const handleToggleItem = (id: string): void => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((selectedId) => selectedId !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  return (
    <div className={cn("bg-card rounded-lg border", className)}>
      <div className="flex items-center justify-between border-b p-3">
        <button
          type="button"
          onClick={() => {
            setIsExpanded(!isExpanded);
          }}
          className="flex flex-1 items-center gap-2 text-left font-medium"
        >
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          {title}
          <span className="text-muted-foreground text-sm font-normal">
            ({selectedIds.length}/{items.length})
          </span>
        </button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleSelectAll}
          className="text-xs"
        >
          {allSelected ? "Deselect All" : "Select All"}
        </Button>
      </div>

      {isExpanded && (
        <div className="max-h-64 overflow-y-auto p-2">
          {items.length === 0 ? (
            <p className="text-muted-foreground p-2 text-center text-sm">No items available</p>
          ) : (
            <ul className="space-y-1">
              {items.map((item) => {
                const isSelected = selectedIds.includes(item.id);
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => {
                        handleToggleItem(item.id);
                      }}
                      className={cn(
                        "flex w-full items-start gap-3 rounded-md p-2 text-left transition-colors",
                        isSelected ? "bg-primary/10 text-primary" : "hover:bg-muted"
                      )}
                    >
                      <div
                        className={cn(
                          "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                          isSelected
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-input"
                        )}
                      >
                        {isSelected && <Check className="h-3 w-3" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{item.label}</p>
                        {item.sublabel && (
                          <p className="text-muted-foreground truncate text-xs">{item.sublabel}</p>
                        )}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

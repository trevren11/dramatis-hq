"use client";

import React from "react";
import { useDroppable } from "@dnd-kit/core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { TalentCard, type TalentCardData } from "./TalentCard";
import { cn } from "@/lib/utils";
import { Layers, ChevronUp, ChevronDown } from "lucide-react";

interface DeckItem {
  talent: TalentCardData;
  sortOrder: number;
  notes?: string | null;
}

interface DeckAreaProps {
  items: DeckItem[];
  selectedTalentId?: string | null;
  onSelectTalent?: (talentId: string) => void;
  presenceMap?: Record<string, { name: string; color: string }>;
  isExpanded: boolean;
  onToggleExpand: () => void;
  disabled?: boolean;
}

export function DeckArea({
  items,
  selectedTalentId,
  onSelectTalent,
  presenceMap = {},
  isExpanded,
  onToggleExpand,
  disabled = false,
}: DeckAreaProps): React.ReactElement {
  const { isOver, setNodeRef } = useDroppable({
    id: "deck",
    data: {
      type: "deck",
    },
    disabled,
  });

  const sortedItems = [...items].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <Card
      ref={setNodeRef}
      className={cn(
        "transition-all",
        isOver && "border-primary bg-primary/5",
        !isExpanded && "cursor-pointer hover:bg-gray-50"
      )}
    >
      <CardHeader className="cursor-pointer pb-2" onClick={onToggleExpand}>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Layers className="h-4 w-4" />
            Holding Deck
            <Badge variant="secondary" className="ml-2">
              {items.length}
            </Badge>
          </CardTitle>
          <button className="rounded-full p-1 hover:bg-gray-100" onClick={onToggleExpand}>
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </button>
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent className="pb-4">
          {items.length === 0 ? (
            <div
              className={cn(
                "flex h-16 items-center justify-center rounded-md border-2 border-dashed",
                isOver ? "border-primary bg-primary/5" : "border-gray-200"
              )}
            >
              <p className="text-muted-foreground text-sm">Drag talent here to hold for later</p>
            </div>
          ) : (
            <ScrollArea className="w-full">
              <div className="flex gap-3 pb-2">
                {sortedItems.map((item) => (
                  <div key={item.talent.id} className="w-48 shrink-0">
                    <TalentCard
                      talent={{ ...item.talent, location: "deck" }}
                      compact
                      isSelected={selectedTalentId === item.talent.id}
                      selectedBy={presenceMap[item.talent.id]}
                      onSelect={() => onSelectTalent?.(item.talent.id)}
                      disabled={disabled}
                    />
                  </div>
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          )}
        </CardContent>
      )}
    </Card>
  );
}

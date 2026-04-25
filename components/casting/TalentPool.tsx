"use client";

import React, { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { TalentCard, TalentCardSkeleton, type TalentCardData } from "./TalentCard";
import { cn } from "@/lib/utils";
import { Search, Users } from "lucide-react";

interface TalentPoolProps {
  talents: TalentCardData[];
  selectedTalentId?: string | null;
  onSelectTalent?: (talentId: string) => void;
  presenceMap?: Record<string, { name: string; color: string }>;
  isLoading?: boolean;
  disabled?: boolean;
}

export function TalentPool({
  talents,
  selectedTalentId,
  onSelectTalent,
  presenceMap = {},
  isLoading = false,
  disabled = false,
}: TalentPoolProps): React.ReactElement {
  const [searchQuery, setSearchQuery] = useState("");

  const { isOver, setNodeRef } = useDroppable({
    id: "talent-pool",
    data: {
      type: "pool",
    },
    disabled,
  });

  const filteredTalents = talents.filter((talent) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const fullName = `${talent.firstName} ${talent.lastName}`.toLowerCase();
    const stageName = talent.stageName?.toLowerCase() ?? "";
    return fullName.includes(query) || stageName.includes(query);
  });

  return (
    <Card
      ref={setNodeRef}
      className={cn(
        "flex h-full flex-col transition-colors",
        isOver && "border-primary bg-primary/5"
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4" />
            Talent Pool
          </CardTitle>
          <Badge variant="secondary">{talents.length}</Badge>
        </div>
        <div className="relative mt-2">
          <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search talent..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
            }}
            className="pl-9"
          />
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full px-4 pb-4">
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <TalentCardSkeleton key={i} />
              ))}
            </div>
          ) : filteredTalents.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-center">
              <p className="text-muted-foreground text-sm">
                {searchQuery ? "No talent matches your search" : "No talent available"}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredTalents.map((talent) => (
                <TalentCard
                  key={talent.id}
                  talent={{ ...talent, location: "pool" }}
                  isSelected={selectedTalentId === talent.id}
                  selectedBy={presenceMap[talent.id]}
                  onSelect={() => {
                    onSelectTalent?.(talent.id);
                  }}
                  disabled={disabled}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

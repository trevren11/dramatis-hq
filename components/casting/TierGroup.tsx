"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronRight } from "lucide-react";

interface TierGroupProps {
  title: string;
  count: number;
  totalSlots: number;
  defaultExpanded?: boolean;
  children: React.ReactNode;
}

const TIER_COLORS: Record<string, string> = {
  Leads: "border-l-purple-500",
  Supporting: "border-l-blue-500",
  Ensemble: "border-l-green-500",
  Other: "border-l-gray-400",
};

export function TierGroup({
  title,
  count,
  totalSlots,
  defaultExpanded = true,
  children,
}: TierGroupProps): React.ReactElement {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const isFilled = count >= totalSlots;
  const percentage = totalSlots > 0 ? Math.round((count / totalSlots) * 100) : 0;

  const handleToggle = (): void => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className={cn("rounded-lg border-l-4 bg-white", TIER_COLORS[title] ?? TIER_COLORS.Other)}>
      <button
        onClick={handleToggle}
        className="flex w-full items-center justify-between p-3 text-left hover:bg-gray-50"
      >
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronRight className="h-4 w-4 text-gray-500" />
          )}
          <span className="font-semibold">{title}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-2 w-24 overflow-hidden rounded-full bg-gray-200">
            <div
              className={cn("h-full transition-all", isFilled ? "bg-green-500" : "bg-blue-500")}
              style={{ width: `${String(percentage)}%` }}
            />
          </div>
          <span className={cn("text-sm", isFilled ? "text-green-600" : "text-gray-600")}>
            {count}/{totalSlots}
          </span>
        </div>
      </button>
      {isExpanded && <div className="space-y-3 p-3 pt-0">{children}</div>}
    </div>
  );
}

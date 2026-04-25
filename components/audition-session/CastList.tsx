"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { CheckCircle, XCircle, Clock, Star, Users } from "lucide-react";

type DecisionType = "callback" | "hold_for_role" | "cast_in_role" | "release";

interface Role {
  id: string;
  name: string;
}

interface CastListItem {
  talentId: string;
  talentName: string;
  headshotUrl: string | null;
  queueNumber: number | null;
  decision: {
    type: DecisionType;
    roleId: string | null;
    notes: string | null;
    decidedAt: Date | string;
  } | null;
}

interface DecisionCounts {
  callback: number;
  holdForRole: number;
  castInRole: number;
  release: number;
  undecided: number;
}

interface CastListProps {
  items: CastListItem[];
  roles: Role[];
  counts: DecisionCounts;
  onSelectTalent: (talentId: string) => void;
  className?: string;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Running cast list showing all decisions made
 * Grouped by decision type with filtering
 */
export function CastList({
  items,
  roles,
  counts,
  onSelectTalent,
  className,
}: CastListProps): React.ReactElement {
  const [activeTab, setActiveTab] = useState<"all" | "callback" | "release" | "undecided">("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  // Filter items based on active tab and role filter
  const filteredItems = items.filter((item) => {
    // Tab filter
    if (activeTab === "callback") {
      if (
        !item.decision ||
        (item.decision.type !== "callback" &&
          item.decision.type !== "hold_for_role" &&
          item.decision.type !== "cast_in_role")
      ) {
        return false;
      }
    } else if (activeTab === "release") {
      if (item.decision?.type !== "release") {
        return false;
      }
    } else if (activeTab === "undecided") {
      if (item.decision) {
        return false;
      }
    }

    // Role filter (only for role-specific decisions)
    if (roleFilter !== "all") {
      if (item.decision?.roleId !== roleFilter) {
        return false;
      }
    }

    return true;
  });

  const totalCallbacks = counts.callback + counts.holdForRole + counts.castInRole;

  return (
    <Card className={cn("flex h-full flex-col", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Cast List
          </span>
          <div className="flex gap-1">
            <Badge variant="default" className="bg-green-500">
              {totalCallbacks} CB
            </Badge>
            <Badge variant="destructive">{counts.release} No</Badge>
          </div>
        </CardTitle>
      </CardHeader>

      <div className="border-b px-4 pb-3">
        <Tabs
          value={activeTab}
          onValueChange={(v) => {
            setActiveTab(v as typeof activeTab);
          }}
        >
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all" className="text-xs">
              All
            </TabsTrigger>
            <TabsTrigger value="callback" className="text-xs">
              <CheckCircle className="mr-1 h-3 w-3 text-green-500" />
              {totalCallbacks}
            </TabsTrigger>
            <TabsTrigger value="release" className="text-xs">
              <XCircle className="mr-1 h-3 w-3 text-red-500" />
              {counts.release}
            </TabsTrigger>
            <TabsTrigger value="undecided" className="text-xs">
              <Clock className="mr-1 h-3 w-3" />
              {counts.undecided}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Role filter */}
        {roles.length > 0 && activeTab === "callback" && (
          <div className="mt-2">
            <Select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
              }}
              options={[
                { value: "all", label: "All Roles" },
                ...roles.map((role) => ({ value: role.id, label: role.name })),
              ]}
              className="h-8 text-xs"
            />
          </div>
        )}
      </div>

      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full">
          <div className="space-y-1 p-2">
            {filteredItems.map((item) => (
              <button
                key={item.talentId}
                onClick={() => {
                  onSelectTalent(item.talentId);
                }}
                className={cn(
                  "flex w-full items-center gap-3 rounded-md p-2 text-left transition-colors",
                  "hover:bg-accent"
                )}
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={item.headshotUrl ?? undefined} />
                  <AvatarFallback className="text-xs">
                    {getInitials(item.talentName)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{item.talentName}</p>
                  {item.decision && (
                    <div className="flex items-center gap-1">
                      {item.decision.type === "callback" && (
                        <Badge variant="default" className="bg-green-500 text-xs">
                          Callback
                        </Badge>
                      )}
                      {item.decision.type === "hold_for_role" && (
                        <Badge variant="default" className="bg-amber-500 text-xs">
                          <Star className="mr-1 h-3 w-3" />
                          Hold: {roles.find((r) => r.id === item.decision?.roleId)?.name ?? "Role"}
                        </Badge>
                      )}
                      {item.decision.type === "cast_in_role" && (
                        <Badge variant="default" className="bg-green-600 text-xs">
                          <Star className="mr-1 h-3 w-3" />
                          Cast: {roles.find((r) => r.id === item.decision?.roleId)?.name ?? "Role"}
                        </Badge>
                      )}
                      {item.decision.type === "release" && (
                        <Badge variant="destructive" className="text-xs">
                          Released
                        </Badge>
                      )}
                    </div>
                  )}
                  {!item.decision && (
                    <span className="text-muted-foreground text-xs">Undecided</span>
                  )}
                </div>
                <span className="text-muted-foreground text-xs">#{item.queueNumber}</span>
              </button>
            ))}

            {filteredItems.length === 0 && (
              <div className="text-muted-foreground py-8 text-center text-sm">
                {activeTab === "all"
                  ? "No talent in queue"
                  : activeTab === "callback"
                    ? "No callbacks yet"
                    : activeTab === "release"
                      ? "No releases yet"
                      : "All talent have been decided"}
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>

      {/* Summary footer */}
      <div className="border-t px-4 py-2">
        <div className="text-muted-foreground flex justify-between text-xs">
          <span>Total: {items.length}</span>
          <span>
            Decided: {counts.callback + counts.holdForRole + counts.castInRole + counts.release} /{" "}
            {items.length}
          </span>
        </div>
      </div>
    </Card>
  );
}

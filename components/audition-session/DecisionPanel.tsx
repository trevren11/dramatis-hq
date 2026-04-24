"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { CheckCircle, XCircle, Undo, Star, Loader2 } from "lucide-react";

type DecisionType = "callback" | "no_thanks" | "callback_role";

interface Role {
  id: string;
  name: string;
}

interface CurrentDecision {
  id: string;
  type: DecisionType;
  roleId: string | null;
  notes: string | null;
}

interface DecisionPanelProps {
  talentId: string | null;
  talentName: string | null;
  currentDecision: CurrentDecision | null;
  roles: Role[];
  onDecision: (decision: DecisionType, roleId?: string, notes?: string) => Promise<void>;
  onUndo: () => Promise<void>;
  isLoading?: boolean;
  className?: string;
}

/**
 * Quick decision panel for callback/rejection
 */
// eslint-disable-next-line complexity
export function DecisionPanel({
  talentId,
  currentDecision,
  roles,
  onDecision,
  onUndo,
  isLoading = false,
  className,
}: DecisionPanelProps): React.ReactElement {
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [notes, setNotes] = useState("");

  const handleCallback = async (): Promise<void> => {
    if (!talentId) return;
    await onDecision("callback", undefined, notes || undefined);
    setNotes("");
  };

  const handleNoThanks = async (): Promise<void> => {
    if (!talentId) return;
    await onDecision("no_thanks", undefined, notes || undefined);
    setNotes("");
  };

  const handleCallbackRole = async (): Promise<void> => {
    if (!talentId || !selectedRole) return;
    await onDecision("callback_role", selectedRole, notes || undefined);
    setSelectedRole("");
    setNotes("");
  };

  const handleUndo = async (): Promise<void> => {
    await onUndo();
  };

  if (!talentId) {
    return (
      <Card className={cn("", className)}>
        <CardContent className="text-muted-foreground py-8 text-center">
          Select a talent to make a decision
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm">
          <span>Decision</span>
          {currentDecision && (
            <Badge
              variant={currentDecision.type === "no_thanks" ? "destructive" : "default"}
              className={cn(currentDecision.type !== "no_thanks" && "bg-green-500")}
            >
              {currentDecision.type === "callback" && "Callback"}
              {currentDecision.type === "callback_role" && "Callback for Role"}
              {currentDecision.type === "no_thanks" && "No Thanks"}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Quick decision buttons */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            className="border-green-500 bg-green-500/10 text-green-600 hover:bg-green-500/20"
            onClick={() => void handleCallback()}
            disabled={isLoading || !talentId}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="mr-2 h-4 w-4" />
            )}
            Callback
          </Button>
          <Button
            variant="outline"
            className="border-red-500 bg-red-500/10 text-red-600 hover:bg-red-500/20"
            onClick={() => void handleNoThanks()}
            disabled={isLoading || !talentId}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <XCircle className="mr-2 h-4 w-4" />
            )}
            No Thanks
          </Button>
        </div>

        {/* Callback for specific role */}
        {roles.length > 0 && (
          <div className="space-y-2">
            <label className="text-muted-foreground text-xs font-medium">Callback for Role</label>
            <div className="flex gap-2">
              <Select
                value={selectedRole}
                onChange={(e) => {
                  setSelectedRole(e.target.value);
                }}
                options={roles.map((role) => ({ value: role.id, label: role.name }))}
                placeholder="Select role"
                className="flex-1"
              />
              <Button
                variant="outline"
                className="border-green-600 bg-green-600/10 text-green-700 hover:bg-green-600/20"
                onClick={() => void handleCallbackRole()}
                disabled={isLoading || !selectedRole}
              >
                <Star className="mr-1 h-4 w-4" />
                CB
              </Button>
            </div>
          </div>
        )}

        {/* Notes input */}
        <div className="space-y-2">
          <label className="text-muted-foreground text-xs font-medium">Quick Note (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => {
              setNotes(e.target.value);
            }}
            placeholder="Add a note with your decision..."
            className="border-input bg-background placeholder:text-muted-foreground focus:ring-ring w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
            rows={2}
          />
        </div>

        {/* Undo button */}
        {currentDecision && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={() => void handleUndo()}
            disabled={isLoading}
          >
            <Undo className="mr-2 h-4 w-4" />
            Undo Decision
          </Button>
        )}

        {/* Keyboard hints */}
        <div className="text-muted-foreground border-t pt-2 text-center text-xs">
          Press <kbd className="bg-muted rounded px-1 py-0.5">C</kbd> for Callback,{" "}
          <kbd className="bg-muted rounded px-1 py-0.5">N</kbd> for No Thanks
        </div>
      </CardContent>
    </Card>
  );
}

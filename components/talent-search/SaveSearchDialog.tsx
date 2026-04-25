"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import type { TalentSearchFiltersValues } from "./TalentSearchFilters";

interface SaveSearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { name: string; description?: string; notifyOnMatch: boolean }) => Promise<void>;
  filters: TalentSearchFiltersValues;
  isLoading?: boolean;
}

export function SaveSearchDialog({
  isOpen,
  onClose,
  onSave,
  filters,
  isLoading = false,
}: SaveSearchDialogProps): React.ReactElement {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [notifyOnMatch, setNotifyOnMatch] = useState(false);

  const handleSubmit = (e: React.SyntheticEvent): void => {
    e.preventDefault();
    void (async () => {
      await onSave({
        name: name.trim(),
        description: description.trim() || undefined,
        notifyOnMatch,
      });
      setName("");
      setDescription("");
      setNotifyOnMatch(false);
      onClose();
    })();
  };

  const activeFiltersCount = Object.entries(filters).filter(([_, value]) => {
    if (value === undefined || value === null) return false;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === "boolean") return value;
    if (typeof value === "string") return value.length > 0;
    return true;
  }).length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save Search</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Search Name</Label>
              <Input
                id="name"
                placeholder="e.g., Broadway Tenors NYC"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                }}
                required
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                placeholder="Notes about this search..."
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                }}
                maxLength={500}
                rows={2}
              />
            </div>

            <div className="bg-muted rounded-lg p-3">
              <p className="text-muted-foreground text-sm">
                This search has <span className="font-medium">{activeFiltersCount}</span> active
                filter{activeFiltersCount !== 1 ? "s" : ""}.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="notify"
                checked={notifyOnMatch}
                onCheckedChange={(checked) => {
                  if (typeof checked === "boolean") setNotifyOnMatch(checked);
                }}
              />
              <Label htmlFor="notify" className="text-sm font-normal">
                Notify me when new talent matches this search
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || isLoading}>
              {isLoading ? "Saving..." : "Save Search"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

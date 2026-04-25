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
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Plus, Users, Check } from "lucide-react";
import { LIST_COLORS } from "@/lib/db/schema/talent-search";
import { cn } from "@/lib/utils";
import type { TalentCardData } from "./TalentCard";

interface TalentList {
  id: string;
  name: string;
  description?: string | null;
  color?: string | null;
  memberCount: number;
}

interface AddToListDialogProps {
  isOpen: boolean;
  onClose: () => void;
  talent: TalentCardData | null;
  lists: TalentList[];
  onAddToList: (listId: string, notes?: string) => Promise<void>;
  onCreateList: (data: { name: string; description?: string; color: string }) => Promise<string>;
  isLoading?: boolean;
}

export function AddToListDialog({
  isOpen,
  onClose,
  talent,
  lists,
  onAddToList,
  onCreateList,
  isLoading = false,
}: AddToListDialogProps): React.ReactElement {
  const [mode, setMode] = useState<"select" | "create">("select");
  const [selectedListId, setSelectedListId] = useState<string>("");
  const [notes, setNotes] = useState("");

  // Create new list fields
  const [newListName, setNewListName] = useState("");
  const [newListDescription, setNewListDescription] = useState("");
  const [newListColor, setNewListColor] = useState("blue");

  const handleSubmit = (e: React.SyntheticEvent): void => {
    e.preventDefault();
    void (async () => {
      if (mode === "create") {
        const newListId = await onCreateList({
          name: newListName.trim(),
          description: newListDescription.trim() || undefined,
          color: newListColor,
        });
        await onAddToList(newListId, notes.trim() || undefined);
      } else {
        await onAddToList(selectedListId, notes.trim() || undefined);
      }

      // Reset form
      setSelectedListId("");
      setNotes("");
      setNewListName("");
      setNewListDescription("");
      setNewListColor("blue");
      setMode("select");
      onClose();
    })();
  };

  const displayName = talent ? (talent.stageName ?? `${talent.firstName} ${talent.lastName}`) : "";

  const isValid = mode === "create" ? newListName.trim().length > 0 : selectedListId.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add to List</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {talent && (
              <div className="bg-muted rounded-lg p-3">
                <p className="text-sm">
                  Adding <span className="font-medium">{displayName}</span> to a list
                </p>
              </div>
            )}

            {/* Mode tabs */}
            <div className="flex gap-2">
              <Button
                type="button"
                variant={mode === "select" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setMode("select");
                }}
                className="flex-1"
              >
                <Users className="mr-2 h-4 w-4" />
                Existing List
              </Button>
              <Button
                type="button"
                variant={mode === "create" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setMode("create");
                }}
                className="flex-1"
              >
                <Plus className="mr-2 h-4 w-4" />
                New List
              </Button>
            </div>

            {mode === "select" ? (
              <>
                {lists.length === 0 ? (
                  <div className="py-8 text-center">
                    <p className="text-muted-foreground">No lists yet</p>
                    <Button
                      type="button"
                      variant="link"
                      onClick={() => {
                        setMode("create");
                      }}
                      className="mt-2"
                    >
                      Create your first list
                    </Button>
                  </div>
                ) : (
                  <ScrollArea className="h-[200px]">
                    <RadioGroup value={selectedListId} onValueChange={setSelectedListId}>
                      <div className="space-y-2">
                        {lists.map((list) => {
                          const colorHex =
                            LIST_COLORS.find((c) => c.value === list.color)?.hex ?? "#6B7280";
                          return (
                            <label
                              key={list.id}
                              className={cn(
                                "hover:bg-accent flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors",
                                selectedListId === list.id && "border-primary bg-accent"
                              )}
                            >
                              <RadioGroupItem value={list.id} className="sr-only" />
                              <div
                                className="h-3 w-3 rounded-full"
                                style={{ backgroundColor: colorHex }}
                              />
                              <div className="flex-1">
                                <p className="font-medium">{list.name}</p>
                                <p className="text-muted-foreground text-xs">
                                  {list.memberCount} member{list.memberCount !== 1 ? "s" : ""}
                                </p>
                              </div>
                              {selectedListId === list.id && (
                                <Check className="text-primary h-4 w-4" />
                              )}
                            </label>
                          );
                        })}
                      </div>
                    </RadioGroup>
                  </ScrollArea>
                )}
              </>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="listName">List Name</Label>
                  <Input
                    id="listName"
                    placeholder="e.g., Callbacks - Spring Musical"
                    value={newListName}
                    onChange={(e) => {
                      setNewListName(e.target.value);
                    }}
                    required
                    maxLength={100}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="listDescription">Description (optional)</Label>
                  <Textarea
                    id="listDescription"
                    placeholder="Notes about this list..."
                    value={newListDescription}
                    onChange={(e) => {
                      setNewListDescription(e.target.value);
                    }}
                    maxLength={500}
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Color</Label>
                  <div className="flex flex-wrap gap-2">
                    {LIST_COLORS.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        className={cn(
                          "h-8 w-8 rounded-full transition-all",
                          newListColor === color.value && "ring-primary ring-2 ring-offset-2"
                        )}
                        style={{ backgroundColor: color.hex }}
                        onClick={() => {
                          setNewListColor(color.value);
                        }}
                        title={color.label}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Notes for the talent */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add a note about this talent..."
                value={notes}
                onChange={(e) => {
                  setNotes(e.target.value);
                }}
                maxLength={500}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={!isValid || isLoading}>
              {isLoading ? "Adding..." : "Add to List"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

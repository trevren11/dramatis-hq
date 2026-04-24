"use client";

import React, { useState } from "react";
import type { FormField } from "@/lib/db/schema/auditions";
import {
  PREBUILT_QUESTIONS,
  QUESTION_CATEGORIES,
  generateFieldId,
} from "@/lib/form-builder/prebuilt-questions";
import { Button } from "@/components/ui/button";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
} from "@/components/ui/modal";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { Library, Plus } from "lucide-react";

interface PrebuiltQuestionsProps {
  existingFieldIds: string[];
  onAdd: (fields: FormField[]) => void;
}

/**
 * Modal dialog for selecting pre-built questions to add to the form
 */
export function PrebuiltQuestions({
  existingFieldIds,
  onAdd,
}: PrebuiltQuestionsProps): React.ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const handleToggle = (id: string): void => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleAdd = (): void => {
    const selectedQuestions = PREBUILT_QUESTIONS.filter((q) => selectedIds.has(q.id)).map((q) => ({
      ...q,
      id: existingFieldIds.includes(q.id) ? generateFieldId() : q.id,
    }));
    onAdd(selectedQuestions);
    setSelectedIds(new Set());
    setIsOpen(false);
  };

  const isAlreadyAdded = (id: string): boolean => existingFieldIds.includes(id);

  return (
    <>
      <Button
        variant="outline"
        onClick={(): void => {
          setIsOpen(true);
        }}
      >
        <Library className="mr-2 h-4 w-4" />
        Pre-built Questions
      </Button>

      <Modal open={isOpen} onOpenChange={setIsOpen}>
        <ModalContent className="max-w-2xl">
          <ModalHeader>
            <ModalTitle>Pre-built Questions Library</ModalTitle>
            <ModalDescription>
              Select common audition questions to add to your form
            </ModalDescription>
          </ModalHeader>
          <div className="max-h-[60vh] space-y-6 overflow-y-auto py-4">
            {QUESTION_CATEGORIES.map((category) => {
              const questions = PREBUILT_QUESTIONS.filter((q) =>
                (category.questionIds as readonly string[]).includes(q.id)
              );

              return (
                <div key={category.id}>
                  <h4 className="mb-3 text-sm font-medium">{category.label}</h4>
                  <div className="space-y-2">
                    {questions.map((question) => {
                      const alreadyAdded = isAlreadyAdded(question.id);
                      const isSelected = selectedIds.has(question.id);

                      return (
                        <label
                          key={question.id}
                          className={cn(
                            "flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors",
                            alreadyAdded && "bg-muted cursor-not-allowed opacity-50",
                            isSelected && !alreadyAdded && "border-primary bg-primary/5",
                            !alreadyAdded && !isSelected && "hover:bg-accent"
                          )}
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(): void => {
                              if (!alreadyAdded) handleToggle(question.id);
                            }}
                            disabled={alreadyAdded}
                            className="mt-0.5"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium">{question.label}</p>
                            <p className="text-muted-foreground text-xs">
                              {question.type} field
                              {question.required && " (required)"}
                              {alreadyAdded && " - Already added"}
                            </p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end gap-2 border-t pt-4">
            <Button
              variant="outline"
              onClick={(): void => {
                setIsOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleAdd} disabled={selectedIds.size === 0}>
              <Plus className="mr-2 h-4 w-4" />
              Add {String(selectedIds.size)} Question{selectedIds.size !== 1 ? "s" : ""}
            </Button>
          </div>
        </ModalContent>
      </Modal>
    </>
  );
}

"use client";

import React, { useState } from "react";
import type { FormField } from "@/lib/db/schema/auditions";
import { FieldPreview } from "./FieldPreview";
import { Button } from "@/components/ui/button";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
} from "@/components/ui/modal";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Eye } from "lucide-react";

interface FormPreviewProps {
  fields: FormField[];
  auditionTitle?: string;
  className?: string;
}

/**
 * Full form preview modal showing how the form will appear to talent
 */
export function FormPreview({
  fields,
  auditionTitle = "Audition Check-in",
  className,
}: FormPreviewProps): React.ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const [values, setValues] = useState<Record<string, string | string[] | boolean | null>>({});

  const handleValueChange = (fieldId: string, value: string | string[] | boolean | null): void => {
    setValues((prev) => ({ ...prev, [fieldId]: value }));
  };

  const handleReset = (): void => {
    setValues({});
  };

  return (
    <>
      <Button
        variant="outline"
        onClick={() => {
          setIsOpen(true);
        }}
        className={className}
      >
        <Eye className="mr-2 h-4 w-4" />
        Preview Form
      </Button>

      <Modal open={isOpen} onOpenChange={setIsOpen}>
        <ModalContent className="max-w-2xl">
          <ModalHeader>
            <ModalTitle>Form Preview</ModalTitle>
            <ModalDescription>
              This is how your form will appear to talent checking in
            </ModalDescription>
          </ModalHeader>
          <div className="max-h-[70vh] overflow-y-auto py-4">
            <Card>
              <CardHeader>
                <CardTitle>{auditionTitle}</CardTitle>
                <CardDescription>
                  Please fill out the following information to check in for your audition.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {fields.length === 0 ? (
                  <div className="text-muted-foreground py-8 text-center">
                    <p>No fields added to the form yet.</p>
                    <p className="mt-1 text-sm">
                      Drag fields from the palette or add pre-built questions.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {fields.map((field) => (
                      <FieldPreview
                        key={field.id}
                        field={field}
                        value={values[field.id]}
                        onChange={(value) => {
                          handleValueChange(field.id, value);
                        }}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end gap-2 border-t pt-4">
            <Button variant="outline" onClick={handleReset}>
              Reset
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setIsOpen(false);
              }}
            >
              Close
            </Button>
          </div>
        </ModalContent>
      </Modal>
    </>
  );
}

/**
 * Inline form preview (non-modal version)
 */
export function FormPreviewInline({
  fields,
  values,
  onChange,
  disabled,
  className,
}: {
  fields: FormField[];
  values: Record<string, string | string[] | boolean | null>;
  onChange: (fieldId: string, value: string | string[] | boolean | null) => void;
  disabled?: boolean;
  className?: string;
}): React.ReactElement {
  if (fields.length === 0) {
    return (
      <div className={cn("text-muted-foreground py-8 text-center", className)}>
        <p>No form fields configured for this audition.</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {fields.map((field) => (
        <FieldPreview
          key={field.id}
          field={field}
          value={values[field.id]}
          onChange={(value) => {
            onChange(field.id, value);
          }}
          disabled={disabled}
        />
      ))}
    </div>
  );
}

"use client";

import React, { useState, useCallback } from "react";
import type { FormField } from "@/lib/db/schema/auditions";
import { FormPreviewInline } from "@/components/form-builder/FormPreview";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CheckCircle, Loader2 } from "lucide-react";

interface CheckinFormProps {
  fields: FormField[];
  auditionTitle: string;
  auditionLocation?: string | null;
  initialValues?: Record<string, string | string[] | boolean | null>;
  onSubmit: (responses: Record<string, string | string[] | boolean | null>) => Promise<void>;
  isSubmitting?: boolean;
  className?: string;
}

/**
 * Dynamic check-in form for talent to complete
 */
export function CheckinForm({
  fields,
  auditionTitle,
  auditionLocation,
  initialValues = {},
  onSubmit,
  isSubmitting = false,
  className,
}: CheckinFormProps): React.ReactElement {
  const [values, setValues] =
    useState<Record<string, string | string[] | boolean | null>>(initialValues);
  const [errors, setErrors] = useState<string[]>([]);

  const handleValueChange = (fieldId: string, value: string | string[] | boolean | null): void => {
    setValues((prev) => ({ ...prev, [fieldId]: value }));
    // Clear errors when user makes changes
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  const validateForm = useCallback((): string[] => {
    const validationErrors: string[] = [];

    for (const field of fields) {
      const value = values[field.id];

      if (field.required) {
        if (value === undefined || value === null || value === "") {
          validationErrors.push(`${field.label} is required`);
          continue;
        }
        if (Array.isArray(value) && value.length === 0) {
          validationErrors.push(`${field.label} is required`);
        }
      }
    }

    return validationErrors;
  }, [fields, values]);

  const handleSubmit = useCallback(
    async (e: React.SyntheticEvent): Promise<void> => {
      e.preventDefault();

      const validationErrors = validateForm();
      if (validationErrors.length > 0) {
        setErrors(validationErrors);
        return;
      }

      try {
        await onSubmit(values);
      } catch (err) {
        console.error("Check-in failed:", err);
        setErrors(["Failed to check in. Please try again."]);
      }
    },
    [validateForm, onSubmit, values]
  );

  const onFormSubmit = useCallback(
    (e: React.SyntheticEvent): void => {
      void handleSubmit(e);
    },
    [handleSubmit]
  );

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle>{auditionTitle}</CardTitle>
        {auditionLocation && <CardDescription>{auditionLocation}</CardDescription>}
      </CardHeader>
      <CardContent>
        <form onSubmit={onFormSubmit} className="space-y-6">
          {fields.length > 0 ? (
            <FormPreviewInline
              fields={fields}
              values={values}
              onChange={handleValueChange}
              disabled={isSubmitting}
            />
          ) : (
            <p className="text-muted-foreground py-4 text-center text-sm">
              No additional information required. Click check in to continue.
            </p>
          )}

          {errors.length > 0 && (
            <div className="bg-destructive/10 rounded-lg p-4">
              <ul className="list-inside list-disc space-y-1">
                {errors.map((error, index) => (
                  <li key={String(index)} className="text-destructive text-sm">
                    {error}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Checking In...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Check In
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

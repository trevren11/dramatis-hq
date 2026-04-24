"use client";

import React from "react";
import type { FormField } from "@/lib/db/schema/auditions";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface FieldPreviewProps {
  field: FormField;
  value?: string | string[] | boolean | null;
  onChange?: (value: string | string[] | boolean | null) => void;
  disabled?: boolean;
  className?: string;
}

function getStringValue(value: string | string[] | boolean | null | undefined): string {
  if (typeof value === "string") return value;
  return "";
}

function TextFieldPreview({
  field,
  value,
  onChange,
  disabled,
}: {
  field: FormField;
  value: string | string[] | boolean | null | undefined;
  onChange: (val: string | string[] | boolean | null) => void;
  disabled: boolean;
}): React.ReactElement {
  return (
    <Input
      type="text"
      placeholder={field.placeholder}
      value={getStringValue(value)}
      onChange={(e): void => {
        onChange(e.target.value);
      }}
      disabled={disabled}
    />
  );
}

function TextareaFieldPreview({
  field,
  value,
  onChange,
  disabled,
}: {
  field: FormField;
  value: string | string[] | boolean | null | undefined;
  onChange: (val: string | string[] | boolean | null) => void;
  disabled: boolean;
}): React.ReactElement {
  return (
    <Textarea
      placeholder={field.placeholder}
      value={getStringValue(value)}
      onChange={(e): void => {
        onChange(e.target.value);
      }}
      disabled={disabled}
      rows={3}
    />
  );
}

function SelectFieldPreview({
  field,
  value,
  onChange,
  disabled,
}: {
  field: FormField;
  value: string | string[] | boolean | null | undefined;
  onChange: (val: string | string[] | boolean | null) => void;
  disabled: boolean;
}): React.ReactElement {
  const placeholderText = field.placeholder ?? "Select an option";
  return (
    <select
      value={getStringValue(value)}
      onChange={(e): void => {
        onChange(e.target.value);
      }}
      disabled={disabled}
      className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-lg border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
    >
      <option value="" disabled>
        {placeholderText}
      </option>
      {field.options?.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}

function MultiselectFieldPreview({
  field,
  value,
  onChange,
  disabled,
}: {
  field: FormField;
  value: string | string[] | boolean | null | undefined;
  onChange: (val: string | string[] | boolean | null) => void;
  disabled: boolean;
}): React.ReactElement {
  const selectedValues = Array.isArray(value) ? value : [];
  return (
    <div className="space-y-2">
      {field.options?.map((option) => (
        <label key={option} className="flex items-center gap-2">
          <Checkbox
            checked={selectedValues.includes(option)}
            onCheckedChange={(checked): void => {
              if (checked) {
                onChange([...selectedValues, option]);
              } else {
                onChange(selectedValues.filter((v) => v !== option));
              }
            }}
            disabled={disabled}
          />
          <span className="text-sm">{option}</span>
        </label>
      ))}
    </div>
  );
}

function BooleanFieldPreview({
  field,
  value,
  onChange,
  disabled,
}: {
  field: FormField;
  value: string | string[] | boolean | null | undefined;
  onChange: (val: string | string[] | boolean | null) => void;
  disabled: boolean;
}): React.ReactElement {
  return (
    <div className="flex items-center gap-2">
      <Checkbox
        id={field.id}
        checked={value === true}
        onCheckedChange={(checked): void => {
          onChange(checked);
        }}
        disabled={disabled}
      />
      <Label htmlFor={field.id} className="text-sm font-normal">
        Yes
      </Label>
    </div>
  );
}

function DateFieldPreview({
  value,
  onChange,
  disabled,
}: {
  value: string | string[] | boolean | null | undefined;
  onChange: (val: string | string[] | boolean | null) => void;
  disabled: boolean;
}): React.ReactElement {
  return (
    <Input
      type="date"
      value={getStringValue(value)}
      onChange={(e): void => {
        onChange(e.target.value);
      }}
      disabled={disabled}
    />
  );
}

function FileFieldPreview({
  onChange,
  disabled,
}: {
  onChange: (val: string | string[] | boolean | null) => void;
  disabled: boolean;
}): React.ReactElement {
  return (
    <Input
      type="file"
      onChange={(e): void => {
        const file = e.target.files?.[0];
        if (file) {
          onChange(file.name);
        }
      }}
      disabled={disabled}
    />
  );
}

/**
 * Renders a form field based on its type for preview or form submission
 */
export function FieldPreview({
  field,
  value,
  onChange,
  disabled = false,
  className,
}: FieldPreviewProps): React.ReactElement {
  const handleChange = (newValue: string | string[] | boolean | null): void => {
    onChange?.(newValue);
  };

  const renderField = (): React.ReactElement | null => {
    switch (field.type) {
      case "text":
        return (
          <TextFieldPreview
            field={field}
            value={value}
            onChange={handleChange}
            disabled={disabled}
          />
        );
      case "textarea":
        return (
          <TextareaFieldPreview
            field={field}
            value={value}
            onChange={handleChange}
            disabled={disabled}
          />
        );
      case "select":
        return (
          <SelectFieldPreview
            field={field}
            value={value}
            onChange={handleChange}
            disabled={disabled}
          />
        );
      case "multiselect":
        return (
          <MultiselectFieldPreview
            field={field}
            value={value}
            onChange={handleChange}
            disabled={disabled}
          />
        );
      case "boolean":
        return (
          <BooleanFieldPreview
            field={field}
            value={value}
            onChange={handleChange}
            disabled={disabled}
          />
        );
      case "date":
        return <DateFieldPreview value={value} onChange={handleChange} disabled={disabled} />;
      case "file":
        return <FileFieldPreview onChange={handleChange} disabled={disabled} />;
      default:
        return null;
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <Label className="flex items-center gap-1">
        {field.label}
        {field.required && <span className="text-destructive">*</span>}
      </Label>
      {renderField()}
    </div>
  );
}

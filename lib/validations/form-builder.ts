import { z } from "zod";
import { FORM_FIELD_TYPES, CHECKIN_STATUS_VALUES } from "@/lib/db/schema/auditions";

// Field type enum
const formFieldTypeSchema = z.enum(FORM_FIELD_TYPES);

// Single form field schema
export const formFieldSchema = z.object({
  id: z.string().min(1, "Field ID is required"),
  type: formFieldTypeSchema,
  label: z.string().min(1, "Label is required").max(200, "Label must be at most 200 characters"),
  required: z.boolean(),
  options: z.array(z.string().min(1).max(100)).max(50, "Maximum 50 options").optional(),
  profileMapping: z.string().max(100).optional(),
  placeholder: z.string().max(200, "Placeholder must be at most 200 characters").optional(),
});

// Validate options are provided for select/multiselect types
const fieldOptionsRefinement = (field: z.infer<typeof formFieldSchema>): boolean => {
  if (field.type === "select" || field.type === "multiselect") {
    return Array.isArray(field.options) && field.options.length > 0;
  }
  return true;
};

// Form field with refinement
export const formFieldWithOptionsSchema = formFieldSchema.refine(fieldOptionsRefinement, {
  message: "Select and multiselect fields must have at least one option",
  path: ["options"],
});

// Full form builder schema (array of fields)
export const formBuilderSchema = z.object({
  fields: z
    .array(formFieldSchema)
    .max(50, "Maximum 50 fields per form")
    .refine(
      (fields) => {
        const ids = fields.map((f) => f.id);
        return ids.length === new Set(ids).size;
      },
      { message: "Field IDs must be unique" }
    )
    .refine(
      (fields) =>
        fields.every((field) => {
          if (field.type === "select" || field.type === "multiselect") {
            return Array.isArray(field.options) && field.options.length > 0;
          }
          return true;
        }),
      { message: "Select and multiselect fields must have options" }
    ),
});

// Dynamic form response value schema
const responseValueSchema = z.union([
  z.string(),
  z.array(z.string()), // for multiselect
  z.boolean(), // for boolean fields
  z.null(),
]);

// Form response submission schema
export const formResponseSchema = z.object({
  responses: z.record(z.string(), responseValueSchema),
});

// Helper to check if a value is empty
function isEmptyValue(value: unknown): boolean {
  if (value === undefined || value === null || value === "") return true;
  if (Array.isArray(value) && value.length === 0) return true;
  return false;
}

// Validate a required field
function validateRequiredField(value: unknown, label: string, errors: string[]): boolean {
  if (value === undefined || value === null || value === "") {
    errors.push(`${label} is required`);
    return false;
  }
  if (Array.isArray(value) && value.length === 0) {
    errors.push(`${label} is required`);
    return false;
  }
  return true;
}

// Validate boolean field type
function validateBooleanField(value: unknown, label: string, errors: string[]): void {
  if (typeof value !== "boolean") {
    errors.push(`${label} must be a boolean`);
  }
}

// Validate select field type
function validateSelectField(
  value: unknown,
  label: string,
  options: string[] | undefined,
  errors: string[]
): void {
  if (typeof value !== "string") {
    errors.push(`${label} must be a string`);
  } else if (options && !options.includes(value)) {
    errors.push(`${label} has an invalid option`);
  }
}

// Validate multiselect field type
function validateMultiselectField(
  value: unknown,
  label: string,
  options: string[] | undefined,
  errors: string[]
): void {
  if (!Array.isArray(value)) {
    errors.push(`${label} must be an array`);
  } else if (options) {
    const invalidOptions = (value as string[]).filter((v) => !options.includes(v));
    if (invalidOptions.length > 0) {
      errors.push(`${label} has invalid options: ${invalidOptions.join(", ")}`);
    }
  }
}

// Validate date field type
function validateDateField(value: unknown, label: string, errors: string[]): void {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    errors.push(`${label} must be a valid date (YYYY-MM-DD)`);
  }
}

// Validate string field types (text, textarea, file)
function validateStringField(value: unknown, label: string, errors: string[]): void {
  if (typeof value !== "string") {
    errors.push(`${label} must be a string`);
  }
}

// Validate a single field value based on its type
function validateFieldValue(
  field: z.infer<typeof formFieldSchema>,
  value: unknown,
  errors: string[]
): void {
  switch (field.type) {
    case "boolean":
      validateBooleanField(value, field.label, errors);
      break;
    case "select":
      validateSelectField(value, field.label, field.options, errors);
      break;
    case "multiselect":
      validateMultiselectField(value, field.label, field.options, errors);
      break;
    case "date":
      validateDateField(value, field.label, errors);
      break;
    case "text":
    case "textarea":
    case "file":
      validateStringField(value, field.label, errors);
      break;
  }
}

// Validate responses against form fields (runtime validation function)
export function validateResponsesAgainstForm(
  responses: Record<string, unknown>,
  fields: z.infer<typeof formFieldSchema>[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  for (const field of fields) {
    const value = responses[field.id];

    // Check required fields
    if (field.required && !validateRequiredField(value, field.label, errors)) {
      continue;
    }

    // Skip validation if value is empty and not required
    if (isEmptyValue(value)) {
      continue;
    }

    // Type-specific validation
    validateFieldValue(field, value, errors);
  }

  return { valid: errors.length === 0, errors };
}

// Check-in status update schema
export const checkinUpdateSchema = z.object({
  status: z.enum(CHECKIN_STATUS_VALUES),
  queueNumber: z.number().int().positive().optional(),
});

// Check-in submit schema (combined form response + check in)
export const checkinSubmitSchema = z.object({
  responses: z.record(z.string(), responseValueSchema),
});

// Type exports
export type FormField = z.infer<typeof formFieldSchema>;
export type FormBuilder = z.infer<typeof formBuilderSchema>;
export type FormResponse = z.infer<typeof formResponseSchema>;
export type CheckinUpdate = z.infer<typeof checkinUpdateSchema>;
export type CheckinSubmit = z.infer<typeof checkinSubmitSchema>;

import { z } from "zod";
import { BUDGET_CATEGORY_VALUES, REIMBURSEMENT_STATUS_VALUES } from "@/lib/db/schema/budget";

// Budget schemas
export const budgetCreateSchema = z.object({
  name: z
    .string()
    .min(1, "Budget name is required")
    .max(255, "Name must be at most 255 characters"),
  description: z
    .string()
    .max(2000, "Description must be at most 2000 characters")
    .optional()
    .nullable(),
  totalAmount: z.coerce.number().min(0, "Total amount must be non-negative").optional().default(0),
  fiscalYearStart: z.coerce.date().optional().nullable(),
  fiscalYearEnd: z.coerce.date().optional().nullable(),
});

export const budgetUpdateSchema = budgetCreateSchema.partial();

// Budget line schemas
export const budgetLineCreateSchema = z.object({
  category: z.enum(BUDGET_CATEGORY_VALUES).default("miscellaneous"),
  customCategoryName: z
    .string()
    .max(100, "Custom category name must be at most 100 characters")
    .optional()
    .nullable(),
  description: z
    .string()
    .max(1000, "Description must be at most 1000 characters")
    .optional()
    .nullable(),
  budgetedAmount: z.coerce.number().min(0, "Budgeted amount must be non-negative").default(0),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

export const budgetLineUpdateSchema = budgetLineCreateSchema.partial();

export const budgetLineBulkCreateSchema = z.object({
  lines: z
    .array(budgetLineCreateSchema)
    .min(1, "At least one budget line is required")
    .max(50, "Maximum 50 budget lines can be created at once"),
});

export const budgetLineReorderSchema = z.object({
  lines: z
    .array(
      z.object({
        id: z.string().uuid("Invalid budget line ID"),
        sortOrder: z.number().int(),
      })
    )
    .min(1, "At least one budget line is required"),
});

// Expense schemas
export const expenseCreateSchema = z.object({
  budgetLineId: z.string().uuid("Invalid budget line ID").optional().nullable(),
  amount: z.coerce.number().positive("Amount must be greater than zero"),
  date: z.coerce.date(),
  vendor: z.string().max(255, "Vendor name must be at most 255 characters").optional().nullable(),
  description: z
    .string()
    .max(2000, "Description must be at most 2000 characters")
    .optional()
    .nullable(),
  isPaid: z.boolean().default(false),
  paymentMethod: z.string().max(100).optional().nullable(),
  paymentReference: z.string().max(255).optional().nullable(),
});

export const expenseUpdateSchema = expenseCreateSchema.partial();

export const expenseQuerySchema = z.object({
  budgetLineId: z.string().uuid().optional(),
  category: z.enum(BUDGET_CATEGORY_VALUES).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  isPaid: z.coerce.boolean().optional(),
  submittedBy: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

// Receipt upload schema
export const receiptUploadSchema = z.object({
  filename: z.string().min(1).max(255),
  mimeType: z.string().min(1).max(100),
});

// Reimbursement request schemas
export const reimbursementRequestCreateSchema = z.object({
  expenseId: z.string().uuid("Invalid expense ID"),
  amountRequested: z.coerce.number().positive("Amount must be greater than zero"),
  justification: z
    .string()
    .max(2000, "Justification must be at most 2000 characters")
    .optional()
    .nullable(),
});

export const reimbursementRequestUpdateSchema = z.object({
  amountRequested: z.coerce.number().positive("Amount must be greater than zero").optional(),
  justification: z
    .string()
    .max(2000, "Justification must be at most 2000 characters")
    .optional()
    .nullable(),
});

export const reimbursementReviewSchema = z.object({
  status: z.enum(["approved", "denied"]),
  reviewNote: z
    .string()
    .max(2000, "Review note must be at most 2000 characters")
    .optional()
    .nullable(),
});

export const reimbursementPaySchema = z.object({
  paymentReference: z.string().max(255).optional().nullable(),
});

export const reimbursementQuerySchema = z.object({
  status: z.enum(REIMBURSEMENT_STATUS_VALUES).optional(),
  requestedBy: z.string().uuid().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

// Report schemas
export const budgetReportQuerySchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  category: z.enum(BUDGET_CATEGORY_VALUES).optional(),
  groupBy: z.enum(["category", "date", "vendor"]).default("category"),
});

export const exportFormatSchema = z.object({
  format: z.enum(["csv", "pdf"]).default("csv"),
});

// Initialize budget with default categories
export const initializeBudgetSchema = z.object({
  name: z.string().min(1).max(255).optional().default("Production Budget"),
  categories: z.array(z.enum(BUDGET_CATEGORY_VALUES)).optional(),
  totalAmount: z.coerce.number().min(0).optional().default(0),
});

// Type exports
export type BudgetCreate = z.infer<typeof budgetCreateSchema>;
export type BudgetUpdate = z.infer<typeof budgetUpdateSchema>;
export type BudgetLineCreate = z.infer<typeof budgetLineCreateSchema>;
export type BudgetLineUpdate = z.infer<typeof budgetLineUpdateSchema>;
export type BudgetLineBulkCreate = z.infer<typeof budgetLineBulkCreateSchema>;
export type BudgetLineReorder = z.infer<typeof budgetLineReorderSchema>;
export type ExpenseCreate = z.infer<typeof expenseCreateSchema>;
export type ExpenseUpdate = z.infer<typeof expenseUpdateSchema>;
export type ExpenseQuery = z.infer<typeof expenseQuerySchema>;
export type ReceiptUpload = z.infer<typeof receiptUploadSchema>;
export type ReimbursementRequestCreate = z.infer<typeof reimbursementRequestCreateSchema>;
export type ReimbursementRequestUpdate = z.infer<typeof reimbursementRequestUpdateSchema>;
export type ReimbursementReview = z.infer<typeof reimbursementReviewSchema>;
export type ReimbursementPay = z.infer<typeof reimbursementPaySchema>;
export type ReimbursementQuery = z.infer<typeof reimbursementQuerySchema>;
export type BudgetReportQuery = z.infer<typeof budgetReportQuerySchema>;
export type ExportFormat = z.infer<typeof exportFormatSchema>;
export type InitializeBudget = z.infer<typeof initializeBudgetSchema>;

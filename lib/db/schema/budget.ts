import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  text,
  integer,
  decimal,
  index,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";
import { shows } from "./shows";
import { users } from "./users";

export const budgetCategoryEnum = pgEnum("budget_category", [
  "scenic",
  "costumes",
  "props",
  "lighting",
  "sound",
  "marketing",
  "venue",
  "royalties",
  "miscellaneous",
  "custom",
]);

export const reimbursementStatusEnum = pgEnum("reimbursement_status", [
  "pending",
  "approved",
  "denied",
  "paid",
]);

export const budgets = pgTable(
  "budgets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    showId: uuid("show_id")
      .references(() => shows.id, { onDelete: "cascade" })
      .notNull()
      .unique(),

    name: varchar("name", { length: 255 }).default("Production Budget").notNull(),
    description: text("description"),
    totalAmount: decimal("total_amount", { precision: 12, scale: 2 }).default("0").notNull(),
    fiscalYearStart: timestamp("fiscal_year_start", { mode: "date" }),
    fiscalYearEnd: timestamp("fiscal_year_end", { mode: "date" }),

    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("budgets_show_id_idx").on(table.showId),
    index("budgets_created_by_idx").on(table.createdBy),
  ]
);

export const budgetLines = pgTable(
  "budget_lines",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    budgetId: uuid("budget_id")
      .references(() => budgets.id, { onDelete: "cascade" })
      .notNull(),

    category: budgetCategoryEnum("category").default("miscellaneous").notNull(),
    customCategoryName: varchar("custom_category_name", { length: 100 }),
    description: text("description"),
    budgetedAmount: decimal("budgeted_amount", { precision: 12, scale: 2 }).default("0").notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    isActive: boolean("is_active").default(true).notNull(),

    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("budget_lines_budget_id_idx").on(table.budgetId),
    index("budget_lines_category_idx").on(table.category),
    index("budget_lines_sort_order_idx").on(table.sortOrder),
  ]
);

export const expenses = pgTable(
  "expenses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    showId: uuid("show_id")
      .references(() => shows.id, { onDelete: "cascade" })
      .notNull(),
    budgetLineId: uuid("budget_line_id").references(() => budgetLines.id, { onDelete: "set null" }),

    amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
    date: timestamp("date", { mode: "date" }).notNull(),
    vendor: varchar("vendor", { length: 255 }),
    description: text("description"),

    receiptUrl: varchar("receipt_url", { length: 500 }),
    receiptS3Key: varchar("receipt_s3_key", { length: 500 }),
    receiptFilename: varchar("receipt_filename", { length: 255 }),
    receiptMimeType: varchar("receipt_mime_type", { length: 100 }),

    isPaid: boolean("is_paid").default(false).notNull(),
    paymentMethod: varchar("payment_method", { length: 100 }),
    paymentReference: varchar("payment_reference", { length: 255 }),

    submittedBy: uuid("submitted_by")
      .references(() => users.id, { onDelete: "set null" })
      .notNull(),
    submittedAt: timestamp("submitted_at", { mode: "date" }).defaultNow().notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("expenses_show_id_idx").on(table.showId),
    index("expenses_budget_line_id_idx").on(table.budgetLineId),
    index("expenses_date_idx").on(table.date),
    index("expenses_submitted_by_idx").on(table.submittedBy),
    index("expenses_submitted_at_idx").on(table.submittedAt),
    index("expenses_is_paid_idx").on(table.isPaid),
  ]
);

export const reimbursementRequests = pgTable(
  "reimbursement_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    expenseId: uuid("expense_id")
      .references(() => expenses.id, { onDelete: "cascade" })
      .notNull()
      .unique(),

    status: reimbursementStatusEnum("status").default("pending").notNull(),
    amountRequested: decimal("amount_requested", { precision: 12, scale: 2 }).notNull(),
    justification: text("justification"),

    requestedBy: uuid("requested_by")
      .references(() => users.id, { onDelete: "set null" })
      .notNull(),
    requestedAt: timestamp("requested_at", { mode: "date" }).defaultNow().notNull(),

    reviewedBy: uuid("reviewed_by").references(() => users.id, { onDelete: "set null" }),
    reviewedAt: timestamp("reviewed_at", { mode: "date" }),
    reviewNote: text("review_note"),

    paidAt: timestamp("paid_at", { mode: "date" }),
    paidBy: uuid("paid_by").references(() => users.id, { onDelete: "set null" }),
    paymentReference: varchar("payment_reference", { length: 255 }),

    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("reimbursement_requests_expense_id_idx").on(table.expenseId),
    index("reimbursement_requests_status_idx").on(table.status),
    index("reimbursement_requests_requested_by_idx").on(table.requestedBy),
    index("reimbursement_requests_requested_at_idx").on(table.requestedAt),
    index("reimbursement_requests_reviewed_by_idx").on(table.reviewedBy),
  ]
);

// Type exports
export type Budget = typeof budgets.$inferSelect;
export type NewBudget = typeof budgets.$inferInsert;
export type BudgetLine = typeof budgetLines.$inferSelect;
export type NewBudgetLine = typeof budgetLines.$inferInsert;
export type Expense = typeof expenses.$inferSelect;
export type NewExpense = typeof expenses.$inferInsert;
export type ReimbursementRequest = typeof reimbursementRequests.$inferSelect;
export type NewReimbursementRequest = typeof reimbursementRequests.$inferInsert;

export type BudgetCategory = (typeof budgetCategoryEnum.enumValues)[number];
export type ReimbursementStatus = (typeof reimbursementStatusEnum.enumValues)[number];

// Constants
export const BUDGET_CATEGORY_OPTIONS = [
  { value: "scenic", label: "Scenic/Set", icon: "Mountain", color: "#22c55e" },
  { value: "costumes", label: "Costumes", icon: "Shirt", color: "#8b5cf6" },
  { value: "props", label: "Props", icon: "Package", color: "#14b8a6" },
  { value: "lighting", label: "Lighting", icon: "Lightbulb", color: "#fbbf24" },
  { value: "sound", label: "Sound", icon: "Volume2", color: "#06b6d4" },
  { value: "marketing", label: "Marketing", icon: "Megaphone", color: "#f97316" },
  { value: "venue", label: "Venue", icon: "Building", color: "#64748b" },
  { value: "royalties", label: "Royalties", icon: "FileText", color: "#3b82f6" },
  { value: "miscellaneous", label: "Miscellaneous", icon: "MoreHorizontal", color: "#6b7280" },
  { value: "custom", label: "Custom", icon: "Folder", color: "#a855f7" },
] as const;

export const BUDGET_CATEGORY_VALUES = [
  "scenic",
  "costumes",
  "props",
  "lighting",
  "sound",
  "marketing",
  "venue",
  "royalties",
  "miscellaneous",
  "custom",
] as const;

export const REIMBURSEMENT_STATUS_OPTIONS = [
  { value: "pending", label: "Pending Review", color: "#f59e0b" },
  { value: "approved", label: "Approved", color: "#22c55e" },
  { value: "denied", label: "Denied", color: "#ef4444" },
  { value: "paid", label: "Paid", color: "#3b82f6" },
] as const;

export const REIMBURSEMENT_STATUS_VALUES = ["pending", "approved", "denied", "paid"] as const;

export const PAYMENT_METHOD_OPTIONS = [
  { value: "check", label: "Check" },
  { value: "direct_deposit", label: "Direct Deposit" },
  { value: "cash", label: "Cash" },
  { value: "credit_card", label: "Credit Card" },
  { value: "petty_cash", label: "Petty Cash" },
  { value: "other", label: "Other" },
] as const;

export const ALLOWED_RECEIPT_FILE_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
] as const;

export const MAX_RECEIPT_FILE_SIZE = 10 * 1024 * 1024; // 10MB

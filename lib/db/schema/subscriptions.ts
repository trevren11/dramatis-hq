import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  integer,
  text,
  index,
  pgEnum,
} from "drizzle-orm/pg-core";
import { producerProfiles } from "./producer-profiles";

export const subscriptionPlanEnum = pgEnum("subscription_plan", ["monthly", "annual"]);

export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "trialing",
  "active",
  "past_due",
  "canceled",
  "unpaid",
  "incomplete",
  "incomplete_expired",
]);

export const invoiceStatusEnum = pgEnum("invoice_status", [
  "draft",
  "open",
  "paid",
  "uncollectible",
  "void",
]);

export const subscriptions = pgTable(
  "subscriptions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .references(() => producerProfiles.id, { onDelete: "cascade" })
      .notNull()
      .unique(),
    stripeCustomerId: varchar("stripe_customer_id", { length: 255 }).notNull(),
    stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }),
    plan: subscriptionPlanEnum("plan"),
    status: subscriptionStatusEnum("status").notNull().default("trialing"),
    currentPeriodStart: timestamp("current_period_start", { mode: "date" }),
    currentPeriodEnd: timestamp("current_period_end", { mode: "date" }),
    canceledAt: timestamp("canceled_at", { mode: "date" }),
    cancelAtPeriodEnd: timestamp("cancel_at_period_end", { mode: "date" }),
    trialEnd: timestamp("trial_end", { mode: "date" }),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("subscriptions_organization_id_idx").on(table.organizationId),
    index("subscriptions_stripe_customer_id_idx").on(table.stripeCustomerId),
    index("subscriptions_stripe_subscription_id_idx").on(table.stripeSubscriptionId),
    index("subscriptions_status_idx").on(table.status),
  ]
);

export const invoices = pgTable(
  "invoices",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .references(() => producerProfiles.id, { onDelete: "cascade" })
      .notNull(),
    stripeInvoiceId: varchar("stripe_invoice_id", { length: 255 }).notNull().unique(),
    amountDue: integer("amount_due").notNull(),
    amountPaid: integer("amount_paid").notNull().default(0),
    currency: varchar("currency", { length: 3 }).notNull().default("usd"),
    status: invoiceStatusEnum("status").notNull(),
    invoiceUrl: text("invoice_url"),
    invoicePdf: text("invoice_pdf"),
    paidAt: timestamp("paid_at", { mode: "date" }),
    periodStart: timestamp("period_start", { mode: "date" }),
    periodEnd: timestamp("period_end", { mode: "date" }),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("invoices_organization_id_idx").on(table.organizationId),
    index("invoices_stripe_invoice_id_idx").on(table.stripeInvoiceId),
    index("invoices_status_idx").on(table.status),
  ]
);

export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;
export type Invoice = typeof invoices.$inferSelect;
export type NewInvoice = typeof invoices.$inferInsert;

export const SUBSCRIPTION_PLAN_OPTIONS = [
  { value: "monthly", label: "Monthly", interval: "month" },
  { value: "annual", label: "Annual", interval: "year" },
] as const;

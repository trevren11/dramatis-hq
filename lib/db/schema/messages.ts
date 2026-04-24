import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  pgEnum,
  text,
  boolean,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users";

export const conversationTypeEnum = pgEnum("conversation_type", ["direct", "group", "show_cast"]);

export const conversations = pgTable(
  "conversations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    type: conversationTypeEnum("type").notNull().default("direct"),
    subject: varchar("subject", { length: 255 }),
    // For show_cast conversations, reference to show (future)
    showId: uuid("show_id"),
    createdById: uuid("created_by_id").references(() => users.id, { onDelete: "set null" }),
    lastMessageAt: timestamp("last_message_at", { mode: "date" }),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("conversations_created_by_idx").on(table.createdById),
    index("conversations_last_message_at_idx").on(table.lastMessageAt),
    index("conversations_type_idx").on(table.type),
  ]
);

export const conversationParticipants = pgTable(
  "conversation_participants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    conversationId: uuid("conversation_id")
      .references(() => conversations.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    lastReadAt: timestamp("last_read_at", { mode: "date" }),
    isArchived: boolean("is_archived").default(false),
    isMuted: boolean("is_muted").default(false),
    joinedAt: timestamp("joined_at", { mode: "date" }).defaultNow().notNull(),
    leftAt: timestamp("left_at", { mode: "date" }),
  },
  (table) => [
    index("conversation_participants_conversation_idx").on(table.conversationId),
    index("conversation_participants_user_idx").on(table.userId),
    index("conversation_participants_user_conversation_idx").on(table.userId, table.conversationId),
  ]
);

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    conversationId: uuid("conversation_id")
      .references(() => conversations.id, { onDelete: "cascade" })
      .notNull(),
    senderId: uuid("sender_id").references(() => users.id, { onDelete: "set null" }),
    content: text("content").notNull(),
    // Reply threading
    parentMessageId: uuid("parent_message_id"),
    // Attachments stored as JSON array
    attachments: text("attachments"), // JSON string of file references
    isEdited: boolean("is_edited").default(false),
    editedAt: timestamp("edited_at", { mode: "date" }),
    deletedAt: timestamp("deleted_at", { mode: "date" }),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("messages_conversation_idx").on(table.conversationId),
    index("messages_sender_idx").on(table.senderId),
    index("messages_created_at_idx").on(table.createdAt),
    index("messages_parent_message_idx").on(table.parentMessageId),
  ]
);

// Self-reference for message threading
export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
  }),
  parentMessage: one(messages, {
    fields: [messages.parentMessageId],
    references: [messages.id],
    relationName: "messageReplies",
  }),
}));

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [conversations.createdById],
    references: [users.id],
  }),
  participants: many(conversationParticipants),
  messages: many(messages),
}));

export const conversationParticipantsRelations = relations(conversationParticipants, ({ one }) => ({
  conversation: one(conversations, {
    fields: [conversationParticipants.conversationId],
    references: [conversations.id],
  }),
  user: one(users, {
    fields: [conversationParticipants.userId],
    references: [users.id],
  }),
}));

// Message templates for producers
export const messageTemplates = pgTable(
  "message_templates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    subject: varchar("subject", { length: 255 }),
    content: text("content").notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [index("message_templates_user_idx").on(table.userId)]
);

export const messageTemplatesRelations = relations(messageTemplates, ({ one }) => ({
  user: one(users, {
    fields: [messageTemplates.userId],
    references: [users.id],
  }),
}));

// Types
export type Conversation = typeof conversations.$inferSelect;
export type NewConversation = typeof conversations.$inferInsert;
export type ConversationParticipant = typeof conversationParticipants.$inferSelect;
export type NewConversationParticipant = typeof conversationParticipants.$inferInsert;
export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;
export type MessageTemplate = typeof messageTemplates.$inferSelect;
export type NewMessageTemplate = typeof messageTemplates.$inferInsert;

// Constants
export const CONVERSATION_TYPES = ["direct", "group", "show_cast"] as const;

export const CONVERSATION_TYPE_LABELS: Record<(typeof CONVERSATION_TYPES)[number], string> = {
  direct: "Direct Message",
  group: "Group Message",
  show_cast: "Show Cast",
};

import { z } from "zod";
import { CONVERSATION_TYPES } from "@/lib/db/schema/messages";

// Compose a new conversation
export const composeMessageSchema = z.object({
  recipientIds: z.array(z.string().uuid()).min(1, "At least one recipient is required"),
  subject: z.string().max(255).optional().nullable(),
  content: z.string().min(1, "Message content is required").max(10000),
  conversationType: z.enum(CONVERSATION_TYPES).default("direct"),
  attachments: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        url: z.string().url(),
        type: z.string(),
        size: z.number(),
      })
    )
    .optional(),
});

// Reply to existing conversation
export const replyMessageSchema = z.object({
  content: z.string().min(1, "Message content is required").max(10000),
  parentMessageId: z.string().uuid().optional(),
  attachments: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        url: z.string().url(),
        type: z.string(),
        size: z.number(),
      })
    )
    .optional(),
});

// Update message (edit)
export const updateMessageSchema = z.object({
  content: z.string().min(1, "Message content is required").max(10000),
});

// Search messages
export const searchMessagesSchema = z.object({
  query: z.string().min(1).max(255),
  conversationId: z.string().uuid().optional(),
  senderId: z.string().uuid().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
});

// Inbox query params
export const inboxQuerySchema = z.object({
  filter: z.enum(["all", "unread", "archived"]).default("all"),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
});

// Conversation actions
export const conversationActionSchema = z.object({
  action: z.enum(["archive", "unarchive", "mute", "unmute", "markRead"]),
});

// Bulk conversation actions
export const bulkConversationActionSchema = z.object({
  conversationIds: z.array(z.string().uuid()).min(1),
  action: z.enum(["archive", "unarchive", "markRead", "delete"]),
});

// Message template
export const messageTemplateSchema = z.object({
  name: z.string().min(1, "Template name is required").max(255),
  subject: z.string().max(255).optional().nullable(),
  content: z.string().min(1, "Template content is required").max(10000),
});

// Bulk send to cast
export const bulkSendSchema = z.object({
  recipientIds: z.array(z.string().uuid()).min(1, "At least one recipient is required"),
  subject: z.string().max(255).optional().nullable(),
  content: z.string().min(1, "Message content is required").max(10000),
  templateId: z.string().uuid().optional(),
  scheduledAt: z.coerce.date().optional(),
});

// Types
export type ComposeMessageInput = z.infer<typeof composeMessageSchema>;
export type ReplyMessageInput = z.infer<typeof replyMessageSchema>;
export type UpdateMessageInput = z.infer<typeof updateMessageSchema>;
export type SearchMessagesInput = z.infer<typeof searchMessagesSchema>;
export type InboxQuery = z.infer<typeof inboxQuerySchema>;
export type ConversationAction = z.infer<typeof conversationActionSchema>;
export type BulkConversationAction = z.infer<typeof bulkConversationActionSchema>;
export type MessageTemplateInput = z.infer<typeof messageTemplateSchema>;
export type BulkSendInput = z.infer<typeof bulkSendSchema>;

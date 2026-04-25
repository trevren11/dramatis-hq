import { triggerEvent, CHANNELS, EVENTS } from "../pusher-server";

// Types for message events
export interface MessageSender {
  id: string;
  name: string | null;
  image: string | null;
  email: string;
}

export interface MessageAttachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
}

export interface Message {
  id: string;
  content: string;
  createdAt: Date | string;
  parentMessageId: string | null;
  attachments: MessageAttachment[];
  sender: MessageSender;
}

export interface MessageSentEvent {
  message: Message;
  conversationId: string;
}

export interface MessageUpdatedEvent {
  messageId: string;
  content: string;
  conversationId: string;
  editedAt: string;
}

export interface MessageDeletedEvent {
  messageId: string;
  conversationId: string;
}

export interface TypingEvent {
  user: {
    id: string;
    name: string;
  };
}

// Broadcast functions
export async function broadcastMessageSent(
  conversationId: string,
  message: Message
): Promise<void> {
  await triggerEvent<MessageSentEvent>(CHANNELS.chat(conversationId), EVENTS.MESSAGE_SENT, {
    message,
    conversationId,
  });
}

export async function broadcastMessageUpdated(
  conversationId: string,
  messageId: string,
  content: string
): Promise<void> {
  await triggerEvent<MessageUpdatedEvent>(
    CHANNELS.chat(conversationId),
    EVENTS.MESSAGE_UPDATED,
    {
      messageId,
      content,
      conversationId,
      editedAt: new Date().toISOString(),
    }
  );
}

export async function broadcastMessageDeleted(
  conversationId: string,
  messageId: string
): Promise<void> {
  await triggerEvent<MessageDeletedEvent>(
    CHANNELS.chat(conversationId),
    EVENTS.MESSAGE_DELETED,
    {
      messageId,
      conversationId,
    }
  );
}

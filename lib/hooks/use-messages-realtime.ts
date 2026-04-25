"use client";

import { useMemo } from "react";
import { useRealtimeChannel, type ConnectionState } from "./use-realtime";
import { useTypingIndicator, type PresenceMember } from "./use-presence";
import { CHANNELS, EVENTS } from "@/lib/realtime-constants";

interface MessageSender {
  id: string;
  name: string;
  image: string | null;
  email: string;
}

interface MessageEvent {
  message: {
    id: string;
    content: string;
    createdAt: string;
    parentMessageId: string | null;
    attachments: unknown[];
    sender: MessageSender;
  };
  conversationId: string;
}

interface MessageReadEvent {
  messageId: string;
  userId: string;
  readAt: string;
}

interface UseMessagesRealtimeOptions {
  onMessageReceived?: (message: MessageEvent["message"]) => void;
  onMessageRead?: (event: MessageReadEvent) => void;
  enabled?: boolean;
}

interface UseMessagesRealtimeReturn {
  isConnected: boolean;
  connectionState: ConnectionState;
  error: Error | null;
  typingUsers: PresenceMember[];
  startTyping: () => void;
  stopTyping: () => void;
}

export function useMessagesRealtime(
  conversationId: string,
  options: UseMessagesRealtimeOptions = {}
): UseMessagesRealtimeReturn {
  const { onMessageReceived, onMessageRead, enabled = true } = options;

  const chatChannel = CHANNELS.chat(conversationId);

  const events = useMemo(
    () => ({
      [EVENTS.MESSAGE_SENT]: (data: unknown) => {
        const event = data as MessageEvent;
        onMessageReceived?.(event.message);
      },
      [EVENTS.MESSAGE_READ]: (data: unknown) => {
        const event = data as MessageReadEvent;
        onMessageRead?.(event);
      },
    }),
    [onMessageReceived, onMessageRead]
  );

  const { isConnected, connectionState, error } = useRealtimeChannel(chatChannel, events, {
    enabled,
  });

  // Typing indicators - uses presence channel for chat
  const presenceChannel = `presence-chat-${conversationId}`;
  const { typingUsers, startTyping, stopTyping } = useTypingIndicator(presenceChannel, {
    enabled,
    timeout: 3000,
  });

  return {
    isConnected,
    connectionState,
    error,
    typingUsers,
    startTyping,
    stopTyping,
  };
}

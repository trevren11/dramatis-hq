"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Send, Archive, BellOff, Trash2, Loader2, Users } from "lucide-react";

interface Participant {
  id: string;
  name: string | null;
  image: string | null;
  email: string;
  isActive: boolean;
}

interface MessageItem {
  id: string;
  content: string;
  createdAt: string;
  isEdited: boolean;
  editedAt: string | null;
  parentMessageId: string | null;
  attachments: {
    id: string;
    name: string;
    url: string;
    type: string;
    size: number;
  }[];
  sender: {
    id: string;
    name: string | null;
    image: string | null;
    email: string;
  } | null;
  isOwn: boolean;
}

interface ConversationData {
  id: string;
  type: "direct" | "group" | "show_cast";
  subject: string | null;
  createdAt: string;
  participants: Participant[];
}

interface ConversationThreadProps {
  conversationId: string;
}

export function ConversationThread({
  conversationId,
}: ConversationThreadProps): React.ReactElement {
  const router = useRouter();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [conversation, setConversation] = useState<ConversationData | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isActioning, setIsActioning] = useState(false);

  const fetchConversation = useCallback(async (): Promise<void> => {
    try {
      const response = await fetch(`/api/messages/${conversationId}`);
      if (!response.ok) {
        if (response.status === 404) {
          toast({
            variant: "destructive",
            title: "Not found",
            description: "Conversation not found",
          });
          router.push("/messages");
          return;
        }
        throw new Error("Failed to fetch conversation");
      }

      const data = (await response.json()) as {
        conversation: ConversationData;
        messages: MessageItem[];
      };
      setConversation(data.conversation);
      setMessages(data.messages);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load conversation",
      });
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, router, toast]);

  useEffect(() => {
    void fetchConversation();
  }, [fetchConversation]);

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (): Promise<void> => {
    if (!newMessage.trim()) return;

    setIsSending(true);
    try {
      const response = await fetch(`/api/messages/${conversationId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newMessage.trim() }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      const data = (await response.json()) as { message: MessageItem };

      // Add the new message with sender info
      const newMessageWithSender: MessageItem = {
        ...data.message,
        sender: conversation?.participants.find((p) => p.isActive) ?? null,
        isOwn: true,
        isEdited: false,
        editedAt: null,
        attachments: [],
      };

      setMessages([...messages, newMessageWithSender]);
      setNewMessage("");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send message",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleAction = async (
    action: "archive" | "unarchive" | "mute" | "unmute" | "markRead"
  ): Promise<void> => {
    setIsActioning(true);
    try {
      const response = await fetch(`/api/messages/${conversationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      if (!response.ok) {
        throw new Error("Failed to perform action");
      }

      toast({
        title: "Success",
        description: `Conversation ${action === "markRead" ? "marked as read" : action + "d"}`,
      });

      if (action === "archive") {
        router.push("/messages");
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Action failed",
      });
    } finally {
      setIsActioning(false);
    }
  };

  const handleLeave = async (): Promise<void> => {
    if (!confirm("Are you sure you want to leave this conversation?")) return;

    setIsActioning(true);
    try {
      const response = await fetch(`/api/messages/${conversationId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to leave conversation");
      }

      toast({
        title: "Success",
        description: "Left conversation",
      });

      router.push("/messages");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to leave conversation",
      });
    } finally {
      setIsActioning(false);
    }
  };

  const getInitials = (name: string | null, email: string): string => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0] ?? "")
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return (email[0] ?? "?").toUpperCase();
  };

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    }

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const getDisplayName = (): string => {
    if (!conversation) return "";
    if (conversation.subject) return conversation.subject;

    const others = conversation.participants.filter((p) => p.isActive);
    if (others.length === 0) return "Unknown";
    const firstOther = others[0];
    if (others.length === 1 && firstOther) return firstOther.name ?? firstOther.email;

    const names = others.slice(0, 2).map((p) => p.name ?? p.email.split("@")[0] ?? p.email);
    if (others.length > 2) {
      return `${names.join(", ")} +${String(others.length - 2)}`;
    }
    return names.join(", ");
  };

  if (isLoading) {
    return (
      <Card className="flex h-[calc(100vh-200px)] flex-col">
        <CardHeader className="flex flex-row items-center gap-4 border-b">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="mt-1 h-4 w-24" />
          </div>
        </CardHeader>
        <CardContent className="flex-1 space-y-4 p-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-3/4" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!conversation) {
    return (
      <Card className="flex h-[calc(100vh-200px)] items-center justify-center">
        <p className="text-muted-foreground">Conversation not found</p>
      </Card>
    );
  }

  return (
    <Card className="flex h-[calc(100vh-200px)] flex-col">
      {/* Header */}
      <CardHeader className="flex flex-row items-center gap-4 border-b py-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            router.push("/messages");
          }}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>

        {conversation.type === "group" || conversation.type === "show_cast" ? (
          <div className="bg-muted flex h-10 w-10 items-center justify-center rounded-full">
            <Users className="text-muted-foreground h-5 w-5" />
          </div>
        ) : conversation.participants[0] ? (
          <Avatar className="h-10 w-10">
            <AvatarImage src={conversation.participants[0].image ?? undefined} />
            <AvatarFallback>
              {getInitials(conversation.participants[0].name, conversation.participants[0].email)}
            </AvatarFallback>
          </Avatar>
        ) : null}

        <div className="min-w-0 flex-1">
          <h2 className="truncate font-semibold">{getDisplayName()}</h2>
          <p className="text-muted-foreground text-xs">
            {conversation.participants.length} participant
            {conversation.participants.length !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            disabled={isActioning}
            onClick={() => void handleAction("archive")}
            title="Archive"
          >
            <Archive className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            disabled={isActioning}
            onClick={() => void handleAction("mute")}
            title="Mute notifications"
          >
            <BellOff className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            disabled={isActioning}
            onClick={() => void handleLeave()}
            title="Leave conversation"
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      {/* Messages */}
      <CardContent className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.isOwn ? "flex-row-reverse" : ""}`}
            >
              {!message.isOwn && message.sender && (
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarImage src={message.sender.image ?? undefined} />
                  <AvatarFallback className="text-xs">
                    {getInitials(message.sender.name, message.sender.email)}
                  </AvatarFallback>
                </Avatar>
              )}
              <div
                className={`max-w-[70%] rounded-lg px-4 py-2 ${
                  message.isOwn ? "bg-primary text-primary-foreground" : "bg-muted"
                }`}
              >
                {!message.isOwn && message.sender && (
                  <p className="mb-1 text-xs font-medium">
                    {message.sender.name ?? message.sender.email}
                  </p>
                )}
                <p className="text-sm break-words whitespace-pre-wrap">{message.content}</p>
                <p
                  className={`mt-1 text-xs ${
                    message.isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                  }`}
                >
                  {formatTime(message.createdAt)}
                  {message.isEdited && " (edited)"}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </CardContent>

      {/* Input */}
      <div className="border-t p-4">
        <div className="flex gap-2">
          <textarea
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void handleSendMessage();
              }
            }}
            rows={1}
            className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex-1 resize-none rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isSending}
          />
          <Button
            onClick={() => void handleSendMessage()}
            disabled={isSending || !newMessage.trim()}
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="text-muted-foreground mt-1 text-xs">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </Card>
  );
}

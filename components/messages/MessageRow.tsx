"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Users, Clock } from "lucide-react";

export interface ConversationSummary {
  id: string;
  type: "direct" | "group" | "show_cast";
  subject: string | null;
  lastMessageAt: string | null;
  lastMessage: {
    id: string;
    content: string;
    createdAt: string;
    senderId: string | null;
  } | null;
  unreadCount: number;
  isArchived: boolean;
  isMuted: boolean;
  participants: {
    id: string;
    name: string | null;
    image: string | null;
    email: string;
  }[];
}

interface MessageRowProps {
  conversation: ConversationSummary;
  isSelected: boolean;
  onSelect: (selected: boolean) => void;
  onClick: () => void;
}

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffHours < 1) {
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    return diffMinutes <= 1 ? "Just now" : `${String(diffMinutes)}m`;
  }
  if (diffHours < 24) {
    return `${String(Math.floor(diffHours))}h`;
  }
  if (diffDays < 7) {
    return `${String(Math.floor(diffDays))}d`;
  }
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getInitials(name: string | null, email: string): string {
  if (name) {
    return name
      .split(" ")
      .map((n) => n[0] ?? "")
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }
  return (email[0] ?? "?").toUpperCase();
}

function truncateMessage(content: string, maxLength = 100): string {
  if (content.length <= maxLength) return content;
  return content.slice(0, maxLength).trim() + "...";
}

function getDisplayName(
  subject: string | null,
  participants: ConversationSummary["participants"]
): string {
  if (subject) return subject;
  if (participants.length === 0) return "Unknown";
  const firstParticipant = participants[0];
  if (participants.length === 1 && firstParticipant) {
    return firstParticipant.name ?? firstParticipant.email;
  }
  const names = participants.slice(0, 2).map((p) => p.name ?? p.email.split("@")[0]);
  if (participants.length > 2) {
    return `${names.join(", ")} +${String(participants.length - 2)}`;
  }
  return names.join(", ");
}

function ConversationAvatar({
  type,
  participants,
}: {
  type: ConversationSummary["type"];
  participants: ConversationSummary["participants"];
}): React.ReactElement {
  if (type === "group" || type === "show_cast") {
    return (
      <div className="bg-muted flex h-10 w-10 items-center justify-center rounded-full">
        <Users className="text-muted-foreground h-5 w-5" />
      </div>
    );
  }
  const firstParticipant = participants[0];
  if (firstParticipant) {
    return (
      <Avatar className="h-10 w-10">
        <AvatarImage src={firstParticipant.image ?? undefined} />
        <AvatarFallback>
          {getInitials(firstParticipant.name, firstParticipant.email)}
        </AvatarFallback>
      </Avatar>
    );
  }
  return (
    <div className="bg-muted flex h-10 w-10 items-center justify-center rounded-full">
      <span className="text-muted-foreground text-sm">?</span>
    </div>
  );
}

function TypeBadges({
  type,
  isMuted,
}: {
  type: ConversationSummary["type"];
  isMuted: boolean;
}): React.ReactElement {
  return (
    <>
      {type === "group" && (
        <Badge variant="outline" className="flex-shrink-0 text-xs">
          Group
        </Badge>
      )}
      {type === "show_cast" && (
        <Badge variant="secondary" className="flex-shrink-0 text-xs">
          Cast
        </Badge>
      )}
      {isMuted && (
        <Badge variant="outline" className="flex-shrink-0 text-xs">
          Muted
        </Badge>
      )}
    </>
  );
}

export function MessageRow({
  conversation,
  isSelected,
  onSelect,
  onClick,
}: MessageRowProps): React.ReactElement {
  const { participants, lastMessage, unreadCount, type, subject } = conversation;
  const isUnread = unreadCount > 0;
  const displayName = getDisplayName(subject, participants);

  return (
    <div
      className={`group hover:bg-muted/50 flex cursor-pointer items-center gap-3 border-b px-6 py-3 transition-colors ${
        isUnread ? "bg-blue-50/50 dark:bg-blue-950/20" : ""
      }`}
      onClick={(e) => {
        // Don't trigger onClick if clicking checkbox
        if ((e.target as HTMLElement).closest('[role="checkbox"]')) return;
        onClick();
      }}
    >
      <div
        onClick={(e) => {
          e.stopPropagation();
        }}
        className="flex-shrink-0"
      >
        <Checkbox
          checked={isSelected}
          onChange={(e) => {
            onSelect(e.target.checked);
          }}
          aria-label={`Select conversation with ${displayName}`}
        />
      </div>

      <div className="relative flex-shrink-0">
        <ConversationAvatar type={type} participants={participants} />
        {isUnread && (
          <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-blue-500 dark:border-gray-900" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className={`truncate ${isUnread ? "font-semibold" : "font-medium"}`}>
            {displayName}
          </span>
          <TypeBadges type={type} isMuted={conversation.isMuted} />
        </div>
        <p className={`truncate text-sm ${isUnread ? "text-foreground" : "text-muted-foreground"}`}>
          {lastMessage ? truncateMessage(lastMessage.content) : "No messages yet"}
        </p>
      </div>

      {/* Time and unread count */}
      <div className="flex flex-shrink-0 flex-col items-end gap-1">
        {lastMessage && (
          <span className="text-muted-foreground flex items-center gap-1 text-xs">
            <Clock className="h-3 w-3" />
            {formatTime(lastMessage.createdAt)}
          </span>
        )}
        {unreadCount > 0 && (
          <Badge className="bg-blue-500 text-white hover:bg-blue-600">
            {unreadCount > 99 ? "99+" : unreadCount}
          </Badge>
        )}
      </div>
    </div>
  );
}

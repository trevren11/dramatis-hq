"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Mail,
  Archive,
  ArchiveRestore,
  Trash2,
  CheckCheck,
  PenSquare,
  Search,
  Inbox as InboxIcon,
} from "lucide-react";
import { MessageRow, type ConversationSummary } from "./MessageRow";

type InboxFilter = "all" | "unread" | "archived";

interface InboxProps {
  onCompose?: () => void;
}

export function Inbox({ onCompose }: InboxProps): React.ReactElement {
  const router = useRouter();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [totalUnread, setTotalUnread] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<InboxFilter>("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isActioning, setIsActioning] = useState(false);

  const fetchInbox = useCallback(async (): Promise<void> => {
    try {
      const response = await fetch(`/api/messages?filter=${filter}`);
      if (!response.ok) {
        throw new Error("Failed to fetch inbox");
      }
      const data = (await response.json()) as {
        conversations: ConversationSummary[];
        totalUnread: number;
      };
      setConversations(data.conversations);
      setTotalUnread(data.totalUnread);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load inbox",
      });
    } finally {
      setIsLoading(false);
    }
  }, [filter, toast]);

  useEffect(() => {
    setIsLoading(true);
    void fetchInbox();
  }, [filter, fetchInbox]);

  const handleSelectAll = (): void => {
    if (selectedIds.size === conversations.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(conversations.map((c) => c.id)));
    }
  };

  const handleSelect = (id: string, selected: boolean): void => {
    const newSelected = new Set(selectedIds);
    if (selected) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedIds(newSelected);
  };

  const handleBulkAction = async (
    action: "archive" | "unarchive" | "markRead" | "delete"
  ): Promise<void> => {
    if (selectedIds.size === 0) return;

    setIsActioning(true);
    try {
      const response = await fetch("/api/messages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationIds: Array.from(selectedIds),
          action,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to perform action");
      }

      toast({
        title: "Success",
        description: `${String(selectedIds.size)} conversation(s) ${action === "markRead" ? "marked as read" : action + "d"}`,
      });

      setSelectedIds(new Set());
      void fetchInbox();
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

  const handleConversationClick = (id: string): void => {
    router.push(`/messages/${id}`);
  };

  const FilterButton = ({
    value,
    label,
    count,
  }: {
    value: InboxFilter;
    label: string;
    count?: number;
  }): React.ReactElement => (
    <Button
      variant={filter === value ? "default" : "outline"}
      size="sm"
      onClick={() => {
        setFilter(value);
      }}
    >
      {label}
      {count !== undefined && count > 0 && (
        <span className="ml-1.5 rounded-full bg-white/20 px-1.5 text-xs">{count}</span>
      )}
    </Button>
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Inbox
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Inbox
          {totalUnread > 0 && (
            <span className="bg-primary text-primary-foreground ml-2 rounded-full px-2 py-0.5 text-xs font-medium">
              {totalUnread}
            </span>
          )}
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              router.push("/messages/search");
            }}
          >
            <Search className="mr-1 h-4 w-4" />
            Search
          </Button>
          <Button size="sm" onClick={onCompose}>
            <PenSquare className="mr-1 h-4 w-4" />
            Compose
          </Button>
        </div>
      </CardHeader>

      <div className="border-b px-6 pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <FilterButton value="all" label="Inbox" />
          <FilterButton value="unread" label="Unread" count={totalUnread} />
          <FilterButton value="archived" label="Archived" />
        </div>
      </div>

      {selectedIds.size > 0 && (
        <div className="bg-muted/50 flex items-center gap-2 border-b px-6 py-2">
          <span className="text-muted-foreground text-sm">{selectedIds.size} selected</span>
          <div className="ml-auto flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => void handleBulkAction("markRead")}
              disabled={isActioning}
            >
              <CheckCheck className="mr-1 h-4 w-4" />
              Mark Read
            </Button>
            {filter === "archived" ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => void handleBulkAction("unarchive")}
                disabled={isActioning}
              >
                <ArchiveRestore className="mr-1 h-4 w-4" />
                Unarchive
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => void handleBulkAction("archive")}
                disabled={isActioning}
              >
                <Archive className="mr-1 h-4 w-4" />
                Archive
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => void handleBulkAction("delete")}
              disabled={isActioning}
            >
              <Trash2 className="mr-1 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>
      )}

      <CardContent className="p-0">
        {conversations.length === 0 ? (
          <div className="text-muted-foreground flex flex-col items-center justify-center py-12 text-center">
            <InboxIcon className="mb-2 h-12 w-12 opacity-50" />
            <p className="font-medium">
              {filter === "archived" ? "No archived messages" : "No messages yet"}
            </p>
            <p className="text-sm">
              {filter === "archived"
                ? "Messages you archive will appear here"
                : "Start a conversation by clicking Compose"}
            </p>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-3 border-b px-6 py-2">
              <Checkbox
                checked={selectedIds.size === conversations.length && conversations.length > 0}
                onChange={handleSelectAll}
                aria-label="Select all"
              />
              <span className="text-muted-foreground text-xs">Select all</span>
            </div>
            {conversations.map((conversation) => (
              <MessageRow
                key={conversation.id}
                conversation={conversation}
                isSelected={selectedIds.has(conversation.id)}
                onSelect={(selected) => {
                  handleSelect(conversation.id, selected);
                }}
                onClick={() => {
                  handleConversationClick(conversation.id);
                }}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

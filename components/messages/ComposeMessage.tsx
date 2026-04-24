"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { X, Send, Loader2 } from "lucide-react";

interface Recipient {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  userType: string;
}

interface ComposeMessageProps {
  onClose?: () => void;
  initialRecipients?: Recipient[];
}

export function ComposeMessage({
  onClose,
  initialRecipients = [],
}: ComposeMessageProps): React.ReactElement {
  const router = useRouter();
  const { toast } = useToast();

  const [recipients, setRecipients] = useState<Recipient[]>(initialRecipients);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Recipient[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  const searchUsers = useCallback(
    async (query: string): Promise<void> => {
      if (query.length < 2) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        // Search for users (you'll need a users search endpoint)
        const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
        if (response.ok) {
          const data = (await response.json()) as { users: Recipient[] };
          // Filter out already selected recipients
          const filtered = data.users.filter((user) => !recipients.some((r) => r.id === user.id));
          setSearchResults(filtered);
        }
      } catch (error) {
        console.error("Error searching users:", error);
      } finally {
        setIsSearching(false);
      }
    },
    [recipients]
  );

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (searchQuery) {
        void searchUsers(searchQuery);
      }
    }, 300);

    return () => {
      clearTimeout(debounce);
    };
  }, [searchQuery, searchUsers]);

  const addRecipient = (user: Recipient): void => {
    setRecipients([...recipients, user]);
    setSearchQuery("");
    setSearchResults([]);
    setShowSearch(false);
  };

  const removeRecipient = (userId: string): void => {
    setRecipients(recipients.filter((r) => r.id !== userId));
  };

  const handleSend = async (): Promise<void> => {
    if (recipients.length === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please add at least one recipient",
      });
      return;
    }

    if (!content.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a message",
      });
      return;
    }

    setIsSending(true);
    try {
      const response = await fetch("/api/messages/compose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientIds: recipients.map((r) => r.id),
          subject: subject.trim() || null,
          content: content.trim(),
          conversationType: recipients.length === 1 ? "direct" : "group",
        }),
      });

      if (!response.ok) {
        const error = (await response.json()) as { error?: string };
        throw new Error(error.error ?? "Failed to send message");
      }

      const data = (await response.json()) as { conversationId: string };

      toast({
        title: "Success",
        description: "Message sent",
      });

      router.push(`/messages/${data.conversationId}`);
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

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>New Message</CardTitle>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Recipients */}
        <div className="space-y-2">
          <Label htmlFor="recipients">To</Label>
          <div className="flex min-h-[42px] flex-wrap gap-2 rounded-md border p-2">
            {recipients.map((recipient) => (
              <Badge key={recipient.id} variant="secondary" className="gap-1 pr-1">
                <Avatar className="h-5 w-5">
                  <AvatarImage src={recipient.image ?? undefined} />
                  <AvatarFallback className="text-xs">
                    {getInitials(recipient.name, recipient.email)}
                  </AvatarFallback>
                </Avatar>
                <span>{recipient.name ?? recipient.email}</span>
                <button
                  type="button"
                  onClick={() => {
                    removeRecipient(recipient.id);
                  }}
                  className="hover:bg-muted ml-1 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            <div className="relative min-w-[150px] flex-1">
              <Input
                id="recipients"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSearch(true);
                }}
                onFocus={() => {
                  setShowSearch(true);
                }}
                className="h-auto border-0 p-0 shadow-none focus-visible:ring-0"
              />
              {showSearch && (searchResults.length > 0 || isSearching) && (
                <div className="bg-popover absolute top-full left-0 z-10 mt-1 w-full min-w-[250px] rounded-md border p-1 shadow-md">
                  {isSearching ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="text-muted-foreground h-5 w-5 animate-spin" />
                    </div>
                  ) : (
                    searchResults.map((user) => (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => {
                          addRecipient(user);
                        }}
                        className="hover:bg-muted flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left"
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.image ?? undefined} />
                          <AvatarFallback>{getInitials(user.name, user.email)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium">{user.name ?? user.email}</p>
                          {user.name && (
                            <p className="text-muted-foreground truncate text-xs">{user.email}</p>
                          )}
                        </div>
                        <Badge variant="outline" className="text-xs capitalize">
                          {user.userType}
                        </Badge>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Subject (optional) */}
        <div className="space-y-2">
          <Label htmlFor="subject">Subject (optional)</Label>
          <Input
            id="subject"
            placeholder="Enter subject..."
            value={subject}
            onChange={(e) => {
              setSubject(e.target.value);
            }}
            maxLength={255}
          />
        </div>

        {/* Message */}
        <div className="space-y-2">
          <Label htmlFor="message">Message</Label>
          <textarea
            id="message"
            placeholder="Write your message..."
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
            }}
            rows={6}
            className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring w-full resize-none rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            maxLength={10000}
          />
          <p className="text-muted-foreground text-right text-xs">{content.length}/10000</p>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          {onClose && (
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          )}
          <Button onClick={() => void handleSend()} disabled={isSending}>
            {isSending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Send Message
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

"use client";

import React, { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/use-toast";
import { Send, Check, MoreVertical, Trash2, Reply } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from "date-fns";
import type { ProductionNoteComment } from "@/lib/db/schema/production-notes";

interface CommentWithUser extends ProductionNoteComment {
  userName?: string;
  userEmail?: string;
}

interface CommentSectionProps {
  showId: string;
  departmentId: string;
  noteId: string;
}

export function CommentSection({
  showId,
  departmentId,
  noteId,
}: CommentSectionProps): React.ReactElement {
  const { toast } = useToast();
  const [comments, setComments] = useState<CommentWithUser[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  const fetchComments = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/shows/${showId}/production-notes/departments/${departmentId}/notes/${noteId}/comments`
      );
      if (response.ok) {
        const data = (await response.json()) as { comments: CommentWithUser[] };
        setComments(data.comments);
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to load comments",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [showId, departmentId, noteId, toast]);

  useEffect(() => {
    void fetchComments();
  }, [fetchComments]);

  const handleSubmit = useCallback(async () => {
    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(
        `/api/shows/${showId}/production-notes/departments/${departmentId}/notes/${noteId}/comments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: newComment,
            parentCommentId: replyingTo,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to post comment");
      }

      const data = (await response.json()) as { comment: CommentWithUser };
      setComments((prev) => [data.comment, ...prev]);
      setNewComment("");
      setReplyingTo(null);
    } catch {
      toast({
        title: "Error",
        description: "Failed to post comment",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [showId, departmentId, noteId, newComment, replyingTo, isSubmitting, toast]);

  const handleResolve = useCallback(
    async (commentId: string, isResolved: boolean) => {
      try {
        const response = await fetch(
          `/api/shows/${showId}/production-notes/departments/${departmentId}/notes/${noteId}/comments/${commentId}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isResolved }),
          }
        );

        if (response.ok) {
          const data = (await response.json()) as { comment: CommentWithUser };
          setComments((prev) => prev.map((c) => (c.id === commentId ? data.comment : c)));
        }
      } catch {
        toast({
          title: "Error",
          description: "Failed to update comment",
          variant: "destructive",
        });
      }
    },
    [showId, departmentId, noteId, toast]
  );

  const handleDelete = useCallback(
    async (commentId: string) => {
      try {
        const response = await fetch(
          `/api/shows/${showId}/production-notes/departments/${departmentId}/notes/${noteId}/comments/${commentId}`,
          { method: "DELETE" }
        );

        if (response.ok) {
          setComments((prev) => prev.filter((c) => c.id !== commentId));
          toast({
            title: "Comment deleted",
            description: "The comment has been removed",
          });
        }
      } catch {
        toast({
          title: "Error",
          description: "Failed to delete comment",
          variant: "destructive",
        });
      }
    },
    [showId, departmentId, noteId, toast]
  );

  const getInitials = (name?: string, email?: string): string => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n.charAt(0))
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    if (email) {
      return email.charAt(0).toUpperCase();
    }
    return "?";
  };

  return (
    <div className="flex h-full flex-col">
      <div className="border-b px-4 py-2">
        <h4 className="text-sm font-medium">Comments</h4>
      </div>

      <ScrollArea className="flex-1 p-4">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <div className="bg-muted h-8 w-8 animate-pulse rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="bg-muted h-3 w-24 animate-pulse rounded" />
                  <div className="bg-muted h-4 w-3/4 animate-pulse rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : comments.length === 0 ? (
          <p className="text-muted-foreground text-center text-sm">
            No comments yet. Start the conversation!
          </p>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <div
                key={comment.id}
                className={`flex gap-3 ${comment.isResolved ? "opacity-60" : ""}`}
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">
                    {getInitials(comment.userName, comment.userEmail)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {comment.userName ?? comment.userEmail ?? "Unknown"}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                      </span>
                      {comment.isResolved && (
                        <span className="flex items-center gap-1 text-xs text-green-600">
                          <Check className="h-3 w-3" />
                          Resolved
                        </span>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          <MoreVertical className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setReplyingTo(comment.id);
                          }}
                        >
                          <Reply className="mr-2 h-4 w-4" />
                          Reply
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            void handleResolve(comment.id, !comment.isResolved);
                          }}
                        >
                          <Check className="mr-2 h-4 w-4" />
                          {comment.isResolved ? "Unresolve" : "Mark resolved"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            void handleDelete(comment.id);
                          }}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <p className="mt-1 text-sm">{comment.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      <div className="border-t p-3">
        {replyingTo && (
          <div className="bg-muted mb-2 flex items-center justify-between rounded px-2 py-1 text-xs">
            <span>Replying to a comment</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-5 px-1"
              onClick={() => {
                setReplyingTo(null);
              }}
            >
              Cancel
            </Button>
          </div>
        )}
        <div className="flex gap-2">
          <Textarea
            value={newComment}
            onChange={(e) => {
              setNewComment(e.target.value);
            }}
            placeholder="Add a comment..."
            className="min-h-[60px] resize-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                void handleSubmit();
              }
            }}
          />
          <Button
            size="icon"
            onClick={() => {
              void handleSubmit();
            }}
            disabled={!newComment.trim() || isSubmitting}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

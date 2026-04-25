"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  Users,
  Calendar,
  Clock,
  Mail,
  MailCheck,
  MoreVertical,
  Trash2,
  UserPlus,
} from "lucide-react";

interface TalentInfo {
  id: string;
  name: string;
  email: string;
  headshotUrl?: string | null;
}

interface RoleInfo {
  id: string;
  name: string;
}

interface CallbackInvitation {
  id: string;
  talentProfileId: string;
  roleId?: string | null;
  scheduledDate?: Date | null;
  scheduledTime?: string | null;
  checkedInAt?: Date | null;
  queueNumber?: number | null;
  emailSentAt?: Date | null;
  emailStatus?: string | null;
  talent: TalentInfo | null;
  role: RoleInfo | null;
}

interface CallbackInvitationListProps {
  auditionId: string;
  sessionId: string;
  invitations: CallbackInvitation[];
  roles: RoleInfo[];
  onRemoveInvitation: (id: string) => Promise<void>;
  onSendEmail: (invitationIds: string[]) => Promise<void>;
  onAddInvitations: () => void;
  className?: string;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatTime(time: string | null | undefined): string {
  if (!time) return "";
  return time;
}

function formatDate(date: Date | null | undefined): string {
  if (!date) return "";
  return new Date(date).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function CallbackInvitationList({
  auditionId: _auditionId,
  sessionId: _sessionId,
  invitations,
  roles,
  onRemoveInvitation,
  onSendEmail,
  onAddInvitations,
  className,
}: CallbackInvitationListProps): React.ReactElement {
  const [activeTab, setActiveTab] = useState<string>("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);

  const filteredInvitations =
    activeTab === "all" ? invitations : invitations.filter((inv) => inv.roleId === activeTab);

  const toggleSelect = (id: string): void => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = (): void => {
    setSelectedIds(new Set(filteredInvitations.map((inv) => inv.id)));
  };

  const clearSelection = (): void => {
    setSelectedIds(new Set());
  };

  const handleSendEmails = async (): Promise<void> => {
    if (selectedIds.size === 0) return;
    setIsProcessing(true);
    try {
      await onSendEmail(Array.from(selectedIds));
      clearSelection();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemove = async (id: string): Promise<void> => {
    setIsProcessing(true);
    try {
      await onRemoveInvitation(id);
    } finally {
      setIsProcessing(false);
    }
  };

  const emailPendingCount = invitations.filter((inv) => !inv.emailSentAt).length;
  const checkedInCount = invitations.filter((inv) => inv.checkedInAt).length;

  return (
    <Card className={cn(className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Invited Talent
            <Badge variant="secondary">{invitations.length}</Badge>
          </CardTitle>
          <div className="flex gap-2">
            {selectedIds.size > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => void handleSendEmails()}
                disabled={isProcessing}
              >
                <Mail className="mr-2 h-4 w-4" />
                Email ({selectedIds.size})
              </Button>
            )}
            <Button size="sm" onClick={onAddInvitations}>
              <UserPlus className="mr-2 h-4 w-4" />
              Add Talent
            </Button>
          </div>
        </div>

        <div className="text-muted-foreground flex gap-4 text-sm">
          <span className="flex items-center gap-1">
            <Mail className="h-4 w-4" />
            {emailPendingCount} pending emails
          </span>
          <span className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            {checkedInCount} checked in
          </span>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="mb-4 flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="all">
                All
                <Badge variant="secondary" className="ml-2 h-5 px-1.5">
                  {invitations.length}
                </Badge>
              </TabsTrigger>
              {roles.map((role) => (
                <TabsTrigger key={role.id} value={role.id}>
                  {role.name}
                  <Badge variant="secondary" className="ml-2 h-5 px-1.5">
                    {invitations.filter((inv) => inv.roleId === role.id).length}
                  </Badge>
                </TabsTrigger>
              ))}
            </TabsList>

            <div className="flex gap-2">
              {selectedIds.size > 0 ? (
                <Button variant="ghost" size="sm" onClick={clearSelection}>
                  Clear ({selectedIds.size})
                </Button>
              ) : (
                <Button variant="ghost" size="sm" onClick={selectAll}>
                  Select All
                </Button>
              )}
            </div>
          </div>

          <TabsContent value={activeTab} className="mt-0">
            {filteredInvitations.length === 0 ? (
              <div className="text-muted-foreground py-12 text-center">
                <Users className="mx-auto mb-4 h-12 w-12 opacity-50" />
                <p className="font-medium">No talent invited yet</p>
                <p className="mt-1 text-sm">Import from the audition or add talent manually.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredInvitations.map((invitation) => (
                  <div
                    key={invitation.id}
                    className={cn(
                      "flex items-center gap-4 rounded-lg border p-3 transition-colors",
                      selectedIds.has(invitation.id) && "border-primary bg-primary/5"
                    )}
                    onClick={() => {
                      toggleSelect(invitation.id);
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        toggleSelect(invitation.id);
                      }
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.has(invitation.id)}
                      onChange={() => {
                        toggleSelect(invitation.id);
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                      className="h-4 w-4"
                    />

                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarImage
                        src={invitation.talent?.headshotUrl ?? undefined}
                        alt={invitation.talent?.name ?? ""}
                      />
                      <AvatarFallback>
                        {invitation.talent ? getInitials(invitation.talent.name) : "?"}
                      </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{invitation.talent?.name ?? "Unknown"}</p>
                      <p className="text-muted-foreground truncate text-sm">
                        {invitation.talent?.email ?? ""}
                      </p>
                    </div>

                    {invitation.role && (
                      <Badge variant="outline" className="shrink-0">
                        {invitation.role.name}
                      </Badge>
                    )}

                    {invitation.scheduledDate && (
                      <div className="text-muted-foreground hidden shrink-0 text-sm sm:flex sm:items-center sm:gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDate(invitation.scheduledDate)}
                        {invitation.scheduledTime && (
                          <>
                            <Clock className="ml-2 h-4 w-4" />
                            {formatTime(invitation.scheduledTime)}
                          </>
                        )}
                      </div>
                    )}

                    {invitation.emailSentAt ? (
                      <Badge variant="outline" className="shrink-0 bg-green-50">
                        <MailCheck className="mr-1 h-3 w-3" />
                        Sent
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="shrink-0">
                        <Mail className="mr-1 h-3 w-3" />
                        Pending
                      </Badge>
                    )}

                    <DropdownMenu>
                      <DropdownMenuTrigger
                        asChild
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                      >
                        <Button variant="ghost" size="icon" className="shrink-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            void handleRemove(invitation.id);
                          }}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

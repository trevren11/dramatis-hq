"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ORGANIZATION_ROLE_OPTIONS,
  SHOW_ROLE_OPTIONS,
  type Invitation,
} from "@/lib/db/schema/permissions";
import { useToast } from "@/components/ui/use-toast";

interface ApiError {
  error?: string;
}

interface PendingInvitationsProps {
  invitations: Invitation[];
  type: "organization" | "show";
  targetId: string;
  onRefresh: () => void;
}

export function PendingInvitations({
  invitations,
  type,
  targetId,
  onRefresh,
}: PendingInvitationsProps): React.ReactElement {
  const { toast } = useToast();
  const [cancelling, setCancelling] = React.useState<string | null>(null);

  const roleOptions = type === "organization" ? ORGANIZATION_ROLE_OPTIONS : SHOW_ROLE_OPTIONS;

  const getRoleLabel = (role: string | null): string => {
    if (!role) return "Unknown";
    const option = roleOptions.find((r) => r.value === role);
    return option?.label ?? role;
  };

  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const isExpired = (expiresAt: Date): boolean => {
    return new Date(expiresAt) < new Date();
  };

  const handleCancel = (token: string): void => {
    const cancelInvitation = async (): Promise<void> => {
      setCancelling(token);

      try {
        const response = await fetch(`/api/invitations/${token}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const errorData = (await response.json()) as ApiError;
          throw new Error(errorData.error ?? "Failed to cancel invitation");
        }

        toast({
          title: "Invitation cancelled",
          description: "The invitation has been cancelled",
        });

        onRefresh();
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to cancel invitation",
          variant: "destructive",
        });
      } finally {
        setCancelling(null);
      }
    };

    void cancelInvitation();
  };

  const handleResend = (invitation: Invitation): void => {
    const resendInvitation = async (): Promise<void> => {
      try {
        const endpoint =
          type === "organization"
            ? `/api/organizations/${targetId}/invitations`
            : `/api/shows/${targetId}/staff/invitations`;

        // Cancel old invitation first
        await fetch(`/api/invitations/${invitation.token}`, {
          method: "DELETE",
        });

        // Create new invitation
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: invitation.email,
            role: invitation.role,
          }),
        });

        if (!response.ok) {
          const errorData = (await response.json()) as ApiError;
          throw new Error(errorData.error ?? "Failed to resend invitation");
        }

        toast({
          title: "Invitation resent",
          description: `A new invitation has been sent to ${invitation.email}`,
        });

        onRefresh();
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to resend invitation",
          variant: "destructive",
        });
      }
    };

    void resendInvitation();
  };

  if (invitations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pending Invitations</CardTitle>
          <CardDescription>Invitations waiting for response</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">No pending invitations.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending Invitations</CardTitle>
        <CardDescription>
          {invitations.length} invitation{invitations.length !== 1 ? "s" : ""} waiting for response
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {invitations.map((invitation) => (
            <div
              key={invitation.id}
              className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{invitation.email}</p>
                  <Badge variant="outline">{getRoleLabel(invitation.role)}</Badge>
                  {isExpired(invitation.expiresAt) && <Badge variant="destructive">Expired</Badge>}
                </div>
                <p className="text-muted-foreground text-sm">
                  Invited {formatDate(invitation.invitedAt)}
                </p>
                <p className="text-muted-foreground text-xs">
                  {isExpired(invitation.expiresAt)
                    ? `Expired ${formatDate(invitation.expiresAt)}`
                    : `Expires ${formatDate(invitation.expiresAt)}`}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    handleResend(invitation);
                  }}
                >
                  Resend
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={cancelling === invitation.token}
                  onClick={() => {
                    handleCancel(invitation.token);
                  }}
                >
                  {cancelling === invitation.token ? "Cancelling..." : "Cancel"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

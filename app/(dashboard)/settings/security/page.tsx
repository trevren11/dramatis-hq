"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import {
  TwoFactorCard,
  SessionsCard,
  LoginHistoryCard,
  SecurityNotificationsCard,
  type SecuritySettings,
} from "@/components/settings/security-settings";

interface SecurityResponse {
  security: SecuritySettings;
}

export default function SecuritySettingsPage(): React.ReactElement {
  const [security, setSecurity] = useState<SecuritySettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const fetchSecurity = useCallback(async (): Promise<void> => {
    try {
      const response = await fetch("/api/settings/security");
      if (response.ok) {
        const data = (await response.json()) as SecurityResponse;
        setSecurity(data.security);
      }
    } catch (error) {
      console.error("Failed to fetch security settings:", error);
      toast({
        title: "Error",
        description: "Failed to load security settings",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void fetchSecurity();
  }, [fetchSecurity]);

  const handleTwoFactorToggle = (): void => {
    void fetchSecurity();
  };

  const handleRevokeSession = (sessionId: string): void => {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/settings/security/sessions/${sessionId}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          throw new Error("Failed to revoke session");
        }

        setSecurity((prev) =>
          prev
            ? {
                ...prev,
                sessions: prev.sessions.filter((s) => s.id !== sessionId),
              }
            : null
        );
        toast({
          title: "Session revoked",
          description: "The device has been signed out.",
        });
      } catch (error) {
        console.error("Failed to revoke session:", error);
        toast({
          title: "Error",
          description: "Failed to revoke session",
          variant: "destructive",
        });
      }
    });
  };

  const handleRevokeAllSessions = (): void => {
    startTransition(async () => {
      try {
        const response = await fetch("/api/settings/security/sessions", {
          method: "DELETE",
        });

        if (!response.ok) {
          throw new Error("Failed to revoke sessions");
        }

        void fetchSecurity();
        toast({
          title: "All sessions revoked",
          description: "All other devices have been signed out.",
        });
      } catch (error) {
        console.error("Failed to revoke sessions:", error);
        toast({
          title: "Error",
          description: "Failed to revoke sessions",
          variant: "destructive",
        });
      }
    });
  };

  const handleSecurityNotificationsToggle = (value: boolean): void => {
    startTransition(async () => {
      try {
        const response = await fetch("/api/settings/security", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ securityNotifications: value }),
        });

        if (!response.ok) {
          throw new Error("Failed to update");
        }

        setSecurity((prev) => (prev ? { ...prev, securityNotifications: value } : null));
        toast({
          title: "Settings updated",
          description: "Security notification preferences saved.",
        });
      } catch (error) {
        console.error("Failed to update security notifications:", error);
        toast({
          title: "Error",
          description: "Failed to update setting",
          variant: "destructive",
        });
      }
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-48 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (!security) {
    return (
      <div className="rounded-lg border p-8 text-center">
        <p className="text-muted-foreground">Unable to load security settings.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Security Settings</h2>
        <p className="text-muted-foreground">
          Protect your account with two-factor authentication and manage active sessions.
        </p>
      </div>

      <TwoFactorCard
        enabled={security.twoFactorEnabled}
        onToggle={handleTwoFactorToggle}
        isPending={isPending}
      />
      <SessionsCard
        sessions={security.sessions}
        onRevoke={handleRevokeSession}
        onRevokeAll={handleRevokeAllSessions}
        isPending={isPending}
      />
      <LoginHistoryCard history={security.loginHistory} />
      <SecurityNotificationsCard
        enabled={security.securityNotifications}
        onToggle={handleSecurityNotificationsToggle}
        isPending={isPending}
      />
    </div>
  );
}

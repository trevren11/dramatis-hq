"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import {
  DataExportCard,
  ActivityVisibilityCard,
  BlockListCard,
  ConnectionsCard,
  DeleteDataCard,
  type PrivacySettings,
} from "@/components/settings/privacy-settings";

interface PrivacyResponse {
  privacy: PrivacySettings;
}

interface ApiResponse {
  message?: string;
  error?: string;
  downloadUrl?: string;
}

export default function PrivacySettingsPage(): React.ReactElement {
  const [privacy, setPrivacy] = useState<PrivacySettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const fetchPrivacy = useCallback(async (): Promise<void> => {
    try {
      const response = await fetch("/api/settings/privacy");
      if (response.ok) {
        const data = (await response.json()) as PrivacyResponse;
        setPrivacy(data.privacy);
      }
    } catch (error) {
      console.error("Failed to fetch privacy settings:", error);
      toast({
        title: "Error",
        description: "Failed to load privacy settings",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void fetchPrivacy();
  }, [fetchPrivacy]);

  const handleExport = async (): Promise<void> => {
    setIsExporting(true);
    try {
      const response = await fetch("/api/settings/export-data", {
        method: "POST",
      });
      const data = (await response.json()) as ApiResponse;

      if (!response.ok) {
        throw new Error(data.error ?? "Export failed");
      }

      toast({
        title: "Export started",
        description: "You will receive an email when your data is ready to download.",
      });
    } catch (error) {
      console.error("Failed to export data:", error);
      toast({
        title: "Error",
        description: "Failed to start data export",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleActivityToggle = (value: boolean): void => {
    startTransition(async () => {
      try {
        const response = await fetch("/api/settings/privacy", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ activityVisible: value }),
        });

        if (!response.ok) {
          throw new Error("Failed to update");
        }

        setPrivacy((prev) => (prev ? { ...prev, activityVisible: value } : null));
        toast({
          title: "Settings updated",
          description: "Your activity visibility has been changed.",
        });
      } catch (error) {
        console.error("Failed to update activity visibility:", error);
        toast({
          title: "Error",
          description: "Failed to update setting",
          variant: "destructive",
        });
      }
    });
  };

  const handleBlock = (email: string): void => {
    startTransition(async () => {
      try {
        const response = await fetch("/api/settings/privacy/block", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });

        if (!response.ok) {
          const data = (await response.json()) as ApiResponse;
          throw new Error(data.error ?? "Failed to block user");
        }

        toast({
          title: "User blocked",
          description: "They can no longer contact you or view your profile.",
        });
        void fetchPrivacy();
      } catch (error) {
        console.error("Failed to block user:", error);
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to block user",
          variant: "destructive",
        });
      }
    });
  };

  const handleUnblock = (userId: string): void => {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/settings/privacy/block/${userId}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          throw new Error("Failed to unblock user");
        }

        setPrivacy((prev) =>
          prev
            ? {
                ...prev,
                blockedUsers: prev.blockedUsers.filter((u) => u.id !== userId),
              }
            : null
        );
        toast({
          title: "User unblocked",
          description: "They can now contact you and view your profile.",
        });
      } catch (error) {
        console.error("Failed to unblock user:", error);
        toast({
          title: "Error",
          description: "Failed to unblock user",
          variant: "destructive",
        });
      }
    });
  };

  const handleDisconnect = (connectionId: string): void => {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/settings/privacy/connections/${connectionId}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          throw new Error("Failed to disconnect");
        }

        setPrivacy((prev) =>
          prev
            ? {
                ...prev,
                connections: prev.connections.filter((c) => c.id !== connectionId),
              }
            : null
        );
        toast({
          title: "Disconnected",
          description: "The service has been disconnected from your account.",
        });
      } catch (error) {
        console.error("Failed to disconnect:", error);
        toast({
          title: "Error",
          description: "Failed to disconnect service",
          variant: "destructive",
        });
      }
    });
  };

  const handleDeleteData = async (): Promise<void> => {
    setIsDeleting(true);
    try {
      const response = await fetch("/api/settings/delete-data", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to delete data");
      }

      toast({
        title: "Data deletion started",
        description: "Your data will be permanently deleted within 24 hours.",
      });
    } catch (error) {
      console.error("Failed to delete data:", error);
      toast({
        title: "Error",
        description: "Failed to delete data",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
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

  if (!privacy) {
    return (
      <div className="rounded-lg border p-8 text-center">
        <p className="text-muted-foreground">Unable to load privacy settings.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Privacy Settings</h2>
        <p className="text-muted-foreground">
          Manage your data, privacy preferences, and third-party connections.
        </p>
      </div>

      <DataExportCard
        onExport={() => {
          void handleExport();
        }}
        isExporting={isExporting}
      />
      <ActivityVisibilityCard
        activityVisible={privacy.activityVisible}
        onToggle={handleActivityToggle}
        isPending={isPending}
      />
      <BlockListCard
        blockedUsers={privacy.blockedUsers}
        onBlock={handleBlock}
        onUnblock={handleUnblock}
        isPending={isPending}
      />
      <ConnectionsCard
        connections={privacy.connections}
        onDisconnect={handleDisconnect}
        isPending={isPending}
      />
      <DeleteDataCard
        onDelete={() => {
          void handleDeleteData();
        }}
        isDeleting={isDeleting}
      />
    </div>
  );
}

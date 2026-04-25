"use client";

import { useState, useEffect, useCallback } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import {
  UpdateNameForm,
  UpdateEmailForm,
  ChangePasswordForm,
  ConnectedAccounts,
  DeleteAccountDialog,
  type AccountData,
} from "@/components/settings/account-form";

interface AccountResponse {
  account: AccountData;
}

export default function AccountSettingsPage(): React.ReactElement {
  const [account, setAccount] = useState<AccountData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchAccount = useCallback(async (): Promise<void> => {
    try {
      const response = await fetch("/api/settings/account");
      if (response.ok) {
        const data = (await response.json()) as AccountResponse;
        setAccount(data.account);
      }
    } catch (error) {
      console.error("Failed to fetch account:", error);
      toast({
        title: "Error",
        description: "Failed to load account information",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void fetchAccount();
  }, [fetchAccount]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-48 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (!account) {
    return (
      <div className="rounded-lg border p-8 text-center">
        <p className="text-muted-foreground">Unable to load account information.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Account Settings</h2>
        <p className="text-muted-foreground">Manage your account details and security settings.</p>
      </div>

      <UpdateNameForm currentName={account.name} />
      <UpdateEmailForm currentEmail={account.email} emailVerified={account.emailVerified} />
      <ChangePasswordForm hasPassword={account.hasPassword} />
      <ConnectedAccounts accounts={account.connectedAccounts} />
      <DeleteAccountDialog />
    </div>
  );
}

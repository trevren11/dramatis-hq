"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Mail, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";

interface AccountData {
  name: string | null;
  email: string;
  emailVerified: boolean;
  hasPassword: boolean;
  connectedAccounts: {
    provider: string;
    providerAccountId: string;
  }[];
}

interface ApiResponse {
  message?: string;
  error?: string;
  details?: Record<string, string[]>;
}

interface UpdateNameFormProps {
  currentName: string | null;
}

export function UpdateNameForm({ currentName }: UpdateNameFormProps): React.ReactElement {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSubmit = (formData: FormData): void => {
    setError(null);
    const name = formData.get("name") as string;

    startTransition(async () => {
      try {
        const response = await fetch("/api/settings/account", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name }),
        });

        const data = (await response.json()) as ApiResponse;

        if (!response.ok) {
          setError(data.error ?? "Failed to update name");
          return;
        }

        toast({
          title: "Name updated",
          description: "Your name has been updated successfully.",
        });
      } catch {
        setError("Something went wrong. Please try again.");
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Display Name</CardTitle>
        <CardDescription>
          This is the name that will be displayed on your profile and in communications.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-destructive/10 text-destructive rounded-lg p-3 text-sm">{error}</div>
          )}
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              defaultValue={currentName ?? ""}
              placeholder="Enter your name"
              disabled={isPending}
            />
          </div>
          <Button type="submit" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

interface UpdateEmailFormProps {
  currentEmail: string;
  emailVerified: boolean;
}

export function UpdateEmailForm({
  currentEmail,
  emailVerified,
}: UpdateEmailFormProps): React.ReactElement {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { toast } = useToast();

  const handleSubmit = (formData: FormData): void => {
    setError(null);
    setSuccess(false);
    const email = formData.get("email") as string;

    if (email === currentEmail) {
      setError("Please enter a different email address");
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch("/api/settings/account/email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });

        const data = (await response.json()) as ApiResponse;

        if (!response.ok) {
          setError(data.error ?? "Failed to update email");
          return;
        }

        setSuccess(true);
        toast({
          title: "Verification email sent",
          description: "Please check your inbox to verify your new email address.",
        });
      } catch {
        setError("Something went wrong. Please try again.");
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Email Address</CardTitle>
        <CardDescription>
          Your email is used for login and notifications. Changing it requires verification.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-destructive/10 text-destructive rounded-lg p-3 text-sm">{error}</div>
          )}
          {success && (
            <div className="bg-primary/10 text-primary flex items-center gap-2 rounded-lg p-3 text-sm">
              <Mail className="h-4 w-4" />
              Verification email sent! Check your inbox.
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={currentEmail}
              placeholder="Enter your email"
              disabled={isPending}
            />
            {!emailVerified && (
              <p className="text-muted-foreground text-xs">Your current email is not verified.</p>
            )}
          </div>
          <Button type="submit" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending verification...
              </>
            ) : (
              "Update Email"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

interface ChangePasswordFormProps {
  hasPassword: boolean;
}

export function ChangePasswordForm({ hasPassword }: ChangePasswordFormProps): React.ReactElement {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const { toast } = useToast();

  const handleSubmit = (formData: FormData): void => {
    setError(null);
    setFieldErrors({});

    const currentPassword = formData.get("currentPassword") as string;
    const newPassword = formData.get("newPassword") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (newPassword !== confirmPassword) {
      setFieldErrors({ confirmPassword: ["Passwords do not match"] });
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch("/api/settings/account/password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            currentPassword: hasPassword ? currentPassword : undefined,
            newPassword,
          }),
        });

        const data = (await response.json()) as ApiResponse;

        if (!response.ok) {
          if (data.details) {
            setFieldErrors(data.details);
          } else {
            setError(data.error ?? "Failed to update password");
          }
          return;
        }

        toast({
          title: "Password updated",
          description: "Your password has been changed successfully.",
        });

        // Clear form
        const form = document.getElementById("password-form");
        if (form instanceof HTMLFormElement) {
          form.reset();
        }
      } catch {
        setError("Something went wrong. Please try again.");
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{hasPassword ? "Change Password" : "Set Password"}</CardTitle>
        <CardDescription>
          {hasPassword
            ? "Update your password to keep your account secure."
            : "Set a password to enable email/password login."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form id="password-form" action={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-destructive/10 text-destructive rounded-lg p-3 text-sm">{error}</div>
          )}
          {hasPassword && (
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                name="currentPassword"
                type="password"
                placeholder="Enter current password"
                required
                disabled={isPending}
              />
              {fieldErrors.currentPassword && (
                <p className="text-destructive text-sm">{fieldErrors.currentPassword[0]}</p>
              )}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <Input
              id="newPassword"
              name="newPassword"
              type="password"
              placeholder="Enter new password"
              required
              disabled={isPending}
            />
            {fieldErrors.newPassword && (
              <p className="text-destructive text-sm">{fieldErrors.newPassword[0]}</p>
            )}
            <p className="text-muted-foreground text-xs">
              Must be at least 8 characters with uppercase, lowercase, and a number
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="Confirm new password"
              required
              disabled={isPending}
            />
            {fieldErrors.confirmPassword && (
              <p className="text-destructive text-sm">{fieldErrors.confirmPassword[0]}</p>
            )}
          </div>
          <Button type="submit" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : hasPassword ? (
              "Change Password"
            ) : (
              "Set Password"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

interface ConnectedAccountsProps {
  accounts: {
    provider: string;
    providerAccountId: string;
  }[];
}

export function ConnectedAccounts({ accounts }: ConnectedAccountsProps): React.ReactElement {
  const providerNames: Record<string, string> = {
    google: "Google",
    github: "GitHub",
    facebook: "Facebook",
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Connected Accounts</CardTitle>
        <CardDescription>External accounts you can use to sign in.</CardDescription>
      </CardHeader>
      <CardContent>
        {accounts.length === 0 ? (
          <p className="text-muted-foreground text-sm">No connected accounts.</p>
        ) : (
          <div className="space-y-3">
            {accounts.map((account) => (
              <div
                key={`${account.provider}-${account.providerAccountId}`}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-muted flex h-10 w-10 items-center justify-center rounded-full">
                    <span className="text-sm font-medium">
                      {providerNames[account.provider]?.[0] ??
                        account.provider[0]?.toUpperCase() ??
                        "?"}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">
                      {providerNames[account.provider] ?? account.provider}
                    </p>
                    <p className="text-muted-foreground text-xs">Connected</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function DeleteAccountDialog(): React.ReactElement {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState("");

  const handleDelete = (): void => {
    if (confirmation !== "DELETE") {
      setError("Please type DELETE to confirm");
      return;
    }

    setError(null);
    startTransition(async () => {
      try {
        const response = await fetch("/api/settings/account", {
          method: "DELETE",
        });

        if (!response.ok) {
          const data = (await response.json()) as ApiResponse;
          setError(data.error ?? "Failed to delete account");
          return;
        }

        router.push("/");
      } catch {
        setError("Something went wrong. Please try again.");
      }
    });
  };

  return (
    <Card className="border-destructive">
      <CardHeader>
        <CardTitle className="text-destructive">Danger Zone</CardTitle>
        <CardDescription>Permanently delete your account and all associated data.</CardDescription>
      </CardHeader>
      <CardContent>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="destructive">Delete Account</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="text-destructive h-5 w-5" />
                Delete Account
              </DialogTitle>
              <DialogDescription>
                This action cannot be undone. This will permanently delete your account and remove
                all your data from our servers.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {error && (
                <div className="bg-destructive/10 text-destructive rounded-lg p-3 text-sm">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="confirmation">
                  Type <strong>DELETE</strong> to confirm
                </Label>
                <Input
                  id="confirmation"
                  value={confirmation}
                  onChange={(e) => {
                    setConfirmation(e.target.value);
                  }}
                  placeholder="Type DELETE"
                  disabled={isPending}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setOpen(false);
                }}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isPending || confirmation !== "DELETE"}
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete Account"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

export type { AccountData };

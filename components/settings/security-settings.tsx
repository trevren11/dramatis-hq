"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { Loader2, Shield, Smartphone, History, Bell, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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

interface ActiveSession {
  id: string;
  deviceName: string | null;
  browser: string | null;
  location: string | null;
  ipAddress: string | null;
  lastActiveAt: string;
  isCurrent: boolean;
}

interface LoginEvent {
  id: string;
  browser: string | null;
  location: string | null;
  ipAddress: string | null;
  successful: boolean;
  createdAt: string;
}

interface SecuritySettings {
  twoFactorEnabled: boolean;
  securityNotifications: boolean;
  sessions: ActiveSession[];
  loginHistory: LoginEvent[];
}

interface ApiResponse {
  message?: string;
  error?: string;
  qrCode?: string;
  secret?: string;
}

interface TwoFactorCardProps {
  enabled: boolean;
  onToggle: () => void;
  isPending: boolean;
}

export function TwoFactorCard({
  enabled,
  onToggle,
  isPending,
}: TwoFactorCardProps): React.ReactElement {
  const [setupOpen, setSetupOpen] = useState(false);
  const [disableOpen, setDisableOpen] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [isSettingUp, startSetup] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleStartSetup = (): void => {
    setError(null);
    startSetup(async () => {
      try {
        const response = await fetch("/api/settings/security/2fa/setup", {
          method: "POST",
        });
        const data = (await response.json()) as ApiResponse;

        if (!response.ok) {
          throw new Error(data.error ?? "Failed to start setup");
        }

        setQrCode(data.qrCode ?? null);
        setSecret(data.secret ?? null);
        setSetupOpen(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to start setup");
      }
    });
  };

  const handleVerify = (): void => {
    setError(null);
    startSetup(async () => {
      try {
        const response = await fetch("/api/settings/security/2fa/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: verificationCode }),
        });
        const data = (await response.json()) as ApiResponse;

        if (!response.ok) {
          throw new Error(data.error ?? "Invalid verification code");
        }

        setSetupOpen(false);
        setVerificationCode("");
        onToggle();
        toast({
          title: "Two-factor authentication enabled",
          description: "Your account is now more secure.",
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Verification failed");
      }
    });
  };

  const handleDisable = (): void => {
    setError(null);
    startSetup(async () => {
      try {
        const response = await fetch("/api/settings/security/2fa", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: verificationCode }),
        });
        const data = (await response.json()) as ApiResponse;

        if (!response.ok) {
          throw new Error(data.error ?? "Failed to disable 2FA");
        }

        setDisableOpen(false);
        setVerificationCode("");
        onToggle();
        toast({
          title: "Two-factor authentication disabled",
          description: "Your account is now less secure.",
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to disable 2FA");
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          <CardTitle>Two-Factor Authentication</CardTitle>
        </div>
        <CardDescription>
          Add an extra layer of security to your account by requiring a verification code.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-base">{enabled ? "2FA is enabled" : "2FA is disabled"}</Label>
            <p className="text-muted-foreground text-sm">
              {enabled
                ? "Your account is protected with two-factor authentication"
                : "Enable 2FA to add an extra layer of security"}
            </p>
          </div>
          {enabled ? (
            <Dialog open={disableOpen} onOpenChange={setDisableOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">Disable</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Disable Two-Factor Authentication</DialogTitle>
                  <DialogDescription>
                    Enter your verification code to confirm you want to disable 2FA.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  {error && (
                    <div className="bg-destructive/10 text-destructive rounded-lg p-3 text-sm">
                      {error}
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="disable-code">Verification Code</Label>
                    <Input
                      id="disable-code"
                      value={verificationCode}
                      onChange={(e) => {
                        setVerificationCode(e.target.value);
                      }}
                      placeholder="Enter 6-digit code"
                      maxLength={6}
                      disabled={isSettingUp}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="destructive"
                    onClick={handleDisable}
                    disabled={isSettingUp || verificationCode.length !== 6}
                  >
                    {isSettingUp ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Disabling...
                      </>
                    ) : (
                      "Disable 2FA"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          ) : (
            <>
              <Button onClick={handleStartSetup} disabled={isPending || isSettingUp}>
                {isSettingUp ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Setting up...
                  </>
                ) : (
                  "Enable 2FA"
                )}
              </Button>
              <Dialog open={setupOpen} onOpenChange={setSetupOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Set Up Two-Factor Authentication</DialogTitle>
                    <DialogDescription>
                      Scan the QR code with your authenticator app, then enter the verification
                      code.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    {error && (
                      <div className="bg-destructive/10 text-destructive rounded-lg p-3 text-sm">
                        {error}
                      </div>
                    )}
                    {qrCode && (
                      <div className="flex justify-center">
                        <Image
                          src={qrCode}
                          alt="2FA QR Code"
                          width={192}
                          height={192}
                          unoptimized
                        />
                      </div>
                    )}
                    {secret && (
                      <div className="space-y-2 text-center">
                        <p className="text-muted-foreground text-sm">
                          Or enter this code manually:
                        </p>
                        <code className="bg-muted rounded px-2 py-1 text-sm">{secret}</code>
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="verify-code">Verification Code</Label>
                      <Input
                        id="verify-code"
                        value={verificationCode}
                        onChange={(e) => {
                          setVerificationCode(e.target.value);
                        }}
                        placeholder="Enter 6-digit code"
                        maxLength={6}
                        disabled={isSettingUp}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      onClick={handleVerify}
                      disabled={isSettingUp || verificationCode.length !== 6}
                    >
                      {isSettingUp ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        "Verify & Enable"
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface SessionsCardProps {
  sessions: ActiveSession[];
  onRevoke: (sessionId: string) => void;
  onRevokeAll: () => void;
  isPending: boolean;
}

export function SessionsCard({
  sessions,
  onRevoke,
  onRevokeAll,
  isPending,
}: SessionsCardProps): React.ReactElement {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            <CardTitle>Active Sessions</CardTitle>
          </div>
          {sessions.length > 1 && (
            <Button variant="outline" size="sm" onClick={onRevokeAll} disabled={isPending}>
              Sign out all other devices
            </Button>
          )}
        </div>
        <CardDescription>Manage devices where you are currently signed in.</CardDescription>
      </CardHeader>
      <CardContent>
        {sessions.length === 0 ? (
          <p className="text-muted-foreground text-sm">No active sessions found.</p>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex items-center gap-3">
                  <Smartphone className="text-muted-foreground h-5 w-5" />
                  <div>
                    <p className="font-medium">
                      {session.browser ?? session.deviceName ?? "Unknown Device"}
                      {session.isCurrent && (
                        <span className="text-primary ml-2 text-xs">(Current)</span>
                      )}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {session.location ?? "Unknown location"}
                      {session.ipAddress && ` - ${session.ipAddress}`}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      Last active: {new Date(session.lastActiveAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                {!session.isCurrent && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      onRevoke(session.id);
                    }}
                    disabled={isPending}
                  >
                    <LogOut className="mr-1 h-3 w-3" />
                    Sign out
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface LoginHistoryCardProps {
  history: LoginEvent[];
}

export function LoginHistoryCard({ history }: LoginHistoryCardProps): React.ReactElement {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <History className="h-5 w-5" />
          <CardTitle>Login History</CardTitle>
        </div>
        <CardDescription>Recent sign-in activity on your account.</CardDescription>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <p className="text-muted-foreground text-sm">No login history available.</p>
        ) : (
          <div className="space-y-2">
            {history.map((event) => (
              <div
                key={event.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div>
                  <p className="text-sm font-medium">
                    {event.successful ? (
                      <span className="text-green-600">Successful sign-in</span>
                    ) : (
                      <span className="text-destructive">Failed sign-in attempt</span>
                    )}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {event.browser ?? "Unknown browser"} - {event.location ?? "Unknown location"}
                  </p>
                </div>
                <p className="text-muted-foreground text-xs">
                  {new Date(event.createdAt).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface SecurityNotificationsCardProps {
  enabled: boolean;
  onToggle: (value: boolean) => void;
  isPending: boolean;
}

export function SecurityNotificationsCard({
  enabled,
  onToggle,
  isPending,
}: SecurityNotificationsCardProps): React.ReactElement {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          <CardTitle>Security Notifications</CardTitle>
        </div>
        <CardDescription>
          Get notified about important security events on your account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-base">Email alerts for security events</Label>
            <p className="text-muted-foreground text-sm">
              New sign-ins, password changes, and suspicious activity
            </p>
          </div>
          <Switch checked={enabled} onCheckedChange={onToggle} disabled={isPending} />
        </div>
      </CardContent>
    </Card>
  );
}

export type { SecuritySettings, ActiveSession, LoginEvent };

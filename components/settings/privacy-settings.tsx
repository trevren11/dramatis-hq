"use client";

import { useState } from "react";
import { Loader2, Download, Trash2, UserX, Link as LinkIcon, Activity } from "lucide-react";
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

interface BlockedUser {
  id: string;
  name: string | null;
  email: string;
  blockedAt: string;
}

interface ThirdPartyConnection {
  id: string;
  provider: string;
  connectedAt: string;
}

interface PrivacySettings {
  activityVisible: boolean;
  blockedUsers: BlockedUser[];
  connections: ThirdPartyConnection[];
}

interface DataExportCardProps {
  onExport: () => void;
  isExporting: boolean;
}

export function DataExportCard({ onExport, isExporting }: DataExportCardProps): React.ReactElement {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          <CardTitle>Export Your Data</CardTitle>
        </div>
        <CardDescription>
          Download a copy of all your data in compliance with GDPR regulations.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground text-sm">
          We will prepare a downloadable archive containing all your personal data, including
          profile information, messages, and activity history. This may take a few minutes.
        </p>
        <Button onClick={onExport} disabled={isExporting}>
          {isExporting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Preparing export...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Request Data Export
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

interface ActivityVisibilityCardProps {
  activityVisible: boolean;
  onToggle: (value: boolean) => void;
  isPending: boolean;
}

export function ActivityVisibilityCard({
  activityVisible,
  onToggle,
  isPending,
}: ActivityVisibilityCardProps): React.ReactElement {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          <CardTitle>Activity Visibility</CardTitle>
        </div>
        <CardDescription>Control who can see your activity on the platform.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-base">Show my activity</Label>
            <p className="text-muted-foreground text-sm">
              {activityVisible
                ? "Others can see when you're active"
                : "Your activity status is hidden"}
            </p>
          </div>
          <Switch checked={activityVisible} onCheckedChange={onToggle} disabled={isPending} />
        </div>
      </CardContent>
    </Card>
  );
}

interface BlockListCardProps {
  blockedUsers: BlockedUser[];
  onUnblock: (userId: string) => void;
  onBlock: (email: string) => void;
  isPending: boolean;
}

export function BlockListCard({
  blockedUsers,
  onUnblock,
  onBlock,
  isPending,
}: BlockListCardProps): React.ReactElement {
  const [blockEmail, setBlockEmail] = useState("");

  const handleBlock = (): void => {
    if (blockEmail.trim()) {
      onBlock(blockEmail.trim());
      setBlockEmail("");
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <UserX className="h-5 w-5" />
          <CardTitle>Blocked Users</CardTitle>
        </div>
        <CardDescription>
          Manage users you have blocked. Blocked users cannot contact you or view your profile.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Enter email to block"
            value={blockEmail}
            onChange={(e) => {
              setBlockEmail(e.target.value);
            }}
            disabled={isPending}
          />
          <Button onClick={handleBlock} disabled={isPending || !blockEmail.trim()}>
            Block
          </Button>
        </div>

        {blockedUsers.length === 0 ? (
          <p className="text-muted-foreground text-sm">You have not blocked any users.</p>
        ) : (
          <div className="space-y-2">
            {blockedUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div>
                  <p className="font-medium">{user.name ?? user.email}</p>
                  <p className="text-muted-foreground text-xs">
                    Blocked {new Date(user.blockedAt).toLocaleDateString()}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onUnblock(user.id);
                  }}
                  disabled={isPending}
                >
                  Unblock
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface ConnectionsCardProps {
  connections: ThirdPartyConnection[];
  onDisconnect: (connectionId: string) => void;
  isPending: boolean;
}

export function ConnectionsCard({
  connections,
  onDisconnect,
  isPending,
}: ConnectionsCardProps): React.ReactElement {
  const providerNames: Record<string, string> = {
    google: "Google",
    github: "GitHub",
    facebook: "Facebook",
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <LinkIcon className="h-5 w-5" />
          <CardTitle>Third-Party Connections</CardTitle>
        </div>
        <CardDescription>Manage external services connected to your account.</CardDescription>
      </CardHeader>
      <CardContent>
        {connections.length === 0 ? (
          <p className="text-muted-foreground text-sm">No third-party services connected.</p>
        ) : (
          <div className="space-y-2">
            {connections.map((connection) => (
              <div
                key={connection.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div>
                  <p className="font-medium">
                    {providerNames[connection.provider] ?? connection.provider}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    Connected {new Date(connection.connectedAt).toLocaleDateString()}
                  </p>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" disabled={isPending}>
                      Disconnect
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Disconnect {providerNames[connection.provider]}?</DialogTitle>
                      <DialogDescription>
                        You will no longer be able to sign in using this account. Make sure you have
                        another way to access your account.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button
                        variant="destructive"
                        onClick={() => {
                          onDisconnect(connection.id);
                        }}
                        disabled={isPending}
                      >
                        Disconnect
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface DeleteDataCardProps {
  onDelete: () => void;
  isDeleting: boolean;
}

export function DeleteDataCard({ onDelete, isDeleting }: DeleteDataCardProps): React.ReactElement {
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");

  const handleDelete = (): void => {
    if (confirmation === "DELETE MY DATA") {
      onDelete();
      setOpen(false);
    }
  };

  return (
    <Card className="border-destructive">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Trash2 className="text-destructive h-5 w-5" />
          <CardTitle className="text-destructive">Delete All Data</CardTitle>
        </div>
        <CardDescription>
          Permanently delete all your data from our servers. This action cannot be undone.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="destructive">Delete All My Data</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete All Data</DialogTitle>
              <DialogDescription>
                This will permanently delete all your data including your profile, messages,
                applications, and any other information associated with your account.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="delete-confirmation">
                  Type <strong>DELETE MY DATA</strong> to confirm
                </Label>
                <Input
                  id="delete-confirmation"
                  value={confirmation}
                  onChange={(e) => {
                    setConfirmation(e.target.value);
                  }}
                  placeholder="DELETE MY DATA"
                  disabled={isDeleting}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setOpen(false);
                }}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting || confirmation !== "DELETE MY DATA"}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete All Data"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

export type { PrivacySettings, BlockedUser, ThirdPartyConnection };

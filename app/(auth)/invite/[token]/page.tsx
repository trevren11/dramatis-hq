"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ORGANIZATION_ROLE_OPTIONS, SHOW_ROLE_OPTIONS } from "@/lib/db/schema/permissions";

interface InvitationDetails {
  id: string;
  email: string;
  type: "organization" | "show";
  targetId: string;
  organizationRole: string | null;
  showRole: string | null;
  status: string;
  expiresAt: string;
  invitedAt: string;
}

interface InviterDetails {
  name: string | null;
  email: string;
}

interface InvitationResponse {
  invitation: InvitationDetails;
  inviter: InviterDetails | null;
  isExpired: boolean;
  isAlreadyResponded: boolean;
}

interface ApiError {
  error: string;
}

function getRoleLabel(role: string | null, type: "organization" | "show"): string {
  if (!role) return "Unknown Role";
  const options = type === "organization" ? ORGANIZATION_ROLE_OPTIONS : SHOW_ROLE_OPTIONS;
  const option = options.find((r) => r.value === role);
  return option?.label ?? role;
}

function LoadingState(): React.ReactElement {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-full" />
        </CardHeader>
        <CardContent>
          <Skeleton className="mb-4 h-24 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

function ErrorState({
  error,
  onGoHome,
}: {
  error: string;
  onGoHome: () => void;
}): React.ReactElement {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Invitation Error</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={onGoHome} className="w-full">
            Go Home
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function ExpiredState({ onGoHome }: { onGoHome: () => void }): React.ReactElement {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Invitation Expired</CardTitle>
          <CardDescription>
            This invitation has expired. Please ask the sender to send a new invitation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={onGoHome} className="w-full">
            Go Home
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function RespondedState({ onGoHome }: { onGoHome: () => void }): React.ReactElement {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Already Responded</CardTitle>
          <CardDescription>You have already responded to this invitation.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={onGoHome} className="w-full">
            Go Home
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// eslint-disable-next-line complexity
export default function InvitationPage(): React.ReactElement {
  const params = useParams();
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const token = params.token as string;

  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [invitation, setInvitation] = React.useState<InvitationDetails | null>(null);
  const [inviter, setInviter] = React.useState<InviterDetails | null>(null);
  const [isExpired, setIsExpired] = React.useState(false);
  const [isResponded, setIsResponded] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchInvitation = async (): Promise<void> => {
      try {
        const response = await fetch(`/api/invitations/${token}`);
        if (!response.ok) {
          if (response.status === 404) {
            setError("Invitation not found");
          } else {
            setError("Failed to load invitation");
          }
          return;
        }

        const data = (await response.json()) as InvitationResponse;
        setInvitation(data.invitation);
        setInviter(data.inviter);
        setIsExpired(data.isExpired);
        setIsResponded(data.isAlreadyResponded);
      } catch {
        setError("Failed to load invitation");
      } finally {
        setLoading(false);
      }
    };

    void fetchInvitation();
  }, [token]);

  const handleGoHome = (): void => {
    router.push("/");
  };

  const handleLogin = (): void => {
    router.push(`/login?callbackUrl=/invite/${token}`);
  };

  const handleSignup = (): void => {
    router.push(`/signup?callbackUrl=/invite/${token}`);
  };

  const handleResponse = async (accept: boolean): Promise<void> => {
    if (!session) {
      handleLogin();
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(`/api/invitations/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accept }),
      });

      if (!response.ok) {
        const data = (await response.json()) as ApiError;
        setError(data.error || "Failed to respond to invitation");
        return;
      }

      // Redirect based on invitation type
      if (accept && invitation) {
        if (invitation.type === "organization") {
          router.push("/producer/staff");
        } else {
          router.push(`/producer/shows/${invitation.targetId}/staff`);
        }
      } else {
        router.push("/");
      }
    } catch {
      setError("Failed to respond to invitation");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAccept = (): void => {
    void handleResponse(true);
  };

  const handleDecline = (): void => {
    void handleResponse(false);
  };

  if (loading || sessionStatus === "loading") {
    return <LoadingState />;
  }

  if (error || !invitation) {
    return (
      <ErrorState error={error ?? "This invitation is no longer valid."} onGoHome={handleGoHome} />
    );
  }

  if (isExpired) {
    return <ExpiredState onGoHome={handleGoHome} />;
  }

  if (isResponded) {
    return <RespondedState onGoHome={handleGoHome} />;
  }

  const role = invitation.organizationRole ?? invitation.showRole;

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>You&apos;re Invited!</CardTitle>
          <CardDescription>
            {inviter?.name ?? inviter?.email ?? "Someone"} has invited you to join{" "}
            {invitation.type === "organization" ? "their organization" : "a show"}.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted rounded-lg p-4">
            <div className="mb-2 flex items-center gap-2">
              <span className="text-sm font-medium">Role:</span>
              <Badge variant="secondary">{getRoleLabel(role, invitation.type)}</Badge>
            </div>
            <div className="text-muted-foreground text-sm">
              {invitation.type === "organization"
                ? "You will have access to all shows in this organization based on your role."
                : "You will be able to access and contribute to this specific show."}
            </div>
          </div>

          {!session ? (
            <div className="space-y-4">
              <p className="text-muted-foreground text-sm">
                Please log in or create an account to accept this invitation.
              </p>
              <div className="flex gap-2">
                <Button onClick={handleLogin} className="flex-1">
                  Log In
                </Button>
                <Button variant="outline" onClick={handleSignup} className="flex-1">
                  Sign Up
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button onClick={handleAccept} disabled={submitting} className="flex-1">
                {submitting ? "Accepting..." : "Accept"}
              </Button>
              <Button
                variant="outline"
                onClick={handleDecline}
                disabled={submitting}
                className="flex-1"
              >
                {submitting ? "..." : "Decline"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

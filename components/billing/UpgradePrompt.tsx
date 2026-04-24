"use client";

import * as React from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { SubscriptionCheck } from "@/lib/subscription-guard";

interface UpgradePromptProps {
  check: SubscriptionCheck;
}

interface PortalResponse {
  url?: string;
}

export function UpgradePrompt({ check }: UpgradePromptProps): React.ReactElement | null {
  const getTitle = (): string => {
    switch (check.status) {
      case "trialing":
        return "Trial Ending Soon";
      case "past_due":
        return "Payment Required";
      case "canceled":
        return "Subscription Canceled";
      case "expired":
        return "Trial Expired";
      case "no_subscription":
      default:
        return "Subscription Required";
    }
  };

  const getDescription = (): string => {
    if (check.message) return check.message;

    switch (check.status) {
      case "trialing":
        return `Your trial ends in ${String(check.daysRemaining)} day${check.daysRemaining === 1 ? "" : "s"}. Subscribe now to continue using all features.`;
      case "past_due":
        return "Your payment method was declined. Please update it to continue.";
      case "canceled":
        return "Your subscription has been canceled. Resubscribe to regain access.";
      case "expired":
        return "Your trial has expired. Subscribe to continue.";
      case "no_subscription":
      default:
        return "Subscribe to access producer features.";
    }
  };

  const getActionText = (): string => {
    switch (check.status) {
      case "trialing":
        return "Subscribe Now";
      case "past_due":
        return "Update Payment";
      case "canceled":
      case "expired":
      case "no_subscription":
      default:
        return "View Plans";
    }
  };

  const handleAction = async (): Promise<void> => {
    if (check.status === "past_due") {
      const response = await fetch("/api/billing/portal");
      const data = (await response.json()) as PortalResponse;
      if (data.url) {
        window.location.href = data.url;
      }
    } else {
      window.location.href = "/pricing";
    }
  };

  // Only show for concerning statuses
  if (check.hasAccess && check.status === "active") {
    return null;
  }

  // Show a less intrusive banner for trials with > 3 days
  if (check.status === "trialing" && check.daysRemaining && check.daysRemaining > 3) {
    return null;
  }

  const isWarning = check.status === "trialing" || (check.status === "canceled" && check.hasAccess);
  const isError = !check.hasAccess;

  return (
    <Card
      className={
        isError
          ? "border-destructive bg-destructive/5"
          : isWarning
            ? "border-yellow-500 bg-yellow-50"
            : ""
      }
    >
      <CardHeader className="pb-2">
        <CardTitle className={isError ? "text-destructive" : isWarning ? "text-yellow-700" : ""}>
          {getTitle()}
        </CardTitle>
        <CardDescription className={isWarning ? "text-yellow-600" : ""}>
          {getDescription()}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          onClick={() => void handleAction()}
          variant={isError ? "default" : "outline"}
          className={isWarning ? "border-yellow-500 text-yellow-700 hover:bg-yellow-100" : ""}
        >
          {getActionText()}
        </Button>
      </CardContent>
    </Card>
  );
}

export function SubscriptionBlocker({ check }: UpgradePromptProps): React.ReactElement | null {
  if (check.hasAccess) {
    return null;
  }

  return (
    <div className="bg-background/80 fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
      <Card className="mx-4 max-w-md">
        <CardHeader>
          <CardTitle>Access Restricted</CardTitle>
          <CardDescription>{check.message ?? "Subscription required"}</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-3">
          <Button asChild>
            <Link href="/pricing">View Plans</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">Go Home</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

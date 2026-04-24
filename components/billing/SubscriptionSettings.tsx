"use client";

import * as React from "react";
import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Subscription } from "@/lib/db/schema";

interface SubscriptionSettingsProps {
  subscription: Subscription | null;
}

interface PortalResponse {
  url?: string;
}

export function SubscriptionSettings({
  subscription,
}: SubscriptionSettingsProps): React.ReactElement {
  const [isLoadingPortal, setIsLoadingPortal] = useState(false);

  const openCustomerPortal = async (): Promise<void> => {
    setIsLoadingPortal(true);
    try {
      const response = await fetch("/api/billing/portal");
      const data = (await response.json()) as PortalResponse;

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Failed to open customer portal:", error);
    } finally {
      setIsLoadingPortal(false);
    }
  };

  if (!subscription) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Subscription</CardTitle>
          <CardDescription>You don&apos;t have an active subscription</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/pricing">View Plans</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const statusColors: Record<string, string> = {
    active: "bg-green-100 text-green-800",
    trialing: "bg-blue-100 text-blue-800",
    past_due: "bg-yellow-100 text-yellow-800",
    canceled: "bg-gray-100 text-gray-800",
    unpaid: "bg-red-100 text-red-800",
  };

  const formatDate = (date: Date | null): string => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Subscription</CardTitle>
            <CardDescription>Manage your subscription and billing</CardDescription>
          </div>
          <Badge className={statusColors[subscription.status] ?? ""}>
            {subscription.status.replace("_", " ")}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-muted-foreground text-sm">Plan</p>
            <p className="font-medium capitalize">{subscription.plan ?? "N/A"}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-sm">Status</p>
            <p className="font-medium capitalize">{subscription.status.replace("_", " ")}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-sm">Current Period</p>
            <p className="font-medium">
              {formatDate(subscription.currentPeriodStart)} -{" "}
              {formatDate(subscription.currentPeriodEnd)}
            </p>
          </div>
          {subscription.trialEnd && (
            <div>
              <p className="text-muted-foreground text-sm">Trial Ends</p>
              <p className="font-medium">{formatDate(subscription.trialEnd)}</p>
            </div>
          )}
          {subscription.cancelAtPeriodEnd && (
            <div className="sm:col-span-2">
              <p className="text-muted-foreground text-sm">Cancels On</p>
              <p className="text-destructive font-medium">
                {formatDate(subscription.cancelAtPeriodEnd)}
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          <Button onClick={() => void openCustomerPortal()} disabled={isLoadingPortal}>
            {isLoadingPortal ? "Loading..." : "Manage Subscription"}
          </Button>
          {subscription.status === "active" && !subscription.cancelAtPeriodEnd && (
            <Button variant="outline" onClick={() => void openCustomerPortal()}>
              Change Plan
            </Button>
          )}
        </div>

        <p className="text-muted-foreground text-sm">
          Use the customer portal to update payment methods, change plans, or cancel your
          subscription.
        </p>
      </CardContent>
    </Card>
  );
}

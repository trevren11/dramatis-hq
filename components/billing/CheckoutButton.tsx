"use client";

import * as React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CheckoutButtonProps {
  plan: "monthly" | "annual";
  className?: string;
}

interface CheckoutResponse {
  sessionId?: string;
  url?: string;
  error?: string;
}

export function CheckoutButton({ plan, className }: CheckoutButtonProps): React.ReactElement {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });

      const data = (await response.json()) as CheckoutResponse;

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to create checkout session");
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL received");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
      console.error("Checkout error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Button
        onClick={() => void handleCheckout()}
        disabled={isLoading}
        size="lg"
        className="w-full"
      >
        {isLoading ? "Loading..." : "Start Free Trial"}
      </Button>
      {error && <p className="text-destructive text-center text-sm">{error}</p>}
    </div>
  );
}

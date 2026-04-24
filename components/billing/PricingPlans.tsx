"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckoutButton } from "./CheckoutButton";

const PLANS = [
  {
    id: "monthly" as const,
    name: "Monthly",
    price: 29,
    interval: "month",
    features: [
      "Unlimited casting calls",
      "Talent search and filtering",
      "Direct messaging with talent",
      "Calendar management",
      "Document storage",
    ],
  },
  {
    id: "annual" as const,
    name: "Annual",
    price: 290,
    interval: "year",
    discount: "Save 17%",
    features: [
      "Everything in Monthly",
      "Priority support",
      "Advanced analytics",
      "Custom branding",
      "API access",
    ],
    popular: true,
  },
];

export function PricingPlans(): React.ReactElement {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Choose Your Plan</h2>
        <p className="text-muted-foreground mt-2">
          Start with a 14-day free trial. Cancel anytime.
        </p>
      </div>

      <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
        {PLANS.map((plan) => (
          <Card key={plan.id} className={plan.popular ? "border-primary shadow-lg" : ""}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{plan.name}</CardTitle>
                <div className="flex gap-2">
                  {plan.discount && <Badge variant="secondary">{plan.discount}</Badge>}
                  {plan.popular && <Badge>Most Popular</Badge>}
                </div>
              </div>
              <CardDescription>
                <span className="text-foreground text-3xl font-bold">${plan.price}</span>
                <span className="text-muted-foreground">/{plan.interval}</span>
              </CardDescription>
            </CardHeader>

            <CardContent>
              <ul className="space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <svg
                      className="h-4 w-4 flex-shrink-0 text-green-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>

            <CardFooter>
              <CheckoutButton plan={plan.id} className="w-full" />
            </CardFooter>
          </Card>
        ))}
      </div>

      <p className="text-muted-foreground text-center text-sm">
        All plans include a 14-day free trial. No credit card required to start.
      </p>
    </div>
  );
}

"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Invoice } from "@/lib/db/schema";

interface BillingHistoryProps {
  invoices: Invoice[];
}

export function BillingHistory({ invoices }: BillingHistoryProps): React.ReactElement {
  const formatCurrency = (amount: number, currency: string): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const formatDate = (date: Date | null): string => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const statusColors: Record<string, string> = {
    paid: "bg-green-100 text-green-800",
    open: "bg-yellow-100 text-yellow-800",
    draft: "bg-gray-100 text-gray-800",
    uncollectible: "bg-red-100 text-red-800",
    void: "bg-gray-100 text-gray-800",
  };

  if (invoices.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Billing History</CardTitle>
          <CardDescription>Your invoice history will appear here</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">No invoices yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Billing History</CardTitle>
        <CardDescription>View and download your past invoices</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {invoices.map((invoice) => (
            <div
              key={invoice.id}
              className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium">
                    {formatCurrency(invoice.amountDue, invoice.currency)}
                  </p>
                  <Badge className={statusColors[invoice.status] ?? ""}>{invoice.status}</Badge>
                </div>
                <p className="text-muted-foreground text-sm">
                  {formatDate(invoice.periodStart)} - {formatDate(invoice.periodEnd)}
                </p>
                {invoice.paidAt && (
                  <p className="text-muted-foreground text-xs">
                    Paid on {formatDate(invoice.paidAt)}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                {invoice.invoiceUrl && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={invoice.invoiceUrl} target="_blank" rel="noopener noreferrer">
                      View
                    </a>
                  </Button>
                )}
                {invoice.invoicePdf && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={invoice.invoicePdf} target="_blank" rel="noopener noreferrer">
                      Download
                    </a>
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

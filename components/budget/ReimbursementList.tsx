"use client";

import { useState, useEffect, useCallback } from "react";
import { FileCheck, Check, X, Loader2, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ReimbursementWithDetails {
  id: string;
  expenseId: string;
  status: string;
  amountRequested: string;
  justification: string | null;
  requestedAt: Date;
  reviewedAt: Date | null;
  reviewNote: string | null;
  paidAt: Date | null;
  expense: {
    id: string;
    amount: string;
    vendor: string | null;
    description: string | null;
    date: Date;
    submitter?: { name: string | null; email: string } | null;
  };
  requester?: { name: string | null; email: string } | null;
  reviewer?: { name: string | null; email: string } | null;
}

interface ReimbursementListProps {
  showId: string;
}

// eslint-disable-next-line complexity
export function ReimbursementList({ showId }: ReimbursementListProps): React.ReactElement {
  const [reimbursements, setReimbursements] = useState<ReimbursementWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewDialog, setReviewDialog] = useState<{
    reimbursement: ReimbursementWithDetails;
    action: "approve" | "deny";
  } | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [processing, setProcessing] = useState(false);

  const fetchReimbursements = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const response = await fetch(`/api/shows/${showId}/budget/reimbursements?limit=100`);
      if (!response.ok) throw new Error("Failed to fetch reimbursements");
      const data = (await response.json()) as { reimbursements: ReimbursementWithDetails[] };
      setReimbursements(data.reimbursements);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch reimbursements");
    } finally {
      setLoading(false);
    }
  }, [showId]);

  useEffect(() => {
    void fetchReimbursements();
  }, [fetchReimbursements]);

  const handleReview = async (): Promise<void> => {
    if (!reviewDialog) return;

    setProcessing(true);
    try {
      const response = await fetch(
        `/api/shows/${showId}/budget/reimbursements/${reviewDialog.reimbursement.id}?action=review`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: reviewDialog.action === "approve" ? "approved" : "denied",
            reviewNote: reviewNote || null,
          }),
        }
      );

      if (!response.ok) {
        const errorData = (await response.json()) as { error?: string };
        throw new Error(errorData.error ?? "Failed to review reimbursement");
      }

      const data = (await response.json()) as { reimbursement: Partial<ReimbursementWithDetails> };
      setReimbursements(
        reimbursements.map((r) =>
          r.id === reviewDialog.reimbursement.id ? { ...r, ...data.reimbursement } : r
        )
      );
      setReviewDialog(null);
      setReviewNote("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to review reimbursement");
    } finally {
      setProcessing(false);
    }
  };

  const handleMarkPaid = async (reimbursement: ReimbursementWithDetails): Promise<void> => {
    try {
      const response = await fetch(
        `/api/shows/${showId}/budget/reimbursements/${reimbursement.id}?action=pay`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        }
      );

      if (!response.ok) {
        const errorData = (await response.json()) as { error?: string };
        throw new Error(errorData.error ?? "Failed to mark as paid");
      }

      const data = (await response.json()) as { reimbursement: Partial<ReimbursementWithDetails> };
      setReimbursements(
        reimbursements.map((r) => (r.id === reimbursement.id ? { ...r, ...data.reimbursement } : r))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to mark as paid");
    }
  };

  const getStatusVariant = (
    status: string
  ): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "pending":
        return "secondary";
      case "approved":
        return "default";
      case "denied":
        return "destructive";
      case "paid":
        return "outline";
      default:
        return "secondary";
    }
  };

  const pendingCount = reimbursements.filter((r) => r.status === "pending").length;
  const approvedCount = reimbursements.filter((r) => r.status === "approved").length;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Reimbursement Requests</span>
            {pendingCount > 0 && <Badge variant="secondary">{pendingCount} pending</Badge>}
          </CardTitle>
          {approvedCount > 0 && (
            <CardDescription>{approvedCount} approved and awaiting payment</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
            </div>
          ) : reimbursements.length === 0 ? (
            <div className="text-muted-foreground py-8 text-center">
              No reimbursement requests yet.
            </div>
          ) : (
            <div className="space-y-3">
              {reimbursements.map((reimbursement) => (
                <div
                  key={reimbursement.id}
                  className="flex items-start gap-3 rounded-lg border p-4"
                >
                  <div className="bg-muted flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
                    <FileCheck className="text-muted-foreground h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-medium">
                        {reimbursement.expense.vendor ??
                          reimbursement.expense.description ??
                          "Expense"}
                      </p>
                      <Badge variant={getStatusVariant(reimbursement.status)}>
                        {reimbursement.status}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground text-sm">
                      Requested by{" "}
                      {reimbursement.requester?.name ?? reimbursement.requester?.email ?? "Unknown"}{" "}
                      on {new Date(reimbursement.requestedAt).toLocaleDateString()}
                    </p>
                    {reimbursement.justification && (
                      <p className="mt-1 text-sm">{reimbursement.justification}</p>
                    )}
                    {reimbursement.reviewNote && (
                      <p className="text-muted-foreground mt-1 text-sm italic">
                        Note: {reimbursement.reviewNote}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      ${Number(reimbursement.amountRequested).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    {reimbursement.status === "pending" && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-green-600 hover:text-green-700"
                          onClick={() => {
                            setReviewDialog({ reimbursement, action: "approve" });
                          }}
                          title="Approve"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-600"
                          onClick={() => {
                            setReviewDialog({ reimbursement, action: "deny" });
                          }}
                          title="Deny"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    {reimbursement.status === "approved" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          void handleMarkPaid(reimbursement);
                        }}
                        title="Mark as Paid"
                      >
                        <DollarSign className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={!!reviewDialog}
        onOpenChange={(open) => {
          if (!open) {
            setReviewDialog(null);
            setReviewNote("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reviewDialog?.action === "approve" ? "Approve" : "Deny"} Reimbursement
            </DialogTitle>
            <DialogDescription>
              {reviewDialog?.action === "approve"
                ? "Approve this reimbursement request for payment."
                : "Deny this reimbursement request with an optional note."}
            </DialogDescription>
          </DialogHeader>

          {reviewDialog && (
            <div className="space-y-4">
              <div className="rounded-lg border p-3">
                <p className="font-medium">
                  {reviewDialog.reimbursement.expense.vendor ??
                    reviewDialog.reimbursement.expense.description}
                </p>
                <p className="text-muted-foreground text-sm">
                  Amount: ${Number(reviewDialog.reimbursement.amountRequested).toLocaleString()}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Note (optional)</label>
                <Textarea
                  value={reviewNote}
                  onChange={(e) => {
                    setReviewNote(e.target.value);
                  }}
                  placeholder={
                    reviewDialog.action === "approve"
                      ? "Add any notes about this approval..."
                      : "Explain why this request was denied..."
                  }
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setReviewDialog(null);
                setReviewNote("");
              }}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button
              variant={reviewDialog?.action === "approve" ? "default" : "destructive"}
              onClick={() => {
                void handleReview();
              }}
              disabled={processing}
            >
              {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {reviewDialog?.action === "approve" ? "Approve" : "Deny"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

"use client";

import React, { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import { format, addDays } from "date-fns";
import {
  Mail,
  Users,
  Eye,
  Send,
  Check,
  ChevronLeft,
  ChevronRight,
  Calendar,
  AlertCircle,
} from "lucide-react";
import type { EmailTemplate } from "@/lib/db/schema/notifications";

interface Recipient {
  id: string;
  assignmentId: string;
  talentName: string;
  stageName: string | null;
  roleName: string;
  status: string;
}

interface SendNotificationFlowProps {
  showId: string;
  showTitle: string;
  organizationName: string;
  recipients: Recipient[];
  templates: EmailTemplate[];
  onClose: () => void;
  onSuccess?: () => void;
}

type Step = "select" | "compose" | "preview" | "send";

interface MergeFieldData {
  talent_name: string;
  talent_first_name: string;
  role_name: string;
  show_title: string;
  organization_name: string;
  response_deadline: string;
  rehearsal_start: string;
  performance_dates: string;
  venue: string;
  accept_link: string;
  decline_link: string;
}

function renderTemplate(template: string, data: Partial<MergeFieldData>): string {
  let rendered = template;
  for (const [key, value] of Object.entries(data) as [string, string | undefined][]) {
    rendered = rendered.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value ?? "");
  }
  return rendered;
}

// eslint-disable-next-line complexity
export function SendNotificationFlow({
  showId,
  showTitle,
  organizationName,
  recipients,
  templates,
  onClose,
  onSuccess,
}: SendNotificationFlowProps): React.ReactElement {
  const { toast } = useToast();
  const [step, setStep] = useState<Step>("select");
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>(
    recipients.map((r) => r.assignmentId)
  );
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [responseDeadline, setResponseDeadline] = useState(
    format(addDays(new Date(), 7), "yyyy-MM-dd")
  );
  const [previewRecipient, setPreviewRecipient] = useState<Recipient | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [sendResults, setSendResults] = useState<{
    total: number;
    sent: number;
    draft: number;
  } | null>(null);

  useEffect(() => {
    if (selectedTemplateId) {
      const template = templates.find((t) => t.id === selectedTemplateId);
      if (template) {
        setSubject(template.subject);
        setBody(template.body);
      }
    }
  }, [selectedTemplateId, templates]);

  const handleToggleRecipient = useCallback((assignmentId: string) => {
    setSelectedRecipients((prev) =>
      prev.includes(assignmentId)
        ? prev.filter((id) => id !== assignmentId)
        : [...prev, assignmentId]
    );
  }, []);

  const handleToggleAll = useCallback(() => {
    if (selectedRecipients.length === recipients.length) {
      setSelectedRecipients([]);
    } else {
      setSelectedRecipients(recipients.map((r) => r.assignmentId));
    }
  }, [recipients, selectedRecipients]);

  const handleSend = useCallback(async () => {
    setIsSending(true);
    try {
      const response = await fetch(`/api/shows/${showId}/notifications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignmentIds: selectedRecipients,
          templateId: selectedTemplateId,
          subject,
          body,
          responseDeadline: new Date(responseDeadline),
          sendImmediately: true,
        }),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Failed to send notifications");
      }

      const data = (await response.json()) as {
        summary: { total: number; sent: number; draft: number };
      };
      setSendResults(data.summary);
      setStep("send");

      toast({
        title: "Notifications sent",
        description: `Successfully sent ${String(data.summary.sent)} notification(s)`,
      });

      onSuccess?.();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send notifications",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  }, [
    showId,
    selectedRecipients,
    selectedTemplateId,
    subject,
    body,
    responseDeadline,
    toast,
    onSuccess,
  ]);

  const getPreviewData = useCallback(
    (recipient: Recipient): Partial<MergeFieldData> => ({
      talent_name: recipient.stageName ?? recipient.talentName,
      talent_first_name: recipient.talentName.split(" ")[0],
      role_name: recipient.roleName,
      show_title: showTitle,
      organization_name: organizationName,
      response_deadline: format(new Date(responseDeadline), "MMMM d, yyyy"),
      rehearsal_start: "TBD",
      performance_dates: "TBD",
      venue: "TBD",
      accept_link: "#",
      decline_link: "#",
    }),
    [showTitle, organizationName, responseDeadline]
  );

  const selectedCount = selectedRecipients.length;
  const canProceed =
    (step === "select" && selectedCount > 0) ||
    (step === "compose" && subject && body) ||
    step === "preview";

  return (
    <Dialog
      open
      onOpenChange={() => {
        onClose();
      }}
    >
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Send Cast Notifications
          </DialogTitle>
        </DialogHeader>

        <div className="mb-4 flex items-center justify-center gap-2">
          {(["select", "compose", "preview", "send"] as Step[]).map((s, i) => (
            <React.Fragment key={s}>
              {i > 0 && <div className="bg-muted h-px w-8" />}
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                  step === s
                    ? "bg-primary text-primary-foreground"
                    : step === "send" || ["select", "compose", "preview"].indexOf(step) > i
                      ? "bg-primary/20 text-primary"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {step === "send" && s !== "send" ? <Check className="h-4 w-4" /> : i + 1}
              </div>
            </React.Fragment>
          ))}
        </div>

        <div className="min-h-[400px]">
          {step === "select" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Select Recipients</Label>
                <Button variant="ghost" size="sm" onClick={handleToggleAll}>
                  {selectedRecipients.length === recipients.length ? "Deselect All" : "Select All"}
                </Button>
              </div>

              <ScrollArea className="h-[300px] rounded-md border">
                <div className="space-y-1 p-2">
                  {recipients.map((recipient) => (
                    <div
                      key={recipient.assignmentId}
                      role="button"
                      tabIndex={0}
                      className={`flex cursor-pointer items-center gap-3 rounded-md p-3 transition-colors ${
                        selectedRecipients.includes(recipient.assignmentId)
                          ? "bg-primary/10"
                          : "hover:bg-muted"
                      }`}
                      onClick={() => {
                        handleToggleRecipient(recipient.assignmentId);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleToggleRecipient(recipient.assignmentId);
                        }
                      }}
                    >
                      <Checkbox
                        checked={selectedRecipients.includes(recipient.assignmentId)}
                        onCheckedChange={() => {
                          handleToggleRecipient(recipient.assignmentId);
                        }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="font-medium">
                          {recipient.stageName ?? recipient.talentName}
                        </div>
                        <div className="text-muted-foreground text-sm">{recipient.roleName}</div>
                      </div>
                      <Badge
                        variant={
                          recipient.status === "confirmed"
                            ? "default"
                            : recipient.status === "tentative"
                              ? "secondary"
                              : "outline"
                        }
                      >
                        {recipient.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <div className="text-muted-foreground flex items-center gap-2 text-sm">
                <Users className="h-4 w-4" />
                {selectedCount} of {recipients.length} selected
              </div>
            </div>
          )}

          {step === "compose" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="template-select">Use Template</Label>
                <Select
                  id="template-select"
                  value={selectedTemplateId ?? "none"}
                  onChange={(e) => {
                    setSelectedTemplateId(e.target.value === "none" ? null : e.target.value);
                  }}
                  options={[
                    { value: "none", label: "Custom Message" },
                    ...templates.map((t) => ({ value: t.id, label: t.name })),
                  ]}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => {
                    setSubject(e.target.value);
                  }}
                  placeholder="Email subject line"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="body">Message Body</Label>
                <Textarea
                  id="body"
                  value={body}
                  onChange={(e) => {
                    setBody(e.target.value);
                  }}
                  placeholder="Email body (HTML supported, use {{field_name}} for merge fields)"
                  className="min-h-[150px] font-mono text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="deadline" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Response Deadline
                </Label>
                <Input
                  id="deadline"
                  type="date"
                  value={responseDeadline}
                  onChange={(e) => {
                    setResponseDeadline(e.target.value);
                  }}
                />
              </div>
            </div>
          )}

          {step === "preview" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Preview Emails</Label>
                <Select
                  className="w-64"
                  value={previewRecipient?.assignmentId ?? ""}
                  onChange={(e) => {
                    setPreviewRecipient(
                      recipients.find((r) => r.assignmentId === e.target.value) ?? null
                    );
                  }}
                  options={recipients
                    .filter((r) => selectedRecipients.includes(r.assignmentId))
                    .map((r) => ({
                      value: r.assignmentId,
                      label: `${r.stageName ?? r.talentName} - ${r.roleName}`,
                    }))}
                  placeholder="Select recipient to preview"
                />
              </div>

              {previewRecipient ? (
                <Card>
                  <CardContent className="space-y-4 pt-4">
                    <div>
                      <Label className="text-muted-foreground text-xs">To</Label>
                      <p className="font-medium">
                        {previewRecipient.stageName ?? previewRecipient.talentName}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs">Subject</Label>
                      <p className="font-medium">
                        {renderTemplate(subject, getPreviewData(previewRecipient))}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs">Body</Label>
                      <div
                        className="prose prose-sm dark:prose-invert mt-2 max-w-none rounded-md border p-4"
                        dangerouslySetInnerHTML={{
                          __html: renderTemplate(body, getPreviewData(previewRecipient)),
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="text-muted-foreground flex h-48 items-center justify-center rounded-md border">
                  <div className="text-center">
                    <Eye className="mx-auto mb-2 h-8 w-8" />
                    <p>Select a recipient to preview their email</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 rounded-md border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800 dark:border-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>
                  {selectedCount} email(s) will be sent. Recipients will have until{" "}
                  {format(new Date(responseDeadline), "MMMM d, yyyy")} to respond.
                </span>
              </div>
            </div>
          )}

          {step === "send" && sendResults && (
            <div className="flex h-full flex-col items-center justify-center py-8 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">Notifications Sent</h3>
              <p className="text-muted-foreground mb-6">
                Successfully sent {sendResults.sent} notification(s)
              </p>
              <div className="flex gap-4">
                <Card className="w-32">
                  <CardContent className="pt-4 text-center">
                    <div className="text-2xl font-bold">{sendResults.total}</div>
                    <div className="text-muted-foreground text-xs">Total</div>
                  </CardContent>
                </Card>
                <Card className="w-32">
                  <CardContent className="pt-4 text-center">
                    <div className="text-2xl font-bold text-green-600">{sendResults.sent}</div>
                    <div className="text-muted-foreground text-xs">Sent</div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          {step !== "send" && (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  if (step === "select") onClose();
                  else if (step === "compose") setStep("select");
                  else setStep("compose");
                }}
                disabled={isSending}
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                {step === "select" ? "Cancel" : "Back"}
              </Button>

              {step === "preview" ? (
                <Button
                  onClick={() => {
                    void handleSend();
                  }}
                  disabled={isSending}
                >
                  <Send className="mr-2 h-4 w-4" />
                  {isSending ? "Sending..." : `Send ${String(selectedCount)} Email(s)`}
                </Button>
              ) : (
                <Button
                  onClick={() => {
                    if (step === "select") setStep("compose");
                    else {
                      const firstSelected = recipients.find((r) =>
                        selectedRecipients.includes(r.assignmentId)
                      );
                      setPreviewRecipient(firstSelected ?? null);
                      setStep("preview");
                    }
                  }}
                  disabled={!canProceed}
                >
                  Next
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </>
          )}

          {step === "send" && (
            <Button onClick={onClose}>
              <Check className="mr-2 h-4 w-4" />
              Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

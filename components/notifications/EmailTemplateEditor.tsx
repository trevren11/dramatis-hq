"use client";

import React, { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  MERGE_FIELDS,
  TEMPLATE_TYPE_OPTIONS,
  type EmailTemplate,
} from "@/lib/db/schema/notifications";
import { Plus, Eye, Save, Undo } from "lucide-react";

interface MergeFieldData {
  talent_name?: string;
  talent_first_name?: string;
  role_name?: string;
  show_title?: string;
  organization_name?: string;
  response_deadline?: string;
  rehearsal_start?: string;
  performance_dates?: string;
  venue?: string;
  accept_link?: string;
  decline_link?: string;
}

interface EmailTemplateEditorProps {
  template?: EmailTemplate;
  onSave: (data: {
    name: string;
    type: string;
    subject: string;
    body: string;
    isDefault: boolean;
  }) => Promise<void>;
  onCancel?: () => void;
  sampleData?: MergeFieldData;
  isLoading?: boolean;
}

const DEFAULT_SAMPLE_DATA: MergeFieldData = {
  talent_name: "John Smith",
  talent_first_name: "John",
  role_name: "Harold Hill",
  show_title: "The Music Man",
  organization_name: "Broadway Theatre Co.",
  response_deadline: "January 15, 2025",
  rehearsal_start: "February 1, 2025",
  performance_dates: "March 1-15, 2025",
  venue: "Main Stage Theatre",
  accept_link: "#",
  decline_link: "#",
};

function renderTemplate(template: string, data: MergeFieldData): string {
  let rendered = template;
  for (const [key, value] of Object.entries(data) as [string, string | undefined][]) {
    rendered = rendered.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value ?? "");
  }
  return rendered;
}

// eslint-disable-next-line complexity
export function EmailTemplateEditor({
  template,
  onSave,
  onCancel,
  sampleData = DEFAULT_SAMPLE_DATA,
  isLoading = false,
}: EmailTemplateEditorProps): React.ReactElement {
  const [name, setName] = useState(template?.name ?? "");
  const [type, setType] = useState(template?.type ?? "custom");
  const [subject, setSubject] = useState(template?.subject ?? "");
  const [body, setBody] = useState(template?.body ?? "");
  const [isDefault, setIsDefault] = useState(template?.isDefault ?? false);
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");

  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const insertMergeField = useCallback((field: string) => {
    const textarea = bodyRef.current;
    if (!textarea) {
      setBody((prev) => prev + `{{${field}}}`);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = `{{${field}}}`;

    setBody((prev) => prev.slice(0, start) + text + prev.slice(end));

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + text.length, start + text.length);
    }, 0);
  }, []);

  const handleSave = useCallback(async () => {
    await onSave({ name, type, subject, body, isDefault });
  }, [name, type, subject, body, isDefault, onSave]);

  const handleReset = useCallback(() => {
    setName(template?.name ?? "");
    setType(template?.type ?? "custom");
    setSubject(template?.subject ?? "");
    setBody(template?.body ?? "");
    setIsDefault(template?.isDefault ?? false);
  }, [template]);

  const previewSubject = renderTemplate(subject, sampleData);
  const previewBody = renderTemplate(body, sampleData);

  return (
    <div className="flex h-full gap-4">
      <div className="flex-1">
        <Tabs
          value={activeTab}
          onValueChange={(v) => {
            setActiveTab(v as "edit" | "preview");
          }}
        >
          <div className="mb-4 flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="edit">Edit</TabsTrigger>
              <TabsTrigger value="preview">
                <Eye className="mr-2 h-4 w-4" />
                Preview
              </TabsTrigger>
            </TabsList>
            <div className="flex gap-2">
              {onCancel && (
                <Button variant="outline" onClick={onCancel} disabled={isLoading}>
                  Cancel
                </Button>
              )}
              <Button variant="outline" onClick={handleReset} disabled={isLoading}>
                <Undo className="mr-2 h-4 w-4" />
                Reset
              </Button>
              <Button
                onClick={() => {
                  void handleSave();
                }}
                disabled={isLoading || !name || !subject || !body}
              >
                <Save className="mr-2 h-4 w-4" />
                {isLoading ? "Saving..." : "Save Template"}
              </Button>
            </div>
          </div>

          <TabsContent value="edit" className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="template-name">Template Name</Label>
                <Input
                  id="template-name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                  }}
                  placeholder="e.g., Cast Notification - Spring Show"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="template-type">Type</Label>
                <Select
                  id="template-type"
                  value={type}
                  onChange={(e) => {
                    setType(e.target.value as typeof type);
                  }}
                  options={TEMPLATE_TYPE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
                  placeholder="Select type"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="template-subject">Subject Line</Label>
              <Input
                id="template-subject"
                value={subject}
                onChange={(e) => {
                  setSubject(e.target.value);
                }}
                placeholder="e.g., Congratulations! You've been cast in {{show_title}}"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="template-body">Email Body (HTML)</Label>
              <Textarea
                ref={bodyRef}
                id="template-body"
                value={body}
                onChange={(e) => {
                  setBody(e.target.value);
                }}
                placeholder="Enter email body with HTML formatting and merge fields..."
                className="min-h-[300px] font-mono text-sm"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is-default"
                checked={isDefault}
                onChange={(e) => {
                  setIsDefault(e.target.checked);
                }}
                className="rounded border-gray-300"
              />
              <Label htmlFor="is-default" className="cursor-pointer">
                Set as default template for this type
              </Label>
            </div>
          </TabsContent>

          <TabsContent value="preview">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Email Preview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-muted-foreground text-xs">Subject</Label>
                  <p className="font-medium">{previewSubject || "(No subject)"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Body</Label>
                  <div
                    className="prose prose-sm dark:prose-invert mt-2 max-w-none rounded-md border p-4"
                    dangerouslySetInnerHTML={{ __html: previewBody || "<p>(No content)</p>" }}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Card className="w-64 shrink-0">
        <CardHeader>
          <CardTitle className="text-sm">Merge Fields</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[400px]">
            <div className="space-y-1 p-4 pt-0">
              {MERGE_FIELDS.map((field) => (
                <button
                  key={field.field}
                  onClick={() => {
                    insertMergeField(field.field);
                  }}
                  className="hover:bg-muted flex w-full items-start gap-2 rounded-md p-2 text-left transition-colors"
                >
                  <Plus className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium">{field.label}</div>
                    <div className="text-muted-foreground truncate text-xs">
                      {`{{${field.field}}}`}
                    </div>
                    <Badge variant="secondary" className="mt-1 text-xs">
                      {field.example}
                    </Badge>
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

export function EmailTemplateEditorSkeleton(): React.ReactElement {
  return (
    <div className="flex gap-4">
      <div className="flex-1 space-y-4">
        <div className="h-10 w-48 animate-pulse rounded-md bg-gray-200" />
        <div className="h-10 w-full animate-pulse rounded-md bg-gray-200" />
        <div className="h-10 w-full animate-pulse rounded-md bg-gray-200" />
        <div className="h-64 w-full animate-pulse rounded-md bg-gray-200" />
      </div>
      <div className="h-96 w-64 animate-pulse rounded-md bg-gray-200" />
    </div>
  );
}

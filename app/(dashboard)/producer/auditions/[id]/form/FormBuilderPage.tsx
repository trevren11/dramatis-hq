/* eslint-disable @typescript-eslint/no-unsafe-assignment */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { FormField } from "@/lib/db/schema/auditions";
import { FormBuilder } from "@/components/form-builder";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Copy, Check, ExternalLink } from "lucide-react";
import Link from "next/link";

interface ApiResponse {
  error?: string;
  form?: {
    id: string;
    fields: FormField[];
  };
}

interface FormBuilderPageProps {
  auditionId: string;
  auditionTitle: string;
  initialFields: FormField[];
  checkinUrl: string;
}

export function FormBuilderPage({
  auditionId,
  auditionTitle,
  initialFields,
  checkinUrl,
}: FormBuilderPageProps): React.ReactElement {
  const router = useRouter();
  const { toast } = useToast();
  const [fields, setFields] = useState<FormField[]>(initialFields);
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSave = async (): Promise<void> => {
    setIsSaving(true);

    try {
      const res = await fetch(`/api/auditions/${auditionId}/form`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fields }),
      });

      const data: ApiResponse = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Failed to save form");
      }

      toast({
        title: "Form saved",
        description: "Your audition form has been saved successfully.",
      });

      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save form",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyUrl = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(checkinUrl);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Check-in URL copied to clipboard.",
      });
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      toast({
        title: "Error",
        description: "Failed to copy URL.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild>
              <Link href={`/producer/auditions/${auditionId}`}>
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-2xl font-bold">Form Builder</h1>
          </div>
          <p className="text-muted-foreground ml-10">{auditionTitle}</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-muted/50 flex items-center rounded-lg border px-3 py-2">
            <span className="text-muted-foreground mr-2 max-w-[200px] truncate text-sm">
              {checkinUrl}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => void handleCopyUrl()}
            >
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6" asChild>
              <a href={checkinUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3 w-3" />
              </a>
            </Button>
          </div>
          <Button variant="outline" asChild>
            <Link href={`/producer/auditions/${auditionId}/checkin`}>Manage Check-ins</Link>
          </Button>
        </div>
      </div>

      {/* Form Builder */}
      <FormBuilder
        fields={fields}
        onChange={setFields}
        onSave={() => void handleSave()}
        isSaving={isSaving}
        auditionTitle={auditionTitle}
      />
    </div>
  );
}

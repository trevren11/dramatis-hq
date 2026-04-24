"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Mail, Send, CheckCircle } from "lucide-react";

interface Props {
  username: string;
}

interface FormState {
  senderName: string;
  senderEmail: string;
  subject: string;
  message: string;
}

interface ApiResponse {
  success?: boolean;
  error?: string;
}

export function ContactForm({ username }: Props): React.ReactElement {
  const [form, setForm] = useState<FormState>({
    senderName: "",
    senderEmail: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError(null);
  };

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/profile/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, username }),
      });

      const data = (await response.json()) as ApiResponse;

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to send message");
      }

      setIsSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center py-12">
          <CheckCircle className="text-success mb-4 h-16 w-16" />
          <h3 className="text-xl font-semibold">Message Sent!</h3>
          <p className="text-muted-foreground mt-2 text-center">
            Your message has been delivered. They will get back to you soon.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Mail className="mr-2 h-5 w-5" />
          Get in Touch
        </CardTitle>
        <CardDescription>
          Send a message directly. Your email will only be shared when they respond.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={(e): void => {
            void handleSubmit(e);
          }}
          className="space-y-4"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="senderName" className="mb-1 block text-sm font-medium">
                Your Name *
              </label>
              <Input
                id="senderName"
                name="senderName"
                value={form.senderName}
                onChange={handleChange}
                required
                placeholder="John Doe"
              />
            </div>
            <div>
              <label htmlFor="senderEmail" className="mb-1 block text-sm font-medium">
                Your Email *
              </label>
              <Input
                id="senderEmail"
                name="senderEmail"
                type="email"
                value={form.senderEmail}
                onChange={handleChange}
                required
                placeholder="john@example.com"
              />
            </div>
          </div>
          <div>
            <label htmlFor="subject" className="mb-1 block text-sm font-medium">
              Subject
            </label>
            <Input
              id="subject"
              name="subject"
              value={form.subject}
              onChange={handleChange}
              placeholder="Regarding your work..."
            />
          </div>
          <div>
            <label htmlFor="message" className="mb-1 block text-sm font-medium">
              Message *
            </label>
            <Textarea
              id="message"
              name="message"
              value={form.message}
              onChange={handleChange}
              required
              rows={5}
              placeholder="Write your message here..."
              minLength={10}
            />
          </div>
          {error && <div className="text-error text-sm">{error}</div>}
          <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
            <Send className="mr-2 h-4 w-4" />
            {isSubmitting ? "Sending..." : "Send Message"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

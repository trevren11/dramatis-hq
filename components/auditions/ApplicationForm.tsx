"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, AlertCircle, Image, FileText, Film, Music } from "lucide-react";
import type { Audition } from "@/lib/db/schema/auditions";

interface TalentProfile {
  id: string;
  firstName: string;
  lastName: string;
}

interface ApplicationFormProps {
  audition: Audition;
  talentProfile: TalentProfile;
  existingHeadshots: { id: string; url: string }[];
  existingResumes: { id: string; title: string }[];
}

interface ApiErrorResponse {
  error?: string;
  details?: Record<string, string[]>;
}

// eslint-disable-next-line complexity
export function ApplicationForm({
  audition,
  talentProfile,
  existingHeadshots,
  existingResumes,
}: ApplicationFormProps): React.ReactElement {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const materials = audition.materials ?? {};

  const [formData, setFormData] = useState({
    headshotId: existingHeadshots[0]?.id ?? "",
    resumeId: existingResumes[0]?.id ?? "",
    videoUrl: "",
    audioUrl: "",
  });

  const handleSubmit = (e: React.SyntheticEvent): void => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      try {
        const response = await fetch(`/api/auditions/${audition.id}/apply`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            materials: {
              headshotId: formData.headshotId || undefined,
              resumeId: formData.resumeId || undefined,
              videoUrl: formData.videoUrl || undefined,
              audioUrl: formData.audioUrl || undefined,
            },
          }),
        });

        if (!response.ok) {
          const errorData = (await response.json()) as ApiErrorResponse;
          setError(errorData.error ?? "Failed to submit application");
          return;
        }

        router.push(`/auditions/${audition.slug}?applied=true`);
        router.refresh();
      } catch {
        setError("Something went wrong. Please try again.");
      }
    });
  };

  const isValid = (): boolean => {
    if (materials.requireHeadshot && !formData.headshotId) return false;
    if (materials.requireResume && !formData.resumeId) return false;
    if (materials.requireVideo && !formData.videoUrl) return false;
    if (materials.requireAudio && !formData.audioUrl) return false;
    return true;
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Apply to {audition.title}</CardTitle>
          <CardDescription>
            Submitting as {talentProfile.firstName} {talentProfile.lastName}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="bg-destructive/10 text-destructive flex items-start gap-2 rounded-lg p-3 text-sm">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Headshot */}
          {materials.requireHeadshot && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Image className="h-4 w-4" />
                  <Label>Headshot</Label>
                  <Badge variant="destructive" className="text-xs">
                    Required
                  </Badge>
                </div>
                {formData.headshotId && <CheckCircle className="h-4 w-4 text-green-500" />}
              </div>
              {existingHeadshots.length > 0 ? (
                <div className="flex flex-wrap gap-3">
                  {existingHeadshots.map((headshot) => (
                    <label
                      key={headshot.id}
                      className={`cursor-pointer rounded-lg border-2 p-1 transition-colors ${
                        formData.headshotId === headshot.id
                          ? "border-primary"
                          : "border-border hover:border-muted-foreground"
                      }`}
                    >
                      <input
                        type="radio"
                        name="headshotId"
                        value={headshot.id}
                        checked={formData.headshotId === headshot.id}
                        onChange={(e) => {
                          setFormData({ ...formData, headshotId: e.target.value });
                        }}
                        className="sr-only"
                      />
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={headshot.url}
                        alt="Headshot"
                        className="h-24 w-24 rounded object-cover"
                      />
                    </label>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">
                  You don&apos;t have any headshots. Please upload one in your profile first.
                </p>
              )}
            </div>
          )}

          {/* Resume */}
          {materials.requireResume && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <Label>Resume</Label>
                  <Badge variant="destructive" className="text-xs">
                    Required
                  </Badge>
                </div>
                {formData.resumeId && <CheckCircle className="h-4 w-4 text-green-500" />}
              </div>
              {existingResumes.length > 0 ? (
                <div className="space-y-2">
                  {existingResumes.map((resume) => (
                    <label
                      key={resume.id}
                      className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                        formData.resumeId === resume.id
                          ? "border-primary bg-muted/50"
                          : "border-border hover:border-muted-foreground"
                      }`}
                    >
                      <input
                        type="radio"
                        name="resumeId"
                        value={resume.id}
                        checked={formData.resumeId === resume.id}
                        onChange={(e) => {
                          setFormData({ ...formData, resumeId: e.target.value });
                        }}
                        className="sr-only"
                      />
                      <FileText className="text-muted-foreground h-5 w-5" />
                      <span>{resume.title || "Resume"}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">
                  You don&apos;t have any resumes. Please upload one in your profile first.
                </p>
              )}
            </div>
          )}

          {/* Video */}
          {materials.requireVideo && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Film className="h-4 w-4" />
                  <Label htmlFor="videoUrl">Video Submission</Label>
                  <Badge variant="destructive" className="text-xs">
                    Required
                  </Badge>
                </div>
                {formData.videoUrl && <CheckCircle className="h-4 w-4 text-green-500" />}
              </div>
              {materials.videoInstructions && (
                <p className="text-muted-foreground text-sm">{materials.videoInstructions}</p>
              )}
              <Input
                id="videoUrl"
                type="url"
                placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..."
                value={formData.videoUrl}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setFormData({ ...formData, videoUrl: e.target.value });
                }}
              />
            </div>
          )}

          {/* Audio */}
          {materials.requireAudio && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Music className="h-4 w-4" />
                  <Label htmlFor="audioUrl">Audio Submission</Label>
                  <Badge variant="destructive" className="text-xs">
                    Required
                  </Badge>
                </div>
                {formData.audioUrl && <CheckCircle className="h-4 w-4 text-green-500" />}
              </div>
              {materials.audioInstructions && (
                <p className="text-muted-foreground text-sm">{materials.audioInstructions}</p>
              )}
              <Input
                id="audioUrl"
                type="url"
                placeholder="https://soundcloud.com/... or audio file URL"
                value={formData.audioUrl}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setFormData({ ...formData, audioUrl: e.target.value });
                }}
              />
            </div>
          )}

          {/* Submit */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                router.back();
              }}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!isValid() || isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Application"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}

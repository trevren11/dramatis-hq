"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Check } from "lucide-react";
import { BasicInfoStep } from "./wizard-steps/basic-info-step";
import { DatesVenueStep } from "./wizard-steps/dates-venue-step";
import { SettingsStep } from "./wizard-steps/settings-step";
import { ReviewStep } from "./wizard-steps/review-step";
import type { ShowCreate } from "@/lib/validations/shows";

const STEPS = [
  { id: "basic", title: "Basic Info", description: "Title and description" },
  { id: "dates", title: "Dates & Venue", description: "Schedule and location" },
  { id: "settings", title: "Settings", description: "Union status and visibility" },
  { id: "review", title: "Review", description: "Confirm your details" },
];

interface ApiErrorResponse {
  error?: string;
  details?: Record<string, string[]>;
}

interface ApiSuccessResponse {
  show: { id: string };
}

export function CreateShowWizard(): React.ReactElement {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<ShowCreate>>({
    title: "",
    type: "play",
    description: null,
    venue: null,
    rehearsalStart: null,
    performanceStart: null,
    performanceEnd: null,
    unionStatus: "both",
    status: "planning",
    isPublic: true,
  });

  const updateFormData = (data: Partial<ShowCreate>): void => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const handleNext = (): void => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = (): void => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSubmit = (): void => {
    setError(null);
    startTransition(async () => {
      try {
        const response = await fetch("/api/shows", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        if (!response.ok) {
          const errorData = (await response.json()) as ApiErrorResponse;
          if (errorData.details) {
            const firstError = Object.values(errorData.details)[0];
            setError(firstError?.[0] ?? "Validation error");
          } else {
            setError(errorData.error ?? "Failed to create show");
          }
          return;
        }

        const data = (await response.json()) as ApiSuccessResponse;
        router.push(`/producer/shows/${data.show.id}`);
        router.refresh();
      } catch {
        setError("Something went wrong. Please try again.");
      }
    });
  };

  const renderStep = (): React.ReactElement => {
    switch (currentStep) {
      case 0:
        return <BasicInfoStep data={formData} onUpdate={updateFormData} />;
      case 1:
        return <DatesVenueStep data={formData} onUpdate={updateFormData} />;
      case 2:
        return <SettingsStep data={formData} onUpdate={updateFormData} />;
      case 3:
        return <ReviewStep data={formData} />;
      default:
        return <BasicInfoStep data={formData} onUpdate={updateFormData} />;
    }
  };

  const isStepValid = (): boolean => {
    switch (currentStep) {
      case 0:
        return Boolean(formData.title && formData.title.length > 0);
      default:
        return true;
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                  index < currentStep
                    ? "border-primary bg-primary text-primary-foreground"
                    : index === currentStep
                      ? "border-primary text-primary"
                      : "border-muted text-muted-foreground"
                }`}
              >
                {index < currentStep ? <Check className="h-5 w-5" /> : index + 1}
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={`mx-2 h-0.5 w-12 ${index < currentStep ? "bg-primary" : "bg-muted"}`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="mt-4 text-center">
          <h2 className="text-lg font-semibold">{STEPS[currentStep]?.title}</h2>
          <p className="text-muted-foreground text-sm">{STEPS[currentStep]?.description}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create New Production</CardTitle>
          <CardDescription>
            Set up your production to start defining roles and managing your cast.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-destructive/10 text-destructive mb-4 rounded-lg p-3 text-sm">
              {error}
            </div>
          )}

          {renderStep()}

          <div className="mt-6 flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={
                currentStep === 0
                  ? () => {
                      router.back();
                    }
                  : handleBack
              }
              disabled={isPending}
            >
              {currentStep === 0 ? "Cancel" : "Back"}
            </Button>

            {currentStep === STEPS.length - 1 ? (
              <Button onClick={handleSubmit} disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Production...
                  </>
                ) : (
                  "Create Production"
                )}
              </Button>
            ) : (
              <Button onClick={handleNext} disabled={!isStepValid() || isPending}>
                Next
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

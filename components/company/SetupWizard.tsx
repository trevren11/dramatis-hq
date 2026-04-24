"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Check } from "lucide-react";
import { BasicInfoStep } from "./wizard-steps/basic-info-step";
import { DetailsStep } from "./wizard-steps/details-step";
import { SocialStep } from "./wizard-steps/social-step";
import { ReviewStep } from "./wizard-steps/review-step";
import type { CompanyProfile } from "@/lib/validations/company";

const STEPS = [
  { id: "basic", title: "Company Info", description: "Basic company details" },
  { id: "details", title: "Details", description: "Location and preferences" },
  { id: "social", title: "Social Links", description: "Connect your social media" },
  { id: "review", title: "Review", description: "Review your profile" },
];

interface SetupWizardProps {
  initialData?: {
    email?: string;
    name?: string;
  };
}

interface ApiErrorResponse {
  error?: string;
  details?: Record<string, string[]>;
}

export function SetupWizard({ initialData }: SetupWizardProps): React.ReactElement {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<CompanyProfile>>({
    companyName: initialData?.name ?? "",
    slug: "",
    description: null,
    location: null,
    website: null,
    unionStatus: "both",
    socialLinks: null,
    isPublic: true,
  });

  const updateFormData = (data: Partial<CompanyProfile>): void => {
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
        const response = await fetch("/api/company/profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        if (!response.ok) {
          const errorData: ApiErrorResponse = (await response.json()) as ApiErrorResponse;
          if (errorData.details?.slug) {
            setError(errorData.details.slug[0] ?? "Slug error");
          } else {
            setError(errorData.error ?? "Failed to create profile");
          }
          return;
        }

        router.push("/producer/dashboard");
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
        return <DetailsStep data={formData} onUpdate={updateFormData} />;
      case 2:
        return <SocialStep data={formData} onUpdate={updateFormData} />;
      case 3:
        return <ReviewStep data={formData} />;
      default:
        return <BasicInfoStep data={formData} onUpdate={updateFormData} />;
    }
  };

  const isStepValid = (): boolean => {
    switch (currentStep) {
      case 0:
        return Boolean(formData.companyName && formData.slug && formData.slug.length >= 3);
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
          <CardTitle>Set Up Your Company Profile</CardTitle>
          <CardDescription>
            Create your production company profile to start posting auditions and finding talent.
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
              onClick={handleBack}
              disabled={currentStep === 0 || isPending}
            >
              Back
            </Button>

            {currentStep === STEPS.length - 1 ? (
              <Button onClick={handleSubmit} disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Profile...
                  </>
                ) : (
                  "Create Company Profile"
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

"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Check } from "lucide-react";
import { BasicInfoStep } from "./wizard-steps/basic-info-step";
import { DatesLocationStep } from "./wizard-steps/dates-location-step";
import { RolesStep } from "./wizard-steps/roles-step";
import { MaterialsStep } from "./wizard-steps/materials-step";
import { SettingsStep } from "./wizard-steps/settings-step";
import { ReviewStep } from "./wizard-steps/review-step";
import type { AuditionCreate } from "@/lib/validations/auditions";
import type { Role } from "@/lib/db/schema/roles";

const STEPS = [
  { id: "basic", title: "Basic Info", description: "Select show and title" },
  { id: "dates", title: "Dates & Location", description: "When and where" },
  { id: "roles", title: "Roles", description: "Select roles to cast" },
  { id: "materials", title: "Materials", description: "Required submissions" },
  { id: "settings", title: "Settings", description: "Visibility and status" },
  { id: "review", title: "Review", description: "Confirm your details" },
];

interface ApiErrorResponse {
  error?: string;
  details?: Record<string, string[]>;
}

interface ApiSuccessResponse {
  audition: { id: string };
}

interface CreateAuditionWizardProps {
  initialShows: { id: string; title: string }[];
}

export function CreateAuditionWizard({
  initialShows,
}: CreateAuditionWizardProps): React.ReactElement {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [shows] = useState(initialShows);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoadingRoles, setIsLoadingRoles] = useState(false);

  const [formData, setFormData] = useState<Partial<AuditionCreate>>({
    showId: "",
    title: "",
    description: null,
    location: null,
    isVirtual: false,
    auditionDates: [],
    submissionDeadline: null,
    requirements: {},
    materials: {
      requireHeadshot: true,
      requireResume: true,
    },
    visibility: "public",
    publishAt: null,
    status: "draft",
    roleIds: [],
  });

  // Fetch roles when show changes
  useEffect(() => {
    const fetchRoles = async (): Promise<void> => {
      if (!formData.showId) {
        setRoles([]);
        return;
      }

      setIsLoadingRoles(true);
      try {
        const response = await fetch(`/api/shows/${formData.showId}`);
        if (response.ok) {
          const data = (await response.json()) as { roles: Role[] };
          setRoles(data.roles);
        }
      } catch {
        setRoles([]);
      } finally {
        setIsLoadingRoles(false);
      }
    };

    void fetchRoles();
  }, [formData.showId]);

  const updateFormData = (data: Partial<AuditionCreate>): void => {
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
        const response = await fetch("/api/auditions", {
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
            setError(errorData.error ?? "Failed to create audition");
          }
          return;
        }

        const data = (await response.json()) as ApiSuccessResponse;
        router.push(`/producer/auditions/${data.audition.id}`);
        router.refresh();
      } catch {
        setError("Something went wrong. Please try again.");
      }
    });
  };

  const selectedShow = shows.find((s) => s.id === formData.showId) ?? null;

  const renderStep = (): React.ReactElement => {
    switch (currentStep) {
      case 0:
        return <BasicInfoStep data={formData} shows={shows} onUpdate={updateFormData} />;
      case 1:
        return <DatesLocationStep data={formData} onUpdate={updateFormData} />;
      case 2:
        return isLoadingRoles ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <RolesStep data={formData} roles={roles} onUpdate={updateFormData} />
        );
      case 3:
        return <MaterialsStep data={formData} onUpdate={updateFormData} />;
      case 4:
        return <SettingsStep data={formData} onUpdate={updateFormData} />;
      case 5:
        return <ReviewStep data={formData} show={selectedShow} roles={roles} />;
      default:
        return <BasicInfoStep data={formData} shows={shows} onUpdate={updateFormData} />;
    }
  };

  const isStepValid = (): boolean => {
    switch (currentStep) {
      case 0:
        return Boolean(formData.showId && formData.title && formData.title.length > 0);
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
                className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm ${
                  index < currentStep
                    ? "border-primary bg-primary text-primary-foreground"
                    : index === currentStep
                      ? "border-primary text-primary"
                      : "border-muted text-muted-foreground"
                }`}
              >
                {index < currentStep ? <Check className="h-4 w-4" /> : index + 1}
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={`mx-1 h-0.5 w-6 sm:w-8 ${index < currentStep ? "bg-primary" : "bg-muted"}`}
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
          <CardTitle>Create New Audition</CardTitle>
          <CardDescription>
            Set up an audition announcement to start receiving applications.
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
                    Creating Audition...
                  </>
                ) : (
                  "Create Audition"
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

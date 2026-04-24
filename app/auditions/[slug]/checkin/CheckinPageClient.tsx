"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import type { FormField } from "@/lib/db/schema/auditions";
import { CheckinForm } from "@/components/checkin/CheckinForm";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { MapPin, Video, User, LogIn } from "lucide-react";

interface AuditionInfo {
  id: string;
  title: string;
  slug: string;
  location: string | null;
  isVirtual: boolean | null;
}

interface OrganizationInfo {
  companyName: string;
  logoUrl: string | null;
}

interface CheckinPageClientProps {
  audition: AuditionInfo;
  organization: OrganizationInfo | null;
  fields: FormField[];
  isLoggedIn: boolean;
  hasTalentProfile: boolean;
  talentName?: string;
}

interface CheckinApiResponse {
  error?: string;
  checkin?: {
    queueNumber: number;
  };
}

function AuditionLocationDisplay({ audition }: { audition: AuditionInfo }): React.ReactElement {
  if (audition.isVirtual) {
    return (
      <>
        <Video className="h-4 w-4" />
        Virtual Audition
      </>
    );
  }
  return (
    <>
      <MapPin className="h-4 w-4" />
      {audition.location ?? "Location TBD"}
    </>
  );
}

function OrganizationLogo({
  organization,
}: {
  organization: OrganizationInfo;
}): React.ReactElement {
  return (
    <div className="mb-4 flex justify-center">
      <Avatar className="h-16 w-16">
        <AvatarImage src={organization.logoUrl ?? undefined} />
        <AvatarFallback>{organization.companyName[0]}</AvatarFallback>
      </Avatar>
    </div>
  );
}

function NotLoggedInView({
  audition,
  organization,
}: {
  audition: AuditionInfo;
  organization: OrganizationInfo | null;
}): React.ReactElement {
  return (
    <Card>
      <CardHeader className="text-center">
        {organization && <OrganizationLogo organization={organization} />}
        <CardTitle>{audition.title}</CardTitle>
        <CardDescription className="flex items-center justify-center gap-2">
          <AuditionLocationDisplay audition={audition} />
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground text-center">
          Please sign in to check in for this audition.
        </p>
        <div className="flex flex-col gap-2">
          <Button asChild>
            <Link href={`/login?redirect=/auditions/${audition.slug}/checkin`}>
              <LogIn className="mr-2 h-4 w-4" />
              Sign In
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/signup?redirect=/auditions/${audition.slug}/checkin`}>
              Create Account
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function NoTalentProfileView({
  audition,
  organization,
}: {
  audition: AuditionInfo;
  organization: OrganizationInfo | null;
}): React.ReactElement {
  return (
    <Card>
      <CardHeader className="text-center">
        {organization && <OrganizationLogo organization={organization} />}
        <CardTitle>{audition.title}</CardTitle>
        <CardDescription className="flex items-center justify-center gap-2">
          <AuditionLocationDisplay audition={audition} />
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground text-center">
          You need a talent profile to check in. Create one now to continue.
        </p>
        <Button className="w-full" asChild>
          <Link href={`/talent/profile?redirect=/auditions/${audition.slug}/checkin`}>
            <User className="mr-2 h-4 w-4" />
            Create Talent Profile
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export function CheckinPageClient({
  audition,
  organization,
  fields,
  isLoggedIn,
  hasTalentProfile,
  talentName,
}: CheckinPageClientProps): React.ReactElement {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (
    responses: Record<string, string | string[] | boolean | null>
  ): Promise<void> => {
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/auditions/${audition.id}/checkin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ responses }),
      });

      const data: CheckinApiResponse = (await res.json()) as CheckinApiResponse;

      if (!res.ok) {
        throw new Error(data.error ?? "Failed to check in");
      }

      const queueNumber = data.checkin?.queueNumber ?? 0;
      router.push(`/auditions/${audition.slug}/checkin/success?q=${String(queueNumber)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to check in");
      setIsSubmitting(false);
    }
  };

  if (!isLoggedIn) {
    return <NotLoggedInView audition={audition} organization={organization} />;
  }

  if (!hasTalentProfile) {
    return <NoTalentProfileView audition={audition} organization={organization} />;
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        {organization && <OrganizationLogo organization={organization} />}
        {talentName && (
          <p className="text-muted-foreground mb-2">
            Welcome, <span className="text-foreground font-medium">{talentName}</span>
          </p>
        )}
      </div>

      {error && (
        <div className="bg-destructive/10 rounded-lg p-4 text-center">
          <p className="text-destructive text-sm">{error}</p>
        </div>
      )}

      <CheckinForm
        fields={fields}
        auditionTitle={audition.title}
        auditionLocation={audition.isVirtual ? "Virtual Audition" : audition.location}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}

/* eslint-disable complexity, @typescript-eslint/restrict-template-expressions */
export const dynamic = "force-dynamic";

import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import {
  auditions,
  auditionForms,
  auditionFormResponses,
  talentProfiles,
  producerProfiles,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { CheckinPageClient } from "./CheckinPageClient";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: Props): Promise<{ title: string; description?: string }> {
  const { slug } = await params;

  const audition = await db.query.auditions.findFirst({
    where: eq(auditions.slug, slug),
    columns: { title: true },
  });

  if (!audition) {
    return { title: "Check-in Not Found" };
  }

  return {
    title: `Check In - ${audition.title} | Dramatis`,
    description: `Check in for your audition at ${audition.title}`,
  };
}

export default async function CheckinPage({ params }: Props): Promise<React.ReactElement> {
  const { slug } = await params;
  const session = await auth();

  // Get audition
  const audition = await db.query.auditions.findFirst({
    where: eq(auditions.slug, slug),
  });

  if (!audition) {
    notFound();
  }

  // Check audition is open
  if (audition.status !== "open") {
    return (
      <div className="from-base-200 to-base-100 flex min-h-screen items-center justify-center bg-gradient-to-b">
        <div className="text-center">
          <h1 className="mb-2 text-2xl font-bold">Check-in Not Available</h1>
          <p className="text-muted-foreground">This audition is not currently open for check-in.</p>
        </div>
      </div>
    );
  }

  // Get the form
  const form = await db.query.auditionForms.findFirst({
    where: eq(auditionForms.auditionId, audition.id),
  });

  // Get organization
  const organization = await db.query.producerProfiles.findFirst({
    where: eq(producerProfiles.id, audition.organizationId),
  });

  // Check if user needs to sign in
  if (!session?.user.id) {
    return (
      <div className="from-base-200 to-base-100 min-h-screen bg-gradient-to-b">
        <div className="container mx-auto max-w-md px-4 py-8">
          <CheckinPageClient
            audition={{
              id: audition.id,
              title: audition.title,
              slug: audition.slug,
              location: audition.location,
              isVirtual: audition.isVirtual,
            }}
            organization={
              organization
                ? {
                    companyName: organization.companyName,
                    logoUrl: organization.logoUrl,
                  }
                : null
            }
            fields={form?.fields ?? []}
            isLoggedIn={false}
            hasTalentProfile={false}
          />
        </div>
      </div>
    );
  }

  // Get talent profile
  const talentProfile = await db.query.talentProfiles.findFirst({
    where: eq(talentProfiles.userId, session.user.id),
  });

  if (!talentProfile) {
    return (
      <div className="from-base-200 to-base-100 min-h-screen bg-gradient-to-b">
        <div className="container mx-auto max-w-md px-4 py-8">
          <CheckinPageClient
            audition={{
              id: audition.id,
              title: audition.title,
              slug: audition.slug,
              location: audition.location,
              isVirtual: audition.isVirtual,
            }}
            organization={
              organization
                ? {
                    companyName: organization.companyName,
                    logoUrl: organization.logoUrl,
                  }
                : null
            }
            fields={form?.fields ?? []}
            isLoggedIn={true}
            hasTalentProfile={false}
          />
        </div>
      </div>
    );
  }

  // Check for existing check-in
  const existingCheckin = await db.query.auditionFormResponses.findFirst({
    where: and(
      eq(auditionFormResponses.auditionId, audition.id),
      eq(auditionFormResponses.talentProfileId, talentProfile.id)
    ),
  });

  // Already checked in - redirect to success page
  if (existingCheckin) {
    redirect(`/auditions/${slug}/checkin/success?q=${existingCheckin.queueNumber}`);
  }

  return (
    <div className="from-base-200 to-base-100 min-h-screen bg-gradient-to-b">
      <div className="container mx-auto max-w-md px-4 py-8">
        <CheckinPageClient
          audition={{
            id: audition.id,
            title: audition.title,
            slug: audition.slug,
            location: audition.location,
            isVirtual: audition.isVirtual,
          }}
          organization={
            organization
              ? {
                  companyName: organization.companyName,
                  logoUrl: organization.logoUrl,
                }
              : null
          }
          fields={form?.fields ?? []}
          isLoggedIn={true}
          hasTalentProfile={true}
          talentName={talentProfile.stageName ?? session.user.name ?? undefined}
        />
      </div>
    </div>
  );
}

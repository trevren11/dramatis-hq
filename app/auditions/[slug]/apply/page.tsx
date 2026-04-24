import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import {
  auditions,
  talentProfiles,
  auditionApplications,
  headshots,
  resumeConfigurations,
} from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { ApplicationForm } from "@/components/auditions/ApplicationForm";
import Link from "next/link";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<{ title: string }> {
  const { slug } = await params;

  const audition = await db.query.auditions.findFirst({
    where: eq(auditions.slug, slug),
    columns: { title: true },
  });

  if (!audition) {
    return { title: "Audition Not Found" };
  }

  return {
    title: `Apply to ${audition.title} | Dramatis`,
  };
}

export default async function ApplyPage({ params }: Props): Promise<React.ReactElement> {
  const { slug } = await params;
  const session = await auth();

  // Require login
  if (!session?.user.id) {
    redirect(`/login?redirect=/auditions/${slug}/apply`);
  }

  // Get audition
  const audition = await db.query.auditions.findFirst({
    where: eq(auditions.slug, slug),
  });

  if (!audition) {
    notFound();
  }

  // Check if audition is open for applications
  const now = new Date();
  const isPublished = !audition.publishAt || audition.publishAt <= now;
  const isDeadlinePassed = audition.submissionDeadline ? audition.submissionDeadline < now : false;

  if (
    audition.visibility === "private" ||
    audition.status !== "open" ||
    !isPublished ||
    isDeadlinePassed
  ) {
    return (
      <div className="from-base-200 to-base-100 min-h-screen bg-gradient-to-b">
        <div className="container mx-auto max-w-2xl px-4 py-8">
          <div className="border-border rounded-xl border p-8 text-center">
            <h1 className="text-xl font-semibold">Unable to Apply</h1>
            <p className="text-muted-foreground mt-2">
              {isDeadlinePassed
                ? "The deadline for this audition has passed."
                : "This audition is not currently accepting applications."}
            </p>
            <Link
              href={`/auditions/${slug}`}
              className="text-primary mt-4 inline-block hover:underline"
            >
              Back to Audition
            </Link>
          </div>
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
        <div className="container mx-auto max-w-2xl px-4 py-8">
          <div className="border-border rounded-xl border p-8 text-center">
            <h1 className="text-xl font-semibold">Complete Your Profile</h1>
            <p className="text-muted-foreground mt-2">
              You need to complete your talent profile before you can apply to auditions.
            </p>
            <Link
              href="/talent/profile/wizard"
              className="bg-primary text-primary-foreground mt-4 inline-block rounded-lg px-4 py-2 hover:opacity-90"
            >
              Complete Profile
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Check if already applied
  const existingApplication = await db.query.auditionApplications.findFirst({
    where: and(
      eq(auditionApplications.auditionId, audition.id),
      eq(auditionApplications.talentProfileId, talentProfile.id)
    ),
  });

  if (existingApplication) {
    return (
      <div className="from-base-200 to-base-100 min-h-screen bg-gradient-to-b">
        <div className="container mx-auto max-w-2xl px-4 py-8">
          <div className="border-border rounded-xl border p-8 text-center">
            <h1 className="text-xl font-semibold">Already Applied</h1>
            <p className="text-muted-foreground mt-2">
              You have already submitted an application for this audition.
            </p>
            <Link
              href="/talent/applications"
              className="text-primary mt-4 inline-block hover:underline"
            >
              View My Applications
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Get existing headshots
  const existingHeadshots = await db.query.headshots.findMany({
    where: eq(headshots.talentProfileId, talentProfile.id),
    orderBy: [desc(headshots.isPrimary), desc(headshots.createdAt)],
    limit: 10,
  });

  // Get resume configurations as "saved resumes"
  const existingResumes = await db.query.resumeConfigurations.findMany({
    where: eq(resumeConfigurations.userId, session.user.id),
    orderBy: [desc(resumeConfigurations.createdAt)],
    limit: 10,
  });

  return (
    <div className="from-base-200 to-base-100 min-h-screen bg-gradient-to-b">
      <div className="container mx-auto max-w-2xl px-4 py-8">
        <ApplicationForm
          audition={audition}
          talentProfile={{
            id: talentProfile.id,
            firstName: talentProfile.firstName,
            lastName: talentProfile.lastName,
          }}
          existingHeadshots={existingHeadshots.map((h) => ({
            id: h.id,
            url: h.url,
          }))}
          existingResumes={existingResumes.map((r) => ({
            id: r.id,
            title: r.name,
          }))}
        />
      </div>
    </div>
  );
}

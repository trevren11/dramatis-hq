export const dynamic = "force-dynamic";

import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, producerProfiles, auditions } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { CheckinManagementPage } from "./CheckinManagementPage";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<{ title: string }> {
  const { id } = await params;

  const audition = await db.query.auditions.findFirst({
    where: eq(auditions.id, id),
    columns: { title: true },
  });

  if (!audition) {
    return { title: "Check-in Management" };
  }

  return {
    title: `Check-in - ${audition.title} | Dramatis`,
  };
}

export default async function ProducerCheckinPage({ params }: Props): Promise<React.ReactElement> {
  const { id } = await params;
  const session = await auth();

  if (!session?.user.id) {
    redirect("/login");
  }

  // Check if user is a producer
  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
  });

  if (user?.userType !== "producer") {
    redirect("/");
  }

  // Get producer profile
  const profile = await db.query.producerProfiles.findFirst({
    where: eq(producerProfiles.userId, session.user.id),
  });

  if (!profile) {
    redirect("/producer/setup");
  }

  // Get audition (verify ownership)
  const audition = await db.query.auditions.findFirst({
    where: and(eq(auditions.id, id), eq(auditions.organizationId, profile.id)),
  });

  if (!audition) {
    notFound();
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:6767";
  const checkinUrl = `${baseUrl}/auditions/${audition.slug}/checkin`;

  return (
    <div className="container py-8">
      <CheckinManagementPage
        auditionId={audition.id}
        auditionTitle={audition.title}
        checkinUrl={checkinUrl}
      />
    </div>
  );
}

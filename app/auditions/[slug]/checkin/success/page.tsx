export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { auditions, producerProfiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { QueueNumber } from "@/components/checkin/QueueNumber";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { ArrowLeft, MapPin, Video } from "lucide-react";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ q?: string }>;
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
    return { title: "Check-in Success" };
  }

  return {
    title: `Checked In - ${audition.title} | Dramatis`,
    description: `You're checked in for ${audition.title}`,
  };
}

export default async function CheckinSuccessPage({
  params,
  searchParams,
}: Props): Promise<React.ReactElement> {
  const { slug } = await params;
  const { q } = await searchParams;

  const queueNumber = q ? parseInt(q, 10) : null;

  if (!queueNumber || isNaN(queueNumber)) {
    notFound();
  }

  // Get audition
  const audition = await db.query.auditions.findFirst({
    where: eq(auditions.slug, slug),
  });

  if (!audition) {
    notFound();
  }

  // Get organization
  const organization = await db.query.producerProfiles.findFirst({
    where: eq(producerProfiles.id, audition.organizationId),
  });

  return (
    <div className="from-base-200 to-base-100 min-h-screen bg-gradient-to-b">
      <div className="container mx-auto max-w-md px-4 py-8">
        {/* Organization header */}
        {organization && (
          <div className="mb-6 text-center">
            <div className="mb-3 flex justify-center">
              <Avatar className="h-16 w-16">
                <AvatarImage src={organization.logoUrl ?? undefined} />
                <AvatarFallback>{organization.companyName[0]}</AvatarFallback>
              </Avatar>
            </div>
            <p className="text-muted-foreground text-sm">{organization.companyName}</p>
          </div>
        )}

        {/* Queue number display */}
        <QueueNumber queueNumber={queueNumber} auditionTitle={audition.title} />

        {/* Audition details */}
        <Card className="mt-6">
          <CardHeader className="pb-3">
            <h2 className="font-semibold">{audition.title}</h2>
            <p className="text-muted-foreground flex items-center gap-1 text-sm">
              {audition.isVirtual ? (
                <>
                  <Video className="h-4 w-4" />
                  Virtual Audition
                </>
              ) : (
                <>
                  <MapPin className="h-4 w-4" />
                  {audition.location ?? "Location TBD"}
                </>
              )}
            </p>
          </CardHeader>
          <CardContent className="pt-0">
            {audition.auditionDates && audition.auditionDates.length > 0 && (
              <div className="text-sm">
                <p className="text-muted-foreground">Today&apos;s Schedule</p>
                {audition.auditionDates.map((date, index) => (
                  <p key={index} className="font-medium">
                    {date.startTime}
                    {date.endTime && ` - ${date.endTime}`}
                    {date.notes && <span className="text-muted-foreground"> ({date.notes})</span>}
                  </p>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Back link */}
        <div className="mt-6 text-center">
          <Button variant="ghost" asChild>
            <Link href={`/auditions/${slug}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              View Audition Details
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

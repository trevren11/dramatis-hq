import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { talentProfiles, availability } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { TalentCalendar } from "@/components/calendar/TalentCalendar";

export const metadata = {
  title: "My Calendar | Dramatis HQ",
  description: "Manage your availability and view upcoming shows",
};

export default async function CalendarPage(): Promise<React.ReactElement> {
  const session = await auth();

  if (!session?.user.id) {
    redirect("/login");
  }

  const profile = await db.query.talentProfiles.findFirst({
    where: eq(talentProfiles.userId, session.user.id),
  });

  if (!profile) {
    redirect("/talent/profile/wizard");
  }

  // Get the iCal token (from any availability entry) for the subscribe link
  const existingAvailability = await db.query.availability.findFirst({
    where: eq(availability.talentProfileId, profile.id),
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">My Calendar</h1>
        <p className="text-muted-foreground mt-2">
          Manage your availability and view your upcoming shows. Drag to select dates and mark your
          availability.
        </p>
      </div>

      <TalentCalendar icalToken={existingAvailability?.icalToken ?? undefined} />
    </div>
  );
}

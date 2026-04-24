import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, producerProfiles, shows } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { CreateAuditionWizard } from "@/components/auditions/CreateAuditionWizard";

export const metadata = {
  title: "Create Audition",
  description: "Create a new audition announcement",
};

export default async function CreateAuditionPage(): Promise<React.ReactElement> {
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

  // Get shows for this producer
  const producerShows = await db.query.shows.findMany({
    where: eq(shows.organizationId, profile.id),
    orderBy: [desc(shows.updatedAt)],
    columns: {
      id: true,
      title: true,
    },
  });

  if (producerShows.length === 0) {
    return (
      <div className="container py-8">
        <div className="mx-auto max-w-2xl">
          <div className="border-border rounded-xl border p-8 text-center">
            <h1 className="text-xl font-semibold">No Productions Found</h1>
            <p className="text-muted-foreground mt-2">
              You need to create a production before you can create an audition.
            </p>
            <Link
              href="/producer/shows/new"
              className="bg-primary text-primary-foreground mt-4 inline-block rounded-lg px-4 py-2 hover:opacity-90"
            >
              Create Production
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <CreateAuditionWizard initialShows={producerShows} />
    </div>
  );
}

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, producerProfiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { CreateShowWizard } from "@/components/shows/CreateShowWizard";

export const metadata = {
  title: "New Production",
  description: "Create a new theatrical production",
};

export default async function NewShowPage(): Promise<React.ReactElement> {
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

  // Check if producer profile exists
  const profile = await db.query.producerProfiles.findFirst({
    where: eq(producerProfiles.userId, session.user.id),
  });

  if (!profile) {
    redirect("/producer/setup");
  }

  return (
    <div className="container max-w-3xl py-8">
      <CreateShowWizard />
    </div>
  );
}

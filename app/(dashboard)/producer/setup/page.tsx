import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, producerProfiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { SetupWizard } from "@/components/company/SetupWizard";

export const metadata = {
  title: "Set Up Your Company",
  description: "Create your production company profile on Dramatis",
};

export default async function ProducerSetupPage(): Promise<React.ReactElement> {
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

  // Check if profile already exists
  const existingProfile = await db.query.producerProfiles.findFirst({
    where: eq(producerProfiles.userId, session.user.id),
  });

  if (existingProfile) {
    redirect("/producer/dashboard");
  }

  return (
    <div className="container max-w-3xl py-8">
      <SetupWizard
        initialData={{
          email: user.email,
          name: user.name ?? undefined,
        }}
      />
    </div>
  );
}

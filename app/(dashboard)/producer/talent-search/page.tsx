import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, producerProfiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { TalentSearchPage } from "@/components/talent-search";

export const metadata = {
  title: "Find Talent",
  description: "Search and discover talent for your productions",
};

export default async function ProducerTalentSearchPage(): Promise<React.ReactElement> {
  const session = await auth();

  if (!session?.user.id) {
    redirect("/login");
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
  });

  if (user?.userType !== "producer") {
    redirect("/");
  }

  const profile = await db.query.producerProfiles.findFirst({
    where: eq(producerProfiles.userId, session.user.id),
  });

  if (!profile) {
    redirect("/producer/setup");
  }

  return <TalentSearchPage />;
}

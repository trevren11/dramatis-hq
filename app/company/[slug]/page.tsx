import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { producerProfiles, productionPhotos } from "@/lib/db/schema";
import { eq, and, asc, desc } from "drizzle-orm";
import { PublicCompanyPage } from "@/components/company/PublicCompanyPage";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: Props): Promise<{ title: string; description?: string }> {
  const { slug } = await params;
  const profile = await db.query.producerProfiles.findFirst({
    where: and(eq(producerProfiles.slug, slug), eq(producerProfiles.isPublic, true)),
    columns: { companyName: true, description: true },
  });

  if (!profile) {
    return { title: "Company Not Found" };
  }

  return {
    title: `${profile.companyName} | Dramatis`,
    description: profile.description?.slice(0, 160) ?? `View ${profile.companyName} on Dramatis`,
  };
}

export default async function CompanyProfilePage({ params }: Props): Promise<React.ReactElement> {
  const { slug } = await params;

  const profile = await db.query.producerProfiles.findFirst({
    where: and(eq(producerProfiles.slug, slug), eq(producerProfiles.isPublic, true)),
  });

  if (!profile) {
    notFound();
  }

  const photos = await db.query.productionPhotos.findMany({
    where: eq(productionPhotos.producerProfileId, profile.id),
    orderBy: [desc(productionPhotos.isFeatured), asc(productionPhotos.sortOrder)],
  });

  return (
    <div className="from-base-200 to-base-100 min-h-screen bg-gradient-to-b">
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <PublicCompanyPage profile={profile} photos={photos} />
      </div>
    </div>
  );
}

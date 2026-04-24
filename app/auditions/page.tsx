export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { auditions, shows, producerProfiles } from "@/lib/db/schema";
import { eq, and, or, gte, lte, desc, sql } from "drizzle-orm";
import { AuditionBrowse } from "@/components/auditions/AuditionBrowse";

export const metadata = {
  title: "Browse Auditions | Dramatis",
  description: "Find and apply to auditions for theater, film, and performance productions.",
};

export default async function AuditionsPage(): Promise<React.ReactElement> {
  const now = new Date();

  // Fetch public, open auditions
  const results = await db
    .select({
      audition: auditions,
      show: {
        id: shows.id,
        title: shows.title,
        type: shows.type,
        venue: shows.venue,
      },
      organization: {
        id: producerProfiles.id,
        companyName: producerProfiles.companyName,
        slug: producerProfiles.slug,
        logoUrl: producerProfiles.logoUrl,
        location: producerProfiles.location,
      },
    })
    .from(auditions)
    .innerJoin(shows, eq(auditions.showId, shows.id))
    .innerJoin(producerProfiles, eq(auditions.organizationId, producerProfiles.id))
    .where(
      and(
        eq(auditions.status, "open"),
        eq(auditions.visibility, "public"),
        or(eq(auditions.publishAt, sql`NULL`), lte(auditions.publishAt, now)),
        or(eq(auditions.submissionDeadline, sql`NULL`), gte(auditions.submissionDeadline, now))
      )
    )
    .orderBy(desc(auditions.publishAt), desc(auditions.createdAt))
    .limit(20);

  // Get total count
  const countResult = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(auditions)
    .innerJoin(shows, eq(auditions.showId, shows.id))
    .innerJoin(producerProfiles, eq(auditions.organizationId, producerProfiles.id))
    .where(
      and(
        eq(auditions.status, "open"),
        eq(auditions.visibility, "public"),
        or(eq(auditions.publishAt, sql`NULL`), lte(auditions.publishAt, now)),
        or(eq(auditions.submissionDeadline, sql`NULL`), gte(auditions.submissionDeadline, now))
      )
    );

  const total = countResult[0]?.count ?? 0;

  return (
    <div className="from-base-200 to-base-100 min-h-screen bg-gradient-to-b">
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Browse Auditions</h1>
          <p className="text-muted-foreground mt-1">
            Find and apply to auditions for theater, film, and performance productions
          </p>
        </div>

        <AuditionBrowse
          initialAuditions={results}
          initialPagination={{
            page: 1,
            limit: 20,
            total,
            totalPages: Math.ceil(total / 20),
          }}
        />
      </div>
    </div>
  );
}

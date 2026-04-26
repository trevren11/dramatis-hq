import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auditions, shows, producerProfiles, auditionRoles, roles } from "@/lib/db/schema";
import { eq, asc, sql } from "drizzle-orm";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
): Promise<NextResponse> {
  try {
    const { slug } = await params;

    // Get audition by slug
    const audition = await db.query.auditions.findFirst({
      where: eq(auditions.slug, slug),
    });

    if (!audition) {
      return NextResponse.json({ error: "Audition not found" }, { status: 404 });
    }

    // Check visibility
    const now = new Date();
    const isPublished = !audition.publishAt || audition.publishAt <= now;

    if (audition.visibility === "private") {
      return NextResponse.json({ error: "Audition not found" }, { status: 404 });
    }

    if (audition.status === "draft" || audition.status === "cancelled") {
      return NextResponse.json({ error: "Audition not found" }, { status: 404 });
    }

    if (!isPublished) {
      return NextResponse.json({ error: "Audition not found" }, { status: 404 });
    }

    // Get show info
    const show = await db.query.shows.findFirst({
      where: eq(shows.id, audition.showId),
    });

    // Get organization info
    const organization = await db.query.producerProfiles.findFirst({
      where: eq(producerProfiles.id, audition.organizationId),
    });

    // Get linked roles
    const linkedRoles = await db
      .select({
        role: roles,
      })
      .from(auditionRoles)
      .innerJoin(roles, eq(auditionRoles.roleId, roles.id))
      .where(eq(auditionRoles.auditionId, audition.id))
      .orderBy(asc(roles.sortOrder));

    // Check if deadline has passed
    const isDeadlinePassed = audition.submissionDeadline
      ? audition.submissionDeadline < now
      : false;

    // Get application count
    const countResult = (await db.execute(sql`
      SELECT COUNT(*) as count FROM audition_applications WHERE audition_id = ${audition.id}
    `)) as { count: string }[];
    const applicationCount = parseInt(countResult[0]?.count ?? "0");

    return NextResponse.json({
      audition: {
        ...audition,
        isDeadlinePassed,
        applicationCount,
      },
      show: show
        ? {
            id: show.id,
            title: show.title,
            type: show.type,
            venue: show.venue,
            description: show.description,
            performanceStart: show.performanceStart,
            performanceEnd: show.performanceEnd,
          }
        : null,
      organization: organization
        ? {
            id: organization.id,
            companyName: organization.companyName,
            slug: organization.slug,
            logoUrl: organization.logoUrl,
            description: organization.description,
            location: organization.location,
            website: organization.website,
          }
        : null,
      roles: linkedRoles.map((lr) => lr.role),
    });
  } catch (error) {
    console.error("Error fetching audition:", error);
    return NextResponse.json({ error: "Failed to fetch audition" }, { status: 500 });
  }
}

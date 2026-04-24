import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  producerProfiles,
  auditions,
  auditionRoles,
  auditionApplications,
  roles,
} from "@/lib/db/schema";
import { auditionUpdateSchema } from "@/lib/validations/auditions";
import { generateSlug } from "@/lib/utils";
import { eq, and, asc } from "drizzle-orm";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const profile = await db.query.producerProfiles.findFirst({
      where: eq(producerProfiles.userId, session.user.id),
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const audition = await db.query.auditions.findFirst({
      where: and(eq(auditions.id, id), eq(auditions.organizationId, profile.id)),
    });

    if (!audition) {
      return NextResponse.json({ error: "Audition not found" }, { status: 404 });
    }

    // Get linked roles
    const linkedRoles = await db
      .select({
        roleId: auditionRoles.roleId,
        role: roles,
      })
      .from(auditionRoles)
      .innerJoin(roles, eq(auditionRoles.roleId, roles.id))
      .where(eq(auditionRoles.auditionId, id))
      .orderBy(asc(roles.sortOrder));

    // Get application count
    const applications = await db.query.auditionApplications.findMany({
      where: eq(auditionApplications.auditionId, id),
    });

    return NextResponse.json({
      audition,
      roles: linkedRoles.map((lr) => lr.role),
      applicationCount: applications.length,
    });
  } catch (error) {
    console.error("Error fetching audition:", error);
    return NextResponse.json({ error: "Failed to fetch audition" }, { status: 500 });
  }
}

// eslint-disable-next-line complexity
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const profile = await db.query.producerProfiles.findFirst({
      where: eq(producerProfiles.userId, session.user.id),
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const existingAudition = await db.query.auditions.findFirst({
      where: and(eq(auditions.id, id), eq(auditions.organizationId, profile.id)),
    });

    if (!existingAudition) {
      return NextResponse.json({ error: "Audition not found" }, { status: 404 });
    }

    const body: unknown = await request.json();
    const parsed = auditionUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { roleIds, ...updateData } = parsed.data;

    // Handle slug update if title changed and no slug provided
    let slug = updateData.slug;
    if (updateData.title && !slug && updateData.title !== existingAudition.title) {
      slug = generateSlug(updateData.title);
      // Check for uniqueness
      let slugExists = await db.query.auditions.findFirst({
        where: and(eq(auditions.slug, slug), eq(auditions.id, id)),
      });
      slugExists ??= await db.query.auditions.findFirst({
        where: eq(auditions.slug, slug),
      });
      let suffix = 1;
      while (slugExists && slugExists.id !== id) {
        slug = `${generateSlug(updateData.title)}-${String(suffix)}`;
        slugExists = await db.query.auditions.findFirst({
          where: eq(auditions.slug, slug),
        });
        suffix++;
      }
    }

    const [updated] = await db
      .update(auditions)
      .set({
        ...updateData,
        ...(slug ? { slug } : {}),
        updatedAt: new Date(),
      })
      .where(eq(auditions.id, id))
      .returning();

    // Update linked roles if provided
    if (roleIds !== undefined) {
      // Remove existing links
      await db.delete(auditionRoles).where(eq(auditionRoles.auditionId, id));

      // Add new links
      if (roleIds.length > 0) {
        await db.insert(auditionRoles).values(
          roleIds.map((roleId) => ({
            auditionId: id,
            roleId,
          }))
        );
      }
    }

    return NextResponse.json({ audition: updated });
  } catch (error) {
    console.error("Error updating audition:", error);
    return NextResponse.json({ error: "Failed to update audition" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const profile = await db.query.producerProfiles.findFirst({
      where: eq(producerProfiles.userId, session.user.id),
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const existingAudition = await db.query.auditions.findFirst({
      where: and(eq(auditions.id, id), eq(auditions.organizationId, profile.id)),
    });

    if (!existingAudition) {
      return NextResponse.json({ error: "Audition not found" }, { status: 404 });
    }

    // Cascade delete will handle audition_roles and applications
    await db.delete(auditions).where(eq(auditions.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting audition:", error);
    return NextResponse.json({ error: "Failed to delete audition" }, { status: 500 });
  }
}

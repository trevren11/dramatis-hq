import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { producerProfiles, productionPhotos } from "@/lib/db/schema";
import { productionPhotoUpdateSchema } from "@/lib/validations/company";
import { eq, and } from "drizzle-orm";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await db.query.producerProfiles.findFirst({
      where: eq(producerProfiles.userId, session.user.id),
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const photo = await db.query.productionPhotos.findFirst({
      where: and(eq(productionPhotos.id, id), eq(productionPhotos.producerProfileId, profile.id)),
    });

    if (!photo) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 });
    }

    return NextResponse.json({ photo });
  } catch (error) {
    console.error("Error fetching photo:", error);
    return NextResponse.json({ error: "Failed to fetch photo" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await db.query.producerProfiles.findFirst({
      where: eq(producerProfiles.userId, session.user.id),
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const existingPhoto = await db.query.productionPhotos.findFirst({
      where: and(eq(productionPhotos.id, id), eq(productionPhotos.producerProfileId, profile.id)),
    });

    if (!existingPhoto) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 });
    }

    const body: unknown = await request.json();
    const parsed = productionPhotoUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const [photo] = await db
      .update(productionPhotos)
      .set({
        ...parsed.data,
        updatedAt: new Date(),
      })
      .where(eq(productionPhotos.id, id))
      .returning();

    return NextResponse.json({ photo });
  } catch (error) {
    console.error("Error updating photo:", error);
    return NextResponse.json({ error: "Failed to update photo" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await db.query.producerProfiles.findFirst({
      where: eq(producerProfiles.userId, session.user.id),
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const existingPhoto = await db.query.productionPhotos.findFirst({
      where: and(eq(productionPhotos.id, id), eq(productionPhotos.producerProfileId, profile.id)),
    });

    if (!existingPhoto) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 });
    }

    await db.delete(productionPhotos).where(eq(productionPhotos.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting photo:", error);
    return NextResponse.json({ error: "Failed to delete photo" }, { status: 500 });
  }
}

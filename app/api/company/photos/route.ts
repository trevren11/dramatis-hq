import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { producerProfiles, productionPhotos, MAX_PRODUCTION_PHOTOS } from "@/lib/db/schema";
import {
  productionPhotoCreateSchema,
  productionPhotoBulkCreateSchema,
} from "@/lib/validations/company";
import { eq, asc, desc } from "drizzle-orm";

export async function GET(): Promise<NextResponse> {
  try {
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

    const photos = await db.query.productionPhotos.findMany({
      where: eq(productionPhotos.producerProfileId, profile.id),
      orderBy: [desc(productionPhotos.isFeatured), asc(productionPhotos.sortOrder)],
    });

    return NextResponse.json({ photos });
  } catch (error) {
    console.error("Error fetching photos:", error);
    return NextResponse.json({ error: "Failed to fetch photos" }, { status: 500 });
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await db.query.producerProfiles.findFirst({
      where: eq(producerProfiles.userId, session.user.id),
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found. Create a company profile first." }, { status: 404 });
    }

    const body: unknown = await request.json();

    // Check if it's a bulk upload
    const bulkParsed = productionPhotoBulkCreateSchema.safeParse(body);
    if (bulkParsed.success) {
      // Bulk upload
      const existingCount = await db.query.productionPhotos.findMany({
        where: eq(productionPhotos.producerProfileId, profile.id),
        columns: { id: true },
      });

      const newCount = bulkParsed.data.photos.length;
      if (existingCount.length + newCount > MAX_PRODUCTION_PHOTOS) {
        return NextResponse.json(
          { error: `Maximum ${MAX_PRODUCTION_PHOTOS} photos allowed. You have ${existingCount.length} photos.` },
          { status: 400 }
        );
      }

      const photos = await db
        .insert(productionPhotos)
        .values(
          bulkParsed.data.photos.map((photo, index) => ({
            ...photo,
            producerProfileId: profile.id,
            sortOrder: existingCount.length + index,
          }))
        )
        .returning();

      return NextResponse.json({ photos }, { status: 201 });
    }

    // Single photo upload
    const parsed = productionPhotoCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const existingCount = await db.query.productionPhotos.findMany({
      where: eq(productionPhotos.producerProfileId, profile.id),
      columns: { id: true },
    });

    if (existingCount.length >= MAX_PRODUCTION_PHOTOS) {
      return NextResponse.json(
        { error: `Maximum ${MAX_PRODUCTION_PHOTOS} photos allowed` },
        { status: 400 }
      );
    }

    const [photo] = await db
      .insert(productionPhotos)
      .values({
        ...parsed.data,
        producerProfileId: profile.id,
        sortOrder: existingCount.length,
      })
      .returning();

    return NextResponse.json({ photo }, { status: 201 });
  } catch (error) {
    console.error("Error creating photo:", error);
    return NextResponse.json({ error: "Failed to create photo" }, { status: 500 });
  }
}

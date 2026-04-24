import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { producerProfiles, auditions } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import QRCode from "qrcode";

/**
 * GET /api/auditions/[id]/qr
 * Generate QR code for audition check-in (producer only)
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: auditionId } = await params;

    // Verify producer owns this audition
    const profile = await db.query.producerProfiles.findFirst({
      where: eq(producerProfiles.userId, session.user.id),
    });

    if (!profile) {
      return NextResponse.json({ error: "Producer profile not found" }, { status: 404 });
    }

    const audition = await db.query.auditions.findFirst({
      where: and(eq(auditions.id, auditionId), eq(auditions.organizationId, profile.id)),
    });

    if (!audition) {
      return NextResponse.json({ error: "Audition not found" }, { status: 404 });
    }

    // Get format from query params
    const url = new URL(request.url);
    const format = url.searchParams.get("format") ?? "dataUrl";

    // Build check-in URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:6767";
    const checkinUrl = `${baseUrl}/auditions/${audition.slug}/checkin`;

    // Generate QR code based on format
    if (format === "svg") {
      const svg = await QRCode.toString(checkinUrl, {
        type: "svg",
        width: 400,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#ffffff",
        },
      });

      return new NextResponse(svg, {
        headers: {
          "Content-Type": "image/svg+xml",
          "Cache-Control": "public, max-age=3600",
        },
      });
    }

    if (format === "png") {
      const buffer = await QRCode.toBuffer(checkinUrl, {
        type: "png",
        width: 400,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#ffffff",
        },
      });

      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          "Content-Type": "image/png",
          "Cache-Control": "public, max-age=3600",
        },
      });
    }

    // Default: data URL
    const dataUrl = await QRCode.toDataURL(checkinUrl, {
      width: 400,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
    });

    return NextResponse.json({
      qr: {
        dataUrl,
        checkinUrl,
        auditionTitle: audition.title,
        auditionSlug: audition.slug,
      },
    });
  } catch (error) {
    console.error("Error generating QR code:", error);
    return NextResponse.json({ error: "Failed to generate QR code" }, { status: 500 });
  }
}

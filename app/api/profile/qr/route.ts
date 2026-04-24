import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { talentProfiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import QRCode from "qrcode";

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") ?? "png";
    const size = Math.min(Math.max(parseInt(searchParams.get("size") ?? "300"), 100), 1000);

    const profile = await db.query.talentProfiles.findFirst({
      where: eq(talentProfiles.userId, session.user.id),
      columns: { publicProfileSlug: true, isPublic: true },
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    if (!profile.publicProfileSlug) {
      return NextResponse.json({ error: "No username set" }, { status: 400 });
    }

    // Build the public profile URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://dramatis.app";
    const profileUrl = `${baseUrl}/talent/${profile.publicProfileSlug}`;

    const qrOptions = {
      width: size,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
    };

    if (format === "svg") {
      const svg = await QRCode.toString(profileUrl, { ...qrOptions, type: "svg" });
      return new NextResponse(svg, {
        headers: {
          "Content-Type": "image/svg+xml",
          "Content-Disposition": `inline; filename="profile-qr.svg"`,
        },
      });
    }

    // Default to PNG
    const pngBuffer = await QRCode.toBuffer(profileUrl, { ...qrOptions, type: "png" });
    return new NextResponse(new Uint8Array(pngBuffer), {
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `inline; filename="profile-qr.png"`,
      },
    });
  } catch (error) {
    console.error("Error generating QR code:", error);
    return NextResponse.json({ error: "Failed to generate QR code" }, { status: 500 });
  }
}

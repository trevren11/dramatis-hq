import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { producerProfiles, invoices } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

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
      return NextResponse.json({ invoices: [] });
    }

    const userInvoices = await db.query.invoices.findMany({
      where: eq(invoices.organizationId, profile.id),
      orderBy: [desc(invoices.createdAt)],
      limit: 50,
    });

    return NextResponse.json({ invoices: userInvoices });
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return NextResponse.json({ error: "Failed to fetch invoices" }, { status: 500 });
  }
}

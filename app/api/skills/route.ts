import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { skills } from "@/lib/db/schema";
import { asc } from "drizzle-orm";

export async function GET(): Promise<NextResponse> {
  try {
    const allSkills = await db.query.skills.findMany({
      orderBy: [asc(skills.name)],
    });

    return NextResponse.json({ skills: allSkills });
  } catch (error) {
    console.error("Error fetching skills:", error);
    return NextResponse.json({ error: "Failed to fetch skills" }, { status: 500 });
  }
}

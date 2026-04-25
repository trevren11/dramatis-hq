export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

import { vapidConfig, isPushConfigured } from "@/lib/push/config";

export function GET(): NextResponse {
  if (!isPushConfigured()) {
    return NextResponse.json({ error: "Push notifications not configured" }, { status: 503 });
  }

  return NextResponse.json({
    publicKey: vapidConfig.publicKey,
  });
}

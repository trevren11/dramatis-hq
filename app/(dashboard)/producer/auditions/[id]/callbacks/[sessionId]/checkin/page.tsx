import React from "react";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { auditions, callbackSessions } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { CallbackDayInterface } from "@/components/callbacks";

interface PageProps {
  params: Promise<{ id: string; sessionId: string }>;
}

export default async function CallbackCheckinPage({
  params,
}: PageProps): Promise<React.ReactElement> {
  const { id: auditionId, sessionId } = await params;

  const audition = await db.query.auditions.findFirst({
    where: eq(auditions.id, auditionId),
  });

  if (!audition) {
    notFound();
  }

  const callbackSession = await db.query.callbackSessions.findFirst({
    where: and(eq(callbackSessions.id, sessionId), eq(callbackSessions.auditionId, auditionId)),
  });

  if (!callbackSession) {
    notFound();
  }

  return (
    <CallbackDayInterface
      auditionId={auditionId}
      auditionTitle={audition.title}
      sessionId={sessionId}
    />
  );
}

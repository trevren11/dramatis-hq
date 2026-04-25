/* eslint-disable @typescript-eslint/no-unnecessary-type-parameters */
import Pusher from "pusher";

// Re-export shared constants for server-side use
export { CHANNELS, EVENTS } from "./realtime-constants";

// Server-side Pusher instance singleton
let pusherServer: Pusher | null = null;

export function getPusherServer(): Pusher {
  if (!pusherServer) {
    const appId = process.env.PUSHER_APP_ID;
    const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const secret = process.env.PUSHER_SECRET;
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

    if (!appId || !key || !secret || !cluster) {
      throw new Error(
        "PUSHER_APP_ID, NEXT_PUBLIC_PUSHER_KEY, PUSHER_SECRET, and NEXT_PUBLIC_PUSHER_CLUSTER must be set"
      );
    }

    pusherServer = new Pusher({
      appId,
      key,
      secret,
      cluster,
      useTLS: true,
    });
  }

  return pusherServer;
}

// Trigger helper with type safety
export async function triggerEvent<T>(channel: string, event: string, data: T): Promise<void> {
  const pusher = getPusherServer();
  await pusher.trigger(channel, event, data);
}

// Trigger to multiple channels
export async function triggerMultiple<T>(
  channels: string[],
  event: string,
  data: T
): Promise<void> {
  const pusher = getPusherServer();
  // Pusher allows up to 10 channels per trigger call
  const batches = [];
  for (let i = 0; i < channels.length; i += 10) {
    batches.push(channels.slice(i, i + 10));
  }
  await Promise.all(batches.map((batch) => pusher.trigger(batch, event, data)));
}

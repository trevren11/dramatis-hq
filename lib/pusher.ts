"use client";

import Pusher from "pusher-js";

// Pusher client singleton for browser
let pusherClient: Pusher | null = null;

export function getPusherClient(): Pusher {
  if (typeof window === "undefined") {
    throw new Error("getPusherClient must be called on the client side");
  }

  if (!pusherClient) {
    const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

    if (!key || !cluster) {
      throw new Error(
        "NEXT_PUBLIC_PUSHER_KEY and NEXT_PUBLIC_PUSHER_CLUSTER must be set"
      );
    }

    pusherClient = new Pusher(key, {
      cluster,
      authEndpoint: "/api/pusher/auth",
      authTransport: "ajax",
      auth: {
        headers: {
          "Content-Type": "application/json",
        },
      },
    });

    // Connection state logging for debugging
    pusherClient.connection.bind("connected", () => {
      console.log("[Pusher] Connected");
    });

    pusherClient.connection.bind("disconnected", () => {
      console.log("[Pusher] Disconnected");
    });

    pusherClient.connection.bind("error", (error: Error) => {
      console.error("[Pusher] Connection error:", error);
    });
  }

  return pusherClient;
}

// Disconnect and cleanup
export function disconnectPusher(): void {
  if (pusherClient) {
    pusherClient.disconnect();
    pusherClient = null;
  }
}

// Connection state
export type ConnectionState =
  | "initialized"
  | "connecting"
  | "connected"
  | "unavailable"
  | "failed"
  | "disconnected";

export function getConnectionState(): ConnectionState {
  if (!pusherClient) return "disconnected";
  return pusherClient.connection.state as ConnectionState;
}

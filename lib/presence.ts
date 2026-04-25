"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getPusherClient } from "./pusher";
import type { PresenceMember } from "./hooks/use-presence";

// Generate a consistent color for a user based on their ID
export function getUserColor(userId: string): string {
  const colors = [
    "#ef4444", // red
    "#f97316", // orange
    "#eab308", // yellow
    "#22c55e", // green
    "#14b8a6", // teal
    "#3b82f6", // blue
    "#8b5cf6", // violet
    "#ec4899", // pink
  ];

  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length] ?? "#6b7280";
}

// Get initials from a name
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// Format last seen timestamp
export function formatLastSeen(timestamp: Date | string | null): string {
  if (!timestamp) return "Never";

  const date = typeof timestamp === "string" ? new Date(timestamp) : timestamp;
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString();
}

// Hook for tracking online status
interface UseOnlineStatusOptions {
  pingInterval?: number;
  enabled?: boolean;
}

interface OnlineUser {
  id: string;
  name: string;
  image: string | null;
  lastSeen: Date;
  isOnline: boolean;
}

export function useOnlineStatus(
  channelName: string,
  options: UseOnlineStatusOptions = {}
): {
  onlineUsers: OnlineUser[];
  isConnected: boolean;
} {
  const { enabled = true } = options;
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!enabled || !channelName) return;

    const presenceChannel = channelName.startsWith("presence-")
      ? channelName
      : `presence-${channelName}`;

    try {
      const pusher = getPusherClient();
      const channel = pusher.subscribe(presenceChannel);

      channel.bind("pusher:subscription_succeeded", (members: { count: number; each: (cb: (member: PresenceMember) => void) => void }) => {
        setIsConnected(true);
        const users: OnlineUser[] = [];
        members.each((member: PresenceMember) => {
          users.push({
            id: member.id,
            name: member.info.name,
            image: member.info.image,
            lastSeen: new Date(),
            isOnline: true,
          });
        });
        setOnlineUsers(users);
      });

      channel.bind("pusher:member_added", (member: PresenceMember) => {
        setOnlineUsers((prev) => {
          if (prev.some((u) => u.id === member.id)) return prev;
          return [
            ...prev,
            {
              id: member.id,
              name: member.info.name,
              image: member.info.image,
              lastSeen: new Date(),
              isOnline: true,
            },
          ];
        });
      });

      channel.bind("pusher:member_removed", (member: { id: string }) => {
        setOnlineUsers((prev) =>
          prev.map((u) =>
            u.id === member.id
              ? { ...u, isOnline: false, lastSeen: new Date() }
              : u
          )
        );
      });

      return () => {
        channel.unbind_all();
        pusher.unsubscribe(presenceChannel);
        setIsConnected(false);
      };
    } catch {
      return undefined;
    }
  }, [channelName, enabled]);

  return { onlineUsers, isConnected };
}

// Hook for cursor/selection tracking
interface CursorPosition {
  userId: string;
  userName: string;
  userColor: string;
  position: { x: number; y: number } | null;
  selectedId: string | null;
}

export function useCursorTracking(
  channelName: string,
  userId: string,
  userName: string,
  options: { enabled?: boolean; throttleMs?: number } = {}
): {
  cursors: CursorPosition[];
  updatePosition: (position: { x: number; y: number } | null) => void;
  updateSelection: (selectedId: string | null) => void;
} {
  const { enabled = true, throttleMs = 50 } = options;
  const [cursors, setCursors] = useState<CursorPosition[]>([]);
  const lastUpdateRef = useRef<number>(0);
  const channelRef = useRef<ReturnType<ReturnType<typeof getPusherClient>["subscribe"]> | null>(null);

  const userColor = getUserColor(userId);

  useEffect(() => {
    if (!enabled || !channelName) return;

    const presenceChannel = channelName.startsWith("presence-")
      ? channelName
      : `presence-${channelName}`;

    try {
      const pusher = getPusherClient();
      const channel = pusher.subscribe(presenceChannel);
      channelRef.current = channel;

      channel.bind("client-cursor-move", (data: CursorPosition) => {
        setCursors((prev) => {
          const existing = prev.findIndex((c) => c.userId === data.userId);
          if (existing >= 0) {
            const updated = [...prev];
            updated[existing] = data;
            return updated;
          }
          return [...prev, data];
        });
      });

      channel.bind("pusher:member_removed", (member: { id: string }) => {
        setCursors((prev) => prev.filter((c) => c.userId !== member.id));
      });

      return () => {
        channel.unbind("client-cursor-move");
        pusher.unsubscribe(presenceChannel);
        channelRef.current = null;
      };
    } catch {
      return undefined;
    }
  }, [channelName, enabled]);

  const updatePosition = useCallback(
    (position: { x: number; y: number } | null) => {
      const now = Date.now();
      if (now - lastUpdateRef.current < throttleMs) return;
      lastUpdateRef.current = now;

      const channel = channelRef.current;
      if (channel && "trigger" in channel) {
        (channel as { trigger: (event: string, data: unknown) => void }).trigger(
          "client-cursor-move",
          {
            userId,
            userName,
            userColor,
            position,
            selectedId: null,
          }
        );
      }
    },
    [userId, userName, userColor, throttleMs]
  );

  const updateSelection = useCallback(
    (selectedId: string | null) => {
      const channel = channelRef.current;
      if (channel && "trigger" in channel) {
        (channel as { trigger: (event: string, data: unknown) => void }).trigger(
          "client-cursor-move",
          {
            userId,
            userName,
            userColor,
            position: null,
            selectedId,
          }
        );
      }
    },
    [userId, userName, userColor]
  );

  return { cursors, updatePosition, updateSelection };
}

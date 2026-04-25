/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/explicit-function-return-type, @typescript-eslint/no-unnecessary-condition */
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import type { PresenceChannel, Members } from "pusher-js";
import { getPusherClient, type ConnectionState } from "@/lib/pusher";

export interface PresenceMember {
  id: string;
  info: {
    name: string;
    email: string;
    image: string | null;
  };
}

interface UsePresenceReturn {
  members: PresenceMember[];
  me: PresenceMember | null;
  count: number;
  isConnected: boolean;
  connectionState: ConnectionState;
  error: Error | null;
}

export function usePresence(
  channelName: string,
  options: { enabled?: boolean } = {}
): UsePresenceReturn {
  const { enabled = true } = options;

  const [members, setMembers] = useState<PresenceMember[]>([]);
  const [me, setMe] = useState<PresenceMember | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>("disconnected");
  const [error, setError] = useState<Error | null>(null);

  const channelRef = useRef<PresenceChannel | null>(null);

  useEffect(() => {
    // Presence channels must start with "presence-"
    if (!enabled || !channelName?.startsWith("presence-")) return;

    let mounted = true;

    const setupPresence = () => {
      try {
        const pusher = getPusherClient();

        const handleStateChange = ({ current }: { current: ConnectionState }) => {
          if (mounted) setConnectionState(current);
        };

        pusher.connection.bind("state_change", handleStateChange);
        setConnectionState(pusher.connection.state as ConnectionState);

        const channel = pusher.subscribe(channelName) as PresenceChannel;
        channelRef.current = channel;

        // Subscription succeeded - populate initial members
        channel.bind("pusher:subscription_succeeded", (membersData: Members) => {
          if (!mounted) return;

          const memberList: PresenceMember[] = [];
          membersData.each((member: { id: string; info: PresenceMember["info"] }) => {
            memberList.push({ id: member.id, info: member.info });
          });

          setMembers(memberList);
          setMe({
            id: membersData.myID,
            info: membersData.me?.info as PresenceMember["info"],
          });
          setError(null);
        });

        // Member added
        channel.bind(
          "pusher:member_added",
          (member: { id: string; info: PresenceMember["info"] }) => {
            if (!mounted) return;
            setMembers((prev) => {
              if (prev.some((m) => m.id === member.id)) return prev;
              return [...prev, { id: member.id, info: member.info }];
            });
          }
        );

        // Member removed
        channel.bind(
          "pusher:member_removed",
          (member: { id: string; info: PresenceMember["info"] }) => {
            if (!mounted) return;
            setMembers((prev) => prev.filter((m) => m.id !== member.id));
          }
        );

        // Subscription error
        channel.bind("pusher:subscription_error", (err: Error) => {
          if (mounted) setError(err);
        });

        return () => {
          pusher.connection.unbind("state_change", handleStateChange);
        };
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err : new Error("Presence connection failed"));
        }
        return undefined;
      }
    };

    const cleanup = setupPresence();

    return () => {
      mounted = false;
      cleanup?.();

      if (channelRef.current) {
        const pusher = getPusherClient();
        pusher.unsubscribe(channelName);
        channelRef.current = null;
      }
    };
  }, [channelName, enabled]);

  return {
    members,
    me,
    count: members.length,
    isConnected: connectionState === "connected",
    connectionState,
    error,
  };
}

// Hook for typing indicators
export function useTypingIndicator(
  channelName: string,
  options: { enabled?: boolean; timeout?: number } = {}
): {
  typingUsers: PresenceMember[];
  startTyping: () => void;
  stopTyping: () => void;
} {
  const { enabled = true, timeout = 3000 } = options;

  const [typingUsers, setTypingUsers] = useState<PresenceMember[]>([]);
  const channelRef = useRef<PresenceChannel | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const typingTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  useEffect(() => {
    if (!enabled || !channelName) return;

    const pusher = getPusherClient();
    const channel = pusher.subscribe(channelName) as PresenceChannel;
    channelRef.current = channel;

    // Listen for typing events (client events)
    channel.bind("client-typing:start", (data: { user: PresenceMember }) => {
      setTypingUsers((prev) => {
        if (prev.some((u) => u.id === data.user.id)) return prev;
        return [...prev, data.user];
      });

      // Auto-remove after timeout
      const existingTimeout = typingTimeoutsRef.current.get(data.user.id);
      if (existingTimeout) clearTimeout(existingTimeout);

      const newTimeout = setTimeout(() => {
        setTypingUsers((prev) => prev.filter((u) => u.id !== data.user.id));
        typingTimeoutsRef.current.delete(data.user.id);
      }, timeout);

      typingTimeoutsRef.current.set(data.user.id, newTimeout);
    });

    channel.bind("client-typing:stop", (data: { user: PresenceMember }) => {
      setTypingUsers((prev) => prev.filter((u) => u.id !== data.user.id));
      const existingTimeout = typingTimeoutsRef.current.get(data.user.id);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
        typingTimeoutsRef.current.delete(data.user.id);
      }
    });

    return () => {
      channel.unbind("client-typing:start");
      channel.unbind("client-typing:stop");
      pusher.unsubscribe(channelName);
      channelRef.current = null;

      // Clear all typing timeouts
      typingTimeoutsRef.current.forEach((t) => {
        clearTimeout(t);
      });
      typingTimeoutsRef.current.clear();
    };
  }, [channelName, enabled, timeout]);

  const startTyping = useCallback(() => {
    if (!channelRef.current) return;

    // Clear existing auto-stop timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Trigger client event
    channelRef.current.trigger("client-typing:start", {
      user: { id: channelRef.current.members.myID, info: channelRef.current.members.me?.info },
    });

    // Auto-stop after timeout
    timeoutRef.current = setTimeout(() => {
      stopTyping();
    }, timeout);
  }, [timeout]);

  const stopTyping = useCallback(() => {
    if (!channelRef.current) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    channelRef.current.trigger("client-typing:stop", {
      user: { id: channelRef.current.members.myID, info: channelRef.current.members.me?.info },
    });
  }, []);

  return { typingUsers, startTyping, stopTyping };
}

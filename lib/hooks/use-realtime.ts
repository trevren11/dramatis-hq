"use client";

import { useEffect, useState, useRef } from "react";
import type { Channel } from "pusher-js";
import { getPusherClient, type ConnectionState } from "@/lib/pusher";

interface UseRealtimeOptions<T> {
  onUpdate?: (data: T) => void;
  onError?: (error: Error) => void;
  enabled?: boolean;
}

interface UseRealtimeReturn<T> {
  data: T | null;
  isConnected: boolean;
  connectionState: ConnectionState;
  error: Error | null;
}

export function useRealtime<T>(
  channelName: string,
  eventName: string,
  options: UseRealtimeOptions<T> = {}
): UseRealtimeReturn<T> {
  const { onUpdate, onError, enabled = true } = options;

  const [data, setData] = useState<T | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>("disconnected");
  const [error, setError] = useState<Error | null>(null);

  const channelRef = useRef<Channel | null>(null);
  const onUpdateRef = useRef(onUpdate);
  const onErrorRef = useRef(onError);

  // Keep refs updated
  useEffect(() => {
    onUpdateRef.current = onUpdate;
    onErrorRef.current = onError;
  }, [onUpdate, onError]);

  useEffect(() => {
    if (!enabled || !channelName || !eventName) return;

    let mounted = true;

    const setupSubscription = () => {
      try {
        const pusher = getPusherClient();

        // Track connection state
        const handleStateChange = ({ current }: { current: ConnectionState }) => {
          if (mounted) setConnectionState(current);
        };

        pusher.connection.bind("state_change", handleStateChange);
        setConnectionState(pusher.connection.state as ConnectionState);

        // Subscribe to channel
        const channel = pusher.subscribe(channelName);
        channelRef.current = channel;

        // Handle subscription success
        channel.bind("pusher:subscription_succeeded", () => {
          if (mounted) setError(null);
        });

        // Handle subscription error
        channel.bind("pusher:subscription_error", (err: Error) => {
          if (mounted) {
            setError(err);
            onErrorRef.current?.(err);
          }
        });

        // Bind to the event
        channel.bind(eventName, (eventData: T) => {
          if (mounted) {
            setData(eventData);
            onUpdateRef.current?.(eventData);
          }
        });

        return () => {
          pusher.connection.unbind("state_change", handleStateChange);
        };
      } catch (err) {
        if (mounted) {
          const error = err instanceof Error ? err : new Error("Connection failed");
          setError(error);
          onErrorRef.current?.(error);
        }
        return undefined;
      }
    };

    const cleanup = setupSubscription();

    return () => {
      mounted = false;
      cleanup?.();

      if (channelRef.current) {
        channelRef.current.unbind(eventName);
        const pusher = getPusherClient();
        pusher.unsubscribe(channelName);
        channelRef.current = null;
      }
    };
  }, [channelName, eventName, enabled]);

  const isConnected = connectionState === "connected";

  return { data, isConnected, connectionState, error };
}

// Hook for subscribing to multiple events on a channel
export function useRealtimeChannel(
  channelName: string,
  events: Record<string, (data: unknown) => void>,
  options: { enabled?: boolean } = {}
): { isConnected: boolean; connectionState: ConnectionState; error: Error | null } {
  const { enabled = true } = options;

  const [connectionState, setConnectionState] = useState<ConnectionState>("disconnected");
  const [error, setError] = useState<Error | null>(null);

  const channelRef = useRef<Channel | null>(null);
  const eventsRef = useRef(events);

  useEffect(() => {
    eventsRef.current = events;
  }, [events]);

  useEffect(() => {
    if (!enabled || !channelName) return;

    let mounted = true;

    try {
      const pusher = getPusherClient();

      const handleStateChange = ({ current }: { current: ConnectionState }) => {
        if (mounted) setConnectionState(current);
      };

      pusher.connection.bind("state_change", handleStateChange);
      setConnectionState(pusher.connection.state as ConnectionState);

      const channel = pusher.subscribe(channelName);
      channelRef.current = channel;

      channel.bind("pusher:subscription_error", (err: Error) => {
        if (mounted) setError(err);
      });

      // Bind all events
      Object.entries(eventsRef.current).forEach(([eventName, handler]) => {
        channel.bind(eventName, handler);
      });

      return () => {
        mounted = false;
        pusher.connection.unbind("state_change", handleStateChange);

        if (channelRef.current) {
          Object.keys(eventsRef.current).forEach((eventName) => {
            channelRef.current?.unbind(eventName);
          });
          pusher.unsubscribe(channelName);
          channelRef.current = null;
        }
      };
    } catch (err) {
      if (mounted) {
        setError(err instanceof Error ? err : new Error("Connection failed"));
      }
      return undefined;
    }
  }, [channelName, enabled]);

  return {
    isConnected: connectionState === "connected",
    connectionState,
    error,
  };
}

"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { trackPageView, initAnalytics } from "@/lib/monitoring/analytics";
import { reportWebVital, observeWebVitals } from "@/lib/monitoring/performance";
import { setUserContext } from "@/lib/monitoring/sentry";

// Polyfill for crypto.randomUUID (not available on HTTP)
function generateUUID(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // Fallback for non-secure contexts
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

interface MonitoringProviderProps {
  children: React.ReactNode;
  userId?: string;
  userEmail?: string;
  userRole?: string;
}

export function MonitoringProvider({
  children,
  userId,
  userEmail,
  userRole,
}: MonitoringProviderProps): React.ReactElement {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Initialize analytics context
  useEffect(() => {
    initAnalytics({
      userId,
      sessionId: generateUUID(),
      userRole: userRole as "talent" | "producer" | "admin" | undefined,
    });

    // Set Sentry user context
    if (userId) {
      setUserContext({
        id: userId,
        email: userEmail,
        role: userRole,
      });
    }
  }, [userId, userEmail, userRole]);

  // Track page views
  useEffect(() => {
    const url = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : "");
    trackPageView(url, document.referrer);
  }, [pathname, searchParams]);

  // Set up Web Vitals tracking
  useEffect(() => {
    observeWebVitals((metric) => {
      reportWebVital(metric);
    });
  }, []);

  return <>{children}</>;
}

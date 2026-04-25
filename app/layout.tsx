import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { MonitoringProvider } from "@/components/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Dramatis-HQ | Theatrical Production Management",
    template: "%s | Dramatis-HQ",
  },
  description:
    "Connect talent with producers. Manage auditions, casting, and productions in one platform.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Dramatis-HQ",
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.svg", sizes: "192x192", type: "image/svg+xml" },
      { url: "/icons/icon-512.svg", sizes: "512x512", type: "image/svg+xml" },
    ],
    apple: [{ url: "/icons/icon-192.svg", sizes: "192x192" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#7c3aed",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.ReactElement {
  return (
    <html lang="en" data-theme="dramatis">
      <body className="min-h-screen">
        <Suspense fallback={null}>
          <MonitoringProvider>{children}</MonitoringProvider>
        </Suspense>
        <Toaster />
      </body>
    </html>
  );
}

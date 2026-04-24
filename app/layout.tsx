import type { Metadata } from "next";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Dramatis-HQ | Theatrical Production Management",
    template: "%s | Dramatis-HQ",
  },
  description:
    "Connect talent with producers. Manage auditions, casting, and productions in one platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.ReactElement {
  return (
    <html lang="en" data-theme="dramatis">
      <body className="min-h-screen">
        {children}
        <Toaster />
      </body>
    </html>
  );
}

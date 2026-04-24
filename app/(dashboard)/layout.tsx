import Link from "next/link";
import { Sparkles } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div className="bg-background min-h-screen">
      <header className="border-border bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 border-b backdrop-blur">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <Sparkles className="text-primary h-8 w-8" />
            <span className="font-heading text-2xl font-bold">Dramatis-HQ</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/talent/calendar"
              className="text-muted-foreground hover:text-foreground text-sm font-medium"
            >
              Calendar
            </Link>
            <Link
              href="/talent/resume"
              className="text-muted-foreground hover:text-foreground text-sm font-medium"
            >
              Resume Builder
            </Link>
          </div>
        </nav>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
    </div>
  );
}

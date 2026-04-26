import Link from "next/link";
import { Sparkles } from "lucide-react";
import { SkipLink } from "@/components/ui/skip-link";
import { UserMenu } from "@/components/auth/user-menu";
import { DashboardNav } from "@/components/layout/dashboard-nav";
import { auth } from "@/lib/auth";

export default async function AuditionsLayout({
  children,
}: {
  children: React.ReactNode;
}): Promise<React.ReactElement> {
  const session = await auth();

  // If not logged in, show a simpler header
  if (!session?.user) {
    return (
      <div className="bg-background min-h-screen">
        <SkipLink />
        <header className="border-border bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 border-b backdrop-blur">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
            <Link href="/" className="flex items-center gap-2">
              <Sparkles className="text-primary h-8 w-8" aria-hidden="true" />
              <span className="font-heading text-xl font-bold">
                <span className="text-primary">Dramatis</span>
                <span className="text-secondary">HQ</span>
              </span>
            </Link>
            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="text-muted-foreground hover:text-foreground text-sm font-medium"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-4 py-2 text-sm font-medium"
              >
                Get Started
              </Link>
            </div>
          </div>
        </header>
        <main id="main-content" className="mx-auto max-w-7xl px-4 py-8">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      <SkipLink />
      <header className="border-border bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 border-b backdrop-blur">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <Sparkles className="text-primary h-8 w-8" aria-hidden="true" />
              <span className="font-heading text-xl font-bold">
                <span className="text-primary">Dramatis</span>
                <span className="text-secondary">HQ</span>
              </span>
            </Link>
            <UserMenu userName={session.user.name} userRole={session.user.role} />
          </div>
          <div className="border-border/50 border-t py-2">
            <DashboardNav userRole={session.user.role} />
          </div>
        </div>
      </header>
      <main id="main-content" className="mx-auto max-w-7xl px-4 py-8">
        {children}
      </main>
    </div>
  );
}

import Link from "next/link";
import { Sparkles, Users, Calendar, FileText, QrCode, Shield } from "lucide-react";

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}): React.ReactElement {
  return (
    <div className="border-border bg-card rounded-xl border p-6 shadow-sm transition-shadow hover:shadow-md">
      <div className="bg-primary/10 mb-4 flex h-12 w-12 items-center justify-center rounded-lg">
        <Icon className="text-primary h-6 w-6" />
      </div>
      <h3 className="mb-2 text-xl font-semibold">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}

export default function Home(): React.ReactElement {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-border bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 border-b backdrop-blur">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <Sparkles className="text-primary h-8 w-8" />
            <span className="font-heading text-2xl font-bold">Dramatis-HQ</span>
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
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
            >
              Get Started
            </Link>
          </div>
        </nav>
      </header>

      <main className="flex-1">
        <section className="py-20 lg:py-32">
          <div className="mx-auto max-w-7xl px-4">
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="text-4xl font-bold tracking-tight text-balance sm:text-5xl lg:text-6xl">
                Where <span className="gradient-text">Talent</span> Meets{" "}
                <span className="gradient-text">Opportunity</span>
              </h1>
              <p className="text-muted-foreground mt-6 text-lg sm:text-xl">
                The complete platform for theatrical production management. Connect with producers,
                manage auditions, and bring performances to life.
              </p>
              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  href="/signup/talent"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 w-full rounded-lg px-8 py-3 text-center font-medium shadow-lg transition-all hover:shadow-xl sm:w-auto"
                >
                  Join as Talent
                </Link>
                <Link
                  href="/signup/producer"
                  className="border-primary text-primary hover:bg-primary/5 w-full rounded-lg border px-8 py-3 text-center font-medium transition-colors sm:w-auto"
                >
                  Join as Producer
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="border-border bg-muted/30 border-y py-20">
          <div className="mx-auto max-w-7xl px-4">
            <h2 className="mb-12 text-center text-3xl font-bold">Everything You Need to Shine</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <FeatureCard
                icon={Users}
                title="Professional Profiles"
                description="Showcase your headshots, videos, work history, and special skills in a beautiful, searchable profile."
              />
              <FeatureCard
                icon={Calendar}
                title="Availability Calendar"
                description="Manage your schedule and let producers know when you're available for auditions and bookings."
              />
              <FeatureCard
                icon={FileText}
                title="Resume Generator"
                description="Auto-generate industry-standard PDF resumes from your profile data in seconds."
              />
              <FeatureCard
                icon={QrCode}
                title="QR Code Check-In"
                description="Skip the sign-in sheet. Scan your QR code at auditions for instant profile access."
              />
              <FeatureCard
                icon={Shield}
                title="Secure Documents"
                description="Store W2s, contracts, and call sheets in SOC 2 compliant encrypted storage."
              />
              <FeatureCard
                icon={Sparkles}
                title="Casting Board"
                description="Producers: drag-and-drop casting interface with real-time collaboration."
              />
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="mx-auto max-w-7xl px-4">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold">Ready to Take Center Stage?</h2>
              <p className="text-muted-foreground mt-4 text-lg">
                Join thousands of performers and producers already using Dramatis-HQ to streamline
                their productions.
              </p>
              <Link
                href="/signup"
                className="bg-primary text-primary-foreground hover:bg-primary/90 mt-8 inline-block rounded-lg px-8 py-3 font-medium shadow-lg transition-all hover:shadow-xl"
              >
                Create Your Free Account
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-border border-t py-8">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <Sparkles className="text-primary h-5 w-5" />
              <span className="font-heading font-semibold">Dramatis-HQ</span>
            </div>
            <p className="text-muted-foreground text-sm">
              &copy; {new Date().getFullYear()} Dramatis-HQ. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

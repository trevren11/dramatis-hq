import Link from "next/link";
import {
  Sparkles,
  Users,
  Calendar,
  FileText,
  QrCode,
  Shield,
} from "lucide-react";

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
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <h3 className="mb-2 text-xl font-semibold">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}

export default function Home(): React.ReactElement {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-primary" />
            <span className="font-heading text-2xl font-bold">Dramatis-HQ</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
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
              <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Where <span className="gradient-text">Talent</span> Meets{" "}
                <span className="gradient-text">Opportunity</span>
              </h1>
              <p className="mt-6 text-lg text-muted-foreground sm:text-xl">
                The complete platform for theatrical production management.
                Connect with producers, manage auditions, and bring
                performances to life.
              </p>
              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  href="/signup/talent"
                  className="w-full rounded-lg bg-primary px-8 py-3 text-center font-medium text-primary-foreground shadow-lg transition-all hover:bg-primary/90 hover:shadow-xl sm:w-auto"
                >
                  Join as Talent
                </Link>
                <Link
                  href="/signup/producer"
                  className="w-full rounded-lg border border-primary px-8 py-3 text-center font-medium text-primary transition-colors hover:bg-primary/5 sm:w-auto"
                >
                  Join as Producer
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-border bg-muted/30 py-20">
          <div className="mx-auto max-w-7xl px-4">
            <h2 className="mb-12 text-center text-3xl font-bold">
              Everything You Need to Shine
            </h2>
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
              <h2 className="text-3xl font-bold">
                Ready to Take Center Stage?
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Join thousands of performers and producers already using
                Dramatis-HQ to streamline their productions.
              </p>
              <Link
                href="/signup"
                className="mt-8 inline-block rounded-lg bg-primary px-8 py-3 font-medium text-primary-foreground shadow-lg transition-all hover:bg-primary/90 hover:shadow-xl"
              >
                Create Your Free Account
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="font-heading font-semibold">Dramatis-HQ</span>
            </div>
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} Dramatis-HQ. All rights
              reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

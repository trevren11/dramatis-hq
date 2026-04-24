import Link from "next/link";
import {
  Sparkles,
  Users,
  Calendar,
  FileText,
  QrCode,
  Shield,
  Star,
  Search,
  ClipboardList,
  Video,
  ArrowRight,
  Zap,
  Heart,
  Award,
} from "lucide-react";
import { Footer } from "@/components/layout/footer";
import { FeatureCard, ValuePropCard, PricingCard, StatCard } from "@/components/landing/cards";

export default function Home(): React.ReactElement {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-border bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 border-b backdrop-blur">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <Sparkles className="text-primary h-8 w-8" />
            <span className="font-heading text-2xl font-bold">
              <span className="text-primary">Dramatis</span>
              <span className="text-secondary">HQ</span>
            </span>
          </Link>
          <div className="hidden items-center gap-8 md:flex">
            <Link
              href="#features"
              className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
            >
              Features
            </Link>
            <Link
              href="#pricing"
              className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
            >
              Pricing
            </Link>
            <Link
              href="#talent"
              className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
            >
              For Talent
            </Link>
            <Link
              href="#producers"
              className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
            >
              For Producers
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-4 py-2 text-sm font-medium shadow-sm transition-all hover:shadow-md"
            >
              Get Started
            </Link>
          </div>
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-20 lg:py-32">
          <div className="from-primary/5 via-accent/5 to-secondary/5 absolute inset-0 bg-gradient-to-br" />
          <div className="bg-primary/10 absolute top-20 left-10 h-72 w-72 rounded-full blur-3xl" />
          <div className="bg-secondary/10 absolute right-10 bottom-20 h-72 w-72 rounded-full blur-3xl" />
          <div className="relative mx-auto max-w-7xl px-4">
            <div className="mx-auto max-w-4xl text-center">
              <div className="bg-primary/10 text-primary mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium">
                <Zap className="h-4 w-4" />
                The future of theatrical production management
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-balance sm:text-5xl lg:text-7xl">
                Where <span className="gradient-text">Talent</span> Meets{" "}
                <span className="gradient-text">Opportunity</span>
              </h1>
              <p className="text-muted-foreground mx-auto mt-6 max-w-2xl text-lg sm:text-xl">
                The complete platform for theatrical production management. Connect with producers,
                manage auditions, and bring performances to life — all in one place.
              </p>
              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  href="/signup/talent"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 flex w-full items-center justify-center gap-2 rounded-lg px-8 py-4 font-medium shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl sm:w-auto"
                >
                  <Star className="h-5 w-5" />
                  Join as Talent
                </Link>
                <Link
                  href="/signup/producer"
                  className="border-primary text-primary hover:bg-primary/5 flex w-full items-center justify-center gap-2 rounded-lg border-2 px-8 py-4 font-medium transition-all hover:-translate-y-0.5 sm:w-auto"
                >
                  <ClipboardList className="h-5 w-5" />
                  Join as Producer
                </Link>
              </div>
            </div>

            {/* Stats */}
            <div className="mt-20 grid grid-cols-2 gap-8 md:grid-cols-4">
              <StatCard value="10K+" label="Active Talent" />
              <StatCard value="500+" label="Productions" />
              <StatCard value="50K+" label="Auditions Managed" />
              <StatCard value="98%" label="Satisfaction Rate" />
            </div>
          </div>
        </section>

        {/* For Talent Section */}
        <section id="talent" className="border-border border-y py-20">
          <div className="mx-auto max-w-7xl px-4">
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <div>
                <div className="bg-accent/10 text-accent mb-4 inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium">
                  <Star className="h-4 w-4" />
                  For Talent
                </div>
                <h2 className="text-3xl font-bold lg:text-4xl">
                  Your Career, <span className="gradient-text">Amplified</span>
                </h2>
                <p className="text-muted-foreground mt-4 text-lg">
                  Stand out from the crowd with a professional profile that showcases your unique
                  talents. Get discovered by the right producers for the right roles.
                </p>
                <div className="mt-8 space-y-6">
                  <ValuePropCard
                    icon={Users}
                    title="Professional Portfolio"
                    description="Showcase headshots, demo reels, and your complete work history in one beautiful profile."
                  />
                  <ValuePropCard
                    icon={Calendar}
                    title="Smart Scheduling"
                    description="Manage your availability and let producers know when you're open for auditions."
                  />
                  <ValuePropCard
                    icon={QrCode}
                    title="Instant Check-In"
                    description="Skip the sign-in sheet. Scan your QR code at auditions for seamless profile access."
                  />
                  <ValuePropCard
                    icon={FileText}
                    title="One-Click Resumes"
                    description="Generate industry-standard PDF resumes instantly from your profile data."
                  />
                </div>
                <Link
                  href="/signup/talent"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 mt-8 inline-flex items-center gap-2 rounded-lg px-6 py-3 font-medium shadow-lg transition-all hover:shadow-xl"
                >
                  Create Your Profile
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="relative">
                <div className="from-primary/20 to-accent/20 aspect-square rounded-2xl bg-gradient-to-br p-8">
                  <div className="bg-card h-full w-full rounded-xl shadow-2xl">
                    <div className="flex h-full flex-col items-center justify-center p-8 text-center">
                      <div className="bg-primary/10 mb-4 flex h-20 w-20 items-center justify-center rounded-full">
                        <Star className="text-primary h-10 w-10" />
                      </div>
                      <h3 className="text-xl font-bold">Talent Dashboard</h3>
                      <p className="text-muted-foreground mt-2 text-sm">
                        Your career at a glance — upcoming auditions, profile views, and more.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* For Producers Section */}
        <section id="producers" className="bg-muted/30 py-20">
          <div className="mx-auto max-w-7xl px-4">
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <div className="order-2 lg:order-1">
                <div className="relative">
                  <div className="from-secondary/20 to-primary/20 aspect-square rounded-2xl bg-gradient-to-br p-8">
                    <div className="bg-card h-full w-full rounded-xl shadow-2xl">
                      <div className="flex h-full flex-col items-center justify-center p-8 text-center">
                        <div className="bg-secondary/10 mb-4 flex h-20 w-20 items-center justify-center rounded-full">
                          <ClipboardList className="text-secondary h-10 w-10" />
                        </div>
                        <h3 className="text-xl font-bold">Casting Board</h3>
                        <p className="text-muted-foreground mt-2 text-sm">
                          Drag-and-drop casting with real-time collaboration for your team.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="order-1 lg:order-2">
                <div className="bg-secondary/10 text-secondary mb-4 inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium">
                  <ClipboardList className="h-4 w-4" />
                  For Producers
                </div>
                <h2 className="text-3xl font-bold lg:text-4xl">
                  Casting Made <span className="gradient-text">Simple</span>
                </h2>
                <p className="text-muted-foreground mt-4 text-lg">
                  Streamline your entire production workflow. From talent discovery to final
                  callbacks, manage everything in one powerful platform.
                </p>
                <div className="mt-8 space-y-6">
                  <ValuePropCard
                    icon={Search}
                    title="Smart Talent Search"
                    description="Filter by skills, attributes, availability, and location to find your perfect cast."
                  />
                  <ValuePropCard
                    icon={Video}
                    title="Video Submissions"
                    description="Accept self-tape auditions and review them alongside in-person callbacks."
                  />
                  <ValuePropCard
                    icon={Sparkles}
                    title="Collaborative Casting"
                    description="Invite your creative team to review, comment, and vote on talent together."
                  />
                  <ValuePropCard
                    icon={Shield}
                    title="Secure Documents"
                    description="Share contracts, sides, and call sheets with SOC 2 compliant security."
                  />
                </div>
                <Link
                  href="/signup/producer"
                  className="bg-secondary text-secondary-foreground hover:bg-secondary/90 mt-8 inline-flex items-center gap-2 rounded-lg px-6 py-3 font-medium shadow-lg transition-all hover:shadow-xl"
                >
                  Start Your Project
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20">
          <div className="mx-auto max-w-7xl px-4">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold lg:text-4xl">
                Everything You Need to <span className="gradient-text">Shine</span>
              </h2>
              <p className="text-muted-foreground mt-4 text-lg">
                Powerful tools designed for the theatrical industry, built by people who understand
                the stage.
              </p>
            </div>
            <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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

        {/* Pricing Section */}
        <section id="pricing" className="border-border bg-muted/30 border-y py-20">
          <div className="mx-auto max-w-7xl px-4">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold lg:text-4xl">
                Simple, <span className="gradient-text">Transparent</span> Pricing
              </h2>
              <p className="text-muted-foreground mt-4 text-lg">
                Choose the plan that fits your needs. Upgrade or downgrade anytime.
              </p>
            </div>
            <div className="mt-16 grid gap-8 lg:grid-cols-3">
              <PricingCard
                title="Free"
                price="$0"
                period="forever"
                description="Perfect for getting started"
                features={[
                  "Basic talent profile",
                  "Apply to 5 auditions/month",
                  "Standard resume export",
                  "Email support",
                ]}
                cta="Get Started"
                href="/signup/talent"
              />
              <PricingCard
                title="Pro"
                price="$19"
                period="month"
                description="For serious performers"
                features={[
                  "Unlimited audition applications",
                  "Video portfolio hosting",
                  "Priority search placement",
                  "Advanced analytics",
                  "Calendar integrations",
                  "Priority support",
                ]}
                cta="Start Free Trial"
                href="/signup/talent?plan=pro"
                featured
              />
              <PricingCard
                title="Producer"
                price="$99"
                period="month"
                description="For production companies"
                features={[
                  "Unlimited talent search",
                  "Collaborative casting board",
                  "Video audition management",
                  "Team seats (up to 5)",
                  "Contract management",
                  "Dedicated support",
                ]}
                cta="Contact Sales"
                href="/signup/producer"
              />
            </div>
          </div>
        </section>

        {/* Testimonial Section */}
        <section className="py-20">
          <div className="mx-auto max-w-7xl px-4">
            <div className="mx-auto max-w-3xl text-center">
              <Award className="text-primary mx-auto mb-6 h-12 w-12" />
              <blockquote className="text-2xl font-medium italic lg:text-3xl">
                &ldquo;Dramatis-HQ transformed how we run auditions. What used to take weeks now
                takes days. Our talent loves the seamless experience.&rdquo;
              </blockquote>
              <div className="mt-8">
                <p className="font-semibold">Sarah Mitchell</p>
                <p className="text-muted-foreground text-sm">
                  Casting Director, Broadway Theatre Company
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20">
          <div className="mx-auto max-w-7xl px-4">
            <div className="from-primary to-accent relative overflow-hidden rounded-3xl bg-gradient-to-r p-12 text-center lg:p-20">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent)]" />
              <div className="relative">
                <Heart className="mx-auto mb-6 h-12 w-12 text-white/90" />
                <h2 className="text-3xl font-bold text-white lg:text-4xl">
                  Ready to Take Center Stage?
                </h2>
                <p className="mx-auto mt-4 max-w-xl text-lg text-white/80">
                  Join thousands of performers and producers already using Dramatis-HQ to streamline
                  their productions.
                </p>
                <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                  <Link
                    href="/signup"
                    className="text-primary flex w-full items-center justify-center gap-2 rounded-lg bg-white px-8 py-4 font-medium shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl sm:w-auto"
                  >
                    Create Your Free Account
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/login"
                    className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-white/30 px-8 py-4 font-medium text-white transition-all hover:border-white/50 hover:bg-white/10 sm:w-auto"
                  >
                    Sign In
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

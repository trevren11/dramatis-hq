import Link from "next/link";
import { CheckCircle, ArrowRight } from "lucide-react";

export function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}): React.ReactElement {
  return (
    <div className="group border-border bg-card rounded-xl border p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
      <div className="bg-primary/10 group-hover:bg-primary/20 mb-4 flex h-12 w-12 items-center justify-center rounded-lg transition-colors">
        <Icon className="text-primary h-6 w-6" />
      </div>
      <h3 className="mb-2 text-xl font-semibold">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}

export function ValuePropCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}): React.ReactElement {
  return (
    <div className="flex gap-4">
      <div className="bg-primary/10 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
        <Icon className="text-primary h-5 w-5" />
      </div>
      <div>
        <h4 className="mb-1 font-semibold">{title}</h4>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>
    </div>
  );
}

export function PricingCard({
  title,
  price,
  period,
  description,
  features,
  cta,
  href,
  featured = false,
}: {
  title: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  cta: string;
  href: string;
  featured?: boolean;
}): React.ReactElement {
  return (
    <div
      className={`relative rounded-2xl border p-8 ${
        featured
          ? "border-primary bg-primary/5 ring-primary/20 shadow-xl ring-2"
          : "border-border bg-card shadow-sm"
      }`}
    >
      {featured && (
        <div className="bg-primary text-primary-foreground absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-xs font-semibold">
          Most Popular
        </div>
      )}
      <div className="mb-6">
        <h3 className="mb-2 text-xl font-bold">{title}</h3>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>
      <div className="mb-6">
        <span className="text-4xl font-bold">{price}</span>
        <span className="text-muted-foreground">/{period}</span>
      </div>
      <ul className="mb-8 space-y-3">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-2">
            <CheckCircle className="text-primary mt-0.5 h-4 w-4 shrink-0" />
            <span className="text-sm">{feature}</span>
          </li>
        ))}
      </ul>
      <Link
        href={href}
        className={`flex w-full items-center justify-center gap-2 rounded-lg px-6 py-3 font-medium transition-all ${
          featured
            ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-xl"
            : "border-primary text-primary hover:bg-primary/5 border"
        }`}
      >
        {cta}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

export function StatCard({ value, label }: { value: string; label: string }): React.ReactElement {
  return (
    <div className="text-center">
      <div className="gradient-text text-4xl font-bold lg:text-5xl">{value}</div>
      <div className="text-muted-foreground mt-1 text-sm">{label}</div>
    </div>
  );
}

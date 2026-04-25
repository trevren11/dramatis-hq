import Link from "next/link";
import { ArrowLeft, Settings } from "lucide-react";
import { SettingsNav, SettingsMobileNav } from "@/components/settings/settings-nav";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div className="min-h-screen">
      <div className="mb-6">
        <Link
          href="/"
          className="text-muted-foreground mb-4 inline-flex items-center text-sm hover:underline"
        >
          <ArrowLeft className="mr-1 h-4 w-4" aria-hidden="true" />
          Back to Dashboard
        </Link>
        <div className="flex items-center gap-3">
          <Settings className="text-primary h-8 w-8" aria-hidden="true" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
            <p className="text-muted-foreground">Manage your account and preferences</p>
          </div>
        </div>
      </div>

      <SettingsMobileNav />

      <div className="flex flex-col gap-8 md:flex-row">
        <aside className="hidden w-64 shrink-0 md:block">
          <div className="sticky top-24">
            <SettingsNav />
          </div>
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}

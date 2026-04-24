"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ShowDashboard } from "./ShowDashboard";
import { ShowSettings } from "./ShowSettings";
import { RoleList } from "./RoleList";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { Show } from "@/lib/db/schema/shows";
import type { Role } from "@/lib/db/schema/roles";

interface ShowDetailClientProps {
  show: Show;
  roles: Role[];
  initialTab: string;
}

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "roles", label: "Roles" },
  { id: "settings", label: "Settings" },
];

export function ShowDetailClient({
  show,
  roles: initialRoles,
  initialTab,
}: ShowDetailClientProps): React.ReactElement {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [roles, setRoles] = useState<Role[]>(initialRoles);

  const handleTabChange = (tab: string): void => {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const handleRolesChange = (updatedRoles: Role[]): void => {
    setRoles(updatedRoles);
  };

  const renderTab = (): React.ReactElement => {
    switch (activeTab) {
      case "overview":
        return <ShowDashboard show={show} roles={roles} />;
      case "roles":
        return <RoleList showId={show.id} initialRoles={roles} onRolesChange={handleRolesChange} />;
      case "settings":
        return <ShowSettings show={show} />;
      default:
        return <ShowDashboard show={show} roles={roles} />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/producer/shows"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Productions
      </Link>

      {/* Tab navigation */}
      <div className="border-b">
        <nav className="-mb-px flex gap-6">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`border-b-2 pb-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
              {tab.id === "roles" && ` (${roles.length})`}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      {renderTab()}
    </div>
  );
}

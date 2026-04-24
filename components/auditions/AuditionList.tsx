"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuditionCard } from "./AuditionCard";
import { Plus, Search } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import type { Audition } from "@/lib/db/schema/auditions";
import { AUDITION_STATUS_OPTIONS } from "@/lib/db/schema/auditions";

interface AuditionWithCount extends Audition {
  applicationCount?: number;
}

interface AuditionListProps {
  initialAuditions: AuditionWithCount[];
}

const STATUS_TABS = [{ value: "all", label: "All" }, ...AUDITION_STATUS_OPTIONS];

export function AuditionList({ initialAuditions }: AuditionListProps): React.ReactElement {
  const router = useRouter();
  const { toast } = useToast();
  const [auditions, setAuditions] = useState<AuditionWithCount[]>(initialAuditions);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const fetchAuditions = useCallback(
    async (status: string, search: string): Promise<void> => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (status !== "all") params.set("status", status);
        if (search) params.set("search", search);

        const response = await fetch(`/api/auditions?${params.toString()}`);
        if (!response.ok) throw new Error("Failed to fetch auditions");

        const data = (await response.json()) as { auditions: AuditionWithCount[] };
        setAuditions(data.auditions);
      } catch {
        toast({
          title: "Error",
          description: "Failed to fetch auditions",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [toast]
  );

  const handleStatusChange = useCallback(
    (status: string): void => {
      setStatusFilter(status);
      void fetchAuditions(status, searchQuery);
    },
    [fetchAuditions, searchQuery]
  );

  const handleSearch = useCallback(
    (e: React.SyntheticEvent): void => {
      e.preventDefault();
      void fetchAuditions(statusFilter, searchQuery);
    },
    [fetchAuditions, statusFilter, searchQuery]
  );

  const handleDelete = useCallback(
    (id: string): void => {
      if (
        !confirm("Are you sure you want to delete this audition? This action cannot be undone.")
      ) {
        return;
      }

      void (async (): Promise<void> => {
        try {
          const response = await fetch(`/api/auditions/${id}`, { method: "DELETE" });
          if (!response.ok) throw new Error("Failed to delete audition");

          toast({
            title: "Audition deleted",
            description: "The audition has been deleted",
          });
          setAuditions((prev) => prev.filter((a) => a.id !== id));
        } catch {
          toast({
            title: "Error",
            description: "Failed to delete audition",
            variant: "destructive",
          });
        }
      })();
    },
    [toast]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Auditions</h1>
          <p className="text-muted-foreground">Manage your audition announcements</p>
        </div>
        <Button
          onClick={() => {
            router.push("/producer/auditions/create");
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          New Audition
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        {/* Status tabs */}
        <div className="flex flex-wrap gap-2">
          {STATUS_TABS.map((tab) => (
            <Button
              key={tab.value}
              variant={statusFilter === tab.value ? "default" : "outline"}
              size="sm"
              onClick={() => {
                handleStatusChange(tab.value);
              }}
            >
              {tab.label}
            </Button>
          ))}
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-2 sm:ml-auto">
          <div className="relative">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              placeholder="Search auditions..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
              }}
              className="w-full pl-9 sm:w-64"
            />
          </div>
          <Button type="submit" variant="secondary" size="default">
            Search
          </Button>
        </form>
      </div>

      {/* Audition list */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-muted h-40 animate-pulse rounded-xl" />
          ))}
        </div>
      ) : auditions.length === 0 ? (
        <div className="border-border rounded-xl border border-dashed p-12 text-center">
          <h3 className="text-lg font-semibold">No auditions yet</h3>
          <p className="text-muted-foreground mt-1">
            Create your first audition to start receiving applications
          </p>
          <Button
            onClick={() => {
              router.push("/producer/auditions/create");
            }}
            className="mt-4"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Audition
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {auditions.map((audition) => (
            <AuditionCard key={audition.id} audition={audition} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}

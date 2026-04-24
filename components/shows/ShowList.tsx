"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShowCard } from "./ShowCard";
import { Plus, Search } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import type { Show } from "@/lib/db/schema/shows";
import { SHOW_STATUS_OPTIONS } from "@/lib/db/schema/shows";

interface ShowWithRoleCount extends Show {
  roleCount?: number;
}

interface ShowListProps {
  initialShows: ShowWithRoleCount[];
}

const STATUS_TABS = [{ value: "all", label: "All" }, ...SHOW_STATUS_OPTIONS];

export function ShowList({ initialShows }: ShowListProps): React.ReactElement {
  const router = useRouter();
  const { toast } = useToast();
  const [shows, setShows] = useState<ShowWithRoleCount[]>(initialShows);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const fetchShows = useCallback(
    async (status: string, search: string) => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (status !== "all") params.set("status", status);
        if (search) params.set("search", search);

        const response = await fetch(`/api/shows?${params.toString()}`);
        if (!response.ok) throw new Error("Failed to fetch shows");

        const data = (await response.json()) as { shows: ShowWithRoleCount[] };
        setShows(data.shows);
      } catch {
        toast({
          title: "Error",
          description: "Failed to fetch shows",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [toast]
  );

  const handleStatusChange = (status: string) => {
    setStatusFilter(status);
    fetchShows(status, searchQuery);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchShows(statusFilter, searchQuery);
  };

  const handleDuplicate = async (id: string) => {
    try {
      const response = await fetch(`/api/shows/${id}/duplicate`, { method: "POST" });
      if (!response.ok) throw new Error("Failed to duplicate show");

      const data = (await response.json()) as { show: Show };
      toast({
        title: "Show duplicated",
        description: `Created "${data.show.title}"`,
      });
      fetchShows(statusFilter, searchQuery);
    } catch {
      toast({
        title: "Error",
        description: "Failed to duplicate show",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this show? This action cannot be undone.")) {
      return;
    }

    try {
      const response = await fetch(`/api/shows/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete show");

      toast({
        title: "Show deleted",
        description: "The show has been deleted",
      });
      setShows((prev) => prev.filter((s) => s.id !== id));
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete show",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Productions</h1>
          <p className="text-muted-foreground">Manage your shows and productions</p>
        </div>
        <Button onClick={() => router.push("/producer/shows/new")}>
          <Plus className="mr-2 h-4 w-4" />
          New Production
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
              onClick={() => handleStatusChange(tab.value)}
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
              placeholder="Search shows..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 sm:w-64"
            />
          </div>
          <Button type="submit" variant="secondary" size="default">
            Search
          </Button>
        </form>
      </div>

      {/* Show list */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-muted h-40 animate-pulse rounded-xl" />
          ))}
        </div>
      ) : shows.length === 0 ? (
        <div className="border-border rounded-xl border border-dashed p-12 text-center">
          <h3 className="text-lg font-semibold">No productions yet</h3>
          <p className="text-muted-foreground mt-1">
            Create your first production to get started
          </p>
          <Button onClick={() => router.push("/producer/shows/new")} className="mt-4">
            <Plus className="mr-2 h-4 w-4" />
            New Production
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {shows.map((show) => (
            <ShowCard
              key={show.id}
              show={show}
              roleCount={show.roleCount ?? 0}
              onDuplicate={handleDuplicate}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

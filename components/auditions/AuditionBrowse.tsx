"use client";

import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { AuditionPublicCard } from "./AuditionPublicCard";
import { Search, Filter, X } from "lucide-react";
import type { Audition } from "@/lib/db/schema/auditions";

interface AuditionWithRelations {
  audition: Audition;
  show: {
    id: string;
    title: string;
    type?: string | null;
    venue?: string | null;
  };
  organization: {
    id: string;
    companyName: string;
    slug: string;
    logoUrl?: string | null;
    location?: string | null;
  };
}

interface AuditionBrowseProps {
  initialAuditions: AuditionWithRelations[];
  initialPagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function AuditionBrowse({
  initialAuditions,
  initialPagination,
}: AuditionBrowseProps): React.ReactElement {
  const [auditions, setAuditions] = useState<AuditionWithRelations[]>(initialAuditions);
  const [pagination, setPagination] = useState(initialPagination);
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Filter state
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("");
  const [isVirtual, setIsVirtual] = useState<boolean | undefined>(undefined);

  const fetchAuditions = useCallback(
    async (page = 1): Promise<void> => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("page", page.toString());
        if (search) params.set("search", search);
        if (location) params.set("location", location);
        if (isVirtual !== undefined) params.set("isVirtual", isVirtual.toString());

        const response = await fetch(`/api/auditions/browse?${params.toString()}`);
        if (!response.ok) throw new Error("Failed to fetch auditions");

        const data = (await response.json()) as {
          auditions: AuditionWithRelations[];
          pagination: typeof pagination;
        };

        setAuditions(data.auditions);
        setPagination(data.pagination);
      } catch (error) {
        console.error("Error fetching auditions:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [search, location, isVirtual]
  );

  const handleSearch = useCallback(
    (e: React.SyntheticEvent): void => {
      e.preventDefault();
      void fetchAuditions(1);
    },
    [fetchAuditions]
  );

  const clearFilters = useCallback((): void => {
    setSearch("");
    setLocation("");
    setIsVirtual(undefined);
  }, []);

  useEffect(() => {
    // Fetch when filters change (except search, which uses form submit)
    if (location || isVirtual !== undefined) {
      void fetchAuditions(1);
    }
  }, [location, isVirtual, fetchAuditions]);

  const hasActiveFilters = search || location || isVirtual !== undefined;

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="space-y-4">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              placeholder="Search auditions..."
              value={search}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setSearch(e.target.value);
              }}
              className="pl-9"
            />
          </div>
          <Button type="submit">Search</Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setShowFilters(!showFilters);
            }}
          >
            <Filter className="mr-2 h-4 w-4" />
            Filters
            {hasActiveFilters && (
              <span className="bg-primary text-primary-foreground ml-2 flex h-5 w-5 items-center justify-center rounded-full text-xs">
                !
              </span>
            )}
          </Button>
        </form>

        {showFilters && (
          <div className="border-border space-y-4 rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Filters</h3>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="mr-1 h-4 w-4" />
                  Clear all
                </Button>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <Label>Location</Label>
                <Input
                  placeholder="City, State, or ZIP"
                  value={location}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setLocation(e.target.value);
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label>Virtual Only</Label>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={isVirtual === true}
                    onCheckedChange={(checked: boolean) => {
                      setIsVirtual(checked ? true : undefined);
                    }}
                  />
                  <span className="text-muted-foreground text-sm">Show only virtual auditions</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-muted h-48 animate-pulse rounded-xl" />
          ))}
        </div>
      ) : auditions.length === 0 ? (
        <div className="border-border rounded-xl border border-dashed p-12 text-center">
          <h3 className="text-lg font-semibold">No auditions found</h3>
          <p className="text-muted-foreground mt-1">
            {hasActiveFilters
              ? "Try adjusting your filters"
              : "Check back later for new audition announcements"}
          </p>
          {hasActiveFilters && (
            <Button variant="outline" onClick={clearFilters} className="mt-4">
              Clear filters
            </Button>
          )}
        </div>
      ) : (
        <>
          <p className="text-muted-foreground text-sm">
            Showing {auditions.length} of {pagination.total} auditions
          </p>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {auditions.map(({ audition, show, organization }) => (
              <AuditionPublicCard
                key={audition.id}
                audition={audition}
                show={show}
                organization={organization}
              />
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <Button
                variant="outline"
                disabled={pagination.page === 1}
                onClick={() => {
                  void fetchAuditions(pagination.page - 1);
                }}
              >
                Previous
              </Button>
              <span className="text-muted-foreground flex items-center px-4 text-sm">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                disabled={pagination.page === pagination.totalPages}
                onClick={() => {
                  void fetchAuditions(pagination.page + 1);
                }}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

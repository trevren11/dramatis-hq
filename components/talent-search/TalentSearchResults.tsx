"use client";

import { useState } from "react";
import { TalentCard, type TalentCardData } from "./TalentCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  RadixSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LayoutGrid, List, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface TalentSearchResultsProps {
  results: TalentCardData[];
  pagination: Pagination;
  isLoading?: boolean;
  onPageChange: (page: number) => void;
  onPreview?: (talent: TalentCardData) => void;
  onMessage?: (talent: TalentCardData) => void;
  onAddToList?: (talent: TalentCardData) => void;
  onSave?: (talent: TalentCardData) => void;
  sortOrder?: string;
  onSortChange?: (sort: string) => void;
}

export function TalentSearchResults({
  results,
  pagination,
  isLoading = false,
  onPageChange,
  onPreview,
  onMessage,
  onAddToList,
  onSave,
  sortOrder = "relevance",
  onSortChange,
}: TalentSearchResultsProps): React.ReactElement {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-32" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-9 w-20" />
          </div>
        </div>
        <div
          className={cn(
            "gap-4",
            viewMode === "grid" ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4" : "space-y-3"
          )}
        >
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className={viewMode === "grid" ? "" : ""}>
              {viewMode === "grid" ? (
                <div className="space-y-2">
                  <Skeleton className="aspect-[3/4] w-full rounded-lg" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ) : (
                <Skeleton className="h-24 w-full rounded-lg" />
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted-foreground text-sm">
          {pagination.total === 0
            ? "No talent found"
            : `Showing ${String((pagination.page - 1) * pagination.limit + 1)}-${String(
                Math.min(pagination.page * pagination.limit, pagination.total)
              )} of ${String(pagination.total)} talent`}
        </p>

        <div className="flex items-center gap-2">
          {/* Sort */}
          <RadixSelect value={sortOrder} onValueChange={onSortChange}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Sort by..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="relevance">Relevance</SelectItem>
              <SelectItem value="name_asc">Name (A-Z)</SelectItem>
              <SelectItem value="name_desc">Name (Z-A)</SelectItem>
              <SelectItem value="recent_activity">Recent Activity</SelectItem>
            </SelectContent>
          </RadixSelect>

          {/* View toggle */}
          <div className="flex rounded-lg border">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="sm"
              className="rounded-r-none"
              onClick={() => {
                setViewMode("grid");
              }}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="sm"
              className="rounded-l-none"
              onClick={() => {
                setViewMode("list");
              }}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Results */}
      {results.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-muted-foreground">No talent matching your criteria.</p>
          <p className="text-muted-foreground mt-1 text-sm">
            Try adjusting your filters to see more results.
          </p>
        </div>
      ) : (
        <div
          className={cn(
            "gap-4",
            viewMode === "grid" ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4" : "space-y-3"
          )}
        >
          {results.map((talent) => (
            <TalentCard
              key={talent.id}
              talent={talent}
              viewMode={viewMode}
              onPreview={onPreview}
              onMessage={onMessage}
              onAddToList={onAddToList}
              onSave={onSave}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              onPageChange(pagination.page - 1);
            }}
            disabled={pagination.page <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              let pageNum: number;
              if (pagination.totalPages <= 5) {
                pageNum = i + 1;
              } else if (pagination.page <= 3) {
                pageNum = i + 1;
              } else if (pagination.page >= pagination.totalPages - 2) {
                pageNum = pagination.totalPages - 4 + i;
              } else {
                pageNum = pagination.page - 2 + i;
              }
              return (
                <Button
                  key={pageNum}
                  variant={pagination.page === pageNum ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    onPageChange(pageNum);
                  }}
                  className="w-9"
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              onPageChange(pagination.page + 1);
            }}
            disabled={pagination.page >= pagination.totalPages}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

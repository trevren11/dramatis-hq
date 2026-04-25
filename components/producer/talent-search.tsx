"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TalentSearchInput } from "@/lib/validations/physical-attributes";
import type { TalentSearchResult } from "@/lib/validations/talent-search";
import { TalentSearchFilters } from "./talent-search-filters";

interface TalentSearchProps {
  onSearch: (filters: TalentSearchInput) => Promise<void>;
  results: TalentSearchResult[];
  isLoading?: boolean;
}

function formatLabel(value: string): string {
  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatHeight(inches: number): string {
  const feet = Math.floor(inches / 12);
  const remainingInches = inches % 12;
  return `${String(feet)}'${String(remainingInches)}"`;
}

export function TalentSearch({
  onSearch,
  results,
  isLoading = false,
}: TalentSearchProps): React.ReactElement {
  const [filters, setFilters] = React.useState<TalentSearchInput>({
    page: 1,
    limit: 20,
    sortBy: "relevance",
  });

  const handleSearch = (e: React.SyntheticEvent): void => {
    e.preventDefault();
    void onSearch(filters);
  };

  const clearFilters = (): void => {
    setFilters({ page: 1, limit: 20, sortBy: "relevance" });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Search Talent</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-6">
            <TalentSearchFilters filters={filters} setFilters={setFilters} />
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={clearFilters}>
                Clear All
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Searching..." : "Search"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <div className="space-y-4">
          <p className="text-muted-foreground text-sm">
            Found {results.length} matching profile{results.length !== 1 ? "s" : ""}
          </p>
          {results.map((result) => (
            <Card key={result.profile.id}>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="bg-muted h-16 w-16 rounded-full" />
                <div className="flex-1">
                  <h3 className="font-semibold">
                    {result.profile.firstName} {result.profile.lastName}
                    {result.profile.stageName && (
                      <span className="text-muted-foreground font-normal">
                        {" "}
                        ({result.profile.stageName})
                      </span>
                    )}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {result.profile.heightInches != null &&
                      formatHeight(result.profile.heightInches)}
                    {result.profile.hairColor != null &&
                      ` • ${formatLabel(result.profile.hairColor)} hair`}
                    {result.profile.eyeColor != null &&
                      ` • ${formatLabel(result.profile.eyeColor)} eyes`}
                  </p>
                  {result.profile.vocalRange != null &&
                    result.profile.vocalRange !== "not_applicable" && (
                      <p className="text-muted-foreground text-sm">
                        {formatLabel(result.profile.vocalRange)}
                      </p>
                    )}
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-green-600">
                    {result.matchPercentage}%
                  </span>
                  <p className="text-muted-foreground text-sm">match</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

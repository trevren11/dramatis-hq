"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import type { TalentSearchResult } from "@/lib/validations/talent-search";

interface TalentSearchResultCardProps {
  result: TalentSearchResult;
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

export function TalentSearchResultCard({
  result,
}: TalentSearchResultCardProps): React.ReactElement {
  return (
    <Card>
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
            {result.profile.heightInches != null && formatHeight(result.profile.heightInches)}
            {result.profile.hairColor != null && ` • ${formatLabel(result.profile.hairColor)} hair`}
            {result.profile.eyeColor != null && ` • ${formatLabel(result.profile.eyeColor)} eyes`}
          </p>
          {result.profile.vocalRange != null && result.profile.vocalRange !== "not_applicable" && (
            <p className="text-muted-foreground text-sm">
              {formatLabel(result.profile.vocalRange)}
            </p>
          )}
        </div>
        <div className="text-right">
          <span className="text-2xl font-bold text-green-600">{result.matchPercentage}%</span>
          <p className="text-muted-foreground text-sm">match</p>
        </div>
      </CardContent>
    </Card>
  );
}

interface TalentSearchResultsProps {
  results: TalentSearchResult[];
}

export function TalentSearchResults({ results }: TalentSearchResultsProps): React.ReactElement {
  if (results.length === 0) {
    return <></>;
  }

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm">
        Found {results.length} matching profile{results.length !== 1 ? "s" : ""}
      </p>
      {results.map((result) => (
        <TalentSearchResultCard key={result.profile.id} result={result} />
      ))}
    </div>
  );
}

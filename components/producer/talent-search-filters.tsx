"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { TalentSearchInput } from "@/lib/validations/physical-attributes";
import {
  HAIR_COLORS,
  EYE_COLORS,
  ETHNICITIES,
  VOCAL_RANGES,
} from "@/lib/db/schema/talent-profiles";

interface TalentSearchFiltersProps {
  filters: TalentSearchInput;
  setFilters: React.Dispatch<React.SetStateAction<TalentSearchInput>>;
}

function formatLabel(value: string): string {
  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function TalentSearchFilters({
  filters,
  setFilters,
}: TalentSearchFiltersProps): React.ReactElement {
  const toggleArrayFilter = (
    field: "hairColors" | "eyeColors" | "ethnicities" | "vocalRanges",
    value: string
  ): void => {
    setFilters((prev) => {
      const current = (prev[field] ?? []) as string[];
      const updated = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      return { ...prev, [field]: updated.length > 0 ? updated : undefined };
    });
  };

  return (
    <>
      <div className="space-y-2">
        <Label>Height Range</Label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={36}
            max={96}
            placeholder="Min (in)"
            value={filters.heightMin ?? ""}
            onChange={(e): void => {
              setFilters((prev) => ({
                ...prev,
                heightMin: e.target.value ? parseInt(e.target.value) : undefined,
              }));
            }}
            className="w-28"
          />
          <span>to</span>
          <Input
            type="number"
            min={36}
            max={96}
            placeholder="Max (in)"
            value={filters.heightMax ?? ""}
            onChange={(e): void => {
              setFilters((prev) => ({
                ...prev,
                heightMax: e.target.value ? parseInt(e.target.value) : undefined,
              }));
            }}
            className="w-28"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Age Range</Label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={0}
            max={100}
            placeholder="Min"
            value={filters.ageMin ?? ""}
            onChange={(e): void => {
              setFilters((prev) => ({
                ...prev,
                ageMin: e.target.value ? parseInt(e.target.value) : undefined,
              }));
            }}
            className="w-24"
          />
          <span>to</span>
          <Input
            type="number"
            min={0}
            max={100}
            placeholder="Max"
            value={filters.ageMax ?? ""}
            onChange={(e): void => {
              setFilters((prev) => ({
                ...prev,
                ageMax: e.target.value ? parseInt(e.target.value) : undefined,
              }));
            }}
            className="w-24"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Hair Color</Label>
          <div className="flex flex-wrap gap-2">
            {HAIR_COLORS.map((color) => (
              <label key={color} className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={filters.hairColors?.includes(color) ?? false}
                  onChange={(): void => {
                    toggleArrayFilter("hairColors", color);
                  }}
                  className="h-4 w-4 rounded border"
                />
                <span className="text-sm">{formatLabel(color)}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Eye Color</Label>
          <div className="flex flex-wrap gap-2">
            {EYE_COLORS.map((color) => (
              <label key={color} className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={filters.eyeColors?.includes(color) ?? false}
                  onChange={(): void => {
                    toggleArrayFilter("eyeColors", color);
                  }}
                  className="h-4 w-4 rounded border"
                />
                <span className="text-sm">{formatLabel(color)}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Ethnicity</Label>
        <div className="flex flex-wrap gap-2">
          {ETHNICITIES.filter((e) => e !== "prefer_not_to_say").map((ethnicity) => (
            <label key={ethnicity} className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={filters.ethnicities?.includes(ethnicity) ?? false}
                onChange={(): void => {
                  toggleArrayFilter("ethnicities", ethnicity);
                }}
                className="h-4 w-4 rounded border"
              />
              <span className="text-sm">{formatLabel(ethnicity)}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Vocal Range</Label>
        <div className="flex flex-wrap gap-2">
          {VOCAL_RANGES.filter((r) => r !== "not_applicable").map((range) => (
            <label key={range} className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={filters.vocalRanges?.includes(range) ?? false}
                onChange={(): void => {
                  toggleArrayFilter("vocalRanges", range);
                }}
                className="h-4 w-4 rounded border"
              />
              <span className="text-sm">{formatLabel(range)}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Other Requirements</Label>
        <div className="flex flex-wrap gap-4">
          <Checkbox
            checked={filters.mustBe18Plus ?? false}
            onChange={(e): void => {
              setFilters((prev) => ({
                ...prev,
                mustBe18Plus: e.target.checked ? true : undefined,
              }));
            }}
            label="Must be 18+"
          />
          <Checkbox
            checked={filters.willingToCutHair ?? false}
            onChange={(e): void => {
              setFilters((prev) => ({
                ...prev,
                willingToCutHair: e.target.checked ? true : undefined,
              }));
            }}
            label="Willing to cut hair"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">Location</Label>
        <Input
          id="location"
          placeholder="Enter city or region"
          value={filters.location ?? ""}
          onChange={(e): void => {
            setFilters((prev) => ({
              ...prev,
              location: e.target.value ? e.target.value : undefined,
            }));
          }}
        />
      </div>
    </>
  );
}

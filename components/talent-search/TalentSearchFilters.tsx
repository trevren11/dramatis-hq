/* eslint-disable max-lines -- filter component with many filter options */
"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  HAIR_COLORS,
  EYE_COLORS,
  ETHNICITIES,
  VOCAL_RANGES,
  GENDERS,
} from "@/lib/db/schema/talent-profiles";
import { UNION_STATUSES } from "@/lib/db/schema/talent-search";
import { ChevronDown, ChevronUp, X, Search, RotateCcw } from "lucide-react";
import { heightToFeetInches } from "@/lib/validations/physical-attributes";

export interface TalentSearchFiltersValues {
  location?: string;
  heightMin?: number;
  heightMax?: number;
  ageMin?: number;
  ageMax?: number;
  hairColors?: string[];
  eyeColors?: string[];
  ethnicities?: string[];
  vocalRanges?: string[];
  genders?: string[];
  skills?: string[];
  unionStatuses?: string[];
  willingToCutHair?: boolean;
  mustBe18Plus?: boolean;
}

interface TalentSearchFiltersProps {
  filters: TalentSearchFiltersValues;
  onFiltersChange: (filters: TalentSearchFiltersValues) => void;
  onSearch: () => void;
  onReset: () => void;
  availableSkills?: string[];
  isLoading?: boolean;
}

const LABEL_MAP: Record<string, string> = {
  black: "Black",
  brown: "Brown",
  blonde: "Blonde",
  red: "Red",
  auburn: "Auburn",
  gray: "Gray",
  white: "White",
  bald: "Bald",
  other: "Other",
  blue: "Blue",
  green: "Green",
  hazel: "Hazel",
  amber: "Amber",
  asian: "Asian",
  caucasian: "Caucasian",
  hispanic: "Hispanic/Latino",
  middle_eastern: "Middle Eastern",
  native_american: "Native American",
  pacific_islander: "Pacific Islander",
  south_asian: "South Asian",
  mixed: "Mixed",
  prefer_not_to_say: "Prefer Not to Say",
  soprano: "Soprano",
  mezzo_soprano: "Mezzo-Soprano",
  alto: "Alto",
  countertenor: "Countertenor",
  tenor: "Tenor",
  baritone: "Baritone",
  bass: "Bass",
  not_applicable: "Not Applicable",
  male: "Male",
  female: "Female",
  non_binary: "Non-Binary",
};

function formatHeight(inches: number): string {
  const { feet, inches: remainingInches } = heightToFeetInches(inches);
  return `${String(feet)}'${String(remainingInches)}"`;
}

// eslint-disable-next-line complexity
export function TalentSearchFilters({
  filters,
  onFiltersChange,
  onSearch,
  onReset,
  availableSkills = [],
  isLoading = false,
}: TalentSearchFiltersProps): React.ReactElement {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["location", "physical"])
  );
  const [skillSearch, setSkillSearch] = useState("");

  const toggleSection = useCallback((section: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  }, []);

  const updateFilter = useCallback(
    <K extends keyof TalentSearchFiltersValues>(key: K, value: TalentSearchFiltersValues[K]) => {
      onFiltersChange({ ...filters, [key]: value });
    },
    [filters, onFiltersChange]
  );

  const toggleArrayValue = useCallback(
    (key: keyof TalentSearchFiltersValues, value: string) => {
      const current = (filters[key] as string[] | undefined) ?? [];
      const updated = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      updateFilter(key, updated.length > 0 ? updated : undefined);
    },
    [filters, updateFilter]
  );

  const filteredSkills = availableSkills.filter((skill) =>
    skill.toLowerCase().includes(skillSearch.toLowerCase())
  );

  const activeFilterCount = Object.entries(filters).filter(([, value]) => {
    if (value === undefined || value === null) return false;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === "boolean") return value;
    if (typeof value === "string") return value.length > 0;
    return true;
  }).length;

  return (
    <Card className="sticky top-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Filters</CardTitle>
          {activeFilterCount > 0 && <Badge variant="secondary">{activeFilterCount} active</Badge>}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Location */}
        <div className="space-y-2">
          <button
            type="button"
            className="flex w-full items-center justify-between text-sm font-medium"
            onClick={() => {
              toggleSection("location");
            }}
          >
            Location
            {expandedSections.has("location") ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
          {expandedSections.has("location") && (
            <Input
              placeholder="City, state, or region..."
              value={filters.location ?? ""}
              onChange={(e) => {
                updateFilter("location", e.target.value || undefined);
              }}
            />
          )}
        </div>

        {/* Physical Attributes */}
        <div className="space-y-3">
          <button
            type="button"
            className="flex w-full items-center justify-between text-sm font-medium"
            onClick={() => {
              toggleSection("physical");
            }}
          >
            Physical Attributes
            {expandedSections.has("physical") ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
          {expandedSections.has("physical") && (
            <div className="space-y-4">
              {/* Height Range */}
              <div className="space-y-2">
                <Label className="text-muted-foreground text-xs">
                  Height: {filters.heightMin ? formatHeight(filters.heightMin) : "Any"} -{" "}
                  {filters.heightMax ? formatHeight(filters.heightMax) : "Any"}
                </Label>
                <div className="px-2">
                  <Slider
                    min={48}
                    max={84}
                    step={1}
                    value={[filters.heightMin ?? 48, filters.heightMax ?? 84]}
                    onValueChange={([min, max]) => {
                      onFiltersChange({
                        ...filters,
                        heightMin: min === 48 ? undefined : min,
                        heightMax: max === 84 ? undefined : max,
                      });
                    }}
                  />
                </div>
              </div>

              {/* Age Range */}
              <div className="space-y-2">
                <Label className="text-muted-foreground text-xs">
                  Age Range: {filters.ageMin ?? 0} - {filters.ageMax ?? 100}
                </Label>
                <div className="px-2">
                  <Slider
                    min={0}
                    max={100}
                    step={1}
                    value={[filters.ageMin ?? 0, filters.ageMax ?? 100]}
                    onValueChange={([min, max]) => {
                      onFiltersChange({
                        ...filters,
                        ageMin: min === 0 ? undefined : min,
                        ageMax: max === 100 ? undefined : max,
                      });
                    }}
                  />
                </div>
              </div>

              {/* Hair Color */}
              <div className="space-y-2">
                <Label className="text-muted-foreground text-xs">Hair Color</Label>
                <div className="flex flex-wrap gap-1">
                  {HAIR_COLORS.map((color) => (
                    <Badge
                      key={color}
                      variant={filters.hairColors?.includes(color) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => {
                        toggleArrayValue("hairColors", color);
                      }}
                    >
                      {LABEL_MAP[color] ?? color}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Eye Color */}
              <div className="space-y-2">
                <Label className="text-muted-foreground text-xs">Eye Color</Label>
                <div className="flex flex-wrap gap-1">
                  {EYE_COLORS.map((color) => (
                    <Badge
                      key={color}
                      variant={filters.eyeColors?.includes(color) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => {
                        toggleArrayValue("eyeColors", color);
                      }}
                    >
                      {LABEL_MAP[color] ?? color}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Gender */}
              <div className="space-y-2">
                <Label className="text-muted-foreground text-xs">Gender</Label>
                <div className="flex flex-wrap gap-1">
                  {GENDERS.map((gender) => (
                    <Badge
                      key={gender}
                      variant={filters.genders?.includes(gender) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => {
                        toggleArrayValue("genders", gender);
                      }}
                    >
                      {LABEL_MAP[gender] ?? gender}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Vocal Range */}
        <div className="space-y-2">
          <button
            type="button"
            className="flex w-full items-center justify-between text-sm font-medium"
            onClick={() => {
              toggleSection("vocal");
            }}
          >
            Vocal Range
            {expandedSections.has("vocal") ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
          {expandedSections.has("vocal") && (
            <div className="flex flex-wrap gap-1">
              {VOCAL_RANGES.filter((v) => v !== "not_applicable").map((range) => (
                <Badge
                  key={range}
                  variant={filters.vocalRanges?.includes(range) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => {
                    toggleArrayValue("vocalRanges", range);
                  }}
                >
                  {LABEL_MAP[range] ?? range}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Ethnicity */}
        <div className="space-y-2">
          <button
            type="button"
            className="flex w-full items-center justify-between text-sm font-medium"
            onClick={() => {
              toggleSection("ethnicity");
            }}
          >
            Ethnicity
            {expandedSections.has("ethnicity") ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
          {expandedSections.has("ethnicity") && (
            <div className="flex flex-wrap gap-1">
              {ETHNICITIES.filter((e) => e !== "prefer_not_to_say").map((ethnicity) => (
                <Badge
                  key={ethnicity}
                  variant={filters.ethnicities?.includes(ethnicity) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => {
                    toggleArrayValue("ethnicities", ethnicity);
                  }}
                >
                  {LABEL_MAP[ethnicity] ?? ethnicity}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Union Status */}
        <div className="space-y-2">
          <button
            type="button"
            className="flex w-full items-center justify-between text-sm font-medium"
            onClick={() => {
              toggleSection("union");
            }}
          >
            Union Status
            {expandedSections.has("union") ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
          {expandedSections.has("union") && (
            <div className="flex flex-wrap gap-1">
              {UNION_STATUSES.map((status) => (
                <Badge
                  key={status}
                  variant={filters.unionStatuses?.includes(status) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => {
                    toggleArrayValue("unionStatuses", status);
                  }}
                >
                  {status}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Skills */}
        <div className="space-y-2">
          <button
            type="button"
            className="flex w-full items-center justify-between text-sm font-medium"
            onClick={() => {
              toggleSection("skills");
            }}
          >
            Skills
            {expandedSections.has("skills") ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
          {expandedSections.has("skills") && (
            <div className="space-y-2">
              <Input
                placeholder="Search skills..."
                value={skillSearch}
                onChange={(e) => {
                  setSkillSearch(e.target.value);
                }}
              />
              {filters.skills && filters.skills.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {filters.skills.map((skill) => (
                    <Badge key={skill} variant="default" className="gap-1">
                      {skill}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => {
                          toggleArrayValue("skills", skill);
                        }}
                      />
                    </Badge>
                  ))}
                </div>
              )}
              <div
                className="max-h-32 space-y-1 overflow-y-auto"
                role="listbox"
                aria-label="Skills"
              >
                {filteredSkills.slice(0, 20).map((skill) => (
                  <div
                    key={skill}
                    role="option"
                    tabIndex={0}
                    aria-selected={filters.skills?.includes(skill) ?? false}
                    className="hover:bg-accent cursor-pointer rounded px-2 py-1 text-sm"
                    onClick={() => {
                      toggleArrayValue("skills", skill);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        toggleArrayValue("skills", skill);
                      }
                    }}
                  >
                    {skill}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Additional Options */}
        <div className="space-y-2">
          <button
            type="button"
            className="flex w-full items-center justify-between text-sm font-medium"
            onClick={() => {
              toggleSection("additional");
            }}
          >
            Additional Options
            {expandedSections.has("additional") ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
          {expandedSections.has("additional") && (
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="mustBe18Plus"
                  checked={filters.mustBe18Plus ?? false}
                  onCheckedChange={(checked) => {
                    updateFilter("mustBe18Plus", checked ? true : undefined);
                  }}
                />
                <Label htmlFor="mustBe18Plus" className="text-sm">
                  Must be 18+
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="willingToCutHair"
                  checked={filters.willingToCutHair ?? false}
                  onCheckedChange={(checked) => {
                    updateFilter("willingToCutHair", checked ? true : undefined);
                  }}
                />
                <Label htmlFor="willingToCutHair" className="text-sm">
                  Willing to cut/change hair
                </Label>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button onClick={onSearch} disabled={isLoading} className="flex-1">
            <Search className="mr-2 h-4 w-4" />
            Search
          </Button>
          <Button variant="outline" onClick={onReset} disabled={isLoading}>
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

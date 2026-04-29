import type { TalentProfile } from "@/lib/db/schema/talent-profiles";
import type { TalentSearchInput } from "./physical-attributes";

export interface TalentSearchResult {
  profile: TalentProfile;
  matchPercentage: number;
}

interface MatchResult {
  matched: number;
  total: number;
}

function checkHeightMatch(profile: TalentProfile, filters: TalentSearchInput): MatchResult {
  if (filters.heightMin == null && filters.heightMax == null) {
    return { matched: 0, total: 0 };
  }

  if (profile.heightInches == null) {
    return { matched: 0, total: 1 };
  }

  const meetsMin = filters.heightMin == null || profile.heightInches >= filters.heightMin;
  const meetsMax = filters.heightMax == null || profile.heightInches <= filters.heightMax;

  return { matched: meetsMin && meetsMax ? 1 : 0, total: 1 };
}

function checkAgeRangeMatch(profile: TalentProfile, filters: TalentSearchInput): MatchResult {
  if (filters.ageMin == null && filters.ageMax == null) {
    return { matched: 0, total: 0 };
  }

  if (profile.ageRangeLow == null || profile.ageRangeHigh == null) {
    return { matched: 0, total: 1 };
  }

  const filterMin = filters.ageMin ?? 0;
  const filterMax = filters.ageMax ?? 100;
  const hasOverlap = profile.ageRangeLow <= filterMax && profile.ageRangeHigh >= filterMin;

  return { matched: hasOverlap ? 1 : 0, total: 1 };
}

function checkArrayMatch<T>(profileValue: T | null, filterValues: T[] | undefined): MatchResult {
  if (!filterValues || filterValues.length === 0) {
    return { matched: 0, total: 0 };
  }

  const matches = profileValue != null && filterValues.includes(profileValue);
  return { matched: matches ? 1 : 0, total: 1 };
}

function checkWillingnessMatch(profile: TalentProfile, filters: TalentSearchInput): MatchResult {
  if (filters.willingToCutHair !== true) {
    return { matched: 0, total: 0 };
  }

  const isWilling =
    profile.willingnessToChangeHair === "yes" || profile.willingnessToChangeHair === "negotiable";

  return { matched: isWilling ? 1 : 0, total: 1 };
}

function checkOver18Match(profile: TalentProfile, filters: TalentSearchInput): MatchResult {
  if (filters.mustBe18Plus !== true) {
    return { matched: 0, total: 0 };
  }

  return { matched: profile.isOver18 === true ? 1 : 0, total: 1 };
}

function sumMatchResults(results: MatchResult[]): MatchResult {
  return results.reduce(
    (acc, result) => ({
      matched: acc.matched + result.matched,
      total: acc.total + result.total,
    }),
    { matched: 0, total: 0 }
  );
}

export function calculateMatchPercentage(
  profile: TalentProfile,
  filters: TalentSearchInput
): number {
  const results = sumMatchResults([
    checkHeightMatch(profile, filters),
    checkAgeRangeMatch(profile, filters),
    checkArrayMatch(profile.hairColor, filters.hairColors),
    checkArrayMatch(profile.eyeColor, filters.eyeColors),
    checkArrayMatch(profile.ethnicity, filters.ethnicities),
    checkArrayMatch(profile.vocalRange, filters.vocalRanges),
    checkArrayMatch(profile.gender, filters.genders),
    checkWillingnessMatch(profile, filters),
    checkOver18Match(profile, filters),
  ]);

  return results.total > 0 ? Math.round((results.matched / results.total) * 100) : 100;
}

export function filterBySearchCriteria(
  profile: TalentProfile,
  filters: TalentSearchInput
): boolean {
  if (filters.mustBe18Plus === true && profile.isOver18 !== true) {
    return false;
  }

  return true;
}

export function sortByMatchPercentage(results: TalentSearchResult[]): TalentSearchResult[] {
  return [...results].sort((a, b) => b.matchPercentage - a.matchPercentage);
}

import type { TalentProfile, WorkHistoryItem, EducationItem, ResumeConfiguration } from "../types";

export interface PhysicalAttributeOptions {
  includeHeight?: boolean;
  includeHair?: boolean;
  includeEyes?: boolean;
}

export interface ResumeTemplateProps {
  profile: TalentProfile;
  config: Partial<ResumeConfiguration>;
  selectedWorkHistory?: WorkHistoryItem[];
  selectedEducation?: EducationItem[];
  selectedSkills?: string[];
}

export function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function formatPhysicalAttributes(
  profile: TalentProfile,
  options: PhysicalAttributeOptions = {}
): string {
  const { includeHeight = true, includeHair = true, includeEyes = true } = options;
  const parts: string[] = [];
  if (includeHeight && profile.height) parts.push(profile.height);
  if (includeHair && profile.hairColor) parts.push(`${capitalizeFirst(profile.hairColor)} Hair`);
  if (includeEyes && profile.eyeColor) parts.push(`${capitalizeFirst(profile.eyeColor)} Eyes`);
  return parts.join(" | ");
}

export function getPhysicalAttributeOptions(
  config: Partial<ResumeConfiguration>
): PhysicalAttributeOptions {
  return {
    includeHeight: config.includeHeight ?? true,
    includeHair: config.includeHair ?? true,
    includeEyes: config.includeEyes ?? true,
  };
}

export function categorizeWorkHistory(workHistory: WorkHistoryItem[]): {
  theaterCredits: WorkHistoryItem[];
  filmCredits: WorkHistoryItem[];
  otherCredits: WorkHistoryItem[];
} {
  return {
    theaterCredits: workHistory.filter((w) => w.category === "theater"),
    filmCredits: workHistory.filter((w) => ["film", "television"].includes(w.category)),
    otherCredits: workHistory.filter(
      (w) => !["theater", "film", "television"].includes(w.category)
    ),
  };
}

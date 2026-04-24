import type { User } from "@/lib/db/schema/users";
import type { TalentProfile } from "@/lib/db/schema/talent-profiles";

export type ViewerType = "owner" | "producer" | "public";

export function getViewerType(viewer: User | null, profileUserId: string): ViewerType {
  if (!viewer) {
    return "public";
  }
  if (viewer.id === profileUserId) {
    return "owner";
  }
  if (viewer.userType === "producer" || viewer.userType === "admin") {
    return "producer";
  }
  return "public";
}

export function canViewPhysicalAttributes(viewerType: ViewerType, profile: TalentProfile): boolean {
  if (viewerType === "owner") {
    return true;
  }
  if (viewerType === "producer" && !profile.hideFromSearch) {
    return true;
  }
  return false;
}

export function canEditPhysicalAttributes(viewerType: ViewerType): boolean {
  return viewerType === "owner";
}

export function canSearchTalent(viewer: User | null): boolean {
  if (!viewer) {
    return false;
  }
  return viewer.userType === "producer" || viewer.userType === "admin";
}

export function isProfileSearchable(profile: TalentProfile): boolean {
  return profile.isPublic === true && profile.hideFromSearch !== true;
}

export type PhysicalAttributeField =
  | "heightInches"
  | "hairColor"
  | "naturalHairColor"
  | "eyeColor"
  | "gender"
  | "ethnicity"
  | "ageRangeLow"
  | "ageRangeHigh"
  | "vocalRange"
  | "willingnessToRemoveHair"
  | "isOver18"
  | "hideFromSearch";

export function stripPhysicalAttributes<T extends Partial<TalentProfile>>(
  profile: T
): Omit<T, PhysicalAttributeField> {
  const {
    heightInches: _h,
    hairColor: _hc,
    naturalHairColor: _nhc,
    eyeColor: _ec,
    gender: _g,
    ethnicity: _e,
    ageRangeLow: _arl,
    ageRangeHigh: _arh,
    vocalRange: _vr,
    willingnessToRemoveHair: _wtr,
    isOver18: _io,
    hideFromSearch: _hfs,
    ...rest
  } = profile;
  return rest;
}

export function getVisibleProfile(
  profile: TalentProfile,
  viewerType: ViewerType
): TalentProfile | Omit<TalentProfile, PhysicalAttributeField> {
  if (canViewPhysicalAttributes(viewerType, profile)) {
    return profile;
  }
  return stripPhysicalAttributes(profile);
}

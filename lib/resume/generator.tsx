import { renderToBuffer } from "@react-pdf/renderer";
import { TheatricalResume } from "./templates/theatrical";
import type { TalentProfile, ResumeConfiguration, WorkHistoryItem, EducationItem } from "./types";

export interface GenerateResumeOptions {
  profile: TalentProfile;
  config?: Partial<ResumeConfiguration>;
  selectedWorkHistoryIds?: string[];
  selectedEducationIds?: string[];
  selectedSkills?: string[];
}

export interface GeneratedResume {
  buffer: Buffer;
  filename: string;
  contentType: string;
}

function filterWorkHistory(
  workHistory: WorkHistoryItem[],
  selectedIds?: string[]
): WorkHistoryItem[] {
  if (!selectedIds || selectedIds.length === 0) {
    return workHistory;
  }
  return workHistory.filter((item) => selectedIds.includes(item.id));
}

function filterEducation(education: EducationItem[], selectedIds?: string[]): EducationItem[] {
  if (!selectedIds || selectedIds.length === 0) {
    return education;
  }
  return education.filter((item) => selectedIds.includes(item.id));
}

function filterSkills(skills: string[], selectedSkills?: string[]): string[] {
  if (!selectedSkills || selectedSkills.length === 0) {
    return skills;
  }
  return skills.filter((skill) => selectedSkills.includes(skill));
}

function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function generateResumePdf(options: GenerateResumeOptions): Promise<GeneratedResume> {
  const {
    profile,
    config = {},
    selectedWorkHistoryIds,
    selectedEducationIds,
    selectedSkills,
  } = options;

  const filteredWorkHistory = filterWorkHistory(profile.workHistory, selectedWorkHistoryIds);
  const filteredEducation = filterEducation(profile.education, selectedEducationIds);
  const filteredSkills = filterSkills(profile.skills, selectedSkills);

  const resumeElement = (
    <TheatricalResume
      profile={profile}
      config={config}
      selectedWorkHistory={filteredWorkHistory}
      selectedEducation={filteredEducation}
      selectedSkills={filteredSkills}
    />
  );

  const buffer = await renderToBuffer(resumeElement);

  const filename = `${sanitizeFilename(profile.name)}-resume.pdf`;

  return {
    buffer: Buffer.from(buffer),
    filename,
    contentType: "application/pdf",
  };
}

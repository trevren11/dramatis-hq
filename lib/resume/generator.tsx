import { renderToBuffer } from "@react-pdf/renderer";
import { TheatricalResume } from "./templates/theatrical";
import { ModernResume } from "./templates/modern";
import { MinimalResume } from "./templates/minimal";
import { CreativeResume } from "./templates/creative";
import { CommercialResume } from "./templates/commercial";
import type {
  TalentProfile,
  ResumeConfiguration,
  WorkHistoryItem,
  EducationItem,
  ResumeTemplate,
} from "./types";

export interface GenerateResumeOptions {
  profile: TalentProfile;
  config?: Partial<ResumeConfiguration>;
  selectedWorkHistoryIds?: string[];
  selectedEducationIds?: string[];
  selectedSkills?: string[];
  template?: ResumeTemplate;
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

function getResumeComponent(template: ResumeTemplate): React.ComponentType<{
  profile: TalentProfile;
  config: Partial<ResumeConfiguration>;
  selectedWorkHistory?: WorkHistoryItem[];
  selectedEducation?: EducationItem[];
  selectedSkills?: string[];
}> {
  switch (template) {
    case "modern":
      return ModernResume;
    case "minimal":
      return MinimalResume;
    case "creative":
      return CreativeResume;
    case "commercial":
      return CommercialResume;
    case "theatrical":
    default:
      return TheatricalResume;
  }
}

export async function generateResumePdf(options: GenerateResumeOptions): Promise<GeneratedResume> {
  const {
    profile,
    config = {},
    selectedWorkHistoryIds,
    selectedEducationIds,
    selectedSkills,
    template = config.template ?? "theatrical",
  } = options;

  const filteredWorkHistory = filterWorkHistory(profile.workHistory, selectedWorkHistoryIds);
  const filteredEducation = filterEducation(profile.education, selectedEducationIds);
  const filteredSkills = filterSkills(profile.skills, selectedSkills);

  const ResumeComponent = getResumeComponent(template);

  const resumeElement = (
    <ResumeComponent
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

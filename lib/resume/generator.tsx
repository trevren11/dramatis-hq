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

export function createSampleProfile(): TalentProfile {
  return {
    id: "sample-profile-id",
    userId: "sample-user-id",
    name: "Jane Doe",
    headshot: undefined,
    contactEmail: "jane.doe@example.com",
    phone: "(555) 123-4567",
    height: "5'6\"",
    hairColor: "Brown",
    eyeColor: "Green",
    unionStatus: ["AEA", "SAG-AFTRA"],
    workHistory: [
      {
        id: "wh-1",
        category: "theater",
        projectName: "Hamilton",
        role: "Eliza Hamilton",
        company: "Broadway",
        director: "Thomas Kail",
        year: 2023,
        isUnion: true,
      },
      {
        id: "wh-2",
        category: "theater",
        projectName: "Les Misérables",
        role: "Éponine",
        company: "National Tour",
        director: "James Powell",
        year: 2022,
        isUnion: true,
      },
      {
        id: "wh-3",
        category: "film",
        projectName: "The Last Dance",
        role: "Supporting",
        company: "Netflix",
        director: "Jason Hehir",
        year: 2021,
        isUnion: true,
      },
      {
        id: "wh-4",
        category: "television",
        projectName: "Law & Order: SVU",
        role: "Guest Star",
        company: "NBC",
        director: "Various",
        year: 2020,
        isUnion: true,
      },
    ],
    education: [
      {
        id: "ed-1",
        program: "BFA Musical Theater",
        institution: "NYU Tisch School of the Arts",
        instructor: undefined,
        yearStart: 2014,
        yearEnd: 2018,
        degree: "BFA",
      },
      {
        id: "ed-2",
        program: "Voice",
        institution: "Private Study",
        instructor: "Mary Smith",
        yearStart: 2018,
        yearEnd: undefined,
        degree: undefined,
      },
    ],
    skills: [
      "Soprano (Belt to E5)",
      "Tap Dance",
      "Ballet",
      "Jazz",
      "Piano",
      "Guitar",
      "Stage Combat",
      "Dialects: British RP, Southern, New York",
      "Fluent Spanish",
    ],
  };
}

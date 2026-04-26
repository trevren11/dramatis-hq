import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  talentProfiles,
  workHistory,
  education,
  headshots,
  talentSkills,
  skills,
  resumeConfigurations,
} from "@/lib/db/schema";
import { eq, asc, inArray, desc } from "drizzle-orm";
import { ResumeBuilderWithSave } from "./ResumeBuilderWithSave";
import type {
  TalentProfile,
  WorkHistoryItem,
  EducationItem,
  WorkHistoryCategory,
  ResumeTemplate,
} from "@/lib/resume/types";

export const metadata = {
  title: "Resume Builder",
  description: "Create and customize your professional theatrical resume",
};

// Map database work categories to resume categories
function mapWorkCategory(dbCategory: string): WorkHistoryCategory {
  const categoryMap: Record<string, WorkHistoryCategory> = {
    theater: "theater",
    film: "film",
    television: "television",
    commercial: "commercial",
    voice_over: "voiceover",
    industrial: "industrials",
    web_series: "new_media",
    music_video: "new_media",
    live_event: "theater",
    other: "industrials",
  };
  return categoryMap[dbCategory] ?? "industrials";
}

// Format height from inches to display format
function formatHeight(inches: number | null): string | undefined {
  if (!inches) return undefined;
  const feet = Math.floor(inches / 12);
  const remainingInches = inches % 12;
  return `${String(feet)}'${String(remainingInches)}"`;
}

export default async function ResumeBuilderPage(): Promise<React.ReactElement> {
  const session = await auth();
  if (!session?.user.id) {
    redirect("/login");
  }

  const profile = await db.query.talentProfiles.findFirst({
    where: eq(talentProfiles.userId, session.user.id),
  });

  if (!profile) {
    redirect("/talent/profile/wizard");
  }

  // Fetch all related data in parallel
  const [work, edu, photos, userSkills, savedConfigs] = await Promise.all([
    db.query.workHistory.findMany({
      where: eq(workHistory.talentProfileId, profile.id),
      orderBy: [asc(workHistory.sortOrder)],
    }),
    db.query.education.findMany({
      where: eq(education.talentProfileId, profile.id),
      orderBy: [asc(education.sortOrder)],
    }),
    db.query.headshots.findMany({
      where: eq(headshots.talentProfileId, profile.id),
      orderBy: [asc(headshots.sortOrder)],
    }),
    db.query.talentSkills.findMany({
      where: eq(talentSkills.talentProfileId, profile.id),
    }),
    db.query.resumeConfigurations.findMany({
      where: eq(resumeConfigurations.userId, session.user.id),
      orderBy: [desc(resumeConfigurations.updatedAt)],
    }),
  ]);

  // Fetch skill details
  const skillIds = userSkills.map((s) => s.skillId);
  const skillDetails =
    skillIds.length > 0
      ? await db.query.skills.findMany({ where: inArray(skills.id, skillIds) })
      : [];

  // Get primary headshot
  const primaryHeadshot = photos.find((p) => p.isPrimary) ?? photos[0];

  // Transform work history to resume format
  const workHistoryItems: WorkHistoryItem[] = work.map((w) => ({
    id: w.id,
    category: mapWorkCategory(w.category),
    projectName: w.showName,
    role: w.role,
    company: w.productionCompany ?? undefined,
    director: w.director ?? undefined,
    year: w.startDate ? new Date(w.startDate).getFullYear() : undefined,
    isUnion: w.isUnion ?? false,
  }));

  // Transform education to resume format
  const educationItems: EducationItem[] = edu.map((e) => ({
    id: e.id,
    program: e.program,
    institution: e.institution,
    instructor: undefined, // DB doesn't have instructor field
    yearStart: e.startYear ?? undefined,
    yearEnd: e.endYear ?? undefined,
    degree: e.degree ?? undefined,
  }));

  // Build the TalentProfile for the resume builder
  const resumeProfile: TalentProfile = {
    id: profile.id,
    userId: profile.userId,
    name: profile.stageName ?? `${profile.firstName} ${profile.lastName}`,
    headshot: primaryHeadshot?.url,
    contactEmail: session.user.email,
    phone: profile.phone ?? undefined,
    height: formatHeight(profile.heightInches),
    hairColor: profile.hairColor ?? undefined,
    eyeColor: profile.eyeColor ?? undefined,
    unionStatus: profile.unionMemberships ?? [],
    workHistory: workHistoryItems,
    education: educationItems,
    skills: skillDetails.map((s) => s.name),
  };

  // Transform saved configs to the format expected by the component
  const savedResumes = savedConfigs.map((config) => ({
    id: config.id,
    name: config.name,
    template: config.template as ResumeTemplate,
    selectedWorkHistory: config.selectedWorkHistory ?? [],
    selectedEducation: config.selectedEducation ?? [],
    selectedSkills: config.selectedSkills ?? [],
    includeHeadshot: config.includeHeadshot ?? true,
    includeContact: config.includeContact ?? true,
    includeHeight: config.includeHeight ?? true,
    includeHair: config.includeHair ?? true,
    includeEyes: config.includeEyes ?? true,
  }));

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Resume Builder</h1>
        <p className="text-muted-foreground mt-2">
          Create multiple resumes for different purposes. Select which credits, training, and skills
          to include. Preview updates in real-time.
        </p>
      </div>

      <ResumeBuilderWithSave profile={resumeProfile} initialSavedResumes={savedResumes} />
    </div>
  );
}

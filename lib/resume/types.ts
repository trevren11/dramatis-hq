import { z } from "zod";

export const workHistoryCategorySchema = z.enum([
  "theater",
  "film",
  "television",
  "commercial",
  "voiceover",
  "industrials",
  "new_media",
]);

export type WorkHistoryCategory = z.infer<typeof workHistoryCategorySchema>;

export const workHistoryItemSchema = z.object({
  id: z.string().uuid(),
  category: workHistoryCategorySchema,
  projectName: z.string().min(1),
  role: z.string().min(1),
  company: z.string().optional(),
  director: z.string().optional(),
  year: z.number().optional(),
  isUnion: z.boolean().default(false),
});

export type WorkHistoryItem = z.infer<typeof workHistoryItemSchema>;

export const educationItemSchema = z.object({
  id: z.string().uuid(),
  program: z.string().min(1),
  institution: z.string().min(1),
  instructor: z.string().optional(),
  yearStart: z.number().optional(),
  yearEnd: z.number().optional(),
  degree: z.string().optional(),
});

export type EducationItem = z.infer<typeof educationItemSchema>;

export const talentProfileSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  name: z.string().min(1),
  headshot: z.string().url().optional(),
  contactEmail: z.string().email().optional(),
  phone: z.string().optional(),
  height: z.string().optional(),
  hairColor: z.string().optional(),
  eyeColor: z.string().optional(),
  unionStatus: z.array(z.string()).default([]),
  workHistory: z.array(workHistoryItemSchema).default([]),
  education: z.array(educationItemSchema).default([]),
  skills: z.array(z.string()).default([]),
});

export type TalentProfile = z.infer<typeof talentProfileSchema>;

export const resumeSectionSchema = z.enum([
  "header",
  "theater",
  "film_television",
  "training",
  "skills",
]);

export type ResumeSection = z.infer<typeof resumeSectionSchema>;

export const resumeTemplateSchema = z.enum([
  "theatrical",
  "modern",
  "minimal",
  "creative",
  "commercial",
]);

export type ResumeTemplate = z.infer<typeof resumeTemplateSchema>;

export const resumeConfigurationSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  name: z.string().min(1).max(100),
  template: resumeTemplateSchema.default("theatrical"),
  selectedWorkHistory: z.array(z.string().uuid()).default([]),
  selectedEducation: z.array(z.string().uuid()).default([]),
  selectedSkills: z.array(z.string()).default([]),
  sectionOrder: z
    .array(resumeSectionSchema)
    .default(["header", "theater", "film_television", "training", "skills"]),
  includeHeadshot: z.boolean().default(true),
  includeContact: z.boolean().default(true),
  includeHeight: z.boolean().default(true),
  includeHair: z.boolean().default(true),
  includeEyes: z.boolean().default(true),
  // Custom text overrides for sections
  customHeaderText: z.string().optional(),
  customSkillsText: z.string().optional(),
  customTrainingText: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ResumeConfiguration = z.infer<typeof resumeConfigurationSchema>;

export const resumeDataSchema = z.object({
  profile: talentProfileSchema,
  configuration: resumeConfigurationSchema,
});

export type ResumeData = z.infer<typeof resumeDataSchema>;

export const generateResumeRequestSchema = z.object({
  profileId: z.string().uuid(),
  configurationId: z.string().uuid().optional(),
  selectedWorkHistory: z.array(z.string().uuid()).optional(),
  selectedEducation: z.array(z.string().uuid()).optional(),
  selectedSkills: z.array(z.string()).optional(),
  sectionOrder: z.array(resumeSectionSchema).optional(),
  includeHeadshot: z.boolean().optional(),
  includeContact: z.boolean().optional(),
});

export type GenerateResumeRequest = z.infer<typeof generateResumeRequestSchema>;

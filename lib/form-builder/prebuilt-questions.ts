import type { FormField } from "@/lib/db/schema/auditions";

/**
 * Pre-built questions library for audition forms.
 * Producers can quickly add common questions to their forms.
 */

// Common audition questions grouped by category
export const PREBUILT_QUESTIONS: FormField[] = [
  // Eligibility
  {
    id: "age_18",
    type: "boolean",
    label: "Are you 18 years of age or older?",
    required: true,
  },
  {
    id: "work_auth",
    type: "boolean",
    label: "Are you legally authorized to work in the US?",
    required: true,
  },
  {
    id: "local_hire",
    type: "boolean",
    label: "Are you a local hire? (No relocation required)",
    required: false,
  },

  // Logistics
  {
    id: "transportation",
    type: "boolean",
    label: "Do you have reliable transportation to rehearsals and performances?",
    required: true,
  },
  {
    id: "conflicts",
    type: "textarea",
    label: "Do you have any conflicts during the production dates? Please list all conflicts.",
    required: false,
    placeholder: "List any dates you are unavailable...",
  },
  {
    id: "availability",
    type: "select",
    label: "What is your general availability?",
    required: false,
    options: [
      "Full-time available",
      "Weekdays only",
      "Weekends only",
      "Evenings only",
      "Flexible schedule",
    ],
  },

  // Experience & Background
  {
    id: "referral",
    type: "select",
    label: "How did you hear about this audition?",
    required: false,
    options: [
      "Social Media",
      "Company Website",
      "Casting Call Website",
      "Friend/Colleague",
      "Agent/Manager",
      "Previous Production",
      "Other",
    ],
  },
  {
    id: "prev_experience",
    type: "boolean",
    label: "Have you worked with this company/theater before?",
    required: false,
  },
  {
    id: "formal_training",
    type: "textarea",
    label: "Please describe your formal training (schools, programs, workshops).",
    required: false,
    placeholder: "List relevant training...",
  },

  // Role-specific
  {
    id: "role_preference",
    type: "textarea",
    label: "Which role(s) are you auditioning for? (If multiple, list in order of preference)",
    required: true,
    placeholder: "Enter role name(s)...",
  },
  {
    id: "ensemble_willing",
    type: "boolean",
    label: "Would you accept an ensemble/chorus role if not cast in a principal role?",
    required: false,
  },
  {
    id: "understudy_willing",
    type: "boolean",
    label: "Would you be willing to understudy?",
    required: false,
  },

  // Technical Skills
  {
    id: "vocal_range",
    type: "select",
    label: "What is your vocal range?",
    required: false,
    options: [
      "Soprano",
      "Mezzo-Soprano",
      "Alto",
      "Countertenor",
      "Tenor",
      "Baritone",
      "Bass",
      "Non-singer",
    ],
  },
  {
    id: "dance_experience",
    type: "multiselect",
    label: "What dance styles are you trained in?",
    required: false,
    options: [
      "Ballet",
      "Jazz",
      "Tap",
      "Contemporary",
      "Hip Hop",
      "Ballroom",
      "Musical Theater",
      "None",
    ],
  },
  {
    id: "instruments",
    type: "textarea",
    label: "Do you play any musical instruments? Please list.",
    required: false,
    placeholder: "List instruments and proficiency level...",
  },

  // Special Accommodations
  {
    id: "accommodations",
    type: "textarea",
    label: "Do you require any accommodations for the audition or production?",
    required: false,
    placeholder: "Describe any needs...",
  },

  // Emergency Contact
  {
    id: "emergency_contact",
    type: "text",
    label: "Emergency contact name and phone number",
    required: false,
    placeholder: "Name: (xxx) xxx-xxxx",
  },

  // Additional
  {
    id: "additional_info",
    type: "textarea",
    label: "Is there anything else you would like us to know?",
    required: false,
    placeholder: "Additional information...",
  },
];

// Categories for organizing questions in the UI
export const QUESTION_CATEGORIES = [
  {
    id: "eligibility",
    label: "Eligibility",
    questionIds: ["age_18", "work_auth", "local_hire"],
  },
  {
    id: "logistics",
    label: "Logistics & Availability",
    questionIds: ["transportation", "conflicts", "availability"],
  },
  {
    id: "experience",
    label: "Experience & Background",
    questionIds: ["referral", "prev_experience", "formal_training"],
  },
  {
    id: "role",
    label: "Role Preferences",
    questionIds: ["role_preference", "ensemble_willing", "understudy_willing"],
  },
  {
    id: "skills",
    label: "Technical Skills",
    questionIds: ["vocal_range", "dance_experience", "instruments"],
  },
  {
    id: "other",
    label: "Other",
    questionIds: ["accommodations", "emergency_contact", "additional_info"],
  },
] as const;

/**
 * Profile field mappings for auto-fill functionality.
 * Maps form field IDs to talent profile paths.
 */
export const PROFILE_MAPPINGS: Record<string, string> = {
  // User fields
  name: "talentProfile.stageName",
  email: "user.email",
  phone: "talentProfile.phone",

  // Profile fields
  union_status: "talentProfile.unionStatus",
  height: "talentProfile.height",
  weight: "talentProfile.weight",
  eye_color: "talentProfile.eyeColor",
  hair_color: "talentProfile.hairColor",
  ethnicity: "talentProfile.ethnicity",
  gender: "talentProfile.gender",
  age_range: "talentProfile.ageRange",

  // Skills
  skills: "talentProfile.skills",
  special_skills: "talentProfile.specialSkills",
  languages: "talentProfile.languages",

  // Experience
  vocal_type: "talentProfile.vocalType",
  dance_training: "talentProfile.danceTraining",
};

/**
 * Get the available profile fields for auto-fill dropdown
 */
export const PROFILE_MAPPING_OPTIONS = [
  { value: "talentProfile.stageName", label: "Stage Name" },
  { value: "user.email", label: "Email" },
  { value: "talentProfile.phone", label: "Phone" },
  { value: "talentProfile.unionStatus", label: "Union Status" },
  { value: "talentProfile.height", label: "Height" },
  { value: "talentProfile.eyeColor", label: "Eye Color" },
  { value: "talentProfile.hairColor", label: "Hair Color" },
  { value: "talentProfile.ethnicity", label: "Ethnicity" },
  { value: "talentProfile.gender", label: "Gender" },
  { value: "talentProfile.skills", label: "Skills" },
  { value: "talentProfile.languages", label: "Languages" },
] as const;

/**
 * Get a prebuilt question by ID
 */
export function getPrebuiltQuestion(id: string): FormField | undefined {
  return PREBUILT_QUESTIONS.find((q) => q.id === id);
}

/**
 * Get all questions in a category
 */
export function getQuestionsByCategory(categoryId: string): FormField[] {
  const category = QUESTION_CATEGORIES.find((c) => c.id === categoryId);
  if (!category) return [];
  return category.questionIds
    .map((id) => getPrebuiltQuestion(id))
    .filter((q): q is FormField => q !== undefined);
}

/**
 * Generate a unique ID for a new field
 */
export function generateFieldId(): string {
  return "field_" + String(Date.now()) + "_" + Math.random().toString(36).substring(2, 9);
}

/**
 * Create a new blank field of the specified type
 */
export function createBlankField(type: FormField["type"]): FormField {
  const base: FormField = {
    id: generateFieldId(),
    type,
    label: "",
    required: false,
  };

  if (type === "select" || type === "multiselect") {
    base.options = [];
  }

  return base;
}

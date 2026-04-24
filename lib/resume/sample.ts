import type { TalentProfile } from "./types";

/**
 * Creates a sample talent profile for testing and preview purposes.
 * This function is intentionally in a separate file from generator.tsx
 * to avoid pulling in @react-pdf/renderer dependencies.
 */
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

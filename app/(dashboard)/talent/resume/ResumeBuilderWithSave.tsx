"use client";

import * as React from "react";
import { ResumeBuilder } from "@/components/resume";
import type { TalentProfile, ResumeTemplate } from "@/lib/resume/types";

interface SavedResume {
  id: string;
  name: string;
  template: ResumeTemplate;
  selectedWorkHistory: string[];
  selectedEducation: string[];
  selectedSkills: string[];
  includeHeadshot: boolean;
  includeContact: boolean;
  includeHeight: boolean;
  includeHair: boolean;
  includeEyes: boolean;
}

interface ApiResumeConfigurationResponse {
  id: string;
  name: string;
  template: string | null;
  selectedWorkHistory: string[] | null;
  selectedEducation: string[] | null;
  selectedSkills: string[] | null;
  includeHeadshot: boolean | null;
  includeContact: boolean | null;
  includeHeight: boolean | null;
  includeHair: boolean | null;
  includeEyes: boolean | null;
}

interface ResumeBuilderWithSaveProps {
  profile: TalentProfile;
  initialSavedResumes: SavedResume[];
}

export function ResumeBuilderWithSave({
  profile,
  initialSavedResumes,
}: ResumeBuilderWithSaveProps): React.ReactElement {
  const [savedResumes, setSavedResumes] = React.useState<SavedResume[]>(initialSavedResumes);

  const handleSaveResume = async (resume: Omit<SavedResume, "id">): Promise<SavedResume> => {
    const response = await fetch("/api/resume/configurations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(resume),
    });

    if (!response.ok) {
      throw new Error("Failed to save resume configuration");
    }

    const saved = (await response.json()) as ApiResumeConfigurationResponse;
    const newResume: SavedResume = {
      id: saved.id,
      name: saved.name,
      template: (saved.template ?? "theatrical") as ResumeTemplate,
      selectedWorkHistory: saved.selectedWorkHistory ?? [],
      selectedEducation: saved.selectedEducation ?? [],
      selectedSkills: saved.selectedSkills ?? [],
      includeHeadshot: saved.includeHeadshot ?? true,
      includeContact: saved.includeContact ?? true,
      includeHeight: saved.includeHeight ?? true,
      includeHair: saved.includeHair ?? true,
      includeEyes: saved.includeEyes ?? true,
    };

    setSavedResumes((prev) => [newResume, ...prev]);
    return newResume;
  };

  const handleDeleteResume = async (id: string): Promise<void> => {
    const response = await fetch(`/api/resume/configurations/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("Failed to delete resume configuration");
    }

    setSavedResumes((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <ResumeBuilder
      profile={profile}
      savedResumes={savedResumes}
      onSaveResume={handleSaveResume}
      onDeleteResume={handleDeleteResume}
    />
  );
}

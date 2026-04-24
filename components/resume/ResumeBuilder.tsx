"use client";

import * as React from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SectionSelector } from "./SectionSelector";
import { ResumePreview } from "./ResumePreview";
import type { TalentProfile, WorkHistoryItem, EducationItem } from "@/lib/resume/types";

interface ResumeBuilderProps {
  profile: TalentProfile;
}

function workHistoryToSelectableItem(item: WorkHistoryItem): {
  id: string;
  label: string;
  sublabel: string;
} {
  return {
    id: item.id,
    label: `${item.projectName} - ${item.role}`,
    sublabel: [item.company, item.director, item.year].filter(Boolean).join(" | "),
  };
}

function educationToSelectableItem(item: EducationItem): {
  id: string;
  label: string;
  sublabel: string;
} {
  return {
    id: item.id,
    label: item.program,
    sublabel: [item.institution, item.instructor].filter(Boolean).join(" | "),
  };
}

function skillToSelectableItem(skill: string): { id: string; label: string } {
  return {
    id: skill,
    label: skill,
  };
}

export function ResumeBuilder({ profile }: ResumeBuilderProps): React.ReactElement {
  const [selectedWorkHistory, setSelectedWorkHistory] = React.useState<string[]>(
    profile.workHistory.map((w) => w.id)
  );
  const [selectedEducation, setSelectedEducation] = React.useState<string[]>(
    profile.education.map((e) => e.id)
  );
  const [selectedSkills, setSelectedSkills] = React.useState<string[]>(profile.skills);
  const [includeHeadshot, setIncludeHeadshot] = React.useState(true);
  const [includeContact, setIncludeContact] = React.useState(true);
  const [isDownloading, setIsDownloading] = React.useState(false);

  const theaterCredits = profile.workHistory.filter((w) => w.category === "theater");
  const filmTvCredits = profile.workHistory.filter((w) =>
    ["film", "television"].includes(w.category)
  );
  const otherCredits = profile.workHistory.filter(
    (w) => !["theater", "film", "television"].includes(w.category)
  );

  const handleDownload = async (): Promise<void> => {
    setIsDownloading(true);

    try {
      const response = await fetch("/api/resume/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          profileId: profile.id,
          profile,
          selectedWorkHistory,
          selectedEducation,
          selectedSkills,
          includeHeadshot,
          includeContact,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate PDF");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `${profile.name.toLowerCase().replace(/\s+/g, "-")}-resume.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download error:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  const onDownloadClick = (): void => {
    void handleDownload();
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Resume Options</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={includeHeadshot}
                  onChange={(e) => {
                    setIncludeHeadshot(e.target.checked);
                  }}
                  className="border-input h-4 w-4 rounded"
                />
                <span className="text-sm">Include Headshot</span>
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={includeContact}
                  onChange={(e) => {
                    setIncludeContact(e.target.checked);
                  }}
                  className="border-input h-4 w-4 rounded"
                />
                <span className="text-sm">Include Contact Info</span>
              </label>
            </div>
          </CardContent>
        </Card>

        {theaterCredits.length > 0 && (
          <SectionSelector
            title="Theater Credits"
            items={theaterCredits.map(workHistoryToSelectableItem)}
            selectedIds={selectedWorkHistory}
            onSelectionChange={(ids) => {
              const otherIds = selectedWorkHistory.filter(
                (id) => !theaterCredits.some((c) => c.id === id)
              );
              setSelectedWorkHistory([...otherIds, ...ids]);
            }}
          />
        )}

        {filmTvCredits.length > 0 && (
          <SectionSelector
            title="Film / Television"
            items={filmTvCredits.map(workHistoryToSelectableItem)}
            selectedIds={selectedWorkHistory}
            onSelectionChange={(ids) => {
              const otherIds = selectedWorkHistory.filter(
                (id) => !filmTvCredits.some((c) => c.id === id)
              );
              setSelectedWorkHistory([...otherIds, ...ids]);
            }}
          />
        )}

        {otherCredits.length > 0 && (
          <SectionSelector
            title="Other Credits"
            items={otherCredits.map(workHistoryToSelectableItem)}
            selectedIds={selectedWorkHistory}
            onSelectionChange={(ids) => {
              const otherIds = selectedWorkHistory.filter(
                (id) => !otherCredits.some((c) => c.id === id)
              );
              setSelectedWorkHistory([...otherIds, ...ids]);
            }}
          />
        )}

        <SectionSelector
          title="Training & Education"
          items={profile.education.map(educationToSelectableItem)}
          selectedIds={selectedEducation}
          onSelectionChange={setSelectedEducation}
        />

        <SectionSelector
          title="Special Skills"
          items={profile.skills.map(skillToSelectableItem)}
          selectedIds={selectedSkills}
          onSelectionChange={setSelectedSkills}
        />

        <Button onClick={onDownloadClick} disabled={isDownloading} className="w-full" size="lg">
          {isDownloading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating PDF...
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              Download Resume PDF
            </>
          )}
        </Button>
      </div>

      <div className="lg:sticky lg:top-4 lg:self-start">
        <ResumePreview
          profile={profile}
          selectedWorkHistory={selectedWorkHistory}
          selectedEducation={selectedEducation}
          selectedSkills={selectedSkills}
          includeHeadshot={includeHeadshot}
          includeContact={includeContact}
        />
      </div>
    </div>
  );
}

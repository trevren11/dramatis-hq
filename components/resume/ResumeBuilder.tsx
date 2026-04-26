"use client";

import * as React from "react";
import { Download, Loader2, Save, FolderOpen, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SectionSelector } from "./SectionSelector";
import { ResumePreview } from "./ResumePreview";
import { TEMPLATE_INFO } from "@/lib/resume/templates";
import type {
  TalentProfile,
  WorkHistoryItem,
  EducationItem,
  ResumeTemplate,
} from "@/lib/resume/types";

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

interface ResumeBuilderProps {
  profile: TalentProfile;
  savedResumes?: SavedResume[];
  onSaveResume?: (resume: Omit<SavedResume, "id">) => Promise<SavedResume>;
  onDeleteResume?: (id: string) => Promise<void>;
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

export function ResumeBuilder({
  profile,
  savedResumes = [],
  onSaveResume,
  onDeleteResume,
}: ResumeBuilderProps): React.ReactElement {
  const [selectedWorkHistory, setSelectedWorkHistory] = React.useState<string[]>(
    profile.workHistory.map((w) => w.id)
  );
  const [selectedEducation, setSelectedEducation] = React.useState<string[]>(
    profile.education.map((e) => e.id)
  );
  const [selectedSkills, setSelectedSkills] = React.useState<string[]>(profile.skills);
  const [includeHeadshot, setIncludeHeadshot] = React.useState(true);
  const [includeContact, setIncludeContact] = React.useState(true);
  const [includeHeight, setIncludeHeight] = React.useState(true);
  const [includeHair, setIncludeHair] = React.useState(true);
  const [includeEyes, setIncludeEyes] = React.useState(true);
  const [template, setTemplate] = React.useState<ResumeTemplate>("theatrical");
  const [isDownloading, setIsDownloading] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [currentResumeId, setCurrentResumeId] = React.useState<string | null>(null);
  const [resumeName, setResumeName] = React.useState("");
  const [showSaveDialog, setShowSaveDialog] = React.useState(false);

  const theaterCredits = profile.workHistory.filter((w) => w.category === "theater");
  const filmTvCredits = profile.workHistory.filter((w) =>
    ["film", "television"].includes(w.category)
  );
  const otherCredits = profile.workHistory.filter(
    (w) => !["theater", "film", "television"].includes(w.category)
  );

  const loadResume = (resume: SavedResume): void => {
    setCurrentResumeId(resume.id);
    setResumeName(resume.name);
    setTemplate(resume.template);
    setSelectedWorkHistory(resume.selectedWorkHistory);
    setSelectedEducation(resume.selectedEducation);
    setSelectedSkills(resume.selectedSkills);
    setIncludeHeadshot(resume.includeHeadshot);
    setIncludeContact(resume.includeContact);
    setIncludeHeight(resume.includeHeight);
    setIncludeHair(resume.includeHair);
    setIncludeEyes(resume.includeEyes);
  };

  const handleSaveResume = async (): Promise<void> => {
    if (!onSaveResume || !resumeName.trim()) return;
    setIsSaving(true);
    try {
      const saved = await onSaveResume({
        name: resumeName.trim(),
        template,
        selectedWorkHistory,
        selectedEducation,
        selectedSkills,
        includeHeadshot,
        includeContact,
        includeHeight,
        includeHair,
        includeEyes,
      });
      setCurrentResumeId(saved.id);
      setShowSaveDialog(false);
    } catch (error) {
      console.error("Save error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteResume = async (id: string): Promise<void> => {
    if (!onDeleteResume) return;
    try {
      await onDeleteResume(id);
      if (currentResumeId === id) {
        setCurrentResumeId(null);
        setResumeName("");
      }
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

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
          includeHeight,
          includeHair,
          includeEyes,
          template,
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
        {/* Saved Resumes Section */}
        {savedResumes.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <FolderOpen className="h-4 w-4" />
                My Resumes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {savedResumes.map((resume) => (
                  <div
                    key={resume.id}
                    className={`flex items-center justify-between rounded-lg border p-3 ${
                      currentResumeId === resume.id ? "border-primary bg-primary/5" : ""
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        loadResume(resume);
                      }}
                      className="flex-1 text-left"
                    >
                      <div className="font-medium">{resume.name}</div>
                      <div className="text-muted-foreground text-xs">
                        {TEMPLATE_INFO[resume.template].name} template
                      </div>
                    </button>
                    {onDeleteResume && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => void handleDeleteResume(resume.id)}
                      >
                        <Trash2 className="text-destructive h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Template Selection */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Template</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {(Object.keys(TEMPLATE_INFO) as ResumeTemplate[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setTemplate(key);
                  }}
                  className={`rounded-lg border p-3 text-left transition-colors ${
                    template === key ? "border-primary bg-primary/5" : "hover:border-primary/50"
                  }`}
                >
                  <div className="text-sm font-medium">{TEMPLATE_INFO[key].name}</div>
                  <div className="text-muted-foreground mt-1 text-xs">
                    {TEMPLATE_INFO[key].description}
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Resume Options */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Display Options</CardTitle>
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
                <span className="text-sm">Headshot</span>
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
                <span className="text-sm">Contact Info</span>
              </label>
            </div>
            <div className="border-t pt-4">
              <div className="text-muted-foreground mb-2 text-xs font-medium uppercase">
                Physical Attributes
              </div>
              <div className="flex flex-wrap gap-4">
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={includeHeight}
                    onChange={(e) => {
                      setIncludeHeight(e.target.checked);
                    }}
                    className="border-input h-4 w-4 rounded"
                  />
                  <span className="text-sm">Height</span>
                </label>
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={includeHair}
                    onChange={(e) => {
                      setIncludeHair(e.target.checked);
                    }}
                    className="border-input h-4 w-4 rounded"
                  />
                  <span className="text-sm">Hair Color</span>
                </label>
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={includeEyes}
                    onChange={(e) => {
                      setIncludeEyes(e.target.checked);
                    }}
                    className="border-input h-4 w-4 rounded"
                  />
                  <span className="text-sm">Eye Color</span>
                </label>
              </div>
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

        {/* Action Buttons */}
        <div className="flex gap-2">
          {onSaveResume && (
            <>
              {showSaveDialog ? (
                <Card className="w-full">
                  <CardContent className="pt-4">
                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="Resume name (e.g., Acting Resume, Commercial Resume)"
                        value={resumeName}
                        onChange={(e) => {
                          setResumeName(e.target.value);
                        }}
                        className="border-input w-full rounded-md border px-3 py-2 text-sm"
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={() => void handleSaveResume()}
                          disabled={isSaving || !resumeName.trim()}
                          className="flex-1"
                        >
                          {isSaving ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Save className="h-4 w-4" />
                          )}
                          Save
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowSaveDialog(false);
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowSaveDialog(true);
                  }}
                  className="flex-1"
                >
                  <Plus className="h-4 w-4" />
                  Save as New Resume
                </Button>
              )}
            </>
          )}
        </div>

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
          includeHeight={includeHeight}
          includeHair={includeHair}
          includeEyes={includeEyes}
          template={template}
        />
      </div>
    </div>
  );
}

"use client";

import { useState, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Plus, X, Search } from "lucide-react";
import { Select } from "@/components/ui/select";
import type { Skill } from "@/lib/db/schema";
import { SKILL_CATEGORIES, SKILL_CATEGORY_LABELS, COMMON_SKILLS } from "@/lib/db/schema/skills";

interface SkillsManagerProps {
  initialSkills: Skill[];
}

export function SkillsManager({ initialSkills }: SkillsManagerProps): React.ReactElement {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [skills, setSkills] = useState(initialSkills);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Skill[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [customSkill, setCustomSkill] = useState({
    name: "",
    category: "other" as (typeof SKILL_CATEGORIES)[number],
  });

  const searchSkills = useCallback(
    async (query: string): Promise<void> => {
      if (query.length < 2) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const response = await fetch(`/api/talent/skills?search=${encodeURIComponent(query)}`);
        if (response.ok) {
          const data = await response.json();
          const existingIds = new Set(skills.map((s) => s.id));
          setSearchResults(data.skills.filter((s: Skill) => !existingIds.has(s.id)));
        }
      } catch {
        console.error("Failed to search skills");
      } finally {
        setIsSearching(false);
      }
    },
    [skills]
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value;
    setSearchQuery(value);
    searchSkills(value);
  };

  const addSkill = (skill: Skill): void => {
    startTransition(async () => {
      try {
        const response = await fetch("/api/talent/skills", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ skillId: skill.id }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error ?? "Failed to add skill");
        }

        setSkills((prev) => [...prev, skill]);
        setSearchQuery("");
        setSearchResults([]);
        toast({ title: "Skill added" });
        router.refresh();
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to add skill",
        });
      }
    });
  };

  const addCustomSkill = (): void => {
    if (!customSkill.name.trim()) return;

    startTransition(async () => {
      try {
        const response = await fetch("/api/talent/skills", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(customSkill),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error ?? "Failed to add skill");
        }

        const data = await response.json();
        setSkills((prev) => [...prev, data.skill]);
        setCustomSkill({ name: "", category: "other" });
        setShowAddCustom(false);
        toast({ title: "Skill added" });
        router.refresh();
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to add skill",
        });
      }
    });
  };

  const removeSkill = (skillId: string): void => {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/talent/skills/${skillId}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          throw new Error("Failed to remove skill");
        }

        setSkills((prev) => prev.filter((s) => s.id !== skillId));
        toast({ title: "Skill removed" });
        router.refresh();
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to remove skill",
        });
      }
    });
  };

  const categoryOptions = SKILL_CATEGORIES.map((cat) => ({
    value: cat,
    label: SKILL_CATEGORY_LABELS[cat],
  }));

  const existingSkillNames = new Set(skills.map((s) => s.name.toLowerCase()));
  const suggestedSkills = COMMON_SKILLS.filter(
    (s) => !existingSkillNames.has(s.name.toLowerCase())
  ).slice(0, 12);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Special Skills</h1>
          <p className="text-muted-foreground text-sm">
            Add skills that make you stand out to producers
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="relative">
              <Search className="text-muted-foreground absolute top-3 left-3 h-4 w-4" />
              <Input
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search for a skill..."
                className="pl-9"
              />
              {isSearching && (
                <Loader2 className="absolute top-3 right-3 h-4 w-4 animate-spin" />
              )}
            </div>

            {searchResults.length > 0 && (
              <div className="rounded-lg border p-2">
                <div className="flex flex-wrap gap-2">
                  {searchResults.map((skill) => (
                    <Button
                      key={skill.id}
                      variant="outline"
                      size="sm"
                      onClick={() => { addSkill(skill); }}
                      disabled={isPending}
                    >
                      <Plus className="mr-1 h-3 w-3" />
                      {skill.name}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {searchQuery.length >= 2 && searchResults.length === 0 && !isSearching && (
              <div className="rounded-lg border p-4 text-center">
                <p className="text-muted-foreground mb-2 text-sm">
                  No matching skills found
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCustomSkill((prev) => ({ ...prev, name: searchQuery }));
                    setShowAddCustom(true);
                    setSearchQuery("");
                  }}
                >
                  <Plus className="mr-1 h-3 w-3" />
                  Add &quot;{searchQuery}&quot; as custom skill
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {showAddCustom && (
        <Card>
          <CardContent className="pt-6">
            <h3 className="mb-4 font-medium">Add Custom Skill</h3>
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="skillName" className="text-sm font-medium">
                    Skill Name
                  </label>
                  <Input
                    id="skillName"
                    value={customSkill.name}
                    onChange={(e) =>
                      { setCustomSkill((prev) => ({ ...prev, name: e.target.value })); }
                    }
                    placeholder="Enter skill name"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="skillCategory" className="text-sm font-medium">
                    Category
                  </label>
                  <Select
                    id="skillCategory"
                    value={customSkill.category}
                    onChange={(e) =>
                      { setCustomSkill((prev) => ({
                        ...prev,
                        category: e.target.value as (typeof SKILL_CATEGORIES)[number],
                      })); }
                    }
                    options={categoryOptions}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={addCustomSkill} disabled={isPending || !customSkill.name.trim()}>
                  {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Add Skill
                </Button>
                <Button variant="outline" onClick={() => { setShowAddCustom(false); }}>
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6">
          <h3 className="mb-4 font-medium">Your Skills ({skills.length})</h3>
          {skills.length === 0 ? (
            <p className="text-muted-foreground text-center text-sm">No skills added yet</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => (
                <Badge key={skill.id} variant="secondary" className="gap-1 pr-1">
                  {skill.name}
                  <button
                    onClick={() => { removeSkill(skill.id); }}
                    className="hover:bg-muted ml-1 rounded p-0.5"
                    disabled={isPending}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {suggestedSkills.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <h3 className="mb-4 font-medium">Suggested Skills</h3>
            <div className="flex flex-wrap gap-2">
              {suggestedSkills.map((skill) => (
                <Button
                  key={skill.name}
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    { startTransition(async () => {
                      try {
                        const response = await fetch("/api/talent/skills", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify(skill),
                        });

                        if (response.ok) {
                          const data = await response.json();
                          setSkills((prev) => [...prev, data.skill]);
                          router.refresh();
                        }
                      } catch {
                        console.error("Failed to add skill");
                      }
                    }); }
                  }
                  disabled={isPending}
                >
                  <Plus className="mr-1 h-3 w-3" />
                  {skill.name}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

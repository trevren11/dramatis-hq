"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Plus, X, Loader2 } from "lucide-react";
import { SKILL_CATEGORIES, SKILL_CATEGORY_LABELS, COMMON_SKILLS } from "@/lib/db/schema/skills";
import type { Skill } from "@/lib/db/schema/skills";

interface SkillsSectionProps {
  initialData: Skill[];
}

interface SkillsApiResponse {
  skill?: Skill;
  skills?: Skill[];
  error?: string;
}

export function SkillsSection({ initialData }: SkillsSectionProps): React.ReactElement {
  const { toast } = useToast();
  const [skills, setSkills] = useState<Skill[]>(initialData);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Skill[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => { document.removeEventListener("mousedown", handleClickOutside); };
  }, []);

  useEffect(() => {
    if (searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(() => {
      void (async () => {
        try {
          const response = await fetch(`/api/talent/skills?search=${encodeURIComponent(searchQuery)}`);
          if (response.ok) {
            const data: SkillsApiResponse = await response.json() as SkillsApiResponse;
            const existingIds = new Set(skills.map((s) => s.id));
            setSuggestions((data.skills ?? []).filter((s) => !existingIds.has(s.id)));
          }
        } catch {
          // Ignore search errors
        }
      })();
    }, 300);

    return () => { clearTimeout(timer); };
  }, [searchQuery, skills]);

  const addSkill = async (skill: Skill | { name: string; category: string }): Promise<void> => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/talent/skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify("id" in skill ? { skillId: skill.id } : skill),
      });

      if (!response.ok) {
        const errorData: SkillsApiResponse = await response.json() as SkillsApiResponse;
        throw new Error(errorData.error ?? "Failed to add skill");
      }

      const data: SkillsApiResponse = await response.json() as SkillsApiResponse;
      if (data.skill) {
        setSkills([...skills, data.skill]);
      }
      setSearchQuery("");
      setSuggestions([]);
      setShowSuggestions(false);
      toast({ title: "Success", description: "Skill added" });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add skill",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const removeSkill = async (skillId: string): Promise<void> => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/talent/skills/${skillId}`, { method: "DELETE" });

      if (!response.ok) {
        const errorData: SkillsApiResponse = await response.json() as SkillsApiResponse;
        throw new Error(errorData.error ?? "Failed to remove skill");
      }

      setSkills(skills.filter((s) => s.id !== skillId));
      toast({ title: "Success", description: "Skill removed" });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to remove skill",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === "Enter" && searchQuery.trim() && suggestions.length === 0) {
      e.preventDefault();
      void addSkill({ name: searchQuery.trim(), category: selectedCategory ?? "other" });
    }
  };

  const filteredCommonSkills = COMMON_SKILLS.filter(
    (cs) =>
      !skills.some((s) => s.name.toLowerCase() === cs.name.toLowerCase()) &&
      (!selectedCategory || cs.category === selectedCategory)
  );

  const groupedSkills = skills.reduce<Record<string, Skill[]>>(
    (acc, skill) => {
      const category = skill.category;
      acc[category] ??= [];
      acc[category].push(skill);
      return acc;
    },
    {}
  );

  return (
    <Card id="skills">
      <CardHeader>
        <CardTitle>Special Skills</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Search and Add */}
        <div ref={searchRef} className="relative">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => { setShowSuggestions(true); }}
                onKeyDown={handleKeyDown}
                placeholder="Search or add a skill..."
                disabled={isLoading}
              />
              {showSuggestions && suggestions.length > 0 && (
                <div className="bg-popover absolute top-full right-0 left-0 z-10 mt-1 max-h-60 overflow-auto rounded-lg border shadow-lg">
                  {suggestions.map((skill) => (
                    <button
                      key={skill.id}
                      type="button"
                      onClick={() => void addSkill(skill)}
                      className="hover:bg-muted flex w-full items-center justify-between px-4 py-2 text-left text-sm"
                    >
                      <span>{skill.name}</span>
                      <span className="text-muted-foreground text-xs">
                        {SKILL_CATEGORY_LABELS[skill.category]}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <select
              value={selectedCategory ?? ""}
              onChange={(e) => { setSelectedCategory(e.target.value || null); }}
              className="border-input bg-background rounded-lg border px-3 py-2 text-sm"
            >
              <option value="">All Categories</option>
              {SKILL_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {SKILL_CATEGORY_LABELS[cat]}
                </option>
              ))}
            </select>
          </div>
          <p className="text-muted-foreground mt-2 text-xs">
            Type to search existing skills or press Enter to add a new one
          </p>
        </div>

        {/* Current Skills */}
        {skills.length > 0 && (
          <div className="space-y-4">
            {Object.entries(groupedSkills).map(([category, categorySkills]) => (
              <div key={category}>
                <h4 className="text-muted-foreground mb-2 text-sm font-medium">
                  {SKILL_CATEGORY_LABELS[category as keyof typeof SKILL_CATEGORY_LABELS]}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {categorySkills.map((skill) => (
                    <Badge key={skill.id} variant="secondary" className="gap-1 pr-1">
                      {skill.name}
                      <button
                        type="button"
                        onClick={() => void removeSkill(skill.id)}
                        className="hover:bg-muted ml-1 rounded p-0.5"
                        disabled={isLoading}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Common Skills Suggestions */}
        {filteredCommonSkills.length > 0 && (
          <div>
            <h4 className="text-muted-foreground mb-3 text-sm font-medium">
              Quick Add Common Skills
            </h4>
            <div className="flex flex-wrap gap-2">
              {filteredCommonSkills.slice(0, 12).map((skill) => (
                <Button
                  key={skill.name}
                  variant="outline"
                  size="sm"
                  onClick={() => void addSkill(skill)}
                  disabled={isLoading}
                  className="h-7 text-xs"
                >
                  <Plus className="mr-1 h-3 w-3" />
                  {skill.name}
                </Button>
              ))}
            </div>
          </div>
        )}

        {isLoading && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

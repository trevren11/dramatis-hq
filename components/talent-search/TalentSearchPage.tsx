"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { TalentSearchFilters, type TalentSearchFiltersValues } from "./TalentSearchFilters";
import { TalentSearchResults } from "./TalentSearchResults";
import { TalentPreviewModal } from "./TalentPreviewModal";
import { SaveSearchDialog } from "./SaveSearchDialog";
import { AddToListDialog } from "./AddToListDialog";
import type { TalentCardData } from "./TalentCard";
import { Bookmark, FolderOpen, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useToast } from "@/components/ui/use-toast";

interface TalentList {
  id: string;
  name: string;
  description?: string | null;
  color?: string | null;
  memberCount: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface SearchResponse {
  results: TalentCardData[];
  pagination: Pagination;
}

const DEFAULT_FILTERS: TalentSearchFiltersValues = {};

export function TalentSearchPage(): React.ReactElement {
  const router = useRouter();
  const { toast } = useToast();

  // Search state
  const [filters, setFilters] = useState<TalentSearchFiltersValues>(DEFAULT_FILTERS);
  const [results, setResults] = useState<TalentCardData[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [sortOrder, setSortOrder] = useState("relevance");

  // Modal state
  const [previewTalent, setPreviewTalent] = useState<TalentCardData | null>(null);
  const [showSaveSearch, setShowSaveSearch] = useState(false);
  const [showAddToList, setShowAddToList] = useState(false);
  const [addToListTalent, setAddToListTalent] = useState<TalentCardData | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Lists
  const [talentLists, setTalentLists] = useState<TalentList[]>([]);

  // Mobile filter sidebar
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Available skills for filter autocomplete
  const [availableSkills, setAvailableSkills] = useState<string[]>([]);

  // Fetch skills on mount
  useEffect(() => {
    async function fetchSkills(): Promise<void> {
      try {
        const response = await fetch("/api/skills");
        if (response.ok) {
          const data = (await response.json()) as { skills?: { name: string }[] };
          setAvailableSkills(data.skills?.map((s) => s.name) ?? []);
        }
      } catch {
        // Ignore errors
      }
    }
    void fetchSkills();
  }, []);

  // Fetch talent lists
  useEffect(() => {
    async function fetchLists(): Promise<void> {
      try {
        const response = await fetch("/api/producer/talent/lists");
        if (response.ok) {
          const data = (await response.json()) as { talentLists?: TalentList[] };
          setTalentLists(data.talentLists ?? []);
        }
      } catch {
        // Ignore errors
      }
    }
    void fetchLists();
  }, []);

  const performSearch = useCallback(
    // eslint-disable-next-line complexity
    async (page = 1) => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("limit", String(pagination.limit));
        if (filters.location) params.set("location", filters.location);
        if (filters.heightMin != null) params.set("heightMin", String(filters.heightMin));
        if (filters.heightMax != null) params.set("heightMax", String(filters.heightMax));
        if (filters.ageMin != null) params.set("ageMin", String(filters.ageMin));
        if (filters.ageMax != null) params.set("ageMax", String(filters.ageMax));
        if (filters.hairColors?.length) params.set("hairColors", filters.hairColors.join(","));
        if (filters.eyeColors?.length) params.set("eyeColors", filters.eyeColors.join(","));
        if (filters.ethnicities?.length) params.set("ethnicities", filters.ethnicities.join(","));
        if (filters.vocalRanges?.length) params.set("vocalRanges", filters.vocalRanges.join(","));
        if (filters.genders?.length) params.set("genders", filters.genders.join(","));
        if (filters.skills?.length) params.set("skills", filters.skills.join(","));
        if (filters.willingToCutHair) params.set("willingToCutHair", "true");
        if (filters.mustBe18Plus) params.set("mustBe18Plus", "true");

        const response = await fetch(`/api/producer/talent/search?${params.toString()}`);

        if (!response.ok) {
          throw new Error("Search failed");
        }

        const data = (await response.json()) as SearchResponse;
        setResults(data.results);
        setPagination(data.pagination);
      } catch {
        toast({
          title: "Search failed",
          description: "Unable to search talent. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [filters, pagination.limit, toast]
  );

  const handleSearch = useCallback(() => {
    void performSearch(1);
    setShowMobileFilters(false);
  }, [performSearch]);

  const handleReset = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  const handlePageChange = useCallback(
    (page: number) => {
      void performSearch(page);
    },
    [performSearch]
  );

  const handleSortChange = useCallback((sort: string) => {
    setSortOrder(sort);
  }, []);

  const handlePreview = useCallback((talent: TalentCardData) => {
    setPreviewTalent(talent);
  }, []);

  const handleMessage = useCallback(
    (talent: TalentCardData) => {
      router.push(`/messages/compose?to=${talent.id}`);
    },
    [router]
  );

  const handleAddToList = useCallback((talent: TalentCardData) => {
    setAddToListTalent(talent);
    setShowAddToList(true);
  }, []);

  const handleSaveSearch = useCallback(
    async (data: { name: string; description?: string; notifyOnMatch: boolean }) => {
      setIsSaving(true);
      try {
        const response = await fetch("/api/producer/talent/saved-searches", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...data,
            filters,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to save search");
        }

        toast({
          title: "Search saved",
          description: `"${data.name}" has been saved to your searches.`,
        });
      } catch {
        toast({
          title: "Save failed",
          description: "Unable to save search. Please try again.",
          variant: "destructive",
        });
        throw new Error("Failed to save");
      } finally {
        setIsSaving(false);
      }
    },
    [filters, toast]
  );

  const handleAddTalentToList = useCallback(
    async (listId: string, notes?: string) => {
      if (!addToListTalent) return;

      setIsSaving(true);
      try {
        const response = await fetch(`/api/producer/talent/lists/${listId}/members`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            talentProfileId: addToListTalent.id,
            notes,
          }),
        });

        if (!response.ok) {
          const errorData = (await response.json()) as { error?: string };
          if (response.status === 409) {
            toast({
              title: "Already in list",
              description: "This talent is already in the selected list.",
            });
            return;
          }
          throw new Error(errorData.error ?? "Failed to add to list");
        }

        toast({
          title: "Added to list",
          description: `${addToListTalent.firstName} has been added to the list.`,
        });

        // Refresh lists
        const listsResponse = await fetch("/api/producer/talent/lists");
        if (listsResponse.ok) {
          const listsData = (await listsResponse.json()) as { talentLists?: TalentList[] };
          setTalentLists(listsData.talentLists ?? []);
        }
      } catch {
        toast({
          title: "Failed to add",
          description: "Unable to add talent to list. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsSaving(false);
      }
    },
    [addToListTalent, toast]
  );

  const handleCreateList = useCallback(
    async (data: { name: string; description?: string; color: string }): Promise<string> => {
      const response = await fetch("/api/producer/talent/lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to create list");
      }

      const result = (await response.json()) as { talentList: { id: string } };
      return result.talentList.id;
    },
    []
  );

  const filterPanel = (
    <TalentSearchFilters
      filters={filters}
      onFiltersChange={setFilters}
      onSearch={handleSearch}
      onReset={handleReset}
      availableSkills={availableSkills}
      isLoading={isLoading}
    />
  );

  return (
    <div className="container py-6">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Find Talent</h1>
          <p className="text-muted-foreground">Search and discover talent for your productions</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setShowSaveSearch(true);
            }}
          >
            <Bookmark className="mr-2 h-4 w-4" />
            Save Search
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              router.push("/producer/talent-lists");
            }}
          >
            <FolderOpen className="mr-2 h-4 w-4" />
            My Lists
          </Button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Desktop filters */}
        <aside className="hidden w-72 flex-shrink-0 lg:block">{filterPanel}</aside>

        {/* Mobile filter button */}
        <Sheet open={showMobileFilters} onOpenChange={setShowMobileFilters}>
          <SheetTrigger asChild className="lg:hidden">
            <Button variant="outline" className="mb-4 w-full">
              <Menu className="mr-2 h-4 w-4" />
              Filters
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80 overflow-y-auto p-4">
            {filterPanel}
          </SheetContent>
        </Sheet>

        {/* Results */}
        <main className="min-w-0 flex-1">
          <TalentSearchResults
            results={results}
            pagination={pagination}
            isLoading={isLoading}
            onPageChange={handlePageChange}
            onPreview={handlePreview}
            onMessage={handleMessage}
            onAddToList={handleAddToList}
            sortOrder={sortOrder}
            onSortChange={handleSortChange}
          />
        </main>
      </div>

      {/* Preview modal */}
      <TalentPreviewModal
        talent={previewTalent}
        isOpen={previewTalent !== null}
        onClose={() => {
          setPreviewTalent(null);
        }}
        onMessage={handleMessage}
        onAddToList={handleAddToList}
      />

      {/* Save search dialog */}
      <SaveSearchDialog
        isOpen={showSaveSearch}
        onClose={() => {
          setShowSaveSearch(false);
        }}
        onSave={handleSaveSearch}
        filters={filters}
        isLoading={isSaving}
      />

      {/* Add to list dialog */}
      <AddToListDialog
        isOpen={showAddToList}
        onClose={() => {
          setShowAddToList(false);
          setAddToListTalent(null);
        }}
        talent={addToListTalent}
        lists={talentLists}
        onAddToList={handleAddTalentToList}
        onCreateList={handleCreateList}
        isLoading={isSaving}
      />
    </div>
  );
}

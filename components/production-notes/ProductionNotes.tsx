"use client";

import React, { useState, useCallback, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/use-toast";
import { DepartmentPanel } from "./DepartmentPanel";
import { ActivityFeed } from "./ActivityFeed";
import { CreateDepartmentDialog } from "./CreateDepartmentDialog";
import {
  Plus,
  Activity,
  Lightbulb,
  Video,
  Sparkles,
  Shirt,
  Mountain,
  BookOpen,
  ClipboardList,
  Package,
  Music,
  Volume2,
  Users,
  Folder,
} from "lucide-react";
import type { ProductionDepartment, DepartmentType } from "@/lib/db/schema/production-notes";

interface ProductionNotesProps {
  showId: string;
  showTitle: string;
  initialDepartments: ProductionDepartment[];
}

const DEPARTMENT_ICONS: Record<DepartmentType, React.ComponentType<{ className?: string }>> = {
  lighting: Lightbulb,
  director: Video,
  makeup_hair: Sparkles,
  costuming: Shirt,
  scenic: Mountain,
  dramaturg: BookOpen,
  ad_notes: ClipboardList,
  props: Package,
  choreographer: Music,
  sound: Volume2,
  stage_management: Users,
  custom: Folder,
};

export function ProductionNotes({
  showId,
  showTitle,
  initialDepartments,
}: ProductionNotesProps): React.ReactElement {
  const { toast } = useToast();
  const [departments, setDepartments] = useState(initialDepartments);
  const [activeDepartment, setActiveDepartment] = useState<string>(
    initialDepartments[0]?.id ?? "activity"
  );
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const refreshDepartments = useCallback(async () => {
    try {
      const response = await fetch(`/api/shows/${showId}/production-notes/departments`);
      if (response.ok) {
        const data = (await response.json()) as { departments: ProductionDepartment[] };
        setDepartments(data.departments);
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to refresh departments",
        variant: "destructive",
      });
    }
  }, [showId, toast]);

  const handleCreateDepartment = useCallback(
    async (data: { name: string; type: DepartmentType; description?: string; color?: string }) => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/shows/${showId}/production-notes/departments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const errorData = (await response.json()) as { error?: string };
          throw new Error(errorData.error ?? "Failed to create department");
        }

        const result = (await response.json()) as { department: ProductionDepartment };
        setDepartments((prev) => [...prev, result.department]);
        setActiveDepartment(result.department.id);
        setShowCreateDialog(false);
        toast({
          title: "Department created",
          description: `${result.department.name} has been created`,
        });
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to create department",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [showId, toast]
  );

  const handleInitializeDefaults = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/shows/${showId}/production-notes/departments`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          departmentTypes: ["lighting", "director", "costuming", "scenic", "props", "sound"],
        }),
      });

      if (response.ok) {
        const data = (await response.json()) as { departments: ProductionDepartment[] };
        setDepartments(data.departments);
        const firstDept = data.departments[0];
        if (firstDept) {
          setActiveDepartment(firstDept.id);
        }
        toast({
          title: "Departments initialized",
          description: "Default departments have been created",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to initialize departments",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [showId, toast]);

  useEffect(() => {
    if (departments.length === 0 && activeDepartment !== "activity") {
      setActiveDepartment("activity");
    }
  }, [departments, activeDepartment]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-6 py-4">
        <div>
          <h1 className="text-2xl font-bold">Production Notes</h1>
          <p className="text-muted-foreground text-sm">{showTitle}</p>
        </div>
        <div className="flex gap-2">
          {departments.length === 0 && (
            <Button
              variant="outline"
              onClick={() => {
                void handleInitializeDefaults();
              }}
              disabled={isLoading}
            >
              Initialize Default Departments
            </Button>
          )}
          <Button
            onClick={() => {
              setShowCreateDialog(true);
            }}
            disabled={isLoading}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Department
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <Tabs
          value={activeDepartment}
          onValueChange={setActiveDepartment}
          className="flex flex-1 flex-col overflow-hidden"
          orientation="vertical"
        >
          <div className="flex h-full">
            <ScrollArea className="w-56 shrink-0 border-r">
              <TabsList className="flex h-auto flex-col items-stretch gap-1 bg-transparent p-2">
                {departments.map((dept) => {
                  const Icon = DEPARTMENT_ICONS[dept.type];
                  return (
                    <TabsTrigger
                      key={dept.id}
                      value={dept.id}
                      className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground justify-start gap-2 px-3 py-2 text-left"
                    >
                      <span style={{ color: dept.color ?? undefined }}>
                        <Icon className="h-4 w-4 shrink-0" />
                      </span>
                      <span className="truncate">{dept.name}</span>
                    </TabsTrigger>
                  );
                })}
                <TabsTrigger
                  value="activity"
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground justify-start gap-2 px-3 py-2 text-left"
                >
                  <Activity className="h-4 w-4 shrink-0" />
                  <span>Activity Feed</span>
                </TabsTrigger>
              </TabsList>
            </ScrollArea>

            <div className="flex-1 overflow-hidden">
              {departments.map((dept) => (
                <TabsContent key={dept.id} value={dept.id} className="m-0 h-full">
                  <DepartmentPanel
                    showId={showId}
                    department={dept}
                    onDepartmentUpdated={() => {
                      void refreshDepartments();
                    }}
                  />
                </TabsContent>
              ))}
              <TabsContent value="activity" className="m-0 h-full">
                <ActivityFeed showId={showId} />
              </TabsContent>
            </div>
          </div>
        </Tabs>
      </div>

      <CreateDepartmentDialog
        isOpen={showCreateDialog}
        onClose={() => {
          setShowCreateDialog(false);
        }}
        onSubmit={handleCreateDepartment}
        existingTypes={departments.map((d) => d.type)}
        isLoading={isLoading}
      />
    </div>
  );
}

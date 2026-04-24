"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RoleCard } from "./RoleCard";
import { RoleFormDialog } from "./RoleFormDialog";
import { useToast } from "@/components/ui/toast";
import { Plus } from "lucide-react";
import type { Role } from "@/lib/db/schema/roles";

interface RoleListProps {
  showId: string;
  initialRoles: Role[];
  onRolesChange?: (roles: Role[]) => void;
}

export function RoleList({
  showId,
  initialRoles,
  onRolesChange,
}: RoleListProps): React.ReactElement {
  const { toast } = useToast();
  const [roles, setRoles] = useState<Role[]>(initialRoles);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | undefined>();

  const updateRoles = (newRoles: Role[]): void => {
    setRoles(newRoles);
    onRolesChange?.(newRoles);
  };

  const handleAddRole = (): void => {
    setEditingRole(undefined);
    setDialogOpen(true);
  };

  const handleEditRole = (role: Role): void => {
    setEditingRole(role);
    setDialogOpen(true);
  };

  const handleRoleSuccess = (role: Role): void => {
    if (editingRole) {
      // Update existing role
      updateRoles(roles.map((r) => (r.id === role.id ? role : r)));
      toast({ title: "Role updated", description: `Updated "${role.name}"` });
    } else {
      // Add new role
      updateRoles([...roles, role]);
      toast({ title: "Role added", description: `Added "${role.name}"` });
    }
  };

  const handleDeleteRole = async (roleId: string): Promise<void> => {
    const role = roles.find((r) => r.id === roleId);
    if (!confirm(`Are you sure you want to delete "${role?.name}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/shows/${showId}/roles/${roleId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete role");

      updateRoles(roles.filter((r) => r.id !== roleId));
      toast({ title: "Role deleted", description: `Deleted "${role?.name}"` });
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete role",
        variant: "destructive",
      });
    }
  };

  const handleMoveRole = async (roleId: string, direction: "up" | "down"): Promise<void> => {
    const index = roles.findIndex((r) => r.id === roleId);
    if (index === -1) return;

    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= roles.length) return;

    // Create new array with swapped roles
    const newRoles = [...roles];
    const temp = newRoles[index];
    if (temp && newRoles[newIndex]) {
      newRoles[index] = newRoles[newIndex]!;
      newRoles[newIndex] = temp;
    }

    // Update sortOrder for all affected roles
    const updates = newRoles.map((role, idx) => ({
      id: role.id,
      sortOrder: idx,
    }));

    // Optimistic update
    updateRoles(newRoles);

    try {
      const response = await fetch(`/api/shows/${showId}/roles/reorder`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roles: updates }),
      });

      if (!response.ok) throw new Error("Failed to reorder roles");

      const data = (await response.json()) as { roles: Role[] };
      updateRoles(data.roles);
    } catch {
      // Revert on error
      updateRoles(roles);
      toast({
        title: "Error",
        description: "Failed to reorder roles",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Roles</h2>
          <p className="text-muted-foreground text-sm">
            {roles.length} role{roles.length !== 1 && "s"} defined
          </p>
        </div>
        <Button onClick={handleAddRole}>
          <Plus className="mr-2 h-4 w-4" />
          Add Role
        </Button>
      </div>

      {roles.length === 0 ? (
        <div className="border-border rounded-xl border border-dashed p-12 text-center">
          <h3 className="text-lg font-semibold">No roles yet</h3>
          <p className="text-muted-foreground mt-1">
            Add roles to define the cast for your production
          </p>
          <Button onClick={handleAddRole} className="mt-4">
            <Plus className="mr-2 h-4 w-4" />
            Add First Role
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {roles.map((role, index) => (
            <RoleCard
              key={role.id}
              role={role}
              isFirst={index === 0}
              isLast={index === roles.length - 1}
              onEdit={() => handleEditRole(role)}
              onDelete={() => handleDeleteRole(role.id)}
              onMoveUp={() => handleMoveRole(role.id, "up")}
              onMoveDown={() => handleMoveRole(role.id, "down")}
            />
          ))}
        </div>
      )}

      <RoleFormDialog
        showId={showId}
        role={editingRole}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={handleRoleSuccess}
      />
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
} from "@/components/ui/modal";
import { RoleForm } from "./RoleForm";
import { Loader2 } from "lucide-react";
import type { Role } from "@/lib/db/schema/roles";
import type { RoleCreate } from "@/lib/validations/shows";

interface RoleFormDialogProps {
  showId: string;
  role?: Role;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (role: Role) => void;
}

export function RoleFormDialog({
  showId,
  role,
  open,
  onOpenChange,
  onSuccess,
}: RoleFormDialogProps): React.ReactElement {
  const isEditing = !!role;
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<RoleCreate>>(() => {
    if (role) {
      return {
        name: role.name,
        description: role.description,
        type: role.type ?? "supporting",
        ageRangeMin: role.ageRangeMin,
        ageRangeMax: role.ageRangeMax,
        vocalRange: role.vocalRange,
        notes: role.notes,
        positionCount: role.positionCount ?? 1,
      };
    }
    return {
      name: "",
      type: "supporting",
      positionCount: 1,
    };
  });

  const handleSubmit = (): void => {
    setError(null);
    startTransition(async () => {
      try {
        const url = isEditing
          ? `/api/shows/${showId}/roles/${role.id}`
          : `/api/shows/${showId}/roles`;

        const response = await fetch(url, {
          method: isEditing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        if (!response.ok) {
          const data = (await response.json()) as { error?: string };
          throw new Error(data.error ?? "Failed to save role");
        }

        const data = (await response.json()) as { role: Role };
        onSuccess(data.role);
        onOpenChange(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  };

  // Reset form when dialog opens with different role
  const handleOpenChange = (newOpen: boolean): void => {
    if (newOpen && role) {
      setFormData({
        name: role.name,
        description: role.description,
        type: role.type ?? "supporting",
        ageRangeMin: role.ageRangeMin,
        ageRangeMax: role.ageRangeMax,
        vocalRange: role.vocalRange,
        notes: role.notes,
        positionCount: role.positionCount ?? 1,
      });
    } else if (newOpen && !role) {
      setFormData({
        name: "",
        type: "supporting",
        positionCount: 1,
      });
    }
    setError(null);
    onOpenChange(newOpen);
  };

  const isValid = formData.name && formData.name.length > 0;

  return (
    <Modal open={open} onOpenChange={handleOpenChange}>
      <ModalContent className="max-w-xl">
        <ModalHeader>
          <ModalTitle>{isEditing ? "Edit Role" : "Add New Role"}</ModalTitle>
          <ModalDescription>
            {isEditing
              ? "Update the details for this role"
              : "Define a new role for your production"}
          </ModalDescription>
        </ModalHeader>

        {error && (
          <div className="bg-destructive/10 text-destructive rounded-lg p-3 text-sm">{error}</div>
        )}

        <RoleForm
          data={formData}
          onUpdate={(data) => {
            setFormData({ ...formData, ...data });
          }}
        />

        <ModalFooter>
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
            }}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid || isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : isEditing ? (
              "Save Changes"
            ) : (
              "Add Role"
            )}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
} from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import {
  ORGANIZATION_ROLE_OPTIONS,
  SHOW_ROLE_OPTIONS,
  ORGANIZATION_ROLE_VALUES,
  SHOW_ROLE_VALUES,
} from "@/lib/db/schema/permissions";

// Organization invitation schema
const organizationInviteSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  role: z.enum(ORGANIZATION_ROLE_VALUES),
});

// Show invitation schema
const showInviteSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  role: z.enum(SHOW_ROLE_VALUES),
});

type OrganizationInviteData = z.infer<typeof organizationInviteSchema>;
type ShowInviteData = z.infer<typeof showInviteSchema>;

interface InviteStaffDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "organization" | "show";
  targetId: string;
  targetName: string;
  onSuccess?: () => void;
}

export function InviteStaffDialog({
  open,
  onOpenChange,
  type,
  targetId,
  targetName,
  onSuccess,
}: InviteStaffDialogProps): React.ReactElement {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const schema = type === "organization" ? organizationInviteSchema : showInviteSchema;
  const roleOptions = type === "organization" ? ORGANIZATION_ROLE_OPTIONS : SHOW_ROLE_OPTIONS;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<OrganizationInviteData | ShowInviteData>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      role: type === "organization" ? "producer" : "crew_member",
    },
  });

  const onSubmit = async (data: OrganizationInviteData | ShowInviteData): Promise<void> => {
    setIsSubmitting(true);

    try {
      const endpoint =
        type === "organization"
          ? `/api/organizations/${targetId}/invitations`
          : `/api/shows/${targetId}/staff/invitations`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = (await response.json()) as { error?: string };
        throw new Error(errorData.error ?? "Failed to send invitation");
      }

      toast({
        title: "Invitation sent",
        description: `An invitation has been sent to ${data.email}`,
      });

      reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send invitation",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent>
        <form
          onSubmit={(e) => {
            void handleSubmit(onSubmit)(e);
          }}
        >
          <ModalHeader>
            <ModalTitle>Invite Staff to {targetName}</ModalTitle>
            <ModalDescription>
              Send an invitation to join{" "}
              {type === "organization" ? "your organization" : "this show"} with a specific role.
            </ModalDescription>
          </ModalHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                placeholder="colleague@example.com"
                {...register("email")}
              />
              {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <label htmlFor="role" className="text-sm font-medium">
                Role
              </label>
              <select
                id="role"
                className="w-full rounded-md border px-3 py-2"
                {...register("role")}
              >
                {roleOptions
                  .filter((option) => option.value !== "owner")
                  .map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label} - {option.description}
                    </option>
                  ))}
              </select>
              {errors.role && <p className="text-sm text-red-500">{errors.role.message}</p>}
            </div>
          </div>

          <ModalFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Sending..." : "Send Invitation"}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}

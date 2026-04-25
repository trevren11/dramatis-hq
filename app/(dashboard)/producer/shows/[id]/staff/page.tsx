"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import {
  StaffList,
  InviteStaffDialog,
  PendingInvitations,
  PermissionMatrix,
} from "@/components/staff";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface StaffMember {
  id: string;
  userId: string;
  role: string;
  invitedAt: string;
  acceptedAt: string | null;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  } | null;
}

interface Invitation {
  id: string;
  email: string;
  type: string;
  targetId: string;
  role: string;
  token: string;
  status: string;
  expiresAt: string;
  invitedAt: string;
  invitedBy: string;
  acceptedAt: string | null;
  respondedBy: string | null;
}

interface Show {
  id: string;
  title: string;
}

interface ShowResponse {
  show: {
    id: string;
    title: string;
  };
}

interface MembersResponse {
  members: StaffMember[];
}

interface InvitationsResponse {
  invitations: Invitation[];
}

interface ApiError {
  error?: string;
}

export default function ShowStaffPage(): React.ReactElement {
  const params = useParams();
  const showId = params.id as string;
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(true);
  const [members, setMembers] = React.useState<StaffMember[]>([]);
  const [invitations, setInvitations] = React.useState<Invitation[]>([]);
  const [show, setShow] = React.useState<Show | null>(null);
  const [inviteDialogOpen, setInviteDialogOpen] = React.useState(false);

  const fetchData = React.useCallback(async () => {
    try {
      // Fetch show details
      const showRes = await fetch(`/api/shows/${showId}`);
      if (!showRes.ok) {
        throw new Error("Failed to fetch show");
      }
      const showData = (await showRes.json()) as ShowResponse;
      setShow({
        id: showData.show.id,
        title: showData.show.title,
      });

      // Fetch members
      const membersRes = await fetch(`/api/shows/${showId}/staff/members`);
      if (membersRes.ok) {
        const membersData = (await membersRes.json()) as MembersResponse;
        setMembers(membersData.members);
      }

      // Fetch pending invitations
      const invitationsRes = await fetch(`/api/shows/${showId}/staff/invitations`);
      if (invitationsRes.ok) {
        const invitationsData = (await invitationsRes.json()) as InvitationsResponse;
        setInvitations(invitationsData.invitations);
      }
    } catch (error) {
      console.error("Error fetching staff data:", error);
      toast({
        title: "Error",
        description: "Failed to load staff data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [showId, toast]);

  React.useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const handleChangeRole = (memberId: string, newRole: string): void => {
    const updateRole = async (): Promise<void> => {
      try {
        const response = await fetch(`/api/shows/${showId}/staff/members`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ memberId, role: newRole }),
        });

        if (!response.ok) {
          const data = (await response.json()) as ApiError;
          throw new Error(data.error ?? "Failed to update role");
        }

        toast({
          title: "Role updated",
          description: "The member's role has been updated",
        });

        void fetchData();
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to update role",
          variant: "destructive",
        });
      }
    };

    void updateRole();
  };

  const handleRemove = (memberId: string): void => {
    if (!confirm("Are you sure you want to remove this member?")) {
      return;
    }

    const removeMember = async (): Promise<void> => {
      try {
        const response = await fetch(`/api/shows/${showId}/staff/members`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ memberId }),
        });

        if (!response.ok) {
          const data = (await response.json()) as ApiError;
          throw new Error(data.error ?? "Failed to remove member");
        }

        toast({
          title: "Member removed",
          description: "The member has been removed from the show",
        });

        void fetchData();
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to remove member",
          variant: "destructive",
        });
      }
    };

    void removeMember();
  };

  const handleInvite = (): void => {
    setInviteDialogOpen(true);
  };

  const handleRefresh = (): void => {
    void fetchData();
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <Skeleton className="mb-8 h-10 w-48" />
        <Skeleton className="mb-4 h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!show) {
    return (
      <div className="container mx-auto py-8">
        <p className="text-muted-foreground">Show not found</p>
        <Button asChild className="mt-4">
          <Link href="/producer/shows">Back to Shows</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Staff - {show.title}</h1>
          <p className="text-muted-foreground">Manage team members working on this show</p>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/producer/shows/${showId}`}>Back to Show</Link>
        </Button>
      </div>

      <Tabs defaultValue="members" className="space-y-6">
        <TabsList>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="invitations">
            Pending Invitations
            {invitations.length > 0 && (
              <span className="bg-primary text-primary-foreground ml-2 rounded-full px-2 py-0.5 text-xs">
                {invitations.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="permissions">Permission Matrix</TabsTrigger>
        </TabsList>

        <TabsContent value="members">
          <StaffList
            members={members.map((m) => ({
              ...m,
              invitedAt: new Date(m.invitedAt),
              acceptedAt: m.acceptedAt ? new Date(m.acceptedAt) : null,
              role: m.role as never,
            }))}
            type="show"
            title="Show Staff"
            description={`Team members of ${show.title}`}
            canManage={true}
            onChangeRole={handleChangeRole}
            onRemove={handleRemove}
            onInvite={handleInvite}
          />
        </TabsContent>

        <TabsContent value="invitations">
          <PendingInvitations
            invitations={invitations.map((i) => ({
              ...i,
              expiresAt: new Date(i.expiresAt),
              invitedAt: new Date(i.invitedAt),
              acceptedAt: i.acceptedAt ? new Date(i.acceptedAt) : null,
              type: i.type as "organization" | "show",
              status: i.status as "pending" | "accepted" | "declined" | "expired",
            }))}
            type="show"
            targetId={showId}
            onRefresh={handleRefresh}
          />
        </TabsContent>

        <TabsContent value="permissions">
          <PermissionMatrix type="show" />
        </TabsContent>
      </Tabs>

      <InviteStaffDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
        type="show"
        targetId={showId}
        targetName={show.title}
        onSuccess={handleRefresh}
      />
    </div>
  );
}

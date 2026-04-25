"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  ORGANIZATION_ROLE_OPTIONS,
  SHOW_ROLE_OPTIONS,
  type OrganizationRole,
  type ShowRole,
} from "@/lib/db/schema/permissions";

interface StaffMember {
  id: string;
  userId: string;
  role: OrganizationRole | ShowRole;
  invitedAt: Date;
  acceptedAt: Date | null;
  isOwner?: boolean;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  } | null;
}

interface StaffListProps {
  members: StaffMember[];
  type: "organization" | "show";
  title: string;
  description: string;
  canManage: boolean;
  onChangeRole?: (memberId: string, newRole: string) => void;
  onRemove?: (memberId: string) => void;
  onInvite?: () => void;
}

export function StaffList({
  members,
  type,
  title,
  description,
  canManage,
  onChangeRole,
  onRemove,
  onInvite,
}: StaffListProps): React.ReactElement {
  const roleOptions = type === "organization" ? ORGANIZATION_ROLE_OPTIONS : SHOW_ROLE_OPTIONS;

  const getRoleLabel = (role: string): string => {
    const option = roleOptions.find((r) => r.value === role);
    return option?.label ?? role;
  };

  const getRoleColor = (role: string): string => {
    const colors: Record<string, string> = {
      owner: "bg-purple-100 text-purple-800",
      admin: "bg-blue-100 text-blue-800",
      producer: "bg-green-100 text-green-800",
      associate_producer: "bg-teal-100 text-teal-800",
      director: "bg-red-100 text-red-800",
      music_director: "bg-orange-100 text-orange-800",
      choreographer: "bg-pink-100 text-pink-800",
      stage_manager: "bg-indigo-100 text-indigo-800",
      assistant_stage_manager: "bg-cyan-100 text-cyan-800",
      production_manager: "bg-amber-100 text-amber-800",
      technical_director: "bg-slate-100 text-slate-800",
      lighting_designer: "bg-yellow-100 text-yellow-800",
      sound_designer: "bg-violet-100 text-violet-800",
      costume_designer: "bg-rose-100 text-rose-800",
      scenic_designer: "bg-emerald-100 text-emerald-800",
      props_master: "bg-lime-100 text-lime-800",
      hair_makeup_designer: "bg-fuchsia-100 text-fuchsia-800",
      dramaturg: "bg-sky-100 text-sky-800",
      assistant_director: "bg-stone-100 text-stone-800",
      crew_member: "bg-gray-100 text-gray-800",
    };
    return colors[role] ?? "bg-gray-100 text-gray-800";
  };

  const getInitials = (name: string | null, email: string): string => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return email.slice(0, 2).toUpperCase();
  };

  const formatDate = (date: Date | null): string => {
    if (!date) return "Pending";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (members.length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          {canManage && onInvite && <Button onClick={onInvite}>Invite Staff</Button>}
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">No staff members yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        {canManage && onInvite && <Button onClick={onInvite}>Invite Staff</Button>}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* eslint-disable-next-line complexity */}
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
            >
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={member.user?.image ?? undefined} />
                  <AvatarFallback>
                    {getInitials(member.user?.name ?? null, member.user?.email ?? "")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">
                      {member.user?.name ?? member.user?.email ?? "Unknown"}
                    </p>
                    <Badge className={getRoleColor(member.role)}>{getRoleLabel(member.role)}</Badge>
                    {member.isOwner && <Badge variant="outline">Organization Owner</Badge>}
                  </div>
                  <p className="text-muted-foreground text-sm">
                    {member.user?.email ?? "No email"}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    Joined {formatDate(member.acceptedAt)}
                  </p>
                </div>
              </div>
              {canManage && !member.isOwner && (
                <div className="flex gap-2">
                  {onChangeRole && (
                    <select
                      className="rounded border px-2 py-1 text-sm"
                      value={member.role}
                      onChange={(e) => {
                        onChangeRole(member.id, e.target.value);
                      }}
                    >
                      {roleOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  )}
                  {onRemove && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        onRemove(member.id);
                      }}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

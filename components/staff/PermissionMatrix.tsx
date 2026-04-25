"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ORGANIZATION_ROLE_OPTIONS,
  SHOW_ROLE_OPTIONS,
  type OrganizationRole,
  type ShowRole,
} from "@/lib/db/schema/permissions";
import {
  PERMISSIONS,
  ORGANIZATION_ROLE_PERMISSIONS,
  SHOW_ROLE_PERMISSIONS,
  type Permission,
} from "@/lib/permissions/types";

interface PermissionMatrixProps {
  type: "organization" | "show";
}

interface PermissionItem {
  key: Permission;
  label: string;
}

type PermissionCategories = Record<string, PermissionItem[]>;

// Permission categories for display
const ORG_PERMISSION_CATEGORIES: PermissionCategories = {
  Organization: [
    { key: PERMISSIONS.ORG_MANAGE_BILLING, label: "Billing" },
    { key: PERMISSIONS.ORG_TRANSFER_OWNERSHIP, label: "Transfer Ownership" },
    { key: PERMISSIONS.ORG_MANAGE_MEMBERS, label: "Manage Members" },
    { key: PERMISSIONS.ORG_MANAGE_SETTINGS, label: "Settings" },
    { key: PERMISSIONS.ORG_CREATE_SHOWS, label: "Create Shows" },
    { key: PERMISSIONS.ORG_DELETE_SHOWS, label: "Delete Shows" },
  ],
  Shows: [
    { key: PERMISSIONS.SHOW_VIEW, label: "View Shows" },
    { key: PERMISSIONS.SHOW_EDIT, label: "Edit Shows" },
    { key: PERMISSIONS.SHOW_MANAGE_STAFF, label: "Manage Staff" },
  ],
};

const SHOW_PERMISSION_CATEGORIES: PermissionCategories = {
  "Show Access": [
    { key: PERMISSIONS.SHOW_VIEW, label: "View Show" },
    { key: PERMISSIONS.SHOW_EDIT, label: "Edit Show" },
    { key: PERMISSIONS.SHOW_MANAGE_STAFF, label: "Manage Staff" },
  ],
  Casting: [
    { key: PERMISSIONS.CASTING_VIEW, label: "View Casting" },
    { key: PERMISSIONS.CASTING_EDIT, label: "Edit Casting" },
    { key: PERMISSIONS.CASTING_MAKE_DECISIONS, label: "Make Decisions" },
  ],
  Auditions: [
    { key: PERMISSIONS.AUDITIONS_VIEW, label: "View" },
    { key: PERMISSIONS.AUDITIONS_EDIT, label: "Edit" },
    { key: PERMISSIONS.AUDITIONS_MANAGE, label: "Manage" },
  ],
  Schedule: [
    { key: PERMISSIONS.SCHEDULE_VIEW, label: "View" },
    { key: PERMISSIONS.SCHEDULE_EDIT, label: "Edit" },
    { key: PERMISSIONS.SCHEDULE_MANAGE, label: "Manage" },
  ],
  Notes: [
    { key: PERMISSIONS.NOTES_VIEW_ALL, label: "View All" },
    { key: PERMISSIONS.NOTES_PRODUCTION, label: "Production" },
    { key: PERMISSIONS.NOTES_LIGHTING, label: "Lighting" },
    { key: PERMISSIONS.NOTES_SOUND, label: "Sound" },
    { key: PERMISSIONS.NOTES_COSTUME, label: "Costume" },
    { key: PERMISSIONS.NOTES_SCENIC, label: "Scenic" },
  ],
  Budget: [
    { key: PERMISSIONS.BUDGET_VIEW, label: "View" },
    { key: PERMISSIONS.BUDGET_EDIT, label: "Edit" },
    { key: PERMISSIONS.BUDGET_MANAGE, label: "Manage" },
  ],
  Materials: [
    { key: PERMISSIONS.MATERIALS_VIEW, label: "View" },
    { key: PERMISSIONS.MATERIALS_UPLOAD, label: "Upload" },
    { key: PERMISSIONS.TRACKS_VIEW, label: "Tracks View" },
    { key: PERMISSIONS.TRACKS_MANAGE, label: "Tracks Manage" },
  ],
  Communication: [
    { key: PERMISSIONS.COMMUNICATION_VIEW, label: "View" },
    { key: PERMISSIONS.COMMUNICATION_SEND, label: "Send" },
  ],
};

export function PermissionMatrix({ type }: PermissionMatrixProps): React.ReactElement {
  const roleOptions = type === "organization" ? ORGANIZATION_ROLE_OPTIONS : SHOW_ROLE_OPTIONS;
  const categories =
    type === "organization" ? ORG_PERMISSION_CATEGORIES : SHOW_PERMISSION_CATEGORIES;

  const hasPermission = (role: OrganizationRole | ShowRole, permission: Permission): boolean => {
    if (type === "organization") {
      const perms = ORGANIZATION_ROLE_PERMISSIONS[role as OrganizationRole];
      return perms.includes(permission);
    }
    const perms = SHOW_ROLE_PERMISSIONS[role as ShowRole];
    return perms.includes(permission);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Permission Matrix</CardTitle>
        <CardDescription>Overview of what each role can access</CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="px-2 py-2 text-left font-medium">Permission</th>
              {roleOptions.map((role) => (
                <th key={role.value} className="px-2 py-2 text-center font-medium">
                  {role.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Object.entries(categories).map(([category, permissions]) => (
              <React.Fragment key={category}>
                <tr className="bg-muted/50">
                  <td colSpan={roleOptions.length + 1} className="px-2 py-2 font-semibold">
                    {category}
                  </td>
                </tr>
                {permissions.map((perm) => (
                  <tr key={perm.key} className="border-b">
                    <td className="px-2 py-2">{perm.label}</td>
                    {roleOptions.map((role) => (
                      <td key={role.value} className="px-2 py-2 text-center">
                        {hasPermission(role.value, perm.key) ? (
                          <span className="text-green-600">&#10003;</span>
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  organizationMembers,
  showMembers,
  shows,
  producerProfiles,
  permissionAuditLog,
  type OrganizationRole,
  type ShowRole,
} from "@/lib/db/schema";
import {
  PERMISSIONS,
  ORGANIZATION_ROLE_PERMISSIONS,
  SHOW_ROLE_PERMISSIONS,
  type Permission,
  type PermissionCheckResult,
  type UserPermissionsContext,
} from "./types";

/**
 * Get the organization ID for a show
 */
export async function getShowOrganizationId(showId: string): Promise<string | null> {
  const show = await db.query.shows.findFirst({
    where: eq(shows.id, showId),
    columns: { organizationId: true },
  });
  return show?.organizationId ?? null;
}

/**
 * Get organization membership for a user
 */
export async function getOrganizationMembership(
  userId: string,
  organizationId: string
): Promise<{ role: OrganizationRole } | null> {
  // First check if user is the org owner (producer profile owner)
  const profile = await db.query.producerProfiles.findFirst({
    where: and(eq(producerProfiles.id, organizationId), eq(producerProfiles.userId, userId)),
  });

  if (profile) {
    return { role: "owner" };
  }

  // Check organization members table
  const membership = await db.query.organizationMembers.findFirst({
    where: and(
      eq(organizationMembers.organizationId, organizationId),
      eq(organizationMembers.userId, userId)
    ),
  });

  if (membership?.acceptedAt) {
    return { role: membership.role };
  }

  return null;
}

/**
 * Get show membership for a user
 */
export async function getShowMembership(
  userId: string,
  showId: string
): Promise<{ role: ShowRole; permissions: string[] | null } | null> {
  const membership = await db.query.showMembers.findFirst({
    where: and(eq(showMembers.showId, showId), eq(showMembers.userId, userId)),
  });

  if (membership?.acceptedAt) {
    return {
      role: membership.role,
      permissions: membership.permissions,
    };
  }

  return null;
}

/**
 * Get all permissions for a user in a specific context
 */
export async function getUserPermissions(
  userId: string,
  showId?: string
): Promise<UserPermissionsContext> {
  const context: UserPermissionsContext = {
    userId,
    permissions: [],
  };

  let organizationId: string | undefined;

  // If showId provided, get the organization
  if (showId) {
    const orgId = await getShowOrganizationId(showId);
    if (orgId) {
      organizationId = orgId;
      context.showId = showId;
    }
  }

  // Check organization membership
  if (organizationId) {
    context.organizationId = organizationId;
    const orgMembership = await getOrganizationMembership(userId, organizationId);

    if (orgMembership) {
      context.organizationRole = orgMembership.role;
      context.permissions = [
        ...context.permissions,
        ...ORGANIZATION_ROLE_PERMISSIONS[orgMembership.role],
      ];
    }
  }

  // Check show membership (if not already covered by org role)
  if (showId && !context.organizationRole) {
    const showMembership = await getShowMembership(userId, showId);

    if (showMembership) {
      context.showRole = showMembership.role;
      context.permissions = [...context.permissions, ...SHOW_ROLE_PERMISSIONS[showMembership.role]];

      // Add any custom permissions
      if (showMembership.permissions) {
        context.permissions = [
          ...context.permissions,
          ...(showMembership.permissions as Permission[]),
        ];
      }
    }
  }

  // Dedupe permissions
  context.permissions = [...new Set(context.permissions)];

  return context;
}

/**
 * Check if a user has a specific permission
 */
export async function hasPermission(
  userId: string,
  permission: Permission,
  showId?: string
): Promise<PermissionCheckResult> {
  const context = await getUserPermissions(userId, showId);

  const allowed = context.permissions.includes(permission);

  return {
    allowed,
    reason: allowed ? undefined : `User does not have permission: ${permission}`,
    role: context.organizationRole ?? context.showRole,
  };
}

/**
 * Check if a user has ANY of the specified permissions
 */
export async function hasAnyPermission(
  userId: string,
  permissions: Permission[],
  showId?: string
): Promise<PermissionCheckResult> {
  const context = await getUserPermissions(userId, showId);

  const allowed = permissions.some((p) => context.permissions.includes(p));

  return {
    allowed,
    reason: allowed ? undefined : `User does not have any of the required permissions`,
    role: context.organizationRole ?? context.showRole,
  };
}

/**
 * Check if a user has ALL of the specified permissions
 */
export async function hasAllPermissions(
  userId: string,
  permissions: Permission[],
  showId?: string
): Promise<PermissionCheckResult> {
  const context = await getUserPermissions(userId, showId);

  const missingPermissions = permissions.filter((p) => !context.permissions.includes(p));
  const allowed = missingPermissions.length === 0;

  return {
    allowed,
    reason: allowed ? undefined : `User is missing permissions: ${missingPermissions.join(", ")}`,
    role: context.organizationRole ?? context.showRole,
  };
}

/**
 * Check if user can manage staff for a show or organization
 */
export async function canManageStaff(
  userId: string,
  showId?: string,
  organizationId?: string
): Promise<boolean> {
  if (organizationId) {
    const membership = await getOrganizationMembership(userId, organizationId);
    if (membership) {
      const permissions = ORGANIZATION_ROLE_PERMISSIONS[membership.role];
      return permissions.includes(PERMISSIONS.ORG_MANAGE_MEMBERS);
    }
  }

  if (showId) {
    const result = await hasPermission(userId, PERMISSIONS.SHOW_MANAGE_STAFF, showId);
    return result.allowed;
  }

  return false;
}

/**
 * Log a permission change for audit purposes
 */
export async function logPermissionChange(params: {
  userId?: string;
  action: string;
  targetType: "organization" | "show";
  targetId: string;
  oldRole?: string;
  newRole?: string;
  metadata?: Record<string, unknown>;
  performedBy: string;
}): Promise<void> {
  await db.insert(permissionAuditLog).values({
    userId: params.userId,
    action: params.action,
    targetType: params.targetType,
    targetId: params.targetId,
    oldRole: params.oldRole,
    newRole: params.newRole,
    metadata: params.metadata,
    performedBy: params.performedBy,
  });
}

/**
 * Check if user is organization owner
 */
export async function isOrganizationOwner(
  userId: string,
  organizationId: string
): Promise<boolean> {
  const profile = await db.query.producerProfiles.findFirst({
    where: and(eq(producerProfiles.id, organizationId), eq(producerProfiles.userId, userId)),
  });

  return !!profile;
}

/**
 * Require permission - throws if not allowed
 */
export async function requirePermission(
  userId: string,
  permission: Permission,
  showId?: string
): Promise<void> {
  const result = await hasPermission(userId, permission, showId);
  if (!result.allowed) {
    throw new Error(result.reason ?? "Permission denied");
  }
}

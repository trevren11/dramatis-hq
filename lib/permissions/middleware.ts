import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasPermission, hasAnyPermission, hasAllPermissions } from "./helpers";
import type { Permission } from "./types";

export interface PermissionMiddlewareOptions {
  permission?: Permission;
  anyOf?: Permission[];
  allOf?: Permission[];
  showIdParam?: string; // Name of the route param containing showId
}

/**
 * Create a permission-protected API route handler
 */
export function withPermission<T extends Record<string, unknown>>(
  options: PermissionMiddlewareOptions,
  handler: (
    request: Request,
    context: { params: Promise<T>; userId: string; showId?: string }
  ) => Promise<NextResponse>
): (request: Request, context: { params: Promise<T> }) => Promise<NextResponse> {
  return async (request: Request, context: { params: Promise<T> }): Promise<NextResponse> => {
    try {
      const session = await auth();

      if (!session?.user.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const params = await context.params;
      const showId = options.showIdParam ? (params[options.showIdParam] as string) : undefined;

      // Check permissions
      if (options.permission) {
        const result = await hasPermission(session.user.id, options.permission, showId);
        if (!result.allowed) {
          return NextResponse.json(
            { error: "Access denied", reason: result.reason },
            { status: 403 }
          );
        }
      }

      if (options.anyOf) {
        const result = await hasAnyPermission(session.user.id, options.anyOf, showId);
        if (!result.allowed) {
          return NextResponse.json(
            { error: "Access denied", reason: result.reason },
            { status: 403 }
          );
        }
      }

      if (options.allOf) {
        const result = await hasAllPermissions(session.user.id, options.allOf, showId);
        if (!result.allowed) {
          return NextResponse.json(
            { error: "Access denied", reason: result.reason },
            { status: 403 }
          );
        }
      }

      // Call the actual handler
      return await handler(request, {
        params: context.params,
        userId: session.user.id,
        showId,
      });
    } catch (error) {
      console.error("Permission middleware error:", error);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  };
}

/**
 * Check permission and return early if not allowed
 * For use in existing route handlers
 */
export async function checkPermission(
  userId: string,
  permission: Permission,
  showId?: string
): Promise<{ allowed: true } | { allowed: false; response: NextResponse }> {
  const result = await hasPermission(userId, permission, showId);

  if (!result.allowed) {
    return {
      allowed: false,
      response: NextResponse.json(
        { error: "Access denied", reason: result.reason },
        { status: 403 }
      ),
    };
  }

  return { allowed: true };
}

/**
 * Check any of the permissions and return early if not allowed
 */
export async function checkAnyPermission(
  userId: string,
  permissions: Permission[],
  showId?: string
): Promise<{ allowed: true } | { allowed: false; response: NextResponse }> {
  const result = await hasAnyPermission(userId, permissions, showId);

  if (!result.allowed) {
    return {
      allowed: false,
      response: NextResponse.json(
        { error: "Access denied", reason: result.reason },
        { status: 403 }
      ),
    };
  }

  return { allowed: true };
}

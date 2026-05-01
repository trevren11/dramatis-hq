import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicRoutes = ["/", "/login", "/signup", "/forgot-password", "/reset-password", "/invite"];
const authRoutes = ["/login", "/signup", "/forgot-password", "/reset-password"];
const talentOnlyRoutes = ["/profile", "/auditions", "/talent"];
const producerOnlyRoutes = ["/dashboard", "/projects", "/casting"];

function matchesRoute(pathname: string, routes: string[]): boolean {
  return routes.some((route) => pathname === route || pathname.startsWith(route + "/"));
}

function matchesSignupOrRoute(pathname: string, routes: string[]): boolean {
  return routes.some((r) => pathname === r) || pathname.startsWith("/signup/");
}

function handleRoleBasedRedirect(
  pathname: string,
  userRole: string | undefined,
  nextUrl: NextRequest["nextUrl"]
): NextResponse | null {
  const isTalentOnly = matchesRoute(pathname, talentOnlyRoutes);
  const isProducerOnly = matchesRoute(pathname, producerOnlyRoutes);

  if (isTalentOnly && userRole !== "talent" && userRole !== "admin") {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }
  if (isProducerOnly && userRole !== "producer" && userRole !== "admin") {
    return NextResponse.redirect(new URL("/profile", nextUrl));
  }
  return null;
}

export default auth((req) => {
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;
  const isLoggedIn = Boolean(req.auth);
  // Extra optional chain needed for safety: auth errors can produce malformed sessions
  // where user is undefined despite types suggesting otherwise (GitHub issue #121)
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  const userRole = req.auth?.user?.role;

  // Allow API routes that handle their own auth
  if (
    pathname.startsWith("/api/auth") ||
    pathname === "/api/health" ||
    pathname.startsWith("/api/talent")
  ) {
    return NextResponse.next();
  }

  // Redirect authenticated users away from auth pages and landing page
  const isAuthRoute = matchesSignupOrRoute(pathname, authRoutes);
  if ((isAuthRoute || pathname === "/") && isLoggedIn) {
    const redirectTo = userRole === "producer" ? "/producer/shows" : "/talent/profile";
    return NextResponse.redirect(new URL(redirectTo, nextUrl));
  }

  // Allow public routes
  if (matchesSignupOrRoute(pathname, publicRoutes)) {
    return NextResponse.next();
  }

  // Redirect unauthenticated users to login
  if (!isLoggedIn) {
    const callbackUrl = encodeURIComponent(pathname + nextUrl.search);
    return NextResponse.redirect(new URL(`/login?callbackUrl=${callbackUrl}`, nextUrl));
  }

  // Role-based access control
  const roleRedirect = handleRoleBasedRedirect(pathname, userRole, nextUrl);
  if (roleRedirect) return roleRedirect;

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};

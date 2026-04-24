import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const publicRoutes = ["/", "/login", "/signup", "/forgot-password", "/reset-password"];
const authRoutes = ["/login", "/signup", "/forgot-password", "/reset-password"];
const talentOnlyRoutes = ["/profile", "/auditions"];
const producerOnlyRoutes = ["/dashboard", "/projects", "/casting"];

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const userRole = req.auth?.user.role;

  const isPublicRoute = publicRoutes.some(
    (route) => nextUrl.pathname === route || nextUrl.pathname.startsWith("/signup/")
  );
  const isAuthRoute = authRoutes.some(
    (route) => nextUrl.pathname === route || nextUrl.pathname.startsWith("/signup/")
  );
  const isApiAuthRoute = nextUrl.pathname.startsWith("/api/auth");
  const isTalentOnlyRoute = talentOnlyRoutes.some((route) => nextUrl.pathname.startsWith(route));
  const isProducerOnlyRoute = producerOnlyRoutes.some((route) =>
    nextUrl.pathname.startsWith(route)
  );

  // Allow API auth routes
  if (isApiAuthRoute) {
    return NextResponse.next();
  }

  // Redirect authenticated users away from auth pages
  if (isAuthRoute && isLoggedIn) {
    const redirectTo = userRole === "producer" ? "/dashboard" : "/profile";
    return NextResponse.redirect(new URL(redirectTo, nextUrl));
  }

  // Allow public routes
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Redirect unauthenticated users to login
  if (!isLoggedIn) {
    const callbackUrl = encodeURIComponent(nextUrl.pathname + nextUrl.search);
    return NextResponse.redirect(new URL(`/login?callbackUrl=${callbackUrl}`, nextUrl));
  }

  // Role-based access control
  if (isTalentOnlyRoute && userRole !== "talent" && userRole !== "admin") {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  if (isProducerOnlyRoute && userRole !== "producer" && userRole !== "admin") {
    return NextResponse.redirect(new URL("/profile", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};

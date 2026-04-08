import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/pricing",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/onboarding",
  "/api/webhooks(.*)",
]);

// AUTH DISABLED — re-enable route protection when ready
export const proxy = clerkMiddleware(async (_auth, _req) => {
  // if (!isPublicRoute(req)) { await auth.protect(); }
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

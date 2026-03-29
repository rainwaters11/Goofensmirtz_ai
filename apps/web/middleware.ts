import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Next.js Middleware — runs on every request.
 *
 * Responsibilities:
 * 1. Refreshes the Supabase session cookie so it never expires mid-session.
 * 2. Protects authenticated-only routes by redirecting unauthenticated users.
 * 3. Allows unauthenticated access to onboarding, demo, and public routes.
 */

/** Routes that do NOT require authentication */
const PUBLIC_PATHS = [
  "/",
  "/personas/setup",
  "/personas/reveal",
  "/get-started",
  "/auth/callback",
  "/auth/login",
  // The demo session is readable by anyone
  "/sessions/demo-biscuit-tuesday",
];

/** Routes that require authentication */
const PROTECTED_PATHS = ["/upload", "/settings"];

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
}

function isProtected(pathname: string): boolean {
  return PROTECTED_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session — DO NOT remove; required by @supabase/ssr
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Redirect unauthenticated users away from protected routes
  if (!user && isProtected(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/personas/setup";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users who've completed setup away from the quiz
  // (only redirect if they're at the root of /personas/setup, not mid-quiz)
  if (user && pathname === "/personas/setup") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all routes except:
     * - _next/static (static assets)
     * - _next/image (image optimization)
     * - favicon.ico, sitemap.xml, robots.txt
     * - Public files with extensions (.svg, .png, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

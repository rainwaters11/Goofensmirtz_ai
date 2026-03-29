import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * /auth/callback — Supabase OAuth callback handler.
 *
 * After Google OAuth completes, Supabase redirects here with ?code=.
 * We exchange it for a session, persist any pending pet profile, then route
 * the user to /personas/reveal.
 *
 * Flow:
 *   Google → /auth/callback?code=...
 *   → exchanges code for session cookie
 *   → redirects to /personas/reveal
 *   → reveal page reads localStorage "pet-profile" and triggers DB upsert
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/personas/reveal";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }

    // Log auth errors for debugging
    console.error("[auth/callback] Session exchange error:", error.message);
  }

  // Auth failed — send back to setup with error flag
  return NextResponse.redirect(
    `${origin}/personas/setup?error=auth_failed&message=${encodeURIComponent("Authentication failed. Please try again.")}`
  );
}

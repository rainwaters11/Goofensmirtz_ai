import { NextResponse } from "next/server";
import { createClient } from "../../../lib/supabase/server";

/**
 * Auth callback route — exchanges the OAuth authorization code for a session.
 *
 * Supabase redirects the browser here after the Google OAuth flow completes.
 * This handler calls exchangeCodeForSession(), which sets the session cookie,
 * then redirects the user to the home page (or a `next` query param if present).
 *
 * Route: GET /auth/callback?code=...&next=/optional-redirect
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // Allow the login page to pass a `next` param for post-login redirect
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Successful auth — redirect to the intended destination
      return NextResponse.redirect(`${origin}${next}`);
    }

    console.error("[auth/callback] exchangeCodeForSession error:", error.message);
  }

  // Something went wrong — redirect back to login with an error hint
  return NextResponse.redirect(`${origin}/auth/login?error=auth_callback_failed`);
}

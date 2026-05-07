import { createBrowserClient } from "@supabase/ssr";

/**
 * Creates a Supabase browser client for use in Client Components.
 * Uses the public anon key — subject to Row Level Security policies.
 *
 * Call this inside a component or hook; do not call at module scope.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

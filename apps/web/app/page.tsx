import { redirect } from "next/navigation";
import { createClient } from "../lib/supabase/server";
import { DashboardClient } from "../components/dashboard/dashboard-client";
import { LandingView } from "../components/dashboard/landing-view";

/**
 * Smart Router — runs entirely on the server before any paint.
 *
 * Decision tree:
 *  No auth       → LandingView (marketing, see demo, sign in)
 *  No pet        → /personas/setup
 *  No sessions   → /get-started
 *  Has pet + sessions → DashboardClient (Memory Feed + Sticky Chat)
 */
export default async function HomePage() {
  const supabase = await createClient();

  // 1. Auth check
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <LandingView />;
  }

  // 2. Pet check
  const { data: pet } = await supabase
    .from("pets")
    .select("id, name, species, photo_url, original_image_url, persona_avatar_url, default_persona_id")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!pet) {
    redirect("/personas/setup");
  }

  // 3. Session check — fetch real sessions, exclude the demo
  const { data: sessions } = await supabase
    .from("sessions")
    .select(
      "id, title, status, thumbnail_url, duration_seconds, created_at, modes_run"
    )
    .eq("owner_id", user.id)
    .neq("id", "demo-biscuit-tuesday")
    .order("created_at", { ascending: false })
    .limit(20);

  if (!sessions || sessions.length === 0) {
    redirect("/get-started");
  }

  // 4. Success — render full dashboard
  return (
    <DashboardClient
      pet={{
        id: pet.id,
        name: pet.name,
        species: pet.species,
        originalImageUrl: pet.original_image_url ?? undefined,
        personaAvatarUrl: pet.persona_avatar_url ?? undefined,
      }}
      sessions={sessions}
      userEmail={user.email ?? ""}
    />
  );
}

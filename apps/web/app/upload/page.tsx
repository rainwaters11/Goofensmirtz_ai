import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";
import { UploadDropzone } from "../../components/upload/upload-card";

/**
 * Upload page — server component.
 *
 * Responsibilities:
 *  1. Verify the user is authenticated (redirect to /personas/setup if not)
 *  2. Fetch the user's pet row so we can personalise the copy
 *  3. Render the persona-aware upload UI
 */
export default async function UploadPage() {
  const supabase = await createClient();

  // Auth check
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/personas/setup");
  }

  // Pet check — fetch pet + its default persona name
  const { data: pet } = await supabase
    .from("pets")
    .select(`
      id,
      name,
      species,
      photo_url,
      default_persona_id,
      personas ( name, tone )
    `)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!pet) {
    redirect("/personas/setup");
  }

  // Resolve persona display name from the join
  // Supabase returns the joined row as an array (1-to-many) even though it's 1-to-1 here.
  const personaRaw = pet.personas as unknown;
  const personaRow = (Array.isArray(personaRaw) ? personaRaw[0] : personaRaw) as { name: string; tone: string } | null;
  const personaName = personaRow?.name ?? "Dramatic Dog";
  const personaTone = personaRow?.tone ?? "Cinematic and expressive";

  return (
    <div className="mx-auto max-w-2xl">
      {/* ── Persona-aware header ──────────────────────── */}
      <div className="mb-8 flex flex-col gap-2">
        {/* Pet avatar chip */}
        <div className="flex items-center gap-2.5 mb-1">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-xl">
            {pet.species === "cat" ? "🐈" : pet.species === "rabbit" ? "🐇" : pet.species === "bird" ? "🐦" : "🐕"}
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-primary">{pet.name}</span>
            <span className="text-[10px] text-muted-foreground capitalize">{pet.species} · {personaName}</span>
          </div>
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Let&apos;s see the world through{" "}
          <span className="text-gradient-brand">{pet.name}&apos;s eyes.</span>
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Drop a 15–30 second clip. Your <strong className="text-foreground font-semibold">{personaName}</strong>{" "}
          is ready to narrate. {personaTone}.
        </p>

        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-emerald-700 font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block" />
            Pipeline ready
          </span>
          <span>MP4, MOV, WebM · Max 500 MB</span>
        </div>
      </div>

      {/* ── Upload dropzone (client component) ───────── */}
      <UploadDropzone
        userId={user.id}
        petId={pet.id}
        petName={pet.name}
        personaName={personaName}
      />
    </div>
  );
}

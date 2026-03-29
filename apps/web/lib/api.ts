import type { Session, SessionEvent, SessionInsights, PetRecap } from "@pet-pov/db";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

// ─── Response types ───────────────────────────────────────────────────────────

export interface SessionDetailResponse {
  session: Session;
  events: SessionEvent[];
}

// ─── Fetch helpers ────────────────────────────────────────────────────────────

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      (body as { error?: string }).error ?? `API error: ${res.status}`
    );
  }
  return res.json() as Promise<T>;
}

/** Fetch session detail + events */
export function fetchSession(id: string): Promise<SessionDetailResponse> {
  return apiFetch<SessionDetailResponse>(`/api/sessions/${id}`);
}

/** Fetch structured insights for a session */
export function fetchInsights(id: string): Promise<SessionInsights> {
  return apiFetch<SessionInsights>(`/api/sessions/${id}/insights`);
}

/** Fetch pet-perspective narration recap, optionally with a specific persona */
export function fetchRecap(id: string, personaId?: string): Promise<PetRecap> {
  const params = personaId ? `?persona=${encodeURIComponent(personaId)}` : "";
  return apiFetch<PetRecap>(`/api/sessions/${id}/recap${params}`);
}

// ─── Ask My Pet ───────────────────────────────────────────────────────────────

export interface AskPetResponse {
  response: string;
  personaName: string;
}

/**
 * Send a question to the pet for a given session.
 * Sends `question` + `persona` (Phase 3 spec fields).
 * The backend also accepts legacy `message` / `personaId` for backward compat.
 */
export async function askPet(
  sessionId: string,
  question: string,
  persona?: string,
  petName?: string,
  petSpecies?: string
): Promise<AskPetResponse> {
  // Use the Next.js API route — it queries Supabase directly and uses Groq
  const res = await fetch(`/api/ask-pet`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId,
      question,
      personaId: persona,
      petName,
      petSpecies,
    }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      (body as { error?: string }).error ?? `API error: ${res.status}`
    );
  }
  return res.json() as Promise<AskPetResponse>;
}
// ─── Voice / TTS ─────────────────────────────────────────────────────────────

export interface VoiceResponse {
  /** Base64 data URL or Cloudinary URL of the generated audio. Null on fallback. */
  audioUrl: string | null;
  /** True if audio was returned from server-side cache. */
  cached: boolean;
  /** True if ElevenLabs was unavailable — page should still work. */
  fallback: boolean;
}

/**
 * Generate TTS audio for a session recap using ElevenLabs.
 * Returns a cached URL on subsequent calls.
 */
export async function generateVoice(
  sessionId: string,
  personaId: string
): Promise<VoiceResponse> {
  const res = await fetch(`${API_BASE}/api/sessions/${sessionId}/voice`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ personaId }),
  });
  if (!res.ok) {
    // Non-breaking: return fallback shape so the UI can handle it gracefully
    return { audioUrl: null, cached: false, fallback: true };
  }
  return res.json() as Promise<VoiceResponse>;
}

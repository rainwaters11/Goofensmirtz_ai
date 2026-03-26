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

/** Send a question to the pet for a given session, optionally with a specific persona */
export async function askPet(
  sessionId: string,
  message: string,
  personaId?: string
): Promise<AskPetResponse> {
  const res = await fetch(`${API_BASE}/api/sessions/${sessionId}/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, ...(personaId ? { personaId } : {}) }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      (body as { error?: string }).error ?? `API error: ${res.status}`
    );
  }
  return res.json() as Promise<AskPetResponse>;
}

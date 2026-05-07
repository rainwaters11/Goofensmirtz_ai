const MANUS_API_BASE = "https://api.manus.ai/v2";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ManusProject {
  id: string;
  name: string;
  instruction: string;
  created_at?: string;
  [key: string]: unknown;
}

export interface CreateProjectParams {
  name: string;
  instruction: string;
}

// ─── Fetch helper ─────────────────────────────────────────────────────────────

async function manusFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const apiKey = process.env["MANUS_API_KEY"];
  if (!apiKey) throw new Error("MANUS_API_KEY is not set");

  const res = await fetch(`${MANUS_API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "x-manus-api-key": apiKey,
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      (body as { error?: string; message?: string }).error ??
        (body as { message?: string }).message ??
        `Manus API error: ${res.status}`
    );
  }

  return res.json() as Promise<T>;
}

// ─── API ──────────────────────────────────────────────────────────────────────

/** Create a new Manus project with a name and master instruction. */
export function createManusProject(params: CreateProjectParams): Promise<ManusProject> {
  return manusFetch<ManusProject>("/project.create", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

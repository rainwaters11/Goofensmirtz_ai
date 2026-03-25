// Shared database types for Pet POV AI
// These mirror the Supabase schema defined in infra/supabase/migrations

export type VideoStatus =
  | "uploaded"
  | "processing"
  | "events_extracted"
  | "toon_converted"
  | "narrated"
  | "voiced"
  | "rendered"
  | "complete"
  | "error";

export type JobStatus = "pending" | "running" | "complete" | "failed";

export type TtsProvider = "elevenlabs" | "openai" | "google";

// ─── Video ────────────────────────────────────────────────────────────────────

export interface Video {
  id: string;
  owner_id: string;
  title: string;
  cloudinary_url: string;
  cloudinary_public_id: string;
  duration_seconds: number | null;
  status: VideoStatus;
  created_at: string;
  updated_at: string;
}

export interface VideoInsert
  extends Omit<Video, "id" | "created_at" | "updated_at"> {
  id?: string;
}

// ─── Scene Event ──────────────────────────────────────────────────────────────

export interface SceneEvent {
  timestamp_start: number;
  timestamp_end: number;
  description: string;
  subjects: string[];
  actions: string[];
  emotion: string;
  environment: string;
  confidence: number;
}

export interface VideoEvents {
  id: string;
  video_id: string;
  events: SceneEvent[];
  toon_snapshot: string | null; // TOON is ephemeral — stored here only for debugging
  created_at: string;
}

// ─── Persona ──────────────────────────────────────────────────────────────────

export interface Persona {
  id: string;
  name: string;
  tone: string;
  style: string;
  rules: string[];
  voice_id: string;
  tts_provider: TtsProvider;
  created_at: string;
  updated_at: string;
}

export interface PersonaInsert
  extends Omit<Persona, "id" | "created_at" | "updated_at"> {
  id?: string;
}

// ─── Narration ────────────────────────────────────────────────────────────────

export interface Narration {
  id: string;
  video_id: string;
  persona_id: string;
  script: string;
  voice_url: string | null;
  created_at: string;
}

// ─── Pipeline Job ─────────────────────────────────────────────────────────────

export interface PipelineJob {
  id: string;
  video_id: string;
  step: string;
  status: JobStatus;
  error: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface PipelineJobInsert
  extends Omit<PipelineJob, "id" | "created_at"> {
  id?: string;
}

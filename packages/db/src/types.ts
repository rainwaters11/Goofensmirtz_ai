// Shared database types for Pet POV AI
// These mirror the Supabase schema defined in infra/supabase/migrations
//
// EVOLUTION NOTE:
// The product now supports two MVP modes: Experience Recap and Ask My Pet.
// New types (Pet, Session, SessionEvent, ConversationTurn, GeneratedAsset) are
// added below. The legacy Video / SceneEvent types are preserved for backwards
// compatibility with existing code and tests. Prefer the new Session-based types
// in all new code.

// ─── App Mode ─────────────────────────────────────────────────────────────────

/** The two primary product modes. */
export type AppMode = "recap" | "ask-my-pet";

// ─── Status Types ─────────────────────────────────────────────────────────────

/**
 * @deprecated Use SessionStatus in new code.
 * Kept for backwards compatibility with existing pipeline worker code.
 */
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

/** Status of a pet camera session through the pipeline. */
export type SessionStatus = VideoStatus;

export type JobStatus = "pending" | "running" | "complete" | "failed";

export type TtsProvider = "elevenlabs" | "openai" | "google";

export type AssetType = "video" | "audio" | "script";

// ─── Pet ──────────────────────────────────────────────────────────────────────

/**
 * A pet profile owned by a user.
 * A pet is linked to a persona that defines how it narrates / responds.
 */
export interface Pet {
  id: string;
  owner_id: string;
  name: string;
  species: string; // e.g. "dog", "cat"
  photo_url: string | null;
  /** The default persona used for this pet's narrations and conversations. */
  default_persona_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface PetInsert extends Omit<Pet, "id" | "created_at" | "updated_at"> {
  id?: string;
}

// ─── Session ──────────────────────────────────────────────────────────────────
//
// DATA OWNERSHIP:
//   Supabase  → source of truth for all session state, metadata, and relationships.
//               Stores references (URLs, public IDs) to media but NOT the binary files.
//   Cloudinary → source of truth for all actual media assets.
//               The fields below that end in `_url` or `_public_id` point to
//               Cloudinary-hosted assets; Supabase never stores the binary itself.
//
// FIELD CONVENTIONS:
//   cloudinary_public_id   — Cloudinary asset ID (used to build transforms/derivatives)
//   cloudinary_url         — Raw uploaded session video delivery URL
//   thumbnail_url          — Cloudinary-hosted poster frame / thumbnail
//   rendered_video_url     — Cloudinary-hosted final rendered recap video
//   audio_url              — Cloudinary or ElevenLabs-hosted TTS voiceover audio
//   // TODO: add highlight_clip_url (short-form clip) when that feature ships

/**
 * A recorded pet camera session uploaded by the user.
 * Replaces the legacy `Video` concept in all new code.
 *
 * A session is the primary entity that both MVP modes operate on:
 * - Experience Recap: session → events → narration → rendered video
 * - Ask My Pet: session → events → conversation turns
 */
export interface Session {
  id: string;
  owner_id: string;
  pet_id: string | null;
  title: string;

  // ── Cloudinary media references (Supabase stores URL, Cloudinary stores asset) ──
  /** Delivery URL of the raw uploaded session video in Cloudinary. */
  cloudinary_url: string;
  /** Cloudinary public ID of the raw session video (used to build derived URLs). */
  cloudinary_public_id: string;
  /** Cloudinary-hosted poster frame / preview thumbnail. Null until generated. */
  thumbnail_url: string | null;
  /** Cloudinary-hosted final rendered recap video. Null until render pipeline runs. */
  rendered_video_url: string | null;
  /** Hosted TTS voiceover audio URL (Cloudinary or ElevenLabs). Null until generated. */
  audio_url: string | null;

  duration_seconds: number | null;
  status: SessionStatus;
  /** Which pipeline modes have been run on this session. */
  modes_run: AppMode[];
  created_at: string;
  updated_at: string;
}

export interface SessionInsert extends Omit<Session, "id" | "created_at" | "updated_at"> {
  id?: string;
}

// ─── Session Event ────────────────────────────────────────────────────────────

/**
 * A structured AI-extracted event from a session.
 * Replaces `SceneEvent` in new code — semantically identical at MVP.
 */
export interface SessionEvent {
  timestamp_start: number;
  timestamp_end: number;
  description: string;
  subjects: string[];
  actions: string[];
  emotion: string;
  environment: string;
  confidence: number;
}

export interface SessionEvents {
  id: string;
  session_id: string;
  events: SessionEvent[];
  toon_snapshot: string | null; // TOON is ephemeral — stored here only for debugging
  created_at: string;
}

// ─── Insights + Recap (API response shapes) ──────────────────────────────────

/**
 * Structured insights derived from a session's events.
 * Returned by GET /api/sessions/:id/insights.
 */
export interface SessionInsights {
  keyActivities: { icon: string; label: string }[];
  behavioralInterpretation: string;
  safetyNotes: string;
  activityScore: number; // 0–100
}

/**
 * A pet-perspective narration recap for a session.
 * Returned by GET /api/sessions/:id/recap.
 */
export interface PetRecap {
  narrationScript: string;
  personaName: string;
  personaId: string;
}

// ─── Conversation Turn ────────────────────────────────────────────────────────

/**
 * A single Q&A turn in Ask My Pet mode.
 * Stored per session to allow conversation history context.
 */
export interface ConversationTurn {
  id: string;
  session_id: string;
  persona_id: string;
  /** The user's question or prompt. */
  user_message: string;
  /** The AI-generated pet response (in-character). */
  pet_response: string;
  /** URL of the TTS-synthesized audio for the response, if generated. */
  audio_url: string | null;
  created_at: string;
}

export interface ConversationTurnInsert
  extends Omit<ConversationTurn, "id" | "created_at"> {
  id?: string;
}

// ─── Generated Asset ──────────────────────────────────────────────────────────

/**
 * A file produced by the pipeline for a session.
 * May be a rendered video, a TTS audio clip, or an exported script.
 */
export interface GeneratedAsset {
  id: string;
  session_id: string;
  /** Which mode produced this asset. */
  mode: AppMode;
  type: AssetType;
  cloudinary_url: string;
  cloudinary_public_id: string;
  created_at: string;
}

export interface GeneratedAssetInsert
  extends Omit<GeneratedAsset, "id" | "created_at"> {
  id?: string;
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
  /** References sessions.id in new code; videos.id in legacy code. */
  video_id: string;
  persona_id: string;
  script: string;
  voice_url: string | null;
  created_at: string;
}

// ─── Pipeline Job ─────────────────────────────────────────────────────────────

export interface PipelineJob {
  id: string;
  /** References sessions.id in new code; videos.id in legacy code. */
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

// ─── Legacy Types (backwards compatibility) ───────────────────────────────────

/**
 * @deprecated Use `Session` in new code.
 * Kept so existing worker jobs and tests compile without changes.
 */
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

/** @deprecated Use `SessionInsert` in new code. */
export interface VideoInsert
  extends Omit<Video, "id" | "created_at" | "updated_at"> {
  id?: string;
}

/**
 * @deprecated Use `SessionEvent` in new code.
 * Kept so TOON encoder/decoder and existing specs continue to work.
 */
export type SceneEvent = SessionEvent;

/** @deprecated Use `SessionEvents` in new code. */
export interface VideoEvents {
  id: string;
  video_id: string;
  events: SceneEvent[];
  toon_snapshot: string | null;
  created_at: string;
}

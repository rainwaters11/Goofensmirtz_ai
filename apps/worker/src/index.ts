import { Worker, type Job } from "bullmq";
import { getSupabaseServiceClient, updateSessionError } from "@pet-pov/db";
import { sceneExtractionJob } from "./jobs/scene-extraction.js";
import { eventGenerationJob } from "./jobs/event-generation.js";
import { toonConversionJob } from "./jobs/toon-conversion.js";
import { narrationJob } from "./jobs/narration.js";
import { voiceSynthesisJob } from "./jobs/voice-synthesis.js";
import { videoRenderJob } from "./jobs/video-render.js";
import { conversationGenerationJob } from "./jobs/conversation-generation.js";

// ─── Queue Names ──────────────────────────────────────────────────────────────
export const QUEUE_PIPELINE = "pipeline";

// ─── Job Name Constants ───────────────────────────────────────────────────────

// Experience Recap pipeline jobs
export const JOB_SCENE_EXTRACTION = "scene-extraction";
export const JOB_EVENT_GENERATION = "event-generation";
export const JOB_TOON_CONVERSION = "toon-conversion";
export const JOB_NARRATION = "narration";
export const JOB_VOICE_SYNTHESIS = "voice-synthesis";
export const JOB_VIDEO_RENDER = "video-render";

// Ask My Pet pipeline jobs
export const JOB_CONVERSATION_GENERATION = "conversation-generation";

const REDIS_URL = process.env["REDIS_URL"] ?? "redis://localhost:6379";
const CONCURRENCY = parseInt(process.env["WORKER_CONCURRENCY"] ?? "4", 10);

// ─── Job Dispatcher ───────────────────────────────────────────────────────────
const jobDispatcher: Record<string, (job: Job) => Promise<unknown>> = {
  // Experience Recap
  [JOB_SCENE_EXTRACTION]: sceneExtractionJob,
  [JOB_EVENT_GENERATION]: eventGenerationJob,
  [JOB_TOON_CONVERSION]: toonConversionJob,
  [JOB_NARRATION]: narrationJob,
  [JOB_VOICE_SYNTHESIS]: voiceSynthesisJob,
  [JOB_VIDEO_RENDER]: videoRenderJob,
  // Ask My Pet
  [JOB_CONVERSATION_GENERATION]: conversationGenerationJob,
};

// ─── Jobs that carry a videoId (sessionId) in their payload ──────────────────
// These are the jobs where a failure should update sessions.status = 'error'.
const SESSION_JOBS = new Set([
  JOB_SCENE_EXTRACTION,
  JOB_EVENT_GENERATION,
  JOB_TOON_CONVERSION,
  JOB_NARRATION,
  JOB_VOICE_SYNTHESIS,
  JOB_VIDEO_RENDER,
]);

// ─── Worker ───────────────────────────────────────────────────────────────────
const worker = new Worker(
  QUEUE_PIPELINE,
  async (job: Job) => {
    const handler = jobDispatcher[job.name];
    if (!handler) {
      throw new Error(`Unknown job type: "${job.name}"`);
    }
    console.log(`[Worker] Starting job "${job.name}" (id=${job.id})`);
    return handler(job);
  },
  {
    connection: { url: REDIS_URL },
    concurrency: CONCURRENCY,
  }
);

worker.on("completed", (job) => {
  console.log(`[Worker] ✅ Completed job "${job.name}" (id=${job.id})`);
});

worker.on("failed", async (job, err) => {
  console.error(
    `[Worker] ❌ Failed job "${job?.name}" (id=${job?.id}) session=${job?.data?.videoId ?? "unknown"}:`,
    err.message
  );

  // Only persist error state after all retries are exhausted
  if (!job || job.attemptsMade < (job.opts.attempts ?? 1)) return;

  const sessionId: string | undefined = job.data?.videoId;
  if (!sessionId || !SESSION_JOBS.has(job.name)) return;

  try {
    const db = getSupabaseServiceClient();
    await updateSessionError(
      db,
      sessionId,
      `[${job.name}] ${err.message}`
    );
    console.error(
      `[Worker] Persisted error state for session ${sessionId} (job=${job.id}): ${err.message}`
    );
  } catch (dbErr) {
    // Don't throw — the job is already failed, DB write is best-effort
    console.error(`[Worker] Failed to persist error state for session ${sessionId}:`, dbErr);
  }
});

console.log(
  `🔧 Pet POV Worker started — queue: "${QUEUE_PIPELINE}", concurrency: ${CONCURRENCY}`
);


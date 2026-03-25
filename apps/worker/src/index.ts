import { Worker, type Job } from "bullmq";
import { sceneExtractionJob } from "./jobs/scene-extraction.js";
import { eventGenerationJob } from "./jobs/event-generation.js";
import { toonConversionJob } from "./jobs/toon-conversion.js";
import { narrationJob } from "./jobs/narration.js";
import { voiceSynthesisJob } from "./jobs/voice-synthesis.js";
import { videoRenderJob } from "./jobs/video-render.js";

// ─── Queue Names ──────────────────────────────────────────────────────────────
export const QUEUE_PIPELINE = "pipeline";

// ─── Job Name Constants ───────────────────────────────────────────────────────
export const JOB_SCENE_EXTRACTION = "scene-extraction";
export const JOB_EVENT_GENERATION = "event-generation";
export const JOB_TOON_CONVERSION = "toon-conversion";
export const JOB_NARRATION = "narration";
export const JOB_VOICE_SYNTHESIS = "voice-synthesis";
export const JOB_VIDEO_RENDER = "video-render";

const REDIS_URL = process.env["REDIS_URL"] ?? "redis://localhost:6379";
const CONCURRENCY = parseInt(process.env["WORKER_CONCURRENCY"] ?? "4", 10);

// ─── Job Dispatcher ───────────────────────────────────────────────────────────
const jobDispatcher: Record<string, (job: Job) => Promise<unknown>> = {
  [JOB_SCENE_EXTRACTION]: sceneExtractionJob,
  [JOB_EVENT_GENERATION]: eventGenerationJob,
  [JOB_TOON_CONVERSION]: toonConversionJob,
  [JOB_NARRATION]: narrationJob,
  [JOB_VOICE_SYNTHESIS]: voiceSynthesisJob,
  [JOB_VIDEO_RENDER]: videoRenderJob,
};

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

worker.on("failed", (job, err) => {
  console.error(`[Worker] ❌ Failed job "${job?.name}" (id=${job?.id}):`, err.message);
});

console.log(
  `🔧 Pet POV Worker started — queue: "${QUEUE_PIPELINE}", concurrency: ${CONCURRENCY}`
);

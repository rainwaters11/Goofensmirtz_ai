import type { Job } from "bullmq";
import { getSupabaseServiceClient, updateSessionStatus } from "@pet-pov/db";
import { analyseVideoFrames } from "@pet-pov/ai";
import fs from "node:fs/promises";
import path from "node:path";

export interface EventGenerationJobData {
  videoId: string;  // NOTE: sessionId — named videoId for legacy compat
  frameDir: string;
}

/**
 * JOB: event-generation
 *
 * Reads extracted frames, sends each keyframe to Gemini Vision,
 * and stores the resulting structured SessionEvent[] in the database.
 *
 * This is Step 4 of the Experience Recap pipeline.
 *
 * INPUT (job.data):
 *   - videoId: string UUID — the session ID (named videoId for legacy compat)
 *   - frameDir: string — local temp directory containing extracted frame JPEGs
 *     (populated by the scene-extraction job)
 *
 * OUTPUT:
 *   - SessionEvent[] stored in `session_events` table
 *   - Session status updated to "events_extracted"
 *
 * RULES:
 *   - Vision model ONLY — no narration here
 *   - Output is pure JSON (SessionEvent[]) — no TOON at this stage
 */
export async function eventGenerationJob(job: Job): Promise<void> {
  const { videoId, frameDir } = job.data as EventGenerationJobData;
  const db = getSupabaseServiceClient();

  console.log(`[event-generation] Starting for session ${videoId} — frameDir: ${frameDir}`);
  await job.updateProgress(10);

  // ── 1. Load frame file paths from frameDir ──────────────────────────────────
  let files: string[];
  try {
    files = await fs.readdir(frameDir);
  } catch (err) {
    throw new Error(
      `[event-generation] Cannot read frameDir "${frameDir}": ${(err as Error).message}. ` +
      `Ensure scene-extraction completed successfully before this job runs.`
    );
  }

  const framePaths = files
    .filter((f) => f.endsWith(".jpg") || f.endsWith(".jpeg"))
    .sort()
    .map((f) => path.join(frameDir, f));

  if (framePaths.length === 0) {
    throw new Error(
      `[event-generation] No JPEG frames found in "${frameDir}" for session ${videoId}. ` +
      `scene-extraction may have failed or written frames to a different path.`
    );
  }

  console.log(`[event-generation] Found ${framePaths.length} frames in ${frameDir}`);
  await job.updateProgress(20);

  // ── 2. Convert each frame file to base64 for Gemini Vision ──────────────────
  // Frame interval is 2 seconds (set by scene-extraction job)
  const FRAME_INTERVAL_SECONDS = 2;
  const frames = await Promise.all(
    framePaths.map(async (filePath, index) => ({
      imageBase64: (await fs.readFile(filePath)).toString("base64"),
      timestampSeconds: index * FRAME_INTERVAL_SECONDS,
    }))
  );

  console.log(`[event-generation] Encoded ${frames.length} frames to base64 — calling Gemini`);
  await job.updateProgress(30);

  // ── 3. Analyse frames with Gemini Vision ─────────────────────────────────────
  const events = await analyseVideoFrames(frames);
  console.log(`[event-generation] Gemini returned ${events.length} events`);
  await job.updateProgress(70);

  // ── 4. Store SessionEvent[] in the session_events table (idempotent upsert) ───
  // Use upsert so re-runs don't create duplicate rows — session_id is the unique key
  const { error: insertError } = await db
    .from("session_events")
    .upsert({ session_id: videoId, events }, { onConflict: "session_id" });

  if (insertError) {
    throw new Error(
      `[event-generation] Failed to write session_events for ${videoId}: ${insertError.message}`
    );
  }

  console.log(`[event-generation] Wrote ${events.length} events to session_events for ${videoId}`);

  // ── 5. Update session status ──────────────────────────────────────────────────
  await updateSessionStatus(db, videoId, "events_extracted");
  await job.updateProgress(100);
  console.log(`[event-generation] Complete — session ${videoId} status → events_extracted`);

  // ── 6. Cleanup temp files ─────────────────────────────────────────────────────
  // Best-effort — don't fail the job if cleanup fails
  try {
    await import("node:fs/promises").then(({ rm }) =>
      rm(frameDir, { recursive: true, force: true })
    );
    console.log(`[event-generation] Cleaned up frameDir: ${frameDir}`);
  } catch (cleanupErr) {
    console.warn(`[event-generation] Cleanup failed for ${frameDir}:`, cleanupErr);
  }
}


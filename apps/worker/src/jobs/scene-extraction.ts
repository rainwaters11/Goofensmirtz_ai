import type { Job } from "bullmq";
import { getSupabaseServiceClient, updateSessionStatus } from "@pet-pov/db";
import { extractFrames, probeVideo } from "@pet-pov/video";
import { Queue } from "bullmq";
import path from "node:path";
import os from "node:os";
import fs from "node:fs/promises";
import { createWriteStream } from "node:fs";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";

// Re-use the same pipeline queue to chain to the next job
const pipelineQueue = new Queue("pipeline", {
  connection: { url: process.env["REDIS_URL"] ?? "redis://localhost:6379" },
});

export interface SceneExtractionJobData {
  videoId: string;
  videoUrl: string;   // Cloudinary delivery URL — used to download the video
  localVideoPath: string; // pre-downloaded path (empty string if not yet downloaded)
  frameDir: string;   // where to write extracted frames (matches event-generation expectation)
}

/**
 * JOB: scene-extraction
 *
 * Downloads the video from Cloudinary (if not already local), extracts frames
 * at a regular interval, then chains into the event-generation job.
 *
 * This is Step 3 of the pipeline: Extract scenes (FFmpeg).
 *
 * Output: JPEG frames written to frameDir, event-generation job enqueued.
 */
export async function sceneExtractionJob(job: Job): Promise<void> {
  const { videoId, videoUrl, localVideoPath, frameDir } = job.data as SceneExtractionJobData;
  const db = getSupabaseServiceClient();

  console.log(`[scene-extraction] Starting for session ${videoId}`);
  await updateSessionStatus(db, videoId, "processing");
  await job.updateProgress(10);

  // ── 1. Resolve local video path (download from Cloudinary if needed) ─────────
  let videoPath = localVideoPath;
  if (!videoPath) {
    if (!videoUrl) {
      throw new Error(`[scene-extraction] No videoUrl or localVideoPath provided for session ${videoId}`);
    }
    const downloadDir = path.join(os.tmpdir(), "pet-pov", videoId);
    await fs.mkdir(downloadDir, { recursive: true });
    videoPath = path.join(downloadDir, "video.mp4");

    console.log(`[scene-extraction] Downloading video from Cloudinary → ${videoPath}`);
    const response = await fetch(videoUrl);
    if (!response.ok || !response.body) {
      throw new Error(`[scene-extraction] Cloudinary download failed: ${response.status} ${response.statusText}`);
    }
    // Stream directly to disk — avoids loading entire video into memory
    await pipeline(
      Readable.fromWeb(response.body as import("stream/web").ReadableStream),
      createWriteStream(videoPath)
    );
    const stat = await fs.stat(videoPath);
    console.log(`[scene-extraction] Streamed ${stat.size} bytes to ${videoPath}`);
  }

  await job.updateProgress(30);

  // ── 2. Probe video metadata ───────────────────────────────────────────────────
  const metadata = await probeVideo(videoPath);
  console.log(`[scene-extraction] Video duration: ${metadata.durationSeconds}s`);
  await job.updateProgress(40);

  // ── 3. Extract frames every 2 seconds ────────────────────────────────────────
  await fs.mkdir(frameDir, { recursive: true });
  const frames = await extractFrames(videoPath, frameDir, 2);
  console.log(`[scene-extraction] Extracted ${frames.length} frames → ${frameDir}`);
  await job.updateProgress(80);

  // ── 4. Chain into event-generation ────────────────────────────────────────────
  const nextJob = await pipelineQueue.add("event-generation", {
    videoId,
    frameDir,
  }, {
    // Inherit retry policy from the pipeline
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
  });
  console.log(`[scene-extraction] Enqueued event-generation job ${nextJob.id} for session ${videoId}`);

  // ── 5. Cleanup downloaded video file (frames persist until event-generation runs) ──
  // Best-effort — don't fail the job if cleanup fails
  if (!localVideoPath && videoPath) {
    try {
      await fs.rm(videoPath, { force: true });
      console.log(`[scene-extraction] Cleaned up downloaded video: ${videoPath}`);
    } catch (cleanupErr) {
      console.warn(`[scene-extraction] Video cleanup failed for ${videoPath}:`, cleanupErr);
    }
  }

  await job.updateProgress(100);
  console.log(`[scene-extraction] Complete for session ${videoId}`);
}

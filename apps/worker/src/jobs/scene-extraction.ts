import type { Job } from "bullmq";
import { getSupabaseServiceClient, updateVideoStatus } from "@pet-pov/db";
import { extractFrames, probeVideo } from "@pet-pov/video";
import path from "node:path";
import os from "node:os";

export interface SceneExtractionJobData {
  videoId: string;
  localVideoPath: string;
}

/**
 * JOB: scene-extraction
 *
 * Downloads the video (if needed), extracts frames at a regular interval,
 * and groups them into scene segments.
 *
 * This is Step 3 of the pipeline: Extract scenes (FFmpeg).
 *
 * Output: frames and scene metadata stored for the next step (event-generation).
 */
export async function sceneExtractionJob(job: Job): Promise<void> {
  const { videoId, localVideoPath } = job.data as SceneExtractionJobData;
  const db = getSupabaseServiceClient();

  await updateVideoStatus(db, videoId, "processing");
  await job.updateProgress(10);

  // TODO: Download video from Cloudinary if not already local
  const videoPath = localVideoPath;

  // Probe video metadata
  const metadata = await probeVideo(videoPath);
  console.log(`[scene-extraction] Video duration: ${metadata.durationSeconds}s`);
  await job.updateProgress(30);

  // Extract frames every 2 seconds
  const outputDir = path.join(os.tmpdir(), "pet-pov", videoId, "frames");
  const frames = await extractFrames(videoPath, outputDir, 2);
  console.log(`[scene-extraction] Extracted ${frames.length} frames`);
  await job.updateProgress(80);

  // TODO: Store frame paths and metadata so event-generation job can pick them up
  // e.g., save to a pipeline_jobs record or ephemeral storage

  await updateVideoStatus(db, videoId, "processing");
  await job.updateProgress(100);
}

import type { Job } from "bullmq";
import { getSupabaseServiceClient, updateVideoStatus } from "@pet-pov/db";
import { analyseVideoFrames } from "@pet-pov/ai";
import fs from "node:fs/promises";

export interface EventGenerationJobData {
  videoId: string;
  frameDir: string;
}

/**
 * JOB: event-generation
 *
 * Reads extracted frames, sends each keyframe to Gemini Vision,
 * and stores the resulting structured SceneEvent[] in the database.
 *
 * This is Step 4 of the pipeline: Generate structured events (Gemini).
 *
 * Rules:
 * - Vision model ONLY — no narration here
 * - Output is pure JSON (SceneEvent[]) — no TOON at this stage
 */
export async function eventGenerationJob(job: Job): Promise<void> {
  const { videoId, frameDir } = job.data as EventGenerationJobData;
  const db = getSupabaseServiceClient();

  await job.updateProgress(10);

  // TODO: Load frame file paths from frameDir
  const framePaths: string[] = []; // placeholder

  // TODO: Convert each frame file to base64
  // const frames = await Promise.all(framePaths.map(async (filePath, index) => ({
  //   imageBase64: (await fs.readFile(filePath)).toString("base64"),
  //   timestampSeconds: index * 2,
  // })));

  await job.updateProgress(30);

  // TODO: Call analyseVideoFrames() from @pet-pov/ai
  // const events = await analyseVideoFrames(frames);

  await job.updateProgress(70);

  // TODO: Store events in the video_events table via @pet-pov/db
  // await db.from("video_events").insert({ video_id: videoId, events });

  await updateVideoStatus(db, videoId, "events_extracted");
  await job.updateProgress(100);
}

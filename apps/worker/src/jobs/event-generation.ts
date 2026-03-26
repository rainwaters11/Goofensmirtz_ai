import type { Job } from "bullmq";
import { getSupabaseServiceClient, updateVideoStatus } from "@pet-pov/db";
import { analyseVideoFrames } from "@pet-pov/ai";
import fs from "node:fs/promises";

export interface EventGenerationJobData {
  videoId: string;  // NOTE: use sessionId in new jobs — videoId is legacy field name here
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

  await job.updateProgress(10);

  // TODO [Phase 2]: Load frame file paths from frameDir.
  //   INPUT:  frameDir (string) — directory of JPEG frames from scene-extraction
  //   OUTPUT: framePaths (string[]) — sorted list of frame file paths
  //   SERVICE: Node.js fs.readdir()
  //
  // const files = await fs.readdir(frameDir);
  // const framePaths = files
  //   .filter(f => f.endsWith(".jpg"))
  //   .sort()
  //   .map(f => path.join(frameDir, f));

  const framePaths: string[] = []; // placeholder

  // TODO [Phase 2]: Convert each frame file to base64 for Gemini Vision.
  //   INPUT:  framePaths (string[])
  //   OUTPUT: frames ({ imageBase64: string; timestampSeconds: number }[])
  //   NOTE: timestampSeconds can be inferred from frame filename or index × intervalSeconds
  //
  // const frames = await Promise.all(framePaths.map(async (filePath, index) => ({
  //   imageBase64: (await fs.readFile(filePath)).toString("base64"),
  //   timestampSeconds: index * 2,  // 2-second frame interval from scene-extraction
  // })));

  await job.updateProgress(30);

  // TODO [Phase 2]: Analyse frames with Gemini Vision to extract structured events.
  //   INPUT:  frames ({ imageBase64: string; timestampSeconds: number }[])
  //   OUTPUT: events (SessionEvent[])
  //   SERVICE: analyseVideoFrames() from @pet-pov/ai
  //   Reads from: GEMINI_API_KEY
  //
  // const events = await analyseVideoFrames(frames);

  await job.updateProgress(70);

  // TODO [Phase 2]: Store SessionEvent[] in the session_events table.
  //   INPUT:  videoId (sessionId), events (SessionEvent[])
  //   OUTPUT: row in `session_events` table
  //   SERVICE: Supabase
  //   NOTE: store in `session_events` table (not legacy `video_events`)
  //
  // const { error } = await db
  //   .from("session_events")
  //   .insert({ session_id: videoId, events });
  // if (error) throw new Error(`Failed to store session events: ${error.message}`);

  await updateVideoStatus(db, videoId, "events_extracted");
  await job.updateProgress(100);
}

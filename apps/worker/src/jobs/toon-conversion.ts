import type { Job } from "bullmq";
import { getSupabaseServiceClient, updateVideoStatus } from "@pet-pov/db";
import { encodeEvents } from "@pet-pov/toon";

export interface ToonConversionJobData {
  videoId: string;
}

/**
 * JOB: toon-conversion
 *
 * Reads the stored SceneEvent[] for a video and encodes it into TOON format.
 * The TOON string is stored temporarily (for debugging only — not for production).
 *
 * This is Step 6 of the pipeline: Convert JSON → TOON.
 *
 * Rules:
 * - TOON is NOT stored in the database for production use
 * - TOON is passed in-memory to the narration step
 * - This job validates the TOON output is deterministic and reversible
 */
export async function toonConversionJob(job: Job): Promise<void> {
  const { videoId } = job.data as ToonConversionJobData;
  const db = getSupabaseServiceClient();

  await job.updateProgress(10);

  // TODO: Fetch events from the video_events table
  // const { data } = await db.from("video_events").select("events").eq("video_id", videoId).single();
  // const events: SceneEvent[] = data.events;

  await job.updateProgress(40);

  // TODO: Encode events to TOON
  // const toon = encodeEvents(events);

  // TODO: Validate round-trip (decode back and compare)
  // const decoded = decodeEvents(toon);
  // assert round-trip equality here

  await job.updateProgress(80);

  // TODO: Pass toon to next job (narration) via job return value or ephemeral store

  await updateVideoStatus(db, videoId, "toon_converted");
  await job.updateProgress(100);
}

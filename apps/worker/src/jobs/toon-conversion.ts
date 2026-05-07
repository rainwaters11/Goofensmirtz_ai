import type { Job } from "bullmq";
import { getSupabaseServiceClient, updateSessionStatus } from "@pet-pov/db";
import { encodeEvents, decodeEvents } from "@pet-pov/toon";
import { Queue } from "bullmq";
import type { SessionEvent } from "@pet-pov/db";

const pipelineQueue = new Queue("pipeline", {
  connection: { url: process.env["REDIS_URL"] ?? "redis://localhost:6379" },
});

export interface ToonConversionJobData {
  videoId: string;
  personaId?: string;
}

/**
 * JOB: toon-conversion
 *
 * Reads the stored SessionEvent[] for a session, encodes it into TOON format
 * (in-memory only), validates the round-trip, then chains to the narration job.
 *
 * TOON is never stored in the database — it is passed via job data.
 */
export async function toonConversionJob(job: Job): Promise<void> {
  const { videoId, personaId = "dramatic-dog" } = job.data as ToonConversionJobData;
  const db = getSupabaseServiceClient();

  console.log(`[toon-conversion] Starting for session ${videoId}`);
  await job.updateProgress(10);

  // ── 1. Fetch events from session_events table ─────────────────────────────
  const { data: eventsRow, error: eventsError } = await db
    .from("session_events")
    .select("events")
    .eq("session_id", videoId)
    .single();

  if (eventsError || !eventsRow) {
    throw new Error(
      `[toon-conversion] Failed to fetch session_events for ${videoId}: ${eventsError?.message ?? "row not found"}`
    );
  }

  const events: SessionEvent[] = eventsRow.events ?? [];
  if (events.length === 0) {
    throw new Error(
      `[toon-conversion] No events found for session ${videoId} — event-generation may not have completed.`
    );
  }

  console.log(`[toon-conversion] Loaded ${events.length} events for ${videoId}`);
  await job.updateProgress(40);

  // ── 2. Encode to TOON (in-memory only — never stored) ─────────────────────
  const toon = encodeEvents(events);

  // ── 3. Validate round-trip determinism ────────────────────────────────────
  const decoded = decodeEvents(toon);
  if (decoded.length !== events.length) {
    throw new Error(
      `[toon-conversion] TOON round-trip failed for ${videoId}: ` +
      `encoded ${events.length} events but decoded ${decoded.length}`
    );
  }

  console.log(`[toon-conversion] TOON encoded (${toon.length} chars), round-trip validated`);
  await job.updateProgress(75);

  // ── 4. Chain to narration job ──────────────────────────────────────────────
  const nextJob = await pipelineQueue.add(
    "narration",
    { videoId, personaId, toon },
    { attempts: 3, backoff: { type: "exponential", delay: 2000 } }
  );
  console.log(`[toon-conversion] Enqueued narration job ${nextJob.id} for session ${videoId}`);

  await updateSessionStatus(db, videoId, "toon_converted");
  await job.updateProgress(100);
  console.log(`[toon-conversion] Complete for session ${videoId}`);
}

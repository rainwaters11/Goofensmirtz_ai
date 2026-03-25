import type { Job } from "bullmq";
import { getSupabaseServiceClient, updateVideoStatus, getPersonaById } from "@pet-pov/db";
import { generateChatCompletion } from "@pet-pov/ai";
import { buildNarrationSystemPrompt, buildNarrationUserMessage } from "@pet-pov/ai";

export interface NarrationJobData {
  videoId: string;
  personaId: string;
  toon: string; // Pre-encoded TOON string from toon-conversion step
}

/**
 * JOB: narration
 *
 * Takes a TOON-encoded event string and a persona ID,
 * generates a narration script using OpenAI, and stores it in the DB.
 *
 * This is Step 7 of the pipeline: Generate persona-based narration.
 *
 * Rules:
 * - Uses TOON as input (never raw JSON)
 * - Persona must be fetched from DB (never hardcoded)
 * - Returns only the script text — no audio at this stage
 */
export async function narrationJob(job: Job): Promise<void> {
  const { videoId, personaId, toon } = job.data as NarrationJobData;
  const db = getSupabaseServiceClient();

  await job.updateProgress(10);

  const persona = await getPersonaById(db, personaId);
  if (!persona) throw new Error(`Persona not found: ${personaId}`);

  await job.updateProgress(30);

  const systemPrompt = buildNarrationSystemPrompt(persona);
  const userMessage = buildNarrationUserMessage(toon);

  const script = await generateChatCompletion(systemPrompt, userMessage);
  console.log(`[narration] Generated script (${script.length} chars) for video ${videoId}`);

  await job.updateProgress(70);

  // TODO: Store the narration script in the narrations table
  // await db.from("narrations").insert({ video_id: videoId, persona_id: personaId, script });

  await updateVideoStatus(db, videoId, "narrated");
  await job.updateProgress(100);
}

import type { Job } from "bullmq";
import { getSupabaseServiceClient, updateVideoStatus, getPersonaById } from "@pet-pov/db";
import { generateChatCompletion } from "@pet-pov/ai";
import { buildNarrationSystemPrompt, buildNarrationUserMessage } from "@pet-pov/ai";

export interface NarrationJobData {
  videoId: string;  // NOTE: use sessionId in new jobs — videoId is legacy field name here
  personaId: string;
  toon: string; // Pre-encoded TOON string passed from the toon-conversion step
}

/**
 * JOB: narration
 *
 * Takes a TOON-encoded event string and a persona ID,
 * generates a narration script using OpenAI GPT-4o, and stores it in the DB.
 *
 * This is Step 6 of the Experience Recap pipeline.
 *
 * INPUT (job.data):
 *   - videoId: string UUID — the session ID (named videoId for legacy compat)
 *   - personaId: string UUID — the persona to narrate as
 *   - toon: string — pre-encoded TOON from the toon-conversion job (in-memory handoff)
 *
 * OUTPUT:
 *   - Script stored in `narrations` table (video_id, persona_id, script)
 *   - Session status updated to "narrated"
 *
 * RULES:
 *   - Uses TOON as input (never raw JSON)
 *   - Persona must be fetched from DB (never hardcoded)
 *   - Returns only the script text — audio synthesis happens in voice-synthesis job
 */
export async function narrationJob(job: Job): Promise<void> {
  const { videoId, personaId, toon } = job.data as NarrationJobData;
  const db = getSupabaseServiceClient();

  await job.updateProgress(10);

  // Fetch persona — already implemented
  const persona = await getPersonaById(db, personaId);
  if (!persona) throw new Error(`Persona not found: ${personaId}`);

  await job.updateProgress(30);

  // Build prompts and generate script — already implemented
  const systemPrompt = buildNarrationSystemPrompt(persona);
  const userMessage = buildNarrationUserMessage(toon);

  const script = await generateChatCompletion(systemPrompt, userMessage);
  console.log(`[narration] Generated script (${script.length} chars) for session ${videoId}`);

  await job.updateProgress(70);

  // TODO [Phase 3]: Store the narration script in the narrations table.
  //   INPUT:  videoId (sessionId), personaId, script
  //   OUTPUT: narration record with narration.id — needed by voice-synthesis job
  //   SERVICE: Supabase `narrations` table
  //   NOTE: The `narrations` table uses `video_id` column (legacy column name — maps to session ID)
  //
  // const { data: narration, error } = await db
  //   .from("narrations")
  //   .insert({ video_id: videoId, persona_id: personaId, script, voice_url: null })
  //   .select()
  //   .single();
  // if (error) throw new Error(`Failed to store narration: ${error.message}`);
  //
  // TODO [Phase 3]: Pass narration.id to the next job (voice-synthesis).
  // Return it so the job chain can pick it up:
  // return { narrationId: narration.id };

  await updateVideoStatus(db, videoId, "narrated");
  await job.updateProgress(100);
}

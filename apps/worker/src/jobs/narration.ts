import type { Job } from "bullmq";
import { getSupabaseServiceClient, updateSessionStatus, getPersonaById } from "@pet-pov/db";
import { generateChatCompletion } from "@pet-pov/ai";
import { buildNarrationSystemPrompt, buildNarrationUserMessage } from "@pet-pov/ai";
import { Queue } from "bullmq";

const pipelineQueue = new Queue("pipeline", {
  connection: { url: process.env["REDIS_URL"] ?? "redis://localhost:6379" },
});

export interface NarrationJobData {
  videoId: string;
  personaId: string;
  toon: string;
}

/**
 * JOB: narration
 *
 * Takes a TOON-encoded event string and a persona ID,
 * generates a narration script using GPT-4o / Llama, stores it in the DB,
 * and chains to voice-synthesis.
 */
export async function narrationJob(job: Job): Promise<void> {
  const { videoId, personaId, toon } = job.data as NarrationJobData;
  const db = getSupabaseServiceClient();

  console.log(`[narration] Starting for session ${videoId}`);
  await job.updateProgress(10);

  // ── 1. Fetch persona ───────────────────────────────────────────────────────
  const persona = await getPersonaById(db, personaId);
  if (!persona) throw new Error(`[narration] Persona not found: ${personaId}`);

  await job.updateProgress(30);

  // ── 2. Fetch pet name + species for grounding ─────────────────────────────
  const { data: sessionRow } = await db
    .from("sessions")
    .select("pet_id")
    .eq("id", videoId)
    .single();

  let petName = "the pet";
  let species = "animal";
  if (sessionRow?.pet_id) {
    const { data: petRow } = await db
      .from("pets")
      .select("name, species")
      .eq("id", sessionRow.pet_id)
      .single();
    petName = petRow?.name ?? "the pet";
    species = petRow?.species ?? "animal";
  }

  // ── 3. Build prompts ───────────────────────────────────────────────────────
  const baseSystemPrompt = buildNarrationSystemPrompt(persona);
  const systemPrompt = [
    baseSystemPrompt,
    "",
    "── PET IDENTITY (critical) ──",
    `Pet name: ${petName}`,
    `Species: ${species}`,
    `Rule: You are narrating from the perspective of a ${species} named ${petName}.`,
    `Never refer to this pet as any other species or name.`,
  ].join("\n");
  const userMessage = buildNarrationUserMessage(toon);

  // ── 4. Generate narration script ───────────────────────────────────────────
  const script = await generateChatCompletion(systemPrompt, userMessage, "llama-3.3-70b-versatile");
  console.log(`[narration] Generated script (${script.length} chars) for session ${videoId}`);

  await job.updateProgress(70);

  // ── 5. Persist narration to `narrations` table ────────────────────────────
  const { data: narration, error: narrationError } = await db
    .from("narrations")
    .insert({ video_id: videoId, persona_id: personaId, script, voice_url: null })
    .select()
    .single();

  if (narrationError || !narration) {
    throw new Error(`[narration] Failed to store narration for ${videoId}: ${narrationError?.message}`);
  }

  console.log(`[narration] Stored narration ${narration.id} for session ${videoId}`);

  // ── 6. Update session status ───────────────────────────────────────────────
  await updateSessionStatus(db, videoId, "narrated");
  await job.updateProgress(85);

  // ── 7. Chain to voice-synthesis ───────────────────────────────────────────
  const nextJob = await pipelineQueue.add(
    "voice-synthesis",
    { videoId, narrationId: narration.id },
    { attempts: 3, backoff: { type: "exponential", delay: 2000 } }
  );
  console.log(`[narration] Enqueued voice-synthesis job ${nextJob.id} for session ${videoId}`);

  await job.updateProgress(100);
  console.log(`[narration] Complete for session ${videoId}`);
}

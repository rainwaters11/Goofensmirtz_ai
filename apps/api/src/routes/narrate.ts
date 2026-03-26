import { Router } from "express";
import { z } from "zod";
import { getSupabaseServiceClient, getPersonaById } from "@pet-pov/db";
import { encodeEvents } from "@pet-pov/toon";
import {
  generateChatCompletion,
  buildNarrationSystemPrompt,
  buildNarrationUserMessage,
} from "@pet-pov/ai";

const router = Router();

const NarrateBodySchema = z.object({
  /** sessionId is the canonical field for new code. */
  sessionId: z.string().uuid().optional(),
  /** videoId is accepted for backwards compatibility with existing integrations. */
  videoId: z.string().uuid().optional(),
  personaId: z.string().uuid(),
}).refine((d) => d.sessionId != null || d.videoId != null, {
  message: "Either sessionId or videoId must be provided",
});

/**
 * POST /api/narrate
 *
 * Generates a narration script for a session using the specified persona.
 * Injects pet name + species into the system prompt so the LLM never
 * confuses a cat for a dog (or vice versa).
 *
 * INPUT:
 *   - body.sessionId: UUID of the session (preferred)
 *   - body.videoId:   UUID (legacy alias for sessionId)
 *   - body.personaId: UUID of the persona to use
 *
 * OUTPUT:
 *   - 200 { script: string, narrationId: string }
 */
router.post("/", async (req, res, next) => {
  try {
    const body = NarrateBodySchema.safeParse(req.body);
    if (!body.success) {
      res.status(400).json({
        error: "Invalid request body",
        details: body.error.flatten(),
      });
      return;
    }

    const sessionId = body.data.sessionId ?? body.data.videoId;
    const { personaId } = body.data;
    const supabase = getSupabaseServiceClient();

    // ── 1. Fetch session events ─────────────────────────────────────────────
    const { data: eventsRow, error: eventsError } = await supabase
      .from("session_events")
      .select("events")
      .eq("session_id", sessionId)
      .single();

    if (eventsError || !eventsRow) {
      res.status(404).json({
        error: "Session events not found — run the pipeline first",
      });
      return;
    }

    // ── 2. Encode events to TOON (in-memory, not stored) ───────────────────
    const toon = encodeEvents(eventsRow.events);

    // ── 3. Fetch persona ────────────────────────────────────────────────────
    const persona = await getPersonaById(supabase, personaId);
    if (!persona) {
      res.status(404).json({ error: "Persona not found" });
      return;
    }

    // ── 4. Fetch session + pet for species grounding ────────────────────────
    const { data: sessionRow, error: sessionError } = await supabase
      .from("sessions")
      .select("pet_id")
      .eq("id", sessionId)
      .single();

    if (sessionError || !sessionRow) {
      res.status(404).json({ error: "Session not found" });
      return;
    }

    const { data: petRow } = await supabase
      .from("pets")
      .select("name, species")
      .eq("id", sessionRow.pet_id)
      .single();

    const petName = petRow?.name ?? "the pet";
    const species = petRow?.species ?? "animal";

    // ── 5. Build prompts with species grounding ─────────────────────────────
    const baseSystemPrompt = buildNarrationSystemPrompt(persona);
    const systemPrompt = [
      baseSystemPrompt,
      "",
      `── PET IDENTITY (critical) ──`,
      `Pet name: ${petName}`,
      `Species: ${species}`,
      `Rule: You are narrating from the perspective of a ${species} named ${petName}.`,
      `Never refer to this pet as any other species or name. If the pet is a cat, never say "dog". Always say "${petName}".`,
    ].join("\n");

    const userMessage = buildNarrationUserMessage(toon);

    // ── 6. Generate narration via OpenAI GPT-4o ────────────────────────────
    const script = await generateChatCompletion(systemPrompt, userMessage);

    // ── 7. Persist narration to Supabase ────────────────────────────────────
    const { data: narration, error: narrationError } = await supabase
      .from("narrations")
      .insert({
        video_id: sessionId, // column kept as video_id for backward compatibility
        persona_id: personaId,
        script,
      })
      .select()
      .single();

    if (narrationError || !narration) {
      console.error("[narrate] Failed to store narration:", narrationError);
      res.status(500).json({ error: "Failed to store narration" });
      return;
    }

    // ── 8. Return result ────────────────────────────────────────────────────
    res.status(200).json({ script, narrationId: narration.id });
  } catch (err) {
    next(err);
  }
});

export { router as narrateRouter };

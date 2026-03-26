import { Router } from "express";
import { z } from "zod";
import { getSupabaseServiceClient, getPersonaById } from "@pet-pov/db";
import { encodeEvents } from "@pet-pov/toon";
import { generateChatCompletion, buildNarrationSystemPrompt, buildNarrationUserMessage } from "@pet-pov/ai";

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
 * Requires the session's events to have already been extracted (Step 4 of pipeline).
 *
 * INPUT:
 *   - body.sessionId: UUID of the session (preferred) — must have status >= "events_extracted"
 *   - body.videoId:   UUID (legacy alias for sessionId)
 *   - body.personaId: UUID of the persona to use for narration
 *
 * OUTPUT:
 *   - 200 { script: string }
 *
 * SERVICES (in order):
 *   1. Supabase: fetch SessionEvent[] from `session_events` table
 *      SERVICE: db.from("session_events").select("events").eq("session_id", sessionId).single()
 *   2. @pet-pov/toon: encodeEvents(events) → TOON string (in-memory, not stored)
 *   3. Supabase: getPersonaById(db, personaId)
 *   4. @pet-pov/ai: buildNarrationSystemPrompt(persona), buildNarrationUserMessage(toon)
 *   5. @pet-pov/ai: generateChatCompletion(systemPrompt, userMessage) via OpenAI GPT-4o
 *      Reads from: OPENAI_API_KEY
 *   6. Supabase: insert into `narrations` table
 *
 * STUBBED: All implementation steps are commented out below.
 *   Note: This endpoint is for synchronous on-demand narration.
 *   The worker job (apps/worker/src/jobs/narration.ts) handles the async pipeline version.
 */
router.post("/", async (req, res, next) => {
  try {
    const body = NarrateBodySchema.safeParse(req.body);
    if (!body.success) {
      res.status(400).json({ error: "Invalid request body", details: body.error.flatten() });
      return;
    }

    // Normalise: prefer sessionId, fall back to videoId for legacy callers
    const sessionId = body.data.sessionId ?? body.data.videoId;
    const { personaId } = body.data;
    const db = getSupabaseServiceClient();

    // TODO [Phase 3]: Fetch events for the session from the database.
    //   INPUT:  sessionId (string UUID)
    //   OUTPUT: events (SessionEvent[])
    //   SERVICE: Supabase `session_events` table
    //
    // const { data: eventsRow, error: eventsError } = await db
    //   .from("session_events")
    //   .select("events")
    //   .eq("session_id", sessionId)
    //   .single();
    // if (eventsError || !eventsRow) {
    //   res.status(404).json({ error: "Session events not found — run the pipeline first" });
    //   return;
    // }

    // TODO [Phase 3]: Encode events to TOON (in-memory only — do not store).
    //   INPUT:  eventsRow.events (SessionEvent[])
    //   OUTPUT: toon (string)
    //   SERVICE: encodeEvents() from @pet-pov/toon
    //
    // const toon = encodeEvents(eventsRow.events);

    // TODO [Phase 3]: Fetch persona from DB.
    //   INPUT:  personaId (string UUID)
    //   OUTPUT: persona (Persona)
    //   SERVICE: getPersonaById() from @pet-pov/db
    //
    // const persona = await getPersonaById(db, personaId);
    // if (!persona) {
    //   res.status(404).json({ error: "Persona not found" });
    //   return;
    // }

    // TODO [Phase 3]: Build prompts and generate narration script.
    //   INPUT:  persona (Persona), toon (string)
    //   OUTPUT: script (string)
    //   SERVICES: buildNarrationSystemPrompt(), buildNarrationUserMessage(), generateChatCompletion()
    //   Reads from: OPENAI_API_KEY
    //
    // const systemPrompt = buildNarrationSystemPrompt(persona);
    // const userMessage = buildNarrationUserMessage(toon);
    // const script = await generateChatCompletion(systemPrompt, userMessage);

    // TODO [Phase 3]: Store the narration script in the narrations table.
    //   INPUT:  sessionId, personaId, script
    //   OUTPUT: narration record (id, script, voice_url: null)
    //   SERVICE: Supabase `narrations` table
    //
    // const { data: narration } = await db
    //   .from("narrations")
    //   .insert({ video_id: sessionId, persona_id: personaId, script })
    //   .select()
    //   .single();

    // TODO [Phase 3]: Return the generated script:
    // return res.status(200).json({ script, narrationId: narration.id });

    res.status(202).json({
      message: "Narration endpoint ready — implementation pending",
      sessionId,
      personaId,
    });
  } catch (err) {
    next(err);
  }
});

export { router as narrateRouter };

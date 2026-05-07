import { Router } from "express";
import { z } from "zod";
import { getSupabaseServiceClient, updateSessionStatus } from "@pet-pov/db";
import { encodeEvents } from "@pet-pov/toon";
import {
  generateChatCompletion,
  buildNarrationSystemPrompt,
  buildNarrationUserMessage,
  generateInsightsFromEvents,
} from "@pet-pov/ai";
import { DRAMATIC_DOG_PERSONA } from "@pet-pov/personas";
import type { Persona, SessionInsights } from "@pet-pov/db";

const router = Router();

const ProcessBodySchema = z
  .object({
    sessionId: z.string().min(1).optional(),
    videoId: z.string().min(1).optional(),
    personaId: z.string().min(1).optional().default("dramatic-dog"),
  })
  .refine((d) => d.sessionId != null || d.videoId != null, {
    message: "Either sessionId or videoId must be provided",
  });

// ─── Persona presets (no DB lookup needed for demo) ───────────────────────────

const PERSONA_PRESETS: Record<string, Persona> = {
  "dramatic-dog": {
    ...DRAMATIC_DOG_PERSONA,
    id: "demo-persona-dramatic-dog",
    name: "Dramatic Dog",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
};

function resolvePersona(personaId: string): Persona {
  return PERSONA_PRESETS[personaId] ?? PERSONA_PRESETS["dramatic-dog"]!;
}

/**
 * POST /api/process
 *
 * Triggers the Experience Recap pipeline for a session.
 *
 * For the demo MVP this runs synchronously:
 *   1. Fetch session events from DB (or use seeded fallback)
 *   2. Encode events to TOON (in-memory)
 *   3. Generate narration via GPT-4o
 *   4. Store narration in Supabase
 *   5. Update session status to "narrated"
 *
 * When Redis + BullMQ is available, replace the inline logic with:
 *   const job = await pipelineQueue.add("scene-extraction", { sessionId, personaId });
 *   res.status(202).json({ jobId: job.id });
 */
router.post("/", async (req, res, next) => {
  try {
    const body = ProcessBodySchema.safeParse(req.body);
    if (!body.success) {
      res
        .status(400)
        .json({ error: "Invalid request body", details: body.error.flatten() });
      return;
    }

    const sessionId = body.data.sessionId ?? body.data.videoId!;
    const personaId = body.data.personaId ?? "dramatic-dog";
    const persona = resolvePersona(personaId);
    const db = getSupabaseServiceClient();

    // ── 1. Fetch session events from DB ────────────────────────────────────────
    await updateSessionStatus(db, sessionId, "processing");

    const { data: eventsRow, error: eventsError } = await db
      .from("session_events")
      .select("events")
      .eq("session_id", sessionId)
      .single();

    if (eventsError || !eventsRow?.events?.length) {
      // No events in DB — session hasn't been processed through Gemini yet.
      // Return a processing status so the UI can poll.
      res.status(202).json({
        status: "pending",
        message:
          "Session events not yet extracted. Upload complete — run Gemini analysis to continue.",
        sessionId,
      });
      return;
    }

    // ── 2. Encode events to TOON (in-memory only — not stored) ──────────────────
    const toon = encodeEvents(eventsRow.events);

    // ── 3. Fetch pet + species for species grounding ────────────────────────────
    const { data: sessionRow } = await db
      .from("sessions")
      .select("pet_id, title")
      .eq("id", sessionId)
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

    // ── 4. Build system prompt with species grounding ──────────────────────────
    const baseSystemPrompt = buildNarrationSystemPrompt(persona);
    const systemPrompt = [
      baseSystemPrompt,
      "",
      `── PET IDENTITY (critical) ──`,
      `Pet name: ${petName}`,
      `Species: ${species}`,
      `Rule: You are narrating from the perspective of a ${species} named ${petName}.`,
      `Never refer to this pet as any other species or name.`,
    ].join("\n");
    const userMessage = buildNarrationUserMessage(toon);

    // ── 5. Generate narration via GPT-4o ───────────────────────────────────────
    let script: string;
    if (process.env["OPENAI_API_KEY"]) {
      script = await generateChatCompletion(systemPrompt, userMessage);
    } else {
      // Fallback — return a placeholder so the endpoint doesn't error
      script = `[No OPENAI_API_KEY configured — narration not generated for session ${sessionId}]`;
    }

    // ── 6. Persist narration to Supabase ───────────────────────────────────────
    const { data: narration, error: narrationError } = await db
      .from("narrations")
      .insert({
        video_id: sessionId,
        persona_id: persona.id,
        script,
      })
      .select()
      .single();

    if (narrationError) {
      console.error("[process] Failed to store narration:", narrationError);
      // Non-fatal for demo — still mark as narrated and return the script
    }

    // ── 7. Update session status ───────────────────────────────────────────────
    await updateSessionStatus(db, sessionId, "narrated");

    res.status(200).json({
      status: "complete",
      sessionId,
      narrationId: narration?.id ?? null,
      script,
      personaName: persona.name,
    });
  } catch (err) {
    console.error("[process] Error:", err);
    next(err);
  }
});

export { router as processRouter };

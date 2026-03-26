import { Router } from "express";
import { z } from "zod";
import { getSupabaseServiceClient, getVideoById } from "@pet-pov/db";
import { getPersonaById } from "@pet-pov/db";
import { encodeEvents } from "@pet-pov/toon";
import { generateChatCompletion } from "@pet-pov/ai";
import { buildNarrationSystemPrompt, buildNarrationUserMessage } from "@pet-pov/ai";

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
 * Requires the session's events to have already been extracted (step 4 of pipeline).
 *
 * Accepts `sessionId` (preferred) or legacy `videoId`.
 *
 * Returns: { script }
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

    // TODO: Fetch events for the session from the database (session_events table)
    // TODO: Encode events using encodeEvents() from @pet-pov/toon
    // TODO: Fetch persona using getPersonaById()
    // TODO: Build prompts and call generateChatCompletion()
    // TODO: Store narration in DB and return script

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

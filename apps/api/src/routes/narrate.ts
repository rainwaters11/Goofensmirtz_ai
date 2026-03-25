import { Router } from "express";
import { z } from "zod";
import { getSupabaseServiceClient, getVideoById } from "@pet-pov/db";
import { getPersonaById } from "@pet-pov/db";
import { encodeEvents } from "@pet-pov/toon";
import { generateChatCompletion } from "@pet-pov/ai";
import { buildNarrationSystemPrompt, buildNarrationUserMessage } from "@pet-pov/ai";

const router = Router();

const NarrateBodySchema = z.object({
  videoId: z.string().uuid(),
  personaId: z.string().uuid(),
});

/**
 * POST /api/narrate
 *
 * Generates a narration script for a video using the specified persona.
 * Requires the video's events to have already been extracted (step 4 of pipeline).
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

    const { videoId, personaId } = body.data;
    const db = getSupabaseServiceClient();

    // TODO: Fetch events for the video from the database
    // TODO: Encode events using encodeEvents() from @pet-pov/toon
    // TODO: Fetch persona using getPersonaById()
    // TODO: Build prompts and call generateChatCompletion()
    // TODO: Store narration in DB and return script

    res.status(202).json({
      message: "Narration endpoint ready — implementation pending",
      videoId,
      personaId,
    });
  } catch (err) {
    next(err);
  }
});

export { router as narrateRouter };

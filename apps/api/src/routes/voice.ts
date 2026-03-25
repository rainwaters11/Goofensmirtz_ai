import { Router } from "express";
import { z } from "zod";

const router = Router();

const VoiceBodySchema = z.object({
  narrationId: z.string().uuid(),
});

/**
 * POST /api/voice
 *
 * Generates a TTS voiceover for an existing narration.
 * Delegates to the worker queue for async processing.
 *
 * Returns: { jobId }
 */
router.post("/", async (req, res, next) => {
  try {
    const body = VoiceBodySchema.safeParse(req.body);
    if (!body.success) {
      res.status(400).json({ error: "Invalid request body", details: body.error.flatten() });
      return;
    }

    const { narrationId } = body.data;

    // TODO: Enqueue a voice synthesis job in the worker queue

    res.status(202).json({
      message: "Voice endpoint ready — queue integration pending",
      narrationId,
    });
  } catch (err) {
    next(err);
  }
});

export { router as voiceRouter };

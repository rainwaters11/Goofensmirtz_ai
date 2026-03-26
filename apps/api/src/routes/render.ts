import { Router } from "express";
import { z } from "zod";

const router = Router();

const RenderBodySchema = z.object({
  videoId: z.string().uuid(),
  narrationId: z.string().uuid(),
});

/**
 * POST /api/render
 *
 * Triggers final video rendering (original video + voiceover → output video).
 * Delegates to the worker queue for async processing.
 *
 * Returns: { jobId }
 */
router.post("/", async (req, res, next) => {
  try {
    const body = RenderBodySchema.safeParse(req.body);
    if (!body.success) {
      res.status(400).json({ error: "Invalid request body", details: body.error.flatten() });
      return;
    }

    const { videoId, narrationId } = body.data;

    // TODO: Enqueue a render job in the worker queue

    res.status(202).json({
      message: "Render endpoint ready — queue integration pending",
      videoId,
      narrationId,
    });
  } catch (err) {
    next(err);
  }
});

export { router as renderRouter };

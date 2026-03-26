import { Router } from "express";
import { Queue } from "bullmq";
import { z } from "zod";

const router = Router();

const ProcessBodySchema = z.object({
  /** sessionId is the canonical field for new code (Experience Recap mode). */
  sessionId: z.string().uuid().optional(),
  /** videoId is accepted for backwards compatibility with existing integrations. */
  videoId: z.string().uuid().optional(),
  personaId: z.string().uuid(),
}).refine((d) => d.sessionId != null || d.videoId != null, {
  message: "Either sessionId or videoId must be provided",
});

// TODO: Connect to Redis and initialise the pipeline queue
// const pipelineQueue = new Queue("pipeline", { connection: { url: process.env.REDIS_URL } });

/**
 * POST /api/process
 *
 * Triggers the Experience Recap pipeline for a given session.
 * Enqueues a job in the worker queue — does NOT run synchronously.
 *
 * Accepts `sessionId` (preferred) or legacy `videoId`.
 *
 * Returns: { jobId }
 */
router.post("/", async (req, res, next) => {
  try {
    const body = ProcessBodySchema.safeParse(req.body);
    if (!body.success) {
      res.status(400).json({ error: "Invalid request body", details: body.error.flatten() });
      return;
    }

    // Normalise: prefer sessionId, fall back to videoId for legacy callers
    const sessionId = body.data.sessionId ?? body.data.videoId;
    const { personaId } = body.data;

    // TODO: Enqueue the pipeline job
    // const job = await pipelineQueue.add("run-pipeline", { sessionId, personaId });

    res.status(202).json({
      message: "Pipeline trigger ready — queue integration pending",
      sessionId,
      personaId,
    });
  } catch (err) {
    next(err);
  }
});

export { router as processRouter };

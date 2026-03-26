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

// TODO [Phase 7]: Connect to Redis and initialise the pipeline queue.
//   INPUT:  process.env.REDIS_URL  (e.g. "redis://localhost:6379")
//   OUTPUT: pipelineQueue — BullMQ Queue instance
//   SERVICE: bullmq Queue (already installed)
//
// const pipelineQueue = new Queue("pipeline", { connection: { url: process.env["REDIS_URL"] } });

/**
 * POST /api/process
 *
 * Triggers the Experience Recap pipeline for a given session.
 * Enqueues a job in the worker queue — does NOT run synchronously.
 *
 * INPUT:
 *   - body.sessionId: UUID of the session to process (preferred)
 *   - body.videoId:   UUID (legacy alias for sessionId)
 *   - body.personaId: UUID of the persona to use for narration
 *
 * OUTPUT:
 *   - 202 { jobId }  (once queue is wired)
 *
 * SERVICES:
 *   - BullMQ: pipelineQueue.add("scene-extraction", { sessionId, personaId })
 *     Reads from: REDIS_URL
 *
 * STUBBED: Queue connection and job enqueue are commented out below.
 *   Uncomment to complete Phase 7 of the pipeline.
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

    // TODO [Phase 7]: Enqueue the first pipeline job.
    //   INPUT:  sessionId (string UUID), personaId (string UUID)
    //   OUTPUT: job.id (string) — returned to caller as { jobId }
    //   SERVICE: pipelineQueue.add() from bullmq
    //
    // const job = await pipelineQueue.add("scene-extraction", { sessionId, personaId });
    // return res.status(202).json({ jobId: job.id, sessionId, personaId });

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

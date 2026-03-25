import { Router } from "express";
import { Queue } from "bullmq";
import { z } from "zod";

const router = Router();

const ProcessBodySchema = z.object({
  videoId: z.string().uuid(),
  personaId: z.string().uuid(),
});

// TODO: Connect to Redis and initialise the pipeline queue
// const pipelineQueue = new Queue("pipeline", { connection: { url: process.env.REDIS_URL } });

/**
 * POST /api/process
 *
 * Triggers the full pipeline for a given video.
 * Enqueues a job in the worker queue — does NOT run synchronously.
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

    const { videoId, personaId } = body.data;

    // TODO: Enqueue the pipeline job
    // const job = await pipelineQueue.add("run-pipeline", { videoId, personaId });

    res.status(202).json({
      message: "Pipeline trigger ready — queue integration pending",
      videoId,
      personaId,
    });
  } catch (err) {
    next(err);
  }
});

export { router as processRouter };

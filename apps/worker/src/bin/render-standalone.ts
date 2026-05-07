import { videoRenderJob } from "../jobs/video-render.js";
import type { Job } from "bullmq";

/**
 * Standalone runner for the video-render job.
 * Usage: tsx render-standalone.ts <videoId> <narrationId>
 */
async function main() {
  const args = process.argv.slice(2);
  const [videoId, narrationId] = args;

  if (!videoId || !narrationId) {
    console.error("Usage: tsx render-standalone.ts <videoId> <narrationId>");
    process.exit(1);
  }

  console.log(`[standalone-render] Starting render for videoId: ${videoId}, narrationId: ${narrationId}`);

  // Mock a BullMQ Job object for the task
  const mockJob = {
    data: { videoId, narrationId },
    updateProgress: async (p: number) => console.log(`[progress] ${p}%`),
    log: async (m: string) => console.log(`[log] ${m}`),
  } as unknown as Job;

  try {
    await videoRenderJob(mockJob);
    console.log("[standalone-render] Successfully completed render.");
    process.exit(0);
  } catch (error) {
    console.error("[standalone-render] Render failed:", error);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("[standalone-render] Unhandled error:", err);
  process.exit(1);
});

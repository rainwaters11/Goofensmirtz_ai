import type { Job } from "bullmq";
import { getSupabaseServiceClient, updateVideoStatus } from "@pet-pov/db";
import { mergeAudioWithVideo } from "@pet-pov/video";
import { v2 as cloudinary } from "cloudinary";
import path from "node:path";
import os from "node:os";

export interface VideoRenderJobData {
  videoId: string;
  narrationId: string;
}

/**
 * JOB: video-render
 *
 * Downloads the original video and voiceover audio,
 * merges them with FFmpeg, uploads the result to Cloudinary,
 * and marks the video as complete.
 *
 * This is Step 9 of the pipeline: Render final video (FFmpeg).
 */
export async function videoRenderJob(job: Job): Promise<void> {
  const { videoId, narrationId } = job.data as VideoRenderJobData;
  const db = getSupabaseServiceClient();

  await job.updateProgress(10);

  // TODO: Fetch video record (cloudinary_url) from DB
  // TODO: Fetch narration record (voice_url) from DB

  await job.updateProgress(20);

  // TODO: Download original video from Cloudinary to temp dir
  const tmpDir = path.join(os.tmpdir(), "pet-pov", videoId, "render");
  const videoPath = path.join(tmpDir, "input.mp4");
  const audioPath = path.join(tmpDir, "voice.mp3");
  const outputPath = path.join(tmpDir, "output.mp4");

  await job.updateProgress(40);

  // TODO: Merge audio with video
  // await mergeAudioWithVideo(videoPath, audioPath, outputPath);

  await job.updateProgress(70);

  // TODO: Upload rendered video to Cloudinary
  // const result = await cloudinary.uploader.upload(outputPath, { resource_type: "video" });

  await job.updateProgress(85);

  // TODO: Update video record with final output URL and mark as complete
  await updateVideoStatus(db, videoId, "complete");
  await job.updateProgress(100);

  console.log(`[video-render] ✅ Pipeline complete for video ${videoId}`);
}

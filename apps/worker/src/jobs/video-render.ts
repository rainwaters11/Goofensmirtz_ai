import type { Job } from "bullmq";
import {
  getSupabaseServiceClient,
  updateSessionStatus,
  createGeneratedAsset,
} from "@pet-pov/db";
import { mergeAudioWithVideo } from "@pet-pov/video";
import { v2 as cloudinary } from "cloudinary";
import path from "node:path";
import os from "node:os";
import fs from "node:fs/promises";
import { createWriteStream } from "node:fs";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import { ModalClient } from "modal";

// Configure Cloudinary
if (process.env["CLOUDINARY_URL"]) {
  cloudinary.config({ cloudinary_url: process.env["CLOUDINARY_URL"] });
} else if (
  process.env["CLOUDINARY_CLOUD_NAME"] &&
  process.env["CLOUDINARY_API_KEY"] &&
  process.env["CLOUDINARY_API_SECRET"]
) {
  cloudinary.config({
    cloud_name: process.env["CLOUDINARY_CLOUD_NAME"],
    api_key: process.env["CLOUDINARY_API_KEY"],
    api_secret: process.env["CLOUDINARY_API_SECRET"],
  });
}

export interface VideoRenderJobData {
  videoId: string;
  narrationId: string;
}

async function downloadFile(url: string, destPath: string): Promise<void> {
  const response = await fetch(url);
  if (!response.ok || !response.body) {
    throw new Error(`Download failed (${response.status}): ${url}`);
  }
  await pipeline(
    Readable.fromWeb(response.body as import("stream/web").ReadableStream),
    createWriteStream(destPath)
  );
}

async function uploadVideoToCloudinary(
  filePath: string,
  sessionId: string
): Promise<{ secure_url: string; public_id: string }> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(
      filePath,
      {
        resource_type: "video",
        folder: "pet-pov/rendered",
        public_id: `${sessionId}-recap`,
        eager: [{ width: 640, height: 360, crop: "fill", format: "mp4" }],
        eager_async: false,
      },
      (err, result) => {
        if (err || !result) return reject(err ?? new Error("Cloudinary video upload failed"));
        resolve({ secure_url: result.secure_url, public_id: result.public_id });
      }
    );
  });
}

/**
 * JOB: video-render
 *
 * Downloads the original video and voiceover audio, merges them via FFmpeg,
 * uploads the rendered MP4 to Cloudinary, creates a GeneratedAsset record,
 * and marks the session as complete.
 */
export async function videoRenderJob(job: Job): Promise<void> {
  const { videoId, narrationId } = job.data as VideoRenderJobData;

  // ── Modal.com Delegation ────────────────────────────────────────────────
  // Skip delegation if USE_MODAL_RENDER is false OR if we are already running on Modal
  if (process.env.USE_MODAL_RENDER === "true" && !process.env.MODAL_ENVIRONMENT) {
    console.log(`[video-render] Delegating render to Modal.com for session ${videoId}`);
    await job.updateProgress(5);

    const tokenId = process.env.MODAL_TOKEN_ID;
    const tokenSecret = process.env.MODAL_TOKEN_SECRET;

    if (!tokenId || !tokenSecret) {
      throw new Error("MODAL_TOKEN_ID and MODAL_TOKEN_SECRET must be set for Modal delegation");
    }

    const client = new ModalClient({ tokenId, tokenSecret });
    try {
      console.log(`[video-render] Looking up Modal function "video-render" / "render"`);
      const renderFunc = await client.functions.fromName("video-render", "render");
      await job.updateProgress(15);

      console.log(`[video-render] Calling Modal function...`);
      const result = await renderFunc.remote([], { video_id: videoId, narration_id: narrationId });

      console.log(`[video-render] Modal.com render successful:`, result);
      await job.updateProgress(100);
      return;
    } catch (error) {
      console.error(`[video-render] Modal.com delegation failed:`, error);
      throw error;
    } finally {
      client.close();
    }
  }

  const db = getSupabaseServiceClient();

  console.log(`[video-render] Starting for session ${videoId}`);
  await job.updateProgress(10);

  // ── 1. Fetch session (original video URL) ─────────────────────────────────
  const { data: sessionRow, error: sessionError } = await db
    .from("sessions")
    .select("video_url")
    .eq("id", videoId)
    .single();

  if (sessionError || !sessionRow?.video_url) {
    throw new Error(`[video-render] Session ${videoId} not found or missing video_url`);
  }

  // ── 2. Fetch narration (voice_url) ────────────────────────────────────────
  const { data: narrationRow, error: narrationError } = await db
    .from("narrations")
    .select("voice_url, persona_id")
    .eq("id", narrationId)
    .single();

  if (narrationError || !narrationRow?.voice_url) {
    throw new Error(`[video-render] Narration ${narrationId} not found or missing voice_url`);
  }

  await job.updateProgress(20);

  // ── 3. Download assets to tmp dir ─────────────────────────────────────────
  const tmpDir = path.join(os.tmpdir(), "pet-pov", videoId, "render");
  await fs.mkdir(tmpDir, { recursive: true });

  const videoPath = path.join(tmpDir, "input.mp4");
  const audioPath = path.join(tmpDir, "voice.mp3");
  const outputPath = path.join(tmpDir, "output.mp4");

  console.log(`[video-render] Downloading video from ${sessionRow.video_url}`);
  await downloadFile(sessionRow.video_url, videoPath);
  await job.updateProgress(35);

  console.log(`[video-render] Downloading audio from ${narrationRow.voice_url}`);
  await downloadFile(narrationRow.voice_url, audioPath);
  await job.updateProgress(50);

  // ── 4. Merge audio with video via FFmpeg ──────────────────────────────────
  console.log(`[video-render] Merging audio+video → ${outputPath}`);
  await mergeAudioWithVideo(videoPath, audioPath, outputPath);
  await job.updateProgress(70);

  // ── 5. Upload rendered video to Cloudinary ────────────────────────────────
  console.log(`[video-render] Uploading rendered video to Cloudinary`);
  const { secure_url: renderedUrl, public_id: renderedPublicId } = await uploadVideoToCloudinary(outputPath, videoId);
  console.log(`[video-render] Uploaded rendered video: ${renderedUrl}`);
  await job.updateProgress(85);

  // ── 6. Create GeneratedAsset record ───────────────────────────────────────
  await createGeneratedAsset(db, {
    session_id: videoId,
    mode: "recap",
    type: "video",
    cloudinary_url: renderedUrl,
    cloudinary_public_id: renderedPublicId,
  });

  // ── 7. Update session with rendered_video_url + status complete ────────────
  await db
    .from("sessions")
    .update({ rendered_video_url: renderedUrl, updated_at: new Date().toISOString() })
    .eq("id", videoId);

  await updateSessionStatus(db, videoId, "complete");
  await job.updateProgress(95);

  // ── 8. Cleanup tmp dir ────────────────────────────────────────────────────
  try {
    await fs.rm(tmpDir, { recursive: true, force: true });
  } catch {
    // non-fatal
  }

  await job.updateProgress(100);
  console.log(`[video-render] Pipeline complete for session ${videoId}`);
}

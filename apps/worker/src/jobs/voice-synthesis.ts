import type { Job } from "bullmq";
import { getSupabaseServiceClient, updateVideoStatus, getPersonaById } from "@pet-pov/db";
import { v2 as cloudinary } from "cloudinary";

export interface VoiceSynthesisJobData {
  videoId: string;
  narrationId: string;
}

/**
 * JOB: voice-synthesis
 *
 * Reads a stored narration script, generates a TTS audio file
 * using the persona's preferred voice and provider,
 * uploads it to Cloudinary, and updates the narration record.
 *
 * This is Step 8 of the pipeline: Generate TTS voiceover.
 */
export async function voiceSynthesisJob(job: Job): Promise<void> {
  const { videoId, narrationId } = job.data as VoiceSynthesisJobData;
  const db = getSupabaseServiceClient();

  await job.updateProgress(10);

  // TODO: Fetch narration record and persona from DB
  // const { data: narration } = await db.from("narrations").select("*, personas(*)").eq("id", narrationId).single();

  await job.updateProgress(30);

  // TODO: Select TTS provider based on persona.tts_provider
  // Currently supported: "elevenlabs" | "openai" | "google"
  // Call the appropriate TTS client

  await job.updateProgress(60);

  // TODO: Upload generated audio buffer to Cloudinary
  // const url = await uploadAudioToCloudinary(audioBuffer, videoId);

  await job.updateProgress(80);

  // TODO: Update narration record with voice_url
  // await db.from("narrations").update({ voice_url: url }).eq("id", narrationId);

  await updateVideoStatus(db, videoId, "voiced");
  await job.updateProgress(100);
}

import type { Job } from "bullmq";
import { getSupabaseServiceClient, updateSessionStatus } from "@pet-pov/db";
import { generateOpenAITTS } from "@pet-pov/ai";
import { v2 as cloudinary } from "cloudinary";
import { Queue } from "bullmq";
import { Readable } from "node:stream";

const pipelineQueue = new Queue("pipeline", {
  connection: { url: process.env["REDIS_URL"] ?? "redis://localhost:6379" },
});

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

export interface VoiceSynthesisJobData {
  videoId: string;
  narrationId: string;
}

type OpenAIVoice = "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer";

// Map persona_id to OpenAI TTS voice (fallback chain if ElevenLabs unavailable)
const PERSONA_OPENAI_VOICE: Record<string, OpenAIVoice> = {
  "dramatic-dog": "onyx",
  "neighborhood-boss": "echo",
  "chaotic-gremlin": "fable",
  "chill-cat": "nova",
  "royal-house-cat": "shimmer",
};

async function uploadAudioToCloudinary(audioBuffer: Buffer, sessionId: string, narrationId: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "video",
        folder: "pet-pov/audio",
        public_id: `${sessionId}-${narrationId}`,
        format: "mp3",
      },
      (err, result) => {
        if (err || !result) return reject(err ?? new Error("Cloudinary audio upload failed"));
        resolve(result.secure_url);
      }
    );
    Readable.from(audioBuffer).pipe(stream);
  });
}

/**
 * JOB: voice-synthesis
 *
 * Reads a stored narration script, generates TTS audio (ElevenLabs primary,
 * OpenAI fallback), uploads to Cloudinary, and updates the narration record.
 */
export async function voiceSynthesisJob(job: Job): Promise<void> {
  const { videoId, narrationId } = job.data as VoiceSynthesisJobData;
  const db = getSupabaseServiceClient();

  console.log(`[voice-synthesis] Starting for session ${videoId} narration ${narrationId}`);
  await job.updateProgress(10);

  // ── 1. Fetch narration record ──────────────────────────────────────────────
  const { data: narration, error: narrationError } = await db
    .from("narrations")
    .select("script, persona_id")
    .eq("id", narrationId)
    .single();

  if (narrationError || !narration) {
    throw new Error(`[voice-synthesis] Narration ${narrationId} not found: ${narrationError?.message}`);
  }

  const { script, persona_id: personaId } = narration;
  if (!script || script.trim().length === 0) {
    throw new Error(`[voice-synthesis] Narration ${narrationId} has empty script`);
  }

  await job.updateProgress(20);

  // ── 2. Synthesize TTS audio ────────────────────────────────────────────────
  let audioBuffer: Buffer | null = null;
  const elevenLabsKey = process.env["ELEVENLABS_API_KEY"];
  const openAiKey = process.env["OPENAI_API_KEY"];

  // Attempt ElevenLabs first (primary provider per HANDOFF.md)
  if (elevenLabsKey) {
    try {
      const { data: personaRow } = await db
        .from("personas")
        .select("voice_id")
        .eq("id", personaId)
        .single();

      const voiceId = personaRow?.voice_id;
      if (voiceId) {
        const elRes = await fetch(
          `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
          {
            method: "POST",
            headers: {
              "xi-api-key": elevenLabsKey,
              "Content-Type": "application/json",
              Accept: "audio/mpeg",
            },
            body: JSON.stringify({
              text: script,
              model_id: "eleven_monolingual_v1",
              voice_settings: { stability: 0.5, similarity_boost: 0.75 },
            }),
          }
        );

        if (elRes.ok) {
          audioBuffer = Buffer.from(await elRes.arrayBuffer());
          console.log(`[voice-synthesis] ElevenLabs TTS success (${audioBuffer.length} bytes)`);
        } else {
          console.warn(`[voice-synthesis] ElevenLabs TTS failed: ${elRes.status}`);
        }
      }
    } catch (err) {
      console.warn("[voice-synthesis] ElevenLabs error:", err);
    }
  }

  // Fallback to OpenAI TTS
  if (!audioBuffer && openAiKey) {
    try {
      const voice = PERSONA_OPENAI_VOICE[personaId] ?? "nova";
      audioBuffer = await generateOpenAITTS(script, voice);
      console.log(`[voice-synthesis] OpenAI TTS success (${audioBuffer.length} bytes), voice=${voice}`);
    } catch (err) {
      console.warn("[voice-synthesis] OpenAI TTS error:", err);
    }
  }

  if (!audioBuffer) {
    throw new Error(`[voice-synthesis] All TTS providers failed for narration ${narrationId}`);
  }

  await job.updateProgress(60);

  // ── 3. Upload audio to Cloudinary ─────────────────────────────────────────
  const audioUrl = await uploadAudioToCloudinary(audioBuffer, videoId, narrationId);
  console.log(`[voice-synthesis] Uploaded audio to Cloudinary: ${audioUrl}`);

  await job.updateProgress(80);

  // ── 4. Update narration record with voice_url ─────────────────────────────
  const { error: updateError } = await db
    .from("narrations")
    .update({ voice_url: audioUrl })
    .eq("id", narrationId);

  if (updateError) {
    console.warn(`[voice-synthesis] Failed to update narration.voice_url: ${updateError.message}`);
  }

  // ── 5. Update session status ───────────────────────────────────────────────
  await updateSessionStatus(db, videoId, "voiced");
  await job.updateProgress(90);

  // ── 6. Chain to video-render ───────────────────────────────────────────────
  const nextJob = await pipelineQueue.add(
    "video-render",
    { videoId, narrationId },
    { attempts: 3, backoff: { type: "exponential", delay: 2000 } }
  );
  console.log(`[voice-synthesis] Enqueued video-render job ${nextJob.id} for session ${videoId}`);

  await job.updateProgress(100);
  console.log(`[voice-synthesis] Complete for session ${videoId}`);
}

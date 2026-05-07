import type { Job } from "bullmq";
import {
  getSupabaseServiceClient,
  getSessionById,
  getPersonaById,
  getConversationTurns,
  createConversationTurn,
} from "@pet-pov/db";
import { encodeEvents } from "@pet-pov/toon";
import {
  generateChatCompletion,
  generateOpenAITTS,
  buildAskMyPetSystemPrompt,
  buildSessionSummaryForAsk,
  generateInsightsFromEvents,
} from "@pet-pov/ai";
import { v2 as cloudinary } from "cloudinary";
import { Readable } from "node:stream";
import type { SessionEvent } from "@pet-pov/db";

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

export interface ConversationGenerationJobData {
  sessionId: string;
  personaId: string;
  userMessage: string;
}

const PROCESSED_STATUSES = new Set([
  "events_extracted",
  "toon_converted",
  "narrated",
  "voiced",
  "rendered",
  "complete",
]);

type OpenAIVoice = "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer";
const PERSONA_VOICE: Record<string, OpenAIVoice> = {
  "dramatic-dog": "onyx",
  "neighborhood-boss": "echo",
  "chaotic-gremlin": "fable",
  "chill-cat": "nova",
  "royal-house-cat": "shimmer",
};

async function uploadAudioToCloudinary(
  audioBuffer: Buffer,
  sessionId: string,
  turnTimestamp: number
): Promise<string> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "video",
        folder: "pet-pov/conversation",
        public_id: `${sessionId}-turn-${turnTimestamp}`,
        format: "mp3",
      },
      (err, result) => {
        if (err || !result) return reject(err ?? new Error("Cloudinary conversation audio upload failed"));
        resolve(result.secure_url);
      }
    );
    Readable.from(audioBuffer).pipe(stream);
  });
}

/**
 * JOB: conversation-generation
 *
 * Ask My Pet mode — generates a simulated pet response to a user question,
 * synthesizes TTS audio, and persists the conversation turn.
 *
 * This is the async worker version of POST /api/sessions/:id/ask.
 * ⚠️ Creative character simulation — not animal translation.
 */
export async function conversationGenerationJob(job: Job): Promise<void> {
  const { sessionId, personaId, userMessage } = job.data as ConversationGenerationJobData;
  const db = getSupabaseServiceClient();

  console.log(`[conversation-generation] Starting for session ${sessionId}`);
  await job.updateProgress(5);

  // ── 1. Fetch session + verify processed ───────────────────────────────────
  const session = await getSessionById(db, sessionId);
  if (!session) throw new Error(`[conversation-generation] Session not found: ${sessionId}`);
  if (!PROCESSED_STATUSES.has(session.status)) {
    throw new Error(
      `[conversation-generation] Session ${sessionId} not yet processed — status: ${session.status}`
    );
  }

  await job.updateProgress(15);

  // ── 2. Fetch events and encode to TOON ────────────────────────────────────
  const { data: eventsRow } = await db
    .from("session_events")
    .select("events")
    .eq("session_id", sessionId)
    .single();

  const events: SessionEvent[] = eventsRow?.events ?? [];
  const toon = encodeEvents(events);

  await job.updateProgress(25);

  // ── 3. Fetch pet name + species ────────────────────────────────────────────
  let petName = "Your Pet";
  let petSpecies = "pet";
  if (session.pet_id) {
    const { data: petRow } = await db
      .from("pets")
      .select("name, species")
      .eq("id", session.pet_id)
      .single();
    petName = petRow?.name ?? "Your Pet";
    petSpecies = petRow?.species ?? "pet";
  }

  // ── 4. Fetch persona ───────────────────────────────────────────────────────
  const persona = await getPersonaById(db, personaId);
  if (!persona) throw new Error(`[conversation-generation] Persona not found: ${personaId}`);

  await job.updateProgress(35);

  // ── 5. Load last 10 conversation turns for context ────────────────────────
  const allTurns = await getConversationTurns(db, sessionId);
  const recentTurns = allTurns.slice(-10);

  await job.updateProgress(45);

  // ── 6. Build system prompt + multi-turn user message ──────────────────────
  const insights = generateInsightsFromEvents(events);
  const sessionSummary = buildSessionSummaryForAsk(petName, events);
  const systemPrompt = buildAskMyPetSystemPrompt(
    persona,
    sessionSummary,
    insights,
    toon,
    petName,
    petSpecies
  );

  // Prepend history as plain text context (generateChatCompletion is single-turn)
  const historyContext =
    recentTurns.length > 0
      ? `[Conversation so far]\n${recentTurns
          .map((t) => `Human: ${t.user_message}\nPet: ${t.pet_response}`)
          .join("\n")}\n\n[New question]\n`
      : "";

  const fullUserMessage = `${historyContext}${userMessage}`;

  // ── 7. Generate pet response ───────────────────────────────────────────────
  const petResponse = await generateChatCompletion(systemPrompt, fullUserMessage, "llama-3.1-8b-instant");
  console.log(`[conversation-generation] Generated response (${petResponse.length} chars)`);

  await job.updateProgress(70);

  // ── 8. Synthesize TTS audio (ElevenLabs primary, OpenAI fallback) ─────────
  let audioUrl: string | null = null;
  const elevenLabsKey = process.env["ELEVENLABS_API_KEY"];
  const openAiKey = process.env["OPENAI_API_KEY"];

  if (elevenLabsKey && persona.voice_id) {
    try {
      const elRes = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${persona.voice_id}`,
        {
          method: "POST",
          headers: {
            "xi-api-key": elevenLabsKey,
            "Content-Type": "application/json",
            Accept: "audio/mpeg",
          },
          body: JSON.stringify({
            text: petResponse,
            model_id: "eleven_monolingual_v1",
            voice_settings: { stability: 0.5, similarity_boost: 0.75 },
          }),
        }
      );
      if (elRes.ok) {
        const buf = Buffer.from(await elRes.arrayBuffer());
        audioUrl = await uploadAudioToCloudinary(buf, sessionId, Date.now());
        console.log(`[conversation-generation] ElevenLabs TTS success`);
      }
    } catch (err) {
      console.warn("[conversation-generation] ElevenLabs TTS failed:", err);
    }
  }

  if (!audioUrl && openAiKey) {
    try {
      const voice = PERSONA_VOICE[personaId] ?? "nova";
      const buf = await generateOpenAITTS(petResponse, voice);
      audioUrl = await uploadAudioToCloudinary(buf, sessionId, Date.now());
      console.log(`[conversation-generation] OpenAI TTS success`);
    } catch (err) {
      console.warn("[conversation-generation] OpenAI TTS failed:", err);
    }
  }

  await job.updateProgress(90);

  // ── 9. Persist conversation turn ──────────────────────────────────────────
  await createConversationTurn(db, {
    session_id: sessionId,
    persona_id: personaId,
    user_message: userMessage,
    pet_response: petResponse,
    audio_url: audioUrl,
  });

  console.log(`[conversation-generation] Turn persisted for session ${sessionId}`);
  await job.updateProgress(100);
}

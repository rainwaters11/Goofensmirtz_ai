import type { Job } from "bullmq";
import {
  getSupabaseServiceClient,
  getSessionById,
  getPersonaById,
  getConversationTurns,
  createConversationTurn,
} from "@pet-pov/db";
import { encodeEvents } from "@pet-pov/toon";
import { generateChatCompletion, buildNarrationSystemPrompt } from "@pet-pov/ai";

export interface ConversationGenerationJobData {
  sessionId: string;
  personaId: string;
  userMessage: string;
}

/**
 * JOB: conversation-generation
 *
 * Ask My Pet mode — generates a simulated pet response to a user question.
 * This is the async worker version of POST /api/ask.
 *
 * INPUT (job.data):
 *   - sessionId: string UUID — the processed session to use as context
 *   - personaId: string UUID — the persona to respond as
 *   - userMessage: string — the user's question
 *
 * OUTPUT:
 *   - ConversationTurn stored in `conversation_turns` table
 *   - Audio file uploaded to Cloudinary (voice_url on the turn record)
 *
 * ⚠️ This produces creative character simulation — not animal translation.
 */
export async function conversationGenerationJob(job: Job): Promise<void> {
  const { sessionId, personaId, userMessage } =
    job.data as ConversationGenerationJobData;

  const db = getSupabaseServiceClient();
  await job.updateProgress(5);

  // TODO [Phase 5]: Fetch session and verify it has been processed.
  //   INPUT:  sessionId (string UUID)
  //   OUTPUT: session (Session) — throw if not found or not processed
  //   SERVICE: getSessionById() from @pet-pov/db
  //
  // const session = await getSessionById(db, sessionId);
  // if (!session) throw new Error(`Session not found: ${sessionId}`);
  // const processedStatuses = ["events_extracted", "narrated", "voiced", "rendered", "complete"];
  // if (!processedStatuses.includes(session.status)) {
  //   throw new Error(`Session ${sessionId} has not been processed — status: ${session.status}`);
  // }
  await job.updateProgress(15);

  // TODO [Phase 5]: Fetch SessionEvent[] and encode to TOON for context window.
  //   INPUT:  sessionId (string UUID)
  //   OUTPUT: toon (string) — compact context for the LLM
  //   SERVICES:
  //     - Supabase: db.from("session_events").select("events").eq("session_id", sessionId)
  //     - @pet-pov/toon: encodeEvents(events)
  //
  // const { data: eventsRow } = await db.from("session_events").select("events").eq("session_id", sessionId).single();
  // const toon = encodeEvents(eventsRow?.events ?? []);
  await job.updateProgress(30);

  // TODO [Phase 5]: Fetch persona.
  //   INPUT:  personaId (string UUID)
  //   OUTPUT: persona (Persona) — throw if not found
  //   SERVICE: getPersonaById() from @pet-pov/db
  //
  // const persona = await getPersonaById(db, personaId);
  // if (!persona) throw new Error(`Persona not found: ${personaId}`);
  await job.updateProgress(40);

  // TODO [Phase 5]: Load conversation history (last N turns for context).
  //   INPUT:  sessionId (string UUID)
  //   OUTPUT: history (ConversationTurn[]) — chronological order
  //   SERVICE: getConversationTurns() from @pet-pov/db
  //
  // const history = await getConversationTurns(db, sessionId);
  // Format as: [{ role: "user", content: t.user_message }, { role: "assistant", content: t.pet_response }]
  await job.updateProgress(50);

  // TODO [Phase 5]: Build Ask My Pet system prompt.
  //   INPUT:  persona (Persona), toon (string)
  //   OUTPUT: systemPrompt (string)
  //   SERVICE: buildAskMyPetSystemPrompt() — must be created in packages/ai/src/prompts/ask-my-pet.ts
  //   NOTE: This differs from buildNarrationSystemPrompt:
  //     - Must frame responses as conversational Q&A (first-person character)
  //     - Must inject TOON events as context (so the pet "remembers" the session)
  //     - Must include conversation history for multi-turn coherence
  //
  // const systemPrompt = buildAskMyPetSystemPrompt(persona, toon);

  // TODO [Phase 5]: Generate pet response via OpenAI GPT-4o.
  //   INPUT:  systemPrompt (string), userMessage (string)
  //   OUTPUT: petResponse (string)
  //   SERVICE: generateChatCompletion() from @pet-pov/ai
  //   Reads from: OPENAI_API_KEY
  //
  // const petResponse = await generateChatCompletion(systemPrompt, userMessage);
  await job.updateProgress(75);

  // TODO [Phase 5]: Synthesize TTS audio for the response.
  //   INPUT:  petResponse (string), persona.voice_id (string), persona.tts_provider ("elevenlabs" | "openai" | "google")
  //   OUTPUT: audioUrl (string) — Cloudinary URL of the uploaded audio file
  //   SERVICE: synthesizeVoice() — must be created in packages/ai/src/clients/tts.ts
  //   Primary provider: ElevenLabs. Reads from: ELEVENLABS_API_KEY
  //
  // const audioUrl = await synthesizeVoice(petResponse, persona.voice_id, persona.tts_provider);
  await job.updateProgress(90);

  // TODO [Phase 5]: Persist the conversation turn.
  //   INPUT:  sessionId, personaId, userMessage, petResponse, audioUrl
  //   OUTPUT: turn record stored in `conversation_turns` table
  //   SERVICE: createConversationTurn() from @pet-pov/db
  //
  // await createConversationTurn(db, {
  //   session_id: sessionId,
  //   persona_id: personaId,
  //   user_message: userMessage,
  //   pet_response: petResponse,
  //   audio_url: audioUrl ?? null,
  // });

  console.log(`[conversation-generation] Turn completed for session ${sessionId}`);
  await job.updateProgress(100);
}

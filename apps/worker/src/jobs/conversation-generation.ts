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
 *
 * Steps:
 * 1. Fetch session events and encode to TOON for context
 * 2. Fetch conversation history for the session
 * 3. Build persona system prompt + TOON context
 * 4. Generate pet response (OpenAI GPT-4o)
 * 5. Synthesize TTS audio for the response
 * 6. Persist ConversationTurn in DB
 *
 * ⚠️ This produces creative character simulation — not animal translation.
 */
export async function conversationGenerationJob(job: Job): Promise<void> {
  const { sessionId, personaId, userMessage } =
    job.data as ConversationGenerationJobData;

  const db = getSupabaseServiceClient();
  await job.updateProgress(5);

  // TODO: Fetch session and verify it has been processed
  // const session = await getSessionById(db, sessionId);
  // if (!session) throw new Error(`Session not found: ${sessionId}`);
  await job.updateProgress(15);

  // TODO: Fetch SessionEvent[] and encode to TOON for context window
  // const { data: eventsRow } = await db.from("session_events").select("events").eq("session_id", sessionId).single();
  // const toon = encodeEvents(eventsRow?.events ?? []);
  await job.updateProgress(30);

  // TODO: Fetch persona
  // const persona = await getPersonaById(db, personaId);
  // if (!persona) throw new Error(`Persona not found: ${personaId}`);
  await job.updateProgress(40);

  // TODO: Load conversation history (last N turns for context)
  // const history = await getConversationTurns(db, sessionId);
  await job.updateProgress(50);

  // TODO: Build Ask My Pet system prompt
  // Differs from narration — must stay in-character for Q&A, not monologue
  // const systemPrompt = buildAskMyPetSystemPrompt(persona, toon);

  // TODO: Generate response
  // const petResponse = await generateChatCompletion(systemPrompt, userMessage);
  await job.updateProgress(75);

  // TODO: Synthesize TTS audio
  // const audioUrl = await synthesizeVoice(petResponse, persona.voice_id, persona.tts_provider);
  await job.updateProgress(90);

  // TODO: Persist the turn
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

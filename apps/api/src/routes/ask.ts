import { Router } from "express";
import { z } from "zod";
import {
  getSupabaseServiceClient,
  getSessionById,
  getPersonaById,
  getConversationTurns,
  createConversationTurn,
} from "@pet-pov/db";
import { encodeEvents } from "@pet-pov/toon";
import { generateChatCompletion } from "@pet-pov/ai";
import { buildNarrationSystemPrompt } from "@pet-pov/ai";

const router = Router();

const AskBodySchema = z.object({
  sessionId: z.string().uuid(),
  personaId: z.string().uuid(),
  message: z.string().min(1).max(1000),
});

/**
 * POST /api/ask
 *
 * Ask My Pet mode — generates a simulated pet response to a user question.
 *
 * INPUT:
 *   - body.sessionId: UUID of a processed session (must have status >= "events_extracted")
 *   - body.personaId: UUID of the persona to respond as
 *   - body.message:   The user's question (1–1000 chars)
 *
 * OUTPUT:
 *   - 200 { response: string, audioUrl: string | null, turnId: string }
 *
 * SERVICES (in order):
 *   1. Supabase: getSessionById() → verify session exists and has been processed
 *   2. Supabase: fetch `session_events.events` for context
 *   3. @pet-pov/toon: encodeEvents() → TOON string (in-memory)
 *   4. Supabase: getPersonaById() → persona for system prompt
 *   5. @pet-pov/ai: buildAskMyPetSystemPrompt(persona, toon) — NOTE: this function
 *      does not yet exist. Create it in packages/ai/src/prompts/ask-my-pet.ts.
 *      It differs from buildNarrationSystemPrompt — it must frame responses as Q&A
 *      not monologue, and stay in first-person character.
 *   6. Supabase: getConversationTurns(db, sessionId) → format as chat history
 *   7. @pet-pov/ai: generateChatCompletion(systemPrompt, message) via OpenAI GPT-4o
 *      Reads from: OPENAI_API_KEY
 *   8. TTS: synthesizeVoice(petResponse, persona.voice_id, persona.tts_provider)
 *      Primary provider: ElevenLabs. Reads from: ELEVENLABS_API_KEY
 *      NOTE: synthesizeVoice() does not yet exist. Create it in packages/ai/src/clients/tts.ts
 *   9. Supabase: createConversationTurn() → writes to `conversation_turns` table
 *
 * ⚠️ This endpoint simulates a pet's perspective for creative purposes.
 *    It does NOT claim to translate or interpret real animal cognition.
 */
router.post("/", async (req, res, next) => {
  try {
    const body = AskBodySchema.safeParse(req.body);
    if (!body.success) {
      res.status(400).json({ error: "Invalid request body", details: body.error.flatten() });
      return;
    }

    const { sessionId, personaId, message } = body.data;
    const db = getSupabaseServiceClient();

    // TODO [Phase 5]: Fetch session and verify it has events extracted.
    //   INPUT:  sessionId (string UUID)
    //   OUTPUT: session (Session) with session.status
    //   SERVICE: getSessionById() from @pet-pov/db
    //
    // const session = await getSessionById(db, sessionId);
    // if (!session) {
    //   res.status(404).json({ error: "Session not found" });
    //   return;
    // }
    // const processedStatuses = ["events_extracted", "narrated", "voiced", "rendered", "complete"];
    // if (!processedStatuses.includes(session.status)) {
    //   res.status(409).json({ error: "Session events not yet extracted — run the pipeline first" });
    //   return;
    // }

    // TODO [Phase 5]: Fetch SessionEvent[] for context.
    //   INPUT:  sessionId (string UUID)
    //   OUTPUT: events (SessionEvent[])
    //   SERVICE: Supabase `session_events` table
    //
    // const { data: eventsRow } = await db.from("session_events").select("events").eq("session_id", sessionId).single();
    // const toon = encodeEvents(eventsRow?.events ?? []);

    // TODO [Phase 5]: Fetch persona and build Ask My Pet system prompt.
    //   INPUT:  personaId (string UUID), toon (string)
    //   OUTPUT: systemPrompt (string)
    //   SERVICES: getPersonaById(), buildAskMyPetSystemPrompt() — must be created
    //   NOTE: buildAskMyPetSystemPrompt lives in packages/ai/src/prompts/ask-my-pet.ts (not yet created)
    //
    // const persona = await getPersonaById(db, personaId);
    // if (!persona) {
    //   res.status(404).json({ error: "Persona not found" });
    //   return;
    // }
    // const systemPrompt = buildAskMyPetSystemPrompt(persona, toon);

    // TODO [Phase 5]: Fetch conversation history for this session (last N turns).
    //   INPUT:  sessionId (string UUID)
    //   OUTPUT: history (ConversationTurn[])
    //   SERVICE: getConversationTurns() from @pet-pov/db
    //
    // const history = await getConversationTurns(db, sessionId);
    // Format as: [{ role: "user", content: turn.user_message }, { role: "assistant", content: turn.pet_response }]

    // TODO [Phase 5]: Generate pet response via OpenAI GPT-4o.
    //   INPUT:  systemPrompt (string), message (string), formatted history
    //   OUTPUT: petResponse (string)
    //   SERVICE: generateChatCompletion() from @pet-pov/ai
    //   Reads from: OPENAI_API_KEY
    //
    // const petResponse = await generateChatCompletion(systemPrompt, message);

    // TODO [Phase 5]: Synthesize TTS audio for the response.
    //   INPUT:  petResponse (string), persona.voice_id (string), persona.tts_provider (TtsProvider)
    //   OUTPUT: audioUrl (string) — Cloudinary URL of the audio file
    //   SERVICE: synthesizeVoice() — must be created in packages/ai/src/clients/tts.ts
    //   Primary provider: ElevenLabs. Reads from: ELEVENLABS_API_KEY
    //   NOTE: audioUrl is optional at MVP — return null if TTS is not yet implemented
    //
    // const audioUrl = await synthesizeVoice(petResponse, persona.voice_id, persona.tts_provider);

    // TODO [Phase 5]: Persist the conversation turn.
    //   INPUT:  sessionId, personaId, user_message, pet_response, audio_url
    //   OUTPUT: turn (ConversationTurn) with turn.id
    //   SERVICE: createConversationTurn() from @pet-pov/db → writes to `conversation_turns`
    //
    // const turn = await createConversationTurn(db, {
    //   session_id: sessionId,
    //   persona_id: personaId,
    //   user_message: message,
    //   pet_response: petResponse,
    //   audio_url: audioUrl ?? null,
    // });

    // TODO [Phase 5]: Return the real response:
    // return res.status(200).json({ response: petResponse, audioUrl: audioUrl ?? null, turnId: turn.id });

    res.status(202).json({
      message: "Ask My Pet endpoint ready — implementation pending",
      sessionId,
      personaId,
      userMessage: message,
    });
  } catch (err) {
    next(err);
  }
});

export { router as askRouter };

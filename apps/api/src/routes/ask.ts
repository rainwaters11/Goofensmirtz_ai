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
 * Flow:
 * 1. Fetch session and validate it has been processed
 * 2. Fetch SessionEvent[] and encode to TOON for context
 * 3. Fetch conversation history for this session
 * 4. Build persona system prompt + TOON context + conversation history
 * 5. Generate pet response via OpenAI
 * 6. Store ConversationTurn
 * 7. Return response text (+ audio URL once TTS is wired)
 *
 * Returns: { response, audioUrl, turnId }
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

    // TODO: Fetch session and verify it has events extracted
    // const session = await getSessionById(db, sessionId);
    // if (!session) {
    //   res.status(404).json({ error: "Session not found" });
    //   return;
    // }
    // if (!["events_extracted", "narrated", "voiced", "rendered", "complete"].includes(session.status)) {
    //   res.status(409).json({ error: "Session events not yet extracted — run the pipeline first" });
    //   return;
    // }

    // TODO: Fetch SessionEvent[] for context
    // const { data: eventsRow } = await db.from("session_events").select("events").eq("session_id", sessionId).single();
    // const toon = encodeEvents(eventsRow?.events ?? []);

    // TODO: Fetch persona and build system prompt
    // const persona = await getPersonaById(db, personaId);
    // if (!persona) {
    //   res.status(404).json({ error: "Persona not found" });
    //   return;
    // }
    // const systemPrompt = buildAskMyPetSystemPrompt(persona, toon);

    // TODO: Fetch conversation history (last N turns for context window)
    // const history = await getConversationTurns(db, sessionId);
    // const historyContext = formatConversationHistory(history);

    // TODO: Generate response using OpenAI
    // const petResponse = await generateChatCompletion(systemPrompt, message, historyContext);

    // TODO: Synthesize TTS audio for the response (optional at MVP)
    // const audioUrl = await synthesizeVoice(petResponse, persona.voice_id, persona.tts_provider);

    // TODO: Persist the conversation turn
    // const turn = await createConversationTurn(db, {
    //   session_id: sessionId,
    //   persona_id: personaId,
    //   user_message: message,
    //   pet_response: petResponse,
    //   audio_url: audioUrl ?? null,
    // });

    res.status(202).json({
      message: "Ask My Pet endpoint ready — implementation pending",
      sessionId,
      personaId,
      userMessage: message,
      // TODO: return { response: petResponse, audioUrl, turnId: turn.id }
    });
  } catch (err) {
    next(err);
  }
});

export { router as askRouter };

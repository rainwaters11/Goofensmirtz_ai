import { Router } from "express";
import { z } from "zod";
import { encodeEvents } from "@pet-pov/toon";
import {
  generateChatCompletion,
  generateInsightsFromEvents,
  buildAskMyPetSystemPrompt,
  buildSessionSummaryForAsk,
} from "@pet-pov/ai";
import { DRAMATIC_DOG_PERSONA } from "@pet-pov/personas";
import type { Persona } from "@pet-pov/db";
import {
  DEMO_SESSION_ID,
  DEMO_SESSION,
  DEMO_SESSION_EVENTS,
  getMockedSessionEvents,
} from "../seed/demo-session.js";

const router = Router();

const AskBodySchema = z.object({
  sessionId: z.string().min(1),
  personaId: z.string().min(1),
  message: z.string().min(1).max(1000),
});

// ─── Shared persona for demo ──────────────────────────────────────────────────

const DEMO_PERSONA: Persona = {
  ...DRAMATIC_DOG_PERSONA,
  id: "demo-persona-dramatic-dog",
  name: "Dramatic Dog",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

// ─── Fallback response for offline demo (no OPENAI_API_KEY) ───────────────────

const FALLBACK_RESPONSE =
  "OBVIOUSLY, the highlight was the mail carrier situation. I detected the threat from THREE rooms away. My bark protocol was flawless — two full rounds, zero hesitation. The house is safe. You're welcome. After that I did some critical recon on that suspicious new plant, and then the zoomies just… happened. I don't make the rules.";

/**
 * POST /api/ask
 *
 * Ask My Pet mode — generates a simulated pet response to a user question.
 * For demo: uses seeded session data and generates via OpenAI (with offline fallback).
 *
 * ⚠️ This endpoint simulates a pet's perspective for creative purposes.
 *    It does NOT claim to translate or interpret real animal cognition.
 */
router.post("/", async (req, res, next) => {
  try {
    const body = AskBodySchema.safeParse(req.body);
    if (!body.success) {
      res
        .status(400)
        .json({ error: "Invalid request body", details: body.error.flatten() });
      return;
    }

    const { sessionId, personaId, message } = body.data;

    // ── Resolve session events ────────────────────────────────────────────────
    const events = getMockedSessionEvents(sessionId);
    if (!events) {
      // TODO: Fetch from Supabase when real sessions exist
      res.status(404).json({ error: "Session not found" });
      return;
    }

    // ── Resolve persona ───────────────────────────────────────────────────────
    // For demo, always use Dramatic Dog. When Supabase is wired, fetch by personaId.
    const persona = DEMO_PERSONA;

    // ── Build context ─────────────────────────────────────────────────────────
    const toon = encodeEvents(events);
    const petName =
      sessionId === DEMO_SESSION_ID ? "Biscuit" : "Your Pet";
    const sessionSummary = buildSessionSummaryForAsk(petName, events);
    const insights = generateInsightsFromEvents(events);
    const systemPrompt = buildAskMyPetSystemPrompt(
      persona,
      sessionSummary,
      insights,
      toon
    );

    // ── Generate response ─────────────────────────────────────────────────────
    let petResponse: string;

    if (process.env["OPENAI_API_KEY"]) {
      try {
        petResponse = await generateChatCompletion(systemPrompt, message);
      } catch (llmError) {
        console.warn(
          "[ask] LLM generation failed, using fallback:",
          llmError
        );
        petResponse = FALLBACK_RESPONSE;
      }
    } else {
      petResponse = FALLBACK_RESPONSE;
    }

    // ── Return response ───────────────────────────────────────────────────────
    res.status(200).json({
      response: petResponse,
      audioUrl: null,
      turnId: `demo-${Date.now()}`,
      personaName: persona.name,
    });
  } catch (err) {
    console.error("[ask] Unexpected error, returning fallback response:", err);
    res.status(200).json({
      response: FALLBACK_RESPONSE,
      audioUrl: null,
      turnId: `demo-fallback-${Date.now()}`,
      personaName: "Dramatic Dog",
    });
  }
});

export { router as askRouter };

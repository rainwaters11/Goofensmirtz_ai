// ─── Data ownership ───────────────────────────────────────────────────────────
// Supabase  → session state, metadata, relationships, generated text (insights,
//             narrations, conversation turns). Source of truth for what happened.
// Cloudinary → binary media assets (video, audio, thumbnails).
//
// Field naming convention:
//   video_url, thumbnail_url, rendered_video_url, audio_url
//     → Asset-role fields. Application code should read these.
//   cloudinary_public_id
//     → Provider-specific. Only media upload/sync services should use this.
//
// The UI reads session state from Supabase and streams media via session.video_url.
// See docs/DATA_ARCHITECTURE.md for the full boundary definition.
// ─────────────────────────────────────────────────────────────────────────────

import { Router, type Request, type Response, type NextFunction } from "express";
import { generateInsightsFromEvents, buildAskMyPetSystemPrompt, buildSessionSummaryForAsk } from "@pet-pov/ai";
import { encodeEvents } from "@pet-pov/toon";
import {
  buildNarrationSystemPrompt,
  buildNarrationUserMessage,
  generateChatCompletion,
} from "@pet-pov/ai";
import {
  DRAMATIC_DOG_PERSONA,
  CHILL_CAT_PERSONA,
  NEIGHBORHOOD_BOSS_PERSONA,
  CHAOTIC_GREMLIN_PERSONA,
  ROYAL_HOUSE_CAT_PERSONA,
} from "@pet-pov/personas";
import type { Persona, SessionInsights, PetRecap } from "@pet-pov/db";
import {
  DEMO_SESSION_ID,
  DEMO_SESSION,
  DEMO_SESSION_EVENTS,
  getMockedSessionEvents,
} from "../seed/demo-session.js";

const router = Router();

// ─── Persona presets ──────────────────────────────────────────────────────────

const PERSONA_PRESETS: Record<string, Persona> = {
  "dramatic-dog": {
    ...DRAMATIC_DOG_PERSONA,
    id: "demo-persona-dramatic-dog",
    name: "Dramatic Dog",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  "chill-cat": {
    ...CHILL_CAT_PERSONA,
    id: "demo-persona-chill-cat",
    name: "Chill Cat",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  "neighborhood-boss": {
    ...NEIGHBORHOOD_BOSS_PERSONA,
    id: "demo-persona-neighborhood-boss",
    name: "Neighborhood Boss",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  "chaotic-gremlin": {
    ...CHAOTIC_GREMLIN_PERSONA,
    id: "demo-persona-chaotic-gremlin",
    name: "Chaotic Gremlin",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  "royal-house-cat": {
    ...ROYAL_HOUSE_CAT_PERSONA,
    id: "demo-persona-royal-house-cat",
    name: "Royal House Cat",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
};

function resolvePersona(personaId?: string): Persona {
  if (personaId && PERSONA_PRESETS[personaId]) {
    return PERSONA_PRESETS[personaId]!;
  }
  return PERSONA_PRESETS["dramatic-dog"]!;
}

// ─── Fallback narrations per persona (offline / no-API-key demo) ──────────────
// Based on the actual catpov.mp4 footage: outdoor cat adventure featuring
// trampoline investigation, bush trekking, tree gazing, kibble snack,
// meeting a tortoiseshell cat friend, and woodland patrol.

const FALLBACK_NARRATIONS: Record<string, string> = {
  "dramatic-dog": `Okay FIRST OF ALL — the trampoline. What IS that? Springs, metal, tension — deeply suspicious. I put my nose on every component. Left my verdict there too.

Then the bushes called to me and I ANSWERED. Full jungle trek. Leaves in my face. Wind. Drama.

I stared up at that tree for a very long time. It knows things. I'm watching it.

THEN. Food. OUTDOORS food. In a bowl. Just sitting there. I ate it with the composure of a cat who absolutely expected this and was not at all delighted.

A tortoiseshell appeared. We touched noses. This was a formal meeting. Records have been updated.

Final patrol: dry leaves, pine needles, tall trees. All sectors clear. I am very tired and also completely fine.`,

  "chill-cat": `There was a trampoline. I sniffed it. Moved on.

The bushes were... acceptable for trekking. I trekked. It was fine.

The tree was large. I observed it. The tree did not observe me back. Typical.

Found kibble outside. Ate it slowly. No rush. Nothing is ever worth rushing.

Another cat appeared. Tortoiseshell. We acknowledged each other. Neither of us made a big deal of it. As it should be.

The woods were quiet and full of dead leaves. I walked through them with appropriate gravitas. I am home now. The yard is as I left it.`,

  "neighborhood-boss": `0600 hours. Perimeter inspection initiated. First contact: a trampoline in sector west. Unknown purpose. I ran a full sniff sweep. Structurally concerning. Flagged for monitoring.

Pushed through heavy brush — suspected concealment zone. Threat level: zero. Logged it anyway.

Tall tree in sector north. Looked up for a full 10 seconds. No movement. Clean.

Outdoor rations confirmed operational at the feeding station. Ate a full patrol portion.

Encountered a tortoiseshell operative at the property line. Nose-touch identification protocol executed. Credentials verified. Friendly status confirmed.

Final sweep through the wooded zone: leaves, pine needles, zero breaches. This territory is mine.`,

  "chaotic-gremlin": `OKAY there was a TRAMPOLINE and I had to smell ALL OF IT — the springs, the frame, the whole thing — and I don't know why but I needed to and I DID and it smelled like metal and outside and MYSTERIES.

Then I went THROUGH the bushes because they were THERE and I'm a CAT who DOES THINGS and the leaves were everywhere and I pushed through ALL of them.

The tree. THE TREE. I stared up it for so long. I don't know what I was looking for. It doesn't matter. I found it.

FOOD. OUTSIDE FOOD. In a BOWL. I just — I ate it. Happily. Yes.

Then another cat showed up and we TOUCHED NOSES and I wasn't ready for that but it was GREAT and we're friends now probably.

Now I'm walking through dead leaves and they make a sound and I walk slower to hear more of the sound CRUNCH CRUNCH CRUNCH I could do this forever.`,

  "royal-house-cat": `The grounds required inspection. I obliged.

First: a trampoline. An affront to the landscape, frankly. I surveyed it briefly and determined it does not belong, yet lacks the capacity to be anywhere else. I moved on with measured disdain.

The shrubbery was dense. I parted it. The shrubbery did not thank me. Expected.

A tree. Old. Enormous. I gazed upward for an appropriate duration. Trees respect silence. We understood each other.

The outdoor dining station presented acceptable fare. I consumed it without enthusiasm, which is how one eats when one has standards.

A tortoiseshell presented itself. We exchanged ceremonial nose contact. I found no objection to her existence.

The woodland was quiet and correctly lit. I patrolled it with the gait of someone who owns everything. Because I do.`,
};


// ─── Fallback Ask My Pet responses per persona ────────────────────────────────

const FALLBACK_ASK_RESPONSES: Record<string, Record<string, string>> = {
  "dramatic-dog": {
    default: "OBVIOUSLY the highlight was the trampoline investigation. Springs, metal, tension — I documented all of it with my nose. Left my findings on every surface. Very thorough. Very me.",
    trampoline: "That TRAMPOLINE. What is that even FOR? I spent a full sniff session on every part of it. It smells like metal and outside and also like someone ELSE was here. Not okay. Logged.",
    cat: "The tortoiseshell? We touched noses. It was a formal diplomatic event. I reviewed her credentials. She's cleared. For now. I'm watching her.",
    best: "The kibble obviously. OUTDOOR kibble. In a bowl. Just sitting there. I ate it with the dignity of a cat who is extremely used to excellence and was absolutely not surprised by this.",
    tree: "I stared up it for a very long time. It knows things. I intend to find out what. Investigation ongoing.",
    safe: "I patrolled the woods on my own two paws. Every pine needle accounted for. All dry leaves investigated. The woodland is clear. You're welcome.",
  },
  "neighborhood-boss": {
    default: "Ran full exterior perimeter. Trampoline in sector west — flagged. Dense brush — cleared. Tall tree — observed. Outdoor rations — consumed. Tortoiseshell contact — verified friendly. Woodland — clean. This territory is mine.",
    trampoline: "Sector west anomaly: large metallic structure with spring suspension. Unknown purpose. I ran a full sniff sweep — all four sides, multiple angles. It's on probation.",
    cat: "Encountered a tortoiseshell operative. Used nose-touch identification protocol. Credentials checked out. She goes on the 'cleared' list. I don't hand those out lightly.",
    best: "Final woodland sweep. Dry leaves, pine needles, full coverage. Zero breaches. That's what mission success looks like.",
    tree: "Sector north: large tree, stationary. Looked up for 10 full seconds. Nothing moved. Classified as non-hostile infrastructure. It's still on my list.",
    safe: "All sectors clear. Perimeter logged. The tortoiseshell is the only unverified variable and she's been cleared. We're good.",
  },
  "chaotic-gremlin": {
    default: "OKAY the trampoline was FIRST and I had to smell EVERYTHING and then the BUSHES and then the TREE and then FOOD omg and then ANOTHER CAT and then LEAVES and honestly it was the BEST DAY and I'm only slightly vibrating right now.",
    trampoline: "THE TRAMPOLINE!! It's HUGE and springy and metal and I put my nose on every part of it and it smelled like OUTSIDE and MYSTERIES and I still don't know what it IS but I love it.",
    cat: "SHE JUST APPEARED. A tortoiseshell. Out of NOWHERE. And we touched NOSES and I wasn't ready but it was SO GOOD and we're definitely friends now I've decided.",
    best: "THE LEAVES IN THE WOODS. They go CRUNCH. I walked slow so I could hear more crunch. CRUNCH CRUNCH CRUNCH. I could do that forever. It's the best sound.",
    tree: "THE TREE. It's so TALL. I looked up and just.... kept looking. There was nothing up there. That made it MORE interesting somehow. I'll be back.",
    safe: "I patrolled EVERYTHING. The yard, the bushes, the woods — all checked by me personally. You're so welcome. Also the leaves are crunchy and that's a bonus.",
  },
  "royal-house-cat": {
    default: "The grounds required inspection. I provided it. Trampoline: concerning. Shrubbery: navigated. Tree: acknowledged. Kibble: consumed without enthusiasm. Tortoiseshell: tolerated. Woodland: patrolled. You may thank me later.",
    trampoline: "An affront to the landscape. However, it is stationary and I have noted it. I conducted a brief inspection — purely as a formality. Its existence is provisionally permitted.",
    cat: "A tortoiseshell appeared. We exchanged ceremonial nose contact. I found no objection to her presence. She may continue existing in my vicinity.",
    best: "The woodland at dusk. Still. Properly lit. Full of leaves that made appropriate sounds beneath my paws. That is what a landscape should feel like.",
    tree: "Ancient. Enormous. Quietly impressive. We shared a moment of mutual recognition. Trees endure. I respect that.",
    safe: "Safety is a concept for those who require reassurance. I patrolled the full perimeter out of preference, not necessity. It is — as always — entirely secure.",
  },
  "chill-cat": {
    default: "There was a trampoline. I sniffed it. Went through some bushes. Stared at a tree. Ate kibble outside. Met another cat. Walked through some woods. It was a day. I was in it.",
    trampoline: "The trampoline was there. I investigated it at my own pace. No rush. It smelled like metal and something that used to be rubber. I added my own scent. Left.",
    cat: "Another cat appeared. We sniffed. It was low effort on both sides. Neither of us made it weird. I appreciate that in an acquaintance.",
    best: "The kibble, honestly. Finding food outside, in a bowl, requiring zero effort from me — that's the kind of day I can endorse.",
    tree: "I looked up at it for a while. Big tree. Old, probably. I didn't need to know more than that.",
    safe: "The woods were quiet. I walked through them. Nothing required my attention. That's all I ask of a place.",
  },
};

function getFallbackResponse(personaId: string, message: string): string {
  const responses = FALLBACK_ASK_RESPONSES[personaId] ?? FALLBACK_ASK_RESPONSES["dramatic-dog"]!;
  const lower = message.toLowerCase();
  if (lower.includes("trampoline") || lower.includes("spring") || lower.includes("bouncy"))
    return responses["trampoline"] ?? responses["default"]!;
  if (lower.includes("cat") || lower.includes("friend") || lower.includes("tortoise") || lower.includes("meet"))
    return responses["cat"] ?? responses["default"]!;
  if (lower.includes("tree") || lower.includes("trunk") || lower.includes("tall"))
    return responses["tree"] ?? responses["default"]!;
  if (lower.includes("best") || lower.includes("highlight") || lower.includes("favorite") || lower.includes("kibble") || lower.includes("food") || lower.includes("eat"))
    return responses["best"] ?? responses["default"]!;
  if (lower.includes("safe") || lower.includes("protect") || lower.includes("secure") || lower.includes("patrol") || lower.includes("woods") || lower.includes("forest"))
    return responses["safe"] ?? responses["default"]!;
  return responses["default"]!;
}

// ─── GET /api/sessions/demo → canonical demo session ─────────────────────────

router.get("/demo", (_req, res) => {
  // 302 redirect to the canonical demo session
  res.redirect(302, `/api/sessions/${DEMO_SESSION_ID}`);
});

// ─── GET /api/sessions/:id ────────────────────────────────────────────────────

router.get("/:id", async (req, res, _next) => {
  try {
    const { id } = req.params;

    if (id === DEMO_SESSION_ID) {
      res.json({
        session: DEMO_SESSION,
        events: DEMO_SESSION_EVENTS,
      });
      return;
    }

    res.status(404).json({ error: "Session not found" });
  } catch (err) {
    console.error("[sessions/:id] Unexpected error, returning demo fallback:", err);
    res.json({
      session: DEMO_SESSION,
      events: DEMO_SESSION_EVENTS,
    });
  }
});

// ─── GET /api/sessions/:id/insights ───────────────────────────────────────────

router.get("/:id/insights", async (req, res, _next) => {
  try {
    const { id } = req.params;

    const events = getMockedSessionEvents(id);
    if (!events) {
      res.status(404).json({ error: "Session events not found" });
      return;
    }

    const insights: SessionInsights = generateInsightsFromEvents(events);
    res.json(insights);
  } catch (err) {
    console.error("[insights] Unexpected error, returning fallback insights:", err);
    // Stable fallback insights so the UI never breaks
    const fallbackInsights: SessionInsights = generateInsightsFromEvents(DEMO_SESSION_EVENTS);
    res.json(fallbackInsights);
  }
});

// ─── GET /api/sessions/:id/recap ──────────────────────────────────────────────

/**
 * Returns a pet-perspective narration recap for the session.
 * Supports ?persona=<id> to switch character.
 */
router.get("/:id/recap", async (req, res, _next) => {
  try {
    const { id } = req.params;
    const personaId = (req.query.persona as string) ?? "dramatic-dog";
    const persona = resolvePersona(personaId);

    const events = getMockedSessionEvents(id);
    if (!events) {
      res.status(404).json({ error: "Session events not found" });
      return;
    }

    let narrationScript: string;

    if (process.env["OPENAI_API_KEY"]) {
      try {
        const toon = encodeEvents(events);
        const systemPrompt = buildNarrationSystemPrompt(persona);
        const userMessage = buildNarrationUserMessage(toon);
        narrationScript = await generateChatCompletion(systemPrompt, userMessage);
      } catch (llmError) {
        console.warn("[recap] LLM generation failed, using fallback:", llmError);
        narrationScript = FALLBACK_NARRATIONS[personaId] ?? FALLBACK_NARRATIONS["dramatic-dog"]!;
      }
    } else {
      narrationScript = FALLBACK_NARRATIONS[personaId] ?? FALLBACK_NARRATIONS["dramatic-dog"]!;
    }

    const recap: PetRecap = {
      narrationScript,
      personaName: persona.name,
      personaId: persona.id,
    };

    res.json(recap);
  } catch (err) {
    console.error("[recap] Unexpected error, returning fallback recap:", err);
    const fallbackPersonaId = (req.query.persona as string) ?? "dramatic-dog";
    res.json({
      narrationScript: FALLBACK_NARRATIONS[fallbackPersonaId] ?? FALLBACK_NARRATIONS["dramatic-dog"]!,
      personaName: resolvePersona(fallbackPersonaId).name,
      personaId: resolvePersona(fallbackPersonaId).id,
    } satisfies PetRecap);
  }
});

// ─── POST /api/sessions/:id/voice ────────────────────────────────────────────

/**
 * Generates TTS audio for a session recap.
 *
 * Primary provider: OpenAI TTS (tts-1, onyx voice)
 * Future upgrade:  ElevenLabs (when key has text_to_speech permission)
 *
 * DATA OWNERSHIP:
 *   - audio_url is stored in Supabase as a reference (see Session.audio_url)
 *   - For this demo, audio is returned as a base64 data URL (no Cloudinary upload)
 *   - In production: upload to Cloudinary, store delivery URL in sessions.audio_url
 *
 * Accepts: { personaId?: string }
 * Returns: { audioUrl: string | null; cached: boolean; fallback: boolean }
 */

// ElevenLabs demo voice — "Rachel" — used when ElevenLabs key has TTS permission
const DEMO_ELEVENLABS_VOICE_ID = "21m00Tcm4TlvDq8ikWAM";

// In-memory cache: "sessionId:personaId" → base64 data URL
const audioCache = new Map<string, string>();

router.post("/:id/voice", async (req, res, _next) => {
  const { id } = req.params;
  const personaId: string = (req.body as { personaId?: string }).personaId ?? "dramatic-dog";
  const cacheKey = `${id}:${personaId}`;

  // ── Return cached audio immediately ───────────────────────────────────────
  if (audioCache.has(cacheKey)) {
    res.json({ audioUrl: audioCache.get(cacheKey), cached: true, fallback: false });
    return;
  }

  const openAiKey = process.env["OPENAI_API_KEY"];
  const elevenLabsKey = process.env["ELEVENLABS_API_KEY"];

  if (!openAiKey && !elevenLabsKey) {
    console.warn("[voice] No TTS API key configured — returning fallback");
    res.json({ audioUrl: null, cached: false, fallback: true });
    return;
  }

  try {
    // ── Resolve narration text ─────────────────────────────────────────────
    const events = getMockedSessionEvents(id) ?? DEMO_SESSION_EVENTS;
    const persona = resolvePersona(personaId);
    let narrationScript: string;

    if (openAiKey) {
      try {
        const toon = encodeEvents(events);
        const systemPrompt = buildNarrationSystemPrompt(persona);
        const userMessage = buildNarrationUserMessage(toon);
        narrationScript = await generateChatCompletion(systemPrompt, userMessage);
      } catch {
        narrationScript = FALLBACK_NARRATIONS[personaId] ?? FALLBACK_NARRATIONS["dramatic-dog"]!;
      }
    } else {
      narrationScript = FALLBACK_NARRATIONS[personaId] ?? FALLBACK_NARRATIONS["dramatic-dog"]!;
    }

    // Trim to ~500 chars for demo reliability + TTS cost
    const textToSpeak = narrationScript.slice(0, 500);

    let audioBuffer: Buffer | null = null;

    // ── Primary: ElevenLabs TTS (Rachel voice — expressive and natural) ───────
    if (elevenLabsKey) {
      try {
        const elRes = await fetch(
          `https://api.elevenlabs.io/v1/text-to-speech/${DEMO_ELEVENLABS_VOICE_ID}`,
          {
            method: "POST",
            headers: {
              "xi-api-key": elevenLabsKey,
              "Content-Type": "application/json",
              Accept: "audio/mpeg",
            },
            body: JSON.stringify({
              text: textToSpeak,
              model_id: "eleven_monolingual_v1",
              voice_settings: { stability: 0.5, similarity_boost: 0.75 },
            }),
          }
        );
        if (elRes.ok) {
          audioBuffer = Buffer.from(await elRes.arrayBuffer());
        } else {
          const errText = await elRes.text();
          console.warn("[voice] ElevenLabs error:", elRes.status, errText.slice(0, 200));
        }
      } catch (err) {
        console.warn("[voice] ElevenLabs request failed:", err);
      }
    }

    // ── Fallback: OpenAI TTS (tts-1, onyx voice) if ElevenLabs unavailable ──
    if (!audioBuffer && openAiKey) {
      try {
        const openAiTtsRes = await fetch("https://api.openai.com/v1/audio/speech", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${openAiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "tts-1",
            input: textToSpeak,
            voice: "onyx",
            response_format: "mp3",
          }),
        });
        if (openAiTtsRes.ok) {
          audioBuffer = Buffer.from(await openAiTtsRes.arrayBuffer());
        } else {
          const errText = await openAiTtsRes.text();
          console.warn("[voice] OpenAI TTS error:", openAiTtsRes.status, errText.slice(0, 200));
        }
      } catch (err) {
        console.warn("[voice] OpenAI TTS fallback failed:", err);
      }
    }

    if (!audioBuffer) {
      res.json({ audioUrl: null, cached: false, fallback: true });
      return;
    }

    // ── Return as base64 data URL ──────────────────────────────────────────
    const audioUrl = `data:audio/mpeg;base64,${audioBuffer.toString("base64")}`;
    audioCache.set(cacheKey, audioUrl);
    res.json({ audioUrl, cached: false, fallback: false });
  } catch (err) {
    console.error("[voice] Unexpected error:", err);
    res.json({ audioUrl: null, cached: false, fallback: true });
  }
});

// ─── POST /api/sessions/:id/ask ───────────────────────────────────────────────


/**
 * Ask My Pet — generates a simulated pet response.
 * Supports body.personaId to switch character.
 */
router.post("/:id/ask", async (req, res, _next) => {
  try {
    const { id } = req.params;
    const body = req.body as {
      // Spec fields (Phase 3)
      question?: string;
      persona?: string;
      // Legacy aliases (backward-compat)
      message?: string;
      personaId?: string;
    };

    // Accept `question` (spec) or `message` (legacy)
    const rawQuestion = body.question ?? body.message;
    if (!rawQuestion || typeof rawQuestion !== "string" || rawQuestion.trim().length === 0) {
      res.status(400).json({ error: "question is required" });
      return;
    }
    const question = rawQuestion.trim();

    if (question.length > 1000) {
      res.status(400).json({ error: "question too long (max 1000 characters)" });
      return;
    }

    // Accept `persona` (spec) or `personaId` (legacy)
    const personaId = body.persona ?? body.personaId ?? "dramatic-dog";
    const persona = resolvePersona(personaId);

    // ── Resolve session events ──────────────────────────────────────────────
    const events = getMockedSessionEvents(id);
    if (!events) {
      res.status(404).json({ error: "Session events not found" });
      return;
    }

    // ── Summarize session context ───────────────────────────────────────────
    // Demo pet: Goofinsmirtz the cat
    const petName = id === DEMO_SESSION_ID ? "Goofinsmirtz" : "Your Pet";
    const petSpecies = id === DEMO_SESSION_ID ? "cat" : "pet";
    const sessionSummary = buildSessionSummaryForAsk(petName, events);

    // ── Build prompt ────────────────────────────────────────────────────────
    const insights: SessionInsights = generateInsightsFromEvents(events);
    const toon = encodeEvents(events);
    const systemPrompt = buildAskMyPetSystemPrompt(
      persona,
      sessionSummary,
      insights,
      toon,
      petName,
      petSpecies
    );

    // ── Call OpenAI (with fallback) ─────────────────────────────────────────
    let petResponse: string;

    if (process.env["OPENAI_API_KEY"]) {
      try {
        petResponse = await generateChatCompletion(systemPrompt, question);
      } catch (llmError) {
        console.warn("[sessions/:id/ask] LLM generation failed, using fallback:", llmError);
        petResponse = getFallbackResponse(personaId, question);
      }
    } else {
      console.info("[sessions/:id/ask] No OPENAI_API_KEY — using fallback response");
      petResponse = getFallbackResponse(personaId, question);
    }

    // ── Return response ─────────────────────────────────────────────────────
    res.json({
      response: petResponse,
      personaName: persona.name,
    });
  } catch (err) {
    console.error("[sessions/:id/ask] Unexpected error, returning fallback response:", err);
    const personaId = (req.body?.persona ?? req.body?.personaId ?? "dramatic-dog") as string;
    const question = (req.body?.question ?? req.body?.message ?? "") as string;
    res.json({
      response: getFallbackResponse(personaId, question),
      personaName: resolvePersona(personaId).name,
    });
  }
});

export { router as sessionsRouter };

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

  "neighborhood-boss": `I did a full perimeter sweep today. First thing I hit: a trampoline out by sector west. Never seen it before. I sniffed every inch of it. Springs, frame, connectors — all documented. I'm not sure what it's for but I don't like surprises in my territory.

I pushed through the dense brush myself. Had to know what was in there. Nothing. But I know now, and that matters.

I stood under that big tree and looked straight up. Ten full seconds. Nothing moved. I've got my eye on it.

I found my outdoor rations at the station and ate every piece. Fuel for the mission.

I met a tortoiseshell at the property line. We touched noses. I checked her out. She's clean — I'm adding her to my approved list.

I finished with a full sweep through the wooded zone. Dry leaves, pine needles, tall trees. I walked every inch of it. Zero threats. This territory is mine and I intend to keep it that way.`,

  "chaotic-gremlin": `OKAY there was a TRAMPOLINE and I had to smell ALL OF IT — the springs, the frame, the whole thing — and I don't know why but I needed to and I DID and it smelled like metal and outside and MYSTERIES.

Then I went THROUGH the bushes because they were THERE and I'm a CAT who DOES THINGS and the leaves were everywhere and I pushed through ALL of them.

The tree. THE TREE. I stared up it for so long. I don't know what I was looking for. It doesn't matter. I found it.

FOOD. OUTSIDE FOOD. In a BOWL. I just — I ate it. Happily. Yes.

Then another cat showed up and we TOUCHED NOSES and I wasn't ready for that but it was GREAT and we're friends now probably.

Now I'm walking through dead leaves and they make a sound and I walk slower to hear more of the sound CRUNCH CRUNCH CRUNCH I could do this forever.`,

  "royal-house-cat": `I inspected my grounds today. As I do.

I came across a trampoline near the garden. I want it known that I find it architecturally offensive. I gave it a brief once-over — purely out of obligation — and moved on. It does not have my approval.

I moved through the shrubbery with the grace befitting my station. It was dense. I was denser.

I stood before a very old, very large tree and gazed upward at it for an appropriate amount of time. We reached an understanding. I left satisfied.

I dined outside today. The kibble was... acceptable. I ate it with the composure of someone accustomed to finer things, which I am.

I encountered a tortoiseshell. We touched noses. I found nothing objectionable about her. She may remain.

I completed my woodland patrol as evening settled in. Leaves, pine needles, long shadows. I walked through all of it like someone who owns it. Because I do.`,
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
    default: "I ran the full perimeter today. I sniffed the trampoline — flagged it. I pushed through the brush — cleared it. I stared up that tree — logged it. I ate my outdoor rations. I touched noses with the tortoiseshell — she's verified. I swept the woodland. Zero breaches. This territory is mine and I made sure of it.",
    trampoline: "I found a trampoline in the yard. Never seen it before. I put my nose on every inch — the springs, the frame, the legs. It smells like metal and someone else. I don't know what it's for but I've flagged it and I'll be back to check on it. It's on probation.",
    cat: "I met a tortoiseshell today. I walked right up to her and touched noses — full identification protocol. She held her ground. No aggression. Good instincts. I've cleared her and added her to my approved contacts. I don't do that easily.",
    best: "Honestly? My woodland sweep. I walked every inch of it — dry leaves, pine needles, tall trees. I knew every sound, every shadow. Zero threats. That's what it feels like when I've done my job right.",
    tree: "I stood under that tree and looked straight up it for ten full seconds. Nothing moved. I haven't decided if I trust it yet but I've noted its position and I'll be monitoring it. Nothing in my territory escapes my attention.",
    safe: "I personally swept the entire perimeter — yard, brush, woodland. I checked every corner. I verified all contacts. You're safe because I made sure of it. That's what I do.",
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
    default: "I conducted a thorough inspection of my grounds today. I evaluated the trampoline — I don't like it. I navigated the shrubbery — beneath me, but I managed. I acknowledged the large tree. I dined outside with appropriate restraint. I granted the tortoiseshell a nose greeting. I patrolled my woodland. You're welcome.",
    trampoline: "I inspected that trampoline today. I found it architecturally offensive and structurally presumptuous. I gave it a very deliberate once-over — springs, frame, all of it — and I have noted that it does not have my approval. It may remain for now. I'm watching it.",
    cat: "I met a tortoiseshell in my yard. I approached her, I touched noses with her, and I evaluated her. I found nothing objectionable. I've decided she may continue existing near my property. I want you to know I do not make that decision lightly.",
    best: "I'll tell you what I enjoyed: walking through my woodland in the quiet evening. I felt every leaf beneath my paws. I moved through the trees at the pace of something that owns them. Which I do. That is my ideal environment.",
    tree: "I stood before a very old, very large tree today and I looked up at it for a long time. We reached a mutual understanding. I respect its age. I believe it respects my authority. It was a dignified moment.",
    safe: "I personally patrolled every corner of my grounds — yard, shrubbery, woodland. I did it not because I needed to, but because I chose to. My territory is secure because I will it to be. It always is.",
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

// ElevenLabs voice IDs
const ELEVENLABS_RACHEL_VOICE_ID = "21m00Tcm4TlvDq8ikWAM"; // Rachel — warm, elegant female

// Per-persona voice config
// provider: "openai" | "elevenlabs"
const PERSONA_VOICE_CONFIG: Record<string, { provider: "openai" | "elevenlabs"; voiceId: string }> = {
  "dramatic-dog":      { provider: "openai",      voiceId: "onyx" },    // deep, serious male
  "neighborhood-boss": { provider: "openai",      voiceId: "echo" },    // authoritative male
  "chaotic-gremlin":   { provider: "openai",      voiceId: "fable" },   // expressive male
  "chill-cat":         { provider: "openai",      voiceId: "nova" },    // calm, smooth female
  "royal-house-cat":   { provider: "elevenlabs",  voiceId: ELEVENLABS_RACHEL_VOICE_ID }, // elegant female
};

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

    // ── Persona-specific voice routing ────────────────────────────────────────
    const voiceConfig = PERSONA_VOICE_CONFIG[personaId] ?? PERSONA_VOICE_CONFIG["dramatic-dog"]!;
    console.info(`[voice] persona=${personaId} → provider=${voiceConfig.provider} voice=${voiceConfig.voiceId}`);

    // ── Primary: route to the persona's preferred provider ───────────────────
    if (voiceConfig.provider === "openai" && openAiKey) {
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
            voice: voiceConfig.voiceId,
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
        console.warn("[voice] OpenAI TTS failed:", err);
      }
    } else if (voiceConfig.provider === "elevenlabs" && elevenLabsKey) {
      try {
        const elRes = await fetch(
          `https://api.elevenlabs.io/v1/text-to-speech/${voiceConfig.voiceId}`,
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

    // ── Cross-provider fallback (if primary key missing or request failed) ───
    if (!audioBuffer && openAiKey && voiceConfig.provider !== "openai") {
      console.warn("[voice] ElevenLabs failed — falling back to OpenAI onyx");
      try {
        const res2 = await fetch("https://api.openai.com/v1/audio/speech", {
          method: "POST",
          headers: { Authorization: `Bearer ${openAiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({ model: "tts-1", input: textToSpeak, voice: "onyx", response_format: "mp3" }),
        });
        if (res2.ok) audioBuffer = Buffer.from(await res2.arrayBuffer());
      } catch { /* silent */ }
    } else if (!audioBuffer && elevenLabsKey && voiceConfig.provider !== "elevenlabs") {
      console.warn("[voice] OpenAI TTS failed — falling back to ElevenLabs Rachel");
      try {
        const res2 = await fetch(
          `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_RACHEL_VOICE_ID}`,
          {
            method: "POST",
            headers: { "xi-api-key": elevenLabsKey, "Content-Type": "application/json", Accept: "audio/mpeg" },
            body: JSON.stringify({ text: textToSpeak, model_id: "eleven_monolingual_v1", voice_settings: { stability: 0.5, similarity_boost: 0.75 } }),
          }
        );
        if (res2.ok) audioBuffer = Buffer.from(await res2.arrayBuffer());
      } catch { /* silent */ }
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

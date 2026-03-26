// ─── Data ownership ───────────────────────────────────────────────────────────
// Supabase  → session state, metadata, relationships, generated text (insights,
//             narrations, conversation turns). Source of truth for what happened.
// Cloudinary → binary media assets (video, audio, thumbnails). All `*_url` and
//             `*_public_id` fields in session records are references to Cloudinary.
//
// The UI reads session state from Supabase and streams media via Cloudinary URLs.
// See docs/DATA_ARCHITECTURE.md for the full boundary definition.
// ─────────────────────────────────────────────────────────────────────────────

import { Router, type Request, type Response, type NextFunction } from "express";
import { generateInsightsFromEvents, buildAskMyPetSystemPrompt } from "@pet-pov/ai";
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

const FALLBACK_NARRATIONS: Record<string, string> = {
  "dramatic-dog": `Okay so first of all — who IS that guy who keeps coming to the door? Same smell. Same schedule. Suspicious.

I handled it. Loudly. Twice.

Then I decided the couch needed me more than the backyard did, so I nested in for what I'm calling a "strategic recharge." Very important work.

At some point a tennis ball appeared from nowhere and I had QUESTIONS. Important questions. I took them to the back door for investigation.

The new plant thing? Still not sure about that. I'm watching it.

Then — and I'm not entirely sure what happened here — my legs just… went. Full zoomie mode. Backyard laps. Wind in my ears. Pure freedom.

Now I'm resting on the cool floor tiles. Today was a lot. But I protected the house, investigated suspicious flora, and maintained peak physical readiness. Good day.`,

  "chill-cat": `So... a human came to the door. Again. The dog lost its mind. Again. I observed from the windowsill. Effortlessly.

The couch was adequate for my midday meditation. Three hours of stillness. The humans will never understand this level of discipline.

A ball appeared. I noted it. I did not engage. Beneath me.

The plant... now that was interesting. New. Green. Possibly an adversary. I circled it with appropriate caution and measured contempt.

Then the dog did... laps. In the yard. For no reason. I watched from the perch. Exhausting just to observe.

I am now resting on the tiles. Not because I'm tired. Because I chose this specific temperature. Everything is intentional.`,

  "neighborhood-boss": `0800 hours. Perimeter breach attempt at the front door. Visitor: repeat offender, same route daily. I deployed two bark volleys — full authority. Threat neutralized. The door held.

Conducted a strategic withdrawal to the couch for intel processing. Three hours of deep analysis. The humans call it "napping." They don't understand operational tempo.

Found unregistered equipment near the back door — tennis ball, origin unknown. Seized it. Under investigation.

New vegetation detected in sector 3. Ran a full 8-minute reconnaissance. Classification: uncertain. Maintaining surveillance.

Executed high-speed perimeter sweeps at 1500 hours. Full backyard coverage. Zero breaches detected.

Status: all sectors secure. This block is mine.`,

  "chaotic-gremlin": `OKAY so there was a GUY at the DOOR and I was like BARK BARK BARK and honestly I don't even know what he wanted but he LEFT so clearly I won that one — wait is that a BALL? BALL BALL BALL where did that come from I need it I HAVE it okay now what.

Then I took what the humans call a "nap" but really I was just VIBRATING horizontally for a while because my body needed to recharge for what happened NEXT which was — wait. There's a PLANT. When did that get here. It smells weird. I circled it EIGHT times. Suspicious.

And THEN. Then my legs just ACTIVATED. Full zoomie protocol. Backyard laps at MAXIMUM speed. Wind. Ears. Freedom. No thoughts just RUNNING.

Now I'm on the floor. It's cold and nice. Today was INCREDIBLE.`,

  "royal-house-cat": `The staff permitted yet another visitor at the front entrance. The canine unit, predictably, lost all composure. I observed from my throne by the window. Beneath acknowledgment.

I retired to the settee for my afternoon meditation — three hours of carefully curated stillness. One does not simply "nap." One communes with the silence.

A sphere appeared near the servant's entrance. Rubber. Yellow. Pedestrian. I made a note and moved on.

New flora in the drawing room. I conducted a thorough inspection — eight minutes of measured circling. The verdict: provisional tolerance. For now.

The canine performed its evening sprints. Graceless. Loud. I watched from the perch with the patience of a monarch observing court jesters.

I have since relocated to the cool tiles. Not from exhaustion — from preference. Everything I do is a choice. Remember that.`,
};

// ─── Fallback Ask My Pet responses per persona ────────────────────────────────

const FALLBACK_ASK_RESPONSES: Record<string, Record<string, string>> = {
  "dramatic-dog": {
    default: "OBVIOUSLY the highlight was defending this household from that suspicious delivery person. Two rounds of barking. Full perimeter secured. But you didn't even say thank you. Classic human behavior.",
    mail: "That guy? THAT GUY? He comes EVERY DAY with suspicious packages. Same time, same smell. I've been running surveillance for WEEKS and frankly my reports are being ignored. Two barks minimum. Non-negotiable.",
    plant: "Okay so — the new green thing. I've been monitoring it closely. Eight full minutes of investigation. It doesn't move. It doesn't smell like food. It just… sits there. Honestly? Suspicious. I'm keeping my eye on it.",
    best: "Look, every part of my day is the best part because I am incredible at being a dog. But if I HAD to choose? The zoomies. Backyard laps at full speed, wind in my ears, zero thoughts in my head. That's peak existence right there.",
    safe: "Safe? I MADE it safe. This entire household operates under my protection. Every bark, every patrol, every strategic nap — all part of the plan. You're welcome.",
  },
  "neighborhood-boss": {
    default: "I run a tight operation here. Every bark is calculated. Every patrol is logged. The perimeter was secure at last check — 0 breaches, 2 deterrence events. This block doesn't protect itself.",
    mail: "Repeat offender. Same route, same time, 5 days a week. I've filed multiple bark reports. The humans keep accepting his deliveries anyway. Compromised leadership, if you ask me. I do what I can.",
    plant: "New asset appeared in sector 3 without authorization. I ran a full recon sweep — 8 minutes, multiple angles. Classification: non-hostile but unverified. It's on probation.",
    best: "Best part? The 1500 perimeter sweep. Full backyard at maximum speed. Every corner checked. Every shadow assessed. That's not exercise — that's operational excellence.",
    safe: "The block is secure. Has been since I took command. Zero unauthorized entries on my watch. You sleep well because I don't.",
  },
  "chaotic-gremlin": {
    default: "OH MAN today was SO MUCH. There was barking and napping and a BALL and a PLANT and then my legs just went BRRRRR and I did laps in the yard and now I'm tired but also NOT tired because — wait, did you say something? I was thinking about that ball again.",
    mail: "THE DOOR GUY!! He comes and I bark and he LEAVES every single time so clearly I am very powerful and important. One time I barked THREE times and he left even FASTER. I should get a medal. Do dogs get medals? I want one.",
    plant: "THE PLANT. It showed up out of NOWHERE. It just sits there. Menacingly. I sniffed it from EVERY angle — I'm talking full 360. It smells like dirt and secrets. I'll be watching it. CLOSELY.",
    best: "ZOOMIES. Obviously. My legs just went and I was RUNNING and the wind was in my face and I had ZERO thoughts in my head and it was the most beautiful moment of my entire life until the next one which will probably be in like 5 minutes.",
    safe: "Safe?? I'm the SAFEST. I bark at EVERYTHING. Nothing gets past me except sometimes things I don't notice but that doesn't count because if I NOTICED them I would DEFINITELY bark.",
  },
  "royal-house-cat": {
    default: "The day was... adequate. The staff maintained an acceptable level of service, though dinner was, once again, not precisely on time. The canine provided its usual cacophony. I endured it with grace.",
    mail: "Ah, the daily visitor. The dog treats it as an invasion. I treat it as background noise. One cannot be bothered by every commoner who approaches the estate. That's what the help is for.",
    plant: "The new foliage. Yes, I inspected it. Thoroughly. It passed my initial assessment, though I have not granted it permanent residency. All things in this household exist at my discretion.",
    best: "I don't have a 'best part.' Every moment I occupy contributes to the overall excellence of the household. Though... the afternoon sun on the perch at 3 PM was... not unpleasant. Don't read into that.",
    safe: "Safe? My dear, safety is a construct for those who lack confidence. I am perfectly composed at all times. The household is calm because I will it to be so.",
  },
  "chill-cat": {
    default: "The day happened. I was present for most of it. The dog barked at things. A ball existed. I declined to participate in any of it. Overall... adequate.",
    mail: "The delivery human arrived. The dog staged a full response. I... did not. From my window perch, the entire exchange appeared predictable and beneath engagement. As most things are.",
    plant: "New plant. I circled it. It didn't move. Neither did I, for a while. We reached an understanding — it stays in its corner, I stay in mine. Coexistence through mutual indifference.",
    best: "Best part? The three-hour meditation on the couch. Perfectly still. Perfectly quiet. The humans thought I was sleeping. I was achieving a level of peace they'll never comprehend.",
    safe: "I don't concern myself with safety. I concern myself with comfort, silence, and the quality of afternoon light. Everything else is... noise.",
  },
};

function getFallbackResponse(personaId: string, message: string): string {
  const responses = FALLBACK_ASK_RESPONSES[personaId] ?? FALLBACK_ASK_RESPONSES["dramatic-dog"]!;
  const lower = message.toLowerCase();
  if (lower.includes("mail") || lower.includes("bark") || lower.includes("carrier") || lower.includes("door"))
    return responses["mail"]!;
  if (lower.includes("plant") || lower.includes("green"))
    return responses["plant"]!;
  if (lower.includes("best") || lower.includes("highlight") || lower.includes("favorite"))
    return responses["best"]!;
  if (lower.includes("safe") || lower.includes("protect") || lower.includes("secure"))
    return responses["safe"]!;
  return responses["default"]!;
}

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

// ─── POST /api/sessions/:id/ask ───────────────────────────────────────────────

/**
 * Ask My Pet — generates a simulated pet response.
 * Supports body.personaId to switch character.
 */
router.post("/:id/ask", async (req, res, _next) => {
  try {
    const { id } = req.params;
    const { message, personaId: bodyPersonaId } = req.body as {
      message?: string;
      personaId?: string;
    };

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      res.status(400).json({ error: "Message is required" });
      return;
    }

    if (message.length > 1000) {
      res.status(400).json({ error: "Message too long (max 1000 characters)" });
      return;
    }

    const personaId = bodyPersonaId ?? "dramatic-dog";
    const persona = resolvePersona(personaId);

    const events = getMockedSessionEvents(id);
    if (!events) {
      res.status(404).json({ error: "Session events not found" });
      return;
    }

    const insights: SessionInsights = generateInsightsFromEvents(events);
    const toon = encodeEvents(events);
    const sessionSummary = `${DEMO_SESSION.title} — ${Math.round(DEMO_SESSION.duration_seconds! / 60)}m session`;

    let petResponse: string;

    if (process.env["OPENAI_API_KEY"]) {
      try {
        const systemPrompt = buildAskMyPetSystemPrompt(
          persona,
          sessionSummary,
          insights,
          toon
        );
        petResponse = await generateChatCompletion(systemPrompt, message.trim());
      } catch (llmError) {
        console.warn("[ask] LLM generation failed, using fallback:", llmError);
        petResponse = getFallbackResponse(personaId, message);
      }
    } else {
      petResponse = getFallbackResponse(personaId, message);
    }

    res.json({
      response: petResponse,
      personaName: persona.name,
    });
  } catch (err) {
    console.error("[ask] Unexpected error, returning fallback response:", err);
    const personaId = (req.body?.personaId as string) ?? "dramatic-dog";
    const message = (req.body?.message as string) ?? "";
    res.json({
      response: getFallbackResponse(personaId, message),
      personaName: resolvePersona(personaId).name,
    });
  }
});

export { router as sessionsRouter };

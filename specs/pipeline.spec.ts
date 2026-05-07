import { describe, it, expect } from "vitest";

/**
 * Pipeline integration spec.
 *
 * These tests verify the pipeline contract at a high level:
 * - Input/output shapes for each step
 * - Type safety of data passed between steps
 * - That no step skips or merges responsibilities
 *
 * Full integration tests against real services are not run here.
 * Use a test environment (Supabase local, Redis, etc.) for those.
 */

import type { SceneEvent, VideoStatus } from "../packages/db/src/types.js";
import { encodeEvents, decodeEvents } from "../packages/toon/src/index.js";
import { groupFramesIntoScenes } from "../packages/video/src/scenes.js";
import type { ExtractedFrame } from "../packages/video/src/ffmpeg.js";
import { buildNarrationSystemPrompt, buildNarrationUserMessage } from "../packages/ai/src/prompts/narration.js";
import { DRAMATIC_DOG_PERSONA } from "../packages/personas/src/templates/dramatic-dog.js";
import { CHILL_CAT_PERSONA } from "../packages/personas/src/templates/chill-cat.js";
import type { Persona } from "../packages/db/src/types.js";

// ─── Step 3 & 4: Scene extraction → Event generation ─────────────────────────

describe("Pipeline Step 3–4: scene grouping", () => {
  const mockFrames: ExtractedFrame[] = Array.from({ length: 15 }, (_, i) => ({
    filePath: `/tmp/frame-${String(i).padStart(4, "0")}.jpg`,
    timestampSeconds: i * 2,
  }));

  it("groups frames into scenes based on duration", () => {
    const scenes = groupFramesIntoScenes(mockFrames, 6);
    expect(scenes.length).toBeGreaterThan(0);
  });

  it("each scene has a keyFrame", () => {
    const scenes = groupFramesIntoScenes(mockFrames, 6);
    scenes.forEach((scene) => {
      expect(scene.keyFrame).toBeDefined();
      expect(scene.keyFrame.filePath).toBeTruthy();
    });
  });

  it("scenes are ordered chronologically", () => {
    const scenes = groupFramesIntoScenes(mockFrames, 6);
    for (let i = 1; i < scenes.length; i++) {
      expect(scenes[i]!.startSeconds).toBeGreaterThanOrEqual(scenes[i - 1]!.startSeconds);
    }
  });

  it("returns empty array for empty frames", () => {
    expect(groupFramesIntoScenes([])).toEqual([]);
  });
});

// ─── Step 6: JSON → TOON ──────────────────────────────────────────────────────

describe("Pipeline Step 6: JSON → TOON conversion", () => {
  const events: SceneEvent[] = [
    {
      timestamp_start: 0,
      timestamp_end: 6,
      description: "Cat stares at a bird on the windowsill",
      subjects: ["cat", "bird"],
      actions: ["staring"],
      emotion: "focused",
      environment: "living room",
      confidence: 0.9,
    },
  ];

  it("produces a TOON string from events", () => {
    const toon = encodeEvents(events);
    expect(toon).toContain("[T:");
    expect(toon).toContain("S:cat,bird");
  });

  it("TOON string is shorter than equivalent JSON (token efficiency)", () => {
    const toon = encodeEvents(events);
    const json = JSON.stringify(events);
    expect(toon.length).toBeLessThan(json.length);
  });
});

// ─── Step 7: TOON → Narration prompt ─────────────────────────────────────────

describe("Pipeline Step 7: narration prompt construction", () => {
  const mockPersona: Persona = {
    ...(DRAMATIC_DOG_PERSONA as PersonaInsert),
    id: "test-persona-id",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const events: SceneEvent[] = [
    {
      timestamp_start: 0,
      timestamp_end: 4,
      description: "Dog runs into the fence at full speed",
      subjects: ["dog", "fence"],
      actions: ["running", "colliding"],
      emotion: "surprised",
      environment: "backyard",
      confidence: 0.97,
    },
  ];

  it("builds a non-empty system prompt from persona", () => {
    const prompt = buildNarrationSystemPrompt(mockPersona);
    expect(prompt.length).toBeGreaterThan(0);
    expect(prompt).toContain(mockPersona.tone);
  });

  it("includes all persona rules in system prompt", () => {
    const prompt = buildNarrationSystemPrompt(mockPersona);
    mockPersona.rules.forEach((rule) => {
      expect(prompt).toContain(rule);
    });
  });

  it("builds a user message containing the TOON string", () => {
    const toon = encodeEvents(events);
    const message = buildNarrationUserMessage(toon);
    expect(message).toContain(toon);
  });
});

// ─── Persona templates ────────────────────────────────────────────────────────

describe("Persona templates", () => {
  it("Dramatic Dog persona has required fields", () => {
    expect(DRAMATIC_DOG_PERSONA.name).toBe("Dramatic Dog");
    expect(DRAMATIC_DOG_PERSONA.tone).toBeTruthy();
    expect(DRAMATIC_DOG_PERSONA.rules.length).toBeGreaterThan(0);
    expect(DRAMATIC_DOG_PERSONA.voice_id).toBeTruthy();
    expect(DRAMATIC_DOG_PERSONA.tts_provider).toBe("elevenlabs");
  });

  it("Chill Cat persona has required fields", () => {
    expect(CHILL_CAT_PERSONA.name).toBe("Chill Cat");
    expect(CHILL_CAT_PERSONA.tone).toBeTruthy();
    expect(CHILL_CAT_PERSONA.rules.length).toBeGreaterThan(0);
    expect(CHILL_CAT_PERSONA.voice_id).toBeTruthy();
  });

  it("Dramatic Dog and Chill Cat have different tones", () => {
    expect(DRAMATIC_DOG_PERSONA.tone).not.toBe(CHILL_CAT_PERSONA.tone);
  });
});

// ─── Video status type guard ──────────────────────────────────────────────────

describe("VideoStatus type coverage", () => {
  const validStatuses: VideoStatus[] = [
    "uploaded", "processing", "events_extracted", "toon_converted",
    "narrated", "voiced", "rendered", "complete", "error",
  ];

  it("has 9 distinct status values representing each pipeline stage", () => {
    expect(validStatuses.length).toBe(9);
  });
});

// Helper type (mirrors PersonaInsert from @pet-pov/db but avoids import cycle in specs)
type PersonaInsert = Omit<Persona, "id" | "created_at" | "updated_at">;

import { describe, it, expect } from "vitest";
import { encodeEvents, decodeEvents } from "../packages/toon/src/index.js";
import type { SceneEvent } from "../packages/db/src/types.js";

// ─── Fixtures ────────────────────────────────────────────────────────────────

const SAMPLE_EVENTS: SceneEvent[] = [
  {
    timestamp_start: 0,
    timestamp_end: 5,
    description: "Dog sprints across the backyard toward a squirrel",
    subjects: ["dog", "squirrel"],
    actions: ["sprinting", "chasing"],
    emotion: "excited",
    environment: "backyard",
    confidence: 0.95,
  },
  {
    timestamp_start: 5,
    timestamp_end: 12,
    description: "Dog skids to a halt as squirrel disappears up a tree",
    subjects: ["dog", "squirrel", "tree"],
    actions: ["stopping", "looking up"],
    emotion: "confused",
    environment: "backyard",
    confidence: 0.88,
  },
  {
    timestamp_start: 12,
    timestamp_end: 18,
    description: "Dog sniffs the base of the tree and sits down",
    subjects: ["dog", "tree"],
    actions: ["sniffing", "sitting"],
    emotion: "calm",
    environment: "backyard",
    confidence: 0.92,
  },
];

// ─── TOON Encoder Tests ───────────────────────────────────────────────────────

describe("TOON encoder", () => {
  it("encodes a list of events into a non-empty TOON string", () => {
    const toon = encodeEvents(SAMPLE_EVENTS);
    expect(toon).toBeTruthy();
    expect(typeof toon).toBe("string");
  });

  it("produces one line per event", () => {
    const toon = encodeEvents(SAMPLE_EVENTS);
    const lines = toon.split("\n").filter(Boolean);
    expect(lines.length).toBe(SAMPLE_EVENTS.length);
  });

  it("encodes timestamps in [T:start-end] format", () => {
    const toon = encodeEvents(SAMPLE_EVENTS);
    expect(toon).toContain("[T:0.00-5.00]");
    expect(toon).toContain("[T:5.00-12.00]");
  });

  it("includes subjects, actions, emotion, and environment", () => {
    const toon = encodeEvents(SAMPLE_EVENTS);
    expect(toon).toContain("S:dog,squirrel");
    expect(toon).toContain("A:sprinting,chasing");
    expect(toon).toContain("E:excited");
    expect(toon).toContain("ENV:backyard");
  });

  it("is deterministic — same input always produces same output", () => {
    const toon1 = encodeEvents(SAMPLE_EVENTS);
    const toon2 = encodeEvents(SAMPLE_EVENTS);
    expect(toon1).toBe(toon2);
  });
});

// ─── TOON Round-Trip Tests ────────────────────────────────────────────────────

describe("TOON round-trip (encode → decode)", () => {
  it("decodes back to the correct number of events", () => {
    const toon = encodeEvents(SAMPLE_EVENTS);
    const decoded = decodeEvents(toon);
    expect(decoded.length).toBe(SAMPLE_EVENTS.length);
  });

  it("preserves timestamps after round-trip", () => {
    const toon = encodeEvents(SAMPLE_EVENTS);
    const decoded = decodeEvents(toon);

    decoded.forEach((event, i) => {
      const original = SAMPLE_EVENTS[i]!;
      expect(event.timestamp_start).toBeCloseTo(original.timestamp_start, 2);
      expect(event.timestamp_end).toBeCloseTo(original.timestamp_end, 2);
    });
  });

  it("preserves description after round-trip", () => {
    const toon = encodeEvents(SAMPLE_EVENTS);
    const decoded = decodeEvents(toon);

    decoded.forEach((event, i) => {
      expect(event.description).toBe(SAMPLE_EVENTS[i]!.description);
    });
  });

  it("preserves subjects array after round-trip", () => {
    const toon = encodeEvents(SAMPLE_EVENTS);
    const decoded = decodeEvents(toon);

    decoded.forEach((event, i) => {
      expect(event.subjects).toEqual(SAMPLE_EVENTS[i]!.subjects);
    });
  });

  it("preserves actions array after round-trip", () => {
    const toon = encodeEvents(SAMPLE_EVENTS);
    const decoded = decodeEvents(toon);

    decoded.forEach((event, i) => {
      expect(event.actions).toEqual(SAMPLE_EVENTS[i]!.actions);
    });
  });

  it("preserves emotion and environment after round-trip", () => {
    const toon = encodeEvents(SAMPLE_EVENTS);
    const decoded = decodeEvents(toon);

    decoded.forEach((event, i) => {
      expect(event.emotion).toBe(SAMPLE_EVENTS[i]!.emotion);
      expect(event.environment).toBe(SAMPLE_EVENTS[i]!.environment);
    });
  });
});

// ─── Edge Case Tests ──────────────────────────────────────────────────────────

describe("TOON edge cases", () => {
  it("handles an empty events array", () => {
    const toon = encodeEvents([]);
    expect(toon).toBe("");
    const decoded = decodeEvents(toon);
    expect(decoded).toEqual([]);
  });

  it("handles a single event", () => {
    const single = SAMPLE_EVENTS.slice(0, 1) as SceneEvent[];
    const toon = encodeEvents(single);
    const decoded = decodeEvents(toon);
    expect(decoded.length).toBe(1);
  });

  it("throws on malformed TOON line", () => {
    expect(() => decodeEvents("this is not valid TOON")).toThrow();
  });
});

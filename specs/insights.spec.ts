import { describe, it, expect } from "vitest";
import { generateInsightsFromEvents } from "../packages/ai/src/insights.js";
import type { SessionEvent, SessionInsights } from "../packages/db/src/types.js";
import { DEMO_SESSION_EVENTS } from "../apps/api/src/seed/demo-session.js";

// ─── generateInsightsFromEvents ───────────────────────────────────────────────

describe("generateInsightsFromEvents", () => {
  it("returns valid SessionInsights shape from demo events", () => {
    const insights = generateInsightsFromEvents(DEMO_SESSION_EVENTS);

    expect(insights).toHaveProperty("keyActivities");
    expect(insights).toHaveProperty("behavioralInterpretation");
    expect(insights).toHaveProperty("safetyNotes");
    expect(insights).toHaveProperty("activityScore");
  });

  it("keyActivities is a non-empty array with icon and label", () => {
    const insights = generateInsightsFromEvents(DEMO_SESSION_EVENTS);

    expect(insights.keyActivities.length).toBeGreaterThan(0);
    insights.keyActivities.forEach((activity) => {
      expect(activity.icon).toBeTruthy();
      expect(activity.label).toBeTruthy();
    });
  });

  it("activityScore is between 0 and 100", () => {
    const insights = generateInsightsFromEvents(DEMO_SESSION_EVENTS);
    expect(insights.activityScore).toBeGreaterThanOrEqual(0);
    expect(insights.activityScore).toBeLessThanOrEqual(100);
  });

  it("activityScore is non-zero for demo events", () => {
    const insights = generateInsightsFromEvents(DEMO_SESSION_EVENTS);
    expect(insights.activityScore).toBeGreaterThan(0);
  });

  it("behavioralInterpretation is a non-empty string", () => {
    const insights = generateInsightsFromEvents(DEMO_SESSION_EVENTS);
    expect(typeof insights.behavioralInterpretation).toBe("string");
    expect(insights.behavioralInterpretation.length).toBeGreaterThan(0);
  });

  it("safetyNotes mentions no concerns for safe demo events", () => {
    const insights = generateInsightsFromEvents(DEMO_SESSION_EVENTS);
    expect(insights.safetyNotes).toContain("No concerning behaviors");
  });

  it("handles empty events array gracefully", () => {
    const insights = generateInsightsFromEvents([]);
    expect(insights.activityScore).toBe(0);
    expect(insights.keyActivities).toEqual([]);
    expect(insights.behavioralInterpretation).toContain("No events");
  });

  it("detects safety concerns when present", () => {
    const dangerousEvents: SessionEvent[] = [
      {
        timestamp_start: 0,
        timestamp_end: 10,
        description: "Dog shows aggressive behavior toward another animal",
        subjects: ["dog", "cat"],
        actions: ["growling", "lunging"],
        emotion: "aggressive",
        environment: "backyard",
        confidence: 0.9,
      },
    ];

    const insights = generateInsightsFromEvents(dangerousEvents);
    expect(insights.safetyNotes).toContain("aggressive");
  });

  it("is deterministic — same input produces same output", () => {
    const a = generateInsightsFromEvents(DEMO_SESSION_EVENTS);
    const b = generateInsightsFromEvents(DEMO_SESSION_EVENTS);

    expect(a.activityScore).toBe(b.activityScore);
    expect(a.keyActivities).toEqual(b.keyActivities);
    expect(a.behavioralInterpretation).toBe(b.behavioralInterpretation);
    expect(a.safetyNotes).toBe(b.safetyNotes);
  });
});

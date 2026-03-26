import type { SessionEvent, SessionInsights } from "@pet-pov/db";

// ─── Emoji mapping for common activity types ──────────────────────────────────

const ACTION_ICONS: Record<string, string> = {
  barking: "🐾",
  sleeping: "💤",
  snoring: "💤",
  napping: "💤",
  running: "🏃",
  zoomies: "⚡",
  sniffing: "👃",
  eating: "🍖",
  drinking: "💧",
  playing: "🎾",
  "picking up ball": "🎾",
  "carrying": "🎾",
  chasing: "🐾",
  jumping: "🐾",
  pawing: "🪴",
  circling: "🔍",
  stretching: "🧘",
  panting: "😮‍💨",
  resting: "😴",
  "laying down": "😴",
  twitching: "💤",
};

const SAFETY_CONCERN_KEYWORDS = [
  "aggressive",
  "bite",
  "bitten",
  "escape",
  "escaped",
  "toxic",
  "poison",
  "injured",
  "limp",
  "bleeding",
  "fight",
  "attack",
  "choking",
  "vomit",
  "seizure",
];

/**
 * Generate structured insights from a list of session events.
 *
 * This is a deterministic, pure function — no LLM calls.
 * It can be upgraded to use an LLM for richer interpretations later.
 */
export function generateInsightsFromEvents(
  events: SessionEvent[]
): SessionInsights {
  if (events.length === 0) {
    return {
      keyActivities: [],
      behavioralInterpretation: "No events detected in this session.",
      safetyNotes: "No data available for safety analysis.",
      activityScore: 0,
    };
  }

  // ── Key activities ──────────────────────────────────────────────────────────
  const keyActivities = extractKeyActivities(events);

  // ── Behavioral interpretation ───────────────────────────────────────────────
  const behavioralInterpretation = buildBehavioralInterpretation(events);

  // ── Safety notes ────────────────────────────────────────────────────────────
  const safetyNotes = buildSafetyNotes(events);

  // ── Activity score ──────────────────────────────────────────────────────────
  const activityScore = computeActivityScore(events);

  return {
    keyActivities,
    behavioralInterpretation,
    safetyNotes,
    activityScore,
  };
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function extractKeyActivities(
  events: SessionEvent[]
): { icon: string; label: string }[] {
  // Group events by primary action, pick the most interesting ones
  const activities: { icon: string; label: string }[] = [];
  const seen = new Set<string>();

  for (const event of events) {
    // Use description as the activity label (most readable)
    const primaryAction = event.actions[0] ?? "unknown";
    // Avoid duplicate actions
    if (seen.has(primaryAction) && activities.length >= 2) continue;
    seen.add(primaryAction);

    const icon = findIconForEvent(event);
    // Shorten description for card display
    const label = shortenDescription(event);

    activities.push({ icon, label });
    if (activities.length >= 5) break;
  }

  return activities;
}

function findIconForEvent(event: SessionEvent): string {
  for (const action of event.actions) {
    const key = action.toLowerCase();
    if (ACTION_ICONS[key]) return ACTION_ICONS[key];
  }
  // Fallback based on emotion
  if (event.emotion === "excited" || event.emotion === "ecstatic") return "⚡";
  if (event.emotion === "calm" || event.emotion === "content") return "😌";
  if (event.emotion === "curious") return "🔍";
  return "🐾";
}

function shortenDescription(event: SessionEvent): string {
  const desc = event.description;
  // If description mentions duration, keep it. Otherwise create a readable summary.
  const durationSeconds = event.timestamp_end - event.timestamp_start;

  if (durationSeconds > 600) {
    const hours = Math.floor(durationSeconds / 3600);
    const minutes = Math.round((durationSeconds % 3600) / 60);
    const timeStr =
      hours > 0
        ? `${hours}h ${minutes}m`
        : `${minutes} min`;
    // Extract the core action
    const coreAction = desc.length > 60 ? desc.substring(0, 55) + "…" : desc;
    return `${coreAction} (${timeStr})`;
  }

  return desc.length > 70 ? desc.substring(0, 65) + "…" : desc;
}

function buildBehavioralInterpretation(events: SessionEvent[]): string {
  const emotions = events.map((e) => e.emotion);
  const uniqueEmotions = [...new Set(emotions)];
  const environments = [...new Set(events.map((e) => e.environment))];

  // Analyze emotional arc
  const startEmotion = emotions[0] ?? "unknown";
  const endEmotion = emotions[emotions.length - 1] ?? "unknown";

  const highEnergyCount = emotions.filter(
    (e) => e === "excited" || e === "ecstatic" || e === "territorial"
  ).length;
  const calmCount = emotions.filter(
    (e) => e === "calm" || e === "content" || e === "tired"
  ).length;

  const parts: string[] = [];

  if (highEnergyCount > 0 && calmCount > 0) {
    parts.push(
      `Session showed a mix of high-energy (${highEnergyCount} events) and calm (${calmCount} events) periods.`
    );
  } else if (highEnergyCount > calmCount) {
    parts.push("This was a high-energy session with lots of activity.");
  } else {
    parts.push("This was a calm, relaxed session overall.");
  }

  if (startEmotion !== endEmotion) {
    parts.push(
      `Emotional arc moved from "${startEmotion}" to "${endEmotion}".`
    );
  }

  if (environments.length > 1) {
    parts.push(
      `Activity spread across ${environments.length} areas: ${environments.join(", ")}.`
    );
  }

  // Look for patterns
  const hasZoomies = events.some((e) => e.actions.includes("zoomies"));
  if (hasZoomies) {
    parts.push("Classic zoomie burst detected — a sign of pent-up energy release.");
  }

  return parts.join(" ");
}

function buildSafetyNotes(events: SessionEvent[]): string {
  const concerns: string[] = [];

  for (const event of events) {
    const allText = [
      event.description,
      ...event.actions,
      event.emotion,
    ]
      .join(" ")
      .toLowerCase();

    for (const keyword of SAFETY_CONCERN_KEYWORDS) {
      if (allText.includes(keyword)) {
        concerns.push(
          `Potential concern: "${keyword}" detected at ${formatTime(event.timestamp_start)}`
        );
        break; // One concern per event
      }
    }
  }

  if (concerns.length === 0) {
    return "No concerning behaviors detected. Pet stayed within safe zones throughout the session.";
  }

  return concerns.join(". ") + ". Review footage for these moments.";
}

function computeActivityScore(events: SessionEvent[]): number {
  // Factors: event count, action diversity, emotion intensity, environmental variety
  const eventCount = events.length;
  const allActions = events.flatMap((e) => e.actions);
  const uniqueActions = new Set(allActions).size;
  const uniqueEnvironments = new Set(events.map((e) => e.environment)).size;

  const highEnergyEmotions = events.filter(
    (e) =>
      e.emotion === "excited" ||
      e.emotion === "ecstatic" ||
      e.emotion === "territorial" ||
      e.emotion === "curious"
  ).length;

  // Weighted score (0–100)
  const eventScore = Math.min(eventCount * 8, 30);       // max 30
  const actionScore = Math.min(uniqueActions * 4, 25);     // max 25
  const emotionScore = Math.min(highEnergyEmotions * 8, 25); // max 25
  const envScore = Math.min(uniqueEnvironments * 5, 20);   // max 20

  return Math.min(eventScore + actionScore + emotionScore + envScore, 100);
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

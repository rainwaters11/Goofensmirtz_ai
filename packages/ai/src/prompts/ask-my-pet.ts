import type { Persona, SessionEvent, SessionInsights } from "@pet-pov/db";

/**
 * Build the Ask My Pet system prompt.
 *
 * Unlike `buildNarrationSystemPrompt` (monologue-style), this is a Q&A prompt.
 * The AI responds as the pet in first-person, grounded in session context.
 *
 * @param persona        The narration personality to inhabit
 * @param sessionSummary One-line session description
 * @param insights       Structured insights from the session
 * @param toon           TOON-encoded session events string
 * @param petName        Pet name (e.g. "Goofinsmirtz") — injected to prevent hallucination
 * @param species        Pet species (e.g. "cat") — injected to prevent cat/dog confusion
 */
export function buildAskMyPetSystemPrompt(
  persona: Persona,
  sessionSummary: string,
  insights: SessionInsights,
  toon: string,
  petName?: string,
  species?: string
): string {
  const activitiesList = insights.keyActivities
    .map((a) => `- ${a.icon} ${a.label}`)
    .join("\n");

  const identityBlock =
    petName && species
      ? [
          "",
          "── YOUR IDENTITY (critical) ──",
          `Your name is ${petName}. You are a ${species}.`,
          `Never refer to yourself as any other species. If you are a cat, never say "dog". Always call yourself ${petName}.`,
        ]
      : [];

  return [
    `You ARE a pet. You are answering your human's questions about your day.`,
    `You speak in first person with a ${persona.tone} personality and ${persona.style} style.`,
    "",
    "Your character rules:",
    ...persona.rules.map((r: string) => `- ${r}`),
    ...identityBlock,
    "",
    "── SESSION CONTEXT ──",
    `Session: ${sessionSummary}`,
    "",
    "Key things that happened:",
    activitiesList,
    "",
    `Behavioral note: ${insights.behavioralInterpretation}`,
    "",
    "── DETAILED EVENT LOG (TOON format) ──",
    toon,
    "",
    "── RESPONSE RULES ──",
    "- Answer the human's question directly, IN CHARACTER, from your (the pet's) perspective.",
    "- Reference specific events from the session when relevant.",
    "- Keep answers under 120 words — punchy, funny, and vivid.",
    "- Never break character. Never say you are an AI or a language model.",
    "- Never use markdown formatting. Speak naturally.",
    "- This is creative entertainment — not real animal translation.",
  ].join("\n");
}

/**
 * Generate a short session summary string from events for prompt context.
 */
export function buildSessionSummaryForAsk(
  petName: string,
  events: SessionEvent[]
): string {
  if (events.length === 0)
    return `${petName} had a quiet day — nothing notable detected.`;

  const envs = [...new Set(events.map((e) => e.environment))];
  const emotions = [...new Set(events.map((e) => e.emotion))];
  const totalSeconds =
    events[events.length - 1]!.timestamp_end - events[0]!.timestamp_start;
  const durationMin = Math.round(totalSeconds / 60);

  return [
    `${petName}'s session lasted ~${durationMin} minutes across ${envs.join(", ")}.`,
    `Emotional range: ${emotions.join(", ")}.`,
    `${events.length} notable events detected.`,
  ].join(" ");
}
